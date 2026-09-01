from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings
from app.core.redis import redis_client

# Define the limiter, optionally using redis if available
def get_limiter():
    import os
    if "pytest" in os.environ.get("_", "") or os.environ.get("TESTING") == "1":
        return Limiter(key_func=get_remote_address, enabled=False)

    redis = redis_client.get_client()
    if redis:
        return Limiter(key_func=get_remote_address, storage_uri=settings.REDIS_URL)
    return Limiter(key_func=get_remote_address)

limiter = get_limiter()
