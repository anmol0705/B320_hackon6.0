from app.services.adapters.base import BaseAdapter
from app.models.mission import MissionSpec, NeedItem
from typing import List


class EventAdapter(BaseAdapter):
    def get_needs(self, spec: MissionSpec) -> List[NeedItem]:
        occasion = spec.occasion or "general_event"

        if "birthday" in occasion or "party" in occasion:
            return self._birthday_needs(spec)
        elif "diwali" in occasion or "festival" in occasion:
            return self._festival_needs(spec)
        elif "annaprasanam" in occasion or "ceremony" in occasion:
            return self._ceremony_needs(spec)
        else:
            return self._general_event_needs(spec)

    def _birthday_needs(self, spec: MissionSpec) -> List[NeedItem]:
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

    def _festival_needs(self, spec: MissionSpec) -> List[NeedItem]:
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

    def _ceremony_needs(self, spec: MissionSpec) -> List[NeedItem]:
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

    def _general_event_needs(self, spec: MissionSpec) -> List[NeedItem]:
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
