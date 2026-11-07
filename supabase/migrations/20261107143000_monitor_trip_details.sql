-- Tampilkan detail perjalanan kepada pemegang kode pantau aktif.
-- Akses langsung ke tabel untuk anon tetap tertutup oleh RLS.
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
    t.nickname,
    t.vehicle,
    t.vehicle_info,
    t.license_plate,
    t.driver_name,
    t.adult_count,
    t.child_count,
    t.emergency_contact,
    t.destination_name,
    t.destination_lat,
    t.destination_lng,
    t.status,
    t.sos_at,
    l.lat,
    l.lng,
    l.speed,
    l.accuracy,
    l.recorded_at,
    t.updated_at
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
  limit 1;
$$;

revoke all on function public.pantau(text) from public;
grant execute on function public.pantau(text) to anon, authenticated;

comment on column public.trips.emergency_contact is 'Nomor WhatsApp darurat yang dibagikan kepada pemegang kode pantau aktif untuk keadaan darurat.';
