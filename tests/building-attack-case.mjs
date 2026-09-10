import { attackCombatBuilding } from '../app/combat-building.ts'
import {
  approachCombatBuilding,
  enterCombatBuilding,
  approachCombatPosition,
} from '../app/combat-pursuit.ts'
import { buildingInsidePoint, buildingOutsidePoint } from '../app/building-shapes.ts'
import { damageBuildingByPerson, shakeBuilding } from '../app/building-damage.ts'
import { setPersonAnimation } from '../app/animation.ts'
import sprites from '../app/original-units.json' with { type: 'json' }

export function runBuildingAttack(c) {
  const { p, b, w, defender } = c,
    events = []
  let alert = c.alert
  const log = (name, ...args) =>
    events.push([name, ...args, structuredClone(p), structuredClone(b), structuredClone(w)])
  const e = {
    animation: (person, object) => {
      log('animation', object)
      setPersonAnimation(
        person,
        object,
        { ...w, gameFlags: 0, sessionSubstate: null, objects: new Map() },
        sprites
      )
    },
    destination: to => {
      log('planned', to)
      p.goalX = to.x
      p.goalY = to.y
    },
    directDestination: to => {
      log('direct', to)
      p.goalX = to.x
      p.goalY = to.y
    },
    buildingAt: q => (c.occupied.includes((q.y >> 9) * 128 + (q.x >> 9)) ? 2 : 0),
    hasDefenders: () => {
      log('defenders')
      return c.defenders
    },
    removeDefender: () => {
      log('remove')
      return c.remove ? defender : undefined
    },
    encounter: (d, mode) => log('encounter', mode, d.flags2),
    releaseMotion: () => log('release'),
    sound: (id, flags) => log('sound', id, flags),
    inside: () => buildingInsidePoint(b),
    outside: () => buildingOutsidePoint(b),
  }
  const visit = () => {
    if (p.tribe === w.playerTribe && !alert) alert = 1
    p.flags2 = (p.flags2 | 0x2000000) >>> 0
    if (p.flags2 & 0x40000000) {
      p.flags4 = (p.flags4 & ~0x10007) >>> 0
      p.assignment &= ~512
    }
    if (attackCombatBuilding(w, p, b, e) === 'restart') {
      p.substate = 0
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    }
    return 0
  }
  let result
  if (c.mode === 'outside') result = approachCombatBuilding(w, p, c.radius, e)
  else if (c.mode === 'inside') result = enterCombatBuilding(w, p, e)
  else if (c.mode === 'position') result = approachCombatPosition(w, p, e.animation)
  else if (c.mode === 'damage') {
    damageBuildingByPerson(w, b, p)
    result = null
  } else if (c.mode === 'shake') {
    shakeBuilding(b, c.radius)
    result = null
  } else if (c.mode === 'sequence') {
    result = []
    for (let turn = 0; turn < 96; turn++) {
      const value = visit()
      result.push({ p: structuredClone(p), b: structuredClone(b), w: structuredClone(w), value })
      if (!p.substate) break
      if (turn < 95) {
        p.counter = (p.counter + 1) & 255
        p.x = p.goalX
        p.y = p.goalY
      }
    }
  } else result = visit()
  return { p, b, w, defender, events, alert, result }
}
