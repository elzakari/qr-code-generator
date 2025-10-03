import re
from urllib.parse import urlparse

HEX_COLOR_RE = re.compile(r"^#(?:[0-9a-fA-F]{3}){1,2}$")

def is_hex_color(value: str) -> bool:
    return bool(value and HEX_COLOR_RE.match(value))

def is_valid_url_or_text(s: str) -> bool:
    # We accept any non-empty string. If it looks like a URL, parse it safely.
    if not s or not s.strip():
        return False
    return True

def normalize_error_correction(level: str) -> str:
    level = (level or "M").upper()
    if level not in {"L", "M", "Q", "H"}:
        raise ValueError("Invalid error correction level.")
    return level

def clamp_int(value, min_v, max_v, default):
    try:
        iv = int(value)
    except (TypeError, ValueError):
        iv = default
    return max(min_v, min(max_v, iv))

def clamp_float(value, min_v, max_v, default):
    try:
        fv = float(value)
    except (TypeError, ValueError):
        fv = default
    return max(min_v, min(max_v, fv))

def looks_like_url(s: str) -> bool:
    try:
        u = urlparse(s)
        return u.scheme in {"http", "https"} and bool(u.netloc)
    except Exception:
        return False
