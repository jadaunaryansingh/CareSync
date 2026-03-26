-- ============================================================
-- CareSync Hospital Portal — Supabase Schema
-- Run this ONCE in the Supabase SQL Editor
-- Project: cdilbpqmtmvtxhayqhgx
-- ============================================================

-- ==================== BEDS ====================
create table if not exists beds (
  id            text primary key,
  ward          text not null,
  num           int  not null,
  status        text not null default 'available'
                check (status in ('available','occupied','reserved','maintenance')),
  patient_name  text,
  patient_age   int,
  diagnosis     text,
  doctor        text,
  admitted_at   timestamptz,
  created_at    timestamptz default now()
);

-- ==================== BLOOD BANK ====================
create table if not exists blood_bank (
  id         uuid primary key default gen_random_uuid(),
  blood_type text unique not null,
  units      int  not null default 0,
  capacity   int  not null default 100
);

-- ==================== OXYGEN UNITS ====================
create table if not exists oxygen_units (
  id        text primary key,
  name      text not null,
  pct       int  not null default 100,
  location  text,
  type      text,
  kpa       int,
  flow_rate text
);

-- ==================== AMBULANCES ====================
create table if not exists ambulances (
  id           text primary key,
  reg          text unique not null,
  driver       text,
  contact      text,
  status       text not null default 'available'
               check (status in ('available','active','maintenance')),
  location     text default 'Hospital Base',
  eta          text default '-',
  patient      text default '-',
  last_service date,
  fuel         int  default 100,
  type         text default 'BLS'
);

-- ==================== STAFF ====================
create table if not exists staff (
  id        text primary key,
  name      text not null,
  role      text,
  dept      text,
  shift     text default 'Morning',
  status    text not null default 'on-duty'
            check (status in ('on-duty','off-duty','on-leave')),
  phone     text,
  email     text,
  join_date date default current_date
);

-- ==================== EMERGENCIES ====================
create table if not exists emergencies (
  id           text primary key,
  type         text not null,
  patient      text,
  location     text,
  priority     text not null default 'medium'
               check (priority in ('critical','high','medium')),
  status       text not null default 'pending'
               check (status in ('pending','approved','declined','resolved')),
  caller       text,
  details      text,
  requested_by text,
  created_at   timestamptz default now()
);

-- ==================== ACTIVITY LOG ====================
create table if not exists activity_log (
  id         uuid primary key default gen_random_uuid(),
  msg        text not null,
  color      text default 'blue',
  created_at timestamptz default now()
);

-- ==================== DISABLE RLS (admin portal) ====================
alter table beds         disable row level security;
alter table blood_bank   disable row level security;
alter table oxygen_units disable row level security;
alter table ambulances   disable row level security;
alter table staff        disable row level security;
alter table emergencies  disable row level security;
alter table activity_log disable row level security;

