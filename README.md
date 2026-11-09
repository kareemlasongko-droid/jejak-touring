# JejakTouring

PWA mobile-first untuk membagikan perjalanan mobil secara live kepada keluarga dan komunitas. Dibangun dengan Next.js, Supabase, Leaflet, dan OpenStreetMap.

## Fitur MVP

- Buat perjalanan tanpa layar login melalui Supabase Anonymous Auth.
- Pilih tujuan di peta dan dapatkan kode acak `TRK-XXXXX-XXXXX`.
- Pelacakan GPS, kecepatan, akurasi, dan waktu lokasi terakhir.
- Antrean maksimal 500 titik di `localStorage` saat koneksi terputus.
- Wake Lock untuk membantu layar tetap menyala.
- Tiba otomatis dalam radius 200 meter; batas maksimum perjalanan 2 × 24 jam sejak dibuat.
- SOS dengan keterangan kendala wajib diisi (5–300 karakter), kode pantau baru, dan selesai touring.
- Popup setelah **Buat Perjalanan** menjelaskan izin lokasi, kebutuhan halaman tetap terbuka, dan keterbatasan pembaruan GPS.
- Halaman pantau tanpa login; data diperbarui setiap 15 detik.
- Peringatan **Data lama** setelah 3 menit tanpa lokasi baru.
- RLS per perangkat dan fungsi `pantau()` untuk membatasi akses pemantau.
- Manifest, ikon, service worker, dan halaman offline.
- Dashboard `/admin`: pengunjung hari ini, total pengunjung unik, jumlah perjalanan per status, dan 30 perjalanan terakhir. Akses hanya untuk admin yang ditetapkan di Supabase.

## Menjalankan lokal

```bash
npm install
cp .env.example .env.local
# Isi URL dan publishable/anon public key Supabase
npm run dev
```

Buka `http://localhost:3000`. GPS browser pada perangkat lain memerlukan HTTPS; deployment Vercel sudah menyediakannya.

## Supabase

1. Jalankan semua migrasi di `supabase/migrations/` sesuai urutan nama file (untuk database baru).
2. Di **Authentication → Sign In / Providers**, aktifkan **Allow anonymous sign-ins** untuk peserta dan provider **Email** untuk admin.
3. Jangan pernah memasang `service_role` atau `secret key` pada environment `NEXT_PUBLIC_*`.

### Mengaktifkan admin pertama

1. Di Supabase **Authentication → Users**, gunakan **Add user** untuk membuat akun email dengan kata sandi yang kuat dan konfirmasi emailnya. Tidak ada pendaftaran admin di website.
2. Di **SQL Editor**, jalankan (ganti alamat email dengan akun yang baru dibuat):

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'EMAIL_ADMIN_ANDA'
on conflict do nothing;
```

3. Pastikan 1 baris berhasil dimasukkan. Buka `/admin` dan masuk dengan email/kata sandi tadi, sebaiknya dari browser lain agar tidak mengganti sesi perjalanan peserta.

Dashboard menggunakan fungsi `ringkasan_admin()` yang memeriksa keanggotaan `admin_users` setiap permintaan. Detail form per perjalanan (kendaraan, nopol, supir, penumpang, kontak darurat) baru diminta setelah admin menekan **Lihat detail**, melalui fungsi terpisah `rincian_perjalanan_admin()`. Kedua fungsi memeriksa izin admin; koordinat GPS dan kode pantau tidak dikirim ke dashboard. Tabel pengunjung dan daftar admin tidak bisa dibaca/tulis langsung dari browser. Statistik pengunjung baru dihitung setelah kode pencatatan tayang di website, bukan dari kunjungan sebelumnya. Satu ID acak per browser disimpan di localStorage; data tidak berisi IP/nama/lokasi. Penghapusan data browser atau penggunaan browser lain akan dihitung sebagai pengunjung baru. Statistik **hari ini** memakai zona waktu WIB. Preview dan localhost tidak dihitung.

Skema database:

- `trips`: pemilik anonim, nama panggilan, kendaraan, tujuan, kode, status, dan SOS.
- `locations`: titik GPS milik perjalanan.
- `pantau(p_kode)`: satu-satunya akses pemantau, mengembalikan lokasi terbaru, detail kendaraan/penumpang, dan kontak darurat dari perjalanan aktif. Kontak darurat hanya dibagikan kepada pemegang kode pantau aktif.

Pemantau tidak memiliki izin membaca tabel secara langsung. Kode tidak lagi mengembalikan data setelah status menjadi `tiba`, `selesai`, atau usia perjalanan mencapai 48 jam. Supabase `pg_cron` menandai perjalanan kedaluwarsa sebagai `selesai` tiap menit meskipun HP peserta ditutup; RLS menolak GPS baru tepat setelah 48 jam. Karena browser bisa membatasi GPS di latar belakang, pembaruan lokasi tidak dijamin terus-menerus. Untuk database baru, pastikan extension `pg_cron` tersedia sebelum menjalankan migrasi batas waktu.

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
- SOS beserta keterangan kendala tampil kepada pemegang kode pantau selama perjalanan aktif; bukan panggilan otomatis ke layanan darurat. SOS lama yang dibuat sebelum fitur keterangan dapat tampil tanpa pesan. Pada halaman demo, keterangan SOS hanya disimpan sementara di browser yang sama.
- Titik pada peta bukan jaminan keselamatan peserta.
- Tile OpenStreetMap memerlukan internet dan mengikuti kebijakan penggunaan OSM.

Selalu pasang HP pada dudukan dashboard, sambungkan charger, dan jangan operasikan HP saat mengemudi.
