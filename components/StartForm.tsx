"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CarFront, Crosshair, Info, MapPin, Navigation, UserRound } from "lucide-react";
import { ensureAnonymousSession, supabase } from "@/lib/supabase";
import { createAccessCode } from "@/lib/utils";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="loading-screen"><div><span className="spinner" />Menyiapkan peta...</div></div>,
});

export function StartForm() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [destinationName, setDestinationName] = useState("");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  function locate() {
    setError("");
    if (!navigator.geolocation) {
      setError("HP ini tidak mendukung GPS. Anda tetap bisa memilih tujuan dengan mengetuk peta.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setFocus({ lat: result.coords.latitude, lng: result.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Lokasi tidak dapat dibaca. Izinkan akses lokasi di browser, atau pilih tujuan langsung di peta.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (nickname.trim().length < 2) {
      setError("Tuliskan nama panggilan minimal 2 huruf.");
      return;
    }
    if (!position) {
      setError("Pilih titik tujuan dengan mengetuk peta terlebih dahulu.");
      return;
    }
    setBusy(true);
    try {
      await ensureAnonymousSession();
      let inserted = false;
      for (let attempt = 0; attempt < 3 && !inserted; attempt += 1) {
        const { data, error: insertError } = await supabase.from("trips").insert({
          nickname: nickname.trim().slice(0, 40),
          vehicle: "mobil",
          destination_name: destinationName.trim().slice(0, 100) || "Tujuan perjalanan",
          destination_lat: position.lat,
          destination_lng: position.lng,
          access_code: createAccessCode(),
        }).select("id").single();
        if (!insertError && data) {
          localStorage.setItem("jejaktouring:activeTrip", data.id);
          localStorage.removeItem(`jejaktouring:queue:${data.id}`);
          router.push(`/perjalanan/${data.id}`);
          inserted = true;
        } else if (insertError?.code !== "23505") {
          throw insertError;
        }
      }
      if (!inserted) throw new Error("Kode belum berhasil dibuat. Silakan coba lagi.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Perjalanan belum berhasil dibuat.";
      setError(message.includes("Anonymous") ? "Sesi anonim Supabase belum aktif. Aktifkan Allow anonymous sign-ins terlebih dahulu." : message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-layout">
        <section className="panel">
          <h2>Tentang perjalanan</h2>
          <p className="panel-intro">Cukup informasi sederhana agar keluarga mengenali perjalanan Anda.</p>
          {error && <div className="error-box" role="alert">{error}</div>}
          <div className="field">
            <label htmlFor="nickname">Nama panggilan</label>
            <input id="nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="Contoh: Dimas & Keluarga" maxLength={40} autoComplete="nickname" required />
            <span className="field-hint">Nama ini akan terlihat oleh pemegang kode pantau.</span>
          </div>
          <div className="car-fixed"><CarFront size={23} /><span><strong>Perjalanan dengan mobil</strong><small>Disesuaikan untuk HP di dashboard mobil</small></span><i className="fixed-tag">Mobil</i></div>
          <div className="field">
            <label htmlFor="destination">Nama tujuan <span style={{ color: "var(--dim)", fontWeight: 400 }}>(opsional)</span></label>
            <input id="destination" value={destinationName} onChange={(event) => setDestinationName(event.target.value)} placeholder="Contoh: Bandung" maxLength={100} />
          </div>
          <div className="info-box"><Info size={17} /><span>Tidak perlu membuat akun. Perjalanan hanya dapat dikendalikan dari browser HP ini. Jangan hapus data browser selama perjalanan.</span></div>
        </section>

        <section className="panel map-panel">
          <div className="map-panel-head"><div><h2>Di mana tujuannya?</h2><p>Ketuk peta, lalu geser penanda bila perlu.</p></div><button type="button" className="locate-button" onClick={locate} disabled={locating}><Crosshair size={16} className={locating ? "spin" : ""} /><span>{locating ? "Mencari..." : "Lokasi saya"}</span></button></div>
          <div className="map-wrap">
            <MapPicker latitude={position?.lat ?? null} longitude={position?.lng ?? null} focus={focus} onChange={(lat, lng) => setPosition({ lat, lng })} />
            {!position && <div className="map-instruction"><MapPin size={13} /> Ketuk untuk menandai tujuan</div>}
          </div>
          <div className="destination-summary"><Navigation size={20} /><div><small>TUJUAN DIPILIH</small><strong>{position ? destinationName || "Tujuan perjalanan" : "Belum ada titik tujuan"}</strong></div>{position && <span className="coords">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>}</div>
        </section>
      </div>
      <div className="form-footer"><button className="button button-primary button-full" disabled={busy}>{busy ? <span className="spinner" /> : <CarFront size={21} />}{busy ? "Menyiapkan perjalanan..." : "Buat perjalanan & dapatkan kode"}</button><p className="form-footer-note">Dengan memulai, Anda setuju membagikan lokasi hanya selama perjalanan aktif.</p></div>
    </form>
  );
}
