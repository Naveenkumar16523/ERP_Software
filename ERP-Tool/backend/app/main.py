import os
from datetime import datetime
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Utilities
from app.utils.db import SessionLocal
from app.utils.redis_client import connect_redis, cache_get
from app.utils.mongodb import connect_mongodb, get_mongo_connection_status

# Routers
from app.routers.auth import router as auth_router
from app.routers.rbac import router as rbac_router
from app.routers.rbac_auth import router as rbac_auth_router
from app.routers.finance import router as finance_router
from app.routers.procurement import router as procurement_router
from app.routers.hr import router as hr_router
from app.routers.crm import router as crm_router
from app.routers.inventory import router as inventory_router
from app.routers.manufacturing import router as manufacturing_router
from app.routers.ecommerce import router as ecommerce_router
from app.routers.assets import router as assets_router

load_dotenv()

app = FastAPI(title="NexusERP Python API", version="2.0.0")

# Configure CORS origins
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    os.getenv("FRONTEND_ORIGIN", "")
]
allowed_origins = [origin for origin in allowed_origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    max_age=86400,
)

# Startup connections
@app.on_event("startup")
async def startup_connections():
    connect_redis()
    await connect_mongodb()

# Health diagnostic endpoint
@app.get("/api/health")
async def health_check():
    db_status = "DOWN"
    redis_status = "DOWN"
    mongo_status = "DOWN"

    # Database check
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_status = "UP"
    except Exception:
        db_status = "ERROR"
    finally:
        db.close()

    # Redis check
    try:
        cache_get("health-check")
        redis_status = "UP"
    except Exception:
        redis_status = "ERROR"

    # MongoDB check
    try:
        mongo_status = "UP" if get_mongo_connection_status() else "DOWN"
    except Exception:
        mongo_status = "ERROR"

    overall_status = "UP" if db_status == "UP" else "DEGRADED"
    status_code = status.HTTP_200_OK if overall_status == "UP" else status.HTTP_500_INTERNAL_SERVER_ERROR

    return JSONResponse(
        status_code=status_code,
        content={
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "version": "2.0.0",
            "environment": os.getenv("NODE_ENV", "development"),
            "services": {
                "database": db_status,
                "redis": redis_status,
                "mongodb": mongo_status
            }
        }
    )

# Root Index
@app.get("/api/v1")
async def root_index():
    return {
        "message": "EPR Dashboard API — v2.0.0",
        "modules": ["auth", "finance", "procurement", "hr", "crm", "inventory", "manufacturing", "ecommerce", "assets"],
        "documentation": "/docs"
    }

# Mount all modules
app.include_router(auth_router, prefix="/api/v1")
app.include_router(rbac_auth_router, prefix="/api/v1")
app.include_router(rbac_router, prefix="/api/v1")
app.include_router(finance_router, prefix="/api/v1")
app.include_router(procurement_router, prefix="/api/v1")
app.include_router(hr_router, prefix="/api/v1")
app.include_router(crm_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(manufacturing_router, prefix="/api/v1")
app.include_router(ecommerce_router, prefix="/api/v1")
app.include_router(assets_router, prefix="/api/v1")
