import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CarFront, Check, Coffee, Eye, Navigation, ShieldCheck, Smartphone, Wifi } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ResumeTrip } from "@/components/ResumeTrip";

export default function Home() {
  return (
    <main className="home-shell">
      <nav className="home-nav" aria-label="Navigasi utama">
        <Logo />
        <div className="nav-note"><ShieldCheck size={16} /><span>Perjalanan aman, keluarga tenang</span></div>
        <a className="coffee-link" href="https://saweria.co/hasbiashiddiqi" target="_blank" rel="noreferrer"><Coffee size={16} /> Traktir kopi</a>
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

        <div className="hero-visual" aria-label="Contoh perjalanan touring Jakarta menuju Bandung">
          <div className="visual-note"><Navigation size={15} /> Menuju tujuan bersama</div>
          <div className="demo-window">
            <div className="demo-top"><span>CONTOH PERJALANAN</span><div className="live-pill"><i className="live-dot" /> LIVE</div></div>
            <div className="demo-map hero-banner-frame">
              <svg className="hero-map-decoration" viewBox="0 0 500 500" fill="none" aria-hidden="true">
                <path d="M-30 108C65 67 116 122 179 89s124-23 180 9 94 24 167-13M-25 402c83-38 136-6 184 26s101 12 149-31 115-53 211-18M71-30c18 74-16 119 9 166s69 51 58 115-33 97-11 161M417-20c-37 68-11 116 9 158s-3 89-38 124-29 87-2 129" stroke="#3a3d31" strokeWidth="14" />
                <path d="M-30 108C65 67 116 122 179 89s124-23 180 9 94 24 167-13M-25 402c83-38 136-6 184 26s101 12 149-31 115-53 211-18M71-30c18 74-16 119 9 166s69 51 58 115-33 97-11 161M417-20c-37 68-11 116 9 158s-3 89-38 124-29 87-2 129" stroke="#626550" strokeWidth="2" strokeDasharray="6 11" />
                <path d="M38 384c63-48 88-9 133-71s69-53 113-87 82-43 124-105" stroke="#f7c948" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 10" opacity=".7" />
                <circle cx="38" cy="384" r="9" fill="#f7c948" /><circle cx="408" cy="121" r="9" fill="#f7c948" />
              </svg>
              <div className="hero-banner-image-wrap">
                <Image
                  src="/images/hero-banner.jpg"
                  alt="Mobil Panther touring dari Jakarta menuju Bandung dengan informasi lokasi, kecepatan, dan SOS"
                  width={500}
                  height={500}
                  sizes="(max-width: 600px) 82vw, (max-width: 850px) 480px, 38vw"
                  className="hero-banner-image"
                  priority
                />
              </div>
              <div className="hero-journey-progress" aria-label="Progress perjalanan 62 persen">
                <div className="hero-progress-label"><span>Perjalanan</span><strong>62%</strong></div>
                <div className="hero-progress-track"><span /></div>
                <div className="hero-progress-cities"><span>Jakarta</span><span>Bandung</span></div>
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
