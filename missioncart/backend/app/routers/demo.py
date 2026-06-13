import json
from pathlib import Path
from fastapi import APIRouter
from uuid import uuid4

router = APIRouter()


@router.get("/scenarios")
async def get_demo_scenarios():
    scenario_path = Path(__file__).parent.parent / "data" / "demo_scenarios" / "sneha_broken_cart.json"
    with open(scenario_path, encoding="utf-8") as f:
        data = json.load(f)
    return {"success": True, "data": data, "error": None, "request_id": str(uuid4())}


@router.get("/occasions")
async def get_occasion_cards():
    data = [
        {"id": "occ1", "title": "Diwali", "days_until": 24, "emoji": "🪔", "estimated_budget": 2400},
        {"id": "occ2", "title": "Mom's Birthday", "days_until": 6, "emoji": "🎂", "estimated_budget": 1800},
        {"id": "occ3", "title": "Trek to Coorg", "days_until": 12, "emoji": "🏕️", "estimated_budget": 3200},
        {"id": "occ4", "title": "Office Potluck", "days_until": 3, "emoji": "🏢", "estimated_budget": 800},
    ]
    return {"success": True, "data": data, "error": None, "request_id": str(uuid4())}


@router.get("/reorder-alerts")
async def get_reorder_alerts():
    data = [
        {"id": "r1", "item_name": "Tata Salt 1kg", "quantity": 2, "unit": "packs", "price_inr": 42, "amazon_now_eligible": True},
        {"id": "r2", "item_name": "Surf Excel 1kg", "quantity": 1, "unit": "pack", "price_inr": 189, "amazon_now_eligible": True},
        {"id": "r3", "item_name": "Parle-G 800g", "quantity": 3, "unit": "packs", "price_inr": 105, "amazon_now_eligible": True},
    ]
    return {"success": True, "data": data, "error": None, "request_id": str(uuid4())}
