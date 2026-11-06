"use client";

import { AlertTriangle, X } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({ open, title, description, confirmLabel, danger, busy, onConfirm, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button className="icon-button modal-close" onClick={onClose} disabled={busy} aria-label="Tutup"><X size={20} /></button>
        <span className={`modal-symbol ${danger ? "danger" : ""}`}><AlertTriangle size={26} /></span>
        <h2 id="dialog-title">{title}</h2>
        <p>{description}</p>
        <div className="modal-actions">
          <button className="button button-secondary" onClick={onClose} disabled={busy}>Batal</button>
          <button className={`button ${danger ? "button-danger" : "button-primary"}`} onClick={onConfirm} disabled={busy}>
            {busy ? <span className="spinner" /> : null}{busy ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
