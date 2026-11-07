# JejakTouring

PWA mobile-first untuk membagikan perjalanan mobil secara live kepada keluarga dan komunitas. Dibangun dengan Next.js, Supabase, Leaflet, dan OpenStreetMap.

## Fitur MVP

- Buat perjalanan tanpa layar login melalui Supabase Anonymous Auth.
- Pilih tujuan di peta dan dapatkan kode acak `TRK-XXXXX-XXXXX`.
- Pelacakan GPS, kecepatan, akurasi, dan waktu lokasi terakhir.
- Antrean maksimal 500 titik di `localStorage` saat koneksi terputus.
- Wake Lock untuk membantu layar tetap menyala.
- Tiba otomatis dalam radius 200 meter.
- SOS, kode pantau baru, dan selesai touring.
- Halaman pantau tanpa login; data diperbarui setiap 15 detik.
- Peringatan **Data lama** setelah 3 menit tanpa lokasi baru.
- RLS per perangkat dan fungsi `pantau()` untuk membatasi akses pemantau.
- Manifest, ikon, service worker, dan halaman offline.

## Menjalankan lokal

```bash
npm install
cp .env.example .env.local
# Isi URL dan publishable/anon public key Supabase
npm run dev
```

Buka `http://localhost:3000`. GPS browser pada perangkat lain memerlukan HTTPS; deployment Vercel sudah menyediakannya.

## Supabase

1. Jalankan migrasi di `supabase/migrations/20261106120000_initial_jejaktouring.sql`.
2. Di **Authentication → Sign In / Providers**, aktifkan **Allow anonymous sign-ins**.
3. Jangan pernah memasang `service_role` atau `secret key` pada environment `NEXT_PUBLIC_*`.

Skema database:

- `trips`: pemilik anonim, nama panggilan, kendaraan, tujuan, kode, status, dan SOS.
- `locations`: titik GPS milik perjalanan.
- `pantau(p_kode)`: satu-satunya akses pemantau, mengembalikan lokasi terbaru, detail kendaraan/penumpang, dan kontak darurat dari perjalanan aktif. Kontak darurat hanya dibagikan kepada pemegang kode pantau aktif.

Pemantau tidak memiliki izin membaca tabel secara langsung. Kode tidak lagi mengembalikan data setelah status menjadi `tiba` atau `selesai`.

## Environment Vercel

```text
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=PUBLISHABLE_OR_ANON_PUBLIC_KEY
```

Pasang untuk Production, Preview, dan Development.

## Pemeriksaan

```bash
npm run typecheck
npm run build
```

## Batasan penting

- Lokasi hanya dikirim ketika halaman pelacak terbuka. Berpindah aplikasi, membuka tab lain, atau mematikan layar dapat menghentikan GPS.
- Wake Lock tidak tersedia di semua browser dan dapat dilepas oleh sistem.
- Titik dalam antrean baru dikirim setelah internet kembali dan halaman aktif.
- Perjalanan terikat pada sesi browser HP pembuat. Menghapus data browser atau mengganti HP dapat menghilangkan kontrol perjalanan.
- SOS hanya berupa tanda di halaman pemantau; bukan panggilan otomatis ke layanan darurat.
- Titik pada peta bukan jaminan keselamatan peserta.
- Tile OpenStreetMap memerlukan internet dan mengikuti kebijakan penggunaan OSM.

Selalu pasang HP pada dudukan dashboard, sambungkan charger, dan jangan operasikan HP saat mengemudi.
