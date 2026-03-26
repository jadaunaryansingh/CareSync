from dataclasses import dataclass
from fastapi import Depends, Header, HTTPException

from supabase_client import sb_auth_get_user, sb_get


@dataclass
class RequestContext:
    email: str
    is_admin: bool
    hospital_name: str


def _require_bearer(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    return authorization.split(" ", 1)[1]


async def get_request_context(authorization: str = Header(None)) -> RequestContext:
    token = _require_bearer(authorization)

    try:
        user = await sb_auth_get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    email = user.get("email", "")

    admins = await sb_get("admins", {"select": "email", "email": f"eq.{email}"})
    is_admin = len(admins) > 0

    hospital_name = "Admin"
    if not is_admin:
        regs = await sb_get(
            "hospital_registrations",
            {"select": "hospital_name,status", "email": f"eq.{email}", "limit": "1"},
        )
        if not regs:
            raise HTTPException(status_code=403, detail="No hospital registration found")
        if regs[0].get("status") != "approved":
            raise HTTPException(status_code=403, detail="Hospital registration is not approved")
        hospital_name = regs[0].get("hospital_name") or "Hospital"

    return RequestContext(email=email, is_admin=is_admin, hospital_name=hospital_name)


def with_tenant_params(params: dict, ctx: RequestContext) -> dict:
    scoped = dict(params)
    if not ctx.is_admin:
        scoped["hospital_email"] = f"eq.{ctx.email}"
    return scoped


def with_tenant_match(match: dict, ctx: RequestContext) -> dict:
    scoped = dict(match)
    if not ctx.is_admin:
        scoped["hospital_email"] = ctx.email
    return scoped
