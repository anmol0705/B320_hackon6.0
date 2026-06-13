from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from uuid import uuid4
from app.models.product import Product


class CartItem(BaseModel):
    cart_item_id: str = Field(default_factory=lambda: str(uuid4()))
    need_id: str = ""
    need_label: str = ""
    asin: str
    title: str
    price: float
    pack_size: int = 1
    packs_quantity: int = 1
    units_total: int = 1
    total_cost: float = 0.0
    delivery_eta: str = "today"
    prime: bool = True
    amazon_now_eligible: bool = False
    rating: float = 4.0
    explanation: str = ""
    is_sponsored: bool = False
    was_repaired: bool = False
    repair_reason: Optional[str] = None
    swapped_from_asin: Optional[str] = None
    compatibility_flags: List[str] = []
    mission_fit_score: float = 0.0
    selected_reason: str = ""


class AuditFlag(BaseModel):
    flag_id: str = Field(default_factory=lambda: str(uuid4()))
    type: str = "quantity_error"
    severity: Literal["error", "warning", "info"] = "error"
    item_asin: Optional[str] = None
    title: str
    detail: str = ""
    math_explanation: Optional[str] = None
    fix_available: bool = True
    animate_at_ms: int = 0


class AuditResult(BaseModel):
    original_cart: List[CartItem]
    flags: List[AuditFlag]
    repaired_cart: List[CartItem]
    original_total: float
    repaired_total: float
    coverage_score: str = "0/0"
    amazon_cart_url: str = ""


class MissionBuildResult(BaseModel):
    mission_id: str = ""
    cart_items: List[CartItem] = []
    total_cost: float = 0.0
    budget_remaining: float = 0.0
    coverage_score: dict = {}
    delivery_status: dict = {}
    repair_summary: Optional[dict] = None
    flags: List[AuditFlag] = []
    amazon_cart_url: str = ""
    warnings: List[str] = []
