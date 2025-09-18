from fastapi import APIRouter
from app.schemas.token import TokenRequest, TokenResponse
from app.services.call_service import generate_token

router = APIRouter()

@router.post("/token", response_model=TokenResponse)
def issue_token(data: TokenRequest):
    token = generate_token(data.room_name, data.identity)
    return TokenResponse(room_name=data.room_name, identity=data.identity, token=token)