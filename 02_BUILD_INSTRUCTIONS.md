# MissionCart — PM Build Instructions
## Complete Step-by-Step Agent Guide
### For: Kiro (Backend) + Codex (Frontend) | 48 Hours

---

> **PM Rule:** Read this entire document before writing one line of code.
> Every decision in here was made deliberately. Do not improvise. Do not add features not listed. Do not use libraries not specified. If something breaks, fix it before moving to the next step.

---

## AGENT ASSIGNMENTS

| Agent | Owns | Stack |
|-------|------|-------|
| **Kiro** | Backend, API, LLM integration, data layer, deployment | Python 3.11, FastAPI, Amazon Bedrock |
| **Codex** | Mobile app, all screens, animations, API integration | React Native, Expo SDK 51, NativeWind |
| **PM (MISSION-CTRL)** | Prompts for both agents, scope decisions, integration verification | This document |

**Both agents work in parallel from Hour 2 onward.**
**The shared contract (API schemas) is established at Hour 0-2 before either agent writes business logic.**

---

## HOUR 0-2: SHARED CONTRACT FIRST

**Both agents must read this section before starting.**

### Amazon Design Tokens (Codex uses these everywhere)

```javascript
const AMAZON = {
  orange: '#FF9900',
  orangeDark: '#E47911',
  orangeLight: '#FFF3E0',
  background: '#FFFFFF',
  backgroundSecondary: '#F3F3F3',
  border: '#DDDDDD',
  textPrimary: '#0F1111',
  textSecondary: '#565959',
  textMuted: '#767676',
  linkBlue: '#007185',
  successGreen: '#007600',
  starYellow: '#FFA41C',
  primeBadge: '#00A8E1',
  errorRed: '#CC0C39',
  warningAmber: '#FF9900',
  cardShadow: '0 2px 5px rgba(15,17,17,0.15)',
  borderRadius: 4,
}
```

### API Base Contract

All API responses follow this envelope:
```typescript
interface APIResponse<T> {
  success: boolean
  data: T
  error?: string
  request_id: string
}
```

All currency: INR as float
All times: ISO8601 string
All IDs: UUID4 string
API base URL: `http://localhost:8000` (dev), env var for prod

### Core TypeScript Types (Codex implements, Kiro matches)

```typescript
// Mission Spec — output of LLM parser
interface MissionSpec {
  mission_id: string
  raw_goal: string
  goal: string
  domain: 'event' | 'home_setup' | 'electronics' | 'travel' | 'baby_care' | 'pet_care' | 'seasonal' | 'general'
  occasion: string | null
  headcount: number | null
  deadline_hours: number | null
  budget_max: number | null
  safety_context: 'child_safe' | 'baby_safe' | 'pet_safe' | 'general' | null
  needs_clarification: boolean
  clarification_question: string | null
}

// Product from catalog
interface Product {
  asin: string
  title: string
  category: string
  price: number
  pack_size: number
  price_per_unit: number
  rating: number
  review_count: number
  prime: boolean
  amazon_now_eligible: boolean  // KEY FIELD — Amazon Now specific
  delivery_eta: 'now_20min' | 'today' | 'tomorrow' | '2_days' | '3_plus'
  return_risk: number
  compatibility_tags: string[]
  safety_tags: string[]
  sponsored: boolean
  stock_available: boolean
}

// Cart item — output of solver
interface CartItem {
  cart_item_id: string
  need_id: string
  need_label: string
  asin: string
  title: string
  price: number
  pack_size: number
  packs_quantity: number
  units_total: number
  total_cost: number
  delivery_eta: string
  prime: boolean
  amazon_now_eligible: boolean
  rating: number
  explanation: string
  is_sponsored: boolean
  was_repaired: boolean
  repair_reason: string | null
  compatibility_flags: string[]
}

// Audit flag
interface AuditFlag {
  flag_id: string
  type: 'quantity_error' | 'missing_accessory' | 'delivery_failure' | 'budget_overage' | 'sponsored_blocked' | 'incompatibility' | 'not_amazon_now'
  severity: 'error' | 'warning' | 'info'
  item_asin: string | null
  title: string
  detail: string
  math_explanation: string | null  // "2 per child × 12 kids = 24"
  fix_available: boolean
}

// Coverage score
interface CoverageScore {
  fraction: number
  covered: number
  total: number
  display: string  // "9/9"
  all_must_haves_covered: boolean
  missing: string[]
}

// Mission build result
interface MissionBuildResult {
  mission_id: string
  cart_items: CartItem[]
  total_cost: number
  budget_remaining: number
  coverage_score: CoverageScore
  delivery_status: {
    all_on_time: boolean
    all_amazon_now: boolean
    bottleneck_items: CartItem[]
    message: string | null
  }
  repair_summary: {
    was_repaired: boolean
    original_total: number
    final_total: number
    steps: Array<{ action: string; saved: number }>
  } | null
  flags: AuditFlag[]
  amazon_cart_url: string
}

// Reorder alert
interface DepletionAlert {
  asin: string
  title: string
  days_remaining: number
  confidence: 'high' | 'estimated'
  last_purchase_date: string
  suggested_quantity: number
  price: number
  amazon_now_eligible: boolean
}

// Occasion card
interface OccasionCard {
  occasion: string
  days_until: number
  last_mission_headcount: number | null
  last_mission_budget: number | null
  prompt_text: string
  prefill_goal: string
  image_emoji: string
}
```

---

## KIRO INSTRUCTIONS: BACKEND BUILD

### Setup Command (run first)

```bash
mkdir -p missioncart/backend/app/{routers,services/adapters,models,data/demo_scenarios}
mkdir -p missioncart/backend/tests
cd missioncart/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi==0.111.0 "pydantic[email]==2.7.1" anthropic==0.28.0 uvicorn[standard]==0.30.1 "aiosqlite==0.20.0" "SQLAlchemy==2.0.30" python-dotenv==1.0.1 httpx==0.27.0 boto3==1.34.0
pip freeze > requirements.txt
```

### .env.example

```
ANTHROPIC_API_KEY=your_key_here
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=ap-south-1
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-6
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,exp://localhost:8081
```

---

### STEP K1: Data Files (Hour 0-2)

**Create `app/data/catalog.json`**

200 SKUs structured exactly as the Product type above. Must include:
- 60 event/party items: plates (4 variants), cups (4), napkins (4), balloons (6), pumps (2), candles (4), cake knives (2), streamers (4), banners (2), return gifts (8), tablecloths (4), decorations (10), disposable spoons/forks (4), cupcake liners (4)
- 60 home setup items: mattress (4), bedsheets (4), pillows (4), pillow covers (4), water purifier (2), induction cooktop (2), induction vessels (4), kitchen knife set (2), chopping board (2), towels (4), bathroom organizer (2), extension board (4), LED bulb (4), curtains (4), hangers (4), storage boxes (4)
- 30 electronics: USB-C hub (4), HDMI cable (4), laptop stand (4), keyboard (4), mouse (4), webcam (2), power bank (2), phone stand (2), cable organizer (2)
- 20 travel: backpack (4), packing cubes (2), travel adapter (2), water bottle (4), first aid kit (2), trekking socks (4), rain jacket (2)
- 15 baby care: diapers stage 1 (3), formula (2), wipes (2), baby soap (2), baby oil (2), muslin cloth (2), baby monitor (1), bath tub (1)
- 15 pet care: puppy food (3), adult dog food (3), dog bowl set (2), leash (2), dog bed (2), pet wipes (2), tick spray (1)

**Critical fields for every SKU:**
- `amazon_now_eligible: true` for at least 60% of event items
- `delivery_eta: "now_20min"` for amazon_now_eligible items
- `sponsored: true` for exactly 2 items in the event category (for demo)
- One sponsored cup with `safety_tags: []` (no child_safe — for demo flag 4)

**Create `app/data/compatibility_graph.json`**

