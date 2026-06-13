# MissionCart — Master Strategy Document
## Amazon HackOn 2026 | PS3: Reimagine Shopping Experience
### Version: FINAL | Built for Amazon Now

---

> **North Star:** Reduce customer effort from the moment of thinking about buying something to the moment of final payment — with zero friction, zero guesswork, and zero wasted decisions.

---

## SECTION 1: WHAT WE ARE BUILDING

### The Core Idea

MissionCart is not a shopping assistant. It is an **occasion operating system** built on top of Amazon Now.

Amazon Now already delivers in minutes. What it cannot do is:
- Understand WHY you need something
- Build the complete basket automatically
- Tell you when you are about to run out before you know it
- Match you to products based on who you are, not just what you searched

MissionCart closes all four gaps simultaneously.

### The One-Line Pitch

> **"Amazon Now already delivers in minutes. MissionCart makes sure you ordered the right things."**

### Amazon Now Focus (Critical Context)

The problem statement specifically calls out Amazon Now — Amazon's instant delivery platform. This changes our positioning:

- Speed is already solved. Amazon Now delivers in 10-20 minutes.
- The remaining friction is **before** the order is placed, not after.
- Our solution attacks the decision-making friction — what to order, how much, what goes with what.
- Every feature must answer: "How does this reduce the time from need to checkout on Amazon Now?"

---

## SECTION 2: ALL FEATURES — DETAILED BREAKDOWN

### TIER 1: DEMO-READY FEATURES (Must work live in 48h)

---

#### Feature 1: Morning Grocery Approval

**What it is:**
At 7 AM every day, a push notification appears on the user's phone:
"Good morning. Your usual order — Milk (2L), Eggs (12), Bread — ₹127. Approve?"
One tap: Approved. Order placed on Amazon Now. Arrives in 20 minutes.

**The customer insight:**
Indian households order the same grocery items 4-5 days per week. They open Amazon Now, search the same things, add to cart, and checkout. This takes 3-5 minutes daily = 20+ minutes per week wasted on identical decisions.

**How we build it:**
- Purchase history analysis: track items bought 3+ times per week
- Pattern detection: item + frequency + quantity = routine order
- Morning scheduler: 7 AM notification via Expo Notifications / AWS SNS
- One-tap approval: single button sends pre-built cart to order API
- Mock implementation: hardcoded routine order for demo (milk, eggs, bread)
- Haptic feedback on approval: `expo-haptics` confirms the tap

**Why it is novel:**
Zomato does this for food delivery. Nobody does this for Amazon grocery. The key difference from Subscribe and Save: no fixed interval, no subscription management, no over-accumulation. It learns your actual behavior.

**Amazon Now alignment:**
Directly reduces daily order friction on Amazon Now. Every approved routine order is one full funnel eliminated.

---

#### Feature 2: Goal-Based Cart Building (Build Mode)

**What it is:**
User types a goal. MissionCart builds the complete cart.

Input: "Birthday party for 12 kids tomorrow under ₹4,000"
Output: Complete validated cart with correct quantities, compatible items, prime-eligible products, total under budget.

**The customer insight:**
When customers have a goal (not a product in mind), Amazon forces them to decompose the goal manually into individual product searches. This is the highest-friction shopping scenario.

**How we build it:**

Stage 1 — LLM Parser (Amazon Bedrock Claude):
- Input: raw natural language goal
- Output: structured Mission Spec JSON
  ```json
  {
    "goal": "birthday party",
    "domain": "event",
    "occasion": "kids_birthday",
    "headcount": 12,
    "deadline_hours": 18,
    "budget_max": 4000,
    "safety_context": "child_safe"
  }
  ```

Stage 2 — Domain Router:
- EventAdapter: parties, festivals, ceremonies
- HomeSetupAdapter: new flat, hostel, home office
- TravelAdapter: treks, road trips, pilgrimages
- BabyCareAdapter: age-specific product safety
- PetCareAdapter: breed/age/size constraints

Stage 3 — Mission Decomposer:
- Breaks goal into functional needs with priorities
- must_have (weight 1.0) / should_have (0.6) / optional (0.3)

