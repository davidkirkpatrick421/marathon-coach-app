# Marathon AI Coaching System
## System Architecture & Build Plan

**Project:** Belfast Marathon 2027 — Training Dashboard + Claude MCP Integration  
**Stack:** Vite/React, Node.js/Express, Supabase, Strava API, Claude MCP  
**Owner:** David Kirkpatrick  
**Last Updated:** May 2026

---

## 1. What This System Is

Two separate but connected pieces:

**1. React Dashboard (browser webapp)**
A training reference portal at yourapp.vercel.app. Displays the training plan, recent Strava activities visualised, cadence/HR/mileage trends. No AI element. No Claude. Pure data display — like an extended version of the training plan artifact, with live Strava data feeding into it.

**2. MCP Server (invisible infrastructure)**
A small Node.js server running quietly in the background. Exposes tools that Claude can call automatically when a coaching conversation starts. Claude reads your objective run data before you've typed anything — you just add the qualitative layer.

**What this is NOT:**
- A replacement for the Claude.ai coaching conversation
- A chat interface or AI tool inside the webapp
- A complex multi-service platform

**Single-user personal app.** No multi-tenancy, no Supabase RLS policies, no user_id foreign keys on any table. All tables contain one user's data only.

---

## 2. How It Works End-to-End

```
┌─────────────────────────────────────────────────────────────┐
│  Garmin Watch → Strava app (auto-sync)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  Strava API                                                 │
│  Webhook pushes new activity data when run is saved         │
└──────────┬──────────────────────────────┬───────────────────┘
           │                              │
┌──────────▼──────────┐      ┌────────────▼────────────────┐
│  MCP Server         │      │  React Dashboard            │
│  (Railway)          │      │  (Vercel)                   │
│                     │      │                             │
│  Tools Claude       │      │  Training plan display      │
│  can call:          │      │  Recent activities feed     │
│  - get_activities   │      │  Cadence trend chart        │
│  - get_week_summary │      │  HR trend chart             │
│  - get_garmin_data  │      │  Weekly mileage chart       │
└──────────┬──────────┘      │  Phase progress             │
           │                 │  No AI / No Claude          │
┌──────────▼──────────┐      └─────────────────────────────┘
│  Claude.ai          │
│  (This chat)        │
│                     │
│  Reads MCP data     │
│  automatically      │
│  You add qualitative│
│  notes and context  │
└─────────────────────┘

Both MCP Server and React Dashboard read from the same Supabase database
```

---

## 3. The Coaching Conversation Flow

**Before this system:**
Open Claude.ai → screenshot Garmin → screenshot Strava → manually describe everything → coaching conversation

**After this system:**
Open Claude.ai → Claude automatically reads recent runs via MCP → you say "calf felt fine, sleep poor, struggled mid-week" → coaching conversation with full data context already loaded

**The webapp separately:**
Open yourapp.vercel.app → see your plan, your runs, your trends visually. Check it like you check Strava. Reference it anytime. No interaction required.

---

## 4. Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | Vite/React | Familiar, fast, good ecosystem |
| Styling | Tailwind CSS | Rapid UI, matches existing plan artifact |
| Backend/MCP | Node.js/Express | Existing skill, same as HEdClass project |
| MCP Protocol | @modelcontextprotocol/sdk (SSEServerTransport) | Official SDK, required for Claude.ai remote MCP |
| Database | Supabase (PostgreSQL) | Already using, MCP connector exists |
| Auth | Strava OAuth2 | Single auth layer |
| Activity Data | Strava API (official) | Reliable, well documented, free |
| Sleep/HRV | Manual input or FIT file | Garmin has no public API |
| Hosting Frontend | Vercel | Free tier, GitHub auto-deploy |
| Hosting Backend | Railway | Free tier, persistent HTTP (required for SSE) |

**Why Railway not Vercel for the backend:** SSE (Server-Sent Events) requires a persistent HTTP connection. Serverless platforms like Vercel kill connections after a short timeout, which breaks the MCP SSE transport. Railway runs a persistent Node.js process and works correctly.

