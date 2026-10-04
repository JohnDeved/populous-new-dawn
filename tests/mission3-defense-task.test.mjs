import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { missionData, missionScript, missionAllowsBuilding } from '../app/mission-data.ts'
import { campaignTribe } from '../app/campaign-runtime.ts'
import { createComputerQueue } from '../app/computer.ts'
import { collectDefenseTargets, defendedResponseCell, requestDefenseTask, stepDefenseTask } from '../app/computer-defense.ts'
import { spiralCell } from '../app/native-math.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { command, setSelection } from '../app/model.ts'
import { select, placeBuilding } from '../app/model.ts'
import { finishLevelStart } from './level-start-fixture.mjs'
import { currentPersonOrder } from '../app/person-orders.ts'
import { createLivePerson } from '../app/live-people.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { requestEarlyResponseTask } from '../app/computer.ts'
import { nativeSpellRange, spellCaster } from '../app/spell-casting.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import { unitAnimationSource } from '../app/selection-runtime.ts'

// Full imported-program invariants, rather than startup-only observations, bound
// the Mission3 response path. These do not replace original-byte native probes.
test('Mission3 keeps idle follow-ups and area-summary automatic training unreachable', () => {
  const script = missionScript(3)
  for (const [attribute, value] of [[15, 1], [31, 0], [46, 1]]) {
    const indices = script.fields.flatMap(([kind, field], index) =>
      kind === 2 && field === 1000 + attribute ? [index] : [])
    assert.equal(indices.length, 1)
    const uses = script.codes.flatMap((token, index) => token === indices[0] ? [index] : [])
    assert.equal(uses.length, 1, `attribute${attribute} has another program reference`)
    const offset = uses[0]
    assert.equal(script.codes[offset - 1], 1007, 'only SET writes the attribute')
    assert.deepEqual(script.fields[script.codes[offset + 1]], [0, value])
  }
  const state8 = []
  for (let index = 0; index + 2 < script.codes.length; index++)
    if (script.codes[index] === 1006 && script.codes[index + 1] === 1036)
      state8.push(script.codes[index + 2])
  assert.deepEqual(state8, [1022])
  assert.equal(script.commands[1066], undefined)
  assert.equal(script.commands[1067], undefined)
  assert.ok(missionData(3).level.objects.every(object => object.type !== 1 || object.model !== 5))
  assert.equal(missionAllowsBuilding(3, 6), false)
  const world = createWorld(3)
  assert.deepEqual([15, 31, 46].map(index => world.ai.attributes[index]), [1, 0, 1])
  assert.ok(world.ai.states & 256)
  assert.ok(world.ai.states & 512)
  assert.ok(world.buildings.every(building => building.kind !== 'spyHut'))
  assert.ok(world.shrines.every(shrine => shrine.reward !== 'spyHut'))
})

test('ordinary Mission3 allocates a real pre-table response before ordinary production', () => {
  const world = createWorld(3), tribe = campaignTribe(world)
  const producerTurn = (63 - tribe) & 63
  while (world.turn <= producerTurn) tick(world, 1 / 12)
  const task = world.ai.tasks.find(task => task.flags & 1 && task.type === 9)
  assert.ok(task, `missing original pre-table type9 at Mission3 turn${world.turn}`)
  assert.equal(task.phase, 0)
  assert.ok(world.ai.producers[0].attempts, 'pre-table response still permits ordinary production')
})

const area = quotas => ({ total: 1, requiredBraves: quotas[0], requiredWarriors: quotas[1],
  requiredFirewarriors: quotas[2], requiredPreachers: quotas[3] })

test('defense allocation preserves native caps, immediate empty-area cleanup and recycled scratch', () => {
  const ai = createComputerQueue()
  const summarize = () => area([0, 1, 0, 0])
  assert.equal(requestDefenseTask(ai, 0, 1, 5, 0x6464, summarize), false)
  assert.equal(requestDefenseTask(ai, 256, 0, 5, 0x6464, summarize), false)
  assert.equal(requestDefenseTask(ai, 256, 1, 5, 0x6464, summarize), true)
  assert.equal(requestDefenseTask(ai, 256, 1, 5, 0x6464, summarize), false)
  const task = ai.tasks[0]
  Object.assign(task, { flags: 4, selected: 3 })
  Object.assign(task.defense, { center: 0x1010, recenter: true, cursor: 4, fallback: true })
  assert.equal(requestDefenseTask(ai, 256, 1, 6, 0x7878, summarize), true)
  assert.equal(task.flags, 5)
  assert.equal(task.selected, 3)
  assert.deepEqual(task.defense, { center: 0x1010, recenter: true, cursor: 4, fallback: true })
  assert.ok(defendedResponseCell(ai, 0x1010), 'recycled center survives until normal dispatch')
  assert.equal(defendedResponseCell(ai, 0x7878), false)
  task.flags = 4
  assert.equal(requestDefenseTask(ai, 256, 1, 6, 0x7878, () => ({ ...summarize(), total: 0 })), true)
  assert.equal(task.flags, 4)
  for (const task of ai.tasks) task.flags |= 1
  assert.equal(requestDefenseTask(ai, 256, 10, 5, 0x6464, summarize), false)
})

