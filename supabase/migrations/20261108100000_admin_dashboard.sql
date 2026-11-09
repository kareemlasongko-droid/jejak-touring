-- Statistik kunjungan tanpa IP, nama, atau lokasi. ID acak disimpan di browser.
create table public.visitors (
  id uuid primary key,
  first_seen_at timestamptz not null default now()
);
create table public.visitor_days (
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  day date not null,
  primary key (visitor_id, day)
);
create index visitor_days_day_idx on public.visitor_days(day);

-- Keanggotaan admin hanya dapat diberikan melalui SQL/Dashboard Supabase.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.visitors enable row level security;
alter table public.visitor_days enable row level security;
alter table public.admin_users enable row level security;
revoke all on public.visitors, public.visitor_days, public.admin_users from anon, authenticated;

-- Tidak ada endpoint baca/tulis tabel pengunjung yang terbuka bagi browser.
create function public.catat_kunjungan(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_id is null then return; end if;
  insert into public.visitors(id) values (p_id) on conflict do nothing;
  insert into public.visitor_days(visitor_id, day)
  values (p_id, (now() at time zone 'Asia/Jakarta')::date)
  on conflict do nothing;
end;
$$;
revoke all on function public.catat_kunjungan(uuid) from public;
grant execute on function public.catat_kunjungan(uuid) to anon, authenticated;

-- Hanya user email yang telah ditetapkan sebagai admin yang bisa membaca ringkasan.
-- Sengaja tidak mengembalikan koordinat GPS, kode, kontak, atau nomor polisi.
create function public.ringkasan_admin()
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
        select nickname, vehicle, destination_name, status, created_at
        from public.trips
        order by created_at desc
        limit 30
      ) recent
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.ringkasan_admin() from public, anon, authenticated;
grant execute on function public.ringkasan_admin() to authenticated;
