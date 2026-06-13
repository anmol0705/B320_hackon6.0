# MissionCart
### Amazon HackOn 2026 | PS3: Reimagine Shopping Experience

> Amazon Now delivers in minutes. MissionCart makes sure 
> you ordered the right things.

## What It Does
MissionCart is an occasion operating system for Amazon Now.
Five features:
1. Morning grocery approval — 7AM notification, one tap, ordered
2. Goal-based cart building — type a goal, get complete validated cart
3. Cart audit — finds everything wrong before checkout
4. AI comparison popup — switches between products 3x → AI compares
5. Occasion intelligence — Diwali in 24 days, tap to plan

## Novel Claim
Identity groups connect PEOPLE to products, not products to products.
Amazon organizes by item type. MissionCart organizes by who you are.

## Tech Stack
- Backend: Python 3.11, FastAPI, Amazon Bedrock (Claude)
- Frontend: React Native, Expo SDK 51, Reanimated
- Deploy: Railway (backend), Expo Go (demo)

## Real vs Mock

| Component | Status | Details |
|---|---|---|
| Mission Parser LLM | REAL | Anthropic Claude via API |
| Constraint engine | REAL | All 8 checks running |
| Quantity arithmetic | REAL | Formula-based |
| Budget repair | REAL | 7-step sequence |
| Coverage score | REAL | Live calculation |
| Amazon cart URL | REAL | Opens Amazon.in |
| Product catalog | MOCK | 234 curated SKUs, disclosed |
| Compatibility graph | MOCK | 28 edges curated |
| Purchase history | MOCK | Hardcoded for demo |
| Community page data | MOCK | Static screen |

## Run Locally

Backend:
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

Frontend:
cd frontend
npx expo start --android

## Scale Story
FastAPI → AWS ECS | SQLite → Aurora Serverless
Anthropic API → Amazon Bedrock | Local graph → Neptune
3M Amazon Now orders/day × 20% goal-driven = 600K sessions
8 min → 45 sec per session = 1.2M customer-hours saved daily
