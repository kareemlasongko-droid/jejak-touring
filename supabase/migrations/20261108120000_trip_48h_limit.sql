-- Perjalanan berlaku paling lama 48 jam sejak dibuat, dihitung memakai waktu server.
create extension if not exists pg_cron with schema pg_catalog;

alter table public.trips
  add column end_reason text check (end_reason in ('manual', 'timeout'));

create index trips_active_expiry_idx on public.trips(created_at) where status = 'aktif';

-- Jam mulai tidak dapat dimajukan dan perjalanan selesai tidak dapat diaktifkan lagi.
-- Jika ada perubahan tepat setelah batas waktu, status tetap dipaksa selesai.
create function public.guard_trip_duration()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.status := 'aktif';
    new.ended_at := null;
    new.end_reason := null;
    return new;
  end if;

  if new.created_at is distinct from old.created_at or new.user_id is distinct from old.user_id then
    raise exception 'Waktu mulai dan pemilik perjalanan tidak dapat diubah';
  end if;
  if old.status <> 'aktif' and new.status <> old.status then
    raise exception 'Perjalanan yang sudah berhenti tidak dapat diaktifkan lagi';
  end if;
  if old.status = 'aktif' and now() >= old.created_at + interval '48 hours' then
    new.status := 'selesai';
    new.ended_at := old.created_at + interval '48 hours';
    new.end_reason := 'timeout';
    new.arrived_at := null;
  elsif old.status = 'aktif' and new.status = 'selesai' then
    new.end_reason := 'manual';
    new.ended_at := coalesce(new.ended_at, now());
  end if;
  return new;
end;
$$;

create trigger trips_guard_duration before insert or update on public.trips
for each row execute function public.guard_trip_duration();
revoke all on function public.guard_trip_duration() from public, anon, authenticated;

-- Jangan menerima titik GPS baru ketika batas 48 jam tercapai, termasuk antrean offline.
drop policy if exists "locations_insert_own" on public.locations;
create policy "locations_insert_own" on public.locations
for insert to authenticated with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.trips t
    where t.id = trip_id and t.user_id = auth.uid()
      and t.status = 'aktif'
      and t.created_at > now() - interval '48 hours'
  )
);

-- Pemantau berhenti mendapat data tepat pada batas waktu, sebelum cron berjalan.
create or replace function public.pantau(p_kode text)
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
    t.nickname, t.vehicle, t.vehicle_info, t.license_plate,
    t.driver_name, t.adult_count, t.child_count, t.emergency_contact,
    t.destination_name, t.destination_lat, t.destination_lng, t.status,
    t.sos_at, l.lat, l.lng, l.speed, l.accuracy, l.recorded_at, t.updated_at
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
revoke all on function public.pantau(text) from public;
grant execute on function public.pantau(text) to anon, authenticated;

-- Jadwal satu menit sekali mengubah status yang telah kedaluwarsa, meski semua browser ditutup.
create function public.selesaikan_perjalanan_kedaluwarsa()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.trips
  set status = 'selesai',
      ended_at = created_at + interval '48 hours',
      end_reason = 'timeout'
  where status = 'aktif' and created_at <= now() - interval '48 hours';
$$;
revoke all on function public.selesaikan_perjalanan_kedaluwarsa() from public, anon, authenticated;

select cron.schedule(
  'jejaktouring-expire-trips-48h',
  '* * * * *',
  $$select public.selesaikan_perjalanan_kedaluwarsa()$$
);

-- Rapikan perjalanan lama yang sudah melewati 48 jam.
select public.selesaikan_perjalanan_kedaluwarsa();
