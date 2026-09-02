import sys
sys.path.insert(0, ".")
import bcrypt
from database import SessionLocal
import models

db = SessionLocal()
emails = [
    "admin@capstonehub.app",
    "sasikala.d@demo.capstonehub.app",
    "siva.prasanth@student.demo.capstonehub.app",
    "admin@capstone.edu",
    "siva@gmail.com"
]

test_pwds = ["Admin@123", "Faculty@123", "Student@123", "Password@123", "password", "admin", "admin123", "demo"]

for e in emails:
    u = db.query(models.User).filter(models.User.email == e).first()
    if not u:
        print(f"User {e} NOT FOUND in DB")
    else:
        print(f"User {e} (ID: {u.id}, Role: {u.role}):")
        matched = False
        for p in test_pwds:
            try:
                ok = bcrypt.checkpw(p.encode('utf-8'), u.password_hash.encode('utf-8'))
                if ok:
                    print(f"  --> MATCHED with '{p}'")
                    matched = True
            except Exception as err:
                print(f"  --> Error checking '{p}': {err}")
        if not matched:
            print(f"  --> NO match for hash: {u.password_hash}")

db.close()
