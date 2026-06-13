import json
from pathlib import Path
from typing import List, Optional
from uuid import uuid4
from app.models.mission import MissionSpec, NeedItem
from app.models.product import Product


# Domain -> category mapping (used as fallback when no needs provided)
DOMAIN_CATEGORIES = {
    "event": [
        "plates", "cups", "disposable_cups", "napkins", "balloon_set", "balloon_pump",
        "balloon_ribbon", "candles", "cake_knife", "decoration_streamers", "banner",
        "return_gifts", "tablecloth", "decorations", "disposable_spoons", "disposable_forks",
        "cupcake_liners", "party_games", "trash_bags", "tissue_pack",
    ],
    "home_setup": [
        "mattress", "bedsheet", "pillow", "pillow_covers", "water_purifier_electric",
        "induction_cooktop", "induction_compatible_vessel", "kitchen_knife", "chopping_board",
        "towels", "bathroom_organizer", "extension_board", "led_bulb", "curtains",
        "hangers", "storage_box",
    ],
    "grocery": [
        "atta", "rice", "dal", "cooking_oil", "sugar", "tea", "chips", "biscuits",
        "namkeen", "chocolates", "juice", "soda", "water", "detergent", "soap",
        "shampoo", "dishwash", "toilet_cleaner", "toothpaste",
    ],
    "office": [
        "pens", "notebooks", "sticky_notes", "folders", "desk_organizer", "markers",
        "usb_c_hub", "hdmi_cable", "laptop_stand", "keyboard", "mouse", "webcam",
        "cable_organizer", "phone_stand",
    ],
    "travel": [
        "backpack", "packing_cubes", "travel_adapter", "water_bottle", "first_aid_kit",
        "trekking_socks", "rain_jacket", "torch", "energy_bar", "power_bank",
    ],
    "electronics": [
        "usb_c_hub", "hdmi_cable", "laptop_stand", "keyboard", "mouse", "webcam",
        "power_bank", "phone_stand", "cable_organizer",
    ],
    "baby_care": [
        "diapers_newborn", "newborn_formula", "baby_wipes", "baby_soap", "baby_oil",
        "muslin_cloth", "baby_monitor", "baby_bath_tub",
    ],
    "pet_care": [
        "puppy_food", "adult_dog_food", "dog_bowl", "leash", "dog_bed", "pet_wipes",
        "tick_spray",
    ],
}


def _load_catalog() -> List[Product]:
    data_path = Path(__file__).parent.parent / "data" / "catalog.json"
    with open(data_path, encoding="utf-8") as f:
        raw = json.load(f)
    return [Product(**p) for p in raw]


def _compute_score(product: Product, domain: str, budget: float, need: Optional[NeedItem] = None) -> float:
    # Need match: 1.0 if product category is in the need's candidates, else domain check
    if need:
        need_match = 1.0 if product.category in need.category_candidates else 0.3
    else:
        domain_cats = DOMAIN_CATEGORIES.get(domain, [])
        need_match = 1.0 if product.category in domain_cats else 0.3

    delivery_score = 1.0 if product.amazon_now_eligible else 0.4
    now_bonus = 0.1 if product.amazon_now_eligible else 0.0
    price_fit = max(0.0, 1.0 - (product.price / (budget * 0.3)))
    rating_norm = product.rating / 5.0
    return_score = 1.0 - product.return_risk

    score = (
        0.28 * need_match
        + 0.22 * delivery_score
        + 0.10 * now_bonus
        + 0.18 * price_fit
        + 0.14 * rating_norm
        + 0.08 * return_score
    )
    return score


def _passes_constraints(product: Product, budget: float) -> bool:
    if product.price > budget * 0.4:
        return False
    if product.rating < 3.5:
        return False
    if product.return_risk > 0.30:
        return False
    if product.sponsored and product.rating < 4.0:
        return False
    if not product.stock_available:
        return False
    return True


def build_cart(spec: MissionSpec, needs: Optional[List[NeedItem]] = None) -> dict:
    """Build cart using needs from domain router, or fallback to domain-based selection."""
    catalog = _load_catalog()
    budget = spec.budget_max or 3000.0
    domain = spec.domain or "event"

    if needs:
        return _build_with_needs(catalog, spec, needs, budget, domain)
    else:
        return _build_by_domain(catalog, spec, budget, domain)


