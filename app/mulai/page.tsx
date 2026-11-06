import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { StartForm } from "@/components/StartForm";

export const metadata: Metadata = { title: "Mulai touring" };

export default function StartPage() {
  return (
    <main className="app-page">
      <header className="app-header"><div className="app-header-inner"><Logo compact /><Link href="/" className="back-link"><ArrowLeft size={16} /> Kembali</Link></div></header>
      <div className="page-container">
        <div className="page-heading"><div className="step-pill"><ShieldCheck size={14} /> SIAP BERANGKAT</div><h1>Mulai perjalanan Anda</h1><p>Isi nama panggilan dan pilih tujuan. Setelah itu, bagikan kode pantau kepada keluarga atau komunitas.</p></div>
        <StartForm />
      </div>
    </main>
  );
}
