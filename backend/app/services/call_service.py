import uuid
from livekit.api.access_token import AccessToken, VideoGrants
from app.core.config import settings
from app.core.livekit_client import lk_client
from app.schemas.call import StartCallRequest, StartCallResponse, TransferRequest, TransferResponse
from app.services.summary_service import generate_summary

def generate_token(room_name: str, identity: str) -> str:
    grant = VideoGrants(room_join=True, room=room_name)
    token = AccessToken(
        settings.LIVEKIT_API_KEY,
        settings.LIVEKIT_API_SECRET
    ).with_identity(identity).with_grants(grant).to_jwt()
    return token

def start_call(req: StartCallRequest) -> StartCallResponse:
    room_name = f"call-{uuid.uuid4().hex[:6]}"
    lk_client.room.create_room({"name": room_name})

    caller_token = generate_token(room_name, req.caller_id)
    agentA_token = generate_token(room_name, req.agentA_id)

    return StartCallResponse(
        room_name=room_name,
        caller={"identity": req.caller_id, "token": caller_token},
        agentA={"identity": req.agentA_id, "token": agentA_token}
    )

async def handle_transfer(req: TransferRequest) -> TransferResponse:
    summary = req.summary or ""  # default to empty if not provided

    if summary:
        summary = await generate_summary(summary)    
    else:
        summary = "NO SUMMARY"
    new_room = f"transfer-{uuid.uuid4().hex[:6]}"
    lk_client.room.create_room({"name": new_room})

    agentA_token = generate_token(new_room, req.agentA_id)
    agentB_token = generate_token(new_room, req.agentB_id)
    caller_token = generate_token(new_room, "caller_for_" + req.room_name)

    return TransferResponse(
        new_room=new_room,
        tokens={
            "agentA": {"identity": req.agentA_id, "token": agentA_token},
            "agentB": {"identity": req.agentB_id, "token": agentB_token},
            "caller": {"identity": "caller_for_" + req.room_name, "token": caller_token}
        },
        summary=summary
    )