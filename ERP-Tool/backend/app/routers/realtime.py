from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import logging

router = APIRouter(prefix="/ws", tags=["realtime"])
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, event: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(event))
            except Exception as e:
                logger.error(f"WebSocket send failed: {e}")
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()

@router.websocket("/events")
async def events(ws: WebSocket, token: str = None):
    # In a real app we would validate the token here.
    # For now, we accept the connection and hold it open.
    await manager.connect(ws)
    try:
        while True:
            text = await ws.receive_text()
            if text == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(ws)
