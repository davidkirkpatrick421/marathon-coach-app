import { z } from 'zod'
import supabase from '../db/supabase.js'

const PLAN_START = new Date('2026-05-05')
const RUN_TYPES = ['Run', 'TrailRun', 'VirtualRun']

function currentWeekNumber() {
  return Math.max(1, Math.floor((Date.now() - PLAN_START.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1)
}

function weekDates(weekNum) {
  const start = new Date(PLAN_START.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

function formatWeek(w) {
  const { start, end } = weekDates(w.week_number)
  return {
    week: w.week_number,
    dates: `${start} – ${end}`,
    isDeload: w.is_deload ?? false,
    targets: {
      totalKm: parseFloat(w.total_target_km ?? 0),
      run1Km: w.run1_target_km != null ? parseFloat(w.run1_target_km) : null,
      run2Km: w.run2_target_km != null ? parseFloat(w.run2_target_km) : null,
      longRunKm: w.long_run_target_km != null ? parseFloat(w.long_run_target_km) : null,
      gymSession: w.gym_session ?? null,
      cyclingKm: w.cycling_target_km != null ? parseFloat(w.cycling_target_km) : null,
    },
    notes: w.notes ?? null,
  }
}

export function registerPlanTools(server) {
  const PHASES = [
    { phase: 1, name: 'Foundation', startWeek: 1, endWeek: 16 },
  ]

  server.tool(
    'get_upcoming_weeks',
    'Returns all remaining weeks of the current training phase for complete periodisation context. Use for forward-looking coaching: deload scheduling, long run progression, phase milestone planning. Includes current week actuals so far.',
    {},
    async () => {
      const currentWeek = currentWeekNumber()
      const currentPhase = PHASES.find(p => currentWeek >= p.startWeek && currentWeek <= p.endWeek)
        ?? PHASES[PHASES.length - 1]

      const fromWeek = currentWeek + 1
      const toWeek = currentPhase.endWeek

      const [
        { data: upcomingRows, error },
        { data: currentWeekRow },
        { data: currentActuals },
      ] = await Promise.all([
        supabase
          .from('plan_weeks')
          .select('week_number, run1_target_km, run2_target_km, long_run_target_km, total_target_km, gym_session, cycling_target_km, is_deload, notes')
          .gte('week_number', fromWeek)
          .lte('week_number', toWeek)
          .order('week_number'),
        supabase
          .from('plan_weeks')
          .select('total_target_km, is_deload')
          .eq('week_number', currentWeek)
          .single(),
        supabase
          .from('activities')
          .select('distance_km')
          .eq('week_number', currentWeek)
          .in('activity_type', RUN_TYPES),
      ])

      if (error) return { content: [{ type: 'text', text: `Plan fetch failed: ${error.message}` }] }

      const actualKmSoFar = Math.round(
        (currentActuals ?? []).reduce((sum, a) => sum + parseFloat(a.distance_km ?? 0), 0) * 10
      ) / 10

      const upcoming = (upcomingRows ?? []).map(formatWeek)
      const nextDeload = upcoming.find(w => w.isDeload)
      const longRunProgression = upcoming
        .filter(w => w.targets.longRunKm != null)
        .map(w => ({ week: w.week, longRunKm: w.targets.longRunKm }))

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            phase: {
              number: currentPhase.phase,
              name: currentPhase.name,
              endWeek: currentPhase.endWeek,
              weeksRemaining: toWeek - currentWeek,
            },
            currentWeek: {
              week: currentWeek,
              ...weekDates(currentWeek),
              actualKmSoFar,
              targetKm: currentWeekRow ? parseFloat(currentWeekRow.total_target_km ?? 0) : null,
              isDeload: currentWeekRow?.is_deload ?? false,
            },
            upcomingWeeks: upcoming,
            summary: {
              nextDeloadWeek: nextDeload?.week ?? null,
              weeksUntilDeload: nextDeload ? nextDeload.week - currentWeek : null,
              longRunProgression,
            },
          }, null, 2),
        }],
      }
    }
  )
  server.tool(
    'update_plan_week',
    'Update target distances or notes for a specific training week. Use when a coaching conversation identifies an adjustment is needed — injury recovery, missed week, load correction. Always follow this with log_plan_adjustment to record why.',
    {
      week_number: z.number().int().min(1).max(52).describe('Training plan week number to update'),
      total_target_km: z.number().optional().describe('New total run km target for the week'),
      run1_target_km: z.number().nullable().optional().describe('New Run 1 distance target (km), or null to remove'),
      run2_target_km: z.number().nullable().optional().describe('New Run 2 distance target (km), or null to remove'),
      long_run_target_km: z.number().nullable().optional().describe('New long run distance target (km), or null to remove'),
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

      const runFields = ['run1_target_km', 'run2_target_km', 'long_run_target_km']
      const runFieldChanged = runFields.some(f => f in updates)

      if (runFieldChanged) {
        const { data: updated } = await supabase
          .from('plan_weeks')
          .select('run1_target_km, run2_target_km, long_run_target_km')
          .eq('week_number', week_number)
          .single()

        const newTotal = (parseFloat(updated.run1_target_km) || 0)
          + (parseFloat(updated.run2_target_km) || 0)
          + (parseFloat(updated.long_run_target_km) || 0)

        await supabase
          .from('plan_weeks')
          .update({ total_target_km: newTotal })
          .eq('week_number', week_number)
      }

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
