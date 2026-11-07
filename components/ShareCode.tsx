"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { monitoringLink } from "@/lib/utils";

export function ShareCode({ code, compact = false }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    const url = monitoringLink(code);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Pantau perjalanan saya", text: `Kode pantau: ${code}`, url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className={`share-code ${compact ? "share-code-compact" : ""}`}>
      <div className="code-label">KODE PANTAU</div>
      <strong className="access-code">{code}</strong>
      <p>Bagikan hanya kepada keluarga atau komunitas yang Anda percaya.</p>
      <div className="share-actions">
        <button className="button button-primary" onClick={share}><Share2 size={18} /> Bagikan tautan</button>
        <button className="button button-secondary" onClick={copy}>{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Tersalin" : "Salin"}</button>
      </div>
    </div>
  );
}