-- ==================== SEED: BEDS ====================
insert into beds (id, ward, num, status, patient_name, patient_age, diagnosis, doctor, admitted_at) values
('ICU-01','ICU',1,'occupied','Ramesh Gupta',61,'Cardiac Failure','Dr. Mehta',now() - interval '2 days'),
('ICU-02','ICU',2,'occupied','Sita Devi',45,'Post-Op Recovery','Dr. Sharma',now() - interval '1 day'),
('ICU-03','ICU',3,'available',null,null,null,null,null),
('ICU-04','ICU',4,'occupied','Arun Kumar',38,'Respiratory Distress','Dr. Nair',now() - interval '3 days'),
('ICU-05','ICU',5,'reserved',null,null,null,null,null),
('ICU-06','ICU',6,'available',null,null,null,null,null),
('ICU-07','ICU',7,'occupied','Priya Verma',52,'Stroke Recovery','Dr. Rao',now() - interval '4 days'),
('ICU-08','ICU',8,'maintenance',null,null,null,null,null),
('ICU-09','ICU',9,'available',null,null,null,null,null),
('ICU-10','ICU',10,'occupied','Mohan Sharma',67,'Heart Arrhythmia','Dr. Khan',now() - interval '1 day'),
('ICU-11','ICU',11,'available',null,null,null,null,null),
('ICU-12','ICU',12,'reserved',null,null,null,null,null),
('GEN-01','General',1,'available',null,null,null,null,null),
('GEN-02','General',2,'occupied','Lakshmi Patel',34,'Dengue Fever','Dr. Mehta',now() - interval '2 days'),
('GEN-03','General',3,'occupied','Vijay Singh',29,'Fracture - Left Leg','Dr. Sharma',now()),
('GEN-04','General',4,'available',null,null,null,null,null),
('GEN-05','General',5,'occupied','Rekha Joshi',55,'Hypertension','Dr. Nair',now() - interval '1 day'),
('GEN-06','General',6,'available',null,null,null,null,null),
('GEN-07','General',7,'occupied','Suresh Das',43,'Appendicitis Post-Op','Dr. Rao',now()),
('GEN-08','General',8,'available',null,null,null,null,null),
('GEN-09','General',9,'reserved',null,null,null,null,null),
('GEN-10','General',10,'available',null,null,null,null,null),
('GEN-11','General',11,'occupied','Anita Gupta',37,'Typhoid','Dr. Khan',now() - interval '3 days'),
('GEN-12','General',12,'available',null,null,null,null,null),
('GEN-13','General',13,'maintenance',null,null,null,null,null),
('GEN-14','General',14,'available',null,null,null,null,null),
('GEN-15','General',15,'occupied','Ravi Kumar',50,'Diabetes complications','Dr. Mehta',now() - interval '5 days'),
('GEN-16','General',16,'available',null,null,null,null,null),
('GEN-17','General',17,'available',null,null,null,null,null),
('GEN-18','General',18,'reserved',null,null,null,null,null),
('GEN-19','General',19,'available',null,null,null,null,null),
('GEN-20','General',20,'available',null,null,null,null,null),
('EMR-01','Emergency',1,'occupied','Unknown Male ~45',45,'Cardiac Arrest','Dr. Sharma',now()),
('EMR-02','Emergency',2,'occupied','Accident Victim',30,'Multiple Trauma','Dr. Nair',now() - interval '30 minutes'),
('EMR-03','Emergency',3,'available',null,null,null,null,null),
('EMR-04','Emergency',4,'occupied','Child Burns',8,'Severe Burns 40%','Dr. Rao',now() - interval '1 hour'),
('EMR-05','Emergency',5,'available',null,null,null,null,null),
('EMR-06','Emergency',6,'reserved',null,null,null,null,null),
('EMR-07','Emergency',7,'available',null,null,null,null,null),
('EMR-08','Emergency',8,'occupied','Neha Singh',28,'Drug Overdose','Dr. Khan',now() - interval '2 hours'),
('EMR-09','Emergency',9,'available',null,null,null,null,null),
('EMR-10','Emergency',10,'available',null,null,null,null,null),
('EMR-11','Emergency',11,'maintenance',null,null,null,null,null),
('EMR-12','Emergency',12,'available',null,null,null,null,null),
('EMR-13','Emergency',13,'occupied','Ram Prasad',67,'Stroke','Dr. Mehta',now() - interval '3 hours'),
('EMR-14','Emergency',14,'available',null,null,null,null,null),
('EMR-15','Emergency',15,'reserved',null,null,null,null,null),
('EMR-16','Emergency',16,'available',null,null,null,null,null),
('PED-01','Pediatric',1,'occupied','Baby Anika',3,'Pneumonia','Dr. Rao',now() - interval '1 day'),
('PED-02','Pediatric',2,'available',null,null,null,null,null),
('PED-03','Pediatric',3,'occupied','Rohan Mishra',10,'Appendicitis','Dr. Sharma',now()),
('PED-04','Pediatric',4,'available',null,null,null,null,null),
('PED-05','Pediatric',5,'available',null,null,null,null,null),
('PED-06','Pediatric',6,'occupied','Preet Singh',7,'Asthma Attack','Dr. Nair',now() - interval '2 days'),
('PED-07','Pediatric',7,'reserved',null,null,null,null,null),
('PED-08','Pediatric',8,'available',null,null,null,null,null),
('PED-09','Pediatric',9,'available',null,null,null,null,null),
('PED-10','Pediatric',10,'occupied','Riya Patel',5,'High Fever','Dr. Khan',now() - interval '12 hours'),
('PED-11','Pediatric',11,'available',null,null,null,null,null),
('PED-12','Pediatric',12,'maintenance',null,null,null,null,null),
('PED-13','Pediatric',13,'available',null,null,null,null,null),
('PED-14','Pediatric',14,'available',null,null,null,null,null),
('PED-15','Pediatric',15,'occupied','Dev Kumar',12,'Fracture Right Arm','Dr. Mehta',now() - interval '8 hours'),
('PED-16','Pediatric',16,'available',null,null,null,null,null),
('PED-17','Pediatric',17,'available',null,null,null,null,null),
('PED-18','Pediatric',18,'reserved',null,null,null,null,null),
('PED-19','Pediatric',19,'available',null,null,null,null,null),
('PED-20','Pediatric',20,'available',null,null,null,null,null),
('MAT-01','Maternity',1,'occupied','Anjali Gupta',32,'Premature Labour','Dr. Rao',now() - interval '30 minutes'),
('MAT-02','Maternity',2,'occupied','Priyanka Sharma',28,'Normal Delivery Post-Op','Dr. Khan',now() - interval '1 day'),
('MAT-03','Maternity',3,'available',null,null,null,null,null),
('MAT-04','Maternity',4,'occupied','Sunita Verma',25,'C-Section Recovery','Dr. Nair',now() - interval '2 days'),
('MAT-05','Maternity',5,'available',null,null,null,null,null),
('MAT-06','Maternity',6,'reserved',null,null,null,null,null),
('MAT-07','Maternity',7,'available',null,null,null,null,null),
('MAT-08','Maternity',8,'occupied','Meena Patel',30,'Hypertension in Pregnancy','Dr. Sharma',now() - interval '3 days'),
('MAT-09','Maternity',9,'available',null,null,null,null,null),
('MAT-10','Maternity',10,'available',null,null,null,null,null),
('MAT-11','Maternity',11,'occupied','Rekha Singh',27,'Gestational Diabetes','Dr. Mehta',now() - interval '4 days'),
('MAT-12','Maternity',12,'available',null,null,null,null,null),
('MAT-13','Maternity',13,'maintenance',null,null,null,null,null),
('MAT-14','Maternity',14,'available',null,null,null,null,null),
('MAT-15','Maternity',15,'reserved',null,null,null,null,null),
('MAT-16','Maternity',16,'available',null,null,null,null,null),
('MAT-17','Maternity',17,'available',null,null,null,null,null),
('MAT-18','Maternity',18,'occupied','Nisha Agarwal',33,'Twin Pregnancy','Dr. Rao',now() - interval '6 hours'),
('MAT-19','Maternity',19,'available',null,null,null,null,null),
('MAT-20','Maternity',20,'available',null,null,null,null,null),
('ORT-01','Ortho',1,'occupied','Suresh Kumar',55,'Hip Replacement','Dr. Nair',now() - interval '3 days'),
('ORT-02','Ortho',2,'available',null,null,null,null,null),
('ORT-03','Ortho',3,'occupied','Geeta Devi',48,'Knee Surgery','Dr. Khan',now() - interval '2 days'),
('ORT-04','Ortho',4,'available',null,null,null,null,null),
('ORT-05','Ortho',5,'reserved',null,null,null,null,null),
('ORT-06','Ortho',6,'occupied','Ramesh Soni',62,'Spinal Surgery','Dr. Mehta',now() - interval '5 days'),
('ORT-07','Ortho',7,'available',null,null,null,null,null),
('ORT-08','Ortho',8,'occupied','Bindu Rani',41,'Shoulder Dislocation','Dr. Sharma',now()),
('ORT-09','Ortho',9,'available',null,null,null,null,null),
('ORT-10','Ortho',10,'available',null,null,null,null,null),
('ORT-11','Ortho',11,'maintenance',null,null,null,null,null),
('ORT-12','Ortho',12,'available',null,null,null,null,null),
('ORT-13','Ortho',13,'occupied','Kiran Lal',70,'Femur Fracture','Dr. Nair',now() - interval '1 day'),
('ORT-14','Ortho',14,'available',null,null,null,null,null),
('ORT-15','Ortho',15,'reserved',null,null,null,null,null),
('ORT-16','Ortho',16,'available',null,null,null,null,null),
('ORT-17','Ortho',17,'available',null,null,null,null,null),
('ORT-18','Ortho',18,'occupied','Dinesh Roy',59,'Ankle Arthroscopy','Dr. Khan',now() - interval '8 hours'),
('ORT-19','Ortho',19,'available',null,null,null,null,null),
('ORT-20','Ortho',20,'available',null,null,null,null,null),
('CAR-01','Cardiac',1,'occupied','Harish Gupta',64,'Coronary Angioplasty','Dr. Mehta',now() - interval '2 days'),
('CAR-02','Cardiac',2,'occupied','Saroj Bai',58,'Heart Failure','Dr. Sharma',now() - interval '4 days'),
('CAR-03','Cardiac',3,'available',null,null,null,null,null),
('CAR-04','Cardiac',4,'occupied','Naresh Kumar',71,'Post CABG','Dr. Nair',now() - interval '6 days'),
('CAR-05','Cardiac',5,'reserved',null,null,null,null,null),
('CAR-06','Cardiac',6,'occupied','Shyam Lal',66,'Pacemaker Implant','Dr. Rao',now() - interval '1 day'),
('CAR-07','Cardiac',7,'available',null,null,null,null,null),
('CAR-08','Cardiac',8,'maintenance',null,null,null,null,null),
('CAR-09','Cardiac',9,'available',null,null,null,null,null),
('CAR-10','Cardiac',10,'occupied','Kamala Devi',55,'Valvular Disease','Dr. Khan',now() - interval '3 days'),
('CAR-11','Cardiac',11,'available',null,null,null,null,null),
('CAR-12','Cardiac',12,'occupied','Prakash Jain',70,'Atrial Fibrillation','Dr. Mehta',now() - interval '2 days'),
('CAR-13','Cardiac',13,'reserved',null,null,null,null,null),
('CAR-14','Cardiac',14,'available',null,null,null,null,null),
('CAR-15','Cardiac',15,'available',null,null,null,null,null),
('CAR-16','Cardiac',16,'occupied','Vinod Kapoor',62,'Cardiac Rehabilitation','Dr. Sharma',now() - interval '7 days'),
('CAR-17','Cardiac',17,'available',null,null,null,null,null),
('CAR-18','Cardiac',18,'available',null,null,null,null,null),
('CAR-19','Cardiac',19,'reserved',null,null,null,null,null),
('CAR-20','Cardiac',20,'occupied','Usha Rani',68,'Post Stent','Dr. Nair',now() - interval '1 day')
on conflict (id) do nothing;