**Estimated running cost:** Free tier on all platforms sufficient for personal use.

---

## 5. Supabase Schema

```sql
-- Auth tokens (single row — personal app)
CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,             -- Unix timestamp (seconds)
  athlete_id BIGINT,                      -- Strava athlete ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Training plan phases
CREATE TABLE plan_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_number INTEGER NOT NULL,
  name TEXT NOT NULL,                     -- Foundation, Aerobic Development, etc
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  goal TEXT,
  active BOOLEAN DEFAULT false
);

-- Week by week plan targets
CREATE TABLE plan_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL,
  phase_id UUID REFERENCES plan_phases(id),
  run1_target_km DECIMAL,
  run2_target_km DECIMAL,
  long_run_target_km DECIMAL,
  total_target_km DECIMAL,
  gym_session TEXT,                       -- Strength A / Strength B / Mobility
  cycling_target_km DECIMAL,
  is_deload BOOLEAN DEFAULT false,
  notes TEXT                              -- any adjustments made by Claude
);

-- Strava activities (auto-synced via webhook)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strava_id BIGINT UNIQUE NOT NULL,
  activity_type TEXT NOT NULL,            -- Run, Ride, Walk
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  distance_km DECIMAL,
  duration_seconds INTEGER,
  avg_pace_per_km DECIMAL,               -- stored as decimal minutes
  avg_hr INTEGER,
  max_hr INTEGER,
  avg_cadence INTEGER,                   -- steps per minute (Garmin halves this, ×2 on ingest)
  elevation_gain INTEGER,
  calories INTEGER,
  week_number INTEGER,                   -- calculated from plan start date (11 May 2026)
  raw_data JSONB                         -- full Strava response, future-proofs data needs
);

-- Garmin metrics (manual input or FIT file parse)
CREATE TABLE garmin_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  resting_hr INTEGER,
  hrv_status TEXT,                       -- balanced / unbalanced / low
  hrv_7day_avg INTEGER,
  sleep_score INTEGER,
  sleep_duration_hrs DECIMAL,
  body_battery_morning INTEGER
);

-- Weekly qualitative check-ins
CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  calf_status TEXT,                      -- fine / aware / tight / painful
  knee_status TEXT,
  energy_level INTEGER,                  -- 1-10
  motivation_level INTEGER,              -- 1-10
  avg_sleep_score INTEGER,
  avg_sleep_hrs DECIMAL,
  session_feedback TEXT,
  coaching_questions TEXT,
  plan_adjustment_made BOOLEAN DEFAULT false,
  plan_adjustment_notes TEXT
);

-- Log of plan adjustments over time
CREATE TABLE plan_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  week_number INTEGER,
  adjustment_type TEXT,                  -- mileage / intensity / rest / phase_extension
  original_plan TEXT,
  adjusted_plan TEXT,
  reason TEXT
);
```

---

## 6. Strava API Integration

### OAuth2 Flow
```
User visits app → clicks Connect Strava →
redirected to Strava auth page → approves →
Strava redirects back with code →
server exchanges code for access + refresh token →
tokens stored in auth_tokens table → ready
```

**Scope required:** `activity:read_all`

### Key Endpoints
```javascript
const STRAVA_BASE = 'https://www.strava.com/api/v3'

// Pull recent activities on first connect
GET /athlete/activities?per_page=30&after={unix_timestamp}

// Get single activity with full detail
GET /activities/{id}

// Fields to extract and store
const extract = {
  id:                    'strava_id',
  type:                  'activity_type',
  start_date:            'date',
  distance:              'distance_km',        // ÷ 1000
  moving_time:           'duration_seconds',
  average_speed:         'avg_pace_per_km',    // convert m/s → min/km: (1000/60)/speed
  average_heartrate:     'avg_hr',
  max_heartrate:         'max_hr',
  average_cadence:       'avg_cadence',        // × 2 — Garmin reports half cadence
  total_elevation_gain:  'elevation_gain',
  calories:              'calories'
}
```

