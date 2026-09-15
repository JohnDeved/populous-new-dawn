import rules from './original-rules.json' with { type: 'json' }
import {
  nativeAngle,
  movePosition,
  positionDistance,
  positionDistanceSquared,
  random,
} from './native-math.ts'
import { startIndexedSearch, nextIndexedSearch, endIndexedSearch } from './indexed-search.ts'
import {
  setPersonAnimationRow,
  recoverPersonMovement,
  type StatefulPerson,
  type PersonStateEffects,
} from './person-state.ts'

interface Point {
  x: number
  y: number
}
export type MarchingPerson = StatefulPerson & {
  class: number
  counter: number
  heading: number
  destinationX: number
  destinationY: number
  turnY: number
  recoveryCounter: number
  formationDelay: number
  f1: number
  f2: number
  draw: number
}
export type MarchingFormation = Point & {
  id: number
  class: number
  model: number
  heading: number
  destinationX: number
  destinationY: number
  shape: number
  speed: number
  timer: number
  shapeTimer: number
  count: number
  freeSlot: number
  members: number[]
  offsets: Point[]
}
interface FormationWorld {
  search: Uint8Array
  cellPeople: (cell: number) => Iterable<MarchingPerson>
}
const short = (n: number) => (n << 16) >> 16
const byte = (n: number) => (n << 24) >> 24
const destination = (p: { destinationX: number; destinationY: number }) => ({
  x: p.destinationX,
  y: p.destinationY,
})
const direction = (p: MarchingPerson) =>
  nativeAngle(short(p.destinationX - p.x), -short(p.destinationY - p.y))
const near = (a: Point, b: Point, radius: number) =>
  Math.abs(short(a.x) - short(b.x)) < radius && Math.abs(short(a.y) - short(b.y)) < radius
function angleDistance(a: number, b: number) {
  const delta = Math.abs(short(a) - short(b))
  return short(delta > 1024 ? 2048 - delta : delta)
}
function slotPosition(g: MarchingFormation, slot: number) {
  return { x: (g.x + g.offsets[slot].x * 16) & 65535, y: (g.y + g.offsets[slot].y * 16) & 65535 }
}
function updateFreeSlot(g: MarchingFormation) {
  const slot = g.members.indexOf(0)
  g.freeSlot = slot === -1 ? 12 : slot
}
function compactColumn(g: MarchingFormation, column: number) {
  for (let row = 0; row < 4; row++) {
    const slot = column + row * 3
    if (g.members[slot]) continue
    for (let next = slot + 3; next < 12; next += 3)
      if (g.members[next]) {
        g.members[slot] = g.members[next]
        g.members[next] = 0
        break
      }
  }
  updateFreeSlot(g)
}

// 0x501700: twelve signed-byte offsets; the controller scales them by sixteen.
export function updateMarchingOffsets(g: MarchingFormation) {
  if (g.shape === 1) {
    const sin = rules.sine[g.heading],
      cos = rules.sine[(g.heading + 512) & 2047]
    g.offsets = rules.marchingFormationOffsets.map(([x, y]) => ({
      x: byte((Math.imul(sin, y) + Math.imul(cos, x)) >> 16),
      y: byte((Math.imul(cos, y) - Math.imul(sin, x)) >> 16),
    }))
  } else {
    g.offsets = []
    for (let row = 0; row < 4; row++) {
      const center = { x: g.x, y: g.y }
      if (row) movePosition(center, (g.heading + 1024) & 2047, row * 18)
      for (const side of [0, -512, 512]) {
        const to = { ...center }
        if (side) movePosition(to, (g.heading + side) & 2047, 18)
        g.offsets.push({ x: byte(to.x - g.x), y: byte(to.y - g.y) })
      }
    }
  }
}

// 0x501ab0: preserve tribe-list order, the unwrapped square and signed distance delta.
export function findMarchingFormation(p: MarchingPerson, groups: Iterable<MarchingFormation>) {
  const remaining = positionDistanceSquared(destination(p), p)
  for (const g of groups)
    if (
      g.class &&
      g.model === p.model &&
      near(g, p, 2104) &&
      angleDistance(p.heading, g.heading) < 113 &&
      g.freeSlot < 11 &&
      ((positionDistanceSquared(destination(g), slotPosition(g, g.freeSlot)) - remaining) | 0) < 65
    )
      return g
}

