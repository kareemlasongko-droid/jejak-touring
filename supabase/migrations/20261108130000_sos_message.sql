-- Peserta dapat menjelaskan kendala saat mengaktifkan SOS.
-- Nullable untuk SOS lama dan kompatibilitas dengan klien yang belum diperbarui.
alter table public.trips
  add column sos_message text check (sos_message is null or char_length(btrim(sos_message)) between 5 and 300);

-- Pemegang kode aktif melihat keterangan SOS bersama waktu kejadian.
-- Akses langsung tabel trips bagi anon tetap ditutup, dan batas 48 jam tetap berlaku.
drop function public.pantau(text);
create function public.pantau(p_kode text)
returns table (
  nickname text,
  vehicle text,
  vehicle_info text,
  license_plate text,
  driver_name text,
  adult_count integer,
  child_count integer,
  emergency_contact text,
  destination_name text,
  destination_lat double precision,
  destination_lng double precision,
  status text,
  sos_at timestamptz,
  sos_message text,
  latitude double precision,
  longitude double precision,
  speed double precision,
  accuracy double precision,
  recorded_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    t.nickname, t.vehicle, t.vehicle_info, t.license_plate,
    t.driver_name, t.adult_count, t.child_count, t.emergency_contact,
    t.destination_name, t.destination_lat, t.destination_lng, t.status,
    t.sos_at, t.sos_message,
    l.lat, l.lng, l.speed, l.accuracy, l.recorded_at, t.updated_at
  from public.trips t
  left join lateral (
    select loc.lat, loc.lng, loc.speed, loc.accuracy, loc.recorded_at
    from public.locations loc
    where loc.trip_id = t.id
    order by loc.recorded_at desc
    limit 1
  ) l on true
  where t.access_code = upper(trim(p_kode))
    and t.status = 'aktif'
    and t.created_at > now() - interval '48 hours'
  limit 1;
$$;
revoke all on function public.pantau(text) from public, anon, authenticated;
grant execute on function public.pantau(text) to anon, authenticated;
