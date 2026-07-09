from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class Roles(Enum):
    CASHIER = "Cashier"
    MANAGER = "Manager"
    ADMIN = "Admin"


class UserBase(BaseModel):
    name: str
    email: str
    is_active: bool = True


class UserCreate(UserBase):
    password: str
    role: Optional[Roles] = Field(default=Roles.CASHIER)


class User(UserBase):
    id: int
    role: Roles
    class Config:
        from_attributes = True


class LoginReq(BaseModel):
    email: str
    password: str


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    price: float
    quantity: int
    size: str


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: int
    created_by: Optional[int] = None
    class Config:
        from_attributes = True


class TransactionBase(BaseModel):
    name: str
    price_at_sale: float
    quantity: int
    total: float


class TransactionCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, description="Must be at least 1")


class Transaction(BaseModel):
    id: int
    product_id: Optional[int]
    cashier_id: Optional[int]
    product_name: str
    size: str
    price_at_sale: float
    quantity: int
    total: float
    created_at: datetime
    class Config:
        from_attributes = True