"""
audit.py — Writes audit events to MySQL audit_logs table.
"""
import json
from datetime import datetime
from fastapi import Request
from app.utils.db import SessionLocal
from app.models.sql_models import AuditLog

async def log_audit_event(
    action: str,
    resource: str,
    details: any,
    user_id: str = None,
    req: Request = None
):
    ip_address = "Unknown"
    user_agent = None
    if req is not None:
        ip_address = req.client.host if req.client else "Unknown"
        forwarded = req.headers.get("x-forwarded-for")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        user_agent = req.headers.get("user-agent")

    details_val = details if isinstance(details, str) else json.dumps(details)

    db = SessionLocal()
    if db is not None:
        try:
            log_entry = AuditLog(
                userId=user_id,
                action=action,
                resource=resource,
                details=details_val,
                ipAddress=ip_address,
                userAgent=user_agent
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            # Never let audit failure break the main flow
            import logging
            logging.getLogger(__name__).error(f"Audit log write failed: {e}")
        finally:
            db.close()

    # Keep console log for observability
    import logging
    logging.getLogger(__name__).info(
        f"[AUDIT] user={user_id} action={action} resource={resource} ip={ip_address}"
    )
