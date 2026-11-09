"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, CarFront, Check, CheckCircle2, Clock3, Eye, Flag, Gauge, KeyRound, LocateFixed, RefreshCw, Satellite, ShieldAlert, WifiOff } from "lucide-react";
import { ensureAnonymousSession, supabase } from "@/lib/supabase";
import type { LocationPoint, Trip } from "@/lib/types";
import { createAccessCode, DEMO_SOS_KEY, distanceInMeters, formatTime, getDemoSos, relativeTime, TRIP_MAX_DURATION_MS } from "@/lib/utils";
import { ShareCode } from "@/components/ShareCode";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => <div className="loading-screen"><div><span className="spinner" />Memuat peta...</div></div>,
});

type CurrentPosition = { lat: number; lng: number; speed: number | null; accuracy: number | null; recordedAt: string };
type WakeLockSentinelLike = { release: () => Promise<void>; addEventListener: (type: string, listener: () => void) => void };

export function TrackingClient({ tripId }: { tripId: string }) {
  const isDemo = tripId === "DEMO";
  const [trip, setTrip] = useState<Trip | null>(null);
  const [current, setCurrent] = useState<CurrentPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("Minta izin lokasi agar perjalanan dapat dibagikan.");
  const [queueCount, setQueueCount] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);
  const [dialog, setDialog] = useState<"sos" | "finish" | null>(null);
  const [sosMessage, setSosMessage] = useState("");
  const [sosError, setSosError] = useState("");
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
      if (isDemo) {
        const now = new Date().toISOString();
        const demoSos = getDemoSos();
        setTrip({
          id: "DEMO",
          user_id: "demo",
          nickname: "Panther Touring",
          vehicle: "mobil",
          vehicle_info: "Panther touring 2001 coklat",
          license_plate: "B 1234 XYZ",
          driver_name: "Dimas",
          adult_count: 3,
          child_count: 1,
          emergency_contact: "0812 3456 7890",
          destination_name: "Bandung",
          destination_lat: -6.914744,
          destination_lng: 107.60981,
          access_code: "TRK-DEMO0-00000",
          status: "aktif",
          created_at: now,
          updated_at: now,
          arrived_at: null,
          ended_at: null,
          end_reason: null,
          sos_at: demoSos?.at ?? null,
          sos_message: demoSos?.message ?? null,
        });
        setCurrent({ lat: -6.597147, lng: 107.044678, speed: 20, accuracy: 8, recordedAt: now });
        setNotice("Mode demo. GPS dan tombol tidak mengubah data perjalanan nyata.");
        setLoading(false);
        return;
      }
      try {
        await ensureAnonymousSession();
        const { data, error: loadError } = await supabase.from("trips").select("*").eq("id", tripId).single();
        if (loadError) throw loadError;
        if (!active) return;
        setTrip(data as Trip);
        arrived.current = data.status !== "aktif";
        if (data.status !== "aktif") {
          if (localStorage.getItem("jejaktouring:activeTrip") === tripId) {
            localStorage.removeItem("jejaktouring:activeTrip");
            localStorage.removeItem("jejaktouring:activeTripExpiresAt");
          }
          localStorage.removeItem(queueKey);
        }
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
    if (isDemo || !trip || trip.status !== "aktif") return;
    const expiresAt = new Date(trip.created_at).getTime() + TRIP_MAX_DURATION_MS;
    if (!Number.isFinite(expiresAt)) return;

    function checkExpiry() {
      if (Date.now() < expiresAt) return;
      arrived.current = true;
      queue.current = [];
      localStorage.removeItem(queueKey);
      setQueueCount(0);
      if (localStorage.getItem("jejaktouring:activeTrip") === tripId) {
        localStorage.removeItem("jejaktouring:activeTrip");
        localStorage.removeItem("jejaktouring:activeTripExpiresAt");
      }
      setTrip((previous) => previous?.status === "aktif" ? {
        ...previous, status: "selesai", ended_at: new Date(expiresAt).toISOString(), end_reason: "timeout",
      } : previous);
      setNotice("Batas 2 × 24 jam tercapai. Lokasi dan kode pantau sudah berhenti.");
    }

    checkExpiry();
    const timeout = window.setTimeout(checkExpiry, Math.max(0, expiresAt - Date.now()));
    document.addEventListener("visibilitychange", checkExpiry);
    return () => { window.clearTimeout(timeout); document.removeEventListener("visibilitychange", checkExpiry); };
  }, [isDemo, trip?.id, trip?.status, trip?.created_at, tripId, queueKey]);

  useEffect(() => {
    if (isDemo || !trip || trip.status === "aktif") return;
    arrived.current = true;
    queue.current = [];
    localStorage.removeItem(queueKey);
    setQueueCount(0);
    if (localStorage.getItem("jejaktouring:activeTrip") === tripId) {
      localStorage.removeItem("jejaktouring:activeTrip");
      localStorage.removeItem("jejaktouring:activeTripExpiresAt");
    }
  }, [isDemo, trip?.id, trip?.status, tripId, queueKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isDemo || !trip || trip.status !== "aktif") return;
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
      if (cancelled || !trip || arrived.current || Date.now() >= new Date(trip.created_at).getTime() + TRIP_MAX_DURATION_MS) return;
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
        const { data: result, error: arrivalError } = await supabase.from("trips").update({ status: "tiba", arrived_at: new Date().toISOString() }).eq("id", trip.id).select("status,arrived_at,ended_at,end_reason").single();
        if (!arrivalError && result) {
          setTrip((old) => old ? { ...old, ...result } : old);
          localStorage.removeItem("jejaktouring:activeTrip");
          localStorage.removeItem("jejaktouring:activeTripExpiresAt");
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

  useEffect(() => {
    if (trip && trip.status !== "aktif" && dialog === "sos") setDialog(null);
  }, [trip?.status, dialog]);

  async function sendSos() {
    if (!trip || trip.status !== "aktif" || trip.sos_at || actionBusy) return;
    const message = sosMessage.trim();
    if (message.length < 5 || message.length > 300) {
      setSosError("Jelaskan kendala dalam 5 sampai 300 karakter.");
      return;
    }
    setSosError("");
    setActionBusy(true);
    const sosAt = new Date().toISOString();
    if (isDemo) {
      try { localStorage.setItem(DEMO_SOS_KEY, JSON.stringify({ at: sosAt, message })); } catch { /* Demo tetap berjalan di halaman ini. */ }
      setTrip({ ...trip, sos_at: sosAt, sos_message: message });
      setDialog(null);
      setNotice("Mode demo. SOS hanya ditampilkan di browser ini.");
      setActionBusy(false);
      return;
    }
    try {
      const { data: result, error: sendError } = await supabase.from("trips").update({ sos_at: sosAt, sos_message: message }).eq("id", trip.id).select("sos_at,sos_message,status,ended_at,end_reason").single();
      if (sendError || !result) throw sendError ?? new Error("SOS belum tersimpan");
      setTrip({ ...trip, ...result });
      setDialog(null);
      if (result.status === "aktif") setNotice("SOS aktif. Segera hubungi komunitas melalui saluran komunikasi lain.");
    } catch {
      setSosError("Tanda SOS belum terkirim. Periksa koneksi dan coba lagi.");
    } finally {
      setActionBusy(false);
    }
  }

  async function finishTrip() {
    if (!trip) return;
    setActionBusy(true);
    const endedAt = new Date().toISOString();
    if (isDemo) {
      try { localStorage.removeItem(DEMO_SOS_KEY); } catch { /* Demo hanya lokal. */ }
      setTrip({ ...trip, status: "selesai", ended_at: endedAt, end_reason: "manual" });
      setDialog(null);
      setActionBusy(false);
      return;
    }
    const { data: result, error: finishError } = await supabase.from("trips").update({ status: "selesai", ended_at: endedAt }).eq("id", trip.id).select("status,ended_at,end_reason").single();
    if (finishError || !result) setError("Perjalanan belum dapat dihentikan. Periksa koneksi dan coba lagi.");
    else {
      setTrip({ ...trip, ...result });
      localStorage.removeItem("jejaktouring:activeTrip");
      localStorage.removeItem("jejaktouring:activeTripExpiresAt");
      setDialog(null);
    }
    setActionBusy(false);
  }

  async function regenerateCode() {
    if (!trip) return;
    setActionBusy(true);
    if (isDemo) {
      setTrip({ ...trip, access_code: createAccessCode() });
      setActionBusy(false);
      return;
    }
    const { data, error: codeError } = await supabase.from("trips").update({ access_code: createAccessCode() }).eq("id", trip.id).select("access_code,status,ended_at,end_reason").single();
    if (codeError || !data) setError("Kode baru belum berhasil dibuat. Coba lagi.");
    else {
      setTrip({ ...trip, ...data });
      if (data.status !== "aktif") setCodeOpen(false);
    }
    setActionBusy(false);
  }

  if (loading) return <div className="loading-screen"><div><span className="spinner" />Membuka perjalanan...</div></div>;
  if (!trip) return <section className="empty-state"><div className="monitor-entry-icon"><AlertTriangle size={30} /></div><h1>Perjalanan tidak dapat dibuka</h1><p>{error}</p><Link href="/" className="button button-primary"><ArrowLeft size={18} /> Kembali ke beranda</Link></section>;

  const isActive = trip.status === "aktif";
  const timedOut = trip.status === "selesai" && trip.end_reason === "timeout";
  const isStale = isActive && current && Date.now() - new Date(current.recordedAt).getTime() > 180000;
  const passengerSummary = `${trip.adult_count ?? 0} dewasa${trip.child_count ? `, ${trip.child_count} anak` : ""}`;
  void tick;

  return (
    <div className="tracking-page">
      {isDemo && <div className="demo-preview-banner" role="status"><Eye size={18} /><span><strong>Preview perjalanan peserta</strong> — data demo, bukan GPS atau perjalanan nyata.</span></div>}
      {error && <div className="error-box" role="alert">{error}</div>}
      <div className="tracking-head">
        <div className="tracking-trip-summary">
          <h1>{trip.nickname}</h1>
          <p>Menuju {trip.destination_name}</p>
          <div className="participant-trip-info" aria-label="Tentang perjalanan">
            <div className="monitor-info-row"><div><small>KENDARAAN</small><strong>{trip.vehicle_info || "Mobil"}{trip.license_plate ? ` • ${trip.license_plate}` : ""}</strong></div></div>
            <div className="monitor-info-row"><div><small>SUPIR & PENUMPANG</small><strong>{trip.driver_name || "Tidak diisi"}</strong><span>{passengerSummary}</span></div></div>
          </div>
        </div>
        <span className={`status-badge ${isActive ? isStale ? "status-warning" : "status-active" : "status-ended"}`}>{isActive && !isStale && <i className="live-dot" />}{isActive ? isStale ? "Data lama" : "Perjalanan aktif" : trip.status === "tiba" ? "Sudah tiba" : timedOut ? "Batas 48 jam" : "Perjalanan selesai"}</span>
      </div>

      {!isActive ? (
        <section className="panel arrived-card"><div className="arrived-icon">{trip.status === "tiba" ? <Flag size={30} /> : <CheckCircle2 size={30} />}</div><h2>{trip.status === "tiba" ? "Anda sudah tiba di tujuan" : timedOut ? "Batas 2 × 24 jam tercapai" : "Perjalanan telah dihentikan"}</h2><p>{trip.status === "tiba" ? "Posisi Anda berada dalam radius 200 meter dari tujuan. Pelacakan dan kode pantau sudah dihentikan otomatis." : timedOut ? "Perjalanan selesai otomatis. Lokasi tidak lagi dibagikan dan kode pantau sudah tidak berlaku. Buat perjalanan baru jika ingin melanjutkan." : "Pelacakan dan kode pantau sudah tidak aktif. Terima kasih telah menggunakan JejakTouring."}</p><Link href="/" className="button button-primary"><Check size={18} /> Kembali ke beranda</Link></section>
      ) : (
        <div className="tracking-grid">
          <section className="panel tracking-map-panel"><div className="map-wrap tracking-map"><LiveMap latitude={current?.lat ?? null} longitude={current?.lng ?? null} destinationLat={trip.destination_lat} destinationLng={trip.destination_lng} nickname={trip.nickname} /><div className="map-status-strip"><div className="map-status-chip"><Satellite size={14} />{current ? `GPS ±${Math.round(current.accuracy ?? 0)} m` : "Menunggu GPS..."}</div><div className="map-status-chip"><CarFront size={14} /> Mobil</div></div></div></section>
          <aside className="tracking-side">
            <section className="panel trip-stats"><div className="stat"><Gauge className="stat-icon" size={20} /><small>KECEPATAN</small><strong>{current?.speed != null && current.speed >= 0 ? Math.round(current.speed * 3.6) : "—"} <span>km/j</span></strong></div><div className="stat"><Clock3 className="stat-icon" size={20} /><small>TERAKHIR TERLIHAT</small><strong style={{ fontSize: 14 }}>{current ? relativeTime(current.recordedAt) : "Menunggu GPS"}</strong></div></section>
            <ShareCode code={trip.access_code} compact onNewCode={() => setCodeOpen(true)} />
            <section className="panel tracking-actions"><button className={`button sos-button ${trip.sos_at ? "sos-active" : ""}`} onClick={() => { setSosMessage(""); setSosError(""); setDialog("sos"); }} disabled={Boolean(trip.sos_at)}><ShieldAlert size={21} />{trip.sos_at ? "SOS sedang aktif" : "Kirim tanda SOS"}</button><button className="button button-secondary small-action finish-button" onClick={() => setDialog("finish")}>Selesaikan touring</button></section>
            <div className={`last-update ${queueCount ? "queue-note" : ""}`}>{queueCount ? <WifiOff size={14} /> : <LocateFixed size={14} />}<span>{queueCount ? `${queueCount} titik menunggu dikirim` : notice}</span></div>
          </aside>
        </div>
      )}

      {dialog === "sos" && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal sos-dialog" role="dialog" aria-modal="true" aria-labelledby="sos-dialog-title">
            <span className="modal-symbol danger"><ShieldAlert size={26} /></span>
            <h2 id="sos-dialog-title">Kirim tanda SOS</h2>
            <form onSubmit={(event) => { event.preventDefault(); void sendSos(); }}>
              <div className="field">
                <label htmlFor="sos-message">Kendala yang dialami <span className="required-label">Wajib</span></label>
                <textarea id="sos-message" className="sos-message-input" value={sosMessage} onChange={(event) => { setSosMessage(event.target.value); setSosError(""); }} placeholder="Contoh: Ban bocor, sedang menepi di rest area." minLength={5} maxLength={300} required autoFocus disabled={actionBusy} />
                <span className="field-hint">{sosMessage.length}/300 karakter. Jika mendesak, hubungi layanan darurat secara langsung.</span>
              </div>
              {sosError && <div className="error-box" role="alert">{sosError}</div>}
              <div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setDialog(null)} disabled={actionBusy}>Batal</button><button type="submit" className="button button-danger" disabled={actionBusy}>{actionBusy ? "Mengirim..." : "Kirim SOS"}</button></div>
            </form>
          </section>
        </div>
      )}
      <ConfirmDialog open={dialog === "finish"} title="Selesaikan perjalanan?" description="GPS akan berhenti dan seluruh kode pantau tidak dapat digunakan lagi. Tindakan ini tidak dapat dibatalkan." confirmLabel="Selesaikan touring" danger busy={actionBusy} onClose={() => setDialog(null)} onConfirm={finishTrip} />
      {codeOpen && <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="new-code-title"><span className="modal-symbol"><KeyRound size={25} /></span><h2 id="new-code-title">Buat kode pantau baru</h2><p>Kode lama langsung tidak berlaku. Bagikan kode baru hanya kepada orang yang Anda percaya.</p><div className="code-modal"><ShareCode code={trip.access_code} compact /></div><div className="modal-actions"><button className="button button-secondary" onClick={() => setCodeOpen(false)}>Tutup</button><button className="button button-primary" onClick={regenerateCode} disabled={actionBusy}>{actionBusy ? <span className="spinner" /> : <RefreshCw size={17} />}{actionBusy ? "Membuat..." : "Ganti kode"}</button></div></section></div>}
    </div>
  );
}
