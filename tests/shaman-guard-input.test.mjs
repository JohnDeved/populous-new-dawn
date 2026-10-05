import assert from 'node:assert/strict'
import test from 'node:test'
import { addBuilding, addUnit, command, createWorld, guardShaman, tick, unitAnimationSource } from '../app/model.ts'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { currentPersonOrder, emptyPersonOrder } from '../app/person-orders.ts'
import { setSelection } from '../app/selection-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { advanceGame } from '../app/game-clock.ts'
import { animateLiveObjects, createLivePerson } from '../app/live-people.ts'
import { stepLiveMovement } from '../app/live-movement.ts'
import { release } from '../app/world-tasks.ts'
import { canOrder } from '../app/selection-runtime.ts'
import { BuilderTask } from '../app/building-workers.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { buildingOutsidePoint, buildingPose } from '../app/building-shapes.ts'
import vectors from './fixtures/shaman-guard-native.json' with { type: 'json' }

function setup(count = 1) {
  const w = createStartedWorld(1)
  retainFixtureUnits(w, () => false)
  w.buildings = []; w.trees = []; w.shrines = []
  w.terrain.fill(3); w.terrainVersion++; w.manaWorld.gameFlags = 32
  const shaman = addUnit(w, 'blue', 'shaman', { x: 0, z: 8 })
  const units = Array.from({ length: count }, (_, i) => addUnit(w, 'blue', 'firewarrior', { x: 2 + i, z: 8 }))
  for (let i = 0; i < 40; i++) tick(w, 1 / 12)
  setSelection(w, units.map(u => u.id))
  return { w, shaman, units, u: units[0], p: units[0].native }
}
const order = (w, u) => currentPersonOrder(w.buildingOrders, u.native)
const phase = p => [p.object, p.draw, p.f1, p.f2, p.stamp]

test('G queues one shared native guard and repeat replaces it without early preparation', () => {
  const { w, shaman, units } = setup(2), people = units.map(u => u.native)
  const before = people.map(phase)
  guardShaman(w)
  const first = order(w, units[0])
  assert.equal(first?.model, 30)
  assert.equal(first.a, shaman.id)
  assert.equal(first.references, 2)
  assert.ok(units.every((u, i) => u.native === people[i] && order(w, u) === first && !u.guard))
  assert.deepEqual(people.map(phase), before)
  assert.equal(w.manaTribes[0].shamanGuards, 0)
  tick(w, 1 / 12)
  assert.ok(people.every(p => p.state === 10 && p.commandStatus === 30 && !(p.flags2 & 16)))
  assert.equal(w.manaTribes[0].shamanGuards, 2)
  const adopted = people.map(phase)
  guardShaman(w)
  assert.equal(first.references, 0)
  assert.equal(order(w, units[0]).references, 2)
  assert.ok(people.every(p => p.commandStatus === 0 && p.flags2 & 16))
  assert.ok(units.every((u, i) => unitAnimationSource(u) === people[i]))
  assert.deepEqual(people.map(phase), adopted)
  assert.equal(w.manaTribes[0].shamanGuards, 0)
  tick(w, 1 / 12)
  assert.equal(w.manaTribes[0].shamanGuards, 2)
  setSelection(w, [units[0].id]); guardShaman(w)
  assert.equal(order(w, units[1]).references, 1)
  assert.notEqual(order(w, units[0]), order(w, units[1]))
})

for (const shamanOnly of [false, true]) test(`G ${shamanOnly ? 'Shaman-only' : 'empty'} selection cancels adopted guards through the next native visit`, () => {
  const { w, shaman, u, p } = setup()
  guardShaman(w)
  setSelection(w, shamanOnly ? [shaman.id] : []); guardShaman(w)
  assert.equal(order(w, u)?.model, 30, 'unadopted queue is retained')
  tick(w, 1 / 12)
  const before = phase(p), original = order(w, u)
  guardShaman(w)
  assert.equal(order(w, u), undefined)
  assert.equal(original.references, 0)
  assert.equal(w.manaTribes[0].shamanGuards, 0)
  assert.equal(p.state, 10)
  assert.equal(p.commandStatus, 0)
  assert.equal(unitAnimationSource(u), p)
  assert.deepEqual(phase(p), before)
  tick(w, 1 / 12)
  assert.ok([17, 19].includes(p.state))
  assert.equal(u.native, p)
  assert.equal(unitAnimationSource(u), p)
  assert.equal(p.guardInputPending, undefined)
})