test('active defense suppression uses strict squared26 and wrapped cell distance', () => {
  const ai = createComputerQueue(), task = ai.tasks[0]
  Object.assign(task, { flags: 1, type: 8, defense: { center: 0x6464 } })
  assert.equal(defendedResponseCell(ai, 0x646e), true)
  assert.equal(defendedResponseCell(ai, 0x666e), false)
  task.defense.center = 0x0202
  assert.equal(defendedResponseCell(ai, 0x02fe), true)
  task.flags = 0
  assert.equal(defendedResponseCell(ai, 0x0202), false)
})

test('native defense no-force fallback is a finite seven-visit lifecycle', () => {
  const ai = createComputerQueue()
  requestDefenseTask(ai, 256, 1, 1, 0x6464, () => area([0, 1, 0, 0]))
  const phases = [], requests = [], task = ai.tasks[0]
  const input = { targetAlive: () => true, cast: () => {},
    select: (model, count) => { requests.push([model, count]); return 0 },
    dispatch: () => assert.fail('no force cannot dispatch orders'),
    monitor: () => assert.fail('no force cannot enter monitoring'), cleanup: () => {} }
  for (let i = 0; i < 7; i++) {
    stepDefenseTask(ai, 0, input)
    phases.push([task.phase, task.flags & 1])
  }
  assert.deepEqual(phases, [[3, 1], [3, 1], [3, 1], [3, 1], [3, 1], [7, 1], [7, 0]])
  assert.deepEqual(requests, [[3, 1], [3, 1], [6, 1]])
  assert.deepEqual(task.quotas, [0, 1, 1, 0])
  assert.equal(ai.selectionOwner, 10)
})

// These controlled flags/dispatch fixtures complement the ordinary routes below.
test('defense cleanup clears only matching assignment and native flag bits while preserving another lock', () => {
  const world = createWorld(3), personUnit = world.units.find(u => u.team === 'yellow' && u.kind === 'brave')
  const p = personUnit.native ??= createLivePerson(world, personUnit)
  for (const task of world.ai.tasks) task.flags = 0
  requestDefenseTask(world.ai, 256, 1, 1, 0x6464, () => area([0, 1, 0, 0]))
  const task = world.ai.tasks[0]
  task.phase = 7
  p.state = 17
  p.computerAssignment = 1
  p.flags3 = 0x2004
  personUnit.nativeFlags7f = 255
  world.ai.flags |= 2
  world.ai.selectionOwner = 2
  world.turn = 1
  world.ai.cursor = 0
  stepComputerTasks(world, 2)
  assert.equal(p.computerAssignment, 0)
  assert.equal(p.flags3, 4)
  assert.equal(personUnit.nativeFlags7f, 254)
  assert.equal(p.state, 17)
  assert.equal(task.flags & 3, 0)
  assert.equal(world.ai.selectionOwner, 2)
  assert.ok(world.ai.flags & 2)
})

test('lost early defense targets are invalidated before a different task dispatch', () => {
  const world = createWorld(3), target = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  for (const task of world.ai.tasks) task.flags = 0
  requestEarlyResponseTask(world.ai, 512)
  requestDefenseTask(world.ai, 256, 1, target.id, 0x6464, () => area([0, 1, 0, 0]))
  target.hp = 0
  world.turn = 1
  world.ai.cursor = 0
  stepComputerTasks(world, 2)
  assert.equal(world.ai.tasks[1].phase, 0)
  assert.equal(world.ai.tasks[1].flags & 3, 3)
  stepComputerTasks(world, 2)
  assert.equal(world.ai.tasks[1].phase, 7)
  assert.equal(world.ai.tasks[1].flags & 3, 0)
})

