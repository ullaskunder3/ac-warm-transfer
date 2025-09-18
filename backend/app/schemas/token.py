from pydantic import BaseModel

class TokenRequest(BaseModel):
    room_name: str
    identity: str

class TokenResponse(BaseModel):
    room_name: str
    identity: str
    token: str