test('native G retains the ordinary move owner and route until its deferred turn', () => {
  const { w, u } = setup()
  command(w, { x: 24, z: 8 })
  const p = u.native, route = p.motionGroup, before = phase(p)
  assert.ok(route)
  guardShaman(w)
  assert.equal(u.native, p)
  assert.equal(p.motionGroup, route)
  assert.equal(order(w, u)?.model, 30)
  assert.equal(unitAnimationSource(u), p)
  assert.deepEqual(phase(p), before)
  tick(w, 1 / 12)
  assert.equal(u.native, p)
  assert.equal(p.commandStatus, 30)
  assert.equal(w.manaTribes[0].shamanGuards, 1)
})

for (const cancel of [false, true]) test(`pending G ${cancel ? 'cancellation' : 'replacement'} survives pause and checkpoint`, () => {
  const { w, u, p } = setup()
  guardShaman(w); tick(w, 1 / 12)
  if (cancel) setSelection(w, [])
  guardShaman(w)
  const before = structuredClone(p)
  w.paused = true; tick(w, 1)
  assert.deepEqual(p, before)
  const restored = migrateCheckpoint(structuredClone(w)), copy = restored.units.find(a => a.id === u.id)
  assert.equal(unitAnimationSource(copy), copy.native)
  assert.deepEqual(copy.native, before)
  w.paused = restored.paused = false
  tick(w, 1 / 12); tick(restored, 1 / 12)
  assert.deepEqual(copy.native, p)
  assert.deepEqual(restored.buildingOrders, w.buildingOrders)
  assert.equal(restored.manaTribes[0].shamanGuards, cancel ? 0 : 1)
})

test('G exhaustion still clears and attaches slot zero then retries after cleanup frees a slot', () => {
  const { w, units } = setup(3)
  w.buildingOrders.records = Array.from({ length: 800 }, (_, i) => ({ ...emptyPersonOrder(), ...(i ? { model: 3, references: 1, a: 4096, b: 4096 } : {}) }))
  w.buildingOrders.cursor = 1; w.buildingOrders.active = 799
  units.forEach((u, i) => { u.native.state = 10; u.native.commandStatus = 3; u.native.commands[0] = i + 1 })
  w.selected.reverse()
  guardShaman(w)
  assert.deepEqual(units.map(u => u.native.commands[0]), [0, 1, 1])
  assert.equal(w.buildingOrders.records[0].references, 1)
  assert.equal(w.buildingOrders.records[1].references, 2)
  assert.equal(w.buildingOrders.active, 798)
})

test('target entering a vehicle with inside still null completes the saved guard order', () => {
  const { w, shaman, u, p } = setup()
  guardShaman(w); tick(w, 1 / 12)
  const boat = createWorld(5).vehicles[0]
  boat.id = w.nextId++; boat.active = true
  w.vehicles.push(boat)
  assert.ok(boardLiveVehicle(w, shaman.native, boat))
  assert.equal(shaman.native.vehicle, boat.id)
  assert.equal(shaman.inside, null)
  tick(w, 1 / 12)
  assert.equal(order(w, u), undefined)
  assert.equal(w.manaTribes[0].shamanGuards, 0)
  assert.ok([17, 19].includes(p.state))
})

test('ordinary Shaman Tower entry retains Guard and resolves its building outside point', () => {
  const { w, shaman, u, p } = setup()
  const tower = addBuilding(w, 'blue', 'tower', { x: 8, z: 8 }, true)
  guardShaman(w); tick(w, 1 / 12)
  setSelection(w, [shaman.id])
  assert.equal(command(w, tower), true)
  for (let turns = 0; turns < 240 && shaman.inside === null; turns++) tick(w, 1 / 12)
  assert.equal(shaman.inside, tower.id, 'public command and real entry controller reach occupancy')
  assert.equal((shaman.native ?? shaman.entry.person).vehicle, 0)
  assert.equal(order(w, u)?.model, 30, 'building containment is not target loss')
  assert.equal(w.manaTribes[0].shamanGuards, 1)
  setSelection(w, [u.id]); guardShaman(w); tick(w, 1 / 12)
  const outside = buildingOutsidePoint(buildingPose(tower))
  assert.deepEqual([p.goalX, p.goalY], [outside.x & 65535, outside.y & 65535])
  setSelection(w, [shaman.id]); guardShaman(w)
  assert.deepEqual([p.anchorX, p.anchorY], [(outside.x & 0xfe00) + 256, (outside.y & 0xfe00) + 256])
  assert.equal(order(w, u), undefined)
  assert.equal(w.manaTribes[0].shamanGuards, 0)
})

