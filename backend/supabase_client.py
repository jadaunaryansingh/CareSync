import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SECRET = os.getenv("SUPABASE_SECRET")

# ── Persistent HTTP client (created once, reused for all requests) ──
_client: httpx.AsyncClient | None = None

async def init_client():
    global _client
    _client = httpx.AsyncClient(
        timeout=httpx.Timeout(15.0, connect=5.0),
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
    )

async def close_client():
    global _client
    if _client:
        await _client.aclose()
        _client = None

def _get_client() -> httpx.AsyncClient:
    if _client is None:
        raise RuntimeError("HTTP client not initialized — call init_client() first")
    return _client

# ── Headers ──
def get_headers(use_secret=False):
    key = SUPABASE_SECRET if use_secret else SUPABASE_KEY
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

def sb_url(table: str) -> str:
    return f"{SUPABASE_URL}/rest/v1/{table}"

# ── CRUD helpers (reuse persistent client) ──
async def sb_get(table: str, params: dict = None):
    r = await _get_client().get(sb_url(table), headers=get_headers(), params=params)
    r.raise_for_status()
    return r.json()

async def sb_post(table: str, data: dict):
    r = await _get_client().post(sb_url(table), headers=get_headers(), json=data)
    r.raise_for_status()
    return r.json()

async def sb_patch(table: str, match: dict, data: dict):
    params = {k: f"eq.{v}" for k, v in match.items()}
    r = await _get_client().patch(sb_url(table), headers=get_headers(), params=params, json=data)
    r.raise_for_status()
    return r.json()

async def sb_delete(table: str, match: dict):
    params = {k: f"eq.{v}" for k, v in match.items()}
    r = await _get_client().delete(sb_url(table), headers=get_headers(), params=params)
    r.raise_for_status()
    return r.json()

async def log_activity(msg: str, color: str = "blue"):
    """Fire-and-forget activity log entry."""
    try:
        await sb_post("activity_log", {"msg": msg, "color": color})
    except Exception:
        pass

# ── Auth helpers (use service-role / secret key) ──
async def sb_auth_signup(email: str, password: str):
    """Create a user via Supabase GoTrue API."""
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True,
    }
    r = await _get_client().post(url, headers=get_headers(use_secret=True), json=payload)
    r.raise_for_status()
    return r.json()

async def sb_auth_login(email: str, password: str):
    """Login via Supabase GoTrue API — returns access_token."""
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    payload = {"email": email, "password": password}
    r = await _get_client().post(url, headers=get_headers(), json=payload)
    r.raise_for_status()
    return r.json()

async def sb_auth_get_user(token: str):
    """Get user info from a Supabase access token."""
    url = f"{SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
    }
    r = await _get_client().get(url, headers=headers)
    r.raise_for_status()
    return r.json()