test('defense Blast uses signed active-person height for native and flight-owned Shamans', () => {
  for (const owner of ['native', 'flight']) for (const height of [896, -256]) {
    const world = createWorld(3), shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman'),
      target = world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      person = createLivePerson(world, shaman)
    Object.assign(person, { state: 17, flags2: 0, flags4: 0, h: height })
    shaman.native = null
    shaman[owner] = person
    for (const task of world.ai.tasks) task.flags = 0
    world.ai.flags &= ~(2 | 0x40000)
    world.ai.selectionOwner = 10
    world.manaWorld.gameFlags &= ~32
    const casting = world.castingTribes[2]
    casting.flags &= ~0x80000
    casting.cooldown = casting.aiCooldown = 0
    const caster = spellCaster(world, shaman),
      terrainRange = Math.trunc(nativeSpellRange(world.manaWorld.gameFlags, casting.flags, caster, 2) / 512),
      personRange = Math.trunc(nativeSpellRange(world.manaWorld.gameFlags, casting.flags, { ...caster, height }, 2) / 512),
      distance = Math.min(terrainRange, personRange) + 1,
      cell = (((((person.x >>> 8) & 254) + distance * 2) & 255)) | (person.y & 0xfe00)
    assert.notEqual(terrainRange, personRange)
    requestDefenseTask(world.ai, 256, 1, target.id, cell, () => area([0, 1, 0, 0]))
    world.manaTribes[2].mana = rules.spellCharging[2].cost + 50001
    world.turn = 1
    world.ai.cursor = 0
    stepComputerTasks(world, 2)
    assert.equal(!!shaman.casting, personRange > terrainRange, `${owner}, signed height${height}`)
    assert.equal(world.ai.tasks[0].phase, 3)
  }
})

test('defense Blast reads active native, flight and non-presented fight positions in both range directions', () => {
  for (const owner of ['native', 'flight', 'fight']) for (const nativeNear of [true, false]) {
    const world = createWorld(3), shaman = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman'),
      enemy = world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
      person = createLivePerson(world, shaman),
      browserCell = ((person.x >>> 8) & 254) | (person.y & 0xfe00),
      sourceCell = (((browserCell & 255) + 64) & 255) | (browserCell & 0xff00)
    Object.assign(person, { state: owner === 'fight' ? 25 : 17, flags2: 0, flags4: 0, h: 0,
      x: (sourceCell & 255) << 8, y: sourceCell & 0xff00 })
    shaman.native = null
    if (owner === 'fight') {
      shaman.fight = { motion: person, action: 'attack', animation: 'attack', group: 1 }
      assert.equal(unitAnimationSource(shaman), null)
    } else shaman[owner] = person
    for (const task of world.ai.tasks) task.flags = 0
    world.ai.flags &= ~(2 | 0x40000)
    world.ai.selectionOwner = 10
    world.manaWorld.gameFlags &= ~32
    Object.assign(world.castingTribes[2], { flags: 32, cooldown: 0, aiCooldown: 0 })
    const targetCell = nativeNear ? sourceCell : browserCell,
      target = (((targetCell & 255) + 2) & 255) | (targetCell & 0xff00)
    requestDefenseTask(world.ai, 256, 1, enemy.id, target, () => area([0, 1, 0, 0]))
    world.manaTribes[2].mana = rules.spellCharging[2].cost + 50001
    world.turn = 1
    world.ai.cursor = 0
    stepComputerTasks(world, 2)
    assert.equal(!!shaman.casting, nativeNear, `${owner}, active position near=${nativeNear}`)
    assert.equal(world.ai.tasks[0].phase, 3)
  }
})

test('defense target collection preserves category caps, rejection rules and the omitted last spiral cell', () => {
  const p = (id, extra = {}) => ({ id, class: 1, model: 3, state: 17, tribe: 0,
    x: 0x6400, y: 0x6400, flags2: 0, flags4: 0, assignment: 0, disguise: 0, ...extra })
  const center = 0x6464, cells = new Map([[center, [p(1), p(2, { class: 2 }),
    p(3, { tribe: 1 }), p(4, { model: 1 }), p(5, { flags2: 0x10000 }),
    p(6, { flags4: 0x1000 }), p(7, { state: 23 }), p(8, { model: 5, disguise: 128 }), p(9)]]])
  cells.set(spiralCell(center, 222, 0), [p(10), p(11, { class: 2 })])
  cells.set(spiralCell(center, 223, 0), [p(12), p(13, { class: 2 })])
  const found = collectDefenseTargets(2, 6, center, cell => cells.get(cell) ?? [])
  assert.deepEqual(found.people.map(p => p.id), [1, 9, 10])
  assert.deepEqual(found.buildings.map(p => p.id), [2, 11])
  const capped = collectDefenseTargets(2, 6, center, cell => cells.get(cell) ?? [], 1)
  assert.deepEqual(capped.people.map(p => p.id), [1])
  assert.deepEqual(capped.buildings.map(p => p.id), [2])
})

