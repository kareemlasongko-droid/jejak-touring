import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MonitorEntry } from "@/components/MonitorEntry";

export const metadata: Metadata = { title: "Pantau perjalanan" };

export default function MonitorPage() {
  return (
    <main className="app-page">
      <AppHeader />
      <div className="page-container"><div className="page-back"><Link href="/" className="back-link"><ArrowLeft size={16} /> Kembali</Link></div><MonitorEntry /></div>
    </main>
  );
}
