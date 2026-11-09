import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { StartForm } from "@/components/StartForm";

export const metadata: Metadata = { title: "Mulai touring" };

export default function StartPage() {
  return (
    <main className="app-page start-page">
      <AppHeader />
      <div className="page-container start-page-container">
        <div className="page-back"><Link href="/" className="back-link"><ArrowLeft size={16} /> Kembali</Link></div>
        <div className="page-heading"><div className="step-pill"><ShieldCheck size={14} /> SIAP BERANGKAT</div><h1>Mulai perjalanan Anda</h1></div>
        <StartForm />
      </div>
    </main>
  );
}