### Webhook (Real-time Sync)

**Important:** The webhook endpoint must be publicly accessible before you can register it with Strava. Register the webhook after deploying to Railway, not before.

```javascript
// Strava sends a GET to validate your endpoint during registration
GET /webhooks/strava?hub.challenge=xxx&hub.verify_token=your_token
  → respond with { "hub.challenge": req.query['hub.challenge'] }

// Strava calls this when a new activity is saved
POST /webhooks/strava
  → validate subscription token
  → fetch full activity from Strava API
  → calculate week_number from plan start date
  → insert into Supabase activities table
```

```javascript
// Week number calculation
const PLAN_START = new Date('2026-05-11')
function getWeekNumber(activityDate) {
  const diff = new Date(activityDate) - PLAN_START
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1
}
```

### Token Refresh
```javascript
// Strava tokens expire every 6 hours
async function getValidToken() {
  const { data: token } = await supabase
    .from('auth_tokens').select('*').single()
    
  if (token.expires_at < Date.now() / 1000) {
    const refreshed = await refreshStravaToken(token.refresh_token)
    await supabase.from('auth_tokens').update(refreshed).eq('id', token.id)
    return refreshed.access_token
  }
  return token.access_token
}
```

---

## 7. MCP Server

### Purpose
Exposes three read-only tools Claude can call automatically at the start of any coaching conversation. No write access needed — Claude reads data here, coaching happens in Claude.ai.

### MCP Transport
Uses `@modelcontextprotocol/sdk` with `SSEServerTransport`. Claude.ai's remote MCP integration connects via Server-Sent Events over HTTP. The server uses Express as the HTTP layer with the MCP SDK handling the protocol on top.

```
Express HTTP server
  └── GET  /sse    → SSEServerTransport (MCP SDK)
  └── POST /message → SSEServerTransport message handler
        └── MCP tools registered on the McpServer instance
```

### Connecting to Claude.ai
Once deployed to Railway:
```
Claude.ai → Settings → Integrations → Add MCP Server
URL: https://your-mcp-server.railway.app/sse
```

Every Claude.ai conversation then has access to these tools automatically.

### Server Structure
```
mcp-server/
├── src/
│   ├── index.js           # Express + MCP server entry, tool registration
│   ├── tools/
│   │   ├── activities.js  # get_recent_activities
│   │   ├── summary.js     # get_week_summary
│   │   └── garmin.js      # get_garmin_metrics
│   └── db/
│       └── supabase.js    # Supabase client (service key)
├── package.json
└── .env
```

### Tools Exposed to Claude

```javascript
// Tool 1 — Recent activities
{
  name: "get_recent_activities",
  description: "Get David's recent Strava runs and rides with full metrics",
  parameters: {
    days: { type: "number", default: 7 },
    type: { type: "string", enum: ["Run", "Ride", "Walk", "all"], default: "all" }
  }
}

// Example return
{
  activities: [
    {
      date: "2026-05-27",
      type: "Run",
      distance_km: 4.01,
      avg_pace: "6:53/km",
      avg_hr: 137,
      max_hr: 156,
      avg_cadence: 164,
      elevation_gain: 21,
      duration: "27:38",
      week_number: 4
    }
  ]
}

// Tool 2 — Week summary
{
  name: "get_week_summary",
  description: "Aggregated training data vs plan targets for a given week",
  parameters: {
    week_number: { type: "number" }  // omit for current week
  }
}

// Example return
{
  week_number: 4,
  phase: "Foundation",
  is_deload: true,
  planned: { total_km: 12, runs: 3, gym: "Mobility" },
  actual: {
    total_km: 8.02,
    runs: 2,
    avg_hr: 141,
    avg_cadence: 163,
    avg_pace: "6:46/km"
  },
  compliance_pct: 67,
  garmin: {
    avg_sleep_score: 78,
    avg_hrv_ms: 71,
    resting_hr: 43
  }
}

// Tool 3 — Garmin metrics
{
  name: "get_garmin_metrics",
  description: "Sleep scores, HRV status, and resting HR trend",
  parameters: {
    days: { type: "number", default: 7 }
  }
}
```

