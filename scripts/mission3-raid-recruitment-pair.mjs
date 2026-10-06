// Controlled source-bound adapter. No world creation, ticks, person actions or paths.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { mock } from 'node:test'
import * as actualComputer from '../app/computer.ts'
import * as actualSelection from '../app/computer-selection.ts'

const fixture = JSON.parse(readFileSync(process.argv[2], 'utf8'))
assert.equal(process.argv.length, 3)
const expectedCases = fixture.cases.length === 1
  ? ['established-base-distinct']
  : ['common-origin-control', 'no-base-authored-coordinates']
assert.deepEqual(fixture.cases.map(c => c.id), expectedCases)
assert.equal(fixture.people.length, 7)
assert.equal(actualComputer.computerPhase(fixture.turn, fixture.tribe), 'dispatch')
const stop = new Error('Stopped after actual selection callback and flags copyback')
let active, selectorCalls = 0, controllerCalls = 0
const selectionMock = mock.module(new URL('../app/computer-selection.ts', import.meta.url), {
  cache: true,
  namedExports: {
    ...actualSelection,
    selectComputerPeople(world, model, alternative, target, mode, destination, flags, requested) {
      assert.ok(active)
      assert.equal(++selectorCalls, 1)
      assert.deepEqual([model, alternative, target, mode, flags, requested], [2, 2, -1, 1, 7, 3])
      assert.equal(destination, fixture.defencePosition)
      assert.deepEqual(world.people, active.expectedPeople)
      assert.equal(world.units.size, 7)
      assert.deepEqual([...world.orders], [])
      assert.deepEqual(world.tribes[2], {
        hasBase: true, base: fixture.defencePosition,
        shaman: fixture.shamanCell, radius: fixture.defenceRadius,
      })
      for (const person of world.people) {
        assert.equal(world.units.get(person.id), person)
        assert.equal(world.buildingAt(((person.x >>> 8) & 254) | (person.y & 0xfe00)), 0)
      }
      active.selector = { model, alternative, target, mode, origin: destination, flags, requested }
      active.selectionInputs = structuredClone({ people: world.people, orders: [...world.orders], tribe: world.tribes[2] })
      const ids = actualSelection.selectComputerPeople(world, model, alternative, target, mode, destination, flags, requested)
      active.ids = [...ids]
      active.helperFlags3 = world.people.map(p => ({ id: p.id, value: p.flags3 }))
      return ids
    },
  },
})
const controllerMock = mock.module(new URL('../app/computer.ts', import.meta.url), {
  cache: true,
  namedExports: {
    ...actualComputer,
    stepAttackTask(ai, index, input) {
      assert.ok(active)
      assert.equal(++controllerCalls, 1)
      assert.equal(ai, active.world.ai)
      assert.equal(index, 0)
      assert.equal(input.staging, fixture.defencePosition)
      return actualComputer.stepAttackTask(ai, index, {
        ...input,
        select(...args) {
          const result = input.select(...args)
          assert.deepEqual(result, active.ids)
          active.copybackFlags3 = active.world.units.map(u => ({ id: u.id, value: u.native.flags3 }))
          assert.deepEqual(active.copybackFlags3, active.helperFlags3)
          throw stop
        },
      })
    },
  },
})
// The two leaf modules above have no computer-runtime dependency. Import the actual
// live adapter only after its delegated observation/stop wrappers are installed.
const { stepComputerTasks } = await import('../app/computer-runtime.ts')
const { unitAnimationSource } = await import('../app/selection-runtime.ts')
const { nativePosition } = await import('../app/world-terrain-runtime.ts')
const terrainSize = 128 * 128
const watchdog = setTimeout(() => process.exit(124), 20_000)
watchdog.unref()

