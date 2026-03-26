from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from mapmyindia_client import geocode_address
from request_context import RequestContext, get_request_context, with_tenant_match, with_tenant_params
from supabase_client import log_activity, sb_delete, sb_get, sb_patch, sb_post

router = APIRouter()


class AmbulanceCreate(BaseModel):
    reg: str
    driver: str
    contact: Optional[str] = None
    type: str = "BLS"
    location: Optional[str] = "Hospital Base"


@router.get("/")
async def get_ambulances(status: Optional[str] = None, ctx: RequestContext = Depends(get_request_context)):
    params = with_tenant_params({"select": "*", "order": "id"}, ctx)
    if status and status != "all":
        params["status"] = f"eq.{status}"
    return await sb_get("ambulances", params)


@router.get("/stats")
async def ambulance_stats(ctx: RequestContext = Depends(get_request_context)):
    ambs = await sb_get("ambulances", with_tenant_params({"select": "status"}, ctx))
    return {
        "total": len(ambs),
        "active": sum(1 for a in ambs if a["status"] == "active"),
        "available": sum(1 for a in ambs if a["status"] == "available"),
        "maintenance": sum(1 for a in ambs if a["status"] == "maintenance"),
    }


@router.post("/")
async def add_ambulance(body: AmbulanceCreate, ctx: RequestContext = Depends(get_request_context)):
    existing = await sb_get(
        "ambulances",
        with_tenant_params({"select": "id", "order": "id.desc", "limit": "1"}, ctx),
    )
    next_num = int(existing[0]["id"].split("-")[1]) + 1 if existing else 1
    amb_id = f"AMB-{next_num:02d}"
    latitude, longitude = await geocode_address(body.location or "Hospital Base")

    data = {
        "id": amb_id,
        "reg": body.reg,
        "driver": body.driver,
        "contact": body.contact or "",
        "type": body.type,
        "status": "available",
        "location": body.location or "Hospital Base",
        "eta": "-",
        "patient": "-",
        "fuel": 100,
        "hospital_email": ctx.email,
        "hospital_name": ctx.hospital_name,
        "latitude": latitude,
        "longitude": longitude,
    }

    result = await sb_post("ambulances", data)
    await log_activity(f"Ambulance {amb_id} ({body.reg}) added to fleet", "blue", ctx.email, ctx.hospital_name)
    return result[0] if result else data


@router.patch("/{amb_id}/dispatch")
async def dispatch_ambulance(
    amb_id: str,
    destination: Optional[str] = "Unknown",
    ctx: RequestContext = Depends(get_request_context),
):
    import random

    eta = f"{random.randint(5, 20)} min"
    latitude, longitude = await geocode_address(destination or "Unknown")
    result = await sb_patch(
        "ambulances",
        with_tenant_match({"id": amb_id}, ctx),
        {
            "status": "active",
            "location": destination,
            "eta": eta,
            "latitude": latitude,
            "longitude": longitude,
        },
    )
    await log_activity(f"Ambulance {amb_id} dispatched to {destination}", "yellow", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return result[0]


@router.patch("/{amb_id}/recall")
async def recall_ambulance(amb_id: str, ctx: RequestContext = Depends(get_request_context)):
    latitude, longitude = await geocode_address("Hospital Base")
    result = await sb_patch(
        "ambulances",
        with_tenant_match({"id": amb_id}, ctx),
        {
            "status": "available",
            "location": "Hospital Base",
            "eta": "-",
            "patient": "-",
            "latitude": latitude,
            "longitude": longitude,
        },
    )
    await log_activity(f"Ambulance {amb_id} recalled to hospital base", "blue", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return result[0]


@router.patch("/{amb_id}/clear")
async def clear_ambulance(amb_id: str, ctx: RequestContext = Depends(get_request_context)):
    result = await sb_patch("ambulances", with_tenant_match({"id": amb_id}, ctx), {"status": "available"})
    await log_activity(f"Ambulance {amb_id} cleared for service", "green", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return result[0]


@router.patch("/{amb_id}/fuel")
async def refuel_ambulance(amb_id: str, ctx: RequestContext = Depends(get_request_context)):
    result = await sb_patch("ambulances", with_tenant_match({"id": amb_id}, ctx), {"fuel": 100})
    await log_activity(f"Ambulance {amb_id} refuelled to 100%", "green", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    return result[0]


@router.delete("/{amb_id}")
async def delete_ambulance(amb_id: str, ctx: RequestContext = Depends(get_request_context)):
    await sb_delete("ambulances", with_tenant_match({"id": amb_id}, ctx))
    await log_activity(f"Ambulance {amb_id} removed from fleet", "muted", ctx.email, ctx.hospital_name)
    return {"ok": True, "id": amb_id}
