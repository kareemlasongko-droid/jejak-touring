"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CarFront, Check, CheckCircle2, Clock3, Flag, Gauge, KeyRound, LocateFixed, MapPin, Navigation, RefreshCw, Satellite, ShieldAlert, Square, WifiOff } from "lucide-react";
import { ensureAnonymousSession, supabase } from "@/lib/supabase";
import type { LocationPoint, Trip } from "@/lib/types";
import { createAccessCode, distanceInMeters, formatTime, relativeTime } from "@/lib/utils";
import { ShareCode } from "@/components/ShareCode";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => <div className="loading-screen"><div><span className="spinner" />Memuat peta...</div></div>,
});

type CurrentPosition = { lat: number; lng: number; speed: number | null; accuracy: number | null; recordedAt: string };
type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener: (type: string, listener: () => void) => void };

export function TrackingClient({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [current, setCurrent] = useState<CurrentPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Minta izin lokasi agar perjalanan dapat dibagikan.");
  const [queueCount, setQueueCount] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);
  const [dialog, setDialog] = useState<"sos" | "finish" | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const queue = useRef<LocationPoint[]>([]);
  const sending = useRef(false);
  const lastQueued = useRef(0);
  const arrived = useRef(false);
  const wakeLock = useRef<WakeLockSentinelLike | null>(null);

  const queueKey = `jejaktouring:queue:${tripId}`;

  const saveQueue = useCallback(() => {
    localStorage.setItem(queueKey, JSON.stringify(queue.current));
    setQueueCount(queue.current.length);
  }, [queueKey]);

  const flushQueue = useCallback(async () => {
    if (sending.current || !navigator.onLine || queue.current.length === 0) return;
    sending.current = true;
    try {
      while (queue.current.length > 0 && navigator.onLine) {
        const point = queue.current[0];
        const { error: insertError } = await supabase.from("locations").insert(point);
        if (insertError) throw insertError;
        queue.current.shift();
        saveQueue();
      }
      if (queue.current.length === 0) setError("");
    } catch {
      setNotice("Sinyal bermasalah. Lokasi disimpan dan akan dikirim ulang otomatis.");
    } finally {
      sending.current = false;
    }
  }, [saveQueue]);

  useEffect(() => {
    let active = true;
    async function loadTrip() {
      try {
        await ensureAnonymousSession();
        const { data, error: loadError } = await supabase.from("trips").select("*").eq("id", tripId).single();
        if (loadError) throw loadError;
        if (!active) return;
        setTrip(data as Trip);
        arrived.current = data.status !== "aktif";
        try {
          queue.current = JSON.parse(localStorage.getItem(queueKey) || "[]") as LocationPoint[];
          setQueueCount(queue.current.length);
        } catch { queue.current = []; }
        const { data: latest } = await supabase.from("locations").select("lat,lng,speed,accuracy,recorded_at").eq("trip_id", tripId).order("recorded_at", { ascending: false }).limit(1).maybeSingle();
        if (latest && active) setCurrent({ lat: latest.lat, lng: latest.lng, speed: latest.speed, accuracy: latest.accuracy, recordedAt: latest.recorded_at });
        setNotice(data.status === "aktif" ? "GPS aktif. Biarkan halaman ini terbuka selama perjalanan." : "Perjalanan tidak lagi aktif.");
      } catch {
        if (active) setError("Perjalanan tidak ditemukan atau tidak dapat dibuka dari browser ini. Perjalanan hanya dapat dikendalikan dari HP yang membuatnya.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTrip();
    return () => { active = false; };
  }, [tripId, queueKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!trip || trip.status !== "aktif") return;
    let watchId: number | null = null;
    let cancelled = false;

    async function requestWakeLock() {
      try {
        const nav = navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> } };
        if (nav.wakeLock && document.visibilityState === "visible") {
          wakeLock.current = await nav.wakeLock.request("screen");
          wakeLock.current.addEventListener("release", () => { wakeLock.current = null; });
        }
      } catch { setNotice("Layar mungkin tetap terkunci. Atur layar agar menyala selama perjalanan."); }
    }

    async function handlePosition(position: GeolocationPosition) {
      if (cancelled || !trip || arrived.current) return;
      const point: LocationPoint = {
        trip_id: trip.id,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        speed: position.coords.speed,
        heading: position.coords.heading,
        accuracy: position.coords.accuracy,
        recorded_at: new Date(position.timestamp).toISOString(),
      };
      setCurrent({ lat: point.lat, lng: point.lng, speed: point.speed, accuracy: point.accuracy, recordedAt: point.recorded_at });
      setNotice("GPS aktif. Biarkan halaman ini terbuka selama perjalanan.");
      const now = Date.now();
      if (now - lastQueued.current >= 5000 || queue.current.length === 0) {
        queue.current.push(point);
        if (queue.current.length > 500) queue.current = queue.current.slice(-500);
        lastQueued.current = now;
        saveQueue();
      }
      const distance = distanceInMeters(point.lat, point.lng, trip.destination_lat, trip.destination_lng);
      if (distance <= 200 && !arrived.current) {
        arrived.current = true;
        await flushQueue();
        const { error: arrivalError } = await supabase.from("trips").update({ status: "tiba", arrived_at: new Date().toISOString() }).eq("id", trip.id);
        if (!arrivalError) {
          setTrip((old) => old ? { ...old, status: "tiba", arrived_at: new Date().toISOString() } : old);
          localStorage.removeItem("jejaktouring:activeTrip");
        }
      } else {
        void flushQueue();
      }
    }

    if (!navigator.geolocation) {
      setError("GPS tidak tersedia di browser ini. Gunakan browser HP modern dan izinkan akses lokasi.");
    } else {
      watchId = navigator.geolocation.watchPosition(handlePosition, (geoError) => {
        if (geoError.code === geoError.PERMISSION_DENIED) setError("Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser.");
        else setNotice("GPS belum mendapatkan posisi. Pastikan sinyal lokasi HP aktif.");
      }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    }

    function visibilityChanged() {
      if (document.visibilityState === "visible") {
        setNotice("Halaman aktif kembali. Periksa bahwa GPS dan koneksi internet berjalan.");
        void requestWakeLock();
        void flushQueue();
      }
    }
    function online() { void flushQueue(); }
    function beforeUnload(event: BeforeUnloadEvent) { event.preventDefault(); }
    requestWakeLock();
    document.addEventListener("visibilitychange", visibilityChanged);
    window.addEventListener("online", online);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      cancelled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("online", online);
      window.removeEventListener("beforeunload", beforeUnload);
      void wakeLock.current?.release();
      wakeLock.current = null;
    };
  }, [trip?.id, trip?.status, flushQueue, saveQueue]);

  async function sendSos() {
    if (!trip) return;
    setActionBusy(true);
    const sosAt = new Date().toISOString();
    const { error: sosError } = await supabase.from("trips").update({ sos_at: sosAt }).eq("id", trip.id);
    if (sosError) setError("SOS belum terkirim. Periksa koneksi dan coba lagi.");
    else { setTrip({ ...trip, sos_at: sosAt }); setDialog(null); setNotice("SOS aktif. Segera hubungi komunitas melalui saluran komunikasi lain."); }
    setActionBusy(false);
  }

  async function finishTrip() {
    if (!trip) return;
    setActionBusy(true);
    const endedAt = new Date().toISOString();
    const { error: finishError } = await supabase.from("trips").update({ status: "selesai", ended_at: endedAt }).eq("id", trip.id);
    if (finishError) setError("Perjalanan belum dapat dihentikan. Periksa koneksi dan coba lagi.");
    else {
      setTrip({ ...trip, status: "selesai", ended_at: endedAt });
      localStorage.removeItem("jejaktouring:activeTrip");
      setDialog(null);
    }
    setActionBusy(false);
  }

  async function regenerateCode() {
    if (!trip) return;
    setActionBusy(true);
    const { data, error: codeError } = await supabase.from("trips").update({ access_code: createAccessCode() }).eq("id", trip.id).select("access_code").single();
    if (codeError) setError("Kode baru belum berhasil dibuat. Coba lagi.");
    else setTrip({ ...trip, access_code: data.access_code });
    setActionBusy(false);
  }

  if (loading) return <div className="loading-screen"><div><span className="spinner" />Membuka perjalanan...</div></div>;
  if (!trip) return <section className="empty-state"><div className="monitor-entry-icon"><AlertTriangle size={30} /></div><h1>Perjalanan tidak dapat dibuka</h1><p>{error}</p><Link href="/" className="button button-primary"><ArrowLeft size={18} /> Kembali ke beranda</Link></section>;

  const isActive = trip.status === "aktif";
  const isStale = isActive && current && Date.now() - new Date(current.recordedAt).getTime() > 180000;
  void tick;

  return (
    <div className="tracking-page">
      {error && <div className="error-box" role="alert">{error}</div>}
      <div className="tracking-head"><div><h1>{trip.nickname}</h1><p><MapPin size={12} /> Menuju {trip.destination_name}</p></div><span className={`status-badge ${isActive ? isStale ? "status-warning" : "status-active" : "status-ended"}`}>{isActive && !isStale && <i className="live-dot" />}{isActive ? isStale ? "Data lama" : "Perjalanan aktif" : trip.status === "tiba" ? "Sudah tiba" : "Perjalanan selesai"}</span></div>

      {!isActive ? (
        <section className="panel arrived-card"><div className="arrived-icon">{trip.status === "tiba" ? <Flag size={30} /> : <CheckCircle2 size={30} />}</div><h2>{trip.status === "tiba" ? "Anda sudah tiba di tujuan" : "Perjalanan telah dihentikan"}</h2><p>{trip.status === "tiba" ? "Posisi Anda berada dalam radius 200 meter dari tujuan. Pelacakan dan kode pantau sudah dihentikan otomatis." : "Pelacakan dan kode pantau sudah tidak aktif. Terima kasih telah menggunakan JejakTouring."}</p><Link href="/" className="button button-primary"><Check size={18} /> Kembali ke beranda</Link></section>
      ) : (
        <div className="tracking-grid">
          <section className="panel tracking-map-panel"><div className="map-wrap tracking-map"><LiveMap latitude={current?.lat ?? null} longitude={current?.lng ?? null} destinationLat={trip.destination_lat} destinationLng={trip.destination_lng} nickname={trip.nickname} /><div className="map-status-strip"><div className="map-status-chip"><Satellite size={14} />{current ? `GPS ±${Math.round(current.accuracy ?? 0)} m` : "Menunggu GPS..."}</div><div className="map-status-chip"><CarFront size={14} /> Mobil</div></div></div></section>
          <aside className="tracking-side">
            <section className="panel trip-stats"><div className="stat"><Gauge className="stat-icon" size={20} /><small>KECEPATAN</small><strong>{current?.speed != null && current.speed >= 0 ? Math.round(current.speed * 3.6) : "—"} <span>km/j</span></strong></div><div className="stat"><Clock3 className="stat-icon" size={20} /><small>TERAKHIR TERLIHAT</small><strong style={{ fontSize: 14 }}>{current ? relativeTime(current.recordedAt) : "Menunggu GPS"}</strong></div></section>
            <ShareCode code={trip.access_code} compact />
            <section className="panel tracking-actions"><button className={`button sos-button ${trip.sos_at ? "sos-active" : ""}`} onClick={() => setDialog("sos")} disabled={Boolean(trip.sos_at)}><ShieldAlert size={21} />{trip.sos_at ? "SOS sedang aktif" : "Kirim tanda SOS"}</button><button className="button button-secondary small-action" onClick={() => setCodeOpen(true)}><KeyRound size={17} /> Kode baru</button><button className="button button-secondary small-action finish-button" onClick={() => setDialog("finish")}><Square size={16} /> Selesai touring</button></section>
            <div className={`last-update ${queueCount ? "queue-note" : ""}`}>{queueCount ? <WifiOff size={14} /> : <LocateFixed size={14} />}<span>{queueCount ? `${queueCount} titik menunggu dikirim` : notice}</span></div>
          </aside>
        </div>
      )}

      <ConfirmDialog open={dialog === "sos"} title="Aktifkan tanda SOS?" description="Pemegang kode pantau akan melihat peringatan SOS dan waktu pengirimannya. JejakTouring tidak menghubungi layanan darurat. Jika memungkinkan, hubungi komunitas atau layanan darurat secara langsung." confirmLabel="Ya, aktifkan SOS" danger busy={actionBusy} onClose={() => setDialog(null)} onConfirm={sendSos} />
      <ConfirmDialog open={dialog === "finish"} title="Selesaikan perjalanan?" description="GPS akan berhenti dan seluruh kode pantau tidak dapat digunakan lagi. Tindakan ini tidak dapat dibatalkan." confirmLabel="Selesaikan touring" danger busy={actionBusy} onClose={() => setDialog(null)} onConfirm={finishTrip} />
      {codeOpen && <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="new-code-title"><span className="modal-symbol"><KeyRound size={25} /></span><h2 id="new-code-title">Buat kode pantau baru</h2><p>Kode lama langsung tidak berlaku. Bagikan kode baru hanya kepada orang yang Anda percaya.</p><div className="code-modal"><ShareCode code={trip.access_code} compact /></div><div className="modal-actions"><button className="button button-secondary" onClick={() => setCodeOpen(false)}>Tutup</button><button className="button button-primary" onClick={regenerateCode} disabled={actionBusy}>{actionBusy ? <span className="spinner" /> : <RefreshCw size={17} />}{actionBusy ? "Membuat..." : "Ganti kode"}</button></div></section></div>}
    </div>
  );
}
