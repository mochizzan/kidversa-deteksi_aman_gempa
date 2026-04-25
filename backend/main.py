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

# =========================
# LOAD MODEL
# =========================
# Dipastikan model di-load skali saja agar kencang
model = YOLO("best.pt")

# =========================
# WEBSOCKET ENDPOINT
# =========================
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected to WebSocket")
    
    try:
        while True:
            # Terima data dari frontend (format: data:image/jpeg;base64,...)
            data = await websocket.receive_text()
            
            try:
                # Cleaning base64 header jika ada
                if "," in data:
                    header, encoded = data.split(",", 1)
                else:
                    encoded = data
                
                # Decode base64 ke bytes
                data_bytes = base64.b64decode(encoded)
                
                # Convert bytes ke format OpenCV img
                nparr = np.frombuffer(data_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is None:
                    await websocket.send_text(json.dumps({"error": "frame is empty"}))
                    continue

                # Run YOLO Inference (verbose=False agar log tidak penuh di VPS)
                results = model(frame, verbose=False)
                
                safe_count = 0
                unsafe_count = 0
                annotated_results = []

                # Proses hasil deteksi
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls = int(box.cls[0])
                        label = model.names[cls]
                        conf = float(box.conf[0])
                        xyxy = box.xyxy[0].tolist() # Koordinat kotak [x1, y1, x2, y2]

                        if label == "aman":
                            safe_count += 1
                        else:
                            unsafe_count += 1
                        
                        annotated_results.append({
                            "label": label,
                            "confidence": conf,
                            "box": xyxy
                        })

                # Susun data untuk dikirim balik ke frontend
                response = {
                    "siswa_aman": safe_count,
                    "siswa_tidak_aman": unsafe_count,
                    "total": safe_count + unsafe_count,
                    "detections": annotated_results
                }
                
                # Kirim data ke frontend
                await websocket.send_text(json.dumps(response))

            except Exception as e:
                print(f"Error processing frame: {str(e)}")
                await websocket.send_text(json.dumps({"error": "Failed to process frame"}))

    except WebSocketDisconnect:
        print("Client disconnected from WebSocket")
    except Exception as e:
        print(f"WebSocket Error: {str(e)}")

@app.get("/")
def health_check():
    return {"status": "online", "model": "loaded"}