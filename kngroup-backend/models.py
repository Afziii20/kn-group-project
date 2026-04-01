from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_admin = Column(Boolean, default=False)

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, index=True)
    quote = Column(String, default="Elevate your everyday living.") # <-- ADD THIS LINE

    products = relationship("Product", back_populates="category")
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    price = Column(Float)
    inventory_count = Column(Integer, default=0)
    category_id = Column(Integer, ForeignKey("categories.id"))
    image_url = Column(String, nullable=True) # <-- Add this line

    # Establish relationship with category
    category = relationship("Category", back_populates="products")
# --- Add to the bottom of models.py ---

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    shipping_address = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="Pending") # Pending, Shipped, Delivered

    # Link to the items in this order
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    price = Column(Float) # We save the price here in case the product price changes later!

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
