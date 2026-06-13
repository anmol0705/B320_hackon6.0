from app.services.adapters.base import BaseAdapter
from app.models.mission import MissionSpec, NeedItem
from typing import List


class HomeSetupAdapter(BaseAdapter):
    def get_needs(self, spec: MissionSpec) -> List[NeedItem]:
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
