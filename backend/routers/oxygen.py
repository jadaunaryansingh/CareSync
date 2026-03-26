from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from request_context import RequestContext, get_request_context, with_tenant_match, with_tenant_params
from supabase_client import log_activity, sb_get, sb_patch

router = APIRouter()


class OxygenAction(BaseModel):
    action: str  # refill | replace


@router.get("/")
async def get_oxygen(ctx: RequestContext = Depends(get_request_context)):
    return await sb_get("oxygen_units", with_tenant_params({"select": "*", "order": "id"}, ctx))


@router.post("/{oxy_id}/action")
async def oxygen_action(oxy_id: str, body: OxygenAction, ctx: RequestContext = Depends(get_request_context)):
    items = await sb_get("oxygen_units", with_tenant_params({"select": "*", "id": f"eq.{oxy_id}"}, ctx))
    if not items:
        raise HTTPException(status_code=404, detail="Oxygen unit not found")

    unit = items[0]
    if body.action == "refill":
        new_pct = min(100, unit["pct"] + 30)
        new_kpa = min(2400, (unit["kpa"] or 0) + 700) if unit.get("kpa") else None
        msg = f"{oxy_id} refilled to {new_pct}%"
    elif body.action == "replace":
        new_pct = 100
        new_kpa = 2400 if unit.get("kpa") else None
        msg = f"{oxy_id} replaced — 100% capacity"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    patch_data = {"pct": new_pct}
    if new_kpa is not None:
        patch_data["kpa"] = new_kpa

    result = await sb_patch("oxygen_units", with_tenant_match({"id": oxy_id}, ctx), patch_data)
    await log_activity(msg, "green", ctx.email, ctx.hospital_name)
    return result[0] if result else unit
