import { inEngagementArea } from './melee-engagement.ts'
import { random, nativeAngle } from './native-math.ts'
import {
  currentPersonOrder,
  hasFollowingPersonOrder,
  type OrderPool,
  type PersonOrder,
} from './person-orders.ts'
import { defaultPersonState, type StatefulPerson } from './person-state.ts'

type PreachingPerson = StatefulPerson & {
  class: number
  counter: number
  life: number
  x: number
  y: number
  goalX: number
  goalY: number
  commandAux: number
  commandPhase: number
  animationMode: number
  building: number | null
}

interface PreachingWorld {
  randomState: number
  loadFlags: number
  orders: OrderPool
  tribeFlags: ArrayLike<number>
}

const short = (n: number) => (n << 16) >> 16
const close = (p: PreachingPerson) =>
  Math.abs(short(p.goalX - p.x)) < 12 && Math.abs(short(p.goalY - p.y)) < 12

// 0x4d8300: the normal game halves 200 before applying centered 1/8 jitter.
export function conversionDelay(w: Pick<PreachingWorld, 'randomState' | 'loadFlags'>) {
  const base = w.loadFlags & 0x4000000 ? 200 : 100,
    spread = base >> 3
  return base + (random(w) % spread) - (spread >> 1)
}

export function initializeConversionVictim(
  w: Pick<PreachingWorld, 'randomState' | 'loadFlags'>,
  victim: PreachingPerson,
  preacher: PreachingPerson,
  stop: () => void
) {
  victim.previousState = victim.state
  victim.state = 23
  victim.substate = 0
  victim.workTarget = preacher.id
  victim.timer = conversionDelay(w)
  victim.flags4 = (victim.flags4 | 128) >>> 0
  victim.flags2 = ((victim.flags2 | 0x200200) & ~0x2000000) >>> 0
  stop()
}

// 0x4d83b0: validate the linked sermon, count down, retry at 1/3, then replace.
export function stepConversionVictim(
  w: PreachingWorld,
  victim: PreachingPerson,
  preacher: PreachingPerson | undefined
): 'waiting' | 'cancel' | 'convert' {
  const order = preacher && currentPersonOrder(w.orders, preacher)
  if (
    !preacher ||
    preacher.class !== 1 ||
    preacher.life < 1 ||
    ![10, 33].includes(preacher.state) ||
    !order ||
    order.flags & 1 ||
    ![17, 31, 32].includes(order.model) ||
    (preacher.flags2 | victim.flags2) & 0x2004 ||
    preacher.speed
  )
    return 'cancel'

  if (!(victim.counter & 7)) {
    victim.turnAngle = nativeAngle(short(preacher.x - victim.x), -short(preacher.y - victim.y))
    victim.flags2 = (victim.flags2 | 0x1080) >>> 0
  }
  const before = victim.timer
  victim.timer = short(before - 1)
  const forced = !!(w.tribeFlags[victim.tribe] & 64)
  if (before >= 0 && !forced) {
    // Listener movement/poses are collapsed, but state 23 still owns this draw.
    if (victim.substate < 3) victim.substate = 3
    if (victim.substate === 3 && !(victim.counter & 15) && !(random(w) & 1)) victim.substate = 5
    return 'waiting'
  }
  if (!(random(w) % 3 === 1 || w.loadFlags & 0x4000000 || forced)) {
    victim.timer = conversionDelay(w)
    return 'waiting'
  }
  return 'convert'
}

export function cancelConversionVictim(victim: PreachingPerson, gameFlags: number) {
  victim.workTarget = 0
  victim.flags4 = (victim.flags4 & ~128) >>> 0
  victim.flags2 = (victim.flags2 & ~0x200000) >>> 0
  return defaultPersonState(victim, gameFlags)
}

// 0x43a4d0 shared by commands 17/31/32. Listener orbit/gesture visuals remain
// deliberately subordinate to the native timing, RNG and ownership lifecycle.
export function stepPreachingOrder(
  w: PreachingWorld,
  p: PreachingPerson,
  _order: PersonOrder,
  effects: {
    animate: (object: number) => void
    animationDuration: () => number
    stop: () => void
    acquire: (radius: number) => number
    release: (radius: number) => void
  }
) {
  if (!p.substate) {
    p.substate = p.commandStatus === 32 ? 5 : 1
    p.statusFlags &= ~2
    p.commandAux = 3
    p.flags2 = (p.flags2 | 0x200000) >>> 0
    if (p.flags2 & 0x800000 && p.building !== null) {
      p.flags4 = ((p.flags4 & ~0x10007) | 2) >>> 0
      p.commandAux += 2
      p.workTarget = p.building
    }
  }

  let scans = false
  if (p.substate === 1 && close(p)) {
    p.substate = 2
    p.flags2 = (p.flags2 | 0x40000000) >>> 0
  }
  if (p.substate === 2) {
    scans = true
    if (p.flags2 & 0x40000000) {
      p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      effects.stop()
      effects.animate(95)
      p.timer = effects.animationDuration()
    }
    p.timer = short(p.timer - 1)
    if (p.timer <= 0) {
      p.substate = 3
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    }
  } else if (p.substate === 3) {
    scans = true
    if (p.flags2 & 0x2004 || p.speed) {
      p.animationMode = 1
      p.assignment |= 16
    } else {
      if (p.flags2 & 0x40000000) {
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        p.timer = 0
        p.animationMode = 0
        p.statusFlags &= ~1
        effects.animate(97)
      }
      p.timer = short(p.timer + 1)
      if (!(p.statusFlags & 2)) {
        if (!p.animationMode && !(p.counter & 15)) {
          const pose = random(w) & 3
          if (pose === 1 || pose === 2) {
            p.animationMode = pose
            p.assignment |= 16
          }
        } else if (p.animationMode === 1) {
          if (p.assignment & 16) {
            p.commandPhase = 40
            p.assignment &= ~16
          }
          p.commandPhase--
          if (p.commandPhase < 1) {
            p.animationMode = 0
            p.assignment |= 16
          } else if (!(p.counter & 7)) {
            p.turnAngle = (p.angle + 24) & 2047
            p.flags2 = (p.flags2 | 0x1080) >>> 0
          }
        } else if (p.animationMode === 2) {
          p.animationMode = 0
          p.turnAngle = random(w) & 2047
          p.flags2 = (p.flags2 | 0x1080) >>> 0
          p.assignment |= 16
        }
      }
      if (p.timer >= 840) p.substate = 4
    }
  } else if (p.substate === 4) {
    if (hasFollowingPersonOrder(w.orders, p)) {
      p.assignment &= ~64
      effects.release(p.commandAux)
      return 1
    }
    p.substate = 2
    p.flags2 = (p.flags2 | 0x40000000) >>> 0
  } else if (p.substate === 5) {
    scans = true
    if (close(p)) {
      effects.stop()
      p.substate = 2
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    }
  }

  let targets = p.assignment & 64 ? 1 : 0
  if (scans && !(p.counter & 1)) {
    targets = effects.acquire(p.commandAux)
    p.assignment = targets ? p.assignment | 64 : p.assignment & ~64
  }
  if (p.commandStatus === 32 && p.timer > 32 && !targets) {
    effects.release(p.commandAux)
    return 1
  }
  return 0
}

export const inPreachingRange = inEngagementArea