```json
{
  "balloon_set": {
    "requires": ["balloon_pump"],
    "recommends": ["balloon_ribbon"],
    "incompatible_with": []
  },
  "induction_cooktop": {
    "requires": ["induction_compatible_vessel"],
    "recommends": ["silicone_trivet"],
    "incompatible_with": ["aluminium_vessel", "copper_vessel"]
  },
  "water_purifier_electric": {
    "requires": ["installation_kit"],
    "recommends": [],
    "incompatible_with": []
  },
  "gas_stove": {
    "requires": ["gas_regulator", "gas_pipe"],
    "recommends": [],
    "incompatible_with": []
  },
  "inverter": {
    "requires": ["inverter_battery"],
    "recommends": ["battery_stand"],
    "incompatible_with": []
  },
  "dslr_camera": {
    "requires": ["memory_card", "camera_bag"],
    "recommends": ["extra_battery"],
    "incompatible_with": []
  },
  "camping_tent": {
    "requires": ["tent_pegs", "ground_sheet"],
    "recommends": ["mallet"],
    "incompatible_with": []
  },
  "puppy_food": {
    "requires": [],
    "recommends": [],
    "incompatible_with": ["adult_dog_food"]
  },
  "newborn_formula": {
    "requires": [],
    "recommends": [],
    "incompatible_with": ["stage2_formula", "stage3_formula"]
  }
}
```

**Create `app/data/quantity_rules.json`**

```json
{
  "plates": {
    "formula": "headcount * 2.0 * 1.10",
    "pack_divide": true,
    "explanation": "{units} plates — 2 per person × {headcount} guests with 10% buffer"
  },
  "cups": {
    "formula": "headcount * 2.5 * 1.10",
    "pack_divide": true,
    "explanation": "{units} cups — drinks are consumed multiple times per guest"
  },
  "napkins": {
    "formula": "headcount * 3.0 * 1.15",
    "pack_divide": true,
    "explanation": "{units} napkins — high usage item with 15% buffer"
  },
  "balloons": {
    "formula": "headcount * 3.0 * 1.20",
    "pack_divide": true,
    "explanation": "{units} balloons — some pop before use, 20% buffer"
  },
  "candles": {
    "formula": "1",
    "pack_divide": false,
    "explanation": "1 pack of candles"
  },
  "return_gifts": {
    "formula": "headcount * 1.0 * 1.05",
    "pack_divide": true,
    "explanation": "{units} return gifts — 1 per child with small buffer"
  },
  "diapers_newborn": {
    "formula": "days * 10 * 1.10",
    "pack_divide": true,
    "explanation": "{units} diapers — ~10 per day for newborn"
  },
  "dog_food_medium": {
    "formula": "pet_weight_kg * 0.02 * days",
    "pack_divide": true,
    "explanation": "{units}g dog food — 2% of body weight per day"
  },
  "socks_travel": {
    "formula": "days + 2",
    "pack_divide": false,
    "explanation": "{units} pairs — 1 per day plus 2 buffer"
  }
}
```

**Create `app/data/demo_scenarios/sneha_broken_cart.json`**

```json
{
  "goal": "Birthday party for 12 kids tomorrow evening under 4000",
  "existing_cart": [
    {
      "asin": "DEMO_PLATES_01",
      "title": "Disposable Paper Plates (Pack of 12)",
      "price": 89,
      "quantity": 1,
      "category": "plates",
      "pack_size": 12,
      "prime": true,
      "amazon_now_eligible": true,
      "delivery_eta": "now_20min",
      "rating": 4.1,
      "return_risk": 0.05,
      "safety_tags": ["child_safe", "food_grade"],
      "sponsored": false
    },
    {
      "asin": "DEMO_BALLOONS_01",
      "title": "Multicolor Balloon Set Pack of 20 — Pump Not Included",
      "price": 249,
      "quantity": 1,
      "category": "balloon_set",
      "pack_size": 20,
      "prime": true,
      "amazon_now_eligible": true,
      "delivery_eta": "now_20min",
      "rating": 4.3,
      "return_risk": 0.08,
      "safety_tags": ["child_safe"],
      "sponsored": false
    },
    {
      "asin": "DEMO_STREAMERS_01",
      "title": "Decorative Paper Streamers Multicolor Set of 6",
      "price": 180,
      "quantity": 1,
      "category": "decoration_streamers",
      "pack_size": 6,
      "prime": false,
      "amazon_now_eligible": false,
      "delivery_eta": "2_days",
      "rating": 4.0,
      "return_risk": 0.10,
      "safety_tags": ["child_safe"],
      "sponsored": false
    },
    {
      "asin": "DEMO_CUPS_SPONSORED",
      "title": "Disposable Cups Pack of 25",
      "price": 129,
      "quantity": 1,
      "category": "disposable_cups",
      "pack_size": 25,
      "prime": true,
      "amazon_now_eligible": true,
      "delivery_eta": "now_20min",
      "rating": 3.8,
      "return_risk": 0.06,
      "safety_tags": [],
      "sponsored": true
    }
  ],
  "expected_flags": [
    {
      "type": "quantity_error",
      "item_asin": "DEMO_PLATES_01",
      "title": "12 plates — you need 24",
      "math_explanation": "2 plates per child × 12 kids = 24 plates. Packs of 12 → 2 packs needed.",
      "delay_ms": 1500
    },
    {
      "type": "missing_accessory",
      "item_asin": "DEMO_BALLOONS_01",
      "title": "Balloon set — no pump in cart",
      "math_explanation": "This balloon set requires a pump to inflate. No pump found in your cart.",
      "delay_ms": 3000
    },
    {
      "type": "not_amazon_now",
      "item_asin": "DEMO_STREAMERS_01",
      "title": "Streamers not on Amazon Now — swapping",
      "math_explanation": "These streamers arrive in 2 days. Party is tomorrow. Swapped to Now-eligible alternative.",
      "delay_ms": 4500
    },
    {
      "type": "sponsored_blocked",
      "item_asin": "DEMO_CUPS_SPONSORED",
      "title": "Sponsored product blocked — failed child safe check",
      "math_explanation": "This sponsored product does not have the child_safe certification required for a kids party mission.",
      "delay_ms": 6000
    }
  ]
}
```

**Create `app/data/occasion_calendar.json`**

```json
{
  "diwali": {
    "window_months": [10, 11],
    "advance_notice_days": 24,
    "emoji": "🪔",
    "prompt": "Diwali in {days} days. Your home ready?",
    "prefill_goal": "Diwali celebration at home for 8 guests under 5000"
  },
  "holi": {
    "window_months": [2, 3],
    "advance_notice_days": 14,
    "emoji": "🎨",
    "prompt": "Holi in {days} days. Colors ready?",
    "prefill_goal": "Holi celebration with 10 friends under 2000"
  },
  "monsoon": {
    "cities": {
      "bangalore": {"start_month": 6, "start_day": 1},
      "mumbai": {"start_month": 6, "start_day": 10},
      "delhi": {"start_month": 7, "start_day": 1},
      "chennai": {"start_month": 10, "start_day": 15}
    },
    "advance_notice_days": 8,
    "emoji": "🌧️",
    "prompt": "Monsoon arrives in {days} days. Ready?",
    "prefill_goal": "Monsoon prep kit for family of 4 under 3000"
  },
  "kids_birthday": {
    "window_months": "all",
    "advance_notice_days": 12,
    "emoji": "🎂",
    "prompt": "Birthday party coming up in {days} days",
    "prefill_goal": "Birthday party for 12 kids under 4000"
  }
}
```

---

### STEP K2: Pydantic Models (Hour 1-2)

**File: `app/models/mission.py`**

```python
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from uuid import uuid4
from datetime import datetime
from enum import Enum

class DomainEnum(str, Enum):
    event = "event"
    home_setup = "home_setup"
    electronics = "electronics"
    travel = "travel"
    baby_care = "baby_care"
    pet_care = "pet_care"
    seasonal = "seasonal"
    general = "general"

class SafetyEnum(str, Enum):
    child_safe = "child_safe"
    baby_safe = "baby_safe"
    pet_safe = "pet_safe"
    general = "general"

class MissionSpec(BaseModel):
    mission_id: str = Field(default_factory=lambda: str(uuid4()))
    raw_goal: str
    goal: str
    domain: DomainEnum
    occasion: Optional[str] = None
    headcount: Optional[int] = None
    deadline_hours: Optional[int] = None
    budget_max: Optional[float] = None
    budget_min: Optional[float] = None
    location_pincode: Optional[str] = None
    safety_context: Optional[SafetyEnum] = None
    household_size: Optional[int] = None
    trip_duration_days: Optional[int] = None
    pet_weight_kg: Optional[float] = None
    pet_age_months: Optional[int] = None
    baby_age_weeks: Optional[int] = None
    special_constraints: List[str] = []
    needs_clarification: bool = False
    clarification_question: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True

class MissionNeed(BaseModel):
    need_id: str
    label: str
    priority: Literal["must_have", "should_have", "optional"]
    priority_weight: float
    category_candidates: List[str]
    units_required: int
    packs_required: int
    budget_fraction: float
    budget_ceiling: float
    safety_tags: List[str] = []
    compatibility_check_required: bool = True

class CoverageScore(BaseModel):
    fraction: float
    covered: int
    total: int
    display: str
    all_must_haves_covered: bool
    missing: List[str]
```

