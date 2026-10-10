import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { serialize, deserialize } from 'node:v8'
import { compileFunction } from 'node:vm'
import { projectCapture } from './project-phase3.mjs'

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
function fixture(world, clone = structuredClone, worldByteLimit = 16 * 1024 * 1024, jsonlLimit = 32 * 1024 * 1024) {
  const writes = new Map(), events = []
  const bindings = { world, hash, serialize, structuredClone: clone, assert,
    byteLimits: { world: worldByteLimit, jsonl: jsonlLimit }, output: 'controlled-phase3',
    writtenBytes: 0, captureBytes: 0,
    writeFileSync(path, bytes, options) { assert.equal(options.flag, 'wx'); assert.ok(!writes.has(path));
      writes.set(path, Buffer.from(bytes)) }, emit: event => events.push(event) }
  return { writes, events,
    run: (capture = false) => compileFunction(helpers + `\nreturn snapshot(0, ${capture});`,
      Object.keys(bindings))(...Object.values(bindings)) }
}

test('whole registered tribe cohort retains unlisted, dead, unmatched and stale-alias people', () => {
  const world = suppliedWorld(), before = serialize(world), f = fixture(world), captured = f.run(true)
  const result = projectCapture(f.writes.get(captured.capture.path), 0)
  assert.ok(before.equals(serialize(world)))
  assert.equal(f.writes.size, 1)
  assert.equal(captured.capture.sha256, hash(f.writes.get(captured.capture.path)))
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
  assert.ok(result.task.members.includes(999))
})

test('exact observer wrappers capture after the complete action batch and delegate once', () => {
  const world = suppliedWorld(), task = world.campaignAIs[2].tasks[0], events = [], writes = new Map()
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
    byteLimits: { world: 16 * 1024 * 1024, jsonl: 32 * 1024 * 1024 }, writtenBytes: 0, captureBytes: 0, output: 'controlled-phase3',
    writeFileSync(path, bytes, options) { assert.equal(options.flag, 'wx'); assert.ok(!writes.has(path)); writes.set(path, Buffer.from(bytes)) }, emit: event => events.push(event),
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
  assert.equal(event.beforeController.task.members.includes(3), false)
  assert.deepEqual(event.calls[0].result, [3])
  assert.equal(event.calls[0].afterCallback.task.members.includes(3), false)
  assert.equal(event.afterController.task.members.includes(3), true)
  assert.equal(event.beforeController.capture, undefined)
  assert.equal(event.calls[0].afterCallback.capture, undefined)
  assert.equal(event.afterController.capture, undefined)
  assert.equal(writes.size, 1)
  const captured = writes.get(event.afterDispatch.capture.path)
  assert.equal(hash(captured), event.afterDispatch.capture.sha256)
  const projected = projectCapture(captured, event.afterDispatch.index)
  assert.equal(projected.state14RegistryKeys.includes(3), true)
  assert.deepEqual(projected.unlistedState14RegistryKeys, [2, 4, 5, 70])
  assert.equal(event.afterDispatch.turn, event.beforeController.turn)
  assert.equal(result.phase3Outcome(event.beforeController.task, { ...task, phase: 3 }), null)
  assert.equal(result.phase3Outcome(event.beforeController.task, { ...task, selected: 0, flags: 0 }), 'retired-without-admission')
  assert.equal(result.phase3Outcome(event.beforeController.task, { ...task, phase: 23 }), 'unexpected-phase-exit')
})

test('a throwing live metadata copy retains its error and strict rejection buffers', () => {
  const world = suppliedWorld()
  const f = fixture(world, () => {
    world.terrainVersion = 99
    throw new Error('Controlled metadata failure after mutation')
  })
  assert.throws(f.run, /live world changed during observation/)
  assert.equal(f.events[0].kind, 'observer-helper-error')
  assert.equal(f.events[0].message, 'Controlled metadata failure after mutation')
  assert.equal(f.events[1].scope, 'live world')
  assert.equal(deserialize(f.writes.get('controlled-phase3.guard-before.bin')).terrainVersion, 2)
  assert.equal(deserialize(f.writes.get('controlled-phase3.guard-after.bin')).terrainVersion, 99)
})

test('live-world mutation is rejected without a terrain exemption', () => {
  const world = suppliedWorld()
  const f = fixture(world, task => { world.terrainVersion = 99; return structuredClone(task) })
  assert.throws(f.run, /live world changed during observation/)
  assert.equal(f.events[0].scope, 'live world')
  assert.equal(deserialize(f.writes.get('controlled-phase3.guard-before.bin')).terrainVersion, 2)
  assert.equal(deserialize(f.writes.get('controlled-phase3.guard-after.bin')).terrainVersion, 99)
})

test('oversized capture stops before metadata copying', () => {
  let called = false
  const f = fixture(suppliedWorld(), () => { called = true; return {} }, 8)
  assert.throws(f.run, /Serialized world byte bound/)
  assert.equal(called, false)
  assert.equal(f.writes.size, 0)
})

test('combined capture budget refuses a write instead of extending the bound', () => {
  const f = fixture(suppliedWorld(), structuredClone, 16 * 1024 * 1024, 8)
  assert.throws(() => f.run(true), /Combined capture\/JSONL byte bound/)
  assert.equal(f.writes.size, 0)
})

test('unsupported membership field shapes fail offline without changing the capture', () => {
  for (const invalid of [new Uint8Array([14]), '14', NaN]) {
    const world = suppliedWorld()
    world.objectCells.objects.get(2).state = invalid
    const bytes = serialize(world), before = hash(bytes)
    assert.throws(() => projectCapture(bytes, 0), /Unsupported membership integer/)
    assert.equal(hash(bytes), before)
  }
})
