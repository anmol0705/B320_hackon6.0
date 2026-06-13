from pydantic import BaseModel, Field
from typing import List, Optional


class Product(BaseModel):
    asin: str
    title: str
    category: str
    subcategory: str = ""
    brand: str = ""
    price: float
    pack_size: int = 1
    unit: str = "piece"
    price_per_unit: float = 0.0
    rating: float
    review_count: int = 0
    prime: bool = True
    amazon_now_eligible: bool = False
    delivery_eta: str = "today"
    eta_days: int = 0
    return_risk: float = 0.1
    compatibility_tags: List[str] = []
    safety_tags: List[str] = []
    sponsored: bool = False
    sponsored_bid_score: float = 0.0
    stock_available: bool = True
    seller_rating: float = 4.0
    mission_domain_tags: List[str] = []
    image_url: str = ""

    class Config:
        from_attributes = True