**File: `app/models/product.py`**

```python
from pydantic import BaseModel
from typing import List, Optional

class Product(BaseModel):
    asin: str
    title: str
    category: str
    subcategory: str = ""
    brand: str = ""
    price: float
    pack_size: int = 1
    price_per_unit: float = 0.0
    rating: float
    review_count: int = 0
    prime: bool
    amazon_now_eligible: bool = False
    delivery_eta: str
    return_risk: float = 0.1
    compatibility_tags: List[str] = []
    safety_tags: List[str] = []
    sponsored: bool = False
    sponsored_bid_score: float = 0.0
    stock_available: bool = True
    seller_rating: float = 4.0
    mission_domain_tags: List[str] = []

    class Config:
        from_attributes = True

class CartItem(BaseModel):
    cart_item_id: str
    need_id: str
    need_label: str
    asin: str
    title: str
    price: float
    pack_size: int
    packs_quantity: int
    units_total: int
    total_cost: float
    delivery_eta: str
    prime: bool
    amazon_now_eligible: bool
    rating: float
    explanation: str = ""
    is_sponsored: bool = False
    was_repaired: bool = False
    repair_reason: Optional[str] = None
    swapped_from_asin: Optional[str] = None
    compatibility_flags: List[str] = []
```

---

### STEP K3: Core Services (Hour 2-16)

Build in this exact order. Test each before moving to next.

**3a. `app/services/compatibility.py`**

```python
import json
from pathlib import Path
from typing import Dict, List, Tuple

class CompatibilityGraph:
    def __init__(self):
        data_path = Path(__file__).parent.parent / "data" / "compatibility_graph.json"
        with open(data_path) as f:
            self.graph: Dict = json.load(f)
    
    def check(self, category: str, cart_categories: List[str]) -> Tuple[List[str], List[str]]:
        """Returns (missing_required, incompatible_found)"""
        edges = self.graph.get(category, {})
        missing = [r for r in edges.get("requires", []) if r not in cart_categories]
        incompatible = [i for i in edges.get("incompatible_with", []) if i in cart_categories]
        return missing, incompatible
    
    def get_explanation(self, category: str) -> str:
        return self.graph.get(category, {}).get("notes", "")

graph = CompatibilityGraph()
```

Test: `python -c "from app.services.compatibility import graph; print(graph.check('balloon_set', []))"` should return `(['balloon_pump'], [])`

**3b. `app/services/quantity_planner.py`**

```python
import json
import math
from pathlib import Path

class QuantityPlanner:
    def __init__(self):
        data_path = Path(__file__).parent.parent / "data" / "quantity_rules.json"
        with open(data_path) as f:
            self.rules = json.load(f)
    
    def calculate(self, category: str, pack_size: int, context: dict) -> dict:
        rule = self.rules.get(category)
        if not rule:
            # Fallback: 1 pack
            return {
                "units_required": pack_size,
                "packs_required": 1,
                "explanation": f"1 pack of {category}"
            }
        
        headcount = context.get("headcount", 1)
        days = context.get("trip_duration_days", 1)
        pet_weight = context.get("pet_weight_kg", 5)
        
        formula = rule["formula"]
        units = eval(formula, {"headcount": headcount, "days": days, 
                                "pet_weight_kg": pet_weight, "math": math})
        units = math.ceil(units)
        packs = math.ceil(units / pack_size) if rule.get("pack_divide") else int(units)
        
        explanation = rule["explanation"].format(
            units=units, headcount=headcount, days=days
        )
        
        return {
            "units_required": units,
            "packs_required": packs,
            "explanation": explanation
        }

planner = QuantityPlanner()
```

**3c. `app/services/constraint_engine.py`**

```python
import math
from app.models.product import Product, CartItem
from app.models.mission import MissionSpec, MissionNeed
from app.services.compatibility import graph
from typing import List, Tuple, Optional

class ConstraintEngine:
    
    def check_all(
        self, 
        product: Product, 
        need: MissionNeed,
        mission: MissionSpec,
        current_cart_categories: List[str],
        remaining_budget: float,
        packs_needed: int
    ) -> Tuple[bool, List[str]]:
        """Returns (passes, list_of_failed_checks)"""
        failures = []
        
        # Check 1: Budget
        cost = product.price * packs_needed
        if cost > remaining_budget * 1.1:
            failures.append(f"budget: costs ₹{cost:.0f}, only ₹{remaining_budget:.0f} remaining")
        
        # Check 2: Delivery deadline
        if mission.deadline_hours:
            eta_map = {"now_20min": 0, "today": 0, "tomorrow": 1, "2_days": 2, "3_plus": 99}
            eta_days = eta_map.get(product.delivery_eta, 99)
            deadline_days = math.ceil(mission.deadline_hours / 24)
            if eta_days > deadline_days:
                failures.append(f"delivery: arrives in {eta_days} days, deadline is {deadline_days} days")
        
        # Check 3: Amazon Now (if deadline < 1 day, must be Now eligible)
        if mission.deadline_hours and mission.deadline_hours <= 24:
            if not product.amazon_now_eligible:
                failures.append("not_amazon_now: not available on Amazon Now for same-day need")
        
        # Check 4: Compatibility
        _, incompatible = graph.check(product.category, current_cart_categories)
        if incompatible:
            failures.append(f"incompatible: conflicts with {', '.join(incompatible)}")
        
        # Check 5: Return risk
        if product.return_risk > 0.30:
            failures.append(f"return_risk: {product.return_risk:.0%} return rate too high")
        
        # Check 6: Quality floor
        if product.rating < 3.5:
            failures.append(f"quality: {product.rating}★ below minimum 3.5★")
        
        # Check 7: Safety
        if mission.safety_context and mission.safety_context != "general":
            if mission.safety_context not in product.safety_tags:
                failures.append(f"safety: missing {mission.safety_context} certification")
        
        # Check 8: Sponsored validity
        if product.sponsored and len(failures) > 0:
            failures.append("sponsored_blocked: sponsored product failed constraint checks")
        
        return len(failures) == 0, failures

engine = ConstraintEngine()
```

**3d. `app/services/ranking_engine.py`**

```python
import math
from app.models.product import Product
from app.models.mission import MissionSpec, MissionNeed

ETA_MAP = {"now_20min": 0, "today": 0, "tomorrow": 1, "2_days": 2, "3_plus": 3}

def mission_fit_score(product: Product, need: MissionNeed, mission: MissionSpec, packs: int) -> float:
    # Need match
    need_match = 1.0 if product.category in need.category_candidates else 0.7
    
    # Delivery score
    eta_days = ETA_MAP.get(product.delivery_eta, 3)
    deadline_days = math.ceil(mission.deadline_hours / 24) if mission.deadline_hours else 3
    if eta_days == 0:
        delivery_score = 1.0
    elif eta_days <= deadline_days - 1:
        delivery_score = 0.9
    elif eta_days == deadline_days:
        delivery_score = 0.7
    else:
        delivery_score = 0.0
    
    # Amazon Now bonus
    now_bonus = 0.1 if product.amazon_now_eligible else 0.0
    
    # Price fit
    total_cost = product.price * packs
    budget_allocation = (mission.budget_max or 5000) * need.budget_fraction
    price_fit = min(1.0, budget_allocation / total_cost) if total_cost > 0 else 0
    
    # Rating
    rating_score = product.rating / 5.0
    
    # Return risk (inverted)
    return_risk_score = 1.0 - product.return_risk
    
    score = (
        0.28 * need_match
        + 0.22 * delivery_score
        + 0.10 * now_bonus
        + 0.18 * price_fit
        + 0.14 * rating_score
        + 0.08 * return_risk_score
    )
    return score
```

**3e. `app/services/budget_repair.py`**

