import { damageDisasterBuilding, damageTornadoTree } from './building-runtime.ts'
import { buildingModel } from './building-shapes.ts'
import {
  createLivePerson,
  registerLivePerson,
  setLivePersonAnimation,
  type LivePerson,
} from './live-people.ts'
import { moveObjectInCells } from './object-cells.ts'
import { personAnimationObject } from './person-state.ts'
import {
  stepTornado,
  stepTornadoPerson,
  type TornadoBuilding,
  type TornadoPerson,
  type TornadoScenery,
} from './tornado.ts'
import { browserPosition } from './world-coordinates.ts'
import { moveVisual, sound } from './world-effects.ts'
import { release, releaseTasks } from './world-tasks.ts'
import { nativePosition } from './world-terrain-runtime.ts'
import type { Building, Effect, Tree, Unit, World } from './world-types.ts'

export function stepLiveTornado(w: World, fx: Effect) {
  const tornado = fx.tornado!,
    units = new Map<number, Unit>(),
    people = new Map<number, LivePerson>(),
    cells = new Map<number, TornadoPerson[]>(),
    buildings = new Map<number, Building>(),
    buildingCells = new Map<number, TornadoBuilding[]>(),
    trees = new Map<number, Tree>(),
    sceneryCells = new Map<number, TornadoScenery[]>()
  for (const u of w.units) {
    if (u.hp <= 0) continue
    const p = u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? createLivePerson(w, u),
      cell = ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) >>> 0,
      row = cells.get(cell) ?? []
    units.set(p.id, u)
    people.set(p.id, p)
    row.unshift(p)
    cells.set(cell, row)
  }
  for (const b of w.buildings) {
    if (b.hp <= 0 || b.preparation) continue
    const p = nativePosition(w, b),
      cell = ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) >>> 0,
      row = buildingCells.get(cell) ?? [],
      candidate = { id: b.id, model: buildingModel(b) }
    buildings.set(b.id, b)
    row.unshift(candidate)
    buildingCells.set(cell, row)
  }
  for (const tree of w.trees) {
    if (tree.logs <= 0 || tree.model < 1 || tree.model > 6) continue
    const p = nativePosition(w, tree),
      cell = ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) >>> 0,
      row = sceneryCells.get(cell) ?? [],
      candidate = { id: tree.id, model: tree.model }
    trees.set(tree.id, tree)
    row.unshift(candidate)
    sceneryCells.set(cell, row)
  }
  const alive = stepTornado(w, tornado, {
    people: cell => cells.get(cell) ?? [],
    buildings: cell => buildingCells.get(cell) ?? [],
    scenery: cell => sceneryCells.get(cell) ?? [],
    capture: candidate => {
      const u = units.get(candidate.id)!
      let p = people.get(candidate.id)!
      if (candidate.flags2 & 0x800000) p = release(w, u) ?? p
      else releaseTasks(w, u)
      u.native = p
      u.flight = undefined
      p.previousState = p.state
      p.state = 24
      p.substate = 0
      p.stateObject = fx.id
      setLivePersonAnimation(w, p, personAnimationObject(p))
      w.selected = w.selected.filter(id => id !== u.id)
      registerLivePerson(w, p)
      sound(
        w,
        p.model === 7 ? (p.tribe === w.manaWorld.playerTribe ? 26 : 137) : 210,
        browserPosition(p)
      )
    },
    damage: candidate => damageDisasterBuilding(w, buildings.get(candidate.id)!, w, tornado.tribe),
    damageScenery: candidate => damageTornadoTree(w, trees.get(candidate.id)!),
    sound: stop => {
      const event = sound(w, 163, fx, fx.id)
      if (stop) event.stop = true
    },
  })
  moveVisual(fx, tornado)
  return alive
}

export function stepLiveTornadoPerson(w: World, u: Unit) {
  const p = u.native!,
    fx = w.effects.find(effect => effect.id === p.stateObject),
    before = { x: p.x, y: p.y, h: p.h },
    carried = stepTornadoPerson(w, p, fx?.tornado, w.manaWorld.gameFlags),
    after = { x: p.x, y: p.y, h: p.h }
  Object.assign(p, before)
  moveObjectInCells(w.objectCells, p, after)
  Object.assign(u, browserPosition(p))
  u.heading = Math.PI - (p.heading * Math.PI) / 1024
  if (!carried) {
    u.flight = p
    u.lift = 1
  }
}