---

## 8. React Dashboard

### What It Shows
The existing training plan artifact (marathon-plan.jsx) extended with live Strava data. Visit it like you visit Strava — reference it, check trends, see the plan. No interaction needed.

### Component Structure
```
src/
├── App.jsx
├── components/
│   ├── layout/
│   │   └── Navigation.jsx
│   ├── dashboard/
│   │   ├── WeekSummary.jsx
│   │   ├── GoalsPanel.jsx
│   │   ├── PhaseProgress.jsx
│   │   └── BiometricPanel.jsx
│   ├── activities/
│   │   ├── ActivityFeed.jsx
│   │   ├── ActivityCard.jsx
│   │   ├── CadenceChart.jsx
│   │   ├── HRTrendChart.jsx
│   │   └── MileageChart.jsx
│   ├── plan/
│   │   ├── Phase1Table.jsx
│   │   ├── StrengthSessions.jsx
│   │   └── AdjustmentsLog.jsx
│   └── garmin/
│       ├── SleepTrend.jsx
│       └── HRVStatus.jsx
├── hooks/
│   ├── useActivities.js
│   ├── usePlanData.js
│   └── useGarminMetrics.js
└── lib/
    ├── supabase.js
    └── formatters.js
```

### Dashboard Layout (Wireframe)
```
┌─────────────────────────────────────────────────────┐
│ BELFAST MARATHON 2027              Week 4 / Phase 1 │
│ [Overview] [Phase 1] [Strength] [Nutrition] [Trends]│
├────────────────────┬────────────────────────────────┤
│ THIS WEEK          │ BIOMETRICS                     │
│ Target: 12km       │ Sleep: 78 ↑  HRV: 71ms ↑      │
│ Actual:  8km       │ RHR: 43bpm   Body Battery: 72  │
│ Runs: 2/3          │                                │
├────────────────────┴────────────────────────────────┤
│ RECENT ACTIVITIES                                   │
│ Tue 27 May  Run  4.01km  6:53/km  137bpm  164spm   │
│ Mon 26 May  Walk 3.70km  —        99bpm   —         │
│ Sat 24 May  Run  4.80km  6:39/km  164bpm  158spm   │
├─────────────────────────────────────────────────────┤
│ CADENCE TREND (last 8 runs)                        │
│ [bar chart showing progression toward 170spm]       │
├─────────────────────────────────────────────────────┤
│ WEEKLY MILEAGE                                      │
│ [bar chart weeks 1-4 vs targets]                    │
└─────────────────────────────────────────────────────┘
```

---

## 9. Garmin Data Strategy

Garmin has no public API. Three options ranked by effort:

### Option A — Manual CSV Upload (Start Here)
Export sleep/HRV data weekly from Garmin Connect → upload CSV → app parses and stores in Supabase. Build in an afternoon. Slightly manual but reliable.

### Option B — FIT File Parser
```javascript
// npm install fit-file-parser
import FitParser from 'fit-file-parser'
const parser = new FitParser({ force: true })
parser.parse(fitBuffer, (error, data) => {
  const metrics = extractSleepAndHRV(data)
  supabase.from('garmin_metrics').insert(metrics)
})
```

### Option C — Unofficial Garmin Library
```javascript
// npm install garmin-connect
// Most automated but fragile — Garmin breaks it occasionally
import GarminConnect from 'garmin-connect'
const garmin = new GarminConnect()
await garmin.login(email, password)
const sleep = await garmin.getSleepData(date)
const hrv = await garmin.getHRVData(date)
```

**Recommendation:** Start with Option A for MVP. Add Option C later if the manual export becomes annoying.