```python
from typing import List, Tuple
from app.models.product import CartItem
from app.models.mission import MissionNeed

class BudgetRepairEngine:
    
    def repair(
        self, 
        cart: List[CartItem], 
        needs: List[MissionNeed],
        budget: float,
        catalog  # catalog retriever instance
    ) -> Tuple[List[CartItem], List[dict]]:
        """Returns (repaired_cart, repair_steps)"""
        steps = []
        total = sum(item.total_cost for item in cart)
        
        if total <= budget:
            return cart, steps
        
        # Step 1: Trim buffer 15% -> 5%
        for item in cart:
            need = next((n for n in needs if n.need_id == item.need_id), None)
            if need and need.priority != "must_have":
                old_cost = item.total_cost
                # Recalculate with 5% buffer instead of built-in
                new_packs = max(1, item.packs_quantity - 1)
                if new_packs < item.packs_quantity:
                    item.packs_quantity = new_packs
                    item.units_total = new_packs * item.pack_size
                    item.total_cost = item.price * new_packs
                    item.was_repaired = True
                    item.repair_reason = "Reduced buffer"
                    saved = old_cost - item.total_cost
                    if saved > 0:
                        steps.append({"action": f"Reduced {item.need_label} quantity", "saved": saved})
        
        total = sum(item.total_cost for item in cart)
        if total <= budget:
            return cart, steps
        
        # Step 2: Drop optional needs
        optional_items = [i for i in cart if any(
            n.need_id == i.need_id and n.priority == "optional" for n in needs
        )]
        optional_items.sort(key=lambda x: x.total_cost)
        
        for item in optional_items:
            if total <= budget:
                break
            total -= item.total_cost
            steps.append({"action": f"Removed optional: {item.need_label}", "saved": item.total_cost})
            cart.remove(item)
        
        # Step 3: Drop should_have if still over
        if total > budget:
            should_items = [i for i in cart if any(
                n.need_id == i.need_id and n.priority == "should_have" for n in needs
            )]
            should_items.sort(key=lambda x: x.total_cost)
            
            for item in should_items:
                if total <= budget:
                    break
                total -= item.total_cost
                steps.append({
                    "action": f"Removed {item.need_label} (consider adding back if budget allows)", 
                    "saved": item.total_cost
                })
                cart.remove(item)
        
        # Step 4: Never silently drop must_have
        # If still over, return cart with flag — do not drop must_haves
        
        return cart, steps

repair_engine = BudgetRepairEngine()
```

**3f. `app/services/coverage_score.py`**

```python
from typing import List
from app.models.mission import MissionNeed, CoverageScore
from app.models.product import CartItem

def calculate_coverage(cart: List[CartItem], needs: List[MissionNeed]) -> CoverageScore:
    cart_need_ids = {item.need_id for item in cart}
    
    covered_weight = sum(
        n.priority_weight for n in needs if n.need_id in cart_need_ids
    )
    total_weight = sum(n.priority_weight for n in needs)
    
    covered_count = sum(1 for n in needs if n.need_id in cart_need_ids)
    
    all_must_haves = all(
        n.need_id in cart_need_ids 
        for n in needs if n.priority == "must_have"
    )
    
    missing = [n.label for n in needs if n.need_id not in cart_need_ids]
    
    return CoverageScore(
        fraction=covered_weight / total_weight if total_weight > 0 else 0,
        covered=covered_count,
        total=len(needs),
        display=f"{covered_count}/{len(needs)}",
        all_must_haves_covered=all_must_haves,
        missing=missing
    )
```

**3g. `app/services/mission_parser.py`**

```python
import json
import re
import os
import anthropic
from app.models.mission import MissionSpec
from pydantic import ValidationError

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are a mission parser for MissionCart on Amazon Now.
Extract structured data from user goals. Return ONLY valid JSON.
No explanation outside JSON. Match this exact schema.

Rules:
- Never invent headcounts or budgets not stated
- "tomorrow" = 18 deadline_hours, "today" = 6, "this weekend" = 48, "now" = 2
- Kids/children missions → safety_context: "child_safe"
- Baby/infant missions → safety_context: "baby_safe"  
- If any critical field missing, set needs_clarification: true

Schema:
{
  "goal": string,
  "domain": "event|home_setup|electronics|travel|baby_care|pet_care|seasonal|general",
  "occasion": string or null,
  "headcount": integer or null,
  "deadline_hours": integer or null,
  "budget_max": float or null,
  "safety_context": "child_safe|baby_safe|pet_safe|general" or null,
  "needs_clarification": boolean,
  "clarification_question": string or null
}"""

def extract_fallback(raw_goal: str) -> dict:
    """Regex fallback if LLM fails"""
    result = {
        "goal": raw_goal,
        "domain": "general",
        "occasion": None,
        "headcount": None,
        "deadline_hours": None,
        "budget_max": None,
        "safety_context": None,
        "needs_clarification": False,
        "clarification_question": None
    }
    
    headcount_match = re.search(r'\b(\d+)\s*(kids?|people|persons?|guests?|children|relatives)\b', raw_goal, re.I)
    if headcount_match:
        result["headcount"] = int(headcount_match.group(1))
        if "kid" in headcount_match.group(2).lower() or "child" in headcount_match.group(2).lower():
            result["safety_context"] = "child_safe"
    
    budget_match = re.search(r'[₹Rs\.]*\s*(\d+(?:,\d+)*)\s*(thousand|k|lakh|L)?', raw_goal, re.I)
    if budget_match:
        amount = float(budget_match.group(1).replace(",", ""))
        multiplier = budget_match.group(2)
        if multiplier and multiplier.lower() in ["thousand", "k"]:
            amount *= 1000
        elif multiplier and multiplier.lower() in ["lakh", "l"]:
            amount *= 100000
        result["budget_max"] = amount
    
    if "tomorrow" in raw_goal.lower():
        result["deadline_hours"] = 18
    elif "today" in raw_goal.lower() or "now" in raw_goal.lower():
        result["deadline_hours"] = 6
    
    if "birthday" in raw_goal.lower():
        result["domain"] = "event"
        result["occasion"] = "kids_birthday" if result["safety_context"] == "child_safe" else "birthday"
    elif "flat" in raw_goal.lower() or "home" in raw_goal.lower():
        result["domain"] = "home_setup"
    elif "trek" in raw_goal.lower() or "travel" in raw_goal.lower():
        result["domain"] = "travel"
    
    return result

async def parse_mission(raw_goal: str) -> MissionSpec:
    # Attempt 1: LLM
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": raw_goal}]
        )
        data = json.loads(response.content[0].text)
        data["raw_goal"] = raw_goal
        return MissionSpec(**data)
    except (json.JSONDecodeError, ValidationError, Exception):
        pass
    
    # Attempt 2: Regex fallback
    data = extract_fallback(raw_goal)
    data["raw_goal"] = raw_goal
    return MissionSpec(**data)
```

---

### STEP K4: Domain Adapters (Hour 6-10)

**`app/services/adapters/base.py`**

```python
from abc import ABC, abstractmethod
from typing import List
from app.models.mission import MissionSpec, MissionNeed

class BaseAdapter(ABC):
    @abstractmethod
    def get_needs(self, spec: MissionSpec) -> List[MissionNeed]:
        pass
    
    def _make_need(self, need_id, label, priority, category_candidates, 
                   budget_fraction, quantity_rule=None) -> MissionNeed:
        weight_map = {"must_have": 1.0, "should_have": 0.6, "optional": 0.3}
        return MissionNeed(
            need_id=need_id,
            label=label,
            priority=priority,
            priority_weight=weight_map[priority],
            category_candidates=category_candidates,
            units_required=0,  # calculated by quantity planner
            packs_required=0,
            budget_fraction=budget_fraction,
            budget_ceiling=0,  # calculated after spec budget known
            safety_tags=[],
            compatibility_check_required=True
        )
```

**`app/services/adapters/event_adapter.py`**

