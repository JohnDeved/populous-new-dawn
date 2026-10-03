import assert from 'node:assert/strict'
import script from '../app/original-script-three.json' with { type: 'json' }
import { runScript, scriptState, scriptValue } from '../app/popscript.ts'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { selectComputerPerson } from '../app/computer-selection.ts'
import { createComputerQueue, requestPreacherTask } from '../app/computer.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { missionData } from '../app/mission-data.ts'
import {
  computerPreachingAt,
  returnComputerGuards,
  stepComputerTasks,
  requestComputerPreacher,
} from '../app/computer-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'
import { returnLivePerson } from '../app/live-movement.ts'

const until = (world, predicate, limit = 12000) => {
  for (let i = 0; i < limit && !predicate(); i++) tick(world, 1 / 12)
  assert.ok(predicate(), `condition not reached at turn${world.turn}`)
}
const selection = rows => {
  const people = rows.map(([x, y, priority], i) => ({
    id: i + 1,
    class: 1,
    model: 4,
    state: 17,
    tribe: 2,
    x: x << 8,
    y: y << 8,
    flags2: 0,
    flags3: 1,
    flags4: 0,
    assignment: priority << 12,
    busy: 0,
    vehicle: 0,
    driver: 0,
    inside: 0,
    immediateCommand: 0,
    commands: Array(8).fill(0),
    commandCursor: 0,
  }))
  return {
    people,
    units: new Map(people.map(p => [p.id, p])),
    orders: new Map(),
    tribes: Array.from({ length: 4 }, () => ({ hasBase: false, base: 0, shaman: 0, radius: 0 })),
    buildingAt: () => 0,
  }
}

test('single Preacher selector preserves native first-near/band order and strict distance boundaries', () => {
  for (const [rows, expected] of [
    [
      [
        [118, 118, 0],
        [100, 100, 0],
      ],
      1,
    ],
    [
      [
        [120, 100, 0],
        [100, 100, 0],
      ],
      2,
    ],
    [
      [
        [140, 100, 0],
        [124, 100, 0],
      ],
      2,
    ],
    [
      [
        [118, 118, 0],
        [100, 100, 1],
      ],
      1,
    ],
    [
      [
        [140, 100, 0],
        [102, 100, 1],
      ],
      2,
    ],
  ]) {
    const world = selection(rows)
    assert.equal(selectComputerPerson(world, 4, 4, -1, 1, 0x6464, 0x47), expected)
    assert.deepEqual(
      world.people.map(p => p.flags3),
      rows.map((_, i) => (i + 1 === expected ? 0 : 1))
    )
  }
})

test('single-person strict19 boundary, wrap, mode0 and invalid mode match native cases', () => {
  for (const [rows, target, mode, expected] of [
    [
      [
        [120, 100, 0],
        [100, 100, 0],
      ],
      0x6565,
      1,
      2,
    ],
    [
      [
        [250, 250, 0],
        [2, 2, 0],
      ],
      0x0202,
      1,
      1,
    ],
    [
      [
        [140, 100, 0],
        [102, 100, 1],
      ],
      0x6464,
      0,
      1,
    ],
    [[[100, 100, 0]], 0x6464, 2, null],
  ]) {
    const world = selection(rows)
    assert.equal(selectComputerPerson(world, 4, 4, -1, mode, target, 0x47), expected)
    assert.deepEqual(
      world.people.map(p => p.flags3),
      rows.map((_, i) => (i + 1 === expected ? 0 : 1))
    )
  }
})

const controlledPreacher = () => {
  const world = createWorld(3),
    unit = world.units.find(u => u.team === 'yellow' && u.kind === 'brave')
  unit.kind = 'preacher'
  unit.native = createLivePerson(world, unit)
  unit.native.state = 17
  for (const task of world.ai.tasks) task.flags = 0
  world.ai.cursor = 0
  world.ai.flags &= ~2
  world.ai.selectionOwner = 10
  return { world, unit }
}

test('type11 waits for selection ownership and cancellation safely releases state14 and slot', () => {
  const { world, unit } = controlledPreacher()
  assert.equal(requestPreacherTask(world.ai, unit.id, 0x1234, 0x800, 1), true)
  const task = world.ai.tasks[0]
  Object.assign(world.ai.tasks[1], { flags: 1, type: 20, phase: 2 })
  stepComputerTasks(world, 2)
  assert.equal(task.phase, 4)
  world.ai.tasks[1].flags = 0
  world.ai.flags |= 2
  world.ai.selectionOwner = 1
  stepComputerTasks(world, 2)
  assert.equal(task.phase, 4)
  world.ai.flags &= ~2
  world.ai.selectionOwner = 10
  stepComputerTasks(world, 2)
  assert.equal(task.phase, 5)
  assert.equal(world.ai.commandDelay, 20)
  assert.equal(unit.native.state, 14)
  unit.native.motionTimer = 7
  unit.native.motionMode = 3
  unit.native.flags2 |= 0x20000800
  task.flags |= 2
  stepComputerTasks(world, 2)
  assert.equal(task.flags & 3, 0)
  assert.equal(world.ai.selectionOwner, 10)
  assert.notEqual(unit.native.state, 14)
  assert.equal(unit.native.motionTimer, 0)
  assert.equal(unit.native.motionMode, 0)
  assert.equal(unit.native.flags2 & 0x20000800, 0)
})

