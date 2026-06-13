# MissionCart
### Amazon HackOn 2026 | PS3: Reimagine Shopping Experience

> Amazon Now delivers in minutes. MissionCart makes sure  
> you ordered the right things.

MissionCart is an occasion operating system for Amazon Now. It turns goals such as "Birthday party for 20 people under ₹3000" into validated carts, audits existing carts, blocks unsafe sponsored recommendations, and prepares proactive reorders.

## Features

1. Morning grocery approval — 7 AM notification, one tap, ordered
2. Goal-based cart building — type a goal, get a complete validated cart
3. Cart audit — finds quantity, compatibility, delivery, and trust issues
4. AI comparison popup — repeated product switching triggers a comparison
5. Occasion intelligence — upcoming occasions can be planned proactively

## Novel Claim

Identity groups connect people to products, not products to products. Amazon organizes by item type. MissionCart organizes by who you are and what you are trying to accomplish.

## Repository Layout

```text
missioncart/
├── backend/
│   ├── app/
│   │   ├── data/                 # Product catalog, compatibility graph, rules
│   │   ├── models/               # Pydantic models
│   │   ├── routers/              # Mission, catalog, demo, reorder APIs
│   │   ├── services/             # Parser, planner, constraints, repair, ranking
│   │   └── main.py               # FastAPI application
│   ├── tests/
│   ├── .env.example
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.toml
├── frontend/
│   ├── src/
│   │   ├── app/                  # Expo Router screens
│   │   ├── components/           # Comparison bottom sheet
│   │   ├── lib/                  # API, constants, types, notifications
│   │   └── store/                # Zustand state
│   ├── app.json
│   ├── package.json
│   ├── babel.config.js
│   ├── metro.config.js
│   └── tailwind.config.js
└── README.md
```

## Pinned Stack

### Backend

- Python 3.11
- FastAPI 0.111.0
- Uvicorn 0.30.1
- Pydantic 2.7.1
- Anthropic SDK 0.28.0
- Boto3 1.34.0
- SQLAlchemy 2.0.30

### Frontend

- React Native 0.74.5
- Expo SDK 51
- Expo Router 3.5.24
- React Native Reanimated 3.10.1
- NativeWind 4
- Zustand 4.5.2
- Axios 1.7.2
- Expo Notifications and Expo Haptics

## Prerequisites

Install these before starting:

- Git
- Python 3.11
- Node.js 20 LTS
- npm
- Android Studio with an Android emulator, or a physical Android device
- Expo Go compatible with Expo SDK 51

Node 20 is recommended. Expo SDK 51 can exhibit slow or stuck Metro builds on newer Node releases such as Node 24.

For iOS, use macOS with Xcode and an iOS Simulator.

## Quick Start

Run the backend and frontend in separate terminals.

### Terminal 1: Backend

```powershell
cd missioncart\backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Frontend

```powershell
cd missioncart\frontend
npm run android
```

For a new machine, complete the detailed setup below first.

## Backend Setup

### Windows PowerShell

```powershell
cd missioncart\backend

py -3.11 -m venv venv

# Use this only if PowerShell blocks activation.
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

Copy-Item .env.example .env
```

### macOS or Linux

```bash
cd missioncart/backend

python3.11 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

cp .env.example .env
```

### Backend Environment

Edit `backend/.env`:

```dotenv
ANTHROPIC_API_KEY=your_key_here
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=ap-south-1
BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-6
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,exp://localhost:8081
```

`ANTHROPIC_API_KEY` is optional for local setup. If it is missing or left as `your_key_here`, the mission parser uses a deterministic demo fallback. The current local implementation does not require AWS credentials to run.

### Start Backend

Run from `missioncart/backend` with the virtual environment active:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected URL:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

### Verify Backend

Health check:

```bash
curl http://localhost:8000/health
```

Expected result contains:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "missioncart-backend"
  }
}
```

Build a mission:

```bash
curl -X POST http://localhost:8000/api/mission/build \
  -H "Content-Type: application/json" \
  -d "{\"goal\":\"Birthday party for 20 people under 3000\",\"budget\":3000}"
```

Run the audit demo:

```bash
curl -X POST http://localhost:8000/api/mission/audit \
  -H "Content-Type: application/json" \
  -d "{\"cart_items\":[],\"headcount\":20,\"occasion\":\"birthday\"}"
```

Run repository checks:

```bash
python catalog_check.py
python api_test.py
```

