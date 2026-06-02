import json
from datetime import datetime
from fastapi import Request
from app.utils.db import SessionLocal
from app.utils.mongodb import get_mongo_connection_status, get_mongo_db

async def log_audit_event(
    action: str,
    resource: str,
    details: any,
    user_id: str = None,
    req: Request = None
):
    ip_address = "Unknown"
    user_agent = "Unknown"
    
    if req is not None:
        ip_address = req.client.host if req.client else "Unknown"
        forwarded = req.headers.get("x-forwarded-for")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        user_agent = req.headers.get("user-agent", "Unknown")
        
    details_str = details if isinstance(details, str) else json.dumps(details)
    
    # 1. Write to MySQL (SQLAlchemy)
    db = SessionLocal()
    try:
        from app.models.models import AuditLog
        db_log = AuditLog(
            userId=user_id,
            action=action,
            resource=resource,
            details=details_str,
            ipAddress=ip_address,
            userAgent=user_agent,
            timestamp=datetime.utcnow()
        )
        db.add(db_log)
        db.commit()
    except Exception as e:
        print(f"Failed to log audit event in SQL: {e}")
    finally:
        db.close()
        
    # 2. Write to MongoDB (Async)
    try:
        if get_mongo_connection_status():
            mongo_db = get_mongo_db()
            if mongo_db is not None:
                mongo_details = {"raw": details} if isinstance(details, str) else details
                await mongo_db["AuditLog"].insert_one({
                    "userId": user_id,
                    "action": action,
                    "resource": resource,
                    "details": mongo_details,
                    "ipAddress": ip_address,
                    "userAgent": user_agent,
                    "timestamp": datetime.utcnow()
                })
    except Exception as e:
        print(f"Failed to log audit event in MongoDB: {e}")