-- ==================== SEED: BLOOD BANK ====================
insert into blood_bank (blood_type, units, capacity) values
('A+',245,300),('A-',45,150),('B+',180,250),('B-',30,100),
('AB+',95,150),('AB-',18,80),('O+',310,400),('O-',55,200)
on conflict (blood_type) do nothing;

-- ==================== SEED: OXYGEN ====================
insert into oxygen_units (id, name, pct, location, type, kpa, flow_rate) values
('OT-01','Cylinder Bank A',78,'ICU','Medical O2',1820,'8 L/min'),
('OT-02','Cylinder Bank B',55,'Ward 3','Medical O2',1320,'6 L/min'),
('OT-03','Liquid Tank',92,'Central','LOX',null,'Central'),
('OT-04','Cylinder Bank C',22,'Emergency','Medical O2',520,'12 L/min'),
('OT-05','Cylinder Bank D',68,'OT','Medical O2',1600,'4 L/min'),
('OT-06','Portable Unit 1',41,'Ambulance','Portable',980,'4 L/min')
on conflict (id) do nothing;

-- ==================== SEED: AMBULANCES ====================
insert into ambulances (id, reg, driver, contact, status, location, eta, patient, last_service, fuel, type) values
('AMB-01','DL-01-EA-1234','Rajesh Kumar','9810000001','active','Connaught Place','8 min','Mrs. Sharma','2026-01-15',82,'ALS'),
('AMB-02','DL-02-EA-5678','Sunil Yadav','9810000002','available','Hospital Base','-','-','2026-02-10',97,'BLS'),
('AMB-03','DL-03-EA-9012','Mohit Singh','9810000003','maintenance','Garage','-','-','2026-03-01',35,'ALS'),
('AMB-04','DL-04-EA-3456','Pankaj Gupta','9810000004','active','Dwarka Sector 9','14 min','Mr. Verma','2026-01-28',65,'ALS'),
('AMB-05','DL-05-EA-7890','Amit Chauhan','9810000005','available','Hospital Base','-','-','2026-03-10',100,'NICU')
on conflict (id) do nothing;

