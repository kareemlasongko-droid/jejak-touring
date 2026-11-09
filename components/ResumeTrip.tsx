"use client";

import Link from "next/link";
import { ArrowRight, Navigation } from "lucide-react";
import { useEffect, useState } from "react";

export function ResumeTrip() {
  const [tripId, setTripId] = useState<string | null>(null);
  useEffect(() => {
    const id = localStorage.getItem("jejaktouring:activeTrip");
    const expiresAt = Number(localStorage.getItem("jejaktouring:activeTripExpiresAt"));
    if (id && expiresAt > 0 && Date.now() >= expiresAt) {
      localStorage.removeItem("jejaktouring:activeTrip");
      localStorage.removeItem("jejaktouring:activeTripExpiresAt");
      return;
    }
    setTripId(id);
  }, []);
  if (!tripId) return null;
  return (
    <Link href={`/perjalanan/${tripId}`} className="resume-card">
      <Navigation size={19} />
      <span><strong>Perjalanan tersimpan di HP ini</strong>Ketuk untuk kembali memantau</span>
      <ArrowRight size={17} />
    </Link>
  );
}
