import { z } from 'zod'
import supabase from '../db/supabase.js'

export function registerCheckinTool(server) {
  server.tool(
    'add_checkin',
    "Store David's qualitative weekly check-in. Call this during a coaching conversation to persist feedback, injury status, and questions alongside the objective Strava data.",
    {
      week_number: z.number().int().min(1).describe('Training plan week number'),
      calf_status: z.enum(['fine', 'aware', 'tight', 'painful']).optional().describe('Left posterior tibialis / calf status'),
      energy_level: z.number().int().min(1).max(10).optional().describe('Overall energy 1–10'),
      motivation_level: z.number().int().min(1).max(10).optional().describe('Motivation 1–10'),
      sleep_avg_score: z.number().int().optional().describe('Average Garmin sleep score for the week'),
      sleep_avg_hrs: z.number().optional().describe('Average sleep hours per night'),
      session_feedback: z.string().optional().describe('Qualitative notes on how training felt this week'),
      coaching_questions: z.string().optional().describe('Any questions or concerns to note for future reference'),
    },
    async (params) => {
      const { data, error } = await supabase
        .from('checkins')
        .insert({
          week_number: params.week_number,
          calf_status: params.calf_status ?? null,
          energy_level: params.energy_level ?? null,
          motivation_level: params.motivation_level ?? null,
          avg_sleep_score: params.sleep_avg_score ?? null,
          avg_sleep_hrs: params.sleep_avg_hrs ?? null,
          session_feedback: params.session_feedback ?? null,
          coaching_questions: params.coaching_questions ?? null,
        })
        .select('id, week_number')
        .single()

      if (error) return { content: [{ type: 'text', text: `Error saving check-in: ${error.message}` }] }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, checkin_id: data.id, week_number: data.week_number }),
        }],
      }
    }
  )
}
