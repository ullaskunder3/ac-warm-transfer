from fastapi import APIRouter
from app.schemas.call import StartCallRequest, StartCallResponse, TransferRequest, TransferResponse
from app.services.call_service import start_call, handle_transfer

router = APIRouter()

@router.post("/start-call", response_model=StartCallResponse)
def start_call_handler(req: StartCallRequest):
    return start_call(req)

@router.post("/transfer", response_model=TransferResponse)
async def transfer_handler(req: TransferRequest):
    return await handle_transfer(req)