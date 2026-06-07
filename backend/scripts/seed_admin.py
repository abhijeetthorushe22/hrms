"""Seed script to create a default admin user in the database."""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Load env
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_NAME = "aurahr"

async def main():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(DATABASE_URL)
    db = client[DATABASE_NAME]
    
    # Test connection
    try:
        await client.admin.command('ping')
        print("[OK] MongoDB connection successful!")
    except Exception as e:
        print(f"[FAIL] MongoDB connection failed: {e}")
        return
    
    # Check existing users
    users = await db.users.find().to_list(100)
    print(f"\nExisting users in database: {len(users)}")
    for u in users:
        print(f"  - {u['email']} (role: {u['role']})")
    
    # Create admin user if none exists
    admin_email = "admin@aurahr.com"
    existing_admin = await db.users.find_one({"email": admin_email})
    
    if existing_admin:
        print(f"\n[SKIP] Admin user '{admin_email}' already exists.")
    else:
        # Hash password using argon2 (matching the app's security.py)
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
        hashed_password = pwd_context.hash("admin123")
        
        admin_doc = {
            "email": admin_email,
            "password": hashed_password,
            "role": "admin",
            "employeeId": None,
            "createdAt": datetime.utcnow()
        }
        
        result = await db.users.insert_one(admin_doc)
        print(f"\n[OK] Admin user created successfully!")
        print(f"   Email: {admin_email}")
        print(f"   Password: admin123")
        print(f"   Role: admin")
        print(f"   ID: {result.inserted_id}")
    
    client.close()
    print("\nDone!")

if __name__ == "__main__":
    asyncio.run(main())
