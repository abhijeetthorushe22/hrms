from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import os

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection, db
from app.core.seed import seed_demo_users
from app.services.ai_service import AIService

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=settings.DESCRIPTION,
    openapi_url="/openapi.json", 
    redirect_slashes=False  
)

def _get_cors_origins() -> list:
    origins = list(settings.ALLOWED_ORIGINS)
    origins.extend([
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ])
    if settings.FRONTEND_URL:
        origins.append(settings.FRONTEND_URL.rstrip("/"))
    extra = os.getenv("ALLOWED_ORIGINS_EXTRA", "")
    if extra:
        origins.extend(origin.strip() for origin in extra.split(",") if origin.strip())
    return list(dict.fromkeys(origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
    allow_headers=[
        "*",
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods"
    ],
    expose_headers=["*"]
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.options("/{path:path}")
async def cors_preflight_handler(path: str):
    """Handle CORS preflight requests."""
    return {}

app.include_router(api_router, prefix=settings.API_STR)  
app.include_router(api_router, prefix="/api")  


async def _health_payload() -> dict:
    database_status = "disconnected"
    if db.client is not None:
        try:
            await db.client.admin.command("ping")
            database_status = "connected"
        except Exception:
            database_status = "error"

    return {
        "status": "healthy" if database_status == "connected" else "degraded",
        "version": settings.VERSION,
        "services": {
            "database": database_status,
            "api": "ready",
        },
    }


@app.get("/health")
@app.get("/api/health")
@app.get(f"{settings.API_STR}/health")
async def health_check():
    """Lightweight health check for Render and load balancers."""
    return await _health_payload()


@app.on_event("startup")
async def startup_event():
    """Initialize database connections and AI services on startup."""
    print("[*] Starting AuraHR initialization...")
    
    try:
        print("[*] Connecting to MongoDB...")
        await connect_to_mongo()
        print("[OK] MongoDB connected successfully!")
        await seed_demo_users(db.database)
        print("[OK] Demo users ready!")
    except Exception as e:
        print(f"[ERROR] Failed to connect to MongoDB: {e}")        
    
    try:
        from app.services.ai_service import ai_service
        
        if settings.INIT_AI_ON_STARTUP:
            print("[*] Scheduling AI service initialization in background task...")
            import asyncio
        
            asyncio.create_task(_initialize_ai_service(ai_service))
        else:
            print("[INFO] Skipping AI model initialization on startup (INIT_AI_ON_STARTUP=False)")
    except Exception as e:
        print(f"[WARN] Could not schedule AI initialization: {e}")
    
    print(f"[OK] {settings.PROJECT_NAME} started successfully!")
    print(f"[INFO] API Documentation: http://localhost:8000/docs")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up connections on shutdown."""
    await close_mongo_connection()
    print("[OK] AuraHR shutdown complete")


async def _initialize_ai_service(ai_service):
    """Helper coroutine to initialize AI service with internal timeout and logging."""
    try:
        import asyncio
        print("[*] AI background initializer starting...")
        await asyncio.wait_for(ai_service.initialize(), timeout=120.0)
        print("[OK] AI service initialized successfully (background)!")
    except asyncio.TimeoutError:
        print("[WARN] AI service background initialization timed out (120s). Continuing without AI features.")
    except Exception as e:
        print(f"[WARN] AI service background initialization failed: {e}")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to AuraHR - The Next-Generation AI-Powered HRMS",
        "version": settings.VERSION,
        "status": "healthy",
        "health": "/health",
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port)