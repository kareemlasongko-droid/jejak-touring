-- Identitas perjalanan diperlukan untuk mengambil detail satu per satu saat admin membukanya.
-- Fungsi ringkasan tetap tidak mengirim kontak darurat ataupun nomor polisi.
create or replace function public.ringkasan_admin()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if auth.uid() is null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false)
     or not exists (select 1 from public.admin_users where user_id = auth.uid())
  then
    raise exception 'Akses admin ditolak' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'visitors_today', (select count(*) from public.visitor_days where day = (now() at time zone 'Asia/Jakarta')::date),
    'visitors_total', (select count(*) from public.visitors),
    'trips_total', (select count(*) from public.trips),
    'trips_active', (select count(*) from public.trips where status = 'aktif'),
    'trips_arrived', (select count(*) from public.trips where status = 'tiba'),
    'trips_finished', (select count(*) from public.trips where status = 'selesai'),
    'recent_trips', coalesce((
      select jsonb_agg(to_jsonb(recent) order by recent.created_at desc)
      from (
        select id, nickname, vehicle, destination_name, status, created_at
        from public.trips
        order by created_at desc
        limit 30
      ) recent
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
-- Supabase dapat memberi izin EXECUTE kepada anon melalui default privileges.
revoke all on function public.ringkasan_admin() from public, anon, authenticated;
grant execute on function public.ringkasan_admin() to authenticated;

-- Detail pribadi hanya diambil saat admin memilih perjalanan, bukan dalam daftar.
-- Tidak mengembalikan lokasi GPS, koordinat tujuan, atau kode pantau.
create function public.rincian_perjalanan_admin(p_trip_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if auth.uid() is null
     or coalesce((auth.jwt()->>'is_anonymous')::boolean, false)
     or not exists (select 1 from public.admin_users where user_id = auth.uid())
  then
    raise exception 'Akses admin ditolak' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'vehicle_info', t.vehicle_info,
    'license_plate', t.license_plate,
    'driver_name', t.driver_name,
    'adult_count', t.adult_count,
    'child_count', t.child_count,
    'emergency_contact', t.emergency_contact
  ) into result
  from public.trips t
  where t.id = p_trip_id;
  return result;
end;
$$;
revoke all on function public.rincian_perjalanan_admin(uuid) from public, anon, authenticated;
grant execute on function public.rincian_perjalanan_admin(uuid) to authenticated;