Stage 4 — Quantity Planner:
- Formula: `ceil(headcount × usage_rate × buffer ÷ pack_size)`
- 12 kids → 24 plates (2 per child × packs of 6 = 4 packs)
- Rules library covers 30+ common need types

Stage 5 — Constraint Solver (8 checks per product):
1. Budget headroom
2. Delivery deadline (Amazon Now eligible = arrives in 20 min)
3. Quantity feasibility
4. Compatibility (balloon set needs pump)
5. Return risk ≤ 30%
6. Quality floor ≥ 3.5 stars
7. Safety constraints (child_safe tag required)
8. Sponsored validity (sponsored only if passes 1-7)

Stage 6 — Budget Repair (if over budget):
1. Trim buffer 15% → 5%
2. Swap to cheaper equivalent
3. Optimize pack economics
4. Drop optional needs first
5. Never silently drop must-have

**Tech note:** LLM plans. Compatibility graph knows. Solver verifies. The cart is correct by construction.

---

#### Feature 3: Cart Audit (Audit Mode)

**What it is:**
User shows their existing cart and states their goal. System finds everything wrong — before checkout.

**Demo sequence (timed for maximum impact):**
- 0.0s: Sneha's broken cart appears (12 plates, balloon set, streamers, cups)
- 1.5s: Flag 1 drops — "12 plates. You need 24. (2 per child × 12 kids)"
- 3.0s: Flag 2 drops — "Balloon set selected. No pump in cart."
- 4.5s: Flag 3 drops — "Streamers not available on Amazon Now. Swapping."
- 6.0s: Flag 4 drops — "Sponsored cups blocked — failed child_safe check."
- 7.5s: "Fix All" button. Animated repair. Budget: ₹4,340 → ₹3,850. Coverage: 9/9.

**Why this wins the demo:**
Every judge who has ever hosted a party recognizes Flag 1. They have run out of plates. The recognition creates an emotional lean-forward moment that no slide can replicate.

**How we build it:**
- Load Sneha's cart from demo JSON
- Run existing Mission Spec through constraint engine
- Map each failed check to a flag type
- Animate flags with React Native Reanimated staggered sequence
- Repair button runs budget repair engine and re-renders cart

---

#### Feature 4: AI Comparison Popup

**What it is:**
When a user switches between the same two products 3 or more times, a bottom sheet slides up automatically:
"You keep switching between these two. Here is what's different."
- Side-by-side: key spec differences
- AI summary: "For a kids birthday party, Set A wins — 340 parents said colors were brighter and sizes were better for children."
- Two buttons: Pick A / Pick B

**Why this is the out-of-the-box idea:**
No existing e-commerce platform does this. Amazon shows "compare" buttons. Nobody detects switching behavior and proactively surfaces goal-aware comparison.

**How we build it:**
- Track product view events in Zustand store
- If same two ASINs viewed alternately 3+ times: trigger comparison
- Pull product metadata + top 50 reviews for each
- Amazon Bedrock call: summarize reviews through the lens of user's current goal
- Display via @gorhom/bottom-sheet

**Prompt for the comparison:**
```
User goal: {mission_goal}
Product A: {title_a}, {rating_a}★, {review_count_a} reviews
Product B: {title_b}, {rating_b}★, {review_count_b} reviews
Top reviews A: {top_reviews_a}
Top reviews B: {top_reviews_b}

In 2 sentences each, explain which product is better 
for this specific goal based on what real customers said.
Be specific. Name the reviewers' use cases.
```

---

#### Feature 5: Occasion Intelligence Feed

**What it is:**
The home screen is a proactive feed of upcoming occasions relevant to the user.
- "Diwali in 24 days" — Start Diwali Mission
- "Riya's birthday in 12 days" — Rebuild last year's mission
- "Monsoon arrives in Bangalore in 8 days" — Monsoon prep kit
- "Friday night party season" — Party essentials

Each card has a "Start Mission" button that pre-fills the goal input.

