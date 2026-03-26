from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase_client import sb_get, sb_patch, log_activity

router = APIRouter()

class OxygenAction(BaseModel):
    action: str  # "refill" or "replace"

@router.get("/")
async def get_oxygen():
    return await sb_get("oxygen_units", {"select": "*", "order": "id"})

@router.post("/{oxy_id}/action")
async def oxygen_action(oxy_id: str, body: OxygenAction):
    items = await sb_get("oxygen_units", {"select": "*", "id": f"eq.{oxy_id}"})
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
    result = await sb_patch("oxygen_units", {"id": oxy_id}, patch_data)
    await log_activity(msg, "green")
    return result[0] if result else unit
