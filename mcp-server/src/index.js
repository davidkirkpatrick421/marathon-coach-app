import 'dotenv/config'
import express from 'express'
import supabase from './db/supabase.js'
import { authRoutes } from './auth.js'

const app = express()
app.use(express.json())

authRoutes(app)

app.get('/health', async (req, res) => {
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
