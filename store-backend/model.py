from sqlalchemy import Column, Integer, Float, String, Boolean, Enum, ForeignKey, DateTime, func, UniqueConstraint
from sqlalchemy.orm import relationship
from schema import Roles
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(Roles, values_callable=lambda x: [e.value for e in x]), nullable=False)
    is_active = Column(Boolean, default=True)
    products = relationship("Product", back_populates="creator")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)
    size = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    creator = relationship("User", back_populates="products")

    __table_args__ = (UniqueConstraint('name', 'size', name='unique_product_size'),)


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    cashier_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String, nullable=False)
    size = Column(String, nullable=False)
    price_at_sale = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    total = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, default=func.now())