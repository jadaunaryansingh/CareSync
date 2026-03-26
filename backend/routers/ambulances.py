from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase_client import sb_get, sb_post, sb_patch, sb_delete, log_activity

router = APIRouter()

class AmbulanceCreate(BaseModel):
    reg: str
    driver: str
    contact: Optional[str] = None
    type: str = "BLS"

class AmbulanceStatusUpdate(BaseModel):
    status: str
    location: Optional[str] = None
    eta: Optional[str] = "-"
    patient: Optional[str] = "-"

@router.get("/")
async def get_ambulances(status: Optional[str] = None):
    params = {"select": "*", "order": "id"}
    if status and status != "all":
        params["status"] = f"eq.{status}"
    return await sb_get("ambulances", params)

@router.get("/stats")
async def ambulance_stats():
    ambs = await sb_get("ambulances", {"select": "status"})
    return {
        "total": len(ambs),
        "active": sum(1 for a in ambs if a["status"] == "active"),
        "available": sum(1 for a in ambs if a["status"] == "available"),
        "maintenance": sum(1 for a in ambs if a["status"] == "maintenance"),
    }

@router.post("/")
async def add_ambulance(body: AmbulanceCreate):
    existing = await sb_get("ambulances", {"select": "id", "order": "id.desc", "limit": "1"})
    next_num = int(existing[0]["id"].split("-")[1]) + 1 if existing else 1
    amb_id = f"AMB-{next_num:02d}"
    data = {
        "id": amb_id,
        "reg": body.reg,
        "driver": body.driver,
        "contact": body.contact or "",
        "type": body.type,
        "status": "available",
        "location": "Hospital Base",
        "eta": "-",
        "patient": "-",
        "fuel": 100,
    }
    result = await sb_post("ambulances", data)
    await log_activity(f"Ambulance {amb_id} ({body.reg}) added to fleet", "blue")
    return result[0] if result else data

@router.patch("/{amb_id}/dispatch")
async def dispatch_ambulance(amb_id: str, destination: Optional[str] = "Unknown"):
    import random
    eta = f"{random.randint(5, 20)} min"
    result = await sb_patch("ambulances", {"id": amb_id}, {"status": "active", "location": destination, "eta": eta})
    await log_activity(f"Ambulance {amb_id} dispatched to {destination}", "yellow")
    if not result:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return result[0]

@router.patch("/{amb_id}/recall")
async def recall_ambulance(amb_id: str):
    result = await sb_patch("ambulances", {"id": amb_id}, {"status": "available", "location": "Hospital Base", "eta": "-", "patient": "-"})
    await log_activity(f"Ambulance {amb_id} recalled to hospital base", "blue")
    if not result:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return result[0]

@router.patch("/{amb_id}/clear")
async def clear_ambulance(amb_id: str):
    result = await sb_patch("ambulances", {"id": amb_id}, {"status": "available"})
    await log_activity(f"Ambulance {amb_id} cleared for service", "green")
    if not result:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return result[0]

@router.patch("/{amb_id}/fuel")
async def refuel_ambulance(amb_id: str):
    result = await sb_patch("ambulances", {"id": amb_id}, {"fuel": 100})
    await log_activity(f"Ambulance {amb_id} refuelled to 100%", "green")
    if not result:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return result[0]

@router.delete("/{amb_id}")
async def delete_ambulance(amb_id: str):
    await sb_delete("ambulances", {"id": amb_id})
    await log_activity(f"Ambulance {amb_id} removed from fleet", "muted")
    return {"ok": True, "id": amb_id}
