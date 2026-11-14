import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  addBuilding,
  addUnit,
  command,
  createWorld,
  scatterSelected,
  supportsFollower,
  tick,
} from '../app/model.ts'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { currentPersonOrder } from '../app/person-orders.ts'
import { setSelection } from '../app/selection-runtime.ts'
import { boardLiveVehicle } from '../app/live-vehicles.ts'
import { nativeScatterEligible, stepPersonScatter } from '../app/person-scatter.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Independent copy of the native LCG at 0x89d178 (x * 0x24a1 + 0x24df, ror 13).
const draw = rng => {
  const n = (Math.imul(rng.s, 0x24a1) + 0x24df) >>> 0
  return (rng.s = ((n >>> 13) | (n << 19)) >>> 0)
}
// 0x4e3070: base word + draw % max(base >> 2, 1), doubled by bloodlust (+0x16 bit 3).
const speed = (rng, physics, bloodlust = false) => {
  const base = (rules.personSpeeds[physics] << 16) >> 16
  const value = (((base + (draw(rng) % ((base >> 2) || 1))) << 16) >> 16)
  return bloodlust ? ((value * 2) << 16) >> 16 : value
}

function person(overrides = {}) {
  return {
    model: 4, physics: 15, state: 43, substate: 0, timer: 0, speed: 0, flags2: 0, flags3: 0,
    turnAngle: 0, commandStatus: 0, x: 0x1234, y: 0x5678, h: 0, anchorX: 0, anchorY: 0,
    anchorFlags: 3, selectionFlags: 128, vehicle: 0, ...overrides,
  }
}
const effects = log => ({
  release: () => log.push('release'),
  setAnimation: object => log.push(['animation', object]),
  outside: point => point,
})

test('0x441c62 admission is exactly selection, no vehicle/building, not 25/29 and not protected', () => {
  assert.equal(nativeScatterEligible(person({ state: 10 })), true)
  assert.equal(nativeScatterEligible(person({ state: 43 })), true, 'repeat D re-enters state 43')
  assert.equal(nativeScatterEligible(person({ state: 22, model: 7 })), true, 'no model/state whitelist')
  for (const [field, value] of [
    ['selectionFlags', 0], ['vehicle', 7], ['flags2', 0x800000], ['state', 25], ['state', 29],
    ['flags2', 0x100000],
  ])
    assert.equal(nativeScatterEligible(person({ [field]: value })), false, `${field}=${value}`)
})

test('0x4e2fe0 first visit draws heading before speed and runs twelve visits', () => {
  const rng = { randomState: 0x1234567 }, expected = { s: rng.randomState }
  const heading = draw(expected) & 2047, run = speed(expected, 15)
  const p = person(), log = []
  assert.equal(stepPersonScatter(rng, p, 0, effects(log)), 0)
  assert.equal(rng.randomState, expected.s, 'exactly two draws on the first visit')
  assert.equal(p.turnAngle, heading)
  assert.equal(p.speed, run)
  assert.equal(p.substate, 1)
  assert.equal(p.timer, 11)
  assert.equal(p.flags2, 0x200000 | 0x1080)
  assert.deepEqual(log, ['release', ['animation', rules.personAnimationObjects[25 * 9 + 4]]])
  for (let visit = 2; visit < 12; visit++) {
    assert.equal(stepPersonScatter(rng, p, 0, effects(log)), 0, `visit ${visit}`)
  }
  assert.equal(rng.randomState, expected.s, 'later visits draw nothing')
  assert.equal(log.length, 2)
  assert.equal(stepPersonScatter(rng, p, 0, effects(log)), rules.personModels[4].nextState)
  assert.deepEqual([p.anchorX, p.anchorY, p.anchorFlags], [0x1300, 0x5700, 0])
})

test('bloodlust doubles the drawn speed; Shaman returns to 39 only under game flag 2', () => {
  const rng = { randomState: 99 }, expected = { s: 99 }
  draw(expected)
  const shaman = person({ model: 7, physics: 18, flags3: 0x80000 })
  stepPersonScatter(rng, shaman, 2, effects([]))
  assert.equal(shaman.speed, speed(expected, 18, true))
  shaman.timer = 1
  assert.equal(stepPersonScatter(rng, shaman, 2, effects([])), 39)
  shaman.timer = 1
  assert.equal(stepPersonScatter(rng, shaman, 0, effects([])), 10)
})

test('obstacle recovery ends early; a command status keeps the old anchor', () => {
  const p = person({ substate: 1, timer: 9, flags2: 0x800, commandStatus: 3, anchorX: 7, anchorY: 9 })
  assert.equal(stepPersonScatter({ randomState: 1 }, p, 0, effects([])), 10)
  assert.equal(p.timer, 8)
  assert.deepEqual([p.anchorX, p.anchorY, p.anchorFlags], [7, 9, 3])
  const building = person({ substate: 1, timer: 1 })
  stepPersonScatter({ randomState: 1 }, building, 0, {
    ...effects([]), outside: () => ({ x: 0x2a00, y: 0x3b80, h: 0 }),
  })
  assert.deepEqual([building.anchorX, building.anchorY], [0x2b00, 0x3b00])
})

