import Link from "next/link";
import { CloudOff, RotateCcw } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function OfflinePage() {
  return (
    <main className="app-page">
      <header className="app-header"><div className="app-header-inner"><Logo compact /></div></header>
      <div className="page-container"><section className="empty-state"><div className="monitor-entry-icon"><CloudOff size={31} /></div><h1>Anda sedang offline</h1><p>Halaman ini belum tersimpan di perangkat. Sambungkan internet lalu coba lagi. Titik perjalanan yang sudah masuk antrean tetap tersimpan.</p><Link href="/" className="button button-primary"><RotateCcw size={18} /> Coba buka beranda</Link></section></div>
    </main>
  );
}
