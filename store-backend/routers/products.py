from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.orm import Session

import model
import schema
from schema import Roles
from database import get_db
from auth import require_role

router = APIRouter(tags=["products"])


@router.post("/products/", response_model=schema.Product)
def create_product(
    product: schema.ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN)),
):
    db_product = model.Product(
        name=product.name,
        description=product.description,
        category=product.category,
        price=product.price,
        quantity=product.quantity,
        size=product.size,
        created_by=current_user.id,
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/products/", response_model=List[schema.Product])
def get_products(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN, Roles.MANAGER, Roles.CASHIER)),
):
    return db.query(model.Product).all()


@router.get("/products/{product_id}", response_model=schema.Product)
def read_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN, Roles.MANAGER, Roles.CASHIER)),
):
    product = db.query(model.Product).filter(model.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/products/{product_id}", response_model=schema.Product)
def update_product(
    product_id: int,
    user: schema.ProductBase,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN, Roles.MANAGER)),
):
    db_product = db.query(model.Product).filter(model.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in user.model_dump().items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/products/{product_id}", response_model=schema.Product)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(Roles.ADMIN)),
):
    db_product = db.query(model.Product).filter(model.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return db_product