import urllib.request
import json

BASE = "http://localhost:8000"

def get(path):
    with urllib.request.urlopen(BASE + path) as r:
        return json.loads(r.read())

def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(BASE + path, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

# Test 5: Scenarios
sc = get("/api/demo/scenarios")
print("SCENARIOS success:", sc.get("success"))
data = sc.get("data", {})
print("SCENARIOS has sneha_broken_cart:", "sneha_broken_cart" in str(data))
print("SCENARIOS type:", type(data).__name__)
if isinstance(data, dict):
    print("SCENARIOS keys:", list(data.keys()))
elif isinstance(data, list):
    print("SCENARIOS item count:", len(data))
    if data:
        print("SCENARIOS first item keys:", list(data[0].keys()) if isinstance(data[0], dict) else type(data[0]))

# Test 6: Occasions
occ = get("/api/demo/occasions")
items = occ.get("data", [])
print("\nOCCASIONS count:", len(items))
if items:
    print("OCCASION[0] keys:", list(items[0].keys()))
    has_prefill = [o for o in items if "prefill_goal" in o]
    print("OCCASIONS with prefill_goal:", len(has_prefill))

# Test 7: Reorder
reo = get("/api/demo/reorder-alerts")
alerts = reo.get("data", [])
print("\nREORDER count:", len(alerts))
all_now = [a for a in alerts if a.get("amazon_now_eligible")]
print("REORDER all_now_eligible:", len(all_now))
if alerts:
    print("REORDER[0] keys:", list(alerts[0].keys()))
