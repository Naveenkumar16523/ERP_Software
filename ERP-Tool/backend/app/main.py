import os
from dotenv import load_dotenv

# Load environment variables before any imports that depend on them
load_dotenv()

from datetime import datetime
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Utilities
from app.utils.db import SessionLocal, test_connection, Base, engine
import app.models.sql_models          # Register core models
import app.models.finance_sql_models  # Register finance models
import app.models.hr_sql_models       # Register HR models
import app.models.payroll_sql_models
import app.models.procurement_sql_models
import app.models.crm_sql_models
import app.models.supply_chain_sql_models
import app.models.banking_sql_models
import app.models.analytics_sql_models
import app.models.marketing_sql_models
import app.models.security_sql_models
import app.models.assets_sql_models
import app.models.projects_sql_models
import app.models.automation_sql_models
import app.models.support_sql_models
from app.utils.redis_client import connect_redis, cache_get

# Routers
# from app.routers.auth import router as auth_router  # Disabled - using RBAC auth instead
from app.routers.rbac import router as rbac_router
from app.routers.rbac_auth import router as rbac_auth_router
from app.routers.admin import router as admin_router
from app.routers.analytics import router as analytics_router
from app.routers.assets import router as assets_router
from app.routers.automation import router as automation_router
from app.routers.banking import router as banking_router
from app.routers.crm import router as crm_router
from app.routers.dashboard import router as dashboard_router
from app.routers.finance import router as finance_router
from app.routers.hr import router as hr_router
from app.routers.inventory import router as inventory_router
from app.routers.marketing import router as marketing_router
from app.routers.payroll import router as payroll_router
from app.routers.procurement import router as procurement_router
from app.routers.projects import router as projects_router
from app.routers.security import router as security_router
from app.routers.supply_chain import router as supply_chain_router
from app.routers.support import router as support_router
from app.routers.search import router as search_router

load_dotenv()

import sentry_sdk
from prometheus_fastapi_instrumentator import Instrumentator

SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
        environment=os.getenv("NODE_ENV", "development")
    )

app = FastAPI(title="NexusERP Python API", version="2.0.0")

# Setup Prometheus metrics
Instrumentator().instrument(app).expose(app)

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.middlewares.rate_limit import setup_rate_limiting
import uuid
import logging

logger = logging.getLogger(__name__)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "code": "HTTP_ERROR", "message": str(exc.detail), "request_id": str(uuid.uuid4())}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": True, "code": "VALIDATION_ERROR", "message": "Invalid request parameters", "details": exc.errors(), "request_id": str(uuid.uuid4())}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    req_id = str(uuid.uuid4())
    logger.error(f"[{req_id}] Unhandled error at {request.url.path}: {exc}", exc_info=True)
    if os.getenv("NODE_ENV") == "development":
        # Safe fallback for dummy models in dev mode if needed
        return JSONResponse(status_code=500, content={"error": True, "code": "INTERNAL_ERROR", "message": str(exc), "request_id": req_id})
    return JSONResponse(
        status_code=500,
        content={"error": True, "code": "INTERNAL_ERROR", "message": "An internal server error occurred.", "request_id": req_id}
    )

# Setup Rate Limiting
setup_rate_limiting(app)

# Configure CORS origins
cors_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3001,http://localhost:3000")

# Explicit allowed origins ONLY from env
allowed_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
if "http://localhost:3001" not in allowed_origins:
    allowed_origins.append("http://localhost:3001")

cors_regex = r"https://.*\.vercel\.app|http://localhost:\d+"

logger.info(f"CORS Allowed Origins: {allowed_origins}")
logger.info(f"CORS Allow Origin Regex: {cors_regex}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=cors_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    max_age=86400,
)

import asyncio
import traceback

# Startup connections
@app.on_event("startup")
async def startup_connections():
    logger.info("Initializing application startup sequence...")

    # 1. Initialize MySQL tables (if not exists)
    try:
        if engine:
            Base.metadata.create_all(bind=engine)
            logger.info("SQL database tables created/verified successfully.")
    except Exception as e:
        logger.error(f"Failed to create SQL tables: {e}")

    # 3. Check Redis Connection
    try:
        from app.utils.redis_client import redis_client
        if redis_client and redis_client.ping():
            logger.info("Redis connected successfully.")
    except Exception as e:
        logger.warning(f"Redis not available: {e} - Application will run with graceful degradation.")

@app.on_event("shutdown")
async def shutdown_connections():
    logger.info("Shutting down application...")
    pass

# Health diagnostic endpoint
@app.get("/api/health")
async def health_check():
    db_status = "DOWN"
    redis_status = "DOWN"

    try:
        if test_connection():
            db_status = "UP"
    except Exception:
        db_status = "ERROR"


    # Redis check
    try:
        cache_get("health-check")
        redis_status = "UP"
    except Exception:
        redis_status = "ERROR"

    overall_status = "UP" if db_status == "UP" else "DEGRADED"
    status_code = status.HTTP_200_OK  # Always return 200 so the frontend doesn't crash the proxy loop

    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "version": "2.0.0",
            "environment": os.getenv("NODE_ENV", "development"),
            "services": {
                "database": db_status,
                "redis": redis_status
            }
        }
    )

# Health diagnostic endpoint (v1 path)
@app.get("/api/v1/health")
async def health_check_v1():
    return await health_check()

# Simple health check without database dependencies
@app.get("/api/v1/health/simple")
async def health_check_simple():
    return {"status": "ok"}

# Root Index
@app.get("/api/v1")
async def root_index():
    return {
        "message": "EPR Dashboard API — v2.0.0",
        "modules": ["auth", "finance", "procurement", "hr", "crm", "inventory", "manufacturing", "ecommerce", "assets"],
        "documentation": "/docs"
    }

# Mount all modules
# app.include_router(auth_router, prefix="/api/v1")  # Disabled - using RBAC auth instead
app.include_router(rbac_auth_router, prefix="/api/v1")
app.include_router(rbac_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(assets_router, prefix="/api/v1")
app.include_router(automation_router, prefix="/api/v1")
app.include_router(banking_router, prefix="/api/v1")
app.include_router(crm_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(finance_router, prefix="/api/v1")
app.include_router(hr_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(marketing_router, prefix="/api/v1")
app.include_router(payroll_router, prefix="/api/v1")
app.include_router(procurement_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(security_router, prefix="/api/v1")
app.include_router(supply_chain_router, prefix="/api/v1")
app.include_router(support_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
