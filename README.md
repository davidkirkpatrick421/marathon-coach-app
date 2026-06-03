Marathon Coach
An open-source AI coaching system where Claude reads your Garmin biometrics and writes back to your training plan.
Live at https://training.dkirkpatrick.co.uk

Strava just shipped a read-only MCP connector. There are five community Garmin MCP servers on GitHub. Every one of them lets you ask questions about your training data.
None of them can change your plan.
Marathon Coach is different. Claude reads your full training picture automatically — Garmin activities, HRV, sleep score, body battery, resting HR, per-kilometre splits, qualitative check-ins from previous sessions — and when it decides your Thursday run should be pulled given your HRV trend, it removes it. The dashboard updates. The reasoning is logged. The decision is permanent and traceable.
That's the gap this fills.

What It Does
Open a coaching conversation. Before you type anything, Claude has already read:

This week's targets vs actual km completed
Your last 5+ Garmin activities with full metrics and your own activity annotations
5 days of biometrics — HRV 7-day average, HRV status, sleep score, sleep hours, resting HR, body battery
Your most recent qualitative check-in — calf status, energy, motivation, feedback from last session
Known injury concerns and training schedule constraints
Current training phase goal and weekly structure
Multi-week mileage progression trend

You ask a question. Claude coaches based on what actually happened, not what you tell it happened. If the plan needs to change, it changes. Every modification is logged with full reasoning — a traceable 52-week coaching decision history.

The Bidirectional Loop
Most AI fitness tools have a read path. This has a write path.
Garmin Connect ──► Supabase DB ──► MCP Server ──► Claude
                                                      │
                        Dashboard ◄── Supabase DB ◄───┘
                        (updates live)
Five MCP tools registered on the server:
ToolTypeWhat It Doesget_training_contextREADFull coaching context — week status, biometrics, check-in, phase, progressionget_recent_activitiesREADLast N activities with complete metricsget_activity_splitsREADPer-km pace, HR, elevation from raw Garmin dataupdate_plan_weekWRITEModifies run targets for any week, dashboard reflects immediatelylog_plan_adjustmentWRITEPermanent audit log entry with reasoning for every plan changeadd_checkinWRITEPersists qualitative coaching data across sessions

Tech Stack
ComponentTechnologyMCP ServerNode.js / Express / @modelcontextprotocol/sdkDatabaseSupabase (PostgreSQL)DashboardVite / React / Tailwind / RechartsGarmin Syncgarmin-connect (npm) — daily scheduled syncBackend HostingRailway (~$5/month)Frontend HostingVercel (free tier)

Who This Is For
Developers who run. You need to be comfortable with a Railway deployment and a .env file. In return you get full control over your own training data, your own AI credentials, and a coaching system that knows your training history before you say a word.
This is not a consumer product. It is a self-hosted personal coaching infrastructure.

Honest Limitations

Requires a Claude.ai Pro subscription with MCP support enabled
Garmin sync uses an unofficial library — may break when Garmin changes internal endpoints
Single-user by design — each person runs their own instance
52-week plan structure is marathon-specific — adaptation needed for other goals
No official Garmin API (requires business entity) — contribution welcome


Quick Start

Full setup guide: [docs/SETUP.md]


Clone the repo
Create a Supabase project and run /supabase/migrations/
Copy .env.example to .env in both mcp-server/ and webapp/
Fill in Supabase credentials, Garmin credentials, and your race details
Run the plan seed script with your race date and target time
Deploy MCP server to Railway
Deploy dashboard to Vercel
Add MCP server URL to Claude.ai Settings → Integrations
Open a conversation. Claude already knows everything.


Current Status
Live personal deployment. Week 4 of a 52-week plan targeting Belfast Marathon, May 2027.
Sub-3:00 north star. Every coaching decision logged since Week 1.

Contributing
The highest-value contributions right now:

Official Garmin API integration (replacing unofficial library)
FIT file ingestion as alternative data source
Additional sport types beyond running


Architecture
See [docs/ARCHITECTURE.md] for full data flow diagrams and MCP tool specification.

Built by David Kirkpatrick — MSc Software Development, Queen's University Belfast.
Not affiliated with Garmin, Anthropic, or Strava.