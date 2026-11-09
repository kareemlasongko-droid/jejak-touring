"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CarFront, Clock3, Eye, Gauge, Info, MapPin, MessageCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PantauData } from "@/lib/types";
import { formatTime, getDemoSos, relativeTime } from "@/lib/utils";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => <div className="loading-screen"><div><span className="spinner" />Memuat peta...</div></div>,
});

export function MonitorClient({ code }: { code: string }) {
  const isDemo = code === "DEMO";
  const [data, setData] = useState<PantauData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    if (isDemo) {
      const demoSos = getDemoSos();
      setData({
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
        status: "aktif",
        sos_at: demoSos?.at ?? null,
        sos_message: demoSos?.message ?? null,
        latitude: -6.597147,
        longitude: 107.044678,
        speed: 20,
        accuracy: 8,
        recorded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setEnded(false);
      setError("");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const { data: rows, error: rpcError } = await supabase.rpc("pantau", { p_kode: code });
      if (rpcError) throw rpcError;
      const result = (rows as PantauData[] | null)?.[0] ?? null;
      if (!result) {
        setData(null);
        setEnded(true);
      } else {
        setData(result);
        setEnded(false);
        setError("");
      }
    } catch {
      setError("Data belum dapat diperbarui. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [code, isDemo]);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => { void load(); }, 15000);
    const clock = window.setInterval(() => setTick((value) => value + 1), 15000);
    return () => { window.clearInterval(interval); window.clearInterval(clock); };
  }, [load]);
  void tick;

  if (loading) return <div className="loading-screen"><div><span className="spinner" />Mencari perjalanan...</div></div>;
  if (ended || !data) return <section className="empty-state"><div className="monitor-entry-icon"><Clock3 size={30} /></div><h1>Perjalanan tidak tersedia</h1><p>Kode mungkin salah, perjalanan sudah tiba, selesai, atau telah melewati batas 2 × 24 jam. Minta kode baru kepada peserta jika perjalanan masih berlangsung.</p><Link href="/pantau" className="button button-primary"><ArrowLeft size={18} /> Masukkan kode lain</Link></section>;

  const stale = !data.recorded_at || Date.now() - new Date(data.recorded_at).getTime() > 180000;
  const emergencyDigits = data.emergency_contact?.replace(/\D/g, "") ?? "";
  const whatsappNumber = emergencyDigits.startsWith("0") ? `62${emergencyDigits.slice(1)}` : emergencyDigits;
  const passengerSummary = `${data.adult_count ?? 0} dewasa${data.child_count ? `, ${data.child_count} anak` : ""}`;
  return (
    <div className="monitor-live-content">
      <div className="monitor-heading"><div><h1>Perjalanan {data.nickname}</h1><p>Kode pantau: <strong>{code}</strong></p></div><button className="button button-secondary refresh-button" onClick={() => load(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "spin" : ""} /><span>{refreshing ? "Memuat..." : "Perbarui"}</span></button></div>

      {isDemo && <div className="demo-preview-banner" role="status"><Eye size={18} /><span><strong>Preview perjalanan aktif</strong> — ini data demo, bukan lokasi atau perjalanan nyata.</span></div>}
      {data.sos_at && <div className="sos-banner" role="alert"><ShieldAlert size={25} /><div><strong>Peserta mengaktifkan SOS</strong><p className="sos-message">Kendala: {data.sos_message || "Belum ada keterangan kendala."}</p><p>Dikirim pukul {formatTime(data.sos_at)}. Hubungi peserta atau kontak darurat untuk membantu. Ini bukan panggilan otomatis ke layanan darurat.</p></div></div>}
      {stale && <div className="stale-banner" role="status"><AlertTriangle size={20} /><span><strong>Data lama.</strong> Tidak ada lokasi baru selama lebih dari 3 menit. Peserta mungkin kehilangan sinyal atau halaman pelacak tidak aktif.</span></div>}
      {error && <div className="error-box">{error}</div>}

      <div className="monitor-grid">
        <section className="panel monitor-map-panel"><div className="map-wrap monitor-map">{data.latitude !== null && data.longitude !== null ? <LiveMap latitude={data.latitude} longitude={data.longitude} destinationLat={data.destination_lat} destinationLng={data.destination_lng} nickname={data.nickname} /> : <div className="empty-location"><div><MapPin size={34} /><h3>Menunggu lokasi pertama</h3><p>Peserta sudah membuat perjalanan, tetapi GPS belum mengirimkan titik lokasi.</p></div></div>}<div className="map-status-strip"><div className="map-status-chip"><span className={`live-dot ${stale ? "stale" : ""}`} />{stale ? "Data lama" : "Lokasi live"}</div><div className="map-status-chip"><Clock3 size={13} />{relativeTime(data.recorded_at)}</div></div></div></section>
        <aside className="monitor-details">
          <section className="panel"><div className="person-card"><div className="person-avatar">{data.nickname.charAt(0).toUpperCase()}</div><div><h2>{data.nickname}</h2><p><CarFront size={13} /> Perjalanan dengan mobil</p></div></div><div className="monitor-last"><small>TERAKHIR TERLIHAT</small><strong>{formatTime(data.recorded_at)}</strong></div></section>

          <section className="panel monitor-trip-info">
            <div className="monitor-info-row"><div><small>KENDARAAN</small><strong>{data.vehicle_info || "Mobil"}{data.license_plate ? ` • ${data.license_plate}` : ""}</strong></div></div>
            <div className="monitor-info-row"><div><small>SUPIR & PENUMPANG</small><strong>{data.driver_name || "Tidak diisi"}</strong><span>{passengerSummary}</span></div></div>
            {data.emergency_contact ? <a className="emergency-contact" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" aria-label={`Hubungi kontak darurat ${data.emergency_contact} melalui WhatsApp`}><MessageCircle size={20} /><div><small>KONTAK DARURAT — WHATSAPP</small><strong>{data.emergency_contact}</strong><span>Ketuk untuk menghubungi</span></div></a> : <div className="monitor-info-row"><MessageCircle size={19} /><div><small>KONTAK DARURAT</small><strong>Tidak diisi</strong></div></div>}
          </section>

          <section className="panel"><div className="destination-card"><div><small>TUJUAN PERJALANAN</small><strong>{data.destination_name}</strong></div></div><div className="monitor-last"><small>KECEPATAN SAAT INI</small><strong><Gauge size={13} /> {data.speed != null && data.speed >= 0 ? `${Math.round(data.speed * 3.6)} km/j` : "Tidak tersedia"}</strong></div><div className="monitor-last"><small>STATUS</small><strong style={{ color: "var(--green)" }}>Dalam perjalanan</strong></div></section>
          <div className="monitor-disclaimer"><Info size={16} /><span>Titik di peta bukan jaminan bahwa peserta aman. Jika data lama atau SOS aktif dan Anda khawatir, hubungi peserta atau pihak yang dapat membantu. Jangan hanya mengandalkan peta.</span></div>
        </aside>
      </div>
    </div>
  );
}
