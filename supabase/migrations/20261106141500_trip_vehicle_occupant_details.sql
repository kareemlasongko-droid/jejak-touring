-- Detail kendaraan dan penumpang untuk pembuatan perjalanan.
-- Kontak darurat hanya dapat dibaca pemilik melalui RLS dan tidak dikeluarkan oleh pantau().
alter table public.trips
  add column if not exists vehicle_info text,
  add column if not exists license_plate text,
  add column if not exists driver_name text,
  add column if not exists adult_count integer,
  add column if not exists child_count integer,
  add column if not exists emergency_contact text;

alter table public.trips
  add constraint trips_vehicle_info_length check (vehicle_info is null or char_length(vehicle_info) <= 80),
  add constraint trips_license_plate_length check (license_plate is null or char_length(license_plate) <= 20),
  add constraint trips_driver_name_length check (driver_name is null or char_length(driver_name) between 2 and 60),
  add constraint trips_adult_count_range check (adult_count is null or adult_count between 0 and 50),
  add constraint trips_child_count_range check (child_count is null or child_count between 0 and 50),
  add constraint trips_emergency_contact_length check (emergency_contact is null or char_length(emergency_contact) <= 25);

comment on column public.trips.emergency_contact is 'Nomor WhatsApp darurat milik pemilik perjalanan; jangan expose melalui fungsi pantau().';
