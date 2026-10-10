import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { serialize, deserialize } from 'node:v8'
import { compileFunction } from 'node:vm'

// Controlled observer contracts only. No production or dependency imports, world creation,
// tick, campaign selector, runtime dispatcher, native execution or real recruitment.
const observer = readFileSync(new URL('./observe.mjs', import.meta.url), 'utf8')
const start = 'function assertNeutral(', end = 'const computerMock = mock.module('
assert.equal(observer.split(start).length, 2)
assert.equal(observer.split(end).length, 2)
const helpers = observer.slice(observer.indexOf(start), observer.indexOf(end))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')

function suppliedWorld() {
  const person = (id, state = 14, model = 3, tribe = 2) => ({ id, class: 1, model, tribe,
    state, previousState: 17, flags2: 0, flags3: 0x2000, flags4: 0,
    computerAssignment: 0, assignment: 0, vehicle: 0, x: 0, y: 0 })
  const people = [person(1), person(2, 14, 4), person(3, 17), person(4, 14, 5),
    person(5, 14, 7), person(6, 14, 3, 0), person(7, 14, 6)]
  const unit = (p, hp = 100) => ({ id: p.id, team: 'yellow', kind: 'warrior', hp,
    inside: null, native: p })
  const units = [unit(people[0]), unit(people[1], 0), unit(people[2]), unit(people[6])]
  units[1].entry = { person: people[1] }
  units[1].native = { ...people[1], state: 17, computerAssignment: 77 }
  units[2].resident = { person: people[2] }
  units[2].native = { ...people[2], state: 14, computerAssignment: 88 }
  units[3].nativeFlags7f = 0xa5
  const task = { flags: 1, type: 20, phase: 3, requested: 2, selected: 1,
    remaining: 6, members: [1, 999] }
  return { turn: 100, randomState: 1, cosmeticRandom: { randomState: 2 }, units,
    campaignAIs: [null, null, { cursor: 0, flags: 2, selectionOwner: 0, tasks: [task] }],
    objectCells: { objects: new Map([...people.map(p => [p.id === 7 ? 70 : p.id, p]),
      [8, { ...person(8), class: 2 }]]) }, terrainVersion: 2 }
}
function fixture(world, collector = null, worldByteLimit = 16 * 1024 * 1024) {
  const writes = new Map(), events = []
  const bindings = { world, injectedCollector: collector, hash, serialize, structuredClone, assert,
    byteLimits: { world: worldByteLimit }, output: 'controlled-phase3',
    writeFileSync(path, bytes, options) { assert.equal(options.flag, 'wx'); assert.ok(!writes.has(path));
      writes.set(path, Buffer.from(bytes)) }, emit: event => events.push(event) }
  return { writes, events,
    run: () => compileFunction(helpers + '\nregisteredPeople = injectedCollector ?? registeredPeople; return snapshot(0);',
      Object.keys(bindings))(...Object.values(bindings)),
    outcome: (before, after) => compileFunction(helpers + '\nreturn phase3Outcome;',
      Object.keys(bindings))(...Object.values(bindings))(before, after) }
}

test('whole registered tribe cohort retains unlisted, dead, unmatched and stale-alias people', () => {
  const world = suppliedWorld(), before = serialize(world), f = fixture(world), result = f.run()
  assert.ok(before.equals(serialize(world)))
  assert.equal(f.writes.size, 0)
  assert.deepEqual(result.registeredPeople.map(row => row.registryKey), [1, 2, 3, 4, 5, 70])
  assert.deepEqual(result.state14RegistryKeys, [1, 2, 4, 5, 70])
  assert.deepEqual(result.unlistedState14RegistryKeys, [2, 4, 5, 70])
  assert.deepEqual(result.unmatchedAliasRegistryKeys, [4, 5])
  const rows = new Map(result.registeredPeople.map(row => [row.registryKey, row]))
  assert.equal(rows.get(2).units[0].hp, 0)
  assert.deepEqual(rows.get(2).units[0].authoritativeAliases, ['entry'])
  assert.equal(rows.get(2).units[0].aliases.find(row => row.name === 'native').person.computerAssignment, 77)
  assert.equal(rows.get(2).person.computerAssignment, 0)
  assert.deepEqual(rows.get(3).units[0].authoritativeAliases, ['resident'])
  assert.equal(rows.get(3).units[0].aliases.find(row => row.name === 'native').person.state, 14)
  assert.equal(rows.get(70).registryKeyMatchesPersonId, false)
  assert.equal(rows.get(70).units[0].nativeFlags7f, 0xa5)
  assert.equal(rows.get(1).units[0].hasNativeFlags7f, false)
  assert.equal(rows.get(1).units[0].nativeFlags7f, null)
  assert.equal(result.taskMemberRegistry[1].present, false)
})