test('duplicate raw payload and failed allocator preserve native selection side effects', () => {
  const { world, unit } = controlledPreacher(),
    p = unit.native
  Object.assign(world.buildingOrders.records[1], {
    model: 17,
    flags: 0,
    references: 1,
    a: 0x1234,
    b: 0x5680,
  })
  p.immediateCommand = 1
  p.state = 10
  assert.equal(computerPreachingAt(world, 2, 0x1234), true)
  world.buildingOrders.records[1].a = 0x3480
  assert.equal(computerPreachingAt(world, 2, 0x1234), false)
  p.immediateCommand = 0
  p.state = 10
  p.commandStatus = 0
  p.flags3 |= 1
  world.ai.states &= ~0x800
  assert.equal(requestComputerPreacher(world, 2, 0x1234), false)
  assert.equal(p.flags3 & 1, 0)
  assert.ok(!world.ai.tasks.some(t => t.flags & 1 && t.type === 11))
})

test('Preacher allocator preserves native five-slot/state/signed-count boundaries', () => {
  for (const [occupied, states, count, expected] of [
    [0, 0x800, 1, true],
    [5, 0x800, 1, true],
    [6, 0x800, 1, false],
    [0, 0, 1, false],
    [0, 0x800, 0, false],
    [0, 0x800, 65535, false],
  ]) {
    const ai = createComputerQueue()
    for (let i = 0; i < occupied; i++) ai.tasks[i].flags = 1
    assert.equal(requestPreacherTask(ai, 42, 0x1234, states, count), expected)
    const task = ai.tasks.find(t => t.flags & 1 && t.type === 11)
    if (expected) {
      assert.deepEqual([task.entity, task.target, task.phase, task.extra], [42, 0x1234, 4, 0])
      assert.equal(requestPreacherTask(ai, 43, 0x1234, states, count), false)
    }
  }
})

test('1103 replacement preserves all person/order state on allocation exhaustion', () => {
  const world = createWorld(3),
    unit = world.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  assert.ok(unit)
  unit.native = createLivePerson(world, unit) // controlled native person record, not natural acceptance
  for (const order of world.buildingOrders.records) order.references = 1
  const before = structuredClone(world)
  assert.equal(returnLivePerson(world, unit, { x: 0x1200, y: 0x3400 }), false)
  assert.deepEqual(world, before)
  returnComputerGuards(world, 2)
  assert.deepEqual(world, before)
})

test('natural Chumara training reaches marker3 Preacher task, checkpoint phases and movement', () => {
  const world = createWorld(3)
  // Campaign scheduling can create phase4 and dispatch it to5 within one turn.
  // Either observable boundary still leads to the exact state14 assertions below.
  until(world, () => world.ai.tasks.some(t => t.flags & 1 && t.type === 11 &&
    (t.phase === 4 || t.phase === 5)))
  const task = world.ai.tasks.find(t => t.flags & 1 && t.type === 11),
    id = task.entity
  const preacher = world.units.find(u => u.id === id)
  assert.equal(preacher.kind, 'preacher')
  assert.ok(
    world.buildings.some(b => b.team === 'yellow' && b.kind === 'temple' && b.progress === 1)
  )
  assert.equal(task.target, missionData(3).level.markers[3])
  until(world, () => task.phase === 5)
  assert.equal(preacher.native.state, 14)
  const restored = migrateCheckpoint(structuredClone(world)),
    start = { x: preacher.x, z: preacher.z }
  for (let i = 0; i < 300; i++) {
    tick(world, 1 / 12)
    tick(restored, 1 / 12)
  }
  const order = currentPersonOrder(world.buildingOrders, preacher.native)
  assert.ok(order && [17, 31, 32].includes(order.model))
  assert.ok(preacher.x !== start.x || preacher.z !== start.z)
  assert.deepEqual(restored.ai.tasks, world.ai.tasks)
  assert.equal(typeof world.randomState, 'number')
  assert.equal(restored.randomState, world.randomState)
  assert.equal(world.status, 'playing')
  assert.equal(computerPreachingAt(world, 2, task.target), true)
  assert.equal(
    ((preacher.native.x >>> 8) & 254) | (preacher.native.y & 0xfe00),
    task.target & 0xfefe
  )
})

