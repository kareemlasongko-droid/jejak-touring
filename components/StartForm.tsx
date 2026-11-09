"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CarFront, ChevronRight, Crosshair, Info, MapPin, Navigation, UsersRound } from "lucide-react";
import { ensureAnonymousSession, supabase } from "@/lib/supabase";
import { createAccessCode, TRIP_MAX_DURATION_MS } from "@/lib/utils";
import { OccupantModal, VehicleModal, type OccupantDetails, type VehicleDetails } from "@/components/TripInfoModals";

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => <div className="loading-screen"><div><span className="spinner" />Menyiapkan peta...</div></div>,
});

const emptyVehicle: VehicleDetails = { vehicleInfo: "", licensePlate: "" };
const emptyOccupants: OccupantDetails = { driverName: "", adultCount: null, childCount: null, emergencyContact: "" };

export function StartForm() {
  const router = useRouter();
  const [tripName, setTripName] = useState("");
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>(emptyVehicle);
  const [occupantDetails, setOccupantDetails] = useState<OccupantDetails>(emptyOccupants);
  const [modal, setModal] = useState<"vehicle" | "occupants" | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [createdTripId, setCreatedTripId] = useState<string | null>(null);
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
    if (busy || createdTripId) return;
    setError("");
    if (tripName.trim().length < 2) {
      setError("Masukkan nama perjalanan minimal 2 huruf.");
      return;
    }
    if (occupantDetails.driverName.trim().length < 2 || !occupantDetails.emergencyContact.trim()) {
      setError("Lengkapi informasi dalam kendaraan: supir/pilot dan kontak darurat wajib diisi.");
      setModal("occupants");
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
          nickname: tripName.trim().slice(0, 40),
          vehicle: "mobil",
          vehicle_info: vehicleDetails.vehicleInfo || null,
          license_plate: vehicleDetails.licensePlate || null,
          driver_name: occupantDetails.driverName,
          adult_count: occupantDetails.adultCount,
          child_count: occupantDetails.childCount,
          emergency_contact: occupantDetails.emergencyContact,
          destination_name: "Tujuan perjalanan",
          destination_lat: position.lat,
          destination_lng: position.lng,
          access_code: createAccessCode(),
        }).select("id,created_at").single();
        if (!insertError && data) {
          localStorage.setItem("jejaktouring:activeTrip", data.id);
          localStorage.setItem("jejaktouring:activeTripExpiresAt", String(new Date(data.created_at).getTime() + TRIP_MAX_DURATION_MS));
          localStorage.removeItem(`jejaktouring:queue:${data.id}`);
          setCreatedTripId(data.id);
          setBusy(false);
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

  const vehicleSummary = vehicleDetails.vehicleInfo || vehicleDetails.licensePlate
    ? [vehicleDetails.vehicleInfo || "Mobil", vehicleDetails.licensePlate].filter(Boolean).join(" • ")
    : "Kendaraan & nopol (opsional)";
  const passengerTotal = (occupantDetails.adultCount ?? 0) + (occupantDetails.childCount ?? 0);
  const occupantSummary = occupantDetails.driverName
    ? `${occupantDetails.driverName} • ${passengerTotal} penumpang`
    : "Supir, penumpang & kontak darurat";

  return (
    <>
      <form className="start-form" onSubmit={submit}>
        <div className="form-layout">
          <section className="panel">
            <h2>Tentang perjalanan</h2>
            <p className="panel-intro">Isi informasi perjalanan, kendaraan, dan orang di dalamnya.</p>
            {error && <div className="error-box" role="alert">{error}</div>}

            <div className="field">
              <label htmlFor="trip-name">Masukkan nama perjalanan <span className="required-label">Wajib</span></label>
              <input id="trip-name" value={tripName} onChange={(event) => setTripName(event.target.value)} placeholder="Contoh: Touring keluarga ke Bandung" maxLength={40} required />
            </div>

            <button type="button" className="detail-field" onClick={() => setModal("vehicle")}>
              <span className="detail-field-icon"><CarFront size={22} /></span>
              <span className="detail-field-content"><strong>Informasi kendaraan</strong><small>{vehicleSummary}</small></span>
              <ChevronRight className="detail-field-arrow" size={19} />
            </button>

            <button type="button" className="detail-field" onClick={() => setModal("occupants")}>
              <span className="detail-field-icon"><UsersRound size={22} /></span>
              <span className="detail-field-content"><strong>Informasi dalam kendaraan <i className="required-dot">Wajib</i></strong><small>{occupantSummary}</small></span>
              <ChevronRight className="detail-field-arrow" size={19} />
            </button>

            <div className="info-box"><Info size={17} /><span>Tidak perlu membuat akun. Perjalanan hanya dapat dikendalikan dari browser HP ini. Jangan hapus data browser selama perjalanan.</span></div>
          </section>

          <section className="panel map-panel">
            <div className="map-panel-head"><div><h2>Di mana tujuannya?</h2><p>Ketuk peta, lalu geser penanda bila perlu.</p></div><button type="button" className="locate-button" onClick={locate} disabled={locating}><Crosshair size={16} className={locating ? "spin" : ""} /><span>{locating ? "Mencari..." : "Lokasi saya"}</span></button></div>
            <div className="map-wrap">
              <MapPicker latitude={position?.lat ?? null} longitude={position?.lng ?? null} focus={focus} onChange={(lat, lng) => setPosition({ lat, lng })} />
              {!position && <div className="map-instruction"><MapPin size={13} /> Ketuk untuk menandai tujuan</div>}
            </div>
            <div className="destination-summary"><Navigation size={20} /><div><small>TUJUAN DIPILIH</small><strong>{position ? "Tujuan perjalanan" : "Belum ada titik tujuan"}</strong></div>{position && <span className="coords">{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>}</div>
          </section>
        </div>
        <div className="form-footer"><button className="button button-primary button-full" disabled={busy}>{busy ? <span className="spinner" /> : <CarFront size={21} />}{busy ? "Menyiapkan perjalanan..." : "Buat Perjalanan"}</button><p className="form-footer-note">Dengan memulai, Anda setuju membagikan lokasi hanya selama perjalanan aktif.</p></div>
      </form>

      {modal === "vehicle" && <VehicleModal initial={vehicleDetails} onClose={() => setModal(null)} onSave={(value) => { setVehicleDetails(value); setModal(null); setError(""); }} />}
      {modal === "occupants" && <OccupantModal initial={occupantDetails} onClose={() => setModal(null)} onSave={(value) => { setOccupantDetails(value); setModal(null); setError(""); }} />}
      {createdTripId && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal trip-started-modal" role="dialog" aria-modal="true" aria-labelledby="trip-started-title" aria-describedby="trip-started-description">
            <span className="modal-symbol"><Info size={25} /></span>
            <h2 id="trip-started-title">Perjalanan berhasil dibuat</h2>
            <p id="trip-started-description">Lokasi mulai dibagikan setelah Anda membuka halaman perjalanan dan mengizinkan akses lokasi.</p>
            <ul className="trip-started-list">
              <li>Biarkan halaman perjalanan terbuka, dengan GPS dan internet menyala. Saat layar terkunci atau berpindah aplikasi, pembaruan lokasi bisa berhenti.</li>
              <li>Hanya orang yang punya kode pantau dapat melihat lokasi terakhir beserta waktu pembaruannya. Posisi tidak selalu bergerak setiap detik.</li>
              <li>Kode pantau berhenti berlaku saat Anda tiba, menyelesaikan touring, atau setelah 2 × 24 jam.</li>
            </ul>
            <button type="button" className="button button-primary button-full" autoFocus onClick={() => router.push(`/perjalanan/${createdTripId}`)}>Paham, buka perjalanan</button>
          </section>
        </div>
      )}
    </>
  );
}
