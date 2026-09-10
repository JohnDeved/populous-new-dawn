import rules from './original-rules.json' with { type: 'json' }
import { movePosition } from './native-math.ts'
import {
  personStepCollision,
  type CollisionPerson,
  type CollisionWorld,
} from './person-collision.ts'
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'

interface Point {
  x: number
  y: number
}
export type FightSite = CollisionPerson & { id: number; h: number; angle: number; counter: number }
export interface FightPlacementWorld {
  collision: CollisionWorld
  search: Uint8Array
  occupied: (point: Point, except: number) => boolean
  outside: (building: number) => Point
  height: (point: Point) => number
}

// 0x51e4b0 checks a four-point envelope, regardless of participant count.
export function validFightSite(
  w: FightPlacementWorld,
  fight: FightSite,
  p: Point,
  checkOthers = true
) {
  const cell = w.collision.cell(p)
  if (cell.flags & 0x206 || rules.terrainCategoryFlags[cell.category & 15] & 0x3c) return false
  if (checkOthers && w.occupied(p, fight.id)) return false
  let { angle } = fight
  for (let i = 0; i < 4; i++, angle += 512) {
    const to = { ...p }
    movePosition(to, angle, 180)
    if (personStepCollision(w.collision, fight, to)) return false
  }
  return true
}

// 0x519d10: building escape every visit, otherwise a periodic indexed search.
// A failed search retains the fight; it does not cancel its participants.
export function relocateFight(w: FightPlacementWorld, fight: FightSite, force = false) {
  const move = (to: Point) => Object.assign(fight, to, { h: w.height(to) })
  const cell = w.collision.cell(fight)
  if (cell.flags & 512) move(w.outside(cell.building & 1023))
  if (!force && fight.counter & 31) return
  if (validFightSite(w, fight, fight)) return
  const search = startIndexedSearch(w.search, 2, fight.angle, 0, 8)
  if (!search) return
  const x = (fight.x >> 8) & 254,
    y = (fight.y >> 8) & 254
  try {
    for (
      let offset = nextIndexedSearch(w.search, search);
      offset;
      offset = nextIndexedSearch(w.search, search)
    ) {
      const to = {
        x: ((((x + offset.x * 2) & 255) + 1) * 256) & 65535,
        y: ((((y + offset.y * 2) & 255) + 1) * 256) & 65535,
      }
      // Height is a pure terrain read and does not affect the validity test.
      // Interpolate only the chosen position, instead of every rejected point.
      if (validFightSite(w, fight, to)) {
        move(to)
        return
      }
    }
  } finally {
    endIndexedSearch(w.search, search)
  }
}
