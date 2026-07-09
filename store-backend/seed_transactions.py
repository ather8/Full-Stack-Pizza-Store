"""
Seed script for the `transactions` table.

Generates ~3 months of realistic point-of-sale history for the pizza store,
built on top of the products seeded by seed_products.py.

Realism baked in:
  - Weekends (Fri/Sat/Sun) are busier than weekdays
  - Two daily rushes: lunch (~12-1pm) and dinner (~6-9pm), with Fri/Sat
    nights staying busy later (up to close)
  - A quiet mid-afternoon lull (2-5pm)
  - Holiday / event date bumps (Mother's Day, Memorial Day weekend,
    Cinco de Mayo, 4th of July weekend) - edit HOLIDAY_BOOSTS for your
    actual date range
  - Popularity weighting per product (Pepperoni sells a lot more than
    Caesar Salad, Large outsells Small, etc.)
  - Quantity per line item mostly 1, occasionally 2-4
  - Day-to-day random noise (Poisson) so no two days look identical

Adjust the import lines below to match your project layout:
    from app.database import SessionLocal, engine
    from app.models import Product, Transaction, User, Base

Run with:
    python seed_transactions.py
"""

import random
from datetime import datetime, timedelta, date, time

from database import SessionLocal, engine
from model import Product, Transaction, User, Base

Base.metadata.create_all(bind=engine)

random.seed(42)  # reproducible output; remove/change for different runs each time

# ----------------------------------------------------------------------
# CONFIG
# ----------------------------------------------------------------------

DAYS_BACK = 90                    # how far back to generate history
BASE_DAILY_TRANSACTIONS = 45      # average line-items on a normal Tuesday
STORE_OPEN_HOUR = 11
STORE_CLOSE_HOUR = 23             # last order taken at 23:xx

# Relative popularity of each product NAME (applies across all its sizes)
PRODUCT_POPULARITY = {
    "Pepperoni": 3.0,
    "Margherita": 2.2,
    "Meat Lovers": 2.5,
    "Hawaiian": 1.8,
    "BBQ Chicken": 1.8,
    "Four Cheese": 1.3,
    "Veggie Supreme": 1.2,
    "Garlic Bread": 1.6,
    "Cheesy Breadsticks": 1.5,
    "Chicken Wings": 1.7,
    "Mozzarella Sticks": 1.4,
    "Caesar Salad": 0.8,
    "Cola": 2.0,
    "Lemonade": 1.1,
    "Bottled Water": 1.0,
    "Chocolate Lava Cake": 0.9,
    "Tiramisu": 0.7,
    "Cinnamon Sticks": 0.9,
}

# Relative popularity of each SIZE label (multiplies with the name weight above)
SIZE_MULTIPLIER = {
    "Small": 0.7, "Medium": 1.3, "Large": 1.0,
    "6 pc": 1.2, "12 pc": 0.5,
    "Can": 1.3, "2L Bottle": 0.4,
    "500ml": 1.0, "Regular": 1.0, "One Size": 1.0,
}

# Day-of-week multiplier: Monday=0 ... Sunday=6
DOW_MULTIPLIER = {
    0: 0.75,  # Mon
    1: 0.78,  # Tue
    2: 0.85,  # Wed
    3: 0.95,  # Thu
    4: 1.35,  # Fri
    5: 1.55,  # Sat
    6: 1.25,  # Sun
}

# Base hourly weight for an average weekday (store hours 11:00-23:00)
HOURLY_WEIGHTS = {
    11: 0.5, 12: 1.6, 13: 1.4, 14: 0.6, 15: 0.35, 16: 0.4,
    17: 0.9, 18: 1.8, 19: 2.2, 20: 2.0, 21: 1.5, 22: 0.9, 23: 0.4,
}

# On Fri/Sat, the dinner rush stretches later into the night
WEEKEND_HOURLY_BOOST = {19: 1.1, 20: 1.2, 21: 1.5, 22: 1.8, 23: 1.6}