`api_test.py` expects the backend to already be running on port `8000`.

## Frontend Setup

### Install Dependencies

```bash
cd missioncart/frontend
npm ci
```

Confirm Expo-compatible package versions:

```bash
npx expo install --check
```

Check TypeScript:

```bash
npx tsc --noEmit
```

### Configure the Backend URL

The frontend reads `EXPO_PUBLIC_API_URL`. Create `frontend/.env.local` with the correct value for the target platform.

#### Android Studio Emulator

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```

`10.0.2.2` is the Android Emulator alias for the host computer.

#### iOS Simulator or Web

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8000
```

#### Physical Phone

Find the computer's LAN IP.

Windows:

```powershell
ipconfig
```

macOS or Linux:

```bash
ifconfig
```

Then use that address:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

The computer and phone must be on the same Wi-Fi network. Keep the backend bound to `0.0.0.0`, and allow Python through the operating system firewall on private networks.

After changing `.env.local`, restart Expo with a cleared cache.

## Run the Mobile App

### Android Emulator

1. Start an emulator from Android Studio Device Manager.
2. Confirm that ADB sees it:

```bash
adb devices
```

3. Start MissionCart:

```bash
cd missioncart/frontend
npm run android
```

Equivalent command:

```bash
npx expo start --android
```

### Physical Android Device

```bash
cd missioncart/frontend
npx expo start --lan
```

Open the QR code in Expo Go. The phone and development computer must share the same network.

### iOS Simulator

macOS only:

```bash
cd missioncart/frontend
npm run ios
```

### Web

```bash
cd missioncart/frontend
npm run web
```

The web command uses Metro and clears its cache:

```text
expo start --web --clear
```

The Android experience is the primary demo target.

## Required NativeWind Configuration

The project primarily uses `StyleSheet.create()`, but NativeWind remains installed for stack compatibility.

`babel.config.js` must keep NativeWind as a preset and Reanimated as the final plugin:

```javascript
module.exports = function (api) {
  api.cache(true)

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  }
}
```

Do not move `nativewind/babel` into `plugins`; that causes the Babel error:

```text
.plugins is not a valid Plugin property
```

## Notification Setup

On first launch, the app:

1. Requests notification permission
2. Creates the Android `morning-reorder` channel
3. Schedules a repeating notification for 7:00 AM

The Home screen also includes:

```text
Demo: Test morning notification (fires in 5s)
```

Tap it to verify local notifications quickly. Notifications work best on a physical device. Permission must be granted when prompted.

## Demo Walkthrough

### 1. Morning Reorder

1. Open Home.
2. Tap `Approve & Order`.
3. Confirm the button flashes green.
4. Confirm the inline Amazon Now ordering message appears.

### 2. Goal-Based Cart

1. Enter a goal on Home or open the Missions tab.
2. Use a goal such as:

```text
Birthday party for 20 people under ₹3000
```

3. Tap `Build Cart` or `Plan My Mission`.
4. Watch the four-step building sequence.
5. Verify the cart result, budget bar, delivery badges, and Amazon cart CTA.

If the backend is unavailable, the cart screen uses deterministic fallback data so the demo remains usable.

### 3. Cart Audit

1. Tap the `Cart Audit` banner on Home.
2. Verify the four timed flags:
   - 1.5 seconds: quantity issue
   - 3.0 seconds: missing balloon pump
   - 4.5 seconds: Amazon Now delivery swap
   - 6.0 seconds: sponsored product blocked
3. Verify the blue sponsored-block card looks like a trust success state.
4. At 6.5 seconds, verify the repair progress begins.
5. Verify the total changes from `₹4,340` to `₹3,850`.
6. Tap `Order Repaired Cart via Amazon Now`.
7. Confirm the haptic and order confirmation.

The audit API call is fire-and-forget. Animation timing is deliberately deterministic.

### 4. AI Comparison

Open a cart result and tap:

```text
Demo: Show AI comparison →
```

The Zustand store also detects repeated switching between two products and opens the comparison sheet after both products are viewed three times in the recent six-view window.

### 5. Occasion and Identity Intelligence