-- ==================== SEED: STAFF ====================
insert into staff (id, name, role, dept, shift, status, phone, email, join_date) values
('S001','Dr. Arjun Mehta','Chief Surgeon','Surgery','Morning','on-duty','9810001001','arjun.mehta@caresync.com','2018-03-12'),
('S002','Dr. Priya Sharma','Cardiologist','Cardiology','Morning','on-duty','9810001002','priya.sharma@caresync.com','2019-07-22'),
('S003','Dr. Vikram Nair','Neurologist','Neurology','Evening','off-duty','9810001003','vikram.nair@caresync.com','2017-01-05'),
('S004','Nurse Sunita Patel','Head Nurse','ICU','Night','on-duty','9810001004','sunita.patel@caresync.com','2020-11-30'),
('S005','Dr. Kavitha Rao','Pediatrician','Pediatrics','Morning','on-leave','9810001005','kavitha.rao@caresync.com','2021-04-15'),
('S006','Nurse Rohit Das','Staff Nurse','Ward 2','Morning','on-duty','9810001006','rohit.das@caresync.com','2022-08-01'),
('S007','Dr. Fatima Khan','Radiologist','Radiology','Evening','on-duty','9810001007','fatima.khan@caresync.com','2020-06-18'),
('S008','Mr. Suresh Nanda','Lab Technician','Pathology','Morning','on-duty','9810001008','suresh.nanda@caresync.com','2019-09-25')
on conflict (id) do nothing;

