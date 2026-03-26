from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from supabase_client import sb_get, sb_post, sb_patch, sb_delete, log_activity
from datetime import date

router = APIRouter()

class StaffCreate(BaseModel):
    name: str
    role: str
    dept: str
    shift: str = "Morning"
    status: str = "on-duty"
    phone: Optional[str] = None
    email: Optional[str] = None

class StaffUpdate(BaseModel):
    role: Optional[str] = None
    dept: Optional[str] = None
    shift: Optional[str] = None
    status: Optional[str] = None
    phone: Optional[str] = None

@router.get("/")
async def get_staff(status: Optional[str] = None, search: Optional[str] = None):
    params = {"select": "*", "order": "name"}
    if status and status != "all":
        params["status"] = f"eq.{status}"
    staff = await sb_get("staff", params)
    if search:
        q = search.lower()
        staff = [s for s in staff if q in s["name"].lower() or q in (s.get("dept") or "").lower() or q in (s.get("role") or "").lower()]
    return staff

@router.get("/stats")
async def staff_stats():
    staff = await sb_get("staff", {"select": "status,role"})
    return {
        "total": len(staff),
        "on_duty": sum(1 for s in staff if s["status"] == "on-duty"),
        "off_duty": sum(1 for s in staff if s["status"] == "off-duty"),
        "on_leave": sum(1 for s in staff if s["status"] == "on-leave"),
        "doctors": sum(1 for s in staff if (s.get("role") or "").startswith("Dr.")),
        "nurses": sum(1 for s in staff if "Nurse" in (s.get("role") or "")),
    }

@router.post("/")
async def add_staff(body: StaffCreate):
    existing = await sb_get("staff", {"select": "id", "order": "id.desc", "limit": "1"})
    next_num = int(existing[0]["id"][1:]) + 1 if existing else 1
    staff_id = f"S{next_num:03d}"
    email = body.email or (body.name.lower().replace(" ", ".") + "@caresync.com")
    data = {
        "id": staff_id,
        "name": body.name,
        "role": body.role,
        "dept": body.dept,
        "shift": body.shift,
        "status": body.status,
        "phone": body.phone or "",
        "email": email,
        "join_date": str(date.today()),
    }
    result = await sb_post("staff", data)
    await log_activity(f"{body.name} ({body.role}) added to staff", "blue")
    return result[0] if result else data

@router.patch("/{staff_id}")
async def update_staff(staff_id: str, body: StaffUpdate):
    patch = {k: v for k, v in body.dict().items() if v is not None}
    if not patch:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await sb_patch("staff", {"id": staff_id}, patch)
    if not result:
        raise HTTPException(status_code=404, detail="Staff not found")
    s = result[0]
    await log_activity(f"{s['name']} updated: {', '.join(patch.keys())}", "muted")
    return s

@router.delete("/{staff_id}")
async def delete_staff(staff_id: str):
    items = await sb_get("staff", {"select": "name", "id": f"eq.{staff_id}"})
    name = items[0]["name"] if items else staff_id
    await sb_delete("staff", {"id": staff_id})
    await log_activity(f"{name} removed from staff", "red")
    return {"ok": True, "id": staff_id}
