# DETEKSI AMAN GEMPA

Sistem deteksi keselamatan gempa bumi berbasis webcam dan AI (YOLOv8). Frontend React + Vite, backend FastAPI + WebSocket untuk pemrosesan frame real-time.

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS 4, Radix UI, MUI |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| AI Model | YOLOv8 (Ultralytics), OpenCV |
| Komunikasi | WebSocket (real-time), REST API |

## Struktur Proyek

```
├── backend/
│   ├── main.py              # FastAPI + WebSocket endpoint
│   ├── detect_webcam.py     # Script deteksi webcam standalone
│   ├── best.pt              # Model YOLOv8
│   └── requirements.txt     # Dependensi Python
├── frontend/
│   ├── src/                 # Sumber React
│   ├── package.json         # Dependensi Node
│   └── vite.config.ts       # Konfigurasi Vite
└── .gitignore
```

## Instalasi & Menjalankan

### Backend

```bash
cd backend

# Buat virtual environment
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate

# Install dependensi
pip install -r requirements.txt

# Jalankan server (port 8000)
uvicorn main:app --reload
```

**Catatan:** File `best.pt` (model YOLOv8) harus ada di folder `backend/`.

### Frontend

```bash
cd frontend

# Install dependensi (pnpm direkomendasikan)
pnpm install

# Jalankan dev server (port 5173)
pnpm dev

# Build untuk production
pnpm build
```

Base path dikonfigurasi ke `/deteksi-aman-gempa/` di `vite.config.ts`.

### Deteksi Webcam Standalone

```bash
cd backend
python detect_webcam.py
```

Menampilkan jendela OpenCV dengan hasil deteksi langsung dari webcam.

## API Endpoints

### REST

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/` | Health check — `{"status": "online", "active_users": <int>}` |

### WebSocket

| Endpoint | Deskripsi |
|----------|-----------|
| `ws://localhost:8000/ws` | Kirim frame Base64, terima hasil deteksi |

**Request:** Kirim Base64-encoded JPEG frame sebagai string.

**Response:**

```json
{
  "siswa_aman": 3,
  "siswa_tidak_aman": 1,
  "total": 4,
  "annotated_image": "data:image/jpeg;base64,..."
}
```

Label deteksi: `aman` dan `tidak_aman`.

## Label Deteksi

| Label | Kategori |
|-------|----------|
| `aman` | Siswa dalam posisi aman |
| `tidak_aman` | Siswa dalam posisi tidak aman (perlu evakuasi) |

## Environment

Backend menunggu di `0.0.0.0:8000`. CORS diizinkan dari semua origin (`*`).
