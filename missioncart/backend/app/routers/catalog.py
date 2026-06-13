from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def catalog_root():
    return {"message": "Catalog router ready"}
