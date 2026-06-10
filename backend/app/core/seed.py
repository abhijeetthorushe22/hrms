"""Seed demo users for login page quick-access accounts."""
import logging
from datetime import datetime

from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

DEMO_USERS = [
    {"email": "admin@aurahr.com", "password": "admin123", "role": "admin"},
    {"email": "recruiter@example.com", "password": "recruiter123", "role": "recruiter"},
    {"email": "manager@example.com", "password": "manager123", "role": "manager"},
    {"email": "employee@example.com", "password": "employee123", "role": "employee"},
]


async def seed_demo_users(db) -> None:
    """Upsert demo users with fresh password hashes on every startup.

    Using upsert ensures that if the hashing scheme changes (e.g. bcrypt → argon2),
    the stored hashes are always refreshed so logins never break after a migration.
    """
    for user in DEMO_USERS:
        fresh_hash = get_password_hash(user["password"])
        await db.users.update_one(
            {"email": user["email"]},
            {
                "$set": {
                    "password": fresh_hash,
                    "role": user["role"],
                },
                "$setOnInsert": {
                    "employeeId": None,
                    "createdAt": datetime.utcnow(),
                },
            },
            upsert=True,
        )
        logger.info("Upserted demo user: %s", user["email"])

    logger.info("Demo users ready (%d users)", len(DEMO_USERS))
