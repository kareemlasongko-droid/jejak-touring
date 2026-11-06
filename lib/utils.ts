export function createAccessCode() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const random = new Uint32Array(10);
  crypto.getRandomValues(random);
  const part = (offset: number) =>
    Array.from(random.slice(offset, offset + 5), (value) => alphabet[value % alphabet.length]).join("");
  return `TRK-${part(0)}-${part(5)}`;
}

export function monitoringLink(code: string) {
  return `${window.location.origin}/pantau/${encodeURIComponent(code)}`;
}

export function formatTime(value?: string | null) {
  if (!value) return "Belum ada";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function relativeTime(value?: string | null) {
  if (!value) return "Belum ada lokasi";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 10) return "Baru saja";
  if (seconds < 60) return `${seconds} detik lalu`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  return `${Math.floor(minutes / 60)} jam lalu`;
}

export function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radius = 6371000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
