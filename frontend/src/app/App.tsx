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

const URL = "http://localhost:8000/";

type DetectionStatus = "idle" | "empty" | "safe" | "danger";

export default function App() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [safeCount, setSafeCount] = useState(0);
  const [unsafeCount, setUnsafeCount] = useState(0);

  const intervalId = useRef<number>(0);
  const totalCount = safeCount + unsafeCount;

  const handleStartDetection = () => {
    setIsDetecting(true);
    setStatus("empty");
  };

  const handleStopDetection = () => {
    setIsDetecting(false);
    setStatus("idle");
    setSafeCount(0);
    setUnsafeCount(0);
    if ((window as any).detectionInterval) {
      clearInterval((window as any).detectionInterval);
    }
  };

  const handleGetData = async () => {
    try {
      const res = await fetch(`${URL}cam_data`);
      const rd = await res.json();
      const camData = rd.sent_data;

      setSafeCount(camData.siswa_aman);
      setUnsafeCount(camData.siswa_tidak_aman);

      return {
        safeCount: camData.siswa_aman,
        unsafeCount: camData.siswa_tidak_aman,
      };
    } catch (error) {
      console.error(error);
      return { safeCount: 0, unsafeCount: 0 };
    }
  };

  const handleStatusSafe = (data: {
    safeCount: number;
    unsafeCount: number;
  }) => {
    const totalDetect = data.safeCount + data.unsafeCount;

    if (totalDetect === 0) {
      setStatus("empty");
    } else if (data.unsafeCount > data.safeCount) {
      setStatus("danger");
    } else {
      setStatus("safe");
    }
  };

  useEffect(() => {
    if (isDetecting) {
      const _intervalId = window.setInterval(() => {
        handleGetData().then((data) => {
          handleStatusSafe(data);
        });
      }, 500);
      intervalId.current = _intervalId;
    } else {
      clearInterval(intervalId.current);
    }

    return () => {
      clearInterval(intervalId.current);
    };
  }, [isDetecting]);

  // Fungsi untuk mengatur warna border wadah kamera saja
  const getCameraGlow = () => {
    if (!isDetecting) return "border-gray-100";
    if (status === "danger") return "border-red-500";
    return "border-emerald-400";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-blue-200">
      {/* Tambahkan Style Tag untuk Custom Ambient Light Keyframes */}
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

          {/* Tombol Kembali ke Halaman Login/Menu Utama */}
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
            {/* Ambient Light Wrapper (diperbarui untuk efek cahaya sekitar yang benar) */}
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
                  LIVE FEED
                </span>
              </div>

              {isDetecting && (
                <div className="absolute top-6 right-6 z-10 flex items-center gap-2 bg-red-500/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                  <span className="text-white text-xs font-bold tracking-widest">
                    REC
                  </span>
                </div>
              )}

              {/* Video Frame: Dibuat benar-benar static, radius diperbaiki, dan memiliki border warna static */}
              <div
                className={`bg-slate-900 rounded-[1.25rem] overflow-hidden aspect-video relative flex items-center justify-center border-4 ${
                  status === "danger"
                    ? "border-red-500"
                    : status === "safe" || status === "empty"
                    ? "border-emerald-500"
                    : "border-slate-300"
                }`}
              >
                {isDetecting ? (
                  <img
                    src={`${URL}video_feed`}
                    alt="AI Camera Feed"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 gap-4 p-6">
                    <Video className="w-16 h-16 opacity-20" />
                    <p className="font-medium text-lg">Kamera tidak aktif</p>
                  </div>
                )}

                {/* Overlay teks info jika kamera tidak aktif (statis) */}
                {!isDetecting && status === "idle" && (
                  <div className="absolute inset-x-0 bottom-4 text-center px-4">
                    <p className="text-sm text-slate-400 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full inline-block">
                      Klik Mulai untuk melihat kamera.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol Kontrol Modern */}
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

          {/* DASHBOARD SECTION (Kanan) */}
          <div className="flex flex-col gap-6">
            {/* Status Card Utama (Sangat Visual untuk Anak) */}
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
                    Tidak ada orang terdeteksi
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
                    Posisi berlindung sudah benar
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

            {/* Statistik Detail dengan Progress Bar */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/50 flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Users className="w-5 h-5 text-blue-500" />
                Data Deteksi Saat Ini
              </h3>

              <div className="space-y-6">
                {/* Safe Bar */}
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

                {/* Unsafe Bar */}
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