**How we build it:**
- Indian occasion calendar (JSON): Diwali, Holi, Navratri, Eid, Eid, Dussehra, Christmas, Pongal, Onam, Annaprasanam, Grihapravesh
- Location-aware monsoon dates (pincode → region → monsoon window)
- User purchase history scan: detect past occasion missions
- Cards generated from occasion calendar + purchase history intersection
- Amazon Now integration: all occasion missions filter for Now-eligible products first

---

### TIER 2: SHOW AS BEAUTIFUL SCREENS (Static but polished)

---

#### Feature 6: User Identity Groups (The Novel Feature)

**What it is and why it is novel:**
Amazon currently connects products to products: "Customers who bought X also bought Y."

MissionCart connects **people to products**: "Office Gym Guy buys these things. You are an Office Gym Guy. Here is your section."

Profile groups:
- Office Gym Dad
- JEE Prep Student
- College Girl Essentials
- New Parent (0-6 months)
- Work From Home Setup
- Budget Hostel Student
- Weekend Trekker
- Home Chef

This is **psychographic segmentation applied to instant commerce**. It has never been done on Amazon or any major e-commerce platform.

**The anti-sponsored angle (trust differentiator):**
Brands cannot pay to appear in these sections. Only products that people in this identity group actually buy and rate highly appear. This is displayed prominently: "No sponsored products. Only what Office Gym Dads actually buy."

**How to pitch this as novel to judges:**
"Amazon currently has item groups — Lifestyle Essentials, Home Decor. We have identity groups. The difference is that an item group shows products. An identity group shows you who these products are for. When you see yourself in a group, your conversion rate is fundamentally different. You are not buying a product. You are expressing an identity."

**How we build it (production roadmap):**
- User profiling: purchase history + search patterns + category weights
- Clustering: k-means or collaborative filtering to create identity clusters
- Group labeling: LLM labels clusters based on top product categories
- Amazon Personalize: production-scale personalized identity groups

**For hackathon:** Beautiful static screen with 4-6 profile tiles. Tap "Office Gym Dad" → pre-filled product grid. Real data from mock catalog.

---

#### Feature 7: Community Goal Pages

**What it is:**
A page called "Trekking Essentials" showing what 2,847 real trekkers bought, with review snippets and zero sponsored products.

Other goal pages:
- Party Season
- Monsoon Ready
- JEE Prep Kit
- New Baby Essentials
- Home Office Setup

**The trust story:**
At the bottom: "This page contains zero sponsored products. Only what customers loved for this specific goal appears here. Brands cannot pay for placement."

**Why this builds Amazon trust:**
Amazon has a reputation for cluttered sponsored results. A trusted, sponsor-free goal page is a direct response to the biggest criticism of Amazon's current search experience.

**How we build it (production):**
- User purchase tagging: "What were you buying this for?" after delivery
- Activity tagging: user categorizes purchase → gets loyalty points
- Algorithm: items with highest purchase rate + rating within goal category
- Display: product grid ranked by goal-specific purchase frequency

**For hackathon:** One static beautiful screen for Trekking Essentials. Real product names and ratings. The no-sponsored-products badge prominently displayed.

---

#### Feature 8: Periodic Smart Reorder

**What it is:**
For any product bought periodically, MissionCart learns the interval and sends a reorder notification before the user runs out.

- Ariel 2kg bought every 28 days → notification at day 24: "Running low. Reorder?"
- Dog food 3kg bought every 21 days → notification day 17
- Unlike Subscribe and Save: no fixed interval, no subscription, learns actual usage

**Notification card:**
"Ariel 2kg — predicted to run out in 4 days. Last order: ₹399. Reorder via Amazon Now?" → Approve / Skip

**How we build it:**
```python
personal_rate = mean(last_3_purchase_intervals)
predicted_reorder = last_purchase_date + timedelta(days=personal_rate)
alert_date = predicted_reorder - timedelta(days=7)
```

**For hackathon:** 3 hardcoded demo alerts on the Reorder dashboard tab.

---

### TIER 3: ROADMAP SLIDES ONLY

These are described in the future vision section, not demoed:

