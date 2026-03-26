import os
from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import beds, blood, oxygen, ambulances, staff, emergencies, auth
from supabase_client import sb_get, init_client, close_client
from request_context import RequestContext, get_request_context, with_tenant_params


def _parse_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "*")
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

@asynccontextmanager
async def lifespan(app):
    await init_client()
    yield
    await close_client()

app = FastAPI(title="CareSync Hospital API", version="2.0.0", lifespan=lifespan)

cors_origins = _parse_cors_origins()
allow_credentials = cors_origins != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,         prefix="/api/auth",         tags=["Auth"])
app.include_router(beds.router,         prefix="/api/beds",         tags=["Beds"])
app.include_router(blood.router,        prefix="/api/blood",        tags=["Blood Bank"])
app.include_router(oxygen.router,       prefix="/api/oxygen",       tags=["Oxygen"])
app.include_router(ambulances.router,   prefix="/api/ambulances",   tags=["Ambulances"])
app.include_router(staff.router,        prefix="/api/staff",        tags=["Staff"])
app.include_router(emergencies.router,  prefix="/api/emergencies",  tags=["Emergencies"])

@app.get("/")
def root():
    return {"message": "CareSync Hospital API v2.0 — Supabase Connected", "docs": "/docs"}

@app.get("/api/dashboard")
async def dashboard(ctx: RequestContext = Depends(get_request_context)):
    beds_data = await sb_get("beds", with_tenant_params({"select": "status"}, ctx))
    staff_data = await sb_get("staff", with_tenant_params({"select": "status"}, ctx))
    emergencies_data = await sb_get("emergencies", with_tenant_params({"select": "status"}, ctx))
    ambulances_data = await sb_get("ambulances", with_tenant_params({"select": "status"}, ctx))
    blood_data = await sb_get("blood_bank", with_tenant_params({"select": "blood_type,units,capacity"}, ctx))
    oxygen_data = await sb_get("oxygen_units", with_tenant_params({"select": "id,pct"}, ctx))
    activity = await sb_get(
        "activity_log",
        with_tenant_params({"select": "*", "order": "created_at.desc", "limit": "10"}, ctx),
    )

    critical_blood  = [d["blood_type"] for d in blood_data if d["units"] / max(d["capacity"], 1) < 0.3]
    critical_oxygen = [o["id"] for o in oxygen_data if o["pct"] < 30]

    return {
        "beds_occupied":       sum(1 for b in beds_data if b["status"] == "occupied"),
        "beds_available":      sum(1 for b in beds_data if b["status"] == "available"),
        "beds_total":          len(beds_data),
        "staff_on_duty":       sum(1 for s in staff_data if s["status"] == "on-duty"),
        "emergencies_pending": sum(1 for e in emergencies_data if e["status"] == "pending"),
        "ambulances_active":   sum(1 for a in ambulances_data if a["status"] == "active"),
        "ambulances_available":sum(1 for a in ambulances_data if a["status"] == "available"),
        "critical_blood_types":critical_blood,
        "critical_oxygen_units":critical_oxygen,
        "activity_log": activity,
    }

@app.get("/api/activity")
async def get_activity(limit: int = 20, ctx: RequestContext = Depends(get_request_context)):
    return await sb_get(
        "activity_log",
        with_tenant_params({"select": "*", "order": "created_at.desc", "limit": str(limit)}, ctx),
    )
