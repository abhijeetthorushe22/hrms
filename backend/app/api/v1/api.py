from fastapi import APIRouter
from app.api.v1.endpoints import auth, jobs, employees, candidates, chat, public_chat, team, performance, documents

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["recruitment"])
api_router.include_router(employees.router, prefix="/employees", tags=["employee-development"])
api_router.include_router(candidates.router, prefix="/candidates", tags=["recruitment"])
api_router.include_router(chat.router, prefix="/chat", tags=["recruitment"])
api_router.include_router(public_chat.router, prefix="/public/chat", tags=["public-chat"])
api_router.include_router(team.router, prefix="/team", tags=["team-management"])
api_router.include_router(performance.router, prefix="/performance", tags=["performance-management"])
api_router.include_router(documents.router, prefix="/documents", tags=["document-management"])