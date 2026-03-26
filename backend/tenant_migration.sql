-- Run once in Supabase SQL editor for hospital-level data isolation + map coordinates

alter table if exists beds add column if not exists hospital_email text;
alter table if exists beds add column if not exists hospital_name text;

alter table if exists blood_bank add column if not exists hospital_email text;
alter table if exists blood_bank add column if not exists hospital_name text;

alter table if exists oxygen_units add column if not exists hospital_email text;
alter table if exists oxygen_units add column if not exists hospital_name text;

alter table if exists ambulances add column if not exists hospital_email text;
alter table if exists ambulances add column if not exists hospital_name text;
alter table if exists ambulances add column if not exists latitude double precision;
alter table if exists ambulances add column if not exists longitude double precision;

alter table if exists staff add column if not exists hospital_email text;
alter table if exists staff add column if not exists hospital_name text;

alter table if exists emergencies add column if not exists hospital_email text;
alter table if exists emergencies add column if not exists hospital_name text;
alter table if exists emergencies add column if not exists latitude double precision;
alter table if exists emergencies add column if not exists longitude double precision;

alter table if exists activity_log add column if not exists hospital_email text;
alter table if exists activity_log add column if not exists hospital_name text;

do $$
begin
	if to_regclass('public.beds') is not null then
		execute 'create index if not exists idx_beds_hospital_email on beds (hospital_email)';
	end if;
	if to_regclass('public.blood_bank') is not null then
		execute 'create index if not exists idx_blood_bank_hospital_email on blood_bank (hospital_email)';
	end if;
	if to_regclass('public.oxygen_units') is not null then
		execute 'create index if not exists idx_oxygen_units_hospital_email on oxygen_units (hospital_email)';
	end if;
	if to_regclass('public.ambulances') is not null then
		execute 'create index if not exists idx_ambulances_hospital_email on ambulances (hospital_email)';
	end if;
	if to_regclass('public.staff') is not null then
		execute 'create index if not exists idx_staff_hospital_email on staff (hospital_email)';
	end if;
	if to_regclass('public.emergencies') is not null then
		execute 'create index if not exists idx_emergencies_hospital_email on emergencies (hospital_email)';
	end if;
	if to_regclass('public.activity_log') is not null then
		execute 'create index if not exists idx_activity_log_hospital_email on activity_log (hospital_email)';
	end if;
end $$;
