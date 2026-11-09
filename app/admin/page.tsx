import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { AdminDashboard } from "@/components/AdminDashboard";

export const metadata: Metadata = { title: "Dashboard admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <main className="app-page">
      <AppHeader />
      <div className="page-container">
        <div className="page-back"><Link href="/" className="back-link"><ArrowLeft size={16} /> Kembali</Link></div>
        <AdminDashboard />
      </div>
    </main>
  );
}
