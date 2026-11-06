import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { TrackingClient } from "@/components/TrackingClient";

export const metadata: Metadata = { title: "Perjalanan aktif" };

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="app-page">
      <header className="app-header"><div className="app-header-inner"><Logo compact /><Link href="/" className="back-link"><ArrowLeft size={16} /> Beranda</Link></div></header>
      <div className="page-container"><TrackingClient tripId={id} /></div>
    </main>
  );
}