function runCase(index) {
  assert.ok(Number.isInteger(index) && index >= 0 && index < expectedCases.length)
  const c = fixture.cases[index], ai = actualComputer.createComputerQueue()
  Object.assign(ai, { flags: fixture.aiFlags, states: 1 << 20, cursor: fixture.queueCursor,
    selectionOwner: fixture.selectionOwner, defencePosition: fixture.defencePosition,
    defenceRadius: fixture.defenceRadius, attributes: Array(48).fill(0) })
  if (c.hasConstructionBase) ai.constructionBase = c.constructionBaseCell
  Object.assign(ai.tasks[0], { flags: 1, type: 20, phase: 3, requested: 3,
    quotas: [...fixture.task.quotaBytes], selected: 0, remaining: 0, entity: 0, mode: 0 })
  const units = fixture.listOrder.map(id => {
    const p = fixture.people.find(person => person.id === id)
    assert.ok(p && p.state === 17 && !p.busy && !p.vehicle && !p.immediateCommand)
    return { id, kind: p.model === 7 ? 'shaman' : 'brave', team: 'yellow', hp: 50,
      x: p.browserX, z: p.browserZ, inside: null, entry: null, work: null,
      fight: null, fighting: false, casting: null, lift: 0, builder: null, flight: null, path: [],
      native: { id, model: p.model, tribe: p.tribe, x: p.x, y: p.y, state: p.state,
        flags2: p.flags2, flags3: p.flags3, flags4: p.flags4, assignment: p.assignment,
        computerAssignment: p.busy, workFlags: 0, vehicle: p.vehicle, building: 0,
        immediateCommand: p.immediateCommand, commands: [...p.commands], commandCursor: p.commandCursor,
        commandStatus: p.commandStatus, guardInputPending: p.guardInputPending } }
  })
  const world = { outcome: { level: 3 }, activeCampaignTribe: 2, turn: fixture.turn, ai,
    randomState: fixture.seed, units, buildings: [], landVersion: 0, terrainVersion: 0,
    land: { heights: new Int16Array(terrainSize), flags: new Uint32Array(terrainSize),
      buildingIds: new Uint16Array(terrainSize) }, buildingOrders: { records: [] } }
  const before = structuredClone(world)
  for (const u of units) {
    assert.equal(unitAnimationSource(u), u.native)
    const p = nativePosition(world, u)
    assert.equal(p.x & 65535, u.native.x)
    assert.equal(p.y & 65535, u.native.y)
  }
  const expectedPeople = units.map(u => ({ id: u.id, class: 1, model: u.native.model, state: 17,
    tribe: 2, x: u.native.x, y: u.native.y, flags2: u.native.flags2, flags3: u.native.flags3,
    flags4: u.native.flags4, assignment: u.native.assignment, busy: 0, vehicle: 0,
    driver: 0, inside: 0, immediateCommand: 0, commands: [...u.native.commands], commandCursor: 0 }))
  active = { world, expectedPeople }; selectorCalls = 0; controllerCalls = 0
  assert.throws(() => stepComputerTasks(world, 2), error => error === stop)
  assert.equal(selectorCalls, 1); assert.equal(controllerCalls, 1)
  const expected = structuredClone(before)
  expected.ai.tasks[0].remaining = 1
  for (const u of expected.units) if (active.ids.includes(u.id)) u.native.flags3 &= ~1
  assert.deepEqual(world, expected, 'Only selection cursor and selected flags3 may change')
  const distance = (a, b) => Math.min(Math.abs(a - b), 256 - Math.abs(a - b))
  const ranks = active.ids.map(id => {
    const p = expectedPeople.find(person => person.id === id), origin = active.selector.origin
    return { id, distance: distance((p.x >>> 8) & 254, origin & 255) + distance((p.y >>> 8) & 254, origin >>> 8) }
  })
  const t = ai.tasks[0]
  const result = { id: c.id, comparison: { selector: active.selector, count: active.ids.length,
    ids: active.ids, ranks, flags3: active.copybackFlags3,
    task: { type: t.type, phase: t.phase, selected: t.selected, cursor: t.remaining,
      requested: t.requested, quotas: t.quotas, flags: t.flags, entity: t.entity },
    rng: world.randomState }, inputs: active.selectionInputs,
    adapter: { turn: world.turn, queueCursor: ai.cursor, selectorCalls, controllerCalls,
      sourceIdentity: 'All seven actual unitAnimationSource results equal the supplied u.native records.',
      browserCoordinates: units.map(u => ({ id: u.id, x: u.x, z: u.z })),
      suppliedConstructionBase: ai.constructionBase ?? null,
      presentation: fixture.people.map(p => ({ id: p.id, commandStatus: p.commandStatus, guardInputPending: p.guardInputPending })),
      records: { tasksBefore: before.ai.tasks, tasksAfter: ai.tasks,
        unitsBefore: before.units, unitsAfter: world.units,
        ordersBefore: before.buildingOrders.records, ordersAfter: world.buildingOrders.records },
      allowedWorldChangesAsserted: true, stoppedBeforeMembershipAndPersonActions: true } }
  active = null
  return result
}

let next = 0
try {
  for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
    assert.ok(line.length < 128)
    const request = JSON.parse(line)
    assert.deepEqual(request, { caseIndex: next })
    assert.ok(next < expectedCases.length, 'Only this frozen case sequence may execute')
    const result = runCase(next++)
    const response = JSON.stringify(result)
    assert.ok(response.length < 65536)
    process.stdout.write(response + '\n')
  }
} finally {
  clearTimeout(watchdog)
  controllerMock.restore(); selectionMock.restore()
}