```python
from app.services.adapters.base import BaseAdapter
from app.models.mission import MissionSpec, MissionNeed
from typing import List

class EventAdapter(BaseAdapter):
    def get_needs(self, spec: MissionSpec) -> List[MissionNeed]:
        occasion = spec.occasion or "general_event"
        
        if "birthday" in occasion or "party" in occasion:
            return self._birthday_needs(spec)
        elif "diwali" in occasion or "festival" in occasion:
            return self._festival_needs(spec)
        elif "annaprasanam" in occasion or "ceremony" in occasion:
            return self._ceremony_needs(spec)
        else:
            return self._general_event_needs(spec)
    
    def _birthday_needs(self, spec: MissionSpec) -> List[MissionNeed]:
        safety = ["child_safe", "food_grade"] if spec.safety_context == "child_safe" else []
        needs = [
            self._make_need("serve_food", "Plates & utensils", "must_have", 
                           ["plates", "disposable_plates"], 0.20),
            self._make_need("serve_drinks", "Cups & drinks", "must_have",
                           ["cups", "disposable_cups"], 0.10),
            self._make_need("cake_items", "Candles & cake knife", "must_have",
                           ["candles", "cake_knife"], 0.10),
            self._make_need("decorate_space", "Balloons & decorations", "should_have",
                           ["balloon_set", "balloons", "decorations"], 0.25),
            self._make_need("entertainment", "Games & activities", "should_have",
                           ["party_games", "activities"], 0.15),
            self._make_need("return_gifts", "Return gifts", "optional",
                           ["return_gifts", "party_favors"], 0.10),
            self._make_need("cleanup", "Trash bags", "optional",
                           ["trash_bags", "cleanup"], 0.05),
            self._make_need("napkins", "Napkins & tissues", "should_have",
                           ["napkins", "tissue_pack"], 0.05),
        ]
        # Apply child_safe tags
        if safety:
            for need in needs:
                need.safety_tags = safety
        return needs
    
    def _festival_needs(self, spec: MissionSpec) -> List[MissionNeed]:
        return [
            self._make_need("lighting", "Diyas & lights", "must_have",
                           ["diya", "fairy_lights", "led_lights"], 0.35),
            self._make_need("sweets_gifting", "Sweets & gift boxes", "must_have",
                           ["sweets_box", "gift_hamper"], 0.25),
            self._make_need("decoration", "Decorations", "should_have",
                           ["rangoli", "torans", "flowers"], 0.20),
            self._make_need("pooja_items", "Pooja essentials", "must_have",
                           ["incense", "camphor", "flowers"], 0.15),
            self._make_need("new_clothes", "New clothes", "optional",
                           ["ethnic_wear", "kurta"], 0.05),
        ]
    
    def _ceremony_needs(self, spec: MissionSpec) -> List[MissionNeed]:
        return [
            self._make_need("serving_vessels", "Serving vessels", "must_have",
                           ["banana_leaf", "steel_plate", "serving_bowl"], 0.25),
            self._make_need("traditional_sweets", "Traditional sweets", "must_have",
                           ["payasam_mix", "mithai"], 0.20),
            self._make_need("pooja_items", "Pooja items", "must_have",
                           ["flowers", "incense", "camphor"], 0.20),
            self._make_need("gifting", "Baby gifts", "must_have",
                           ["baby_gift", "silver_item"], 0.25),
            self._make_need("cleanup", "Cleanup", "optional",
                           ["trash_bags"], 0.10),
        ]
    
    def _general_event_needs(self, spec: MissionSpec) -> List[MissionNeed]:
        return [
            self._make_need("serve_food", "Food & serving", "must_have",
                           ["plates", "cups", "napkins"], 0.40),
            self._make_need("decorate", "Decorations", "should_have",
                           ["decorations", "balloons"], 0.35),
            self._make_need("cleanup", "Cleanup", "optional",
                           ["trash_bags"], 0.10),
            self._make_need("extras", "Extra items", "optional",
                           ["party_extras"], 0.15),
        ]
```

**`app/services/adapters/home_adapter.py`**

```python
from app.services.adapters.base import BaseAdapter
from app.models.mission import MissionSpec, MissionNeed
from typing import List

class HomeSetupAdapter(BaseAdapter):
    def get_needs(self, spec: MissionSpec) -> List[MissionNeed]:
        return [
            self._make_need("sleeping", "Mattress & bedding", "must_have",
                           ["mattress", "bedsheet", "pillow"], 0.35),
            self._make_need("kitchen_cooking", "Cooktop & vessels", "must_have",
                           ["induction_cooktop", "gas_stove", "cooking_vessel", "induction_compatible_vessel"], 0.25),
            self._make_need("water", "Water purifier", "must_have",
                           ["water_purifier_electric", "water_purifier"], 0.10),
            self._make_need("bathroom", "Towels & organizer", "must_have",
                           ["towels", "bathroom_organizer"], 0.08),
            self._make_need("lighting", "LED bulbs", "must_have",
                           ["led_bulb", "led_light"], 0.05),
            self._make_need("power", "Extension board", "must_have",
                           ["extension_board", "power_strip"], 0.05),
            self._make_need("storage", "Storage boxes", "should_have",
                           ["storage_box", "storage_organizer"], 0.05),
            self._make_need("comfort", "Curtains & cushions", "should_have",
                           ["curtains", "cushion"], 0.04),
            self._make_need("decor", "Plants & decor", "optional",
                           ["indoor_plant", "wall_art"], 0.03),
        ]
```

**`app/services/domain_router.py`**

```python
from app.models.mission import MissionSpec, MissionNeed
from app.services.adapters.event_adapter import EventAdapter
from app.services.adapters.home_adapter import HomeSetupAdapter
from typing import List

ADAPTER_MAP = {
    "event": EventAdapter,
    "home_setup": HomeSetupAdapter,
}

def route_and_decompose(spec: MissionSpec) -> List[MissionNeed]:
    adapter_class = ADAPTER_MAP.get(spec.domain, EventAdapter)
    adapter = adapter_class()
    needs = adapter.get_needs(spec)
    
    # Apply budget ceilings
    if spec.budget_max:
        for need in needs:
            need.budget_ceiling = spec.budget_max * need.budget_fraction * 1.5
    
    return needs
```

---

### STEP K5: Cart Builder (Hour 12-16)

**`app/services/cart_builder.py`**

```python
import json
import math
from pathlib import Path
from typing import List, Optional
from uuid import uuid4
from app.models.mission import MissionSpec, MissionNeed
from app.models.product import Product, CartItem
from app.services.compatibility import graph
from app.services.constraint_engine import engine as constraint_engine
from app.services.ranking_engine import mission_fit_score
from app.services.quantity_planner import planner
from app.services.budget_repair import repair_engine
from app.services.coverage_score import calculate_coverage

class CartBuilder:
    def __init__(self):
        data_path = Path(__file__).parent.parent / "data" / "catalog.json"
        with open(data_path) as f:
            raw = json.load(f)
        self.catalog: List[Product] = [Product(**p) for p in raw]
    
    def get_candidates(self, need: MissionNeed, budget: float) -> List[Product]:
        return [
            p for p in self.catalog
            if p.category in need.category_candidates
            and p.price <= budget * 1.5
            and p.stock_available
        ]
    
    def build(self, spec: MissionSpec, needs: List[MissionNeed]) -> dict:
        cart: List[CartItem] = []
        remaining_budget = spec.budget_max or 10000
        cart_categories: List[str] = []
        
        # Sort needs by priority (must_have first)
        priority_order = {"must_have": 0, "should_have": 1, "optional": 2}
        sorted_needs = sorted(needs, key=lambda n: priority_order[n.priority])
        
        # First pass: check compatibility and add required accessories as new needs
        extra_needs = []
        for need in sorted_needs:
            candidates = self.get_candidates(need, remaining_budget)
            if candidates:
                for c in candidates:
                    missing, _ = graph.check(c.category, cart_categories)
                    for m in missing:
                        if not any(n.need_id == f"auto_{m}" for n in sorted_needs + extra_needs):
                            from app.services.adapters.base import BaseAdapter
                            extra_need = MissionNeed(
                                need_id=f"auto_{m}",
                                label=m.replace("_", " ").title(),
                                priority="must_have",
                                priority_weight=1.0,
                                category_candidates=[m],
                                units_required=1,
                                packs_required=1,
                                budget_fraction=0.05,
                                budget_ceiling=remaining_budget * 0.10,
                                safety_tags=need.safety_tags,
                                compatibility_check_required=False
                            )
                            extra_needs.append(extra_need)
        
        all_needs = sorted_needs + extra_needs
        
        # Second pass: select products
        for need in all_needs:
            candidates = self.get_candidates(need, remaining_budget)
            if not candidates:
                continue
            
            # Calculate quantity for first valid candidate
            sample = candidates[0]
            qty_result = planner.calculate(need.need_id.replace("serve_", ""), 
                                           sample.pack_size,
                                           {"headcount": spec.headcount or 1})
            packs = qty_result["packs_required"]
            
            # Filter valid candidates
            valid = []
            for product in candidates:
                passes, failures = constraint_engine.check_all(
                    product, need, spec, cart_categories, remaining_budget, packs
                )
                if passes:
                    valid.append(product)
            
            if not valid:
                # Relax quality floor
                valid = [p for p in candidates if p.rating >= 3.0 and p.return_risk <= 0.40]
            
            if not valid:
                continue
            
            # Score and select best
            scored = [(p, mission_fit_score(p, need, spec, packs)) for p in valid]
            scored.sort(key=lambda x: x[1], reverse=True)
            best = scored[0][0]
            
            # Recalculate quantity for selected product
            qty = planner.calculate(need.need_id, best.pack_size, 
                                    {"headcount": spec.headcount or 1})
            final_packs = qty["packs_required"]
            
            cart_item = CartItem(
                cart_item_id=str(uuid4()),
                need_id=need.need_id,
                need_label=need.label,
                asin=best.asin,
                title=best.title,
                price=best.price,
                pack_size=best.pack_size,
                packs_quantity=final_packs,
                units_total=final_packs * best.pack_size,
                total_cost=best.price * final_packs,
                delivery_eta=best.delivery_eta,
                prime=best.prime,
                amazon_now_eligible=best.amazon_now_eligible,
                rating=best.rating,
                explanation=qty.get("explanation", ""),
                is_sponsored=best.sponsored,
                compatibility_flags=[]
            )
            
            cart.append(cart_item)
            cart_categories.append(best.category)
            remaining_budget -= cart_item.total_cost
        
        # Budget repair
        total = sum(item.total_cost for item in cart)
        repair_steps = []
        if spec.budget_max and total > spec.budget_max:
            cart, repair_steps = repair_engine.repair(cart, all_needs, spec.budget_max, self)
        
        # Coverage score
        coverage = calculate_coverage(cart, all_needs)
        
        # Amazon cart URL
        cart_url = self._build_amazon_url(cart)
        
        return {
            "cart_items": [item.dict() for item in cart],
            "total_cost": sum(item.total_cost for item in cart),
            "budget_remaining": (spec.budget_max or 0) - sum(item.total_cost for item in cart),
            "coverage_score": coverage.dict(),
            "repair_summary": {
                "was_repaired": len(repair_steps) > 0,
                "original_total": total,
                "final_total": sum(item.total_cost for item in cart),
                "steps": repair_steps
            } if repair_steps else None,
            "amazon_cart_url": cart_url
        }
    
    def _build_amazon_url(self, cart: List[CartItem]) -> str:
        base = "https://www.amazon.in/gp/aws/cart/add.html"
        params = []
        for i, item in enumerate(cart[:10], 1):
            params.append(f"ASIN.{i}={item.asin}&Quantity.{i}={item.packs_quantity}")
        return base + "?" + "&".join(params)

builder = CartBuilder()
```

