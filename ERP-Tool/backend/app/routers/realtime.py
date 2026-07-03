from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from typing import List, Set
import json
import logging
import asyncio

from app.utils.redis_client import cache_del

from app.utils.db import get_db
from app.middlewares.rbac_middleware import JWT_SECRET, JWT_ALGORITHM
from app.models.sql_models import ERPUser, ModuleAccess

router = APIRouter(prefix="/ws", tags=["realtime"])
logger = logging.getLogger(__name__)

class ActiveConnection:
    def __init__(self, ws: WebSocket, user_id: str, is_ceo: bool, allowed_modules: Set[str]):
        self.ws = ws
        self.user_id = user_id
        self.is_ceo = is_ceo
        self.allowed_modules = allowed_modules

class ConnectionManager:
    def __init__(self):
        self.active: List[ActiveConnection] = []

    async def connect(self, ws: WebSocket, user_id: str, is_ceo: bool, allowed_modules: Set[str]):
        await ws.accept()
        conn = ActiveConnection(ws, user_id, is_ceo, allowed_modules)
        self.active.append(conn)
        return conn

    def disconnect(self, conn: ActiveConnection):
        if conn in self.active:
            self.active.remove(conn)

    async def broadcast(self, event: dict, required_module: str = None):
        dead = []
        for conn in self.active:
            # Skip if user lacks the required module (CEOs bypass this)
            if required_module and not conn.is_ceo and required_module not in conn.allowed_modules:
                continue
                
            try:
                await conn.ws.send_text(json.dumps(event))
            except Exception as e:
                logger.error(f"WebSocket send failed: {e}")
                dead.append(conn)
        for conn in dead:
            self.disconnect(conn)

manager = ConnectionManager()

def trigger_dashboard_refresh():
    cache_del("dashboard:metrics:daily")
    cache_del("dashboard:metrics:weekly")
    cache_del("dashboard:metrics:monthly")
    asyncio.create_task(manager.broadcast({"type": "dashboard_refresh"}, required_module="dashboard"))

@router.websocket("/events")
async def events(ws: WebSocket, token: str = None, db: Session = Depends(get_db)):
    if not token:
        await ws.close(code=1008, reason="Missing authentication token")
        return
        
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise JWTError()
    except JWTError:
        await ws.close(code=1008, reason="Invalid authentication token")
        return
        
    user = db.query(ERPUser).filter(ERPUser.id == user_id, ERPUser.isActive == True).first()
    if not user:
        await ws.close(code=1008, reason="User account is inactive or not found")
        return
        
    allowed_modules = set()
    if not user.isCEO:
        access_records = db.query(ModuleAccess).filter(
            (ModuleAccess.roleId == user.roleId)
        ).all()
        for record in access_records:
            if record.canRead:
                allowed_modules.add(record.moduleKey)
                
    conn = await manager.connect(ws, user.id, user.isCEO, allowed_modules)
    
    try:
        while True:
            text = await conn.ws.receive_text()
            if text == "ping":
                await conn.ws.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(conn)
