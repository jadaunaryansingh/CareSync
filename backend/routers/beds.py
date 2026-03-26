from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase_client import sb_get, sb_post, sb_patch, sb_delete, log_activity
from datetime import datetime

router = APIRouter()

class BedCreate(BaseModel):
    id: Optional[str] = None
    ward: str
    num: int
    status: str = "available"

class BedAdmit(BaseModel):
    patient_name: str
    patient_age: Optional[int] = None
    diagnosis: Optional[str] = None
    doctor: Optional[str] = None

class BedStatusUpdate(BaseModel):
    status: str
    patient_name: Optional[str] = None
    doctor: Optional[str] = None

@router.get("/")
async def get_beds(ward: Optional[str] = None, status: Optional[str] = None):
    params = {"select": "*", "order": "ward,num"}
    if ward and ward != "All":
        params["ward"] = f"eq.{ward}"
    if status and status != "all":
        params["status"] = f"eq.{status}"
    return await sb_get("beds", params)

@router.get("/stats")
async def bed_stats():
    beds = await sb_get("beds", {"select": "status,ward"})
    return {
        "total": len(beds),
        "occupied": sum(1 for b in beds if b["status"] == "occupied"),
        "available": sum(1 for b in beds if b["status"] == "available"),
        "reserved": sum(1 for b in beds if b["status"] == "reserved"),
        "maintenance": sum(1 for b in beds if b["status"] == "maintenance"),
        "wards": list(dict.fromkeys(b["ward"] for b in beds)),
    }

@router.get("/{bed_id}")
async def get_bed(bed_id: str):
    r = await sb_get("beds", {"select": "*", "id": f"eq.{bed_id}"})
    if not r:
        raise HTTPException(status_code=404, detail="Bed not found")
    return r[0]

@router.post("/")
async def create_bed(body: BedCreate):
    prefix = body.ward[:3].upper()
    bed_id = body.id or f"{prefix}-{body.num:02d}"
    data = {"id": bed_id, "ward": body.ward, "num": body.num, "status": body.status}
    result = await sb_post("beds", data)
    await log_activity(f"Bed {bed_id} added to {body.ward} ward", "blue")
    return result[0] if result else data

@router.patch("/{bed_id}/admit")
async def admit_patient(bed_id: str, body: BedAdmit):
    data = {
        "status": "occupied",
        "patient_name": body.patient_name,
        "patient_age": body.patient_age,
        "diagnosis": body.diagnosis,
        "doctor": body.doctor,
        "admitted_at": datetime.utcnow().isoformat(),
    }
    result = await sb_patch("beds", {"id": bed_id}, data)
    await log_activity(f"Patient {body.patient_name} admitted to Bed {bed_id}", "red")
    if not result:
        raise HTTPException(status_code=404, detail="Bed not found")
    return result[0]

@router.patch("/{bed_id}/discharge")
async def discharge_patient(bed_id: str):
    data = {
        "status": "available",
        "patient_name": None,
        "patient_age": None,
        "diagnosis": None,
        "doctor": None,
        "admitted_at": None,
    }
    result = await sb_patch("beds", {"id": bed_id}, data)
    await log_activity(f"Patient discharged from Bed {bed_id}", "green")
    if not result:
        raise HTTPException(status_code=404, detail="Bed not found")
    return result[0]

@router.patch("/{bed_id}/status")
async def update_bed_status(bed_id: str, body: BedStatusUpdate):
    data = {"status": body.status}
    if body.status != "occupied":
        data.update({"patient_name": None, "patient_age": None, "diagnosis": None, "doctor": None, "admitted_at": None})
    result = await sb_patch("beds", {"id": bed_id}, data)
    await log_activity(f"Bed {bed_id} status changed to {body.status}", "blue")
    if not result:
        raise HTTPException(status_code=404, detail="Bed not found")
    return result[0]

@router.delete("/{bed_id}")
async def delete_bed(bed_id: str):
    await sb_delete("beds", {"id": bed_id})
    await log_activity(f"Bed {bed_id} removed from system", "muted")
    return {"ok": True, "id": bed_id}
