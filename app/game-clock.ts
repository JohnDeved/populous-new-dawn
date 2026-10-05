import { HOME, sound, tick, TURNS_PER_SECOND, type World, type TurnObserver } from './model.ts'
import { animateLiveObjects } from './live-people.ts'
import { stepMessages } from './messages.ts'
import { animateStoneHeads } from './stone-head-animation.ts'
import { worshipDeadline } from './worship-acquisition-runtime.ts'

export interface GameClock extends TurnObserver {
  animationTime: number
  animationFrame: number
  worshipVisit?: () => void
  presentationHidden?: () => boolean
}

interface TurnPhase {
  active: boolean
  callbacks: (() => void)[]
  observer: TurnObserver
}
const turnPhases = new WeakMap<GameClock, TurnPhase>()

// Transient presentation work can finish after the current fixed turn, including
// multiple turns in a catch-up frame. Nothing is stored in World/checkpoints.
export function afterCurrentGameTurn(clock: GameClock, callback: () => void) {
  const phase = turnPhases.get(clock)
  if (!phase?.active) return false
  phase.callbacks.push(callback)
  return true
}

function turnPhase(clock: GameClock) {
  const existing = turnPhases.get(clock)
  if (existing) return existing
  const phase: TurnPhase = {
    active: false,
    callbacks: [],
    observer: {
      beforeTurn: () => {
        phase.active = true
        clock.beforeTurn?.()
      },
      afterTurn: () => {
        try {
          clock.afterTurn?.()
          phase.active = false
          for (const callback of phase.callbacks) callback()
        } finally {
          phase.active = false
          phase.callbacks.length = 0
        }
      },
    },
  }
  turnPhases.set(clock, phase)
  return phase
}

// Advance animation and simulation in chronological order. Animation fields are
// also read by person controllers, so batching all turns before all animations
// changes gameplay at low refresh rates. The renderer itself remains uncapped.
export function advanceGame(w: World, clock: GameClock, seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid elapsed game time')
  const presentation = clock.worshipVisit && !clock.presentationHidden?.()
  if (w.paused && !presentation) return
  const interval = 1 / 24,
    phase = turnPhase(clock)
  while (seconds > 0) {
    const active = !w.paused,
      ui = w.worshipAcquisition.clock,
      untilUi = presentation ? Math.max(0, (ui.nextVisit - ui.elapsed) / 1000) : Infinity,
      untilTurn =
        active && w.speed > 0
          ? Math.max(0, (1 / TURNS_PER_SECOND - w.pendingTime) / w.speed)
          : Infinity,
      elapsed = Math.min(
        seconds,
        active ? interval - clock.animationTime : Infinity,
        untilUi,
        untilTurn
      )
    const previousTurn = w.turn
    try {
      if (active) tick(w, elapsed * w.speed, phase.observer)
    } finally {
      // A failing beforeTurn/body must not leave a later UI event inside a turn.
      phase.active = false
      phase.callbacks.length = 0
    }
    // Observers finish first; the next controller turn must see this visit's
    // frame. Direct tick() remains simulation-only. A land-paused tick has no turn.
    if (w.turn !== previousTurn) animateLiveObjects(w, 'logical')
    seconds = Math.max(0, seconds - elapsed)
    if (presentation) ui.elapsed += elapsed * 1000
    if (active) clock.animationTime += elapsed
    if (active && clock.animationTime + 1e-9 >= interval) {
      clock.animationTime = 0
      animateLiveObjects(w)
      animateStoneHeads(w)
      stepMessages(w.messages, () => sound(w, 0xe4, HOME))
      clock.animationFrame++
      w.secondaryEffects.animationFrame++
    }
    if (presentation && ui.elapsed + 1e-7 >= ui.nextVisit) {
      const preLimiter = ui.limiter
      clock.worshipVisit!()
      ui.nextVisit = worshipDeadline(ui, preLimiter)
    }
  }
}