---

## 10. Build Phases

### Phase A — Data Foundation (Weekend 1)
Goal: Strava OAuth working, activities in Supabase

```
□ Create Supabase project, run schema migrations
□ Register Strava API application at developers.strava.com (get client_id + client_secret)
□ Scaffold mcp-server/ with Express + @modelcontextprotocol/sdk
□ Build OAuth2 flow — auth URL, callback, token storage in auth_tokens table
□ Pull last 30 days of activities on first login
□ Test webhook handler locally using ngrok (npx ngrok http 3000)
□ Deploy mcp-server to Railway
□ Register Strava webhook using Railway public URL (requires public endpoint)
□ Verify data flowing correctly in Supabase table viewer
```

### Phase B — React Dashboard (Weekend 2)
Goal: Plan and activity data visible in browser

```
□ Scaffold Vite/React app in webapp/
□ Port existing training plan artifact (marathon-plan.jsx) as base
□ Connect to Supabase — activities and plan_weeks tables
□ ActivityFeed component with real data
□ WeekSummary component (actual vs planned)
□ Basic mileage bar chart (recharts)
□ Cadence trend chart
□ Deploy to Vercel
□ Garmin manual CSV upload parser
```

### Phase C — MCP Tools (One Afternoon)
Goal: Claude can read David's data automatically in Claude.ai

```
□ Implement get_recent_activities tool in mcp-server
□ Implement get_week_summary tool
□ Implement get_garmin_metrics tool
□ Test tools locally
□ Redeploy to Railway
□ Add MCP URL to Claude.ai Settings → Integrations
□ Verify Claude can call tools in conversation
```

### Phase D — Polish (Ongoing)
```
□ HR trend chart
□ Phase 2 plan data entry
□ Plan adjustments log
□ Garmin unofficial library integration
□ Sleep score trend visualisation
□ Mobile responsive layout
```

---

## 11. Open Source Path

Once the personal version is built and used for a month, the open source version requires one key addition: **multi-user authentication** so others can connect their own Strava account.

### Repository Structure
```
marathon-ai-coach/
├── README.md
├── docs/
│   ├── setup.md
│   ├── strava-app-setup.md
│   └── claude-mcp-setup.md
├── webapp/
├── mcp-server/
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
└── docker-compose.yml
```

---

## 12. Environment Variables

```bash
# mcp-server/.env (never commit)

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=          # server side only, never expose to frontend

# Strava
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_WEBHOOK_VERIFY_TOKEN=   # any random string you generate

# App
APP_URL=https://your-mcp.railway.app
PORT=3000
```

```bash
# webapp/.env.local (never commit)

VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=        # safe to expose — Supabase anon key is public
VITE_API_URL=https://your-mcp.railway.app
```

---

## 13. Key Context for Claude Code Sessions

Paste this at the start of any Claude Code build session:

```
Read @docs/architecture.md before doing anything.

Building a personal marathon training tool for Belfast Marathon 2027.
Single-user personal app — no RLS, no multi-tenancy, no user_id columns.

Training plan: 4 phases over 52 weeks starting 11 May 2026.
Phase 1 (Foundation): weeks 1-16, all easy running, strength work.
Race goals: Sub-3hr north star, 3:15-3:30 A goal, 3:45-4:00 B goal.
Key concerns: left posterior tibialis, heel→midfoot gait transition, sleep.
Training: 2-3 runs/week, gym 1-2x, Pilates Wednesday, cycling.

Stack: Node.js/Express backend, Vite/React frontend, Supabase database.
MCP: @modelcontextprotocol/sdk with SSEServerTransport (Railway).
Build Phase A first — OAuth and data flowing before anything else.
```

---

## 14. Files to Bring to Build Sessions

- This architecture document (`docs/architecture.md`)
- `marathon-plan.jsx` — existing training plan artifact (UI reference for Phase B)
- Supabase project URL and keys
- Strava API client ID and secret (register at developers.strava.com first)