---

### STEP K6: API Routes (Hour 14-18)

**`app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from app.routers import mission, catalog, reorder, demo

app = FastAPI(title="MissionCart API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
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
    return {"status": "ok", "service": "missioncart-api"}
```

**`app/routers/mission.py`**

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
from app.services.mission_parser import parse_mission
from app.services.domain_router import route_and_decompose
from app.services.cart_builder import builder
from app.models.mission import MissionSpec

router = APIRouter()

class ParseRequest(BaseModel):
    goal: str
    pincode: str = "560001"

class BuildRequest(BaseModel):
    mission_spec: dict

class AuditRequest(BaseModel):
    existing_cart: List[dict]
    goal: str
    pincode: str = "560001"

@router.post("/parse")
async def parse_goal(request: ParseRequest):
    spec = await parse_mission(request.goal)
    return {"success": True, "data": spec.dict(), "request_id": str(uuid4())}

@router.post("/build")
async def build_cart(request: BuildRequest):
    spec = MissionSpec(**request.mission_spec)
    needs = route_and_decompose(spec)
    result = builder.build(spec, needs)
    result["mission_id"] = spec.mission_id
    return {"success": True, "data": result, "request_id": str(uuid4())}

@router.post("/audit")
async def audit_cart(request: AuditRequest):
    spec = await parse_mission(request.goal)
    needs = route_and_decompose(spec)
    
    # Run existing cart through constraint engine to find flags
    from app.services.constraint_engine import engine
    from app.models.product import Product
    
    flags = []
    for item_data in request.existing_cart:
        try:
            product = Product(**item_data)
        except Exception:
            continue
        
        qty_needed = 1
        if spec.headcount and "plate" in product.category:
            qty_needed = max(1, spec.headcount * 2 // product.pack_size)
        
        if item_data.get("quantity", 1) < qty_needed:
            flags.append({
                "flag_id": str(uuid4()),
                "type": "quantity_error",
                "severity": "error",
                "item_asin": product.asin,
                "title": f"{product.title} — wrong quantity",
                "detail": f"You have {item_data.get('quantity', 1)} pack. Need {qty_needed} packs.",
                "math_explanation": f"2 per child × {spec.headcount} = {spec.headcount * 2}. Packs of {product.pack_size} → {qty_needed} packs.",
                "fix_available": True
            })
        
        if not product.amazon_now_eligible and spec.deadline_hours and spec.deadline_hours <= 24:
            flags.append({
                "flag_id": str(uuid4()),
                "type": "not_amazon_now",
                "severity": "error",
                "item_asin": product.asin,
                "title": f"{product.title} — not on Amazon Now",
                "detail": "This item is not available for instant delivery. Swapping to Amazon Now option.",
                "math_explanation": None,
                "fix_available": True
            })
        
        if product.sponsored:
            if spec.safety_context and spec.safety_context not in product.safety_tags:
                flags.append({
                    "flag_id": str(uuid4()),
                    "type": "sponsored_blocked",
                    "severity": "warning",
                    "item_asin": product.asin,
                    "title": f"Sponsored product blocked — failed {spec.safety_context} check",
                    "detail": f"This sponsored product does not meet {spec.safety_context} requirements.",
                    "math_explanation": None,
                    "fix_available": True
                })
        
        from app.services.compatibility import graph
        missing, _ = graph.check(product.category, [i.get("category","") for i in request.existing_cart])
        for m in missing:
            flags.append({
                "flag_id": str(uuid4()),
                "type": "missing_accessory",
                "severity": "error",
                "item_asin": product.asin,
                "title": f"{product.title} — {m.replace('_', ' ')} not in cart",
                "detail": f"This product requires a {m.replace('_', ' ')} to work.",
                "math_explanation": None,
                "fix_available": True
            })
    
    # Build repaired cart
    repair_result = builder.build(spec, needs)
    repair_result["flags"] = flags
    repair_result["original_cart"] = request.existing_cart
    
    return {"success": True, "data": repair_result, "request_id": str(uuid4())}
```

**`app/routers/demo.py`**

```python
from fastapi import APIRouter
import json
from pathlib import Path

router = APIRouter()

@router.get("/scenarios")
def get_demo_scenarios():
    base = Path(__file__).parent.parent / "data" / "demo_scenarios"
    result = {}
    for f in base.glob("*.json"):
        with open(f) as fp:
            result[f.stem] = json.load(fp)
    return {"success": True, "data": result}

@router.get("/occasions")
def get_occasion_cards():
    from datetime import datetime, date
    cards = [
        {
            "occasion": "Diwali",
            "days_until": 24,
            "last_mission_headcount": 8,
            "last_mission_budget": 3200,
            "prompt_text": "Diwali in 24 days. Your home ready?",
            "prefill_goal": "Diwali celebration at home for 8 guests under 5000",
            "image_emoji": "🪔"
        },
        {
            "occasion": "Riya's Birthday",
            "days_until": 12,
            "last_mission_headcount": 12,
            "last_mission_budget": 3850,
            "prompt_text": "Riya's birthday in 12 days. Last year worked perfectly.",
            "prefill_goal": "Birthday party for 12 kids under 4000",
            "image_emoji": "🎂"
        },
        {
            "occasion": "Monsoon",
            "days_until": 8,
            "last_mission_headcount": None,
            "last_mission_budget": None,
            "prompt_text": "Monsoon arrives in Bangalore in 8 days. Ready?",
            "prefill_goal": "Monsoon prep kit for family of 4 under 3000",
            "image_emoji": "🌧️"
        }
    ]
    return {"success": True, "data": cards}

@router.get("/reorder-alerts")
def get_reorder_alerts():
    alerts = [
        {
            "asin": "B07DEMO001",
            "title": "Ariel Matic Front Load Detergent 2kg",
            "days_remaining": 4,
            "confidence": "high",
            "last_purchase_date": "2025-05-20",
            "suggested_quantity": 1,
            "price": 399,
            "amazon_now_eligible": True
        },
        {
            "asin": "B07DEMO002",
            "title": "Pedigree Adult Dog Food 3kg",
            "days_remaining": 3,
            "confidence": "high",
            "last_purchase_date": "2025-05-24",
            "suggested_quantity": 1,
            "price": 699,
            "amazon_now_eligible": True
        },
        {
            "asin": "B07DEMO003",
            "title": "Colgate Total Toothpaste 150g",
            "days_remaining": 12,
            "confidence": "estimated",
            "last_purchase_date": "2025-04-15",
            "suggested_quantity": 2,
            "price": 89,
            "amazon_now_eligible": True
        }
    ]
    return {"success": True, "data": alerts}
```

**Start command:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Verify all endpoints:**
```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/mission/parse \
  -H "Content-Type: application/json" \
  -d '{"goal": "Birthday party for 12 kids tomorrow under 4000"}'
curl http://localhost:8000/api/demo/scenarios
curl http://localhost:8000/api/demo/occasions
curl http://localhost:8000/api/demo/reorder-alerts
```

---

## CODEX INSTRUCTIONS: FRONTEND BUILD

### Setup Command

```bash
npx create-expo-app missioncart --template blank-typescript
cd missioncart
npx expo install expo-router@3 react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npm install nativewind@4.0.1 tailwindcss@3.4.3
npm install @gorhom/bottom-sheet@4.6.4 react-native-gesture-handler@2.16.0 react-native-reanimated@3.10.1
npm install zustand@4.5.2 axios@1.7.2 expo-haptics expo-notifications
npm install @expo/vector-icons
```

**tailwind.config.js**
```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        amazon: {
          orange: '#FF9900',
          'orange-dark': '#E47911',
          'orange-light': '#FFF3E0',
          bg: '#FFFFFF',
          'bg-secondary': '#F3F3F3',
          border: '#DDDDDD',
          text: '#0F1111',
          'text-secondary': '#565959',
          link: '#007185',
          green: '#007600',
          star: '#FFA41C',
          prime: '#00A8E1',
          red: '#CC0C39',
        }
      },
      borderRadius: {
        amazon: '4px',
      }
    }
  },
  plugins: [],
}
```

---

### SCREEN BUILD ORDER

Build screens in this exact order. Each screen must be visually complete before moving to next.

---

### SCREEN C1: Home Feed (Hour 2-8)

**File: `src/app/(tabs)/index.tsx`**

This is the most important screen. Judges see this first. It must look exactly like Amazon's home screen with three additions: morning approval card at top, occasion cards section, and identity groups section.

Components to build:

**MorningApprovalCard** — the emotional opener
```typescript
// Props: items: string[], total: number, onApprove: () => void, onSkip: () => void
// Layout: Amazon card with orange top strip, item list, big orange Approve button, small Skip link
// On approve: expo-haptics heavy impact, success animation, "Order Placed ✓" state
// Time shown: 7 AM but always visible for demo purposes
```

**OccasionCard** — proactive intelligence
```typescript
// Props: occasion: string, daysUntil: number, emoji: string, promptText: string, onStart: () => void
// Layout: horizontal card, emoji left, text middle, "Start Mission →" button right
// Colors: amazon-orange border-left accent
```

**UserIdentitySection** — the novel feature
```typescript
// Section header: "Your essentials" with subtitle "Based on people like you"
// Profile pill buttons: "Office Gym Guy", "College Student", "Home Chef", "New Parent"
// Below: product grid of 6 items (mock data, amazon-style product cards)
// Note at bottom (small text): "No sponsored products — only what people like you actually buy"
```

**QuickMissionTiles** — fast access
```typescript
// 2x2 grid of mission tiles
// "🎂 Birthday Party", "🏠 New Home", "✈️ Trip Prep", "🧹 Daily Needs"
// Tap → navigates to goal input with prefilled text
```

---

### SCREEN C2: Audit View (Hour 8-16) — BUILD THIS NEXT, IT IS THE DEMO CENTERPIECE

**File: `src/app/audit.tsx`**

This screen must have perfect animations. The flag sequence is the most important UI in the entire app.

```typescript
// State machine: idle → analyzing (3 steps) → showing_flags → repairing → repaired
// 
// Analyzing phase: 3 animated steps with check marks
//   "Checking quantities..." (500ms)
//   "Verifying compatibility..." (500ms)
//   "Checking Amazon Now availability..." (500ms)
//
// Flag animation sequence (use Reanimated withDelay):
//   Flag 1 at 1500ms: slide in from right + red shake
//   Flag 2 at 3000ms: slide in from right + red shake  
//   Flag 3 at 4500ms: slide in from right + amber shake (not Amazon Now)
//   Flag 4 at 6000ms: slide in from right + BLUE border (trust moment, not red)
//
// Each flag card contains:
//   - Icon (✗ red or 🛡 blue)
//   - Title (bold)
//   - Expandable detail with math explanation
//   - Tap anywhere to expand
//
// After all flags: "Fix All Issues →" button appears with upward slide animation
//
// Repair animation:
//   - Budget counter animates from original to repaired (use Reanimated withTiming 800ms)
//   - Coverage score animates from partial to 9/9
//   - Items update with layout animation
//
// Fixed bottom bar: "Add all to Amazon Cart →" button
//   - Opens amazon_cart_url in browser
//   - Uses Linking.openURL
```

**FlagItem component:**
```typescript
interface FlagItemProps {
  flag: AuditFlag
  delayMs: number
  style: 'error' | 'warning' | 'trust'  // trust = blue
}
// error: red left border, ✗ icon
// warning: amber left border, ⚠ icon  
// trust: blue left border, 🛡 icon
```

---

### SCREEN C3: Goal Input (Hour 16-20)

**File: `src/app/(tabs)/missions.tsx`**

```typescript
// Large centered text input (multiline, 3 lines)
// Placeholder: "What are you trying to accomplish?"
// Below: Budget input (₹ prefix, number keyboard)
// Below: 3 quick-start chips:
//   "🎂 Birthday Party" → prefills "Birthday party for 12 kids tomorrow under 4000"
//   "🏠 New Flat Setup" → prefills "New flat setup this weekend under 15000"
//   "✈️ Road Trip" → prefills "Road trip for 4 people this weekend under 5000"
// Submit button: "Plan My Mission →" (orange, full width)
//
// On submit: navigate to /cart/building with goal as param
```

---

### SCREEN C4: Mission Building (Hour 18-22)

**File: `src/app/cart/building.tsx`**

```typescript
// Shows 4 animated steps with progress:
// Step 1: "Understanding your goal..." → spec parsed
// Step 2: "Finding what you need..." → needs decomposed
// Step 3: "Checking Amazon Now availability..." → catalog queried
// Step 4: "Validating your cart..." → constraints checked
//
// Each step: circle with step number → fills with green checkmark when complete
// Amazon-style spinner between steps
// On complete: navigate to /cart/[id] with results
```

---

### SCREEN C5: Cart Results (Hour 20-26)

**File: `src/app/cart/[id].tsx`**

```typescript
// Header: mission title, budget bar, coverage score pill
//
// Budget bar component:
//   - Horizontal bar, green fill showing spent amount
//   - "₹3,850 / ₹4,000 — ₹150 under budget" label
//   - If over budget: red fill
//
// Coverage score pill:
//   - "9/9 ✓" in green
//   - "8/9 — missing party hats" in amber with missing item listed
//
// Per cart item card (Amazon product card style):
//   - Small product image (placeholder box with category icon)
//   - Title (2 lines max, truncated)
//   - Price × quantity = total
//   - Delivery badge: "Now 20 min ✓" (prime blue) or "Tomorrow ✓" (green) or "Late ⚠" (red)
//   - Expandable explanation chip: "i" button → shows math
//   - Amazon Now badge if amazon_now_eligible
//
// Repair summary card (if was_repaired):
//   - "We optimized your cart" header
//   - List of changes with savings
//   - Total saved amount
//
// Fixed bottom: "Add all to Amazon Cart →" orange button
//   - Opens amazon_cart_url
//   - Haptic on tap
```

---

### SCREEN C6: Comparison Bottom Sheet (Hour 26-30)

**File: `src/components/comparison/ComparisonBottomSheet.tsx`**

```typescript
// Trigger: track product views in Zustand. If same 2 ASINs viewed 3+ times alternately:
//   store.trackView(asin)
//   if switchCount >= 3: open comparison sheet
//
// Bottom sheet (gorhom/bottom-sheet, snapPoints: ['70%']):
//   Header: "You keep switching between these two"
//   Subheader: "Here's what's different for your goal"
//
//   Two product cards side by side:
//     [Product A] vs [Product B]
//     Price, rating, key difference highlighted
//
//   AI summary section:
//     "For [goal], [Product A] wins because..."
//     "For general use, [Product B] is better because..."
//
//   Two equal buttons at bottom:
//     [Pick Product A] [Pick Product B]
//
// Call API: GET /api/catalog/compare?asin1=X&asin2=Y&goal=Z
// Mock response hardcoded for demo: compare two balloon sets
```

---

### SCREEN C7: Discover (Community Pages) (Hour 30-34)

**File: `src/app/(tabs)/discover.tsx`**

```typescript
// Section 1: Goal Pages
//   Header: "Popular goals right now"
//   Horizontal scroll of goal tiles:
//     "🏕️ Trekking Essentials", "🎉 Party Season", "📚 JEE Prep", "👶 New Baby"
//
// Trekking page (static, tap from tile):
//   Header with mountain banner image (use solid amazon-orange gradient as placeholder)
//   "🏕️ Trekking Essentials"
//   "What 2,847 trekkers actually bought"
//   Trust badge: "Zero sponsored products — only customer-loved items"
//   Product grid: 8 products with ratings and tiny review quote chip
//   Each product: title, price, rating, tiny quote like "Great for Himalayan treks"
//
// Section 2: Identity Groups
//   Header: "Essentials for people like you"
//   Horizontal profile cards:
//     "Office Gym Dad 💪", "JEE Student 📚", "College Girl ✨", "Home Chef 👨‍🍳"
//   Tap → shows product grid for that profile
//   Note: "No sponsored products"
```

---

### STEP C8: API Client (Hour 20-22, parallel with screens)

**File: `src/lib/api.ts`**

```typescript
import axios from 'axios'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

