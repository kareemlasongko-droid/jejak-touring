import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MonitorEntry } from "@/components/MonitorEntry";

export const metadata: Metadata = { title: "Pantau perjalanan" };

export default function MonitorPage() {
  return (
    <main className="app-page">
      <header className="app-header"><div className="app-header-inner"><Logo compact /><Link href="/" className="back-link"><ArrowLeft size={16} /> Kembali</Link></div></header>
      <div className="page-container"><MonitorEntry /></div>
    </main>
  );
}