test('exact observer wrappers capture after the complete action batch and delegate once', () => {
  const world = suppliedWorld(), task = world.campaignAIs[2].tasks[0], events = []
  let controllerCalls = 0, selectionCalls = 0, dispatcherCalls = 0
  const callbackKey = Symbol('controlled-after-tasks'), globals = {}
  const mockStart = 'const computerMock = mock.module(', mockEnd = '\ntry {\n  globalThis[callbackKey]'
  const callbackStart = '  globalThis[callbackKey] =', callbackEnd = "  await import(url('app/computer-runtime.ts'))"
  const suffixStart = 'const suffix = `\n', suffixEnd = '\n`\nconst evaluatedRuntime'
  const part = (a, b) => {
    assert.equal(observer.split(a).length, 2)
    assert.equal(observer.split(b).length, 2)
    return observer.slice(observer.indexOf(a), observer.indexOf(b))
  }
  const mockCode = part(mockStart, mockEnd)
  const callbackCode = part(callbackStart, callbackEnd)
  const runtimeWrapper = part(suffixStart, suffixEnd).slice(suffixStart.length)
    .replace('export function ', 'function ')
    .replace("Symbol.for('issue248.phase3.afterTasks')", 'callbackKey')
  const bindings = { world, assert, serialize, hash, structuredClone, globalThis: globals, callbackKey,
    byteLimits: { world: 16 * 1024 * 1024 }, output: 'controlled-phase3',
    writeFileSync() { assert.fail('Unexpected guard failure') }, emit: event => events.push(event),
    url: path => path, mock: { module: (_url, options) => options.namedExports },
    actualComputer: { stepAttackTask(ai, index, input) {
      controllerCalls++
      const ids = input.select(-1, 1, 0)
      ai.tasks[index].members.push(...ids)
      ai.tasks[index].selected += ids.length
      ai.tasks[index].phase = 4
      return ids.map(id => ({ kind: 'select', id }))
    } },
    dispatcher(computer, w) {
      dispatcherCalls++
      const actions = computer.stepAttackTask(w.campaignAIs[2], 0, {
        select() { selectionCalls++; return [3] },
      })
      assert.equal(w.objectCells.objects.get(3).state, 17)
      for (const action of actions) w.objectCells.objects.get(action.id).state = 14
      return 'exact-runtime-return'
    } }
  const result = compileFunction(helpers +
    '\nlet pending = [], allocation = { index: 0 }, visits = 0, completion = null, stopReason = null;\n' +
    mockCode + '\n' + callbackCode + '\n' +
    'function issue248OriginalStepComputerTasks(w, tribe) { return dispatcher(computerMock, w, tribe); }\n' +
    runtimeWrapper + '\nreturn { value: stepComputerTasks(world, 2), completion, visits, stopReason, pending, phase3Outcome };',
  Object.keys(bindings))(...Object.values(bindings))
  assert.equal(result.value, 'exact-runtime-return')
  assert.deepEqual([controllerCalls, selectionCalls, dispatcherCalls], [1, 1, 1])
  assert.equal(result.visits, 1)
  assert.equal(result.stopReason, 'completed-positive')
  assert.equal(result.pending.length, 0)
  assert.equal(events.length, 1)
  const event = events[0]
  assert.equal(event.beforeController.state14RegistryKeys.includes(3), false)
  assert.equal(event.calls[0].afterCallback.state14RegistryKeys.includes(3), false)
  assert.equal(event.afterController.state14RegistryKeys.includes(3), false)
  assert.equal(event.afterDispatch.state14RegistryKeys.includes(3), true)
  assert.deepEqual(event.afterDispatch.unlistedState14RegistryKeys, [2, 4, 5, 70])
  assert.equal(event.afterDispatch.turn, event.beforeController.turn)
  assert.equal(result.phase3Outcome(event.beforeController.task, { ...task, phase: 3 }), null)
  assert.equal(result.phase3Outcome(event.beforeController.task, { ...task, selected: 0, flags: 0 }), 'retired-without-admission')
  assert.equal(result.phase3Outcome(event.beforeController.task, { ...task, phase: 23 }), 'unexpected-phase-exit')
})

test('a throwing mutating detached collector retains its error and exact strict rejection buffers', () => {
  const world = suppliedWorld(), before = serialize(world)
  const f = fixture(world, observed => {
    observed.terrainVersion = 99
    throw new Error('Controlled collector failure after mutation')
  })
  assert.throws(f.run, /detached projection input changed during observation/)
  assert.ok(before.equals(serialize(world)))
  assert.equal(f.events[0].kind, 'observer-helper-error')
  assert.equal(f.events[0].message, 'Controlled collector failure after mutation')
  assert.equal(f.events[1].scope, 'detached projection input')
  assert.equal(deserialize(f.writes.get('controlled-phase3.guard-before.bin')).terrainVersion, 2)
  assert.equal(deserialize(f.writes.get('controlled-phase3.guard-after.bin')).terrainVersion, 99)
})

test('live-world mutation is rejected without a terrain exemption', () => {
  const world = suppliedWorld()
  const f = fixture(world, () => { world.terrainVersion = 99; return [] })
  assert.throws(f.run, /live world changed during observation/)
  assert.equal(f.events[0].scope, 'live world')
  assert.equal(deserialize(f.writes.get('controlled-phase3.guard-before.bin')).terrainVersion, 2)
  assert.equal(deserialize(f.writes.get('controlled-phase3.guard-after.bin')).terrainVersion, 99)
})

test('oversized capture stops before the controlled collector', () => {
  let called = false
  const f = fixture(suppliedWorld(), () => { called = true; return [] }, 8)
  assert.throws(f.run, /Serialized world byte bound/)
  assert.equal(called, false)
  assert.equal(f.writes.size, 0)
})
