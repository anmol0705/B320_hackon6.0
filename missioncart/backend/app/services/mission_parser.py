import json
import os
from app.models.mission import MissionSpec

SYSTEM_PROMPT = """You are MissionCart's mission parser for Amazon Now India.
Extract structured information from a shopping goal.
Respond ONLY with valid JSON, no markdown, no explanation.

JSON schema:
{
  "raw_goal": str,
  "domain": "event" | "home_setup" | "grocery" | "office" | "travel",
  "headcount": int (default 1),
  "deadline_hours": int (default 24),
  "budget_inr": float,
  "occasion": str | null,
  "constraints": {
    "child_safe": bool,
    "vegetarian": bool,
    "amazon_now_only": bool
  }
}"""


def _get_fallback_spec(goal: str, budget: float) -> MissionSpec:
    return MissionSpec(
        raw_goal=goal,
        goal="Birthday party for 20 people under ₹3000",
        domain="event",
        occasion="kids_birthday",
        headcount=20,
        deadline_hours=18,
        budget_max=budget,
        safety_context="child_safe",
        needs_clarification=False,
        clarification_question=None,
    )


def parse_mission(goal: str, budget: float) -> MissionSpec:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_key_here":
        return _get_fallback_spec(goal, budget)

    try:
        import anthropic

        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Goal: {goal}\nBudget: ₹{budget}"}],
        )

        text = response.content[0].text.strip()
        # Strip markdown fences if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        data = json.loads(text)

        # Map LLM output to MissionSpec fields
        constraints = data.get("constraints", {})
        safety = None
        if constraints.get("child_safe"):
            safety = "child_safe"

        return MissionSpec(
            raw_goal=data.get("raw_goal", goal),
            goal=goal,
            domain=data.get("domain", "event"),
            occasion=data.get("occasion"),
            headcount=data.get("headcount", 1),
            deadline_hours=data.get("deadline_hours", 24),
            budget_max=data.get("budget_inr", budget),
            safety_context=safety,
            needs_clarification=False,
            clarification_question=None,
        )
    except Exception:
        return _get_fallback_spec(goal, budget)