// Paired with the original interpreter probe; this isolates schedule/control only.
test('complete128-turn block preserves strict gates, command ordering and message lifetime', () => {
  const block = { ...script, codes: [12, 1003, ...script.codes.slice(570, 715), 1004, 1019] }
  for (const [
    turn,
    pop,
    priests,
    near,
    warriors,
    blueWarriors,
    bluePriests,
    camps,
    bluePop,
    expected,
  ] of [
    [122, 9, 1, 0, 0, 0, 0, 2, 20, []],
    [123, 8, 1, 0, 0, 0, 0, 2, 20, [1136, 1068, 1103]],
    [123, 9, 1, 0, 3, 0, 0, 2, 20, [1136, 1092, 1074, 1068, 1103]],
    [123, 7, 1, 4, 0, 0, 0, 2, 20, [1136, 1068, 1102]],
    [123, 9, 0, 4, 0, 0, 0, 2, 20, [1136, 1068, 1103]],
    [251, 9, 1, 0, 0, 10, 10, 2, 20, [1176, 1180, 1179, 1136, 1074, 1068, 1103]],
    [123, 9, 1, 0, 0, 0, 0, 0, 26, [1136, 1176, 1180, 1179, 1074, 1068, 1103]],
  ]) {
    const state = scriptState(script),
      calls = []
    const readInternal = id => {
      const values = {
        1: pop,
        1148: priests,
        1147: warriors,
        1153: blueWarriors,
        1154: bluePriests,
        1088: camps,
        2: bluePop,
      }
      assert.ok(id in values, `unexpected internal${id}`)
      return values[id]
    }
    runScript(block, state, {
      turn,
      tribe: 2,
      readInternal,
      command: (opcode, args) => {
        calls.push(opcode)
        const values = args.map(index =>
          index === 1118 ? 0 : scriptValue(script, state, index, readInternal)
        )
        if (opcode === 1068) state.variables[9] = near
        if (opcode === 1092) assert.deepEqual(values, [1, 2, 3, -1])
        if (opcode === 1074) assert.deepEqual(values, [3])
        if (opcode === 1179) assert.deepEqual(values, [256])
        if (opcode === 1176) assert.deepEqual(values, [blueWarriors > 9 ? 73 : 71])
        if (opcode === 1102) assert.deepEqual(values, [pop])
      },
    })
    assert.deepEqual(calls, expected)
    assert.equal(state.variables[10], 0)
  }
})

test('1103 retargets only active order30 in native state10/33 without restarting state', () => {
  for (const [state, model, flags, queued, matching] of [
    [10, 30, 0, false, true],
    [33, 30, 0, true, true],
    [17, 30, 0, false, false],
    [10, 30, 1, false, false],
    [10, 17, 0, false, false],
  ]) {
    const { world, unit } = controlledPreacher(),
      p = unit.native
    p.state = state
    p.commandStatus = model
    if (queued) p.commands[0] = 1
    else p.immediateCommand = 1
    Object.assign(world.buildingOrders.records[1], { model, flags, references: 1, a: 0, b: 0 })
    world.ai.constructionBase = 0x8234
    const before = structuredClone(p)
    returnComputerGuards(world, 2)
    if (matching) {
      assert.equal(currentPersonOrder(world.buildingOrders, p).model, 3)
      assert.equal(p.state, state)
    } else assert.deepEqual(p, before)
  }
})

test('cancelled blocked-state Preacher resets motion before the native state gate', () => {
  const { world, unit } = controlledPreacher()
  requestPreacherTask(world.ai, unit.id, 0x1234, 0x800, 1)
  stepComputerTasks(world, 2)
  const p = unit.native
  assert.equal(p.state, 14)
  p.flags2 |= 0x20100800
  p.motionTimer = 7
  p.motionMode = 3
  p.x = 0x2345
  p.y = 0x4567
  world.land.flags[(p.y >>> 9) * 128 + (p.x >>> 9)] &= ~512
  p.goalX = 0x7777
  p.goalY = 0x8888
  p.anchorX = 1
  p.anchorY = 2
  p.anchorFlags = 255
  p.motionGroup = 3
  p.motionIndex = 2
  world.pathfinding.people.set(unit.id, p)
  world.ai.tasks[0].flags |= 2
  stepComputerTasks(world, 2)
  assert.equal(p.state, 14)
  assert.equal(p.motionTimer, 0)
  assert.equal(p.motionMode, 0)
  assert.equal(p.flags2 & 0x20000800, 0)
  assert.ok(p.flags2 & 0x1000)
  assert.deepEqual([p.anchorX, p.anchorY, p.anchorFlags], [0x2300, 0x4500, 0])
  assert.deepEqual([p.goalX, p.goalY], [0x7777, 0x8888])
  assert.deepEqual([p.motionGroup, p.motionIndex], [3, 2])
  assert.equal(world.pathfinding.people.get(unit.id), p)
})
