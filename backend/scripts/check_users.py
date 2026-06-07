"""Check all users in DB and their password hash schemes."""
import asyncio
import os
# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_NAME = "aurahr"

async def main():
    client = AsyncIOMotorClient(DATABASE_URL)
    db = client[DATABASE_NAME]
    await client.admin.command('ping')
    print("[OK] Connected to MongoDB")

    users = await db.users.find().to_list(100)
    print(f"\nTotal users: {len(users)}\n")
    for u in users:
        email = u.get("email", "?")
        role = u.get("role", "?")
        pwd = u.get("password", "")
        if pwd.startswith("$argon2"):
            scheme = "argon2"
        elif pwd.startswith("$2b$") or pwd.startswith("$2a$"):
            scheme = "bcrypt"
        else:
            scheme = f"unknown ({pwd[:20]})"
        print(f"  {email} | role={role} | hash={scheme}")

    client.close()

asyncio.run(main())