for (const c of vectors.lifecycle.filter(c => c.label.startsWith('G-retain-deselect-'))) test(`actual deferred G setters match native phase vector ${c.label}`, () => {
  const { w, u, p } = setup()
  p.f1 = c.fixture.f1; p.f2 = c.fixture.f2
  const before = phase(p)
  guardShaman(w)
  assert.deepEqual(phase(p), before)
  animateLiveObjects(w, 'presentation')
  assert.deepEqual(phase(p), before, 'pending native owner does not acquire a fallback presentation visit')
  tick(w, 1 / 12)
  const expected = c.steps.find(s => s.label === 'first guard dispatch').after
  assert.deepEqual([p.object, p.draw, p.f1, p.f2, p.state, p.commandStatus], [expected.source, expected.draw, expected.f1, expected.f2, expected.state, expected.status])
  assert.equal(unitAnimationSource(u), p)
  const adopted = phase(p)
  setSelection(w, [])
  assert.deepEqual(phase(p), adopted, 'deselection does not run a setter')
  assert.equal(unitAnimationSource(u), p)
})

test('protected preparation and passenger early-return retain pending ownership until actual adoption', () => {
  const { w, u, p } = setup()
  guardShaman(w); tick(w, 1 / 12); guardShaman(w)
  p.flags2 |= 0x100000
  const before = phase(p)
  tick(w, 1 / 12)
  assert.ok(p.flags2 & 16)
  assert.equal(p.commandStatus, 0)
  assert.equal(p.guardInputPending, true)
  assert.equal(unitAnimationSource(u), p)
  assert.deepEqual(phase(p), before)
  assert.equal(w.manaTribes[0].shamanGuards, 0)
  p.flags2 &= ~0x100000
  // The passenger branch returns before preparation; no fabricated vehicle is
  // inserted into the world or used to claim ordinary boarding gameplay.
  p.vehicle = 999
  stepLiveMovement(w, u)
  assert.ok(p.flags2 & 16)
  assert.equal(p.guardInputPending, true)
  p.vehicle = 0
  tick(w, 1 / 12)
  assert.equal(p.commandStatus, 30)
  assert.equal(p.guardInputPending, undefined)
  assert.equal(w.manaTribes[0].shamanGuards, 1)
})

test('protected cancelled state10 retains ownership until its empty-queue transition really occurs', () => {
  const { w, u, p } = setup()
  guardShaman(w); tick(w, 1 / 12); setSelection(w, []); guardShaman(w)
  p.flags2 |= 0x100000
  const before = phase(p)
  tick(w, 1 / 12)
  assert.equal(p.state, 10)
  assert.equal(p.commandStatus, 0)
  assert.equal(p.guardInputPending, true)
  assert.equal(unitAnimationSource(u), p)
  assert.deepEqual(phase(p), before)
  p.flags2 &= ~0x100000
  tick(w, 1 / 12)
  assert.ok([17, 19].includes(p.state))
  assert.equal(p.guardInputPending, undefined)
  assert.equal(unitAnimationSource(u), p)
})

for (const loss of ['death', 'class0', 'vehicle', 'cancel']) test(`${loss} anchors to the saved Shaman in another cell before cleanup`, () => {
  const { w, shaman, u, p } = setup()
  guardShaman(w); tick(w, 1 / 12)
  const target = shaman.native
  target.x = (p.x + 4096) & 65535; target.y = p.y
  const expected = [(target.x & 0xfe00) + 256, (target.y & 0xfe00) + 256]
  assert.notEqual(expected[0], (p.x & 0xfe00) + 256)
  if (loss === 'cancel') { setSelection(w, []); guardShaman(w) }
  else {
    if (loss === 'death') target.flags2 |= 1
    if (loss === 'class0') target.class = 0
    if (loss === 'vehicle') target.vehicle = 999
    stepLiveMovement(w, u)
  }
  assert.deepEqual([p.anchorX, p.anchorY], expected)
  assert.equal(order(w, u), undefined)
})

test('saved Shaman identity does not retarget when the current Shaman is replaced', () => {
  const { w, shaman, u, p } = setup()
  guardShaman(w); tick(w, 1 / 12)
  const target = p.target
  shaman.hp = 0
  const next = addUnit(w, 'blue', 'shaman', { x: 0, z: 8 })
  assert.equal(order(w, u).a, target)
  tick(w, 1 / 12)
  assert.equal(order(w, u), undefined)
  assert.equal(p.target, target)
  guardShaman(w)
  assert.equal(order(w, u).a, next.id)
})