def _build_with_needs(catalog: List[Product], spec: MissionSpec, needs: List[NeedItem], budget: float, domain: str) -> dict:
    """Build cart by fulfilling each need with best product."""
    cart_items = []
    remaining_budget = budget
    used_categories = set()

    # Sort needs: must_have first, then should_have, then optional
    priority_order = {"must_have": 0, "should_have": 1, "optional": 2}
    sorted_needs = sorted(needs, key=lambda n: priority_order.get(n.priority, 2))

    for need in sorted_needs:
        if remaining_budget <= 0:
            break

        # Find candidates matching this need's categories
        candidates = [
            p for p in catalog
            if p.category in need.category_candidates
            and _passes_constraints(p, budget)
            and p.category not in used_categories
        ]

        if not candidates:
            # Try relaxed: any category in need candidates, allow used categories
            candidates = [
                p for p in catalog
                if p.category in need.category_candidates
                and _passes_constraints(p, budget)
            ]

        if not candidates:
            continue

        # Score and pick best
        scored = [(p, _compute_score(p, domain, budget, need)) for p in candidates]
        scored.sort(key=lambda x: x[1], reverse=True)
        best = scored[0][0]

        # Check if we can afford it
        if best.price > remaining_budget:
            # Try cheaper alternative
            affordable = [(p, s) for p, s in scored if p.price <= remaining_budget]
            if not affordable:
                continue
            best = affordable[0][0]

        used_categories.add(best.category)
        remaining_budget -= best.price

        cart_items.append({
            "cart_item_id": str(uuid4()),
            "need_id": need.need_id,
            "need_label": need.label,
            "asin": best.asin,
            "title": best.title,
            "price": best.price,
            "pack_size": best.pack_size,
            "packs_quantity": 1,
            "units_total": best.pack_size,
            "total_cost": best.price,
            "delivery_eta": best.delivery_eta,
            "prime": best.prime,
            "amazon_now_eligible": best.amazon_now_eligible,
            "rating": best.rating,
            "explanation": f"Best {best.category.replace('_', ' ')} for your {need.label.lower()}",
            "is_sponsored": best.sponsored,
            "mission_fit_score": round(scored[0][1], 3),
        })

    total_cost = sum(item["total_cost"] for item in cart_items)
    total_needs = len(needs)
    covered = len(cart_items)

    return {
        "mission_id": spec.mission_id,
        "cart_items": cart_items,
        "total_cost": total_cost,
        "budget_remaining": budget - total_cost,
        "coverage_score": {
            "fraction": covered / total_needs if total_needs > 0 else 0,
            "covered": covered,
            "total": total_needs,
            "display": f"{covered}/{total_needs}",
            "all_must_haves_covered": all(
                any(item["need_id"] == n.need_id for item in cart_items)
                for n in needs if n.priority == "must_have"
            ),
            "missing": [n.label for n in needs if not any(item.get("need_id") == n.need_id for item in cart_items)],
        },
        "delivery_status": {
            "all_on_time": all(item["amazon_now_eligible"] for item in cart_items),
            "all_amazon_now": all(item["amazon_now_eligible"] for item in cart_items),
            "bottleneck_items": [item for item in cart_items if not item["amazon_now_eligible"]],
            "message": "All items available on Amazon Now ⚡" if all(item["amazon_now_eligible"] for item in cart_items) else "Some items arrive tomorrow",
        },
        "repair_summary": None,
        "flags": [],
        "amazon_cart_url": _build_amazon_url(cart_items),
        "warnings": [],
    }


def _build_by_domain(catalog: List[Product], spec: MissionSpec, budget: float, domain: str) -> dict:
    """Fallback: build cart by domain category matching without needs."""
    domain_cats = DOMAIN_CATEGORIES.get(domain, [])

    candidates = [
        p for p in catalog
        if p.category in domain_cats and _passes_constraints(p, budget)
    ]

    if len(candidates) < 8:
        candidates = [p for p in catalog if _passes_constraints(p, budget)]

    scored = [(p, _compute_score(p, domain, budget)) for p in candidates]
    scored.sort(key=lambda x: x[1], reverse=True)

    # Deduplicate by category
    seen_categories = set()
    selected = []
    for product, score in scored:
        if product.category not in seen_categories:
            seen_categories.add(product.category)
            selected.append((product, score))
        if len(selected) >= 8:
            break

    if len(selected) < 8:
        for product, score in scored:
            if (product, score) not in selected:
                selected.append((product, score))
            if len(selected) >= 8:
                break

    # Budget repair
    selected.sort(key=lambda x: x[1], reverse=True)
    while sum(p.price for p, _ in selected) > budget and len(selected) > 4:
        selected.pop()

    cart_items = []
    for product, score in selected:
        cart_items.append({
            "cart_item_id": str(uuid4()),
            "need_label": product.category.replace("_", " ").title(),
            "asin": product.asin,
            "title": product.title,
            "price": product.price,
            "pack_size": product.pack_size,
            "packs_quantity": 1,
            "units_total": product.pack_size,
            "total_cost": product.price,
            "delivery_eta": product.delivery_eta,
            "prime": product.prime,
            "amazon_now_eligible": product.amazon_now_eligible,
            "rating": product.rating,
            "explanation": f"Best match for {product.category.replace('_', ' ')} in your {domain} mission",
            "is_sponsored": product.sponsored,
            "mission_fit_score": round(score, 3),
        })

    total_cost = sum(item["total_cost"] for item in cart_items)

    return {
        "mission_id": spec.mission_id,
        "cart_items": cart_items,
        "total_cost": total_cost,
        "budget_remaining": budget - total_cost,
        "coverage_score": {
            "fraction": 1.0 if len(cart_items) >= 8 else len(cart_items) / 8.0,
            "covered": len(cart_items),
            "total": 8,
            "display": f"{len(cart_items)}/8",
            "all_must_haves_covered": len(cart_items) >= 4,
            "missing": [],
        },
        "delivery_status": {
            "all_on_time": all(item["amazon_now_eligible"] for item in cart_items),
            "all_amazon_now": all(item["amazon_now_eligible"] for item in cart_items),
            "bottleneck_items": [item for item in cart_items if not item["amazon_now_eligible"]],
            "message": "All items available on Amazon Now ⚡" if all(item["amazon_now_eligible"] for item in cart_items) else "Some items arrive tomorrow",
        },
        "repair_summary": None,
        "flags": [],
        "amazon_cart_url": _build_amazon_url(cart_items),
        "warnings": [],
    }


def _build_amazon_url(cart_items: list) -> str:
    base = "https://www.amazon.in/gp/aws/cart/add.html"
    params = []
    for i, item in enumerate(cart_items[:10], 1):
        params.append(f"ASIN.{i}={item['asin']}&Quantity.{i}={item['packs_quantity']}")
    return base + "?" + "&".join(params) if params else base