export const missionAPI = {
  parse: (goal: string, pincode = '560001') =>
    api.post('/api/mission/parse', { goal, pincode }),
  
  build: (missionSpec: object) =>
    api.post('/api/mission/build', { mission_spec: missionSpec }),
  
  audit: (existingCart: object[], goal: string, pincode = '560001') =>
    api.post('/api/mission/audit', { existing_cart: existingCart, goal, pincode }),
}

export const demoAPI = {
  getScenarios: () => api.get('/api/demo/scenarios'),
  getOccasions: () => api.get('/api/demo/occasions'),
  getReorderAlerts: () => api.get('/api/demo/reorder-alerts'),
}
```

**File: `src/store/mission.ts`**

```typescript
import { create } from 'zustand'

interface MissionStore {
  currentSpec: any | null
  currentCart: any | null
  recentViewedAsins: string[]
  viewCounts: Record<string, number>
  
  setSpec: (spec: any) => void
  setCart: (cart: any) => void
  trackProductView: (asin: string) => { shouldShowComparison: boolean; compareAsins: [string, string] | null }
  reset: () => void
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  currentSpec: null,
  currentCart: null,
  recentViewedAsins: [],
  viewCounts: {},
  
  setSpec: (spec) => set({ currentSpec: spec }),
  setCart: (cart) => set({ currentCart: cart }),
  
