import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

// Node-side evidence only. No browser operations, timers, inputs or retry policy.
const stages = ['setup', 'navigation', 'input', 'readiness', 'viewport', 'frame',
  'focus-observation', 'focus-tab', 'hud', 'fullscreen-observation', 'assertions',
  'body-observation', 'screenshot', 'world-capture', 'world-compare', 'cleanup', 'coverage']

export async function recordPausePhases({ receipt, signal, output, mode }, action,
  { now = () => performance.now(), write = writeFileSync } = {}) {
  const started = now()
  const elapsed = () => Math.max(0, now() - started)
  const state = {
    version: 'pause-phase-diagnostics-v1', mode, status: 'running', case: 'setup',
    sequence: 0, active: null, lastSettled: null, failure: null, finishedMs: null,
    totals: Object.fromEntries(stages.map(stage => [stage, { count: 0, elapsedMs: 0 }])),
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
    begin(stage) {
      if (!Object.hasOwn(state.totals, stage)) throw new Error('Unknown pause diagnostic stage')
      if (state.active) throw new Error('Overlapping pause diagnostic stages')
      const phase = { sequence: ++state.sequence, case: state.case, stage,
        startedMs: elapsed(), status: 'pending' }
      state.active = phase
      return phase
    },
    end(phase = state.active, status = 'fulfilled') {
      if (!phase || state.active !== phase) return
      const settled = { ...phase, status, finishedMs: elapsed() }
      settled.elapsedMs = Math.max(0, settled.finishedMs - settled.startedMs)
      state.totals[phase.stage].count++
      state.totals[phase.stage].elapsedMs += settled.elapsedMs
      state.active = null
      state.lastSettled = settled
    },
    async wait(stage, operation) {
      const phase = trace.begin(stage)
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
    // The payload is bounded by fixed stage totals and three phase snapshots,
    // not an event log. The first failure snapshot survives cleanup/late awaits.
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
