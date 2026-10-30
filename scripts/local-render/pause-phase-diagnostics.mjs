import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

// Node-side evidence only. No browser operations, timers, inputs or retry policy.
const stages = ['setup', 'navigation', 'input', 'readiness', 'viewport', 'frame',
  'focus-observation', 'focus-tab', 'hud', 'fullscreen-observation', 'assertions',
  'body-observation', 'screenshot', 'world-capture', 'world-compare', 'cleanup', 'coverage']

// Fixed call-site identities, not arbitrary keys or a per-event log. Distinguish
// heterogeneous input/observation costs without adding browser observations.
export const pauseOperationStages = Object.freeze({
  'start-mission': 'input', 'dismiss-desktop-notice': 'input', 'skip-introduction': 'input',
  'open-menu': 'input', 'open-options': 'input', 'toggle-rotation': 'input',
  'select-options-category': 'input', 'back-from-options': 'input', 'open-save': 'input',
  'save-checkpoint': 'input', 'back-from-save': 'input', 'open-load': 'input',
  'focus-home': 'input', 'key-home': 'input', 'focus-end': 'input', 'key-end': 'input',
  'back-from-load': 'input', 'continue-game': 'input',
  'has-checkpoint': 'body-observation', 'initial-checkpoint-layout': 'body-observation',
  'scrolled-panel-owner': 'body-observation', 'scrolled-checkpoint-layout': 'body-observation',
  'load-button-focus': 'body-observation', 'world-paused': 'body-observation',
})

export async function recordPausePhases({ receipt, signal, output, mode }, action,
  { now = () => performance.now(), write = writeFileSync } = {}) {
  const started = now()
  const elapsed = () => Math.max(0, now() - started)
  const state = {
    version: 'pause-phase-diagnostics-v2', mode, status: 'running', case: 'setup',
    sequence: 0, active: null, lastSettled: null, failure: null, finishedMs: null,
    totals: Object.fromEntries(stages.map(stage => [stage, { count: 0, elapsedMs: 0 }])),
    operationTotals: Object.fromEntries(Object.keys(pauseOperationStages).map(name =>
      [name, { count: 0, elapsedMs: 0, longest: null }])),
  }
  receipt.pauseStylePhases = state
  const fail = kind => {
    if (!state.failure) {
      const phase = state.active ?? state.lastSettled
      state.failure = Object.freeze({ kind, observedMs: elapsed(), case: state.case,
        phase: phase ? Object.freeze({ ...phase }) : null })
      state.status = kind === 'aborted' ? 'aborted' : 'failed'
    }
    // A synchronous assertion may leave its stage active. Release that stage
    // before finally enters cleanup, even if an earlier abort is already frozen.
    if (kind === 'rejected' && state.active) trace.end(state.active, 'rejected')
  }
  const abort = () => fail('aborted')
  signal.addEventListener('abort', abort, { once: true })
  if (signal.aborted) abort()
  const trace = {
    setCase(label) { state.case = label.slice(0, 128) },
    begin(stage, operation = null) {
      if (!Object.hasOwn(state.totals, stage)) throw new Error('Unknown pause diagnostic stage')
      if (operation !== null && (!Object.hasOwn(pauseOperationStages, operation) || pauseOperationStages[operation] !== stage))
        throw new Error('Unknown or mismatched pause operation')
      if (state.active) throw new Error('Overlapping pause diagnostic stages')
      const phase = { sequence: ++state.sequence, case: state.case, stage,
        startedMs: elapsed(), status: 'pending', ...(operation === null ? {} : { operation }) }
      state.active = phase
      return phase
    },
    end(phase = state.active, status = 'fulfilled') {
      if (!phase || state.active !== phase) return
      const settled = { ...phase, status, finishedMs: elapsed() }
      settled.elapsedMs = Math.max(0, settled.finishedMs - settled.startedMs)
      state.totals[phase.stage].count++
      state.totals[phase.stage].elapsedMs += settled.elapsedMs
      if (phase.operation) {
        const total = state.operationTotals[phase.operation]
        total.count++
        total.elapsedMs += settled.elapsedMs
        // Include rejected settlements and retain their outcome. Ties keep the
        // first maximum; late settlement cannot alter the frozen first failure.
        if (!total.longest || settled.elapsedMs > total.longest.elapsedMs)
          total.longest = Object.freeze({ case: phase.case, sequence: phase.sequence,
            startedMs: phase.startedMs, finishedMs: settled.finishedMs,
            elapsedMs: settled.elapsedMs, status })
      }
      state.active = null
      state.lastSettled = settled
    },
    async wait(stage, operation, name = null) {
      const phase = trace.begin(stage, name)
      try {
        const value = await operation()
        trace.end(phase)
        return value
      } catch (error) {
        trace.end(phase, 'rejected')
        fail('rejected')
        throw error
      }
    },
    fail,
  }
  let failed = false
  try { return await action(trace) }
  catch (error) { failed = true; fail('rejected'); throw error }
  finally {
    signal.removeEventListener('abort', abort)
    state.finishedMs = elapsed()
    if (!state.failure) state.status = 'completed'
    // Fixed stage/call-site totals, one maximum per call-site and three phase
    // snapshots bound the payload; never retain a per-event history. The first
    // failure snapshot survives cleanup/late awaits.
    receipt.pauseStylePhaseWrite = 'attempted'
    try {
      write(resolve(output, 'pause-style-phases.json'), JSON.stringify(state, null, 2) + '\n')
      receipt.pauseStylePhaseWrite = 'succeeded'
    } catch (error) {
      receipt.pauseStylePhaseWrite = 'failed'
      // Preserve arbitrary primary throws, including null/false/frozen objects.
      if (!failed && !state.failure) { fail('diagnostic-write'); throw error }
    }
  }
}
