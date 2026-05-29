import 'dotenv/config'
import express from 'express'
import cron from 'node-cron'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import supabase from './db/supabase.js'
import { authRoutes } from './strava/auth.js'
import { webhookRoutes } from './strava/webhook.js'
import { registerActivitiesTool } from './tools/activities.js'
import { registerSummaryTool } from './tools/summary.js'
import { registerCheckinTool } from './tools/checkins.js'
import { registerPlanTools } from './tools/plan.js'
import { registerSplitsTool } from './tools/splits.js'
import { registerTrendsTool } from './tools/trends.js'
import { getValidToken } from './strava/auth.js'
import { backfillActivities } from './strava/activities.js'

const STRAVA_BASE = 'https://www.strava.com/api/v3'
const RUN_TYPES = ['Run', 'TrailRun', 'VirtualRun']
import { syncGarminRecent, recordSyncStatus } from './garmin/sync.js'
import { getGarminClient, persistTokens } from './garmin/client.js'

const app = express()
app.use(express.json())

function createMcpServer() {
  const server = new McpServer({ name: 'marathon-coach', version: '1.0.0' })
  registerActivitiesTool(server)
  registerSummaryTool(server)
  registerCheckinTool(server)
  registerPlanTools(server)
  registerSplitsTool(server)
  registerTrendsTool(server)
  return server
}

app.post('/mcp', async (req, res) => {
  const server = createMcpServer()
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await server.connect(transport)
  res.on('finish', () => server.close())
  await transport.handleRequest(req, res, req.body)
})

app.get('/mcp', async (req, res) => {
  const server = createMcpServer()
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await server.connect(transport)
  res.on('finish', () => server.close())
  await transport.handleRequest(req, res)
})

authRoutes(app)
webhookRoutes(app)

app.post('/admin/backfill', async (_req, res) => {
  try {
    const accessToken = await getValidToken()
    const count = await backfillActivities(accessToken)
    res.json({ status: 'ok', activities_synced: count })
  } catch (err) {
    console.error('Backfill error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Fetch splits from Strava detail endpoint for run activities that don't have cached splits yet.
// Run once after deploying migration 008, or any time new backfilled activities are added.
app.post('/admin/backfill-splits', async (_req, res) => {
  try {
    const accessToken = await getValidToken()

    const { data: activities, error } = await supabase
      .from('activities')
      .select('id, strava_id')
      .in('activity_type', RUN_TYPES)
      .is('splits', null)
      .order('date', { ascending: false })

    if (error) throw new Error(error.message)
    if (!activities?.length) return res.json({ status: 'ok', updated: 0 })

    let updated = 0
    for (const activity of activities) {
      try {
        const detailRes = await fetch(`${STRAVA_BASE}/activities/${activity.strava_id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (!detailRes.ok) {
          console.warn(`[backfill-splits] Strava ${activity.strava_id} returned ${detailRes.status}`)
          continue
        }
        const detail = await detailRes.json()
        const splits = detail.splits_metric ?? null
        await supabase
          .from('activities')
          .update({ raw_data: detail, splits })
          .eq('id', activity.id)
        updated++
        // Stay well inside Strava's 200-req/15-min read limit
        await new Promise(r => setTimeout(r, 300))
      } catch (err) {
        console.error(`[backfill-splits] Failed for ${activity.strava_id}:`, err.message)
      }
    }

    res.json({ status: 'ok', updated, total: activities.length })
  } catch (err) {
    console.error('Backfill-splits error:', err)
    res.status(500).json({ error: err.message })
  }
})

// One-time setup: login with credentials, save OAuth tokens to Supabase.
// After this, GARMIN_EMAIL / GARMIN_PASSWORD are only needed if tokens become invalid.
app.post('/admin/garmin/auth', async (_req, res) => {
  try {
    const client = await getGarminClient()
    await persistTokens(client)
    res.json({ status: 'ok', message: 'Garmin tokens saved to Supabase' })
  } catch (err) {
    console.error('[Garmin] Auth setup error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Manual sync trigger — useful for testing and backfilling missed days
app.post('/sync/garmin', async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 7, 30)
  try {
    const results = await syncGarminRecent(days)
    res.json({ success: true, synced: results.length, dates: results.map(r => r.date) })
  } catch (err) {
    res.json({
      success: false, synced: 0, error: err.message,
      note: 'Garmin sync failed — check logs or retry later'
    })
  }
})

app.get('/health', async (_req, res) => {
  const { error } = await supabase.from('activities').select('id').limit(1)
  res.json({
    status: 'ok',
    db: error ? 'error' : 'connected',
    timestamp: new Date().toISOString(),
  })
})

// Garmin sync at 08:00 daily — sleep data is finalised by ~07:00
if (process.env.GARMIN_SYNC_ENABLED === 'true') {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Garmin] Starting scheduled sync')
    try {
      await syncGarminRecent(7)
    } catch (err) {
      console.error('[Garmin] Scheduled sync failed:', err.message)
      await recordSyncStatus({ succeeded: false, error: err.message })
    }
  })
  console.log('[Garmin] Scheduled sync enabled — runs at 08:00 daily')
}

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`)
})
