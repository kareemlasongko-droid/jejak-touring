-- JejakTouring MVP: perjalanan, lokasi, RLS, dan akses pantau berbasis kode.
create extension if not exists pgcrypto;

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 40),
  vehicle text not null default 'mobil' check (vehicle in ('mobil', 'motor')),
  destination_name text not null default 'Tujuan perjalanan' check (char_length(destination_name) <= 100),
  destination_lat double precision not null check (destination_lat between -90 and 90),
  destination_lng double precision not null check (destination_lng between -180 and 180),
  access_code text not null unique check (access_code ~ '^TRK-[A-Z0-9]{5}-[A-Z0-9]{5}$'),
  status text not null default 'aktif' check (status in ('aktif', 'tiba', 'selesai')),
  sos_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  arrived_at timestamptz,
  ended_at timestamptz
);

create table if not exists public.locations (
  id bigint generated always as identity primary key,
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  speed double precision,
  heading double precision,
  accuracy double precision,
  recorded_at timestamptz not null default now()
);

create index if not exists trips_user_status_idx on public.trips(user_id, status);
create index if not exists locations_trip_time_idx on public.locations(trip_id, recorded_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at before update on public.trips
for each row execute function public.set_updated_at();

alter table public.trips enable row level security;
alter table public.locations enable row level security;

-- Pemilik perjalanan adalah sesi anonim pada perangkat yang membuatnya.
drop policy if exists "trips_select_own" on public.trips;
create policy "trips_select_own" on public.trips
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "trips_insert_own" on public.trips;
create policy "trips_insert_own" on public.trips
for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "trips_update_own" on public.trips;
create policy "trips_update_own" on public.trips
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "locations_select_own" on public.locations;
create policy "locations_select_own" on public.locations
for select to authenticated using (auth.uid() = user_id);

drop policy if exists "locations_insert_own" on public.locations;
create policy "locations_insert_own" on public.locations
for insert to authenticated with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.trips t
    where t.id = trip_id and t.user_id = auth.uid() and t.status = 'aktif'
  )
);

-- Tabel tidak dapat dibaca langsung oleh pemantau anon.
revoke all on table public.trips from anon;
revoke all on table public.locations from anon;
revoke delete on table public.trips, public.locations from authenticated;

-- Pemantau hanya mendapat satu lokasi terbaru melalui fungsi ini.
-- Perjalanan tiba/selesai tidak mengembalikan data sehingga kode kedaluwarsa.
create or replace function public.pantau(p_kode text)
returns table (
  nickname text,
  vehicle text,
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