# Specific calendar-date multipliers layered on top of the day-of-week factor.
# Edit these to match real holidays/events within your DAYS_BACK window.
HOLIDAY_BOOSTS = {
    date(2026, 5, 5): 1.2,    # Cinco de Mayo
    date(2026, 5, 10): 1.8,   # Mother's Day
    date(2026, 5, 23): 1.4,   # Memorial Day weekend
    date(2026, 5, 24): 1.5,
    date(2026, 5, 25): 1.7,   # Memorial Day
    date(2026, 6, 6): 1.2,    # graduation-season Saturday
    date(2026, 7, 3): 1.6,    # July 4th weekend
    date(2026, 7, 4): 2.0,
    date(2026, 7, 5): 1.5,
}

# Quantity distribution for a single line item
QUANTITY_CHOICES = [1, 2, 3, 4]
QUANTITY_WEIGHTS = [70, 20, 7, 3]

# If you want transactions attributed to specific cashiers, list their user
# ids here (e.g. [1, 2, 3]). Leave empty to leave cashier_id null.
CASHIER_IDS: list[int] = []


# ----------------------------------------------------------------------
# HELPERS
# ----------------------------------------------------------------------

def build_hour_weights(day: date) -> dict[int, float]:
    """Return the hourly weight table for a given calendar day."""
    weights = dict(HOURLY_WEIGHTS)
    if day.weekday() in (4, 5):  # Fri, Sat -> late night stays busy
        for hour, boost in WEEKEND_HOURLY_BOOST.items():
            weights[hour] = weights.get(hour, 1.0) * boost
    return weights


def random_timestamp(day: date, hour_weights: dict[int, float]) -> datetime:
    hours = list(hour_weights.keys())
    weights = list(hour_weights.values())
    hour = random.choices(hours, weights=weights, k=1)[0]
    minute = random.randint(0, 59)
    second = random.randint(0, 59)
    return datetime.combine(day, time(hour, minute, second))


def day_multiplier(day: date) -> float:
    mult = DOW_MULTIPLIER[day.weekday()]
    mult *= HOLIDAY_BOOSTS.get(day, 1.0)
    return mult


def build_product_weights(products: list[Product]) -> list[float]:
    weights = []
    for p in products:
        base = PRODUCT_POPULARITY.get(p.name, 1.0)
        size_mult = SIZE_MULTIPLIER.get(p.size, 1.0)
        weights.append(base * size_mult)
    return weights


# ----------------------------------------------------------------------
# MAIN SEED LOGIC
# ----------------------------------------------------------------------

def seed(days_back: int = DAYS_BACK):
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        if not products:
            print("No products found — run seed_products.py first.")
            return

        product_weights = build_product_weights(products)

        cashier_ids = CASHIER_IDS or [row.id for row in db.query(User.id).all()]

        today = datetime.now().date()
        start_day = today - timedelta(days=days_back)

        rows = []
        total_revenue = 0.0
        day_cursor = start_day

        while day_cursor <= today:
            expected = BASE_DAILY_TRANSACTIONS * day_multiplier(day_cursor)
            # Poisson gives natural day-to-day noise around the expected value
            n_transactions = poisson_sample(expected)

            hour_weights = build_hour_weights(day_cursor)

            for _ in range(n_transactions):
                product = random.choices(products, weights=product_weights, k=1)[0]
                quantity = random.choices(QUANTITY_CHOICES, weights=QUANTITY_WEIGHTS, k=1)[0]
                price = product.price
                total = round(price * quantity, 2)
                ts = random_timestamp(day_cursor, hour_weights)

                rows.append({
                    "product_id": product.id,
                    "cashier_id": random.choice(cashier_ids) if cashier_ids else None,
                    "product_name": product.name,
                    "size": product.size,
                    "price_at_sale": price,
                    "quantity": quantity,
                    "total": total,
                    "created_at": ts,
                })
                total_revenue += total

            day_cursor += timedelta(days=1)

        db.bulk_insert_mappings(Transaction, rows)
        db.commit()

        print(f"Seed complete: {len(rows)} transactions inserted "
              f"across {days_back} days ({start_day} to {today}).")
        print(f"Total simulated revenue: ${total_revenue:,.2f}")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed, rolled back. Error: {e}")
        raise
    finally:
        db.close()


def poisson_sample(lam: float) -> int:
    """Simple Poisson sampler (Knuth's algorithm) so we don't need numpy."""
    import math
    l = math.exp(-lam)
    k = 0
    p = 1.0
    while True:
        k += 1
        p *= random.random()
        if p <= l:
            return k - 1


if __name__ == "__main__":
    seed()