-- ==================== SEED: EMERGENCIES ====================
insert into emergencies (id, type, patient, location, priority, status, caller, details, requested_by, created_at) values
('EMR-2401','Cardiac Arrest','Unknown Male, ~45yrs','Rajiv Chowk Metro','critical','pending','Police PCR','Collapsed near gate no. 5. CPR in progress by bystander.','Delhi Police', now() - interval '28 minutes'),
('EMR-2402','Road Accident - Multiple Casualties','3 victims','NH-8 near Mahipalpur','critical','pending','Highway Patrol','Truck-bus collision. 3 critical, 7 injured. Need trauma team.','Highway Patrol', now() - interval '32 minutes'),
('EMR-2403','Severe Burns','Child, ~8yrs','Dwarka Sector 7','high','approved','Parent','Burns covering 40% body from kitchen fire. Stable vitals.','Parent', now() - interval '40 minutes'),
('EMR-2404','Poisoning','Ms. Neha Singh, 28','Rohini Block C','high','pending','Family','Suspected drug overdose. Unconscious, breathing shallow.','Family Member', now() - interval '50 minutes'),
('EMR-2405','Stroke Symptoms','Mr. Ram Prasad, 67','Karol Bagh','medium','declined','Neighbor','Sudden weakness left side, slurred speech.','Neighbor', now() - interval '65 minutes'),
('EMR-2406','Premature Labour','Mrs. Anjali Gupta, 32','Lajpat Nagar','high','pending','Husband','28 weeks pregnant. Active labour. Need OB team.','Husband', now() - interval '80 minutes')
on conflict (id) do nothing;

-- ==================== HOSPITAL REGISTRATIONS ====================
create table if not exists hospital_registrations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid,
  hospital_name     text not null,
  email             text unique not null,
  phone             text,
  address           text,
  medical_license_no text not null,
  status            text not null default 'pending'
                    check (status in ('pending','approved','rejected')),
  rejection_reason  text,
  created_at        timestamptz default now(),
  reviewed_at       timestamptz
);
alter table hospital_registrations disable row level security;

-- ==================== ADMINS ====================
create table if not exists admins (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  name       text default 'Admin',
  created_at timestamptz default now()
);
alter table admins disable row level security;

-- Seed a default admin (change this email to your own)
insert into admins (email, name) values
('admin@caresync.com', 'CareSync Admin')
on conflict (email) do nothing;

-- ==================== SEED: ACTIVITY LOG ====================
insert into activity_log (msg, color, created_at) values
('Bed ICU-04 marked as occupied - Patient Arun Kumar','red', now() - interval '19 minutes'),
('Blood B+ restocked: +50 units','green', now() - interval '25 minutes'),
('Emergency EMR-2403 approved by Admin','blue', now() - interval '30 minutes'),
('Ambulance AMB-01 dispatched to Rajiv Chowk','yellow', now() - interval '32 minutes'),
('Dr. Kavitha Rao marked on leave','muted', now() - interval '45 minutes'),
('Oxygen Bank C - LOW ALERT: 22%','red', now() - interval '59 minutes');
