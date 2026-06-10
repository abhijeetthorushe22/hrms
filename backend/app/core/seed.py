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
    """Create demo users if they do not already exist."""
    created = 0
    for user in DEMO_USERS:
        existing = await db.users.find_one({"email": user["email"]})
        if existing:
            continue

        await db.users.insert_one(
            {
                "email": user["email"],
                "password": get_password_hash(user["password"]),
                "role": user["role"],
                "employeeId": None,
                "createdAt": datetime.utcnow(),
            }
        )
        created += 1
        logger.info("Seeded demo user: %s", user["email"])

    if created:
        logger.info("Created %s demo user(s)", created)
    else:
        logger.info("Demo users already present")
