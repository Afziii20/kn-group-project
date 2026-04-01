from pydantic import BaseModel
from typing import Optional, List, Union
# Base schema for shared properties
# --- CATEGORY SCHEMAS ---

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    quote: Optional[str] = None   # <-- Using Optional here prevents the crash!

    class Config:
        from_attributes = True
# Add these lines to the bottom of schemas.py

class ProductBase(BaseModel):
    sku: str
    title: str
    description: str
    price: float
    inventory_count: int = 0
    category_id: int
    image_url: str | None = None # <-- Add this line

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True
# In schemas.py
class UserCreate(BaseModel):
    email: str
    password: str
    is_admin: bool = False  # Add this! Default is still false.

class UserOut(BaseModel):
    id: int
    email: str
    is_admin: bool

    class Config:
        from_attributes = True
# Add to the bottom of schemas.py
class Token(BaseModel):
    access_token: str
    token_type: str

# --- Add to the bottom of schemas.py ---

# --- ORDER SCHEMAS (Make sure these are at the bottom!) ---

class OrderItemCreate(BaseModel):
    product_id: int

class OrderCreate(BaseModel):
    customer_name: str
    customer_email: str
    shipping_address: str
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    price: float

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_email: str
    shipping_address: str
    total_amount: float
    status: str
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True