1. Scroll the `Coming up` cards on Home.
2. Open Discover.
3. Select an identity group or popular goal.
4. Verify the unsponsored product grid and trust badge.

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Service health |
| POST | `/api/mission/parse` | Parse a natural-language goal |
| POST | `/api/mission/build` | Build a validated mission cart |
| POST | `/api/mission/audit` | Audit and repair a cart |
| GET | `/api/demo/scenarios` | Load the Sneha demo scenario |
| GET | `/api/demo/occasions` | Load occasion cards |
| GET | `/api/demo/reorder-alerts` | Load morning reorder items |
| GET | `/api/catalog/` | Catalog router status |
| GET | `/api/reorder/` | Reorder router status |

All primary responses use this envelope:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "request_id": "uuid"
}
```

## Pre-Demo Verification

Backend:

```bash
cd missioncart/backend
python catalog_check.py
python api_test.py
```

Frontend:

```bash
cd missioncart/frontend
npx tsc --noEmit
npx expo install --check
```

Android runtime logs:

```bash
adb logcat -c
adb logcat | findstr /I "ReactNativeJS FATAL TransformError SyntaxError"
```

On macOS or Linux:

```bash
adb logcat | grep -Ei "ReactNativeJS|FATAL|TransformError|SyntaxError"
```

## Troubleshooting

### Android App Cannot Reach Backend

Do not use `localhost` from the Android Emulator. Set:

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```

Confirm the backend is running with:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Physical Phone Cannot Reach Backend

- Use the computer's LAN IP in `EXPO_PUBLIC_API_URL`
- Put both devices on the same Wi-Fi
- Disable VPNs that isolate local traffic
- Allow port `8000` through the firewall
- Verify `http://COMPUTER_IP:8000/health` in the phone browser

### Metro Is Stuck

Use Node 20 and clear the cache:

```bash
npx expo start --clear
```

For web:

```bash
npm run web
```

If needed, remove generated caches and reinstall:

Windows PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules, .expo
npm ci
npx expo start --clear
```

macOS or Linux:

```bash
rm -rf node_modules .expo
npm ci
npx expo start --clear
```

### Babel Reports `.plugins is not a valid Plugin property`

Keep `nativewind/babel` in `presets`, not `plugins`. Keep `react-native-reanimated/plugin` last in `plugins`.

### PowerShell Blocks `npx`

Use the Windows command shim:

```powershell
npx.cmd expo start --android
```

Or allow scripts for the current terminal only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Port 8000 Is Already Used

Windows:

```powershell
Get-NetTCPConnection -LocalPort 8000
```

macOS or Linux:

```bash
lsof -i :8000
```

Stop the existing process or start the backend on another port and update `EXPO_PUBLIC_API_URL`.

## Docker

Build and run the backend:

```bash
cd missioncart/backend
docker build -t missioncart-backend .
docker run --rm -p 8000:8000 --env-file .env missioncart-backend
```

Verify:

```bash
curl http://localhost:8000/health
```

## Railway Deployment

The backend includes `Dockerfile` and `railway.toml`.

1. Push the repository to GitHub.
2. Create a Railway project from the repository.
3. Set the Railway root directory to:

```text
missioncart/backend
```

4. Add required environment variables.
5. Deploy.
6. Verify:

```text
https://YOUR-SERVICE.up.railway.app/health
```

7. Set the frontend API URL:

```dotenv
EXPO_PUBLIC_API_URL=https://YOUR-SERVICE.up.railway.app
```

8. Restart Expo with a cleared cache.

## Real vs Mock

| Component | Status | Details |
|---|---|---|
| Mission Parser LLM | REAL/FALLBACK | Anthropic Claude when configured; deterministic fallback otherwise |
| Constraint engine | REAL | Eight constraint checks |
| Quantity arithmetic | REAL | Formula-based rules |
| Budget repair | REAL | Priority-based repair sequence |
| Coverage score | REAL | Calculated from mission needs |
| Amazon cart URL | REAL | Opens Amazon.in |
| Product catalog | MOCK | 234 curated SKUs |
| Compatibility graph | MOCK | 27 curated nodes and 45 relationships |
| Purchase history | MOCK | Hardcoded demo data |
| Community page data | MOCK | Static screen |
| Audit animation timing | MOCK | Deterministic demo sequence |

## Scale Story

```text
FastAPI → AWS ECS
SQLite → Aurora Serverless
Anthropic API → Amazon Bedrock
Local compatibility graph → Amazon Neptune
```

At 3 million Amazon Now orders per day, if 20% are goal-driven, MissionCart supports 600,000 sessions. Reducing planning time from 8 minutes to 45 seconds saves approximately 1.2 million customer-hours daily.
