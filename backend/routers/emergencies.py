from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from mapmyindia_client import geocode_address
from request_context import RequestContext, get_request_context, with_tenant_match, with_tenant_params
from supabase_client import log_activity, sb_get, sb_patch, sb_post

router = APIRouter()


class EmergencyCreate(BaseModel):
    type: str
    location: str
    priority: str = "medium"
    patient: Optional[str] = "Unknown"
    caller: Optional[str] = "Hospital Staff"
    details: Optional[str] = ""
    requested_by: Optional[str] = "Staff"


@router.get("/")
async def get_emergencies(status: Optional[str] = None, ctx: RequestContext = Depends(get_request_context)):
    params = with_tenant_params({"select": "*", "order": "created_at.desc"}, ctx)
    if status and status != "all":
        params["status"] = f"eq.{status}"
    return await sb_get("emergencies", params)


@router.get("/stats")
async def emergency_stats(ctx: RequestContext = Depends(get_request_context)):
    emgs = await sb_get("emergencies", with_tenant_params({"select": "status"}, ctx))
    return {
        "total": len(emgs),
        "pending": sum(1 for e in emgs if e["status"] == "pending"),
        "approved": sum(1 for e in emgs if e["status"] == "approved"),
        "declined": sum(1 for e in emgs if e["status"] == "declined"),
        "resolved": sum(1 for e in emgs if e["status"] == "resolved"),
    }


@router.post("/")
async def create_emergency(body: EmergencyCreate, ctx: RequestContext = Depends(get_request_context)):
    existing = await sb_get(
        "emergencies",
        with_tenant_params({"select": "id", "order": "id.desc", "limit": "1"}, ctx),
    )
    if existing:
        last = existing[0]["id"]
        try:
            next_num = int(last.split("-")[1]) + 1
        except Exception:
            next_num = 2500
    else:
        next_num = 2401

    emr_id = f"EMR-{next_num}"
    latitude, longitude = await geocode_address(body.location)

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
        "hospital_email": ctx.email,
        "hospital_name": ctx.hospital_name,
        "latitude": latitude,
        "longitude": longitude,
    }
    result = await sb_post("emergencies", data)
    await log_activity(f"Emergency {emr_id} created: {body.type} at {body.location}", "red", ctx.email, ctx.hospital_name)
    return result[0] if result else data


@router.patch("/{emr_id}/approve")
async def approve_emergency(emr_id: str, ctx: RequestContext = Depends(get_request_context)):
    result = await sb_patch("emergencies", with_tenant_match({"id": emr_id}, ctx), {"status": "approved"})
    await log_activity(f"Emergency {emr_id} APPROVED — dispatching resources", "green", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return result[0]


@router.patch("/{emr_id}/decline")
async def decline_emergency(emr_id: str, ctx: RequestContext = Depends(get_request_context)):
    result = await sb_patch("emergencies", with_tenant_match({"id": emr_id}, ctx), {"status": "declined"})
    await log_activity(f"Emergency {emr_id} declined", "red", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return result[0]


@router.patch("/{emr_id}/resolve")
async def resolve_emergency(emr_id: str, ctx: RequestContext = Depends(get_request_context)):
    result = await sb_patch("emergencies", with_tenant_match({"id": emr_id}, ctx), {"status": "resolved"})
    await log_activity(f"Emergency {emr_id} resolved", "green", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return result[0]


@router.patch("/{emr_id}/reopen")
async def reopen_emergency(emr_id: str, ctx: RequestContext = Depends(get_request_context)):
    result = await sb_patch("emergencies", with_tenant_match({"id": emr_id}, ctx), {"status": "pending"})
    await log_activity(f"Emergency {emr_id} reopened", "yellow", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Emergency not found")
    return result[0]
