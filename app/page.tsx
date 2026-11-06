import Link from "next/link";
import { ArrowRight, CarFront, Check, Eye, MapPin, Navigation, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ResumeTrip } from "@/components/ResumeTrip";

export default function Home() {
  return (
    <main className="home-shell">
      <nav className="home-nav" aria-label="Navigasi utama">
        <Logo />
        <div className="nav-note"><ShieldCheck size={16} /><span>Perjalanan aman, keluarga tenang</span></div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">TETAP TERHUBUNG DI SETIAP PERJALANAN</div>
          <h1>Jauh di jalan,<br /><em>tetap dekat.</em></h1>
          <p className="hero-description">Bagikan posisi perjalanan mobil Anda secara live. Keluarga dan komunitas bisa memantau sampai Anda tiba di tujuan.</p>

          <div className="home-actions">
            <ResumeTrip />
            <Link href="/mulai" className="action-card primary">
              <span className="action-icon"><CarFront size={26} /></span>
              <span className="action-text"><strong>Mulai touring</strong><small>Bagikan perjalanan Anda</small></span>
              <ArrowRight className="action-arrow" size={21} />
            </Link>
            <Link href="/pantau" className="action-card secondary">
              <span className="action-icon"><Eye size={24} /></span>
              <span className="action-text"><strong>Pantau perjalanan</strong><small>Gunakan kode dari peserta</small></span>
              <ArrowRight className="action-arrow" size={21} />
            </Link>
          </div>

          <div className="home-assurances">
            <span><Check size={13} /> Tanpa daftar</span>
            <span><Check size={13} /> Mudah digunakan</span>
            <span><Check size={13} /> Gratis</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Contoh tampilan pemantauan perjalanan">
          <div className="visual-note"><Navigation size={15} /> Menuju tujuan bersama</div>
          <div className="demo-window">
            <div className="demo-top"><span>CONTOH PERJALANAN</span><div className="live-pill"><i className="live-dot" /> LIVE</div></div>
            <div className="demo-map">
              <svg viewBox="0 0 480 330" fill="none" aria-hidden="true">
                <path d="M-30 72C81 104 113 49 190 78s107 2 181-20 108-5 148 17M-20 280c88-12 112-75 184-52s101 92 172 65 93-68 166-57M59-20c29 74-11 109 11 165s76 58 70 124-29 74-15 103M379-20c-38 65-11 121 13 151s5 91-31 129-34 76-19 107" stroke="#34372c" strokeWidth="18" />
                <path d="M-30 72C81 104 113 49 190 78s107 2 181-20 108-5 148 17M-20 280c88-12 112-75 184-52s101 92 172 65 93-68 166-57M59-20c29 74-11 109 11 165s76 58 70 124-29 74-15 103M379-20c-38 65-11 121 13 151s5 91-31 129-34 76-19 107" stroke="#45483a" strokeWidth="2" strokeDasharray="8 12" />
                <path d="M100 253c32-71 78-39 112-98s83-27 132-76" stroke="#f7c948" strokeWidth="4" strokeLinecap="round" strokeDasharray="7 10" />
                <circle cx="100" cy="253" r="13" fill="#f7c948" fillOpacity=".18" /><circle cx="100" cy="253" r="7" fill="#f7c948" stroke="#fff0b0" strokeWidth="3" />
                <path d="M344 61c-11 0-20 9-20 20 0 15 20 32 20 32s20-17 20-32c0-11-9-20-20-20Z" fill="#f7c948" /><circle cx="344" cy="81" r="6" fill="#24251d" />
                <g fill="#2b2e25"><rect x="170" y="15" width="54" height="29" rx="5" /><rect x="248" y="112" width="65" height="38" rx="6" /><rect x="22" y="140" width="54" height="36" rx="6" /><rect x="396" y="185" width="55" height="40" rx="6" /></g>
              </svg>
              <div className="demo-driver">
                <div className="driver-row">
                  <div className="driver-avatar"><CarFront size={22} /></div>
                  <div className="driver-info"><strong>Dimas &amp; Keluarga</strong><small><MapPin size={10} /> Menuju Bandung</small></div>
                  <div className="driver-speed"><strong>64</strong><small>km/j</small></div>
                </div>
                <div className="demo-progress"><span /></div>
                <div className="demo-caption"><span>Posisi diperbarui baru saja</span><span>62% perjalanan</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="safety-note">
        <div className="safety-note-inner"><Smartphone size={16} /><span>Untuk peserta: pasang HP di dudukan dashboard, sambungkan charger, dan jangan operasikan HP saat mengemudi. Lokasi hanya dikirim saat halaman JejakTouring terbuka.</span><Wifi size={16} /></div>
      </footer>
    </main>
  );
}
