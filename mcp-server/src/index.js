import 'dotenv/config'
import express from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import supabase from './db/supabase.js'
import { authRoutes } from './strava/auth.js'
import { webhookRoutes } from './strava/webhook.js'
import { registerActivitiesTool } from './tools/activities.js'
import { registerSummaryTool } from './tools/summary.js'
import { registerCheckinTool } from './tools/checkins.js'
import { getValidToken } from './strava/auth.js'
import { backfillActivities } from './strava/activities.js'

const app = express()
app.use(express.json())

function createMcpServer() {
  const server = new McpServer({ name: 'marathon-coach', version: '1.0.0' })
  registerActivitiesTool(server)
  registerSummaryTool(server)
  registerCheckinTool(server)
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

app.get('/health', async (_req, res) => {
  const { error } = await supabase.from('activities').select('id').limit(1)
  res.json({
    status: 'ok',
    db: error ? 'error' : 'connected',
    timestamp: new Date().toISOString(),
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`)
})
