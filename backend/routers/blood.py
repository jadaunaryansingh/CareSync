from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase_client import sb_get, sb_patch, log_activity

router = APIRouter()

class BloodUpdate(BaseModel):
    type: str
    units: int
    operation: str  # "add" or "deduct"

@router.get("/")
async def get_blood():
    items = await sb_get("blood_bank", {"select": "*", "order": "blood_type"})
    result = []
    for d in items:
        pct = round((d["units"] / d["capacity"]) * 100) if d["capacity"] else 0
        result.append({
            "type": d["blood_type"],
            "units": d["units"],
            "capacity": d["capacity"],
            "pct": pct,
            "level": "critical" if pct < 30 else "low" if pct < 60 else "ok",
        })
    return result

@router.post("/update")
async def update_blood(body: BloodUpdate):
    items = await sb_get("blood_bank", {"select": "*", "blood_type": f"eq.{body.type}"})
    if not items:
        raise HTTPException(status_code=404, detail="Blood type not found")
    stock = items[0]
    if body.units <= 0:
        raise HTTPException(status_code=400, detail="Units must be positive")
    if body.operation == "add":
        new_units = min(stock["capacity"], stock["units"] + body.units)
        msg = f"Blood {body.type} restocked: +{body.units} units"
        color = "green"
    elif body.operation == "deduct":
        if stock["units"] < body.units:
            raise HTTPException(status_code=400, detail="Insufficient units")
        new_units = stock["units"] - body.units
        msg = f"Blood {body.type} used: -{body.units} units"
        color = "yellow"
    else:
        raise HTTPException(status_code=400, detail="Invalid operation")
    result = await sb_patch("blood_bank", {"blood_type": body.type}, {"units": new_units})
    await log_activity(msg, color)
    updated = result[0] if result else stock
    pct = round((new_units / updated["capacity"]) * 100)
    return {"type": body.type, "units": new_units, "capacity": updated["capacity"], "pct": pct}
