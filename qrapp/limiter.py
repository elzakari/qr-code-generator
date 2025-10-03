from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

# More generous rate limits for development
def get_rate_limit():
    if os.getenv("FLASK_ENV", "").lower() == "development":
        return "100 per minute"  # Much more generous for development
    return "10 per minute"  # Production rate limit

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[get_rate_limit()]
)