from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.staticfiles import StaticFiles
from fastapi import File, UploadFile
import shutil
# Import your local files
import models, schemas
from database import engine, get_db
import os
from dotenv import load_dotenv
from typing import List
import os
from google import genai
import shutil
import os
from fastapi.staticfiles import StaticFiles
from fastapi import UploadFile, File
# Set up the new AI Client (Make sure your real key is here!)
client = genai.Client(api_key="AIzaSyA_u31n9R-1OfJ3_cEC4VA2KDCOjnjlzb0")



# Create all database tables on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KN Group of India API",
    description="Backend API for the e-commerce storefront",
    version="1.0.0"
)
app.mount("/static", StaticFiles(directory="static"), name="static")
from fastapi.middleware.cors import CORSMiddleware

# Define which websites are allowed to talk to your API
# While developing, we allow localhost (React/Vite/Vue)
origins = [
    "http://localhost:3000",    # Standard React
    "http://localhost:5173",    # Vite (React/Vue/Svelte)
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Allows these specific origins
    allow_credentials=True,
    allow_methods=["*"],              # Allows all methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],              # Allows all headers (including Authorization!)
)
# Create the directory if it doesn't exist
os.makedirs("static/images", exist_ok=True)

# Mount the static directory so files are accessible via URL
app.mount("/static", StaticFiles(directory="static"), name="static")

load_dotenv() # This loads the variables from the .env file

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# --- Hashing & Security Functions ---

def get_password_hash(password: str):
    # Bcrypt has a 72-character limit, so we slice it just in case.
    # We convert string to bytes, hash it, then back to string for the DB.
    pwd_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str):
    # Verify the incoming password against the stored hash
    password_byte_enc = plain_password[:72].encode('utf-8')
    hashed_password_byte_enc = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_byte_enc)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- Routes ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the KN Group of India API! The server is running."}

# --- Category Routes ---

@app.post("/categories/", response_model=schemas.Category)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")

   # --- 1. ASK THE AI FOR A QUOTE ---
    try:
        # Force the AI to be strict and only return ONE sentence without intro text
        prompt = f"Write exactly ONE short, punchy, premium e-commerce marketing tagline (under 8 words) for a category called '{category.name}'. Do not provide options. Do not include quotes."

        # --- WE CHANGED THE MODEL NAME HERE ---
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        ai_quote = response.text.strip()

    except Exception as e:
        print(f"❌ AI GENERATION FAILED: {str(e)}")
        ai_quote = f"Discover our premium collection of {category.name}."
    # --- 2. SAVE IT TO THE DATABASE ---
    db_category = models.Category(
        name=category.name,
        description=category.description,
        quote=ai_quote # Save the AI quote!
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.get("/categories/", response_model=list[schemas.Category])
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Category).offset(skip).limit(limit).all()

# --- Product Routes ---

@app.post("/products/", response_model=schemas.Product)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Locked to logged-in users
):
    db_product = db.query(models.Product).filter(models.Product.sku == product.sku).first()
    if db_product:
        raise HTTPException(status_code=400, detail="SKU already registered")

    new_product = models.Product(
        sku=product.sku,
        title=product.title,
        description=product.description,
        price=product.price,
        inventory_count=product.inventory_count,
        category_id=product.category_id
    )
    # Optional improvement for create_product in main.py
    db_category = db.query(models.Category).filter(models.Category.id == product.category_id).first()
    if not db_category:
       raise HTTPException(status_code=400, detail="Category not found. Please provide a valid category_id.")
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product
# Replace the old read_products in main.py
@app.get("/products/", response_model=list[schemas.Product])
def read_products(
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    category_id: int | None = None,
    db: Session = Depends(get_db)
):
    # 1. Start a base query
    query = db.query(models.Product)

    # 2. Filter by Category (if the user provided one)
    if category_id:
        query = query.filter(models.Product.category_id == category_id)

    # 3. Search by Title (case-insensitive search)
    if search:
        query = query.filter(models.Product.title.ilike(f"%{search}%"))

    # 4. Apply Pagination (skip and limit) and execute
    products = query.offset(skip).limit(limit).all()

    return products

@app.get("/orders/", response_model=List[schemas.OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Security: Only admins can see all orders
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")

    # Fetch all orders from the database
    orders = db.query(models.Order).order_by(models.Order.id.desc()).all()
    return orders
# --- User & Authentication Routes ---
# In main.py, find the create_user function and update the new_user part:
@app.post("/users/", response_model=schemas.UserOut)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = get_password_hash(user.password)

    # Update this part to include is_admin
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_pwd,
        is_admin=user.is_admin
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- Admin-Only Product Management ---
# main.py

@app.patch("/categories/{category_id}", response_model=schemas.Category)
def update_category(
    category_id: int,
    category_update: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user) # Security check!
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")

    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Update the name
    db_category.name = category_update.name

    # Update description if it was provided
    if category_update.description:
        db_category.description = category_update.description

    db.commit()
    db.refresh(db_category)
    return db_category

@app.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")

    category_query = db.query(models.Category).filter(models.Category.id == category_id)
    if not category_query.first():
        raise HTTPException(status_code=404, detail="Category not found")

    category_query.delete(synchronize_session=False)
    db.commit()
    return None
@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Security Check: Only admins can delete
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete items."
        )

    # 2. Find the product
    product_query = db.query(models.Product).filter(models.Product.id == product_id)
    product = product_query.first()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    # 3. Delete and save
    product_query.delete(synchronize_session=False)
    db.commit()
    return None # 204 No Content means success with no body returned

@app.patch("/products/{product_id}", response_model=schemas.Product)
def update_stock(
    product_id: int,
    new_inventory: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Security Check
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required.")

    product_query = db.query(models.Product).filter(models.Product.id == product_id)
    product = product_query.first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update only the inventory field
    product.inventory_count = new_inventory
    db.commit()
    db.refresh(product)
    return product

@app.post("/products/{product_id}/upload-image")
def upload_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 1. Admin Check
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can upload images")

    # 2. Find the product
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 3. Save the file to the 'static/images' folder
    file_location = f"static/images/{product_id}_{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4. Update the product's image_url in the database
    # In a real app, you'd use your actual domain instead of localhost
    product.image_url = f"http://127.0.0.1:8000/{file_location}"
    db.commit()
    db.refresh(product)

    return {"info": f"File '{file.filename}' uploaded successfully", "product": product}
# --- Add this to main.py ---

@app.post("/orders/")
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    total_amount = 0
    valid_items = []

    # 1. Verify products and calculate the real total
    for item in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")

        total_amount += product.price
        valid_items.append(product)

    if total_amount == 0:
        raise HTTPException(status_code=400, detail="Order must contain at least one valid item")

    # 2. Create the main Order record
    new_order = models.Order(
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        shipping_address=order_data.shipping_address,
        total_amount=total_amount
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # 3. Create the individual Order Items
    for product in valid_items:
        order_item = models.OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            price=product.price
        )
        db.add(order_item)

    db.commit()

    return {"message": "Order placed successfully!", "order_id": new_order.id}
@app.post("/products/{product_id}/image")
def upload_image(product_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Find the product
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2. Create the file path
    file_extension = file.filename.split(".")[-1]
    file_name = f"product_{product_id}.{file_extension}"
    file_location = f"static/products/{file_name}"

    # 3. Save the file to your computer
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4. Save the URL to the database
    # Since we mounted /static, the URL will be http://127.0.0.1:8000/static/products/...
    product.image_url = f"http://127.0.0.1:8000/{file_location}"
    db.commit()

    return {"info": f"file '{file_name}' saved at '{file_location}'"}
