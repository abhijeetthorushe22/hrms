"""Seed all demo users referenced in the frontend Login page."""
import asyncio
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_NAME = "aurahr"

# Must use argon2 to match app/core/security.py
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

DEMO_USERS = [
    {"email": "admin@aurahr.com",       "password": "admin123",      "role": "admin"},
    {"email": "recruiter@example.com",  "password": "recruiter123",  "role": "recruiter"},
    {"email": "manager@example.com",    "password": "manager123",    "role": "manager"},
    {"email": "employee@example.com",   "password": "employee123",   "role": "employee"},
]


async def main():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(DATABASE_URL)
    db = client[DATABASE_NAME]

    try:
        await client.admin.command("ping")
        print("[OK] MongoDB connection successful!\n")
    except Exception as e:
        print(f"[FAIL] MongoDB connection failed: {e}")
        return

    for user in DEMO_USERS:
        existing = await db.users.find_one({"email": user["email"]})
        if existing:
            print(f"[SKIP] {user['email']} already exists (role={existing['role']})")
        else:
            hashed = pwd_context.hash(user["password"])
            doc = {
                "email": user["email"],
                "password": hashed,
                "role": user["role"],
                "employeeId": None,
                "createdAt": datetime.utcnow(),
            }
            result = await db.users.insert_one(doc)
            print(f"[OK]   Created {user['email']} (role={user['role']}, id={result.inserted_id})")

    # Summary
    print("\n--- All users in database ---")
    all_users = await db.users.find().to_list(100)
    for u in all_users:
        print(f"  {u['email']} | role={u['role']}")

    client.close()
    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
