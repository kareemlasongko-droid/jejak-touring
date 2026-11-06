"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, CarFront, Clock3, Eye, Gauge, Info, MapPin, RefreshCw, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { PantauData } from "@/lib/types";
import { formatTime, relativeTime } from "@/lib/utils";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => <div className="loading-screen"><div><span className="spinner" />Memuat peta...</div></div>,
});

export function MonitorClient({ code }: { code: string }) {
  const [data, setData] = useState<PantauData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
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
  }, [code]);

  useEffect(() => {
    load();
    const interval = window.setInterval(() => { void load(); }, 15000);
    const clock = window.setInterval(() => setTick((value) => value + 1), 15000);
    return () => { window.clearInterval(interval); window.clearInterval(clock); };
  }, [load]);
  void tick;

  if (loading) return <div className="loading-screen"><div><span className="spinner" />Mencari perjalanan...</div></div>;
  if (ended || !data) return <section className="empty-state"><div className="monitor-entry-icon"><Clock3 size={30} /></div><h1>Perjalanan tidak tersedia</h1><p>Kode mungkin salah, perjalanan sudah tiba, atau peserta telah menyelesaikannya. Minta kode baru kepada peserta jika perjalanan masih berlangsung.</p><Link href="/pantau" className="button button-primary"><ArrowLeft size={18} /> Masukkan kode lain</Link></section>;

  const stale = !data.recorded_at || Date.now() - new Date(data.recorded_at).getTime() > 180000;
  return (
    <div>
      <div className="monitor-heading"><div><h1>Perjalanan {data.nickname}</h1><p>Kode pantau: <strong>{code}</strong></p></div><button className="button button-secondary refresh-button" onClick={() => load(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "spin" : ""} /><span>{refreshing ? "Memuat..." : "Perbarui"}</span></button></div>

      {data.sos_at && <div className="sos-banner" role="alert"><ShieldAlert size={25} /><div><strong>Peserta mengaktifkan SOS</strong><p>Dikirim pukul {formatTime(data.sos_at)}. Coba hubungi peserta atau komunitas melalui saluran komunikasi lain. Ini bukan panggilan otomatis ke layanan darurat.</p></div></div>}
      {stale && <div className="stale-banner" role="status"><AlertTriangle size={20} /><span><strong>Data lama.</strong> Tidak ada lokasi baru selama lebih dari 3 menit. Peserta mungkin kehilangan sinyal atau halaman pelacak tidak aktif.</span></div>}
      {error && <div className="error-box">{error}</div>}

      <div className="monitor-grid">
        <section className="panel monitor-map-panel"><div className="map-wrap monitor-map">{data.latitude !== null && data.longitude !== null ? <LiveMap latitude={data.latitude} longitude={data.longitude} destinationLat={data.destination_lat} destinationLng={data.destination_lng} nickname={data.nickname} /> : <div className="empty-location"><div><MapPin size={34} /><h3>Menunggu lokasi pertama</h3><p>Peserta sudah membuat perjalanan, tetapi GPS belum mengirimkan titik lokasi.</p></div></div>}<div className="map-status-strip"><div className="map-status-chip"><span className={`live-dot ${stale ? "stale" : ""}`} />{stale ? "Data lama" : "Lokasi live"}</div><div className="map-status-chip"><Clock3 size={13} />{relativeTime(data.recorded_at)}</div></div></div></section>
        <aside className="monitor-details">
          <section className="panel"><div className="person-card"><div className="person-avatar">{data.nickname.charAt(0).toUpperCase()}</div><div><h2>{data.nickname}</h2><p><CarFront size={13} /> Perjalanan dengan mobil</p></div></div><div className="monitor-last"><small>TERAKHIR TERLIHAT</small><strong>{formatTime(data.recorded_at)}</strong></div></section>
          <section className="panel"><div className="destination-card"><MapPin size={20} /><div><small>TUJUAN PERJALANAN</small><strong>{data.destination_name}</strong></div></div><div className="monitor-last"><small>KECEPATAN SAAT INI</small><strong><Gauge size={13} /> {data.speed != null && data.speed >= 0 ? `${Math.round(data.speed * 3.6)} km/j` : "Tidak tersedia"}</strong></div><div className="monitor-last"><small>STATUS</small><strong style={{ color: "var(--green)" }}>Dalam perjalanan</strong></div></section>
          <div className="monitor-disclaimer"><Info size={16} /><span>Titik di peta bukan jaminan bahwa peserta aman. Jika data lama atau SOS aktif dan Anda khawatir, hubungi peserta atau pihak yang dapat membantu. Jangan hanya mengandalkan peta.</span></div>
        </aside>
      </div>
    </div>
  );
}
