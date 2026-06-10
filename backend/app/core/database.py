from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from fastapi import HTTPException, status
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database = None

# Create global database instance
db = Database()

async def connect_to_mongo():
    """Create database connection and initialize collections."""
    try:
        db.client = AsyncIOMotorClient(
            settings.DATABASE_URL,
            serverSelectionTimeoutMS=30000,
            connectTimeoutMS=20000,
            socketTimeoutMS=20000,
            tls=True,
            tlsAllowInvalidCertificates=False,
        )
        db.database = db.client[settings.DATABASE_NAME]
        
        # Test the connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
        
        # Create indexes for better performance
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        db.client = None
        db.database = None
        raise

async def close_mongo_connection():
    """Close database connection."""
    if db.client:
        db.client.close()
        logger.info("Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for optimal performance."""
    try:
        # Users collection indexes
        await db.database.users.create_index("email", unique=True)
        await db.database.users.create_index("role")
        
        # Employees collection indexes
        await db.database.employees.create_index("department")
        await db.database.employees.create_index("managerId")
        await db.database.employees.create_index([("firstName", 1), ("lastName", 1)])
        
        # Job postings collection indexes
        await db.database.job_postings.create_index("status")
        await db.database.job_postings.create_index("department")
        await db.database.job_postings.create_index("createdAt")
        
        # Candidates collection indexes
        await db.database.candidates.create_index("jobPostingId")
        await db.database.candidates.create_index("matchScore")
        await db.database.candidates.create_index("status")
        await db.database.candidates.create_index("email")
        
        # Performance reviews collection indexes
        await db.database.performance_reviews.create_index("employeeId")
        await db.database.performance_reviews.create_index("reviewDate")
        
        # Development plans collection indexes
        await db.database.development_plans.create_index("employeeId")
        await db.database.development_plans.create_index("generatedAt")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

def get_database():
    """Get database instance."""
    if db.database is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable. Check DATABASE_URL on the server.",
        )
    return db.database