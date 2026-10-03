import assert from 'node:assert/strict'
import test from 'node:test'
import { createComputerQueue } from '../app/computer.ts'
import { requestConvertTask, findConvertTarget, standableConvertTarget } from '../app/computer-convert.ts'
import { spiralCell } from '../app/native-math.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import { createWorld } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { campaignCommand } from '../app/campaign-command-runtime.ts'
import { returnLivePerson } from '../app/live-movement.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { nativeSpellRange, spellCaster } from '../app/spell-casting.ts'
import { browserPosition } from '../app/world-coordinates.ts'

// Controlled cases pair with check-native-mission3-convert-target.py; these are
// helper boundaries, separate from the natural mission journey below.
test('Convert Wild allocation gates state and duplicates without cancelling existing work', () => {
  const ai = createComputerQueue()
  assert.equal(requestConvertTask(ai, 4, 0), false)
  assert.equal(requestConvertTask(ai, 0, 1), false)
  assert.equal(requestConvertTask(ai, 4, 1), true)
  assert.deepEqual([ai.tasks[0].type, ai.tasks[0].phase, ai.tasks[0].flags], [2, 0, 1])
  ai.tasks[0].phase = 6
  assert.equal(requestConvertTask(ai, 0, 1), false)
  assert.equal(requestConvertTask(ai, 4, 1), false)
  assert.equal(ai.tasks[0].phase, 6)
  const full = createComputerQueue()
  for (const task of full.tasks) Object.assign(task, { flags: 1, type: 0 })
  assert.equal(requestConvertTask(full, 4, 1), false)
})

test('Convert Wild target retains density, wrap, tie, inclusive radius and list-centroid rules', () => {
  const cases = [
    [0x1010, {}, [], 0, 200, null],
    [0x1010, { 0: 3 }, [], 0, 200, null],
    [0x1010, { 0: 3 }, [[3, 5], [10, 12], [20, 22]], 0, 200, 0x0c0a],
    [0x1010, { 0: 1, 3: 2 }, [[3, 5], [100, 10], [110, 20]], 0, 200, 0x0f69],
    [0x1010, { 1: 1, 3: 1 }, [[40, 12], [100, 10]], 0, 200, 0x0c28],
    [0x1030, { 0: 1, 2: 1 }, [[10, 10], [70, 10]], 0, 200, 0x0a0a],
    [0x1000, { 0: 1, 7: 1 }, [[10, 10], [240, 10]], 0, 200, 0x0a0a],
    [0x1000, { 1: 1, 7: 1 }, [[40, 10], [240, 10]], 0, 200, 0x0af0],
    [0x1010, { 1: 1 }, [[40, 12]], 0, 32, 0x0c28],
    [0x1010, { 1: 1 }, [[40, 12]], 0, 31, null],
    [0x1010, { 1: 1 }, [[40, 12]], 32, 200, 0x0c28],
    [0x1010, { 1: 1 }, [[40, 12]], 33, 200, null],
    [0x7324, { 0: 1 }, [[10, 10]], 0, 100, null],
    [0x7324, { 0: 1 }, [[10, 10]], 101, 101, 0x0a0a],
  ]
  for (const [origin, sparse, people, minimum, maximum, expected] of cases) {
    const counts = Uint8Array.from({ length: 64 }, (_, i) => sparse[i] ?? 0)
    assert.equal(findConvertTarget(origin, counts, people.map(([x, y]) => ({ x: (x << 8) | 127, y: (y << 8) | 201 })), minimum, maximum), expected)
  }
})

test('Convert Wild standability preserves initial target and tries only the first24 spiral positions', () => {
  const category = rules.terrainCategoryFlags.findIndex(flags => flags & 1)
  const land = { flags: new Uint16Array(16384), categories: new Uint8Array(16384).fill(category), walkMasks: [new Uint8Array(8192).fill(255)] }
  const index = cell => ((cell >>> 9) * 128) + ((cell & 255) >>> 1)
  for (const target of [0x52dc, 0xffff]) {
    land.flags.fill(0)
    assert.equal(standableConvertTarget(target, land), target)
    land.flags.fill(4)
    const last = spiralCell(target, 23, 0)
    land.flags[index(last)] = 0
    assert.equal(standableConvertTarget(target, land), last)
    land.flags.fill(4)
    land.flags[index(spiralCell(target, 24, 0))] = 0
    assert.equal(standableConvertTarget(target, land), null)
  }
})

