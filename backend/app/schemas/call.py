from pydantic import BaseModel

class StartCallRequest(BaseModel):
    caller_id: str
    agentA_id: str

class StartCallResponse(BaseModel):
    room_name: str
    caller: dict
    agentA: dict

class TransferRequest(BaseModel):
    room_name: str
    agentA_id: str
    agentB_id: str
    summary: str | None = None

class TransferResponse(BaseModel):
    new_room: str
    tokens: dict
    summary: str