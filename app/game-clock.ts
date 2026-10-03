import { HOME, sound, tick, type World, type TurnObserver } from './model.ts'
import { animateLiveObjects } from './live-people.ts'
import { stepMessages } from './messages.ts'
import { animateStoneHeads } from './stone-head-animation.ts'

export interface GameClock extends TurnObserver {
  animationTime: number
  animationFrame: number
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
  if (w.paused) return
  const interval = 1 / 24,
    phase = turnPhase(clock)
  while (seconds > 0) {
    const elapsed = Math.min(seconds, interval - clock.animationTime)
    try {
      tick(w, elapsed * w.speed, phase.observer)
    } finally {
      // A failing beforeTurn/body must not leave a later UI event inside a turn.
      phase.active = false
      phase.callbacks.length = 0
    }
    seconds = Math.max(0, seconds - elapsed)
    clock.animationTime += elapsed
    if (clock.animationTime + 1e-9 >= interval) {
      clock.animationTime = 0
      animateLiveObjects(w)
      animateStoneHeads(w)
      stepMessages(w.messages, () => sound(w, 0xe4, HOME))
      clock.animationFrame++
    }
  }
}