- **Mission Memory:** Past missions saved with outcomes, one-tap rebuild
- **Community Photos:** Trek photos after buying trekking essentials (Amazon meets Instagram)
- **Mission Sharing Card:** Shareable "Riya's Birthday — 9 items, ₹3,850" card
- **User-Created Categories + Loyalty Points:** Users tag purchases, earn points
- **Smart Substitution Feed:** "Your Ariel is now ₹180 more. 3,200 similar users switched to Surf Excel."
- **Pre-Checkout Intelligence:** 3 warnings before payment — late item, price drop, compatibility

---

## SECTION 3: TECH STACK OPTIONS

### Option A: Maximum AWS Alignment (Recommended for Judges)

| Layer | Technology | Why |
|-------|-----------|-----|
| Mobile App | React Native 0.74 + Expo SDK 51 | Cross-platform, fastest to build, runs on real device |
| Navigation | Expo Router 3.5 | File-based routing, clean architecture |
| Styling | NativeWind 4.0 | TailwindCSS for React Native |
| Animations | React Native Reanimated 3.10 | Smooth 60fps flag animations |
| State | Zustand 4.5 | Lightweight, no boilerplate |
| Backend | FastAPI 0.111 + Python 3.11 | Fast, async, great for LLM orchestration |
| LLM | Amazon Bedrock (Claude claude-sonnet-4-6) | Direct AWS integration, scales natively |
| Database | DynamoDB (prod) / SQLite (hackathon) | AWS-native, infinite scale |
| Auth | Amazon Cognito | AWS-native user management |
| Push Notifications | AWS SNS + Expo Notifications | AWS-native, proven at scale |
| Deployment | AWS ECS + API Gateway (backend) | Native AWS, scales to Amazon's infrastructure |
| CDN | Amazon CloudFront | Static assets at edge |
| Recommendations | Amazon Personalize | AWS-native ML for identity groups |

**Why this stack wins with judges:**
Every component has a direct AWS/Amazon equivalent. The production story is: zero re-architecture required. MissionCart can be deployed inside Amazon's existing infrastructure tomorrow. Judges who work at Amazon will recognize every service name.

---

### Option B: Speed-First Stack (If AWS setup is slow)

| Layer | Technology | Why |
|-------|-----------|-----|
| Mobile App | React Native + Expo | Same |
| Backend | FastAPI + Python 3.11 | Same |
| LLM | Anthropic API (claude-sonnet-4-6) | Simpler setup, same model |
| Database | SQLite → Railway | Zero setup, deploy in minutes |
| Push | Expo Notifications (local) | No external service needed |
| Deployment | Railway (backend) + Vercel (frontend if web) | Fastest deploy |

**Recommendation:** Start with Option B for speed. Present Option A as the production architecture in the pitch. The code is identical — only the service connections change.

---

### The Scalability Story (For Judge Q&A)

When asked "How does this scale to Amazon's level?":

| Component | Hackathon | Production (Amazon) |
|-----------|-----------|---------------------|
| LLM | Bedrock Claude | Bedrock with reserved capacity |
| Database | SQLite | Aurora Serverless PostgreSQL |
| Compatibility Graph | JSON file | Amazon Neptune (graph DB) |
| Notifications | Expo local | AWS SNS + FCM |
| User Profiling | Mock groups | Amazon Personalize |
| Community Pages | Static | DynamoDB + ElasticSearch |
| Cart Validation | FastAPI | AWS Lambda + API Gateway |
| Reorder Intelligence | Hardcoded | AWS EventBridge + SageMaker |

---

## SECTION 4: WHAT MAKES THIS NOVEL

### The Primary Novel Claim: Identity Groups over Item Groups

**Current Amazon:** Products linked to products.
"Customers who bought this also bought..."
"Frequently bought together..."

**MissionCart:** People linked to products.
"Office Gym Dads buy these things."
"JEE Prep Students use these."

**Why this has never been done:**
E-commerce platforms have always been product-centric. The catalog is the organizing principle. Users are visitors to the catalog. MissionCart inverts this — the user identity is the organizing principle. The catalog serves the identity.

