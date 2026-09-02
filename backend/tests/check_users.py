import sys
sys.path.insert(0, ".")
from sqlalchemy import text
from database import SessionLocal, engine
import models, security

db = SessionLocal()

# List all existing users
users = db.query(models.User).all()
print(f"Total users in DB: {len(users)}")
for u in users:
    print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}, Name: {u.name}, Active: {u.is_active}, PasswordHash: {u.password_hash[:20]}...")

db.close()
