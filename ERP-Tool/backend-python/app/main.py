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
from app.routers.finance import router as finance_router
from app.routers.procurement import router as procurement_router
from app.routers.hr import router as hr_router
from app.routers.crm import router as crm_router
from app.routers.inventory import router as inventory_router
from app.routers.manufacturing import router as manufacturing_router
from app.routers.ecommerce import router as ecommerce_router
from app.routers.assets import router as assets_router
from app.routers.dashboard import router as dashboard_router
from app.routers.admin import router as admin_router

load_dotenv()

app = FastAPI(title="NexusERP Python API", version="2.0.0")

# ── CORS Configuration ─────────────────────────────────────────────────────────
# Reads CORS_ORIGINS and FRONTEND_ORIGIN from environment variables so that
# Render / Vercel deployments work without code changes — just set the env var.

cors_env = os.getenv("CORS_ORIGINS", "")
frontend_env = os.getenv("FRONTEND_ORIGIN", "")

# Base origins always allowed (local dev)
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3003",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Inject production origins from env vars (comma-separated)
if cors_env:
    allowed_origins.extend([o.strip() for o in cors_env.split(",") if o.strip()])
if frontend_env:
    allowed_origins.extend([o.strip() for o in frontend_env.split(",") if o.strip()])

# Deduplicate
allowed_origins = list(set(allowed_origins))

# Regex covers ALL Vercel preview URLs automatically — no code change needed
# Matches: https://erp-software-<anything>.vercel.app
allow_origin_regex = (
    r"https://erp-software(-[a-zA-Z0-9]+)*\.vercel\.app"
    r"|https://erp-software(-[a-zA-Z0-9]+)*-[a-zA-Z0-9]+-[a-zA-Z0-9]+-projects\.vercel\.app"
    r"|https?://localhost:\d+"
    r"|https?://127\.0\.0\.1:\d+"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    max_age=86400,
)

# ── Startup ────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_connections():
    from app.utils.db import engine, Base
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created/verified")
    except Exception as e:
        print(f"⚠️  DB table creation error: {e}")

    try:
        connect_redis()
        print("✅ Redis connected")
    except Exception as e:
        print(f"⚠️  Redis connection error: {e}")

    try:
        await connect_mongodb()
        print("✅ MongoDB connected")
    except Exception as e:
        print(f"⚠️  MongoDB connection error: {e}")

# ── Health Endpoints ───────────────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    from sqlalchemy import text

    db_status = "DOWN"
    redis_status = "DOWN"
    mongo_status = "DOWN"

    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_status = "UP"
    except Exception:
        db_status = "ERROR"
    finally:
        db.close()

    try:
        cache_get("health-check")
        redis_status = "UP"
    except Exception:
        redis_status = "ERROR"

    try:
        mongo_status = "UP" if get_mongo_connection_status() else "DOWN"
    except Exception:
        mongo_status = "ERROR"

    overall = "UP" if db_status == "UP" else "DEGRADED"
    code = status.HTTP_200_OK if overall == "UP" else status.HTTP_500_INTERNAL_SERVER_ERROR

    return JSONResponse(
        status_code=code,
        content={
            "status": overall,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "version": "2.0.0",
            "environment": os.getenv("NODE_ENV", "development"),
            "services": {
                "database": db_status,
                "redis": redis_status,
                "mongodb": mongo_status,
            },
        },
    )

@app.get("/api/v1/health")
async def health_check_v1():
    return await health_check()

@app.get("/api/v1/health/simple")
async def health_check_simple():
    """Lightweight liveness probe — no DB call."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"}

# ── Root ───────────────────────────────────────────────────────────────────────
@app.get("/api/v1")
async def root_index():
    return {
        "message": "NexusERP API — v2.0.0",
        "modules": [
            "auth", "finance", "procurement", "hr", "crm",
            "inventory", "manufacturing", "ecommerce", "assets",
            "dashboard", "admin",
        ],
        "documentation": "/docs",
    }

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth_router,          prefix="/api/v1")
app.include_router(admin_router,         prefix="/api/v1")
app.include_router(finance_router,       prefix="/api/v1")
app.include_router(procurement_router,   prefix="/api/v1")
app.include_router(hr_router,            prefix="/api/v1")
app.include_router(crm_router,           prefix="/api/v1")
app.include_router(inventory_router,     prefix="/api/v1")
app.include_router(manufacturing_router, prefix="/api/v1")
app.include_router(ecommerce_router,     prefix="/api/v1")
app.include_router(assets_router,        prefix="/api/v1")
app.include_router(dashboard_router,     prefix="/api/v1")