function setup(kinds = ['firewarrior', 'firewarrior', 'firewarrior']) {
  const w = createStartedWorld(1)
  retainFixtureUnits(w, () => false)
  w.buildings = []; w.trees = []; w.shrines = []
  w.terrain.fill(3); w.terrainVersion++; w.manaWorld.gameFlags = 32
  const shaman = addUnit(w, 'blue', 'shaman', { x: 0, z: 8 })
  const units = kinds.map((kind, i) => addUnit(w, 'blue', kind, { x: 2 + i, z: 8 }))
  for (let i = 0; i < 40; i++) tick(w, 1 / 12)
  // Level 1's scripted flyby lock (opcode 1206) also blocks the page keyboard.
  w.inputMask = 0
  return { w, shaman, units }
}

test('D scatters selected people only, in roster order, keeping selection', () => {
  const { w, units } = setup(['brave', 'firewarrior', 'warrior'])
  const chosen = [units[2], units[0]]
  setSelection(w, chosen.map(u => u.id)); const selection = [...w.selected]
  const before = units.map(u => ({ state: u.native?.state, x: u.x, z: u.z }))
  const rng = { s: w.randomState }
  // Roster order: units[0] then units[2]; one generic 0x4d2740 speed draw each.
  const firstSpeed = speed(rng, units[0].native.physics), secondSpeed = speed(rng, units[2].native.physics)
  assert.equal(scatterSelected(w), 2)
  assert.equal(w.randomState, rng.s)
  assert.deepEqual([units[0].native.speed, units[2].native.speed], [firstSpeed, secondSpeed])
  for (const u of chosen) {
    assert.equal(u.native.state, 43)
    assert.equal(u.native.substate, 0)
    assert.equal(u.native.selectionFlags & 128, 128)
  }
  assert.equal(units[0].native.previousState, before[0].state)
  assert.equal(units[1].native?.state, before[1].state, 'unselected follower unchanged')
  assert.deepEqual(w.selected, selection, 'selection retained')
  tick(w, 1 / 12)
  for (const u of chosen) {
    assert.equal(u.native.state, 43)
    assert.equal(u.native.substate, 1)
    const [start, draw] = rules.animationObjects[rules.personAnimationObjects[25 * 9 + u.native.model]]
    assert.deepEqual([u.native.object, u.native.draw], [start, draw], 'run animation row 25')
  }
  for (let i = 0; i < 11; i++) tick(w, 1 / 12)
  for (const [index, u] of units.entries()) {
    if (!chosen.includes(u)) continue
    assert.notEqual(u.native.state, 43, 'twelve visits end the state')
    assert.ok(Math.hypot(u.x - before[index].x, u.z - before[index].z) > 0.5, 'person moved away')
  }
  assert.deepEqual(w.selected, selection)
  for (let i = 0; i < 60; i++) tick(w, 1 / 12)
  assert.ok(chosen.every(u => u.hp > 0 && [10, 17, 19].includes(u.native?.state ?? 10)))
})

test('mixed groups include the Shaman and Braves; empty or unselected input is inert', () => {
  const { w, shaman, units } = setup(['brave', 'warrior', 'spy'])
  setSelection(w, [])
  const rng = w.randomState
  assert.equal(scatterSelected(w), 0)
  assert.equal(w.randomState, rng)
  setSelection(w, [shaman.id, ...units.map(u => u.id)])
  assert.equal(scatterSelected(w), 4)
  assert.ok([shaman, ...units].every(u => u.native.state === 43))
  for (let i = 0; i < 12; i++) tick(w, 1 / 12)
  assert.ok([shaman, ...units].every(u => u.native?.state !== 43))
  assert.equal(shaman.hp > 0, true)
})

test('scatter keeps a queued move order, then resumes it through state 10', () => {
  const { w, units } = setup(['warrior'])
  const [u] = units
  setSelection(w, [u.id])
  assert.equal(command(w, { x: -20, y: 0, z: 8 }), true)
  tick(w, 1 / 12)
  const order = currentPersonOrder(w.buildingOrders, u.native), anchor = [u.native.anchorX, u.native.anchorY]
  assert.equal(order?.model, 3)
  assert.equal(scatterSelected(w), 1)
  assert.equal(currentPersonOrder(w.buildingOrders, u.native), order, 'queue untouched')
  for (let i = 0; i < 12; i++) tick(w, 1 / 12)
  assert.equal(u.native.state, 10)
  assert.equal(currentPersonOrder(w.buildingOrders, u.native), order, 'order resumes')
  assert.deepEqual([u.native.anchorX, u.native.anchorY], anchor, 'command status keeps anchor')
  for (let i = 0; i < 200 && currentPersonOrder(w.buildingOrders, u.native); i++) tick(w, 1 / 12)
  assert.ok(Math.abs(u.x - -20) < 2, 'the move order still completes')
})

test('a new order during scatter replaces it immediately', () => {
  const { w, units } = setup(['warrior'])
  const [u] = units
  setSelection(w, [u.id])
  scatterSelected(w); tick(w, 1 / 12)
  assert.equal(u.native.state, 43)
  assert.equal(command(w, { x: 10, y: 0, z: 8 }), true)
  assert.equal(u.native.state, 10)
  assert.equal(currentPersonOrder(w.buildingOrders, u.native)?.model, 3)
})