This is not a recommendation algorithm improvement. It is a fundamental UX paradigm shift. Instead of "what product do you want?", the question becomes "who are you?" and the platform serves accordingly.

**Analogy for judges:** Amazon is currently a library organized by Dewey Decimal. MissionCart adds a "what kind of reader are you?" section. Same books. Completely different discovery experience.

### Secondary Novel Claims

1. **Goal-to-cart with constraint solving** — LLM plans, solver verifies. The cart is guaranteed correct, not suggested.
2. **Cart audit before checkout** — Nobody catches cart errors before payment. We do.
3. **Behavior-detected comparison popup** — No platform watches switching behavior and auto-surfaces goal-aware comparisons.
4. **Amazon Now integration for occasion missions** — Instant delivery + goal planning = occasions handled same-day.

---

## SECTION 5: HOW TO SCALE 100x

### Current State (Hackathon Prototype)
- 1 city (Bangalore)
- 2 domain adapters (Event, Home Setup)
- 200 mock SKUs
- 100 compatibility graph edges
- 3 hardcoded user profile groups
- Bedrock Claude for LLM calls

### 10x Scale (3 months post-hackathon)
- All Indian cities with Amazon Now coverage
- 10 domain adapters (all major occasion types)
- Full Amazon catalog via PA API v5
- Compatibility graph → Amazon Neptune with 10,000+ edges mined from return data
- 50+ user identity groups via Amazon Personalize clustering
- Real purchase history for reorder intelligence
- Expected users: 100,000 MAU

### 100x Scale (12 months)
**Technical:**
- Serverless backend: AWS Lambda + API Gateway (auto-scales to 0)
- Caching: ElastiCache for popular goal decompositions
- Graph DB: Neptune with daily updates from purchase/return signals
- ML: SageMaker for real-time quantity rule learning
- Event-driven: EventBridge triggers reorder checks at midnight per user segment

**Product:**
- MissionCart embedded natively in Amazon app (not a standalone app)
- Morning approval card appears in Amazon Now home screen
- Identity groups appear as personalized sections in Amazon browse
- Goal pages powered by real community purchase data

**The number for judges:**
Amazon India processes approximately 3 million orders per day on Amazon Now. If MissionCart reduces average cart-building time from 8 minutes to 45 seconds for goal-driven occasions (estimated 20% of orders), that is 700,000 sessions × 7 minutes saved = 82,000 customer-hours recovered daily. At ₹50/hour opportunity cost: ₹4.1 crore of customer time returned per day.

---

## SECTION 6: PRD DOCUMENT ANSWERS

Filling the HackOn Solution Document fields:

### 1. The Problem
Amazon Now delivers in minutes. But customers still spend 8-15 minutes deciding what to order — searching product by product, guessing quantities, missing accessories, discovering incompatibilities only after delivery. For goal-driven occasions (parties, home setup, travel prep), this friction is highest. MissionCart eliminates the decision work entirely, not just the delivery time.

### 2. Why It Matters
500 million Indians use e-commerce. Amazon Now is growing 40% YoY. The last unsolved friction in instant commerce is pre-order decision making. When a customer plans a birthday party on Amazon Now, they make 15-20 individual decisions: each category, each product, each quantity. MissionCart collapses this to one decision: state your goal.

### 3. Theme Alignment
Directly addresses PS3: "Shopping by Intent" and "Predictive and Confident." Specifically enhances Amazon Now by making instant delivery useful for complex multi-item occasions, not just single replenishment orders.

### 4. What Makes This Novel
Primary: Identity-centric product discovery — the first system that organizes Amazon around who you are, not what you searched. Secondary: cart validation before checkout — the first system that tells you your cart is wrong before you pay.

### 5. Target Customer
Primary: Urban Indian households, 25-40, using Amazon Now for daily needs and occasional event planning. Pain: they know what they want to accomplish but not exactly what to order or how much.

### 6. How We Solve It
Five core features: (1) Goal-based cart building, (2) Cart audit before checkout, (3) Morning grocery approval, (4) AI comparison popup for indecisive browsing, (5) Identity-based product discovery sections.

