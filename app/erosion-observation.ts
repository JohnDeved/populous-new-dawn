import type { Erosion } from './erosion.ts'

interface Ground {
  heights: Int16Array
}
interface Random {
  randomState: number
}
interface Effects {
  sound: () => void
  terrain: (cell: number) => void
}
type Step = (land: Ground, erosion: Erosion, game: Random, effects: Effects) => boolean
type State = Erosion & Random & { heights: Int16Array }
type Notification =
  | { kind: 'sound'; completed: boolean }
  | { kind: 'terrain'; cell: number; completed: boolean }
interface Visit {
  ordinal: number
  before: State
  after: State | null
  alive: boolean | null
  completed: boolean
  notifications: Notification[]
  copyMilliseconds: number
}
interface Capture {
  visits: Visit[]
  failure: string | null
  detached: boolean
}

const captures = new WeakMap<Erosion, Capture>()

function diagnose(capture: Capture, action: () => void) {
  if (capture.failure) return
  try {
    action()
  } catch (error) {
    // Even a hostile/unprintable diagnostic error cannot replace a game error.
    capture.failure = 'Erosion observation failed'
    try {
      capture.failure = String(error) || capture.failure
    } catch {
      // Keep the safe fallback when even diagnostic stringification fails.
    }
  }
}

function snapshot(land: Ground, erosion: Erosion, game: Random): State {
  if (!(land.heights instanceof Int16Array) || land.heights.length !== 16384)
    throw new Error('Erosion observation requires all 16384 native signed heights')
  return {
    center: { ...erosion.center },
    remaining: erosion.remaining,
    randomState: game.randomState,
    heights: new Int16Array(land.heights),
  }
}

// A diagnostic handle owns only copies. Its registration changes neither the
// controller nor World; the browser driver must prove ordinary onset separately.
export function armErosionCapture(erosion: Erosion) {
  if (erosion.remaining !== 64 || captures.has(erosion))
    throw new Error('Erosion capture requires a new, unobserved controller at remaining 64')
  const capture: Capture = { visits: [], failure: null, detached: false }
  captures.set(erosion, capture)
  return {
    status: () => ({ count: capture.visits.length, failure: capture.failure }),
    read: () => structuredClone(capture),
    detach: () => {
      capture.detached = true
      // Keep the weak registration to reject re-arming the same controller.
    },
  }
}

// The disabled path performs no copies, allocations, wrappers or timing reads.
// The same controller body runs exactly once in every path. Diagnostic failures
// disable collection; application exceptions retain their identity and propagation.
export function observeErosionStep(
  land: Ground,
  erosion: Erosion,
  game: Random,
  effects: Effects,
  step: Step
) {
  const capture = captures.get(erosion)
  if (!capture || capture.detached || capture.failure) return step(land, erosion, game, effects)
  let visit: Visit | undefined
  diagnose(capture, () => {
    if (capture.visits.length >= 64) throw new Error('Erosion capture exceeded 64 visits')
    const start = performance.now(),
      before = snapshot(land, erosion, game)
    visit = {
      ordinal: capture.visits.length + 1,
      before,
      after: null,
      alive: null,
      completed: false,
      notifications: [],
      copyMilliseconds: performance.now() - start,
    }
    capture.visits.push(visit)
  })
  if (!visit || capture.failure) return step(land, erosion, game, effects)
  const current = visit
  const notify = (notification: Notification, action: () => void) => {
    diagnose(capture, () => current.notifications.push(notification))
    const result = action()
    notification.completed = true
    return result
  }
  try {
    const alive = step(land, erosion, game, {
      sound: () => notify({ kind: 'sound', completed: false }, () => effects.sound()),
      terrain: cell =>
        notify({ kind: 'terrain', cell, completed: false }, () => effects.terrain(cell)),
    })
    current.alive = alive
    current.completed = true
    return alive
  } finally {
    diagnose(capture, () => {
      const start = performance.now()
      current.after = snapshot(land, erosion, game)
      current.copyMilliseconds += performance.now() - start
    })
  }
}