test('paused, masked, finished and stale-selection inputs do not scatter', () => {
  for (const block of ['paused', 'mask', 'status', 'land']) {
    const { w, units } = setup(['warrior'])
    setSelection(w, [units[0].id])
    if (block === 'paused') w.paused = true
    else if (block === 'mask') w.inputMask = 1
    else if (block === 'status') w.status = 'lost'
    else w.land.landFlags |= 2
    const before = structuredClone(units[0].native), rng = w.randomState
    assert.equal(scatterSelected(w), 0, block)
    assert.deepEqual(units[0].native, before)
    assert.equal(w.randomState, rng)
  }
  const { w, units } = setup(['warrior'])
  setSelection(w, [units[0].id + 1000])
  assert.equal(scatterSelected(w), 0, 'missing selected id is ignored')
})

test('vehicle passengers and building occupants are not scattered', () => {
  const { w, units } = setup(['brave', 'warrior'])
  const boat = createWorld(5).vehicles[0]
  boat.id = w.nextId++; boat.active = true
  w.vehicles.push(boat)
  assert.ok(boardLiveVehicle(w, units[1].native, boat))
  const tower = addBuilding(w, 'blue', 'tower', { x: 8, z: 8 }, true)
  setSelection(w, [units[0].id])
  assert.equal(command(w, tower), true)
  for (let turns = 0; turns < 240 && units[0].inside === null; turns++) tick(w, 1 / 12)
  assert.equal(units[0].inside, tower.id)
  setSelection(w, units.map(u => u.id))
  assert.equal(scatterSelected(w), 0)
  assert.notEqual(units[1].native.state, 43)
})

test('coast is invalid terrain: ground recovery ends scatter early without entering water', () => {
  const w = createStartedWorld(1)
  retainFixtureUnits(w, () => false)
  w.buildings = []; w.trees = []; w.shrines = []
  const n = Math.sqrt(w.terrain.length)
  w.terrain.fill(0)
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++)
    if (Math.abs(x - n / 2 - 2) < 1.6 && Math.abs(z - n / 2 - 8) < 1.6) w.terrain[z * n + x] = 3
  w.terrainVersion++; w.manaWorld.gameFlags = 32
  const units = [0, 1, 2, 3].map(i => addUnit(w, 'blue', 'warrior', { x: 1.5 + i * 0.3, z: 8 }))
  for (let i = 0; i < 40; i++) tick(w, 1 / 12)
  w.inputMask = 0
  setSelection(w, units.map(u => u.id))
  assert.equal(scatterSelected(w), 4)
  let early = 0
  for (let turn = 1; turn <= 12; turn++) {
    tick(w, 1 / 12)
    if (turn < 12) early += units.filter(u => u.native.state !== 43 && u.native.previousState === 43).length
    assert.ok(units.every(u => u.hp > 0 && supportsFollower(w, u)), `turn ${turn}`)
  }
  assert.ok(early > 0, 'at least one shore contact ended before the twelfth visit')
  assert.ok(units.every(u => u.native.state !== 43))
})

test('repeat D restarts the scatter controller for the same people', () => {
  const { w, units } = setup(['warrior'])
  const [u] = units
  setSelection(w, [u.id]); scatterSelected(w)
  for (let i = 0; i < 5; i++) tick(w, 1 / 12)
  assert.equal(u.native.substate, 1)
  assert.equal(scatterSelected(w), 1)
  assert.deepEqual([u.native.state, u.native.previousState, u.native.substate], [43, 43, 0])
})

test('checkpoint clone mid-scatter continues identically', () => {
  const { w, units } = setup(['warrior', 'firewarrior'])
  setSelection(w, units.map(u => u.id)); scatterSelected(w)
  for (let i = 0; i < 4; i++) tick(w, 1 / 12)
  const copy = structuredClone(w)
  for (let i = 0; i < 12; i++) { tick(w, 1 / 12); tick(copy, 1 / 12) }
  const view = world => world.units.map(u => [u.id, u.x, u.z, u.native?.state, u.native?.anchorX])
  assert.deepEqual(view(copy), view(w))
  assert.equal(copy.randomState, w.randomState)
})

test('D is a scatter key, not a camera alias, and help states the policy', () => {
  const scene = readFileSync(new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8')
  const keys = scene.slice(scene.indexOf('const cameraKeys'), scene.indexOf('}', scene.indexOf('const cameraKeys')))
  assert.doesNotMatch(keys, /^\s*d:/m)
  assert.match(keys, /numpad6: 200/)
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /<span>D<\/span>\s*<strong>Scatter selected followers/)
  assert.doesNotMatch(page, /WASD/)
  const handler = page.slice(page.indexOf("e.key.toLowerCase() === 'd'"), page.indexOf('scatterSelected(world)'))
  for (const gate of ['!e.repeat', '!e.shiftKey', '!selectorOpen', 'store.getWorld() === world'])
    assert.ok(handler.includes(gate), gate)
})
