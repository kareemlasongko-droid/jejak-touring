"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const ID_KEY = "jejaktouring:visitorId";
const DAY_KEY = "jejaktouring:visitorDay";

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".e2b.app") ||
      (host.endsWith(".vercel.app") && host !== "jejak-touring.vercel.app")) return;
    try {
      // Tanggal Jakarta sama dengan tanggal yang digunakan di database.
      const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      if (localStorage.getItem(DAY_KEY) === day) return;
      let id = localStorage.getItem(ID_KEY);
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        id = crypto.randomUUID();
        localStorage.setItem(ID_KEY, id);
      }
      supabase.rpc("catat_kunjungan", { p_id: id }).then(({ error }) => {
        if (!error) localStorage.setItem(DAY_KEY, day);
      });
    } catch {
      // Analytics tidak boleh menghalangi penggunaan aplikasi.
    }
  }, [pathname]);

  return null;
}
