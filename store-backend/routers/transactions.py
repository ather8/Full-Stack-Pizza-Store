from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

import model
import schema
from schema import Roles
from database import get_db
from auth import require_role
from ml.predict import forecast

router = APIRouter(tags=["transactions"])


@router.post("/transactions/", response_model=schema.Transaction)
def create_transaction(
    transaction: schema.TransactionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.CASHIER)),
):
    db_product = db.query(model.Product).filter(model.Product.id == transaction.product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    if db_product.quantity < transaction.quantity:
        raise HTTPException(status_code=400, detail="Insufficient quantity")
    setattr(db_product, "quantity", db_product.quantity - transaction.quantity)
    db_transaction = model.Transaction(
        product_id=db_product.id,
        cashier_id=current_user.id,
        product_name=db_product.name,
        quantity=transaction.quantity,
        price_at_sale=db_product.price,
        total=transaction.quantity * db_product.price,
        size=db_product.size,
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_product)
    db.refresh(db_transaction)
    return db_transaction


@router.post("/transactions/bulk", response_model=List[schema.Transaction])
def create_transactions_bulk(
    payload: schema.TransactionBulkCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.CASHIER)),
):
    """
    Commits an entire cart as one all-or-nothing operation.

    The single-item POST /transactions/ endpoint used to be called once per
    cart line from the frontend. If line 3 of 5 failed (e.g. insufficient
    stock), lines 1-2 were already committed as real sales with no way to
    undo them, and the cart wasn't cleared client-side, risking a double
    submit on retry. This endpoint validates every line before writing
    anything, so either the whole order goes through or none of it does.
    """
    # Lock the involved product rows for the duration of this transaction so
    # a concurrent checkout can't oversell the same stock between our check
    # and our write. (No-op on SQLite, which has no row-level locking, but
    # takes effect on Postgres/MySQL in production.)
    product_ids = {item.product_id for item in payload.items}
    products = (
        db.query(model.Product)
        .filter(model.Product.id.in_(product_ids))
        .with_for_update()
        .all()
    )
    products_by_id = {p.id: p for p in products}

    # Aggregate requested quantity per product first, in case the same
    # product appears on more than one cart line — otherwise two lines for
    # the same item could each pass a stock check independently and
    # together oversell it.
    requested_by_id: dict[int, int] = {}
    for item in payload.items:
        requested_by_id[item.product_id] = requested_by_id.get(item.product_id, 0) + item.quantity

    errors = []
    for product_id, requested_qty in requested_by_id.items():
        product = products_by_id.get(product_id)
        if not product:
            errors.append(f"Product {product_id} not found")
        elif product.quantity < requested_qty:
            errors.append(
                f"Insufficient quantity for {product.name}: requested {requested_qty}, have {product.quantity}"
            )

    if errors:
        # Nothing has been added to the session yet, so there's nothing to
        # roll back — just report what failed and let the whole cart stay
        # in the frontend so the cashier can adjust and retry.
        raise HTTPException(status_code=400, detail="; ".join(errors))

    db_transactions = []
    try:
        for item in payload.items:
            product = products_by_id[item.product_id]
            product.quantity -= item.quantity
            db_transaction = model.Transaction(
                product_id=product.id,
                cashier_id=current_user.id,
                product_name=product.name,
                quantity=item.quantity,
                price_at_sale=product.price,
                total=item.quantity * product.price,
                size=product.size,
            )
            db.add(db_transaction)
            db_transactions.append(db_transaction)

        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to commit order, no changes were saved")

    for t in db_transactions:
        db.refresh(t)

    return db_transactions


@router.get("/transactions/", response_model=List[schema.Transaction])
def get_transactions(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN, Roles.MANAGER)),
):
    return db.query(model.Transaction).all()


@router.get("/transactions/{transaction_id}", response_model=schema.Transaction)
def read_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN, Roles.MANAGER)),
):
    transaction = db.query(model.Transaction).filter(model.Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Product not found")
    return transaction


@router.get("/forecast/{product_id}")
def get_forecast(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN, Roles.MANAGER)),
):
    results = (
        db.query(
            func.date(model.Transaction.created_at).label("day"),
            func.sum(model.Transaction.quantity).label("total_quantity"),
        )
        .filter(model.Transaction.product_id == product_id)
        .group_by(func.date(model.Transaction.created_at))
        .order_by(func.date(model.Transaction.created_at).desc())
        .limit(14)
        .all()
    )

    results = list(reversed(results))

    # Generate the 14 calendar dates we expect, oldest to newest
    today = date.today()
    expected_dates = [today - timedelta(days=i) for i in range(14, 0, -1)]

    # Build a lookup from the query results
    sales_by_date = {row.day: row.total_quantity for row in results}

    # Fill in zeros for missing dates
    last_14_days = [sales_by_date.get(d, 0) for d in expected_dates]

    zero_days = last_14_days.count(0)
    if zero_days > 10:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient transaction history for this product. {14 - zero_days} of the last 14 days have sales data.",
        )

    product = db.query(model.Product).filter(model.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    forecast_result = forecast(product.name, last_14_days)

    if forecast_result is None:
        return {
            "product": product.name,
            "forecast": None,
            "message": "Not enough sales history to forecast this product yet.",
        }

    return {
        "product": product.name,
        "forecast": forecast_result,
    }