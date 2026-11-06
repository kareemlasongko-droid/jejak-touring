"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, KeyRound, LockKeyhole, MapPin } from "lucide-react";

export function MonitorEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!/^TRK-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(normalized)) {
      setError("Periksa kembali kode. Contoh format: TRK-7K4M9-Q2XRA.");
      return;
    }
    router.push(`/pantau/${encodeURIComponent(normalized)}`);
  }

  return (
    <div className="monitor-entry">
      <div className="monitor-entry-icon"><Eye size={34} /></div>
      <div className="page-heading"><h1>Pantau perjalanan</h1><p>Masukkan kode yang dibagikan peserta. Anda tidak perlu masuk atau membuat akun.</p></div>
      <section className="panel">
        <form onSubmit={submit}>
          {error && <div className="error-box" role="alert">{error}</div>}
          <div className="field"><label htmlFor="access-code">Kode pantau</label><input id="access-code" className="code-input" value={code} onChange={(event) => { setCode(event.target.value.toUpperCase()); setError(""); }} placeholder="TRK-XXXXX-XXXXX" maxLength={15} autoCapitalize="characters" autoComplete="off" spellCheck={false} required /></div>
          <button className="button button-primary button-full"><Eye size={19} /> Lihat perjalanan <ArrowRight size={18} /></button>
        </form>
        <div className="privacy-list">
          <div className="privacy-item"><KeyRound size={18} /><span>Kode bersifat pribadi. Mintalah hanya kepada peserta yang Anda kenal.</span></div>
          <div className="privacy-item"><MapPin size={18} /><span>Anda hanya dapat melihat perjalanan, tidak dapat mengubah atau menghentikannya.</span></div>
          <div className="privacy-item"><LockKeyhole size={18} /><span>Akses berhenti otomatis saat peserta tiba atau menyelesaikan perjalanan.</span></div>
        </div>
      </section>
    </div>
  );
}
