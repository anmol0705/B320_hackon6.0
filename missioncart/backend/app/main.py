from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from uuid import uuid4
import os
from dotenv import load_dotenv

load_dotenv()

from app.routers import mission, catalog, demo, reorder

app = FastAPI(title="MissionCart API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mission.router, prefix="/api/mission", tags=["mission"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(reorder.router, prefix="/api/reorder", tags=["reorder"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])


@app.get("/health")
def health():
    return {
        "success": True,
        "data": {"status": "ok", "service": "missioncart-backend"},
        "error": None,
        "request_id": str(uuid4()),
    }
