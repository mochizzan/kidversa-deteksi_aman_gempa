from ultralytics import YOLO
import cv2

model = YOLO("best.pt")

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
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

    cv2.putText(annotated_frame, f"Aman: {safe_count}", (20,40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)

    cv2.putText(annotated_frame, f"Tidak Aman: {unsafe_count}", (20,80),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,255), 2)

    cv2.putText(annotated_frame, f"Kesiapsiagaan: {kesiapsiagaan:.1f}%", (20,120),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255,200,0), 2)

    cv2.imshow("Deteksi Gerakan Aman Gempa", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()