function* nearbyPeople(w: FormationWorld, p: Point) {
  const search = startIndexedSearch(w.search, 2, 0, 0, 3)
  if (!search) return
  try {
    for (
      let delta = nextIndexedSearch(w.search, search);
      delta;
      delta = nextIndexedSearch(w.search, search)
    ) {
      const x = (((p.x >> 8) & 254) + delta.x * 2) & 255,
        y = (((p.y >> 8) & 254) + delta.y * 2) & 255
      yield* w.cellPeople(x | (y << 8))
    }
  } finally {
    endIndexedSearch(w.search, search)
  }
}

// 0x501c00: mark compatible movers and choose the nearest-to-waypoint leader.
export function findMarchingLeader(w: FormationWorld, p: MarchingPerson) {
  const heading = direction(p)
  let count = 0,
    distance = 0xfffffff,
    leader: MarchingPerson | undefined
  for (const other of nearbyPeople(w, p))
    if (
      other.class === 1 &&
      other.tribe === p.tribe &&
      other.model === p.model &&
      other.state === 10 &&
      other.commands[other.commandCursor] &&
      !(other.assignment & 32) &&
      other.assignment & 8 &&
      angleDistance(direction(other), heading) < 113
    ) {
      count++
      other.flags3 = (other.flags3 | 16) >>> 0
      const d = positionDistance(other, destination(other))
      if (d < distance) {
        distance = d
        leader = other
      }
    }
  return count >= 2 ? leader : undefined
}
function attach(g: MarchingFormation, p: MarchingPerson) {
  if (g.freeSlot >= 11) return
  g.members[g.freeSlot] = p.id
  g.count = (g.count + 1) & 255
  updateFreeSlot(g)
  p.flags2 = (p.flags2 | 0x200000) >>> 0
  p.assignment |= 32
  p.speed = Math.trunc(g.speed / 2)
}
// 0x501e90 clears marks even when allocation failed or the group is full.
export function recruitMarchingPeople(
  w: FormationWorld,
  p: MarchingPerson,
  g?: MarchingFormation,
  leader?: MarchingPerson
) {
  if (leader) leader.flags3 = (leader.flags3 & ~16) >>> 0
  for (const other of nearbyPeople(w, p))
    if (other.flags3 & 16) {
      other.flags3 = (other.flags3 & ~16) >>> 0
      if (g) attach(g, other)
    }
}
// 0x5018c0: join an existing group or allocate one around the chosen leader.
export function joinMarchingFormation(
  w: FormationWorld,
  p: MarchingPerson,
  groups: Iterable<MarchingFormation>,
  allocate: (leader: MarchingPerson) => MarchingFormation | undefined
) {
  if (p.assignment & 32) return
  if (p.formationDelay) {
    p.formationDelay = (p.formationDelay - 1) & 255
    return
  }
  if (!p.speed || p.flags2 & 0x800 || byte(p.recoveryCounter) <= 23) return
  p.formationDelay = 24
  const existing = findMarchingFormation(p, groups)
  if (existing) {
    attach(existing, p)
    return
  }
  const leader = findMarchingLeader(w, p),
    g = leader && allocate(leader)
  if (g && leader) {
    g.destinationX = leader.destinationX
    g.destinationY = leader.destinationY
    g.heading = nativeAngle(short(g.destinationX - g.x), -short(g.destinationY - g.y))
    g.model = leader.model
    updateMarchingOffsets(g)
    const speed = short(rules.personSpeeds[leader.physics])
    g.speed = short(speed + Math.trunc(speed / 16))
    attach(g, leader)
  }
  recruitMarchingPeople(w, p, g, leader)
}

