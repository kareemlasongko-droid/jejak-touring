import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

export default function NotFound() {
  return <main className="app-page"><section className="empty-state"><div className="monitor-entry-icon"><MapPin size={30} /></div><h1>Halaman tidak ditemukan</h1><p>Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.</p><Link href="/" className="button button-primary"><ArrowLeft size={18} /> Kembali ke beranda</Link></section></main>;
}
