import Link from "next/link";
import { Route } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`logo ${compact ? "logo-compact" : ""}`} aria-label="JejakTouring, kembali ke beranda">
      <span className="logo-mark"><Route size={compact ? 20 : 24} strokeWidth={2.5} /></span>
      <span>Jejak<span>Touring</span></span>
    </Link>
  );
}
