import os
import logging
from google import genai
from google.genai.errors import APIError
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Template definitions — pre-written, pre-validated SQL
# Gemini never generates these, only selects which one to use
TEMPLATES = {
    "top_selling_products": {
        "description": "Top selling pizzas by quantity in a time period",
        "examples": [
            "What were our top selling pizzas last week?",
            "Which menu items sold the most last month?",
            "Best selling products in the last 30 days"
        ],
        "sql": """
            SELECT product_name, SUM(quantity) as total_units, ROUND(SUM(total)::numeric, 2) as revenue
            FROM transactions
            WHERE created_at >= NOW() - INTERVAL '{days} days'
            GROUP BY product_name
            ORDER BY total_units DESC
            LIMIT {limit}
        """,
        "params": {"days": 7, "limit": 5}
    },
    "revenue_by_product": {
        "description": "Which pizzas generated the most revenue",
        "examples": [
            "Which pizzas made us the most money last month?",
            "Revenue breakdown by product",
            "Most profitable menu items"
        ],
        "sql": """
            SELECT product_name, ROUND(SUM(total)::numeric, 2) as revenue
            FROM transactions
            WHERE created_at >= NOW() - INTERVAL '{days} days'
            GROUP BY product_name
            ORDER BY revenue DESC
        """,
        "params": {"days": 30}
    },
    "peak_hours": {
        "description": "Busiest sales hours and days",
        "examples": [
            "What are our busiest hours?",
            "When do we get the most orders?",
            "Peak sales times"
        ],
        "sql": """
            SELECT 
                EXTRACT(HOUR FROM created_at) as hour,
                COUNT(*) as num_transactions,
                SUM(quantity) as units_sold
            FROM transactions
            GROUP BY hour
            ORDER BY units_sold DESC
        """,
        "params": {}
    },
    "sales_by_size": {
        "description": "Which pizza size sells the most",
        "examples": [
            "Which size sells best?",
            "Sales breakdown by size",
            "Most popular pizza size"
        ],
        "sql": """
            SELECT size, SUM(quantity) as total_units, ROUND(SUM(total)::numeric, 2) as revenue
            FROM transactions
            GROUP BY size
            ORDER BY total_units DESC
        """,
        "params": {}
    },
    "daily_trend": {
        "description": "Daily sales trend over a time period",
        "examples": [
            "How have our sales trended over the last 30 days?",
            "Show me daily sales for the past month",
            "Sales trend this month"
        ],
        "sql": """
            SELECT DATE(created_at) as date, SUM(quantity) as units_sold, ROUND(SUM(total)::numeric, 2) as revenue
            FROM transactions
            WHERE created_at >= NOW() - INTERVAL '{days} days'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """,
        "params": {"days": 30}
    }
}


class LLMQuotaExceededError(Exception):
    """Raised when the Gemini API quota/rate limit has been exhausted."""
    pass


class LLMUnavailableError(Exception):
    """Raised for other non-quota Gemini API failures (auth, server errors, etc.)."""
    pass


def classify_intent(question: str) -> str | None:
    # Build a prompt that shows Gemini the templates and asks it to pick one
    template_descriptions = "\n".join([
        f"- {key}: {value['description']}\n  Examples: {', '.join(value['examples'])}"
        for key, value in TEMPLATES.items()
    ])

    prompt = f"""You are a restaurant analytics assistant. 
A manager asked: "{question}"

Available query templates:
{template_descriptions}

Reply with ONLY the template key that best matches the question.
If none match, reply with: none
Do not explain, do not add punctuation. Just the key."""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
    except APIError as e:
        if e.code == 429:
            logger.warning(f"Gemini quota/rate limit exceeded: {e}")
            raise LLMQuotaExceededError(
                "The AI query service has hit its usage quota. Please try again later."
            ) from e
        logger.error(f"Gemini API error ({e.code}): {e}")
        raise LLMUnavailableError(
            "The AI query service is temporarily unavailable. Please try again shortly."
        ) from e

    intent = response.text.strip().lower()

    if intent not in TEMPLATES:
        return None

    return intent


def execute_template(intent: str, db) -> list[dict]:
    template = TEMPLATES[intent]
    sql = template["sql"].format(**template["params"])
    
    result = db.execute(text(sql))
    columns = result.keys()
    rows = result.fetchall()
    
    return [dict(zip(columns, row)) for row in rows]


def format_response(intent: str, rows: list[dict]) -> str:
    if not rows:
        return "No data found for that query. This could mean there are no transactions in the relevant time period."
    
    if intent == "top_selling_products":
        lines = [f"- {r['product_name']}: {r['total_units']} units sold, ${r['revenue']} revenue" for r in rows]
        return "Here are your top selling pizzas:\n" + "\n".join(lines)
    
    elif intent == "revenue_by_product":
        lines = [f"- {r['product_name']}: ${r['revenue']}" for r in rows]
        return "Revenue breakdown by product:\n" + "\n".join(lines)
    
    elif intent == "peak_hours":
        lines = [f"- {int(r['hour']):02d}:00 — {r['units_sold']} units sold" for r in rows]
        return "Your busiest sales hours:\n" + "\n".join(lines)
    
    elif intent == "sales_by_size":
        lines = [f"- {r['size']}: {r['total_units']} units, ${r['revenue']} revenue" for r in rows]
        return "Sales breakdown by size:\n" + "\n".join(lines)
    
    elif intent == "daily_trend":
        lines = [f"- {r['date']}: {r['units_sold']} units, ${r['revenue']} revenue" for r in rows]
        return "Daily sales trend:\n" + "\n".join(lines)
    
    return "Query completed successfully."


OUT_OF_SCOPE_MESSAGE = (
    "I can't answer that with the data I have access to. "
    "Try asking me about sales performance, top selling items, "
    "revenue by product, peak hours, or daily trends."
)