test('Mission3 active type2 advances after allocation state is switched off', () => {
  const world = createWorld(3)
  for (const task of world.ai.tasks) task.flags = 0
  assert.equal(requestConvertTask(world.ai, 4, 1), true)
  world.ai.tasks[0].phase = 6
  campaignCommand(world, 1030, [1023])
  assert.equal(world.ai.states & 4, 0)
  world.ai.cursor = 0
  world.turn = 1
  const seed = world.randomState
  stepComputerTasks(world, 2)
  assert.equal(world.ai.tasks[0].phase, 7)
  assert.ok(world.ai.tasks[0].flags & 1)
  assert.equal(typeof seed, 'number')
  assert.equal(world.randomState, seed)
})

test('type2 timeout clears motion before a blocked state transition and then frees the task', () => {
  const world = createWorld(3)
  for (const task of world.ai.tasks) task.flags = 0
  assert.equal(requestConvertTask(world.ai, 4, 1), true)
  const task = world.ai.tasks[0]
  Object.assign(task, { phase: 8, elapsed: 600, target: 0x52dc })
  const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  const person = shaman.native ??= createLivePerson(world, shaman)
  person.flags2 |= 0x100000
  person.motionTimer = 7
  person.motionMode = 3
  const state = person.state, seed = world.randomState
  world.ai.cursor = 0
  world.turn = 1
  stepComputerTasks(world, 2)
  assert.equal(task.phase, 3)
  assert.equal(task.elapsed, 601)
  assert.equal(person.state, state)
  assert.equal(person.motionTimer, 0)
  assert.equal(person.motionMode, 0)
  assert.equal(person.anchorX, (person.x & 0xfe00) + 256)
  assert.equal(person.anchorY, (person.y & 0xfe00) + 256)
  assert.equal(person.anchorFlags, 0)
  assert.equal(world.randomState, seed)
  stepComputerTasks(world, 2)
  assert.equal(task.flags & 1, 0)
})

test('type2 reads the active fight person even when its attack animation has no presentation source', () => {
  const world = createWorld(3)
  for (const task of world.ai.tasks) task.flags = 0
  assert.equal(requestConvertTask(world.ai, 4, 1), true)
  world.ai.tasks[0].phase = 6
  const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  const person = createLivePerson(world, shaman)
  person.state = 25
  person.computerAssignment = 99
  shaman.native = null
  // Controlled adapter fixture: combat-runtime transfers the real person to
  // fight.motion and clears native; attack animation is intentionally not idle.
  shaman.fight = { group: 999, opponent: 1, action: 'attack', animation: 'attack', motion: person }
  world.ai.cursor = 0
  world.turn = 1
  stepComputerTasks(world, 2)
  assert.equal(world.ai.tasks[0].flags & 1, 0)
  assert.equal(shaman.fight.motion, person)
  assert.equal(person.computerAssignment, 99)
})

test('Convert Wild region lookup normalizes signed browser-native positions to unsigned words', () => {
  const counts = new Uint8Array(64)
  counts[7] = 1
  assert.equal(findConvertTarget(0x10f0, counts, [{ x: -3969, y: 2761 }], 0, 40), 0x0af0)
})

test('type2 casting preserves the real person flags2 readiness gate', () => {
  const world = createWorld(3)
  for (const task of world.ai.tasks) task.flags = 0
  assert.equal(requestConvertTask(world.ai, 4, 1), true)
  const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  const person = createLivePerson(world, shaman)
  person.state = 17
  person.flags2 |= 2
  shaman.native = person
  // Controlled density/readiness inputs, corresponding to native phase8 probes.
  for (const wild of world.units.filter(u => u.team === 'wild').slice(0, 8)) {
    wild.x = shaman.x
    wild.z = shaman.z
  }
  Object.assign(world.ai.tasks[0], { phase: 8, elapsed: 0, target: ((person.x >>> 8) & 254) | (person.y & 0xfe00) })
  world.manaTribes[2].mana = rules.spellCharging[17].cost
  world.castingTribes[2].flags &= ~0x80000
  world.castingTribes[2].cooldown = 0
  world.castingTribes[2].aiCooldown = 0
  world.ai.flags &= ~0x40000
  world.ai.cursor = 0
  world.turn = 1
  stepComputerTasks(world, 2)
  assert.equal(world.spellCasts[2][17], 0)
  assert.equal(world.ai.tasks[0].phase, 8)
})

