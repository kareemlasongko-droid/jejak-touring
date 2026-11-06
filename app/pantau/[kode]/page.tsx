import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { Logo } from "@/components/Logo";
import { MonitorClient } from "@/components/MonitorClient";

export const metadata: Metadata = { title: "Pantau live", robots: { index: false, follow: false } };

export default async function MonitoringPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  const code = decodeURIComponent(kode).toUpperCase();
  return (
    <main className="app-page">
      <header className="app-header"><div className="app-header-inner"><Logo compact /><Link href="/pantau" className="back-link"><ArrowLeft size={16} /> Kode lain</Link></div></header>
      <div className="page-container monitor-page-container"><MonitorClient code={code} /></div>
    </main>
  );
}
