from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from request_context import RequestContext, get_request_context, with_tenant_match, with_tenant_params
from supabase_client import log_activity, sb_delete, sb_get, sb_patch, sb_post

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


@router.get("/")
async def get_beds(
    ward: Optional[str] = None,
    status: Optional[str] = None,
    ctx: RequestContext = Depends(get_request_context),
):
    params = with_tenant_params({"select": "*", "order": "ward,num"}, ctx)
    if ward and ward != "All":
        params["ward"] = f"eq.{ward}"
    if status and status != "all":
        params["status"] = f"eq.{status}"
    return await sb_get("beds", params)


@router.get("/stats")
async def bed_stats(ctx: RequestContext = Depends(get_request_context)):
    beds = await sb_get("beds", with_tenant_params({"select": "status,ward"}, ctx))
    return {
        "total": len(beds),
        "occupied": sum(1 for b in beds if b["status"] == "occupied"),
        "available": sum(1 for b in beds if b["status"] == "available"),
        "reserved": sum(1 for b in beds if b["status"] == "reserved"),
        "maintenance": sum(1 for b in beds if b["status"] == "maintenance"),
        "wards": list(dict.fromkeys(b["ward"] for b in beds)),
    }


@router.get("/{bed_id}")
async def get_bed(bed_id: str, ctx: RequestContext = Depends(get_request_context)):
    r = await sb_get("beds", with_tenant_params({"select": "*", "id": f"eq.{bed_id}"}, ctx))
    if not r:
        raise HTTPException(status_code=404, detail="Bed not found")
    return r[0]


@router.post("/")
async def create_bed(body: BedCreate, ctx: RequestContext = Depends(get_request_context)):
    prefix = body.ward[:3].upper()
    bed_id = body.id or f"{prefix}-{body.num:02d}"
    data = {
        "id": bed_id,
        "ward": body.ward,
        "num": body.num,
        "status": body.status,
        "hospital_email": ctx.email,
        "hospital_name": ctx.hospital_name,
    }
    result = await sb_post("beds", data)
    await log_activity(f"Bed {bed_id} added to {body.ward} ward", "blue", ctx.email, ctx.hospital_name)
    return result[0] if result else data


@router.patch("/{bed_id}/admit")
async def admit_patient(bed_id: str, body: BedAdmit, ctx: RequestContext = Depends(get_request_context)):
    data = {
        "status": "occupied",
        "patient_name": body.patient_name,
        "patient_age": body.patient_age,
        "diagnosis": body.diagnosis,
        "doctor": body.doctor,
        "admitted_at": datetime.utcnow().isoformat(),
    }
    result = await sb_patch("beds", with_tenant_match({"id": bed_id}, ctx), data)
    await log_activity(f"Patient {body.patient_name} admitted to Bed {bed_id}", "red", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Bed not found")
    return result[0]


@router.patch("/{bed_id}/discharge")
async def discharge_patient(bed_id: str, ctx: RequestContext = Depends(get_request_context)):
    data = {
        "status": "available",
        "patient_name": None,
        "patient_age": None,
        "diagnosis": None,
        "doctor": None,
        "admitted_at": None,
    }
    result = await sb_patch("beds", with_tenant_match({"id": bed_id}, ctx), data)
    await log_activity(f"Patient discharged from Bed {bed_id}", "green", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Bed not found")
    return result[0]


@router.patch("/{bed_id}/status")
async def update_bed_status(bed_id: str, body: BedStatusUpdate, ctx: RequestContext = Depends(get_request_context)):
    data = {"status": body.status}
    if body.status != "occupied":
        data.update({
            "patient_name": None,
            "patient_age": None,
            "diagnosis": None,
            "doctor": None,
            "admitted_at": None,
        })
    result = await sb_patch("beds", with_tenant_match({"id": bed_id}, ctx), data)
    await log_activity(f"Bed {bed_id} status changed to {body.status}", "blue", ctx.email, ctx.hospital_name)
    if not result:
        raise HTTPException(status_code=404, detail="Bed not found")
    return result[0]


@router.delete("/{bed_id}")
async def delete_bed(bed_id: str, ctx: RequestContext = Depends(get_request_context)):
    await sb_delete("beds", with_tenant_match({"id": bed_id}, ctx))
    await log_activity(f"Bed {bed_id} removed from system", "muted", ctx.email, ctx.hospital_name)
    return {"ok": True, "id": bed_id}