// Native0043b2a0 receives the actual person pointer, independent of its adapter owner.
test('explicit flight person receives the allocation-safe return order without restarting its state', () => {
  const world = createWorld(3)
  const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  const person = createLivePerson(world, shaman)
  person.state = 26
  shaman.native = null
  shaman.flight = person
  const seed = world.randomState
  assert.equal(returnLivePerson(world, shaman, { x: person.x, y: person.y }, person), true)
  assert.equal(currentPersonOrder(world.buildingOrders, person)?.model, 3)
  assert.equal(person.state, 26)
  assert.ok(person.flags2 & 16)
  assert.equal(shaman.flight, person)
  assert.equal(world.randomState, seed)
})

test('explicit flight return preserves the complete world on order allocation exhaustion', () => {
  const world = createWorld(3)
  const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  const person = createLivePerson(world, shaman)
  person.state = 26
  shaman.native = null
  shaman.flight = person
  person.commands[0] = 1
  Object.assign(world.buildingOrders.records[1], { model: 3, a: 0x1200, b: 0x3400, references: 1 })
  for (const order of world.buildingOrders.records) order.references = 1
  const before = structuredClone(world)
  assert.equal(returnLivePerson(world, shaman, { x: person.x, y: person.y }, person), false)
  assert.deepEqual(world, before)
})

test('cast-ready flight-owned Shaman receives the type2 post-cast return on the same person', () => {
  const world = createWorld(3)
  for (const task of world.ai.tasks) task.flags = 0
  requestConvertTask(world.ai, 4, 1)
  const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  const person = createLivePerson(world, shaman)
  person.state = 26
  person.flags2 = 0
  person.flags4 = 0
  shaman.native = null
  shaman.flight = person
  const other = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const otherPerson = other.native ??= createLivePerson(world, other)
  const otherBefore = structuredClone(otherPerson)
  for (const wild of world.units.filter(u => u.team === 'wild').slice(0, 8)) {
    wild.x = shaman.x
    wild.z = shaman.z
  }
  Object.assign(world.ai.tasks[0], { phase: 8, elapsed: 0, target: ((person.x >>> 8) & 254) | (person.y & 0xfe00) })
  world.manaTribes[2].mana = rules.spellCharging[17].cost
  world.castingTribes[2].flags &= ~0x80000
  world.castingTribes[2].cooldown = 0
  world.castingTribes[2].aiCooldown = 0
  world.ai.flags &= ~0x40000
  world.ai.cursor = 0
  world.turn = 1
  stepComputerTasks(world, 2)
  assert.equal(world.spellCasts[2][17], 1)
  assert.equal(world.ai.tasks[0].phase, 3)
  assert.equal(currentPersonOrder(world.buildingOrders, person)?.model, 3)
  assert.equal(shaman.flight, person)
  assert.equal(shaman.native, person)
  assert.equal(person.state, 26)
  assert.equal(other.native, otherPerson)
  assert.deepEqual(otherPerson, otherBefore)
})

test('type2 range reads actual signed person height rather than terrain beneath it', t => {
  const world = createWorld(3)
  for (const task of world.ai.tasks) task.flags = 0
  requestConvertTask(world.ai, 4, 1)
  const shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  const person = createLivePerson(world, shaman)
  Object.assign(person, { state: 17, flags2: 0, flags4: 0 })
  shaman.native = person
  world.manaWorld.gameFlags &= ~32
  world.castingTribes[2].flags &= ~0x80000
  world.castingTribes[2].cooldown = 0
  world.castingTribes[2].aiCooldown = 0
  world.ai.flags &= ~0x40000
  const caster = spellCaster(world, shaman)
  const terrainRange = Math.trunc(nativeSpellRange(world.manaWorld.gameFlags, world.castingTribes[2].flags, caster, 17) / 512)
  person.h = terrainRange < 24 ? 896 : -128
  const personRange = Math.trunc(nativeSpellRange(world.manaWorld.gameFlags, world.castingTribes[2].flags, { ...caster, height: person.h }, 17) / 512)
  assert.notEqual(personRange, terrainRange)
  t.diagnostic(JSON.stringify({ terrainHeight: caster.height, personHeight: person.h, terrainRange, personRange }))
  const distance = Math.min(personRange, terrainRange) + 1
  const target = ((((person.x >>> 8) & 254) + distance * 2) & 255) | (person.y & 0xfe00)
  const point = browserPosition({ x: (target & 255) << 8, y: target & 0xff00 })
  for (const wild of world.units.filter(u => u.team === 'wild').slice(0, 8)) Object.assign(wild, point)
  Object.assign(world.ai.tasks[0], { phase: 8, elapsed: 0, target })
  world.manaTribes[2].mana = rules.spellCharging[17].cost
  world.ai.cursor = 0
  world.turn = 1
  stepComputerTasks(world, 2)
  assert.equal(world.spellCasts[2][17], Number(distance <= personRange))
})
