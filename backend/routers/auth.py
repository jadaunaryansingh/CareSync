from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from supabase_client import (
    sb_get, sb_post, sb_patch,
    sb_auth_signup, sb_auth_login, sb_auth_get_user,
    log_activity,
)

router = APIRouter()

# ── Models ──
class SignupRequest(BaseModel):
    hospital_name: str
    email: str
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None
    medical_license_no: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ReviewRequest(BaseModel):
    rejection_reason: Optional[str] = None


# ── Helpers ──
async def _get_registration(email: str):
    rows = await sb_get("hospital_registrations", {
        "select": "*",
        "email": f"eq.{email}",
    })
    return rows[0] if rows else None

async def _current_user(authorization: str):
    """Extract & verify user from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ", 1)[1]
    try:
        user = await sb_auth_get_user(token)
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── Signup ──
@router.post("/signup")
async def signup(body: SignupRequest):
    # 1. Check if registration already exists
    existing = await _get_registration(body.email)
    if existing:
        raise HTTPException(status_code=409, detail=f"Registration already exists (status: {existing['status']})")

    # 2. Create user in Supabase Auth
    try:
        auth_user = await sb_auth_signup(body.email, body.password)
    except Exception as e:
        detail = str(e)
        if "already" in detail.lower() or "duplicate" in detail.lower():
            raise HTTPException(status_code=409, detail="Email already registered")
        raise HTTPException(status_code=400, detail=f"Auth error: {detail}")

    user_id = auth_user.get("id")

    # 3. Insert registration request
    reg_data = {
        "user_id": user_id,
        "hospital_name": body.hospital_name,
        "email": body.email,
        "phone": body.phone,
        "address": body.address,
        "medical_license_no": body.medical_license_no,
        "status": "pending",
    }
    await sb_post("hospital_registrations", reg_data)
    await log_activity(f"New hospital registration: {body.hospital_name} (pending approval)", "yellow")

    return {"ok": True, "message": "Registration submitted. Awaiting admin approval."}


# ── Login ──
@router.post("/login")
async def login(body: LoginRequest):
    # 1. Authenticate with Supabase
    try:
        auth_data = await sb_auth_login(body.email, body.password)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # 2. Check if admin
    is_admin = False
    try:
        admins = await sb_get("admins", {"select": "*", "email": f"eq.{body.email}"})
        if admins:
            is_admin = True
    except Exception:
        pass  # admins table might not exist yet

    # 3. If admin, skip registration check
    if is_admin:
        return {
            "access_token": auth_data["access_token"],
            "refresh_token": auth_data.get("refresh_token"),
            "user": {
                "id": auth_data["user"]["id"],
                "email": auth_data["user"]["email"],
                "hospital_name": "Admin",
                "is_admin": True,
                "role": "admin",
            }
        }

    # 4. Check registration status for hospital users
    reg = await _get_registration(body.email)

    if not reg:
        raise HTTPException(status_code=403, detail="No hospital registration found for this email. Please register first.")

    if reg["status"] == "pending":
        raise HTTPException(status_code=403, detail="Your hospital registration is pending admin approval. Please wait for an admin to review your application.")

    if reg["status"] == "rejected":
        reason = reg.get("rejection_reason") or "No reason provided"
        raise HTTPException(status_code=403, detail=f"Registration was rejected: {reason}")

    return {
        "access_token": auth_data["access_token"],
        "refresh_token": auth_data.get("refresh_token"),
        "user": {
            "id": auth_data["user"]["id"],
            "email": auth_data["user"]["email"],
            "hospital_name": reg["hospital_name"],
            "is_admin": False,
            "role": "hospital",
        }
    }


# ── Setup Admin (one-time use) ──
class AdminSetup(BaseModel):
    email: str = "admin@caresync.com"
    password: str = "admin123"

@router.post("/setup-admin")
async def setup_admin(body: AdminSetup):
    """One-time endpoint to create the admin user in Supabase Auth."""
    # Check if admin email is in admins table
    admins = await sb_get("admins", {"select": "*", "email": f"eq.{body.email}"})
    if not admins:
        # Insert into admins table
        await sb_post("admins", {"email": body.email, "name": "CareSync Admin"})

    # Create auth user
    try:
        await sb_auth_signup(body.email, body.password)
    except Exception as e:
        if "already" in str(e).lower() or "duplicate" in str(e).lower():
            return {"ok": True, "message": f"Admin user {body.email} already exists. You can login now."}
        raise HTTPException(status_code=400, detail=f"Failed to create auth user: {str(e)}")

    await log_activity("Admin account created", "blue")
    return {"ok": True, "message": f"Admin user {body.email} created. You can now login."}



# ── Get current user ──
@router.get("/me")
async def get_me(authorization: str = Header(None)):
    user = await _current_user(authorization)
    email = user.get("email", "")

    # Check admin
    admins = await sb_get("admins", {"select": "*", "email": f"eq.{email}"})
    is_admin = len(admins) > 0

    # Get registration
    reg = await _get_registration(email)

    return {
        "id": user.get("id"),
        "email": email,
        "hospital_name": reg["hospital_name"] if reg else ("Admin" if is_admin else "Unknown"),
        "is_admin": is_admin,
        "role": "admin" if is_admin else "hospital",
    }


# ── Admin: List registrations ──
@router.get("/registrations")
async def list_registrations(
    status: Optional[str] = None,
    authorization: str = Header(None),
):
    user = await _current_user(authorization)
    email = user.get("email", "")
    admins = await sb_get("admins", {"select": "*", "email": f"eq.{email}"})
    if not admins:
        raise HTTPException(status_code=403, detail="Admin access required")

    params = {"select": "*", "order": "created_at.desc"}
    if status:
        params["status"] = f"eq.{status}"
    return await sb_get("hospital_registrations", params)


# ── Admin: Approve ──
@router.patch("/registrations/{reg_id}/approve")
async def approve_registration(reg_id: str, authorization: str = Header(None)):
    user = await _current_user(authorization)
    email = user.get("email", "")
    admins = await sb_get("admins", {"select": "*", "email": f"eq.{email}"})
    if not admins:
        raise HTTPException(status_code=403, detail="Admin access required")

    from datetime import datetime
    result = await sb_patch("hospital_registrations", {"id": reg_id}, {
        "status": "approved",
        "reviewed_at": datetime.utcnow().isoformat(),
    })
    if result:
        await log_activity(f"Hospital registration approved: {result[0].get('hospital_name', reg_id)}", "green")
    return {"ok": True}


# ── Admin: Reject ──
@router.patch("/registrations/{reg_id}/reject")
async def reject_registration(reg_id: str, body: ReviewRequest, authorization: str = Header(None)):
    user = await _current_user(authorization)
    email = user.get("email", "")
    admins = await sb_get("admins", {"select": "*", "email": f"eq.{email}"})
    if not admins:
        raise HTTPException(status_code=403, detail="Admin access required")

    from datetime import datetime
    result = await sb_patch("hospital_registrations", {"id": reg_id}, {
        "status": "rejected",
        "rejection_reason": body.rejection_reason or "No reason provided",
        "reviewed_at": datetime.utcnow().isoformat(),
    })
    if result:
        await log_activity(f"Hospital registration rejected: {result[0].get('hospital_name', reg_id)}", "red")
    return {"ok": True}
