import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { MonitorClient } from "@/components/MonitorClient";

export const metadata: Metadata = { title: "Pantau live", robots: { index: false, follow: false } };

export default async function MonitoringPage({ params }: { params: Promise<{ kode: string }> }) {
  const { kode } = await params;
  const code = decodeURIComponent(kode).toUpperCase();
  return (
    <main className="app-page">
      <AppHeader />
      <div className="page-container monitor-page-container"><div className="page-back"><Link href="/pantau" className="back-link"><ArrowLeft size={16} /> Kembali</Link></div><MonitorClient code={code} /></div>
    </main>
  );
}
