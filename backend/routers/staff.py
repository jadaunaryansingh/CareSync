from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from request_context import RequestContext, get_request_context, with_tenant_match, with_tenant_params
from supabase_client import log_activity, sb_delete, sb_get, sb_patch, sb_post

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
async def get_staff(
    status: Optional[str] = None,
    search: Optional[str] = None,
    ctx: RequestContext = Depends(get_request_context),
):
    params = with_tenant_params({"select": "*", "order": "name"}, ctx)
    if status and status != "all":
        params["status"] = f"eq.{status}"

    staff = await sb_get("staff", params)
    if search:
        q = search.lower()
        staff = [
            s
            for s in staff
            if q in s["name"].lower()
            or q in (s.get("dept") or "").lower()
            or q in (s.get("role") or "").lower()
        ]
    return staff


@router.get("/stats")
async def staff_stats(ctx: RequestContext = Depends(get_request_context)):
    staff = await sb_get("staff", with_tenant_params({"select": "status,role"}, ctx))
    return {
        "total": len(staff),
        "on_duty": sum(1 for s in staff if s["status"] == "on-duty"),
        "off_duty": sum(1 for s in staff if s["status"] == "off-duty"),
        "on_leave": sum(1 for s in staff if s["status"] == "on-leave"),
        "doctors": sum(1 for s in staff if (s.get("role") or "").startswith("Dr.")),
        "nurses": sum(1 for s in staff if "Nurse" in (s.get("role") or "")),
    }


@router.post("/")
async def add_staff(body: StaffCreate, ctx: RequestContext = Depends(get_request_context)):
    existing = await sb_get("staff", with_tenant_params({"select": "id", "order": "id.desc", "limit": "1"}, ctx))
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
        "hospital_email": ctx.email,
        "hospital_name": ctx.hospital_name,
    }

    result = await sb_post("staff", data)
    await log_activity(f"{body.name} ({body.role}) added to staff", "blue", ctx.email, ctx.hospital_name)
    return result[0] if result else data


@router.patch("/{staff_id}")
async def update_staff(staff_id: str, body: StaffUpdate, ctx: RequestContext = Depends(get_request_context)):
    patch = {k: v for k, v in body.dict().items() if v is not None}
    if not patch:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await sb_patch("staff", with_tenant_match({"id": staff_id}, ctx), patch)
    if not result:
        raise HTTPException(status_code=404, detail="Staff not found")

    s = result[0]
    await log_activity(f"{s['name']} updated: {', '.join(patch.keys())}", "muted", ctx.email, ctx.hospital_name)
    return s


@router.delete("/{staff_id}")
async def delete_staff(staff_id: str, ctx: RequestContext = Depends(get_request_context)):
    items = await sb_get("staff", with_tenant_params({"select": "name", "id": f"eq.{staff_id}"}, ctx))
    name = items[0]["name"] if items else staff_id
    await sb_delete("staff", with_tenant_match({"id": staff_id}, ctx))
    await log_activity(f"{name} removed from staff", "red", ctx.email, ctx.hospital_name)
    return {"ok": True, "id": staff_id}
