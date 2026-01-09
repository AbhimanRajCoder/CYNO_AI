"""
CYNO Healthcare - FastAPI Backend
Main application entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import connect_db, disconnect_db
from routers.auth import router as auth_router
from routers.reports import router as reports_router
from routers.patients import router as patients_router
from routers.ai_reports import router as ai_reports_router
from routers.tumor_board import router as tumor_board_router
from routers.activity import router as activity_router
from routers.ai_report_analysis import router as ai_report_analysis_router
from routers.tumor_board_ai import router as tumor_board_ai_router
from routers.demo import router as demo_router
from routers.check_azure_document import router as azure_check_router
from routers.azure_demo import router as azure_demo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - connect/disconnect database"""
    await connect_db()
    yield
    await disconnect_db()


# Initialize FastAPI app
app = FastAPI(
    title="CYNO Healthcare API",
    description="Backend API for CYNO Healthcare Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration using centralized settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(patients_router)
app.include_router(ai_reports_router)
app.include_router(tumor_board_router)
app.include_router(activity_router)
app.include_router(ai_report_analysis_router)
app.include_router(tumor_board_ai_router)
app.include_router(demo_router)
app.include_router(azure_check_router)
app.include_router(azure_demo_router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "message": "CYNO Healthcare API is running"}


@app.get("/api/health")
async def health_check():
    """API health check"""
    return {"status": "ok"}
