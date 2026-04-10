from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import threading
import cv2
from ultralytics import YOLO
import requests
import atexit

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
model = YOLO("best.pt")

# =========================
# OPEN WEBCAM
# =========================
cap = cv2.VideoCapture(0)

# =========================
# GLOBAL VARIABLES
# =========================
safe_count = 0
unsafe_count = 0
total_anak = 0

# =========================
# BACKGROUND DETECTION
# =========================
def run_detection():
    global safe_count, unsafe_count, total_anak

    while True:
        success, frame = cap.read()

        if not success:
            continue

        results = model(frame)

# =========================
# GENERATE VIDEO STREAM
# =========================
def generate_frames():
    global safe_count, unsafe_count, total_anak

    while True:
        success, frame = cap.read()

        if not success:
            break

        results = model(frame)

        safe_count = 0
        unsafe_count = 0

        for r in results:
            boxes = r.boxes

            for box in boxes:
                cls = int(box.cls[0])
                label = model.names[cls]

                if label == "aman":
                    safe_count += 1
                else:
                    unsafe_count += 1

        total_anak = safe_count + unsafe_count

        if total_anak > 0:
            kesiapsiagaan = (safe_count / total_anak) * 100
        else:
            kesiapsiagaan = 0

        annotated_frame = results[0].plot()

        # encode frame ke jpeg
        ret, buffer = cv2.imencode('.jpg', annotated_frame)
        frame = buffer.tobytes()

        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n'
        )


# =========================
# STREAM ENDPOINT
# =========================
@app.get("/video_feed")
def video_feed():
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


# =========================
# SEND DATA TO RAILS
# =========================
@app.get("/cam_data")
def cam_data():
    global safe_count, unsafe_count, total_anak

    data = {
        "siswa_aman": safe_count,
        "siswa_tidak_aman": unsafe_count,
        "total": total_anak
    }

    return {
        "status": "success",
        "sent_data": data
    }

# =========================
# START BACKGROUND THREAD
# =========================
threading.Thread(target=run_detection, daemon=True).start()

# =========================
# CLEANUP CAMERA
# =========================
def release_camera():
    if cap.isOpened():
        cap.release()
        print("Camera released")

atexit.register(release_camera)