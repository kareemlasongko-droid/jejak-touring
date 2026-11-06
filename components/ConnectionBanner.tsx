"use client";

import { CloudOff } from "lucide-react";
import { useEffect, useState } from "react";

export function ConnectionBanner() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (online) return null;
  return <div className="connection-banner" role="status"><CloudOff size={17} /> Tidak ada internet. Titik lokasi akan disimpan sementara.</div>;
}
