import type { World } from './world-types.ts'
import { tutorialLevel } from './mission-data.ts'

export type ResultStage = 'terminal-overlay' | 'statistics' | 'exit-pending' | 'selector'

/** Transient input/ownership only. No result state is stored in checkpoints. */
export function createResultSession() {
  let owner: World | null = null
  let stage: ResultStage = 'terminal-overlay'
  let priorStage: ResultStage = 'terminal-overlay'
  let priorPaused = false
  let pending: symbol | null = null
  const current = (world: World) => {
    if (owner !== world) {
      owner = world
      stage = 'terminal-overlay'
      pending = null
    }
    return world.status === 'playing' ? null : stage
  }
  return {
    stage: current,
    openStatistics(world: World) {
      if (current(world) !== 'terminal-overlay') return false
      stage = 'statistics'
      world.paused = true
      return true
    },
    bypassStatistics: (world: World) =>
      world.outcome.level === tutorialLevel || !!(world.manaWorld.loadFlags & 0x04000000),
    beginExit(world: World) {
      const value = current(world)
      if (value !== 'terminal-overlay' && value !== 'statistics') return null
      priorStage = value
      priorPaused = world.paused
      stage = 'exit-pending'
      pending = Symbol()
      return pending
    },
    finishExit(world: World, token: symbol, accepted: boolean) {
      if (owner !== world || pending !== token || stage !== 'exit-pending') return false
      pending = null
      stage = accepted ? 'selector' : priorStage
      return true
    },
    back(world: World) {
      if (owner !== world || stage !== 'selector') return false
      stage = priorStage
      world.paused = priorPaused
      return true
    },
  }
}

/** Fresh-press policy is a browser adaptation. Observe even blocked downs so a
 * held popup/flyby key cannot carry into a newly admitted result stage. */
export function createResultKeys() {
  let held = false
  return {
    down(event: Pick<KeyboardEvent, 'key' | 'code' | 'repeat'>) {
      if (event.code !== 'Space' && event.key !== ' ') return false
      const fresh = !held && !event.repeat
      held = true
      return fresh
    },
    up(event: Pick<KeyboardEvent, 'key' | 'code'>) {
      if (event.code === 'Space' || event.key === ' ') held = false
    },
    reset() {
      held = false
    },
  }
}

/** 0x43e480 increments the admitted input cycle even while simulation is paused.
 * The default native rate byte is12; 0x4a5590 truncates1000/rate to83ms. Rendering
 * remains uncapped. Catch-up is elapsed-time based, never rendered-frame based.
 * Browser epoch policy starts at zero on a new scene and catches up elapsed time;
 * it does not emulate the original scheduler's immediately-due first visit. */
export function createResultClock() {
  return { inputCycles: 0, remainderMs: 0 }
}
export function advanceResultClock(clock: ReturnType<typeof createResultClock>, seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid result clock delta')
  const elapsed = clock.remainderMs + seconds * 1000
  const cycles = Math.floor((elapsed + 1e-7) / 83)
  clock.remainderMs = Math.max(0, elapsed - cycles * 83)
  clock.inputCycles = (clock.inputCycles + cycles) >>> 0
}
export function resultBlink(inputCycles: number) {
  return {
    prompt: !!(Math.floor(inputCycles / 4) & 1),
    status: !!(Math.floor(inputCycles / 6) & 1),
  }
}

// 0x4ec703 and stepTurn both increment once after the land-pause gate. The
// browser's current-format saved logical turn is the admitted simulation owner;
// this does not assert native save-format equivalence. Blink uses a different clock.
export const resultSpaceEligible = (world: Pick<World, 'turn'>) => world.turn >>> 0 > 10