### 7. Working Prototype
Mobile app (React Native + Expo) with live demo on real phone. Backend (FastAPI + Amazon Bedrock). All five Tier 1 features working end-to-end.

---

## SECTION 7: 48-HOUR BUILD PRIORITY

### The Absolute Minimum to Win

If only these work perfectly, we can win:
1. Morning approval card (emotional opener)
2. Audit demo with 4 flags (lean-forward moment)
3. AI comparison popup (out-of-the-box feature)
4. Goal build for birthday (core feature)
5. Amazon-style UI on real phone (credibility)

### Build Order (Parallel Streams)

**Stream A — Backend (Kiro):**
Hour 0-2: Project setup, FastAPI skeleton, all Pydantic models, data files
Hour 2-8: Mission parser (Bedrock), EventAdapter, quantity planner
Hour 8-16: Constraint engine (all 8 checks), ranking engine
Hour 16-22: Budget repair, coverage score, explanation layer
Hour 22-28: All API endpoints tested with curl
Hour 28-36: Demo data hardened, caching enabled

**Stream B — Frontend (Codex):**
Hour 0-2: Expo project setup, Amazon colors, tab navigation
Hour 2-8: Home screen with morning approval card
Hour 8-16: Audit screen with animated flags
Hour 16-22: Cart results screen, coverage score, checkout button
Hour 22-28: Goal input + build mode
Hour 28-36: Comparison bottom sheet, occasion cards
Hour 36-40: Community page static screen, user profile groups static screen
Hour 40-44: Demo polish, real phone test
Hour 44-48: Video recording, README, submission

---

## SECTION 8: DEMO SCRIPT (3 MINUTES ON REAL PHONE)

**0:00-0:20 — THE OPENER (Morning Approval)**
Show phone home screen. Morning approval card visible.
"This is MissionCart. It is 7 AM. Amazon Now delivers in 20 minutes.
Watch." Tap Approve. Haptic. Order confirmed.
"Done. You didn't open Amazon. You didn't search. You approved.
That is the future of daily commerce."

**0:20-0:40 — THE PROBLEM**
Scroll. Show Riya's birthday occasion card.
"Her daughter's birthday is in 12 days. She needs to order supplies
for 12 kids. She already built a cart. Let's check it."

**0:40-1:30 — THE AUDIT (THE LEAN-FORWARD MOMENT)**
Tap Audit Cart. Loading: 3 animated steps.
Flag 1: "12 plates. She needs 24." Tap flag: "2 per child × 12 = 24."
Flag 2: "Balloon set. No pump in cart."
Flag 3: "Streamers not on Amazon Now. Swapping to Prime equivalent."
Flag 4: "Sponsored cups blocked — failed child safe check." (Blue flag)
"Everything that would have gone wrong at the party. Caught right now."
Tap Fix All. Animated repair. Budget ₹4,340 → ₹3,850. Coverage 9/9.

**1:30-1:50 — THE COMPARISON POPUP**
Browse balloon sets. Switch between two options 3 times.
Bottom sheet slides up automatically.
"AI noticed you keep switching. For a kids birthday, Set A wins —
340 parents said the colors were brighter for children."
One tap. Decision made.

**1:50-2:10 — THE IDENTITY SECTION**
Scroll home. Show "Office Gym Dad" section.
"These sections show what people like you actually buy.
No sponsored products. Only what worked for people like you."

**2:10-2:30 — THE OCCASION FEED**
Show Diwali card (24 days). Tap Start Mission.
"Same engine. Different goal. Any occasion. Any budget. Any deadline."

**2:30-3:00 — THE CLOSE**
Show architecture slide (1 second).
"LLM plans. Compatibility graph knows. Solver verifies.
The cart is correct by construction."
Final screen with tagline.
"Amazon Now delivers in minutes.
MissionCart makes sure you ordered the right things.
That is the last unsolved problem in instant commerce."

---

*Document Version: FINAL | Last Updated: Pre-Hackathon | Follow this exactly.*
