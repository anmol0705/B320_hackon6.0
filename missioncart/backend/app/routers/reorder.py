from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def reorder_root():
    return {"message": "Reorder router ready"}
