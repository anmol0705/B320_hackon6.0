from abc import ABC, abstractmethod
from typing import List
from app.models.mission import MissionSpec, NeedItem


class BaseAdapter(ABC):
    @abstractmethod
    def get_needs(self, spec: MissionSpec) -> List[NeedItem]:
        pass

    def _make_need(self, need_id, label, priority, category_candidates,
                   budget_fraction, quantity_rule=None) -> NeedItem:
        weight_map = {"must_have": 1.0, "should_have": 0.6, "optional": 0.3}
        return NeedItem(
            need_id=need_id,
            label=label,
            priority=priority,
            priority_weight=weight_map[priority],
            category_candidates=category_candidates,
            units_required=0,
            packs_required=0,
            budget_fraction=budget_fraction,
            budget_ceiling=0,
            safety_tags=[],
            compatibility_check_required=True
        )