test('legacy boolean checkpoints retain their old targetless history until supported fresh input', () => {
  const { w, u, p } = setup()
  p.state = 10; p.commandStatus = 0; u.guard = true
  const restored = migrateCheckpoint(structuredClone(w)), copy = restored.units.find(a => a.id === u.id)
  assert.equal(copy.guard, true)
  assert.equal(copy.native.guardInputPending, undefined)
  assert.equal(order(restored, copy), undefined)
  setSelection(restored, []); guardShaman(restored)
  assert.equal(copy.guard, true, 'empty selection does not invent a legacy native cancellation')
  setSelection(restored, [copy.id]); guardShaman(restored)
  assert.equal(copy.guard, false, 'unsupported legacy state10 keeps its existing toggle')
  assert.equal(order(restored, copy), undefined)
  // A later ordinary native idle owner may accept fresh G without recovering
  // an invented old target, order reference or animation phase.
  tick(restored, 1 / 12); guardShaman(restored)
  assert.equal(order(restored, copy)?.model, 30)
})

const busy = {
  flight: u => { u.flight = u.native; u.native = null; u.lift = 3 },
  fight: u => { u.fight = { action: 'ready', group: 0, motion: u.native } },
  entry: (u, w) => { u.entry = { person: u.native, orders: w.buildingOrders }; u.native = null },
  builder: u => { u.builder = { task: BuilderTask.Work, busy: 0, phase: 0, restart: false, person: u.native } },
  passenger: u => { u.native.vehicle = 999 },
  work: u => { u.work = 123 },
  gather: u => { u.tree = 123 },
  delivery: u => { u.delivery = { target: 123 } },
  casting: u => { u.casting = { spell: 'lightning', point: { x: 0, z: 8 }, remaining: 1 } },
  legacy: u => { u.native = null },
  'legacy path': u => { u.path = [{ x: 24, z: 8 }] },
  'different route owner': (u, w) => { w.pathfinding.people.set(u.id, createLivePerson(w, u)) },
}
function legacyGuard(w) {
  for (const u of w.units.filter(u => canOrder(u) && w.selected.includes(u.id) && u.kind !== 'shaman')) {
    const guard = !u.guard; release(w, u); u.guard = guard
  }
  w.message = 'Selected followers will guard your shaman.'; w.messageUntil = w.time + 9
}
for (const [name, makeBusy] of Object.entries(busy)) for (const mixed of [false, true]) test(`${name} ${mixed ? 'mixed' : 'single'} selection retains the entire legacy G operation`, () => {
  const { w, units } = setup(mixed ? 2 : 1)
  makeBusy(units[0], w)
  const expected = structuredClone(w)
  legacyGuard(expected); guardShaman(w)
  assert.deepEqual(w, expected)
  assert.ok(units.every(u => !(u.native?.guardInputPending)))
})

test('native Brave guards do not fall into legacy automatic housing while near the Shaman', () => {
  const { w, shaman } = setup()
  const brave = addUnit(w, 'blue', 'brave', { x: 2, z: 8 })
  for (let i = 0; i < 40; i++) tick(w, 1 / 12)
  addBuilding(w, 'blue', 'hut', { x: 4, z: 10 }, true)
  setSelection(w, [brave.id]); guardShaman(w)
  for (let i = 0; i < 160; i++) tick(w, 1 / 12)
  assert.equal(order(w, brave)?.model, 30)
  assert.equal(order(w, brave)?.a, shaman.id)
  assert.equal(brave.work, null)
  assert.equal(brave.inside, null)
})

test('G replacement/cancellation have identical turn ownership at ordinary and irregular refresh schedules', () => {
  const initial = setup().w
  const run = schedule => {
    const w = structuredClone(initial), u = w.units.find(a => a.kind === 'firewarrior'), p = u.native
    const clock = { animationTime: 0, animationFrame: 0 }, history = []
    const advance = seconds => {
      let time = 0, i = 0
      while (time < seconds - 1e-9) { const dt = Math.min(schedule[i++ % schedule.length], seconds - time); advanceGame(w, clock, dt); time += dt }
      history.push([w.turn, p.state, p.commandStatus, ...phase(p), w.manaTribes[0].shamanGuards])
    }
    guardShaman(w); advance(1 / 12)
    guardShaman(w); advance(1 / 12)
    setSelection(w, []); guardShaman(w); advance(1 / 12)
    advance(1)
    return { history, phase: phase(p), orders: w.buildingOrders, person: p }
  }
  const expected = run([1 / 60])
  for (const schedule of [[1 / 30], [1 / 120], [1 / 144], [.007, .021, .04]]) assert.deepEqual(run(schedule), expected)
})