test('ordinary Mission3 intrusion produces a real type8 fallback, cleanup, repeat and checkpoint continuation', () => {
  const world = createWorld(3)
  while (world.turn < 500) tick(world, 1 / 12)
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    tower = world.buildings.find(b => b.team === 'yellow' && b.kind === 'tower' && b.hp > 0)
  assert.ok(shaman && tower)
  setSelection(world, [shaman.id])
  assert.ok(command(world, { x: tower.x, z: tower.z }))
  const active = () => world.ai.tasks.find(t => t.flags & 1 && t.type === 8)
  while (world.turn < 1300 && !active()) tick(world, 1 / 12)
  const task = active()
  assert.ok(task, 'ordinary movement must reach real type9 detection and type8 allocation')
  assert.equal(task.entity, shaman.id)
  assert.equal(task.phase, 0)
  const restored = migrateCheckpoint(structuredClone(world)), slot = world.ai.tasks.indexOf(task)
  let released = false, repeated = false
  for (let i = 0; i < 150; i++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored.ai, world.ai)
    assert.deepEqual(restored.buildingOrders, world.buildingOrders)
    assert.equal(restored.randomState, world.randomState)
    if (!(world.ai.tasks[slot].flags & 1)) released = true
    if (released && active()) { repeated = true; break }
  }
  assert.ok(released && repeated)
  assert.equal(world.status, 'playing')
})

test('ordinary Temple acquisition and Preacher intrusion recruit a real Chumara defender with orders and movement', () => {
  const world = finishLevelStart(createWorld(3))
  const until = (predicate, limit = 12000) => {
    while (world.turn < limit && !predicate() && world.status === 'playing') tick(world, 1 / 12)
    assert.ok(predicate(), `natural defense condition missing at turn${world.turn}`)
  }
  const shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  assert.ok(command(world, world.shrines.find(s => s.kind === 'vault')))
  until(() => world.unlockedTemple)
  // Return the Shaman through ordinary input so the intruding Preacher owns the
  // enemy scan; leaving the Shaman at the Vault legitimately changes priority.
  setSelection(world, [shaman.id])
  assert.ok(command(world, { x: 35, z: 81 }))
  select(world, 'brave')
  assert.ok(placeBuilding(world, 'temple', { x: 24, z: 70 }))
  const temple = world.buildings.findLast(b => b.team === 'blue' && b.kind === 'temple')
  until(() => temple.progress === 1)
  const brave = world.units.find(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && u.inside === null)
  setSelection(world, [brave.id])
  assert.ok(command(world, temple))
  until(() => world.units.some(u => u.team === 'blue' && u.kind === 'preacher'))
  const preacher = world.units.find(u => u.team === 'blue' && u.kind === 'preacher')
  setSelection(world, [preacher.id])
  assert.ok(command(world, { x: -17, z: -108 }))
  const active = () => world.ai.tasks.find(t => t.flags & 1 && t.type === 8 && t.selected)
  until(() => !!active(), 7000)
  const task = active(), slot = world.ai.tasks.indexOf(task),
    defender = world.units.find(u => u.team === 'yellow' && u.native?.computerAssignment === slot + 1)
  assert.ok(defender)
  assert.equal(defender.kind, 'preacher')
  assert.equal(task.entity, preacher.id)
  assert.equal(defender.native.state, 14)
  assert.ok(world.buildings.some(b => b.team === 'yellow' && b.kind === 'temple' && b.progress === 1))
  const restored = migrateCheckpoint(structuredClone(world)), start = { x: defender.x, z: defender.z }
  let ordered = false, moved = false
  for (let i = 0; i < 180; i++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
    assert.deepEqual(restored.ai, world.ai)
    assert.deepEqual(restored.buildingOrders, world.buildingOrders)
    assert.equal(restored.randomState, world.randomState)
    const current = defender.native ?? defender.fight?.motion ?? defender.entry?.person,
      resumed = restored.units.find(u => u.id === defender.id)
    assert.deepEqual(resumed.native, defender.native)
    const order = current && currentPersonOrder(world.buildingOrders, current)
    if (order && order.model === 3 && task.phase === 6) ordered = true
    if (defender.x !== start.x || defender.z !== start.z) moved = true
  }
  assert.ok(ordered && moved, 'actual defender must receive the original move and move in the live world')
  assert.equal(world.status, 'playing')
})
