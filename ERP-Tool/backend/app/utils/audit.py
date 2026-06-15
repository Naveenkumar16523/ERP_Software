"""
audit.py — Audit log stub (database writes removed)
Logs to console only. No SQL, no MongoDB.
"""
import json
from datetime import datetime
from fastapi import Request

async def log_audit_event(
    action: str,
    resource: str,
    details: any,
    user_id: str = None,
    req: Request = None
):
    ip_address = "Unknown"
    if req is not None:
        ip_address = req.client.host if req.client else "Unknown"
        forwarded = req.headers.get("x-forwarded-for")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()

    details_str = details if isinstance(details, str) else json.dumps(details)
    print(f"[AUDIT] {datetime.utcnow().isoformat()} | user={user_id} | action={action} | resource={resource} | ip={ip_address} | {details_str}")
