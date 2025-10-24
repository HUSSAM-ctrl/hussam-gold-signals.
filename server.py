from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import uvicorn
import json
from fastapi import Header
from datetime import datetime
from fastapi import HTTPException, status
from pydantic import BaseModel
import uuid

# Configuration
SECRET_PASSWORD = "ASas1234"
# Use a simple, static token for this example. In production, this should be a JWT or similar.
STATIC_TOKEN = str(uuid.uuid4())

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = set()

# Pydantic models for request bodies
class LoginRequest(BaseModel):
    password: str

class SignalPayload(BaseModel):
    instrument: str
    action: str
    entry: float
    sl: float
    tp: float
    manual: bool = True
    time: str = None

@app.websocket('/ws')
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    try:
        while True:
            await ws.receive_text()  # placeholder to keep connection alive / receive pings
    except WebSocketDisconnect:
        pass
    finally:
        if ws in clients:
            clients.remove(ws)

async def broadcast(msg: dict):
    dead = []
    for ws in list(clients):
        try:
            await ws.send_text(json.dumps(msg))
        except Exception:
            dead.append(ws)
    for d in dead:
        if d in clients:
            clients.remove(d)

@app.post('/push_signal')
async def push_signal(payload: SignalPayload):
    # payload example: {"type":"signal","payload": {...}}
    await broadcast({"type": "signal", "payload": payload.dict()})
    return {"ok": True}

@app.post('/api/loginProxy')
async def login_proxy(request: LoginRequest):
    if request.password == SECRET_PASSWORD:
        return {"token": STATIC_TOKEN}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="كلمة المرور غير صحيحة"
    )

@app.post('/api/manualProxy')
async def manual_proxy(payload: SignalPayload, x_api_key: str = Header(None)):
    if x_api_key != STATIC_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="رمز الوصول (Token) غير صالح"
        )
    
    # Add timestamp before broadcasting
    payload.time = datetime.now().isoformat()
    
    # Broadcast the signal
    await broadcast({"type": "signal", "payload": payload.dict()})
    return {"ok": True}



if __name__=='__main__':
    uvicorn.run('server:app', host='0.0.0.0', port=8000)