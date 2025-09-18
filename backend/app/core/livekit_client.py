from livekit import api
from app.core.config import settings

lk_client = api.LiveKitAPI(
    settings.LIVEKIT_URL,
    settings.LIVEKIT_API_KEY,
    settings.LIVEKIT_API_SECRET
)