  trackProductView: (asin) => {
    const { recentViewedAsins } = get()
    const updated = [asin, ...recentViewedAsins.slice(0, 9)]
    set({ recentViewedAsins: updated })
    
    // Detect switching between 2 products
    if (updated.length >= 6) {
      const last6 = updated.slice(0, 6)
      const uniqueAsins = [...new Set(last6)]
      if (uniqueAsins.length === 2) {
        const asin1Count = last6.filter(a => a === uniqueAsins[0]).length
        const asin2Count = last6.filter(a => a === uniqueAsins[1]).length
        if (asin1Count >= 3 && asin2Count >= 3) {
          return { shouldShowComparison: true, compareAsins: [uniqueAsins[0], uniqueAsins[1]] }
        }
      }
    }
    return { shouldShowComparison: false, compareAsins: null }
  },
  
  reset: () => set({ currentSpec: null, currentCart: null })
}))
```

---

## PARALLEL EXECUTION SCHEDULE

```
HOUR  KIRO (Backend)                    CODEX (Frontend)
─────────────────────────────────────────────────────────
0-2   Project setup + all data files   Expo setup + colors + tab nav
2-4   Pydantic models + compatibility  Home screen: morning approval card
4-6   Quantity planner + catalog       Home screen: occasion cards
6-8   EventAdapter + HomeAdapter       Home screen: identity groups section
8-10  Constraint engine (8 checks)     Audit screen: cart display
10-12 Ranking engine + scoring         Audit screen: flag animations
12-14 Budget repair engine             Audit screen: repair animation
14-16 Cart builder end-to-end          Goal input screen
16-18 API routes + CORS + test         Mission building loading screen
18-20 Audit endpoint complete          Cart results screen
20-22 Demo data finalized              API client + Zustand store
22-24 Backend deployed to Railway      Cart results: checkout button
24-26 Reorder API endpoint             Comparison bottom sheet
26-28 Integration testing              Discover screen (static)
28-30 Edge case fixes                  Demo polish: timing tuning
30-32 Performance: caching hot paths   Demo polish: animation smoothness
32-36 FREEZE code, test demo 10x       FREEZE code, test on real phone
36-40 README + architecture diagram    Screen recording for submission
40-44 PRD document answers             Final bug fixes
44-48 SUBMIT                           SUBMIT
```

---

## INTEGRATION CHECKPOINTS

**Checkpoint 1 (Hour 8):** Backend health endpoint returns 200. Frontend tab navigation works. Morning approval card visible on home screen.

**Checkpoint 2 (Hour 16):** Full parse → build pipeline works via curl. Audit screen shows hardcoded Sneha cart with all 4 flags animating in sequence.

**Checkpoint 3 (Hour 24):** End-to-end: type goal in app → cart built → results shown → Amazon cart URL opens. Demo scenario works completely.

**Checkpoint 4 (Hour 32):** All 5 Tier 1 features working on real phone. Demo rehearsed 5 times. Under 3 minutes.

**Checkpoint 5 (Hour 40):** App deployed (Expo Go QR code). Backend deployed (Railway URL). PRD document filled. Submission ready.

---

## DEPLOYMENT

**Backend (Railway):**
```bash
# Create Dockerfile in backend/
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Push to GitHub → connect Railway → add env vars → deploy
```

**Frontend (Expo Go for demo, EAS for submission):**
```bash
# For demo: just run on device
npx expo start --tunnel

# For submission video: record from device with screen recorder
# EAS build (if time allows):
npx eas build --platform all --profile preview
```

---

## REAL vs MOCK DISCLOSURE

| Component | Status | Details |
|-----------|--------|---------|
| Mission Parser LLM | REAL | Live Amazon Bedrock or Anthropic API |
| Constraint engine | REAL | All 8 checks running |
| Compatibility graph | REAL | 100 curated edges |
| Quantity arithmetic | REAL | Formula-based |
| Budget repair | REAL | 7-step sequence |
| Coverage score | REAL | Live calculation |
| Amazon cart URL | REAL | Opens Amazon.in |
| Product catalog | MOCK | 200 curated SKUs, disclosed |
| ETA values | MOCK | Static per SKU |
| Depletion alerts | MOCK | 3 hardcoded examples |
| Purchase history | MOCK | Hardcoded for demo |
| Community page data | MOCK | Static screen |
| Identity groups | MOCK | Static screen |

---

## FINAL CHECKLIST BEFORE SUBMISSION

- [ ] Morning approval card taps → haptic + confirmation
- [ ] Audit demo runs 3 minutes under, all 4 flags animate in sequence
- [ ] Flag 4 is BLUE not red (trust moment visual)
- [ ] Math explanation expands on flag tap
- [ ] Budget animates from ₹4,340 to ₹3,850 after repair
- [ ] Coverage score shows 9/9 after repair
- [ ] Amazon cart URL opens Amazon.in with items
- [ ] Comparison popup slides up after 3 switches
- [ ] Build mode: type goal → cart appears with explanations
- [ ] Amazon Now badge visible on eligible items
- [ ] Community page shows "Zero sponsored products" badge
- [ ] App runs without crashes for 10 minutes
- [ ] Demo rehearsed 5 times on real phone
- [ ] Backend deployed and responding
- [ ] README has real vs mock table
- [ ] PRD document filled
- [ ] 2-minute backup screen recording exists

---

*Document Version: FINAL | This document is the single source of truth for the entire build.*
*Every agent (Kiro, Codex) follows this document exactly. No improvisation.*
