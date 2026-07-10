from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
import logging

from database import engine, Base, get_llm_db
from schema import Roles
from auth import require_role
from ml.retrain_pipeline import run_full_retrain
from ml.llm_query import (
    classify_intent, execute_template, format_response,
    OUT_OF_SCOPE_MESSAGE, LLMQuotaExceededError, LLMUnavailableError
)
from routers import users, products, transactions

logger = logging.getLogger("uvicorn.error")

scheduler = BackgroundScheduler()


def scheduled_retrain_job():
    try:
        result = run_full_retrain()
        logger.info(f"[weekly retrain] Success: {result}")
    except Exception as e:
        logger.error(f"[weekly retrain] Failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- startup ---
    scheduler.add_job(scheduled_retrain_job, 'cron', day_of_week='sun', hour=3)
    scheduler.start()
    logger.info("Scheduler started.")

    yield  # app runs here

    # --- shutdown ---
    scheduler.shutdown()
    logger.info("Scheduler shut down.")


# Create tables
Base.metadata.create_all(bind=engine)


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://pizza-store-frontend-ruby.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Resource routers — CRUD for users/auth, products, transactions/forecast
app.include_router(users.router)
app.include_router(products.router)
app.include_router(transactions.router)


# /query stays here rather than in a router: it's not CRUD on a single
# resource, it's a cross-cutting AI feature that reads from multiple
# tables depending on what the question asks. It didn't have an obvious
# router to live in, so it's kept at the top level rather than forced
# into users/products/transactions.
class NLQuery(BaseModel):
    question: str


@app.post("/query")
def natural_language_query(
    body: NLQuery,
    db=Depends(get_llm_db),
    current_user=Depends(require_role(Roles.ADMIN, Roles.MANAGER))
):
    try:
        intent = classify_intent(body.question)
    except LLMQuotaExceededError as e:
        raise HTTPException(status_code=429, detail=str(e))
    except LLMUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))

    if intent is None:
        return {"answer": OUT_OF_SCOPE_MESSAGE}

    rows = execute_template(intent, db)
    answer = format_response(intent, rows)

    return {"answer": answer}