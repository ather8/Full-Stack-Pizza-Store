from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import date, timedelta
import model, schema
from ml.predict import forecast
from schema import Roles
from database import SessionLocal, engine, Base, LLMSessionLocal
from auth import hash_password, verify_password, create_access_token, get_current_user, require_role
from ml.llm_query import classify_intent, execute_template, format_response, OUT_OF_SCOPE_MESSAGE
from contextlib import asynccontextmanager
from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from ml.retrain_pipeline import run_full_retrain
import logging

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
        "https://pizza-store-frontend-ruby.vercel.app/"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_llm_db():
    db = LLMSessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/users/", response_model=schema.User)
def create_user(user: schema.UserCreate, db: Session = Depends(get_db)):
    hashed_password = hash_password(user.password)
    db_user = model.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role = user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.get("/users/", response_model=List[schema.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(model.User).offset(skip).limit(limit).all()


@app.get("/users/{user_id}", response_model=schema.User)
def read_user(user_id: int, db: Session = Depends(get_db), current_user: str = Depends(get_current_user)):
    user = db.query(model.User).filter(model.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.put("/users/{user_id}", response_model=schema.User)
def update_user(user_id: int, user: schema.UserBase, db: Session = Depends(get_db)):
    db_user = db.query(model.User).filter(model.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in user.model_dump().items():
        setattr(db_user, key, value)
    db.commit()
    db.refresh(db_user)
    return db_user


@app.delete("/users/{user_id}", response_model=schema.User)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(model.User).filter(model.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return user


@app.post("/login/")
def login(credentials: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(model.User).filter(model.User.email == credentials.username).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(credentials.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {"access_token": create_access_token({"sub":credentials.username}), "token_type": "bearer"}


@app.post("/products/", response_model=schema.Product)
def create_product(product: schema.ProductCreate, db: Session = Depends(get_db), current_user = Depends(require_role(Roles.ADMIN))):
    db_product = model.Product(
        name=product.name,
        price=product.price,
        quantity=product.quantity,
        created_by = current_user.id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@app.get("/products/", response_model=List[schema.Product])
def get_products(db: Session = Depends(get_db), current_user = Depends(require_role(Roles.ADMIN, Roles.MANAGER, Roles.CASHIER))):
    return db.query(model.Product).all()


@app.get("/products/{product_id}", response_model=schema.Product)
def read_product(product_id: int, db: Session = Depends(get_db), current_user = Depends(require_role(Roles.ADMIN, Roles.MANAGER, Roles.CASHIER))):
    product = db.query(model.Product).filter(model.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.put("/products/{product_id}", response_model=schema.Product)
def update_product(product_id: int, user: schema.ProductBase, db: Session = Depends(get_db), current_user = Depends(require_role(Roles.ADMIN, Roles.MANAGER))):
    db_product = db.query(model.Product).filter(model.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in user.model_dump().items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product


@app.delete("/products/{product_id}", response_model=schema.Product)
def delete_product(product_id: int, db: Session = Depends(get_db), current_user = Depends(require_role(Roles.ADMIN))):
    db_product = db.query(model.Product).filter(model.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return db_product


@app.post("/transactions/", response_model=schema.Transaction)
def create_transaction(transaction: schema.TransactionCreate, db: Session = Depends(get_db), current_user = Depends(require_role(Roles.CASHIER))):
    db_product = db.query(model.Product).filter(model.Product.id == transaction.product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    if(db_product.quantity < transaction.quantity):
        raise HTTPException(status_code=400, detail="Insufficient quantity")
    setattr(db_product, "quantity", db_product.quantity - transaction.quantity)
    db_transaction = model.Transaction(
        product_id = db_product.id,
        cashier_id = current_user.id,
        product_name=db_product.name,
        quantity=transaction.quantity,
        price_at_sale = db_product.price,
        total = transaction.quantity * db_product.price,
        size = db_product.size
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_product)
    db.refresh(db_transaction)
    return db_transaction


@app.get("/transactions/", response_model=List[schema.Transaction])
def get_transactions(db: Session = Depends(get_db), current_user = Depends(require_role(Roles.ADMIN, Roles.MANAGER))):
    return db.query(model.Transaction).all()


@app.get("/transactions/{transaction_id}", response_model=schema.Transaction)
def read_transaction(transaction_id: int, db: Session = Depends(get_db), current_user = Depends(require_role(Roles.ADMIN, Roles.MANAGER))):
    transaction = db.query(model.Transaction).filter(model.Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Product not found")
    return transaction


@app.get("/forecast/{product_id}")
def get_forecast(product_id: int, db: Session = Depends(get_db), current_user = Depends(require_role(Roles.ADMIN, Roles.MANAGER))):
    results = db.query(
    func.date(model.Transaction.created_at).label('day'),
    func.sum(model.Transaction.quantity).label('total_quantity')
    ).filter(
        model.Transaction.product_id == product_id
    ).group_by(
        func.date(model.Transaction.created_at)
    ).order_by(
        func.date(model.Transaction.created_at).desc()
    ).limit(14).all()

    results = list(reversed(results))

    # Generate the 14 calendar dates we expect, oldest to newest
    today = date.today()
    expected_dates = [today - timedelta(days=i) for i in range(14, 0, -1)]

    # Build a lookup from your query results
    sales_by_date = {row.day: row.total_quantity for row in results}

    # Fill in zeros for missing dates
    last_14_days = [sales_by_date.get(d, 0) for d in expected_dates]

    zero_days = last_14_days.count(0)
    if zero_days > 10:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient transaction history for this product. {14 - zero_days} of the last 14 days have sales data."
        )

    
    product = db.query(model.Product).filter(model.Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    

    forecast_result = forecast(product.name, last_14_days)

    if forecast_result is None:
        return {
            "product": product.name,
            "forecast": None,
            "message": "Not enough sales history to forecast this product yet."
        }

    return {
        "product": product.name,
        "forecast": forecast_result
    }


class NLQuery(BaseModel):
    question: str

@app.post("/query/")
def natural_language_query(
    body: NLQuery,
    db=Depends(get_llm_db),
    current_user=Depends(require_role(Roles.ADMIN, Roles.MANAGER))
):
    intent = classify_intent(body.question)
    
    if intent is None:
        return {"answer": OUT_OF_SCOPE_MESSAGE}
    
    rows = execute_template(intent, db)
    answer = format_response(intent, rows)
    
    return {"answer": answer}


@app.get("/me/", response_model=schema.User)
def get_current_user_profile(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(model.User).filter(model.User.email == current_user).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user