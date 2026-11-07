import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { TrackingClient } from "@/components/TrackingClient";

export const metadata: Metadata = { title: "Perjalanan aktif" };

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="app-page">
      <AppHeader />
      <div className="page-container"><div className="page-back"><Link href="/" className="back-link"><ArrowLeft size={16} /> Kembali</Link></div><TrackingClient tripId={id} /></div>
    </main>
  );
}
