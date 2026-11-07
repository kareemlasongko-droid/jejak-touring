"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { CarFront, Info, Save, UsersRound, X } from "lucide-react";

export type VehicleDetails = {
  vehicleInfo: string;
  licensePlate: string;
};

export type OccupantDetails = {
  driverName: string;
  adultCount: number | null;
  childCount: number | null;
  emergencyContact: string;
};

type ModalShellProps = {
  title: string;
  description: string;
  icon: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  children: ReactNode;
};

function ModalShell({ title, description, icon, onClose, onSubmit, children }: ModalShellProps) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", escape);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="trip-modal-title">
        <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Tutup popup"><X size={20} /></button>
        <span className="modal-symbol">{icon}</span>
        <h2 id="trip-modal-title">{title}</h2>
        <p>{description}</p>
        <form onSubmit={onSubmit}>
          {children}
          <div className="modal-actions modal-form-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="button button-primary"><Save size={17} /> Simpan</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function VehicleModal({ initial, onClose, onSave }: { initial: VehicleDetails; onClose: () => void; onSave: (value: VehicleDetails) => void }) {
  const [vehicleInfo, setVehicleInfo] = useState(initial.vehicleInfo);
  const [licensePlate, setLicensePlate] = useState(initial.licensePlate);

  return (
    <ModalShell title="Informasi kendaraan" description="Isi agar peserta lain mudah mengenali kendaraan Anda. Keduanya boleh dikosongkan." icon={<CarFront size={25} />} onClose={onClose} onSubmit={(event) => { event.preventDefault(); onSave({ vehicleInfo: vehicleInfo.trim(), licensePlate: licensePlate.trim().toUpperCase() }); }}>
      <div className="field">
        <label htmlFor="vehicle-info">Kendaraan <span className="optional-label">(opsional)</span></label>
        <input id="vehicle-info" value={vehicleInfo} onChange={(event) => setVehicleInfo(event.target.value)} placeholder="Contoh: Panther touring 2001 coklat" maxLength={80} autoFocus />
      </div>
      <div className="field">
        <label htmlFor="license-plate">Nopol kendaraan <span className="optional-label">(opsional)</span></label>
        <input id="license-plate" value={licensePlate} onChange={(event) => setLicensePlate(event.target.value.toUpperCase())} placeholder="Contoh: B 1234 XYZ" maxLength={20} autoCapitalize="characters" />
      </div>
    </ModalShell>
  );
}

export function OccupantModal({ initial, onClose, onSave }: { initial: OccupantDetails; onClose: () => void; onSave: (value: OccupantDetails) => void }) {
  const [driverName, setDriverName] = useState(initial.driverName);
  const [adultCount, setAdultCount] = useState(initial.adultCount?.toString() ?? "");
  const [childCount, setChildCount] = useState(initial.childCount?.toString() ?? "");
  const [emergencyContact, setEmergencyContact] = useState(initial.emergencyContact);
  const [error, setError] = useState("");

  function save(event: FormEvent) {
    event.preventDefault();
    const digits = emergencyContact.replace(/\D/g, "");
    if (driverName.trim().length < 2) {
      setError("Nama supir/pilot wajib diisi minimal 2 huruf.");
      return;
    }
    if (digits.length < 8 || digits.length > 15) {
      setError("Nomor WhatsApp darurat wajib diisi dengan nomor yang valid.");
      return;
    }
    onSave({
      driverName: driverName.trim(),
      adultCount: adultCount === "" ? null : Number(adultCount),
      childCount: childCount === "" ? null : Number(childCount),
      emergencyContact: emergencyContact.trim(),
    });
  }

  return (
    <ModalShell title="Informasi dalam kendaraan" description="Catat siapa yang berkendara dan kontak yang dapat dihubungi dalam keadaan darurat." icon={<UsersRound size={25} />} onClose={onClose} onSubmit={save}>
      {error && <div className="error-box" role="alert">{error}</div>}
      <div className="field">
        <label htmlFor="driver-name">Supir/pilot <span className="required-label">Wajib</span></label>
        <input id="driver-name" value={driverName} onChange={(event) => setDriverName(event.target.value)} placeholder="Nama supir atau pilot" maxLength={60} autoComplete="name" autoFocus required />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="adult-count">Dewasa <span className="optional-label">(opsional)</span></label>
          <input id="adult-count" type="number" min={0} max={50} inputMode="numeric" value={adultCount} onChange={(event) => setAdultCount(event.target.value)} placeholder="0" />
        </div>
        <div className="field">
          <label htmlFor="child-count">Anak <span className="optional-label">(opsional)</span></label>
          <input id="child-count" type="number" min={0} max={50} inputMode="numeric" value={childCount} onChange={(event) => setChildCount(event.target.value)} placeholder="0" />
        </div>
      </div>
      <div className="field">
        <label htmlFor="emergency-contact">Kontak darurat <span className="required-label">Wajib</span></label>
        <input id="emergency-contact" type="tel" inputMode="tel" value={emergencyContact} onChange={(event) => setEmergencyContact(event.target.value)} placeholder="WhatsApp, contoh: 0812 3456 7890" maxLength={25} autoComplete="tel" required />
        <span className="field-hint">Gunakan nomor WhatsApp keluarga atau komunitas yang aktif.</span>
      </div>
      <div className="info-box modal-privacy"><Info size={16} /><span>Kontak darurat hanya ditampilkan kepada pemegang kode pantau aktif untuk keadaan darurat.</span></div>
    </ModalShell>
  );
}
