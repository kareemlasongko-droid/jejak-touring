"use client";

import Link from "next/link";
import { ArrowRight, Navigation } from "lucide-react";
import { useEffect, useState } from "react";

export function ResumeTrip() {
  const [tripId, setTripId] = useState<string | null>(null);
  useEffect(() => setTripId(localStorage.getItem("jejaktouring:activeTrip")), []);
  if (!tripId) return null;
  return (
    <Link href={`/perjalanan/${tripId}`} className="resume-card">
      <Navigation size={19} />
      <span><strong>Perjalanan tersimpan di HP ini</strong>Ketuk untuk kembali memantau</span>
      <ArrowRight size={17} />
    </Link>
  );
}
