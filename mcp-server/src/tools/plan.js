import { z } from 'zod'
import supabase from '../db/supabase.js'

export function registerPlanTools(server) {
  server.tool(
    'update_plan_week',
    'Update target distances or notes for a specific training week. Use when a coaching conversation identifies an adjustment is needed — injury recovery, missed week, load correction. Always follow this with log_plan_adjustment to record why.',
    {
      week_number: z.number().int().min(1).max(52).describe('Training plan week number to update'),
      total_target_km: z.number().optional().describe('New total run km target for the week'),
      run1_target_km: z.number().optional().describe('New Run 1 distance target (km)'),
      run2_target_km: z.number().optional().describe('New Run 2 distance target (km)'),
      long_run_target_km: z.number().optional().describe('New long run distance target (km)'),
      notes: z.string().optional().describe('Coaching note explaining the adjustment — shown on the dashboard'),
    },
    async (params) => {
      const { week_number, ...fields } = params
      const updates = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined)
      )

      if (Object.keys(updates).length === 0) {
        return { content: [{ type: 'text', text: 'No fields provided to update.' }] }
      }

      const { error } = await supabase
        .from('plan_weeks')
        .update(updates)
        .eq('week_number', week_number)

      if (error) return { content: [{ type: 'text', text: `Plan update failed: ${error.message}` }] }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, week: week_number, updated: Object.keys(updates) }),
        }],
      }
    }
  )

  server.tool(
    'log_plan_adjustment',
    'Record a permanent log entry for a plan change. Always call this alongside update_plan_week so there is an audit trail of what changed and why.',
    {
      week_number: z.number().int().min(1).max(52).describe('Week the adjustment applies to'),
      adjustment_type: z.enum(['mileage', 'intensity', 'rest', 'phase_extension', 'session_removed', 'session_added']).describe('Category of adjustment'),
      original_plan: z.string().describe('What the plan said before the change'),
      adjusted_plan: z.string().describe('What the plan says after the change'),
      reason: z.string().describe('Why the adjustment was made'),
    },
    async (params) => {
      const { error } = await supabase
        .from('plan_adjustments')
        .insert({
          week_number: params.week_number,
          adjustment_type: params.adjustment_type,
          original_plan: params.original_plan,
          adjusted_plan: params.adjusted_plan,
          reason: params.reason,
        })

      if (error) return { content: [{ type: 'text', text: `Adjustment log failed: ${error.message}` }] }

      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
      }
    }
  )
}
