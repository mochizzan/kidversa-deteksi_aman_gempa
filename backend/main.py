from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
from ultralytics import YOLO
import json
import asyncio

app = FastAPI()

# =========================
# CORS CONFIG
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import time

# =========================
# LOAD MODEL
# =========================
# Dipastikan model di-load skali saja agar kencang
print("[SYSTEM] Loading YOLO model...")
model = YOLO("best.pt")
print("[SYSTEM] Model loaded successfully")

# =========================
# WEBSOCKET ENDPOINT
# =========================
# Counter untuk memantau beban server
active_connections = 0

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global active_connections
    client_host = "Unknown"
    
    try:
        await websocket.accept()
        active_connections += 1
        client_host = websocket.client.host
        print(f"[WS] Connected: {client_host} | Aktif: {active_connections}")
    except Exception as e:
        print(f"[WS] Connection failed during handshake: {e}")
        return

    try:
        while True:
            # 1. Terima data
            try:
                data = await websocket.receive_text()
            except WebSocketDisconnect:
                break
            except Exception:
                break
            
            start_time = time.time()
            
            try:
                # 2. Decode Base64
                if "," in data:
                    encoded = data.split(",", 1)[1]
                else:
                    encoded = data
                
                data_bytes = base64.b64decode(encoded)
                nparr = np.frombuffer(data_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is None:
                    continue

                # 3. Identifikasi AI (Thread-safe & Non-blocking)
                results = await asyncio.to_thread(model, frame, verbose=False)
                
                safe_count = 0
                unsafe_count = 0

                for r in results:
                    for box in r.boxes:
                        label = model.names[int(box.cls[0])]
                        if label == "aman":
                            safe_count += 1
                        else:
                            unsafe_count += 1

                # 4. Gambar Box & Annotate
                annotated_frame = await asyncio.to_thread(results[0].plot)
                res_ret, res_buffer = cv2.imencode('.jpg', annotated_frame)
                if not res_ret:
                    continue
                
                res_base64 = base64.b64encode(res_buffer).decode('utf-8')

                # 5. Send Back Response
                response = {
                    "siswa_aman": safe_count,
                    "siswa_tidak_aman": unsafe_count,
                    "total": safe_count + unsafe_count,
                    "annotated_image": f"data:image/jpeg;base64,{res_base64}"
                }
                
                await websocket.send_text(json.dumps(response))

            except Exception as e:
                print(f"[WS] Error Processing {client_host}: {str(e)}")

    except WebSocketDisconnect:
        pass
    finally:
        active_connections -= 1
        print(f"[WS] Disconnected: {client_host} | Sisa Aktif: {active_connections}")

@app.get("/")
def health_check():
    return {"status": "online", "active_users": active_connections}