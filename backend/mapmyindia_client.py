import os
from urllib.parse import quote

import httpx


MAPMYINDIA_API_KEY = os.getenv("MAPMYINDIA_API_KEY", "")


async def geocode_address(address: str) -> tuple[float | None, float | None]:
    if not MAPMYINDIA_API_KEY or not address:
        return None, None

    encoded = quote(address)
    url = f"https://apis.mappls.com/advancedmaps/v1/{MAPMYINDIA_API_KEY}/geo_code?address={encoded}"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        return None, None

    if not isinstance(data, list) or not data:
        return None, None

    top = data[0]
    lat = top.get("lat")
    lng = top.get("lng")

    if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
        return float(lat), float(lng)

    return None, None