// Complete 0x501000, including member loss, column compaction, formation changes,
// catch-up speed and the separate pose RNG. World allocation/motion are consumers.
export function stepMarchingFormation(
  w: {
    randomState: number
    poseRandom: { randomState: number }
    people: ReadonlyMap<number, MarchingPerson>
  },
  g: MarchingFormation,
  e: {
    destination: (p: MarchingPerson, to: Point) => void
    remove: () => void
    setAnimation: PersonStateEffects['setAnimation']
  }
) {
  const originalCount = g.count
  let obstructed = false
  const restore = (p: MarchingPerson) => {
    p.formationDelay = 24
    if (p.assignment & 32) {
      p.assignment &= ~32
      recoverPersonMovement(w, p, e.setAnimation)
    }
    e.destination(p, destination(p))
  }
  for (let slot = 0; slot < 12; slot++) {
    const id = g.members[slot]
    if (!id) continue
    const p = w.people.get(id)
    if (!p) {
      g.members[slot] = 0
      g.count = (g.count - 1) & 255
      updateFreeSlot(g)
      if (!g.count) e.remove()
      continue
    }
    const blocked = !!(p.flags2 & 0x80800)
    if (
      p.class &&
      !(p.flags2 & 1) &&
      p.assignment & 32 &&
      !blocked &&
      !near(destination(p), p, 568) &&
      angleDistance(direction(p), g.heading) < 114 &&
      (positionDistanceSquared(p, slotPosition(g, slot)) | 0) < 0x400001
    )
      continue
    if (p.class && !(p.flags2 & 1) && p.assignment & 32 && blocked) obstructed = true
    restore(p)
    g.members[slot] = 0
    g.count = (g.count - 1) & 255
    updateFreeSlot(g)
    if (!g.count) e.remove()
  }
  if (g.count < 2) {
    for (let slot = 0; slot < 12 && g.count; slot++)
      if (g.members[slot]) {
        restore(w.people.get(g.members[slot])!)
        g.members[slot] = 0
        g.count = (g.count - 1) & 255
        updateFreeSlot(g)
        if (!g.count) e.remove()
      }
    return
  }
  if (obstructed && g.timer < 40) g.timer = 40
  if (g.shapeTimer && !(g.shapeTimer = (g.shapeTimer - 1) & 255)) {
    g.shape = 0
    g.timer = (random(w) & 7) + 24
    updateMarchingOffsets(g)
  }
  if (g.timer && !(g.timer = short(g.timer - 1)) && (random(w) & 7) === 2) {
    g.shapeTimer = 64
    g.shape = 1
    updateMarchingOffsets(g)
  }
  if (g.count < originalCount) {
    for (let column = 0; column < 3; column++) compactColumn(g, column)
    if (!g.members[0])
      for (let slot = 1; slot < 3; slot++)
        if (g.members[slot]) {
          g.members[0] = g.members[slot]
          g.members[slot] = 0
          compactColumn(g, slot)
          break
        }
    g.members.forEach((id, slot) => {
      if (id) e.destination(w.people.get(id)!, slotPosition(g, slot))
    })
  }
  const leader = w.people.get(g.members[0])!,
    moving = near(g, leader, 72)
  g.members.forEach((id, slot) => {
    if (!id) return
    const p = w.people.get(id)!
    const base = short(rules.personSpeeds[p.physics])
    p.speed = short(base + Math.trunc(base / 2))
    if (near(slotPosition(g, slot), p, 72)) p.speed = moving ? g.speed : 0
    if (!p.speed) setPersonAnimationRow(p, p.cargo ? 4 : 0, e.setAnimation)
    else if (!(p.assignment & 128)) {
      if (!(p.counter & 127) && !(random(w.poseRandom) & 3)) {
        e.setAnimation(p, rules.personAnimationObjects[(p.cargo ? 4 : 7) * 9 + p.model] & 255)
        if (!p.cargo) {
          p.f2 = 0
          p.f1 = rules.animationDescriptors[p.draw].hold
        }
        p.assignment |= 128
      } else setPersonAnimationRow(p, p.cargo ? 5 : 1, e.setAnimation)
    } else if (!p.f2 && !p.f1) setPersonAnimationRow(p, p.cargo ? 5 : 1, e.setAnimation)
  })
  if (moving) {
    movePosition(g, g.heading, leader.speed)
    g.members.forEach((id, slot) => {
      if (id) e.destination(w.people.get(id)!, slotPosition(g, slot))
    })
  }
}
