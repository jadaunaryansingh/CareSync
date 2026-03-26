import random
from datetime import datetime

_db = None

def get_db():
    global _db
    if _db is None:
        _db = _build_db()
    return _db

def _build_db():
    return {
        "beds": _gen_beds(),
        "blood": {
            "A+":  {"units": 245, "capacity": 300},
            "A-":  {"units": 45,  "capacity": 150},
            "B+":  {"units": 180, "capacity": 250},
            "B-":  {"units": 30,  "capacity": 100},
            "AB+": {"units": 95,  "capacity": 150},
            "AB-": {"units": 18,  "capacity": 80},
            "O+":  {"units": 310, "capacity": 400},
            "O-":  {"units": 55,  "capacity": 200},
        },
        "oxygen": [
            {"id": "OT-01", "name": "Cylinder Bank A", "pct": 78, "location": "ICU",      "type": "Medical O2", "kpa": 1820, "rate": "8 L/min"},
            {"id": "OT-02", "name": "Cylinder Bank B", "pct": 55, "location": "Ward 3",   "type": "Medical O2", "kpa": 1320, "rate": "6 L/min"},
            {"id": "OT-03", "name": "Liquid Tank",     "pct": 92, "location": "Central",  "type": "LOX",        "kpa": None,  "rate": "Central"},
            {"id": "OT-04", "name": "Cylinder Bank C", "pct": 22, "location": "Emergency","type": "Medical O2", "kpa": 520,  "rate": "12 L/min"},
            {"id": "OT-05", "name": "Cylinder Bank D", "pct": 68, "location": "OT",       "type": "Medical O2", "kpa": 1600, "rate": "4 L/min"},
            {"id": "OT-06", "name": "Portable Unit 1", "pct": 41, "location": "Ambulance","type": "Portable",   "kpa": 980,  "rate": "4 L/min"},
        ],
        "ambulances": [
            {"id": "AMB-01", "reg": "DL-01-EA-1234", "driver": "Rajesh Kumar",  "contact": "9810000001", "status": "active",      "location": "Connaught Place",    "eta": "8 min",  "patient": "Mrs. Sharma", "lastService": "2026-01-15", "fuel": 82, "type": "ALS"},
            {"id": "AMB-02", "reg": "DL-02-EA-5678", "driver": "Sunil Yadav",   "contact": "9810000002", "status": "available",   "location": "Hospital Base",      "eta": "-",      "patient": "-",            "lastService": "2026-02-10", "fuel": 97, "type": "BLS"},
            {"id": "AMB-03", "reg": "DL-03-EA-9012", "driver": "Mohit Singh",   "contact": "9810000003", "status": "maintenance", "location": "Garage",             "eta": "-",      "patient": "-",            "lastService": "2026-03-01", "fuel": 35, "type": "ALS"},
            {"id": "AMB-04", "reg": "DL-04-EA-3456", "driver": "Pankaj Gupta",  "contact": "9810000004", "status": "active",      "location": "Dwarka Sector 9",    "eta": "14 min", "patient": "Mr. Verma",    "lastService": "2026-01-28", "fuel": 65, "type": "ALS"},
            {"id": "AMB-05", "reg": "DL-05-EA-7890", "driver": "Amit Chauhan",  "contact": "9810000005", "status": "available",   "location": "Hospital Base",      "eta": "-",      "patient": "-",            "lastService": "2026-03-10", "fuel": 100,"type": "NICU"},
        ],
        "staff": [
            {"id": "S001", "name": "Dr. Arjun Mehta",    "role": "Chief Surgeon",  "dept": "Surgery",    "shift": "Morning", "status": "on-duty",  "phone": "9810001001"},
            {"id": "S002", "name": "Dr. Priya Sharma",   "role": "Cardiologist",   "dept": "Cardiology", "shift": "Morning", "status": "on-duty",  "phone": "9810001002"},
            {"id": "S003", "name": "Dr. Vikram Nair",    "role": "Neurologist",    "dept": "Neurology",  "shift": "Evening", "status": "off-duty", "phone": "9810001003"},
            {"id": "S004", "name": "Nurse Sunita Patel", "role": "Head Nurse",     "dept": "ICU",        "shift": "Night",   "status": "on-duty",  "phone": "9810001004"},
            {"id": "S005", "name": "Dr. Kavitha Rao",    "role": "Pediatrician",   "dept": "Pediatrics", "shift": "Morning", "status": "on-leave", "phone": "9810001005"},
            {"id": "S006", "name": "Nurse Rohit Das",    "role": "Staff Nurse",    "dept": "Ward 2",     "shift": "Morning", "status": "on-duty",  "phone": "9810001006"},
            {"id": "S007", "name": "Dr. Fatima Khan",    "role": "Radiologist",    "dept": "Radiology",  "shift": "Evening", "status": "on-duty",  "phone": "9810001007"},
            {"id": "S008", "name": "Mr. Suresh Nanda",   "role": "Lab Technician", "dept": "Pathology",  "shift": "Morning", "status": "on-duty",  "phone": "9810001008"},
        ],
        "emergencies": [
            {"id": "EMR-2401", "type": "Cardiac Arrest",               "patient": "Unknown Male, ~45yrs", "location": "Rajiv Chowk Metro",    "priority": "critical", "time": "16:32", "status": "pending",  "caller": "Police PCR",    "details": "Collapsed near gate no. 5. CPR in progress by bystander.", "requestedBy": "Delhi Police"},
            {"id": "EMR-2402", "type": "Road Accident - Multi Casualty","patient": "3 victims",           "location": "NH-8 near Mahipalpur", "priority": "critical", "time": "16:28", "status": "pending",  "caller": "Highway Patrol","details": "Truck-bus collision. 3 critical, 7 injured. Need trauma team.", "requestedBy": "Highway Patrol"},
            {"id": "EMR-2403", "type": "Severe Burns",                 "patient": "Child, ~8yrs",        "location": "Dwarka Sector 7",      "priority": "high",     "time": "16:20", "status": "approved", "caller": "Parent",        "details": "Burns covering 40% body from kitchen fire.", "requestedBy": "Parent"},
            {"id": "EMR-2404", "type": "Poisoning",                    "patient": "Ms. Neha Singh, 28",  "location": "Rohini Block C",       "priority": "high",     "time": "16:10", "status": "pending",  "caller": "Family",        "details": "Suspected drug overdose. Unconscious, breathing shallow.", "requestedBy": "Family Member"},
            {"id": "EMR-2405", "type": "Stroke Symptoms",              "patient": "Mr. Ram Prasad, 67",  "location": "Karol Bagh",           "priority": "medium",   "time": "15:55", "status": "declined", "caller": "Neighbor",      "details": "Sudden weakness left side, slurred speech.", "requestedBy": "Neighbor"},
            {"id": "EMR-2406", "type": "Premature Labour",             "patient": "Mrs. Anjali Gupta, 32","location": "Lajpat Nagar",        "priority": "high",     "time": "15:40", "status": "pending",  "caller": "Husband",       "details": "28 weeks pregnant. Active labour. Need OB team.", "requestedBy": "Husband"},
        ],
        "activity_log": [
            {"msg": "Bed ICU-04 marked as occupied",        "time": "16:41", "color": "red"},
            {"msg": "Blood B+ restocked: +50 units",         "time": "16:35", "color": "green"},
            {"msg": "Emergency EMR-2403 approved by Admin",  "time": "16:30", "color": "blue"},
            {"msg": "Ambulance AMB-01 dispatched",           "time": "16:28", "color": "yellow"},
            {"msg": "Dr. Kavitha Rao marked on leave",       "time": "16:15", "color": "muted"},
            {"msg": "Oxygen Bank C - LOW ALERT: 22%",        "time": "16:01", "color": "red"},
        ],
        "_counters": {"emr": 2406, "staff": 8, "amb": 5},
    }

def _gen_beds():
    wards = ["ICU","General","Emergency","Pediatric","Maternity","Ortho","Cardiac"]
    statuses = ["occupied","available","reserved","maintenance"]
    weights  = [0.55, 0.25, 0.12, 0.08]
    patients = ["Ramesh Gupta","Sita Devi","Arun Kumar","Priya Verma","Mohan Sharma","Lakshmi Patel"]
    doctors  = ["Dr. Mehta","Dr. Sharma","Dr. Nair","Dr. Rao","Dr. Khan"]
    beds = []
    counts = {"ICU": 12, "Emergency": 16}
    for ward in wards:
        n = counts.get(ward, 20)
        for i in range(1, n + 1):
            st = random.choices(statuses, weights)[0]
            beds.append({
                "id": f"{ward[:3].upper()}-{i:02d}",
                "ward": ward, "num": i, "status": st,
                "patient": random.choice(patients) if st == "occupied" else None,
                "doctor":  random.choice(doctors)  if st == "occupied" else None,
            })
    return beds
