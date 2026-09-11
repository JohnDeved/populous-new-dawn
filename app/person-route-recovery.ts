import {
  defaultPersonState,
  setPersonAnimationRow,
  type StatefulPerson,
  type PersonStateEffects,
} from './person-state.ts'

type RecoveryPerson = StatefulPerson & {
  counter: number
  life: number
  commandPhase: number
}
const short = (n: number) => (n << 16) >> 16
const byte = (n: number) => (n << 24) >> 24

// 0x4d9580: stop without losing the order; report only a recent local command.
export function initializeRouteRecovery(
  w: { gameFlags: number; playerTribe: number; turn: number; lastOrderTurn: number },
  p: RecoveryPerson,
  e: {
    animation: PersonStateEffects['setAnimation']
    release: () => void
    sound: (cue: number) => void
    notify: (flags: number, message: number) => void
  }
) {
  p.speed = 0
  p.timer = 0
  setPersonAnimationRow(p, p.cargo ? 4 : 0, e.animation)
  p.substate = 0
  p.flags2 = (p.flags2 | 0x40000000) >>> 0
  e.release()
  if (w.gameFlags & 2) p.life = 0
  else if (p.tribe === w.playerTribe && (w.turn - w.lastOrderTurn) >>> 0 < 3) {
    e.sound(p.model === 7 ? 226 : 225)
    e.notify(0x200000, 603)
  }
}

// Complete 0x4d9650. Retry phases retain the same command and native search
// options; the long wait probes on person-counter multiples of 128.
export function stepRouteRecovery(
  w: {
    gameFlags: number
    loadFlags: number
    tribe: { flags: number; flags2: number; playerType: number }
  },
  p: RecoveryPerson,
  e: {
    unsupportedGround: () => boolean
    adjacentBuilding: () => number
    build: (option: number) => number
    release: () => void
    clearFailure: (route: number) => void
    attach: (route: number) => void
    initialize: () => void
  }
) {
  if (!(p.counter & 7)) {
    let limit = w.tribe.playerType === 2 ? 352 : 864
    if (w.tribe.flags2 & 64) limit = 32
    if (p.timer < limit) p.timer = short(p.timer + 7)
    else if (!(w.loadFlags & 0x4000000)) p.life = short(p.life - 56)
  }
  const phase = (state: number) => {
    p.substate = state
    p.flags2 = (p.flags2 | 0x40000000) >>> 0
  }
  const resume = () => {
    p.state = defaultPersonState(p, w.gameFlags)
    e.initialize()
  }
  const retry = () => {
    const route = e.build(p.substate === 3 ? 0 : p.animationMode)
    p.flags2 = (p.flags2 & 0x7fffffff) >>> 0
    if (!route) return false
    e.release()
    e.clearFailure(route)
    e.attach(route)
    resume()
    return true
  }
  switch (p.substate) {
    case 0: {
      const airborne = e.unsupportedGround()
      if (!airborne && !e.adjacentBuilding()) {
        phase(1)
        return
      }
      p.state = defaultPersonState(p, w.gameFlags)
      p.flags2 = (p.flags2 | 0x100000) >>> 0
      e.initialize()
      if (!airborne) p.motionTimer = 0
      p.flags2 = ((p.flags2 & ~0x100000) | (airborne ? 0x80000 : 0x20000800)) >>> 0
      return
    }
    case 1:
      if (p.flags2 & 0x40000000) {
        p.commandPhase = 0
        p.animationMode = 4
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
      }
      if (byte(p.commandPhase) > 0) {
        p.commandPhase = (p.commandPhase - 1) & 255
        return
      }
      p.animationMode = (p.animationMode - 1) & 255
      if (!p.animationMode) {
        phase(2)
        return
      }
      p.commandPhase = 8
      retry()
      return
    case 2:
      if (p.flags2 & 0x40000000) {
        p.commandPhase = 0
        p.animationMode = 1
        p.flags2 = (p.flags2 & ~0x40000000) >>> 0
        if (p.flags2 & 128 || !(w.tribe.flags & 32)) {
          phase(3)
          return
        }
      }
      p.commandPhase = (p.commandPhase - 1) & 255
      if (byte(p.commandPhase) < 1 && !retry()) {
        p.commandPhase = 8
        p.animationMode = (p.animationMode + 1) & 255
        if (p.animationMode > 8) phase(3)
      }
      return
    case 3:
      if (!(p.counter & 127)) retry()
  }
}
