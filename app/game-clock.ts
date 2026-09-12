import { HOME, sound, tick, type World, type TurnObserver } from './model.ts'
import { animateLiveObjects } from './live-people.ts'
import { stepMessages } from './messages.ts'

export interface GameClock extends TurnObserver {
  animationTime: number
  animationFrame: number
}

// Advance animation and simulation in chronological order. Animation fields are
// also read by person controllers, so batching all turns before all animations
// changes gameplay at low refresh rates. The renderer itself remains uncapped.
export function advanceGame(w: World, clock: GameClock, seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid elapsed game time')
  if (w.paused) return
  const interval = 1 / 24
  while (seconds > 0) {
    const elapsed = Math.min(seconds, interval - clock.animationTime)
    tick(w, elapsed * w.speed, clock)
    seconds = Math.max(0, seconds - elapsed)
    clock.animationTime += elapsed
    if (clock.animationTime + 1e-9 >= interval) {
      clock.animationTime = 0
      animateLiveObjects(w)
      stepMessages(w.messages, () => sound(w, 0xe4, HOME))
      clock.animationFrame++
    }
  }
}
