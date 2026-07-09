"""
Seed script for the `products` table.

Adjust the two import lines below to match your project layout:
    from app.database import SessionLocal, engine   # your DB session/engine
    from app.models import Product, Base             # your SQLAlchemy models

Run with:
    python seed_products.py
"""

from database import SessionLocal, engine
from model import Product, Base

# Make sure tables exist (no-op if they already do)
Base.metadata.create_all(bind=engine)

PRODUCTS = [
    # --- Classic Pizzas ---
    {"name": "Margherita", "description": "Tomato sauce, fresh mozzarella, basil", "category": "Pizza", "price": 9.99, "quantity": 50, "size": "Small"},
    {"name": "Margherita", "description": "Tomato sauce, fresh mozzarella, basil", "category": "Pizza", "price": 13.99, "quantity": 50, "size": "Medium"},
    {"name": "Margherita", "description": "Tomato sauce, fresh mozzarella, basil", "category": "Pizza", "price": 17.99, "quantity": 40, "size": "Large"},
    {"name": "Pepperoni", "description": "Tomato sauce, mozzarella, classic pepperoni", "category": "Pizza", "price": 10.99, "quantity": 60, "size": "Small"},
    {"name": "Pepperoni", "description": "Tomato sauce, mozzarella, classic pepperoni", "category": "Pizza", "price": 14.99, "quantity": 60, "size": "Medium"},
    {"name": "Pepperoni", "description": "Tomato sauce, mozzarella, classic pepperoni", "category": "Pizza", "price": 18.99, "quantity": 50, "size": "Large"},
    {"name": "Hawaiian", "description": "Tomato sauce, mozzarella, ham, pineapple", "category": "Pizza", "price": 11.99, "quantity": 35, "size": "Small"},
    {"name": "Hawaiian", "description": "Tomato sauce, mozzarella, ham, pineapple", "category": "Pizza", "price": 15.99, "quantity": 35, "size": "Medium"},
    {"name": "Hawaiian", "description": "Tomato sauce, mozzarella, ham, pineapple", "category": "Pizza", "price": 19.99, "quantity": 30, "size": "Large"},

    # --- Specialty Pizzas ---
    {"name": "Four Cheese", "description": "Mozzarella, gorgonzola, parmesan, provolone", "category": "Pizza", "price": 12.99, "quantity": 30, "size": "Medium"},
    {"name": "Four Cheese", "description": "Mozzarella, gorgonzola, parmesan, provolone", "category": "Pizza", "price": 16.99, "quantity": 25, "size": "Large"},
    {"name": "BBQ Chicken", "description": "BBQ sauce, grilled chicken, red onion, mozzarella", "category": "Pizza", "price": 13.99, "quantity": 30, "size": "Medium"},
    {"name": "BBQ Chicken", "description": "BBQ sauce, grilled chicken, red onion, mozzarella", "category": "Pizza", "price": 17.99, "quantity": 28, "size": "Large"},
    {"name": "Veggie Supreme", "description": "Bell peppers, mushrooms, onions, olives, tomato", "category": "Pizza", "price": 11.99, "quantity": 30, "size": "Medium"},
    {"name": "Veggie Supreme", "description": "Bell peppers, mushrooms, onions, olives, tomato", "category": "Pizza", "price": 15.99, "quantity": 28, "size": "Large"},
    {"name": "Meat Lovers", "description": "Pepperoni, sausage, bacon, ham, ground beef", "category": "Pizza", "price": 14.99, "quantity": 30, "size": "Medium"},
    {"name": "Meat Lovers", "description": "Pepperoni, sausage, bacon, ham, ground beef", "category": "Pizza", "price": 18.99, "quantity": 28, "size": "Large"},

    # --- Sides ---
    {"name": "Garlic Bread", "description": "Toasted baguette with garlic butter", "category": "Sides", "price": 5.99, "quantity": 80, "size": "Regular"},
    {"name": "Cheesy Breadsticks", "description": "Baked breadsticks topped with mozzarella", "category": "Sides", "price": 6.99, "quantity": 70, "size": "Regular"},
    {"name": "Chicken Wings", "description": "Oven-baked wings, choice of sauce", "category": "Sides", "price": 8.99, "quantity": 50, "size": "6 pc"},
    {"name": "Chicken Wings", "description": "Oven-baked wings, choice of sauce", "category": "Sides", "price": 14.99, "quantity": 40, "size": "12 pc"},
    {"name": "Mozzarella Sticks", "description": "Breaded and fried, served with marinara", "category": "Sides", "price": 6.99, "quantity": 60, "size": "6 pc"},
    {"name": "Caesar Salad", "description": "Romaine, parmesan, croutons, caesar dressing", "category": "Sides", "price": 7.99, "quantity": 45, "size": "Regular"},

    # --- Beverages ---
    {"name": "Cola", "description": "Chilled soft drink", "category": "Beverages", "price": 2.49, "quantity": 200, "size": "Can"},
    {"name": "Cola", "description": "Chilled soft drink", "category": "Beverages", "price": 4.49, "quantity": 100, "size": "2L Bottle"},
    {"name": "Lemonade", "description": "Freshly squeezed lemonade", "category": "Beverages", "price": 3.49, "quantity": 90, "size": "Regular"},
    {"name": "Bottled Water", "description": "Still water", "category": "Beverages", "price": 1.99, "quantity": 150, "size": "500ml"},

    # --- Desserts ---
    {"name": "Chocolate Lava Cake", "description": "Warm cake with a molten chocolate center", "category": "Desserts", "price": 6.99, "quantity": 40, "size": "Regular"},
    {"name": "Tiramisu", "description": "Classic Italian coffee-flavored dessert", "category": "Desserts", "price": 6.49, "quantity": 35, "size": "Regular"},
    {"name": "Cinnamon Sticks", "description": "Sweet dough sticks with cinnamon sugar and icing", "category": "Desserts", "price": 5.99, "quantity": 45, "size": "Regular"},
]


def seed(created_by: int | None = None):
    db = SessionLocal()
    try:
        inserted, skipped = 0, 0
        for item in PRODUCTS:
            exists = (
                db.query(Product)
                .filter(Product.name == item["name"], Product.size == item["size"])
                .first()
            )
            if exists:
                skipped += 1
                continue

            db.add(Product(**item, created_by=created_by))
            inserted += 1

        db.commit()
        print(f"Seed complete: {inserted} inserted, {skipped} skipped (already existed).")
    except Exception as e:
        db.rollback()
        print(f"Seeding failed, rolled back. Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    # Pass a user id here if you want products attributed to a specific creator,
    # e.g. seed(created_by=1). Leave as None to leave created_by null.
    seed(created_by=None)
