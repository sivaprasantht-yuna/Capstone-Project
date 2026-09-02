from typing import Dict, List
import json
from fastapi import WebSocket

class WebSocketConnectionManager:
    def __init__(self):
        # Map team_id -> List[WebSocket]
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, team_id: int):
        await websocket.accept()
        if team_id not in self.active_connections:
            self.active_connections[team_id] = []
        self.active_connections[team_id].append(websocket)

    def disconnect(self, websocket: WebSocket, team_id: int):
        if team_id in self.active_connections:
            if websocket in self.active_connections[team_id]:
                self.active_connections[team_id].remove(websocket)
            if len(self.active_connections[team_id]) == 0:
                del self.active_connections[team_id]

    async def broadcast_to_team(self, team_id: int, message: dict):
        if team_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[team_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    dead_connections.append(connection)
            for dead in dead_connections:
                self.disconnect(dead, team_id)

ws_manager = WebSocketConnectionManager()
