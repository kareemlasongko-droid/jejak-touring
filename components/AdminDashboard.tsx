"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BarChart3, ChevronDown, LogOut, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

type RecentTrip = {
  id: string;
  nickname: string;
  vehicle: string;
  destination_name: string;
  status: "aktif" | "tiba" | "selesai";
  created_at: string;
};

type TripDetails = {
  vehicle_info: string | null;
  license_plate: string | null;
  driver_name: string | null;
  adult_count: number | null;
  child_count: number | null;
  emergency_contact: string | null;
};

function valueOrEmpty(value: string | null) {
  return value?.trim() || "Tidak diisi";
}

type Summary = {
  visitors_today: number;
  visitors_total: number;
  trips_total: number;
  trips_active: number;
  trips_arrived: number;
  trips_finished: number;
  recent_trips: RecentTrip[];
};

const dateFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta",
});

export function AdminDashboard() {
  const [view, setView] = useState<"loading" | "login" | "dashboard" | "denied" | "error">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const requestedTripId = useRef<string | null>(null);

  async function toggleDetails(id: string) {
    if (requestedTripId.current === id) {
      requestedTripId.current = null;
      setSelectedTripId(null);
      setTripDetails(null);
      setDetailsLoading(false);
      return;
    }
    requestedTripId.current = id;
    setSelectedTripId(id);
    setTripDetails(null);
    setDetailsError("");
    setDetailsLoading(true);
    const { data, error: detailError } = await supabase.rpc("rincian_perjalanan_admin", { p_trip_id: id });
    if (requestedTripId.current !== id) return;
    setDetailsLoading(false);
    if (detailError || !data) {
      setDetailsError(detailError?.code === "42501" ? "Akses admin tidak berlaku lagi. Masuk ulang untuk melihat detail." : "Detail belum dapat dimuat. Tutup lalu buka kembali untuk mencoba lagi.");
      return;
    }
    setTripDetails(data as TripDetails);
  }

  async function loadSummary() {
    setBusy(true);
    const { data, error: requestError } = await supabase.rpc("ringkasan_admin");
    setBusy(false);
    if (requestError) {
      if (requestError.code === "42501") {
        setView("denied");
        setError("Akun ini belum diberi akses admin.");
      } else {
        setView("error");
        setError("Dashboard belum dapat dimuat. Periksa koneksi atau migrasi database, lalu coba lagi.");
      }
      return;
    }
    requestedTripId.current = null;
    setSelectedTripId(null);
    setTripDetails(null);
    setSummary(data as Summary);
    setView("dashboard");
    setError("");
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data, error: authError }) => {
      if (!mounted) return;
      if (authError || !data.user || data.user.is_anonymous) {
        setView("login");
        return;
      }
      await loadSummary();
    }).catch(() => { if (mounted) { setError("Tidak dapat terhubung ke Supabase."); setView("login"); } });
    return () => { mounted = false; };
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (loginError) {
      setError("Email atau kata sandi tidak cocok. Pastikan akun admin sudah dibuat di Supabase.");
      return;
    }
    setPassword("");
    await loadSummary();
  }

  async function logout() {
    requestedTripId.current = null;
    setSelectedTripId(null);
    setTripDetails(null);
    await supabase.auth.signOut();
    setSummary(null);
    setView("login");
    setError("");
  }

  return (
    <div className={`admin-dashboard${view === "dashboard" ? "" : " admin-auth-view"}`}>
      <div className="page-heading">
        <div className="step-pill"><ShieldCheck size={15} /> AKSES TERBATAS</div>
        <h1>Dashboard admin</h1>
        <p>Ringkasan pengunjung dan penggunaan fitur touring.</p>
      </div>

      {view === "loading" && <div className="panel admin-message" role="status"><span className="spinner" /> Memeriksa akses admin...</div>}

      {view === "login" && (
        <form className="panel admin-login" onSubmit={login}>
          <h2>Masuk sebagai admin</h2>
          <p className="panel-intro">Gunakan akun email yang sudah diberi izin di Supabase. Peserta touring tidak perlu login.</p>
          {error && <p className="error-box" role="alert">{error}</p>}
          <div className="field"><label htmlFor="admin-email">Email admin</label><input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          <div className="field"><label htmlFor="admin-password">Kata sandi</label><input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
          <button className="button button-primary button-full" disabled={busy}>{busy ? "Masuk..." : "Masuk"}</button>
          <p className="admin-note">Gunakan browser terpisah dari HP yang sedang mengendalikan perjalanan. Login admin di browser yang sama akan mengganti sesi peserta.</p>
        </form>
      )}

      {view === "error" && (
        <section className="panel admin-login"><h2>Belum dapat memuat data</h2><p className="panel-intro" role="alert">{error}</p><button className="button button-secondary" onClick={loadSummary} disabled={busy}><RefreshCw size={16} /> Coba lagi</button></section>
      )}

      {view === "denied" && (
        <section className="panel admin-login">
          <h2>Akses belum diberikan</h2><p className="panel-intro">{error}</p>
          <button className="button button-secondary" onClick={logout}><LogOut size={16} /> Keluar</button>
        </section>
      )}

      {view === "dashboard" && summary && (
        <>
          <div className="admin-toolbar"><span>Data pengunjung dihitung sejak fitur ini diaktifkan · WIB</span><div><button className="button button-secondary" onClick={loadSummary} disabled={busy}><RefreshCw size={16} /> {busy ? "Memuat..." : "Perbarui"}</button><button className="button button-secondary" onClick={logout}><LogOut size={16} /> Keluar</button></div></div>
          {error && <p className="error-box" role="alert">{error}</p>}
          <div className="admin-section-title"><Users size={18} /><h2>Pengunjung</h2></div>
          <div className="admin-stats admin-stats-two">
            <div className="panel admin-stat"><span>Pengunjung hari ini</span><strong>{summary.visitors_today.toLocaleString("id-ID")}</strong></div>
            <div className="panel admin-stat"><span>Total pengunjung unik</span><strong>{summary.visitors_total.toLocaleString("id-ID")}</strong></div>
          </div>
          <div className="admin-section-title"><BarChart3 size={18} /><h2>Perjalanan touring</h2></div>
          <div className="admin-stats">
            <div className="panel admin-stat"><span>Total dibuat</span><strong>{summary.trips_total.toLocaleString("id-ID")}</strong></div>
            <div className="panel admin-stat"><span>Aktif</span><strong>{summary.trips_active.toLocaleString("id-ID")}</strong></div>
            <div className="panel admin-stat"><span>Tiba otomatis</span><strong>{summary.trips_arrived.toLocaleString("id-ID")}</strong></div>
            <div className="panel admin-stat"><span>Selesai (manual / 48 jam)</span><strong>{summary.trips_finished.toLocaleString("id-ID")}</strong></div>
          </div>
          <section className="panel admin-trips">
            <h2>Perjalanan terbaru</h2><p className="panel-intro">30 perjalanan terakhir. Detail form hanya dimuat saat dibuka oleh admin; lokasi GPS dan kode pantau tidak ditampilkan.</p>
            {summary.recent_trips.length === 0 ? <p className="admin-empty">Belum ada perjalanan.</p> : (
              <div className="admin-trip-list">
                {summary.recent_trips.map((trip) => (
                  <div className="admin-trip-item" key={trip.id}>
                    <div className="admin-trip">
                      <div>
                        <strong>{trip.nickname}</strong>
                        <small>{trip.vehicle === "motor" ? "Motor" : "Mobil"} · {trip.destination_name} · {dateFormat.format(new Date(trip.created_at))} WIB</small>
                        <button className="admin-detail-toggle" type="button" aria-expanded={selectedTripId === trip.id} aria-controls={selectedTripId === trip.id ? `admin-details-${trip.id}` : undefined} onClick={() => toggleDetails(trip.id)}>
                          {selectedTripId === trip.id ? "Tutup detail" : "Lihat detail"} <ChevronDown size={15} aria-hidden="true" />
                        </button>
                      </div>
                      <span className={`admin-trip-status ${trip.status}`}>{trip.status}</span>
                    </div>
                    {selectedTripId === trip.id && (
                      <div className="admin-trip-details" id={`admin-details-${trip.id}`} role="region" aria-label={`Detail perjalanan ${trip.nickname}`}>
                        {detailsLoading && <p role="status">Memuat detail...</p>}
                        {detailsError && <p role="alert">{detailsError}</p>}
                        {tripDetails && (
                          <dl className="admin-details-grid">
                            <div><dt>Nama perjalanan</dt><dd>{trip.nickname}</dd></div>
                            <div><dt>Tujuan perjalanan</dt><dd>{trip.destination_name}</dd></div>
                            <div><dt>Jenis kendaraan</dt><dd>{trip.vehicle === "motor" ? "Motor" : "Mobil"}</dd></div>
                            <div><dt>Informasi kendaraan</dt><dd>{valueOrEmpty(tripDetails.vehicle_info)}</dd></div>
                            <div><dt>Nopol kendaraan</dt><dd>{valueOrEmpty(tripDetails.license_plate)}</dd></div>
                            <div><dt>Supir/pilot</dt><dd>{valueOrEmpty(tripDetails.driver_name)}</dd></div>
                            <div><dt>Penumpang dewasa</dt><dd>{tripDetails.adult_count === null ? "Tidak diisi" : `${tripDetails.adult_count} orang`}</dd></div>
                            <div><dt>Penumpang anak</dt><dd>{tripDetails.child_count === null ? "Tidak diisi" : `${tripDetails.child_count} orang`}</dd></div>
                            <div><dt>Kontak darurat</dt><dd>{valueOrEmpty(tripDetails.emergency_contact)}</dd></div>
                          </dl>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
