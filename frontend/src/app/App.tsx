import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Square,
  ShieldCheck,
  AlertTriangle,
  Video,
  Users,
  Info,
  ArrowLeft,
} from "lucide-react";

// Ubah URL sesuai dengan alamat backend di VPS nanti
// Jika menjalankan lokal di browser, gunakan ws:// localhost atau IP server
const WS_URL = "ws://localhost:8000/ws";

type DetectionStatus = "idle" | "empty" | "safe" | "danger";

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [isDetecting, setIsDetecting] = useState(false);
  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [safeCount, setSafeCount] = useState(0);
  const [unsafeCount, setUnsafeCount] = useState(0);

  const totalCount = safeCount + unsafeCount;

  // Mendapatkan akses kamera user
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Gagal mendapatkan akses kamera:", err);
      alert("Harap izinkan akses kamera untuk mendeteksi posisi!");
    }
  };

  // Menghentikan kamera user
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Fungsi untuk mengambil frame dari video dan mengirim ke WebSocket
  const sendFrame = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!videoRef.current || !canvasRef.current || !isDetecting) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      // Mengirimkan image dalam format JPEG (kualitas 0.6) untuk efisiensi bandwidth
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
      wsRef.current.send(dataUrl);
    }
  };

  const handleStartDetection = () => {
    setIsDetecting(true);
    setStatus("empty");
    startCamera();

    // Inisialisasi WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket Connected");
      // Kirim frame pertama
      sendFrame();
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.error) {
        console.error("Server Error:", data.error);
      } else {
        const sAman = data.siswa_aman;
        const sTidakAman = data.siswa_tidak_aman;
        const sTotal = data.total;

        setSafeCount(sAman);
        setUnsafeCount(sTidakAman);

        // KEMBALI KE LOGIKA ASLI: Danger jika Unsafe > Aman
        if (sTotal === 0) {
          setStatus("empty");
        } else if (sTidakAman > sAman) {
          setStatus("danger");
        } else {
          setStatus("safe");
        }
      }

      if (isDetecting) {
        setTimeout(sendFrame, 100);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };
  };

  const handleStopDetection = () => {
    setIsDetecting(false);
    setStatus("idle");
    setSafeCount(0);
    setUnsafeCount(0);
    stopCamera();
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Fungsi untuk mengatur warna border wadah kamera saja
  const getCameraGlow = () => {
    if (!isDetecting) return "border-gray-100";
    if (status === "danger") return "border-red-500";
    return "border-emerald-400";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-200">
      <style>
        {`
          @keyframes pulsing-ambient-light-red {
            0%, 100% { filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.4)); }
            50% { filter: drop-shadow(0 0 25px rgba(239, 68, 68, 0.8)); }
          }
          @keyframes pulsing-ambient-light-emerald {
            0%, 100% { filter: drop-shadow(0 0 10px rgba(52, 211, 153, 0.4)); }
            50% { filter: drop-shadow(0 0 15px rgba(52, 211, 153, 0.7)); }
          }
          .ambient-glow-red {
            animation: pulsing-ambient-light-red 2.5s ease-in-out infinite;
          }
          .ambient-glow-emerald {
            animation: pulsing-ambient-light-emerald 3.5s ease-in-out infinite;
          }
        `}
      </style>

      {/* Header / Nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">
                Deteksi Aman Gempa
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Sistem deteksi cerdas untuk memantau posisi dan pergerakan anak
                secara real-time selama simulasi bencana.
              </p>
            </div>
          </div>

          <a href="https://app.kidversa.fun/admin/index">
            <button className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold group p-1 transition-colors duration-200">
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" />
              Kembali
            </button>
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* CAMERA SECTION (Kiri) */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            <div
              className={`relative rounded-3xl p-1.5 transition-all duration-700 bg-white border ${getCameraGlow()} ${
                status === "danger"
                  ? "ambient-glow-red shadow-red-500/10"
                  : status === "safe" || status === "empty"
                  ? "ambient-glow-emerald shadow-emerald-500/10"
                  : "shadow-sm"
              }`}
            >
              <div className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <Video className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-semibold tracking-wider">
                  LOCAL CAMERA
                </span>
              </div>

              {isDetecting && (
                <div className="absolute top-6 right-6 z-10 flex items-center gap-2 bg-red-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span className="text-white text-xs font-bold tracking-widest">
                    SYSTEM ACTIVE
                  </span>
                </div>
              )}

              {/* Video Container */}
              <div
                className={`bg-slate-900 rounded-[1.25rem] overflow-hidden aspect-video relative flex items-center justify-center border-4 ${
                  status === "danger"
                    ? "border-red-500"
                    : status === "safe" || status === "empty"
                    ? "border-emerald-500"
                    : "border-slate-300"
                }`}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover ${!isDetecting ? "hidden" : ""}`}
                />
                
                {/* Canvas Tersembunyi untuk Capture */}
                <canvas 
                  ref={canvasRef} 
                  width="640" 
                  height="480" 
                  className="hidden" 
                />

                {!isDetecting && (
                  <div className="flex flex-col items-center justify-center text-slate-500 gap-4 p-6">
                    <Video className="w-16 h-16 opacity-20" />
                    <p className="font-medium text-lg">Kamera tidak aktif</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Kontrol */}
            <div className="flex gap-4">
              <button
                onClick={handleStartDetection}
                disabled={isDetecting}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${
                  isDetecting
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1"
                }`}
              >
                <Play className="w-6 h-6" />
                MULAI DETEKSI
              </button>

              <button
                onClick={handleStopDetection}
                disabled={!isDetecting}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 ${
                  !isDetecting
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white border-2 border-red-100 text-red-500 shadow-lg hover:bg-red-50 hover:-translate-y-1"
                }`}
              >
                <Square className="w-6 h-6" />
                HENTIKAN
              </button>
            </div>
          </div>

          {/* DASHBOARD SECTION */}
          <div className="flex flex-col gap-6">
            <div
              className={`bg-white rounded-3xl p-8 shadow-xl border-t-4 transition-all duration-500 flex flex-col items-center text-center ${
                status === "danger"
                  ? "border-red-500 shadow-red-500/20"
                  : status === "safe" || status === "empty"
                  ? "border-emerald-500 shadow-emerald-500/20"
                  : "border-slate-200"
              }`}
            >
              {status === "idle" && (
                <>
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 p-4 border border-slate-200 shadow-inner">
                    <Info className="w-12 h-12 text-slate-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-700">
                    Sistem Siap
                  </h2>
                  <p className="text-slate-500 mt-2 font-medium">
                    Tekan Mulai untuk mengaktifkan AI
                  </p>
                </>
              )}

              {status === "empty" && (
                <>
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4 p-4 border border-emerald-200 shadow-inner relative">
                    <div className="absolute inset-0 bg-emerald-300 rounded-full animate-ping opacity-20"></div>
                    <ShieldCheck className="w-12 h-12 text-emerald-500 relative z-10" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-emerald-600">
                    Aman
                  </h2>
                  <p className="text-slate-600 font-bold mt-2">
                    Kamera aktif, menunggu objek...
                  </p>
                </>
              )}

              {status === "safe" && (
                <>
                  <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4 relative p-4 border border-emerald-200 shadow-inner">
                    <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-25"></div>
                    <ShieldCheck className="w-12 h-12 text-emerald-500 relative z-10" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-emerald-600">
                    Sangat Baik!
                  </h2>
                  <p className="text-slate-600 font-bold mt-2">
                    Semua anak dalam posisi aman
                  </p>
                </>
              )}

              {status === "danger" && (
                <>
                  <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4 relative p-4 border border-red-200 shadow-inner">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-30"></div>
                    <AlertTriangle className="w-12 h-12 text-red-600 relative z-10 animate-bounce" />
                  </div>
                  <h2 className="text-3xl font-black text-red-600 uppercase tracking-wide">
                    TIDAK AMAN!
                  </h2>
                  <p className="text-red-500 font-bold text-xl mt-2 bg-red-50 px-5 py-2.5 rounded-xl border border-red-200 shadow">
                    Segera Berlindung!
                  </p>
                </>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/50 flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Users className="w-5 h-5 text-blue-500" />
                Data Deteksi Saat Ini
              </h3>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-semibold text-emerald-600 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Posisi Aman
                    </span>
                    <span className="text-2xl font-black text-emerald-600">
                      {safeCount} Anak
                    </span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500 ease-out rounded-full shadow"
                      style={{
                        width:
                          totalCount > 0
                            ? `${(safeCount / totalCount) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-semibold text-red-500 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Belum Berlindung
                    </span>
                    <span className="text-2xl font-black text-red-500">
                      {unsafeCount} Anak
                    </span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500 ease-out rounded-full shadow"
                      style={{
                        width:
                          totalCount > 0
                            ? `${(unsafeCount / totalCount) * 100}%`
                            : "0%",
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-6">
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex justify-between items-center shadow-inner">
                    <span className="text-slate-500 font-medium">
                      Total Terdeteksi
                    </span>
                    <span className="text-2xl font-black text-slate-700">
                      {totalCount} Anak
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
