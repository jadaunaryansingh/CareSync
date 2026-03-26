from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase_client import sb_get, sb_post, sb_patch, log_activity

router = APIRouter()

class EmergencyCreate(BaseModel):
    type: str
    location: str
    priority: str = "medium"
    patient: Optional[str] = "Unknown"
    caller: Optional[str] = "Hospital Staff"
    details: Optional[str] = ""
    requested_by: Optional[str] = "Staff"

class EmergencyStatusUpdate(BaseModel):
    status: str

@router.get("/")
async def get_emergencies(status: Optional[str] = None):
    params = {"select": "*", "order": "created_at.desc"}
    if status and status != "all":
        params["status"] = f"eq.{status}"
    return await sb_get("emergencies", params)

@router.get("/stats")
async def emergency_stats():
    emgs = await sb_get("emergencies", {"select": "status"})
    return {
        "total": len(emgs),
        "pending": sum(1 for e in emgs if e["status"] == "pending"),
        "approved": sum(1 for e in emgs if e["status"] == "approved"),
        "declined": sum(1 for e in emgs if e["status"] == "declined"),
        "resolved": sum(1 for e in emgs if e["status"] == "resolved"),
    }

@router.post("/")
async def create_emergency(body: EmergencyCreate):
    existing = await sb_get("emergencies", {"select": "id", "order": "id.desc", "limit": "1"})
    if existing:
        last = existing[0]["id"]
        try:
            next_num = int(last.split("-")[1]) + 1
        except Exception:
            next_num = 2500
    else:
        next_num = 2401
    emr_id = f"EMR-{next_num}"
    data = {
        "id": emr_id,
        "type": body.type,
        "location": body.location,
        "priority": body.priority,
        "patient": body.patient,
        "caller": body.caller,
        "details": body.details,
        "requested_by": body.requested_by,
        "status": "pending",
    }
    result = await sb_post("emergencies", data)
    await log_activity(f"Emergency {emr_id} created: {body.type} at {body.location}", "red")
    return result[0] if result else data

@router.patch("/{emr_id}/approve")
async def approve_emergency(emr_id: str):
    result = await sb_patch("emergencies", {"id": emr_id}, {"status": "approved"})
    await log_activity(f"Emergency {emr_id} APPROVED — dispatching resources", "green")
    if not result:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return result[0]

@router.patch("/{emr_id}/decline")
async def decline_emergency(emr_id: str):
    result = await sb_patch("emergencies", {"id": emr_id}, {"status": "declined"})
    await log_activity(f"Emergency {emr_id} declined", "red")
    if not result:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return result[0]

@router.patch("/{emr_id}/resolve")
async def resolve_emergency(emr_id: str):
    result = await sb_patch("emergencies", {"id": emr_id}, {"status": "resolved"})
    await log_activity(f"Emergency {emr_id} resolved", "green")
    if not result:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return result[0]

@router.patch("/{emr_id}/reopen")
async def reopen_emergency(emr_id: str):
    result = await sb_patch("emergencies", {"id": emr_id}, {"status": "pending"})
    await log_activity(f"Emergency {emr_id} reopened", "yellow")
    if not result:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return result[0]
