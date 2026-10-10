import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { registerHooks } from 'node:module'
import { mock } from 'node:test'
import { serialize } from 'node:v8'
import { pathToFileURL, fileURLToPath } from 'node:url'

// One authored world, no scenario edits, no restore, no search over seeds.
const root = '/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-20261010'
const output = '/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-packet-20261010/revised-run'
const base = '4754e12d3590bde18656416514871b033de164be'
const qaPrefix = 'qa/issue248-scheduled-trace-20261010/'
const limits = { worlds: 1, turns: 22064, wallMilliseconds: 180000, phase16Visits: 4 }
const byteLimits = { jsonl: 32 * 1024 * 1024, world: 16 * 1024 * 1024, summary: 1024 * 1024 }
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const git = (...args) => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
const url = path => pathToFileURL(`${root}/${path}`).href
const productionPaths = git('ls-files', 'app').split('\n')
const productionHashes = () => Object.fromEntries(productionPaths.map(path =>
  [path, hash(readFileSync(`${root}/${path}`))]))
const sources = ['app/computer.ts', 'app/computer-runtime.ts', 'app/computer-defense.ts',
  'app/campaign-command-runtime.ts', 'app/campaign-runtime.ts', 'app/world-turn.ts',
  'app/live-people.ts', 'app/live-movement.ts', 'app/object-cells.ts',
  'app/level-six.ts', 'app/original-script-six.json', 'tests/mission6.test.mjs']
const initial = { base, head: git('rev-parse', 'HEAD'), appTree: git('rev-parse', 'HEAD:app'),
  status: git('status', '--short'), production: productionHashes(),
  sources: Object.fromEntries(sources.map(path => [path, hash(readFileSync(`${root}/${path}`))])) }
git('merge-base', '--is-ancestor', base, 'HEAD')
const changedFromBase = git('diff', '--name-only', base, 'HEAD').split('\n').filter(Boolean)
assert.ok(changedFromBase.every(path => path.startsWith(qaPrefix)), 'Only the reviewed QA packet may differ from main')
assert.equal(git('diff', '--name-only', base, '--', 'app'), '')
assert.equal(initial.status, '')
assert.equal(fileURLToPath(import.meta.url), `${root}/${qaPrefix}observe.mjs`)
initial.qaFiles = Object.fromEntries(['observe.mjs', 'proposal.md'].map(name => {
  const path = `${qaPrefix}${name}`, bytes = readFileSync(`${root}/${path}`)
  assert.equal(hash(bytes), hash(execFileSync('git', ['-C', root, 'show', `HEAD:${path}`])),
    `Executed QA bytes must match the pushed source commit: ${name}`)
  return [path, hash(bytes)]
}))
const runtimeText = readFileSync(`${root}/app/computer-runtime.ts`, 'utf8')
assert.equal(runtimeText.split('function computerResponseWorld(').length, 2)
assert.equal(runtimeText.split('export function stepComputerTasks(').length, 2)
assert.ok(runtimeText.includes('actions = stepAttackTask(w.ai, index, {'))
assert.ok(runtimeText.includes('computerAttackHasOrder(w, index, 19, target) &&'))
if (process.argv.includes('--verify-source-only')) {
  console.log(JSON.stringify({ kind: 'source-only', ...initial, limits }, null, 2))
  process.exit(0)
}
assert.ok(process.execArgv.includes('--experimental-test-module-mocks'))
assert.ok(!existsSync(`${output}.jsonl`), 'Never overwrite a previous attempt')
const started = performance.now()
const events = []
let writtenBytes = 0
const emit = event => {
  const row = { sequence: events.length, ...event }
  const line = JSON.stringify(row) + '\n'
  assert.ok(writtenBytes + Buffer.byteLength(line) <= byteLimits.jsonl, 'JSONL byte bound')
  events.push(row)
  appendFileSync(`${output}.jsonl`, line)
  writtenBytes += Buffer.byteLength(line)
}
emit({ kind: 'start', initial, limits, byteLimits, node: process.version, seed: 'createWorld(6) default' })

// Visibility and a pass-through wrapper: all original function bodies stay intact.
// This is the existing defense adapter, observed as a candidate world projection;
// it is not called by production phase16 and is not asserted native-equivalent.
const callbackKey = Symbol.for('issue248.scheduled.afterTasks')
assert.equal(globalThis[callbackKey], undefined)
const suffix = `
export { computerResponseWorld };
export function stepComputerTasks(w, tribe) {
  const result = issue248OriginalStepComputerTasks(w, tribe);
  globalThis[Symbol.for('issue248.scheduled.afterTasks')]?.(w, tribe);
  return result;
}
`
const evaluatedRuntime = runtimeText.replace('export function stepComputerTasks(',
  'function issue248OriginalStepComputerTasks(') + suffix
registerHooks({
  load(specifier, context, nextLoad) {
    const loaded = nextLoad(specifier, context)
    if (specifier !== url('app/computer-runtime.ts')) return loaded
    assert.equal(typeof loaded.source === 'string' ? loaded.source : Buffer.from(loaded.source).toString(), runtimeText)
    emit({ kind: 'runtime-observation-wrapper', original: hash(runtimeText),
      evaluated: hash(evaluatedRuntime), suffix,
      declarationRename: ['export function stepComputerTasks(', 'function issue248OriginalStepComputerTasks('] })
    return { ...loaded, source: evaluatedRuntime }
  },
})

const actualComputer = await import(url('app/computer.ts'))
const { collectDefenseTargets } = await import(url('app/computer-defense.ts'))
const { objectsInCell } = await import(url('app/object-cells.ts'))
const { currentPersonOrder } = await import(url('app/person-orders.ts'))
let world, runtime, pending = [], allocation = null, dispatch = null, mixedDispatch = false, visits = 0
let stopReason = null, failure = null
// The controlled purity regression extracts this bounded helper block only.
function assertNeutral(scope, beforeBytes, afterBytes) {
  assert.ok(beforeBytes.length <= byteLimits.world && afterBytes.length <= byteLimits.world,
    'Serialized world byte bound')
  if (!beforeBytes.equals(afterBytes)) {
    writeFileSync(`${output}.guard-before.bin`, beforeBytes, { flag: 'wx' })
    writeFileSync(`${output}.guard-after.bin`, afterBytes, { flag: 'wx' })
    emit({ kind: 'observer-rejection', scope, before: hash(beforeBytes), after: hash(afterBytes),
      beforeBytes: beforeBytes.length, afterBytes: afterBytes.length,
      diagnostics: ['guard-before.bin', 'guard-after.bin'] })
  }
  assert.equal(hash(afterBytes), hash(beforeBytes), `${scope} changed during observation`)
}
const personFields = ['id', 'class', 'model', 'tribe', 'state', 'substate', 'flags2',
  'flags3', 'flags4', 'computerAssignment', 'x', 'y', 'h', 'speed', 'assignment',
  'vehicle', 'disguise', 'immediateCommand', 'commandCursor', 'cellNext', 'cellPrevious']
const pick = (object, keys) => Object.fromEntries(keys.map(key => [key, object?.[key] ?? null]))
function ownerRow(world, unit) {
  const registered = world.objectCells.objects.get(unit.id)
  const owners = { flight: unit.flight, fight: unit.fight?.motion, native: unit.native,
    entry: unit.entry?.person, builder: unit.builder?.person }
  const person = registered && Object.values(owners).includes(registered) ? registered : null
  const order = person && currentPersonOrder(world.buildingOrders, person)
  const selectedByOldPredicate = unit.native ?? unit.fight?.motion
  return { id: unit.id, team: unit.team, kind: unit.kind, hp: unit.hp, inside: unit.inside,
    owner: Object.entries(owners).filter(([, p]) => p && p === registered).map(([name]) => name),
    registered: registered ? pick(registered, personFields) : null,
    person: person ? pick(person, personFields) : null,
    nativeFlags7f: Object.hasOwn(unit, 'nativeFlags7f') ? unit.nativeFlags7f : null,
    commands: person ? [...person.commands] : null,
    immediate: person ? { id: person.immediateCommand,
      record: structuredClone(world.buildingOrders.records[person.immediateCommand] ?? null) } : null,
    queued: person ? { id: person.commands[person.commandCursor] ?? null,
      record: structuredClone(world.buildingOrders.records[person.commands[person.commandCursor]] ?? null) } : null,
    currentOrder: structuredClone(order ?? null),
    oldPredicateUsesRegisteredOwner: !!person && selectedByOldPredicate === person,
    oldPredicatePerson: selectedByOldPredicate ? pick(selectedByOldPredicate, personFields) : null,
    oldPredicateOrder: structuredClone(selectedByOldPredicate
      ? currentPersonOrder(world.buildingOrders, selectedByOldPredicate) : null) }
}
function lists(world, tribe, target, objects) {
  const cells = []
  const collected = collectDefenseTargets(tribe, world.outcome.alliances[tribe], target, cell => {
    const row = [...objects(cell)]
    cells.push({ cell, objects: row.map(p => pick(p,
      ['id', 'class', 'model', 'tribe', 'state', 'flags2', 'flags4', 'disguise', 'x', 'y'])) })
    return row
  }, 10, 7)
  return { people: collected.people.map(p => p.id), buildings: collected.buildings.map(p => p.id), cells }
}
function snapshot(index) {
  const liveBefore = serialize(world)
  assert.ok(liveBefore.length <= byteLimits.world, 'Serialized world byte bound')
  const observed = structuredClone(world), detachedBefore = serialize(observed)
  try {
    const task = observed.campaignAIs[2].tasks[index]
    const members = task.members.map(id => observed.units.find(u => u.id === id)).map(u =>
      u ? ownerRow(observed, u) : { missingUnit: true })
    const tribePeople = observed.units.filter(u => u.team === 'yellow').map(u => ownerRow(observed, u))
    const assigned = tribePeople.filter(row => row.person?.computerAssignment === index + 1)
    const adapter = runtime.computerResponseWorld(observed, 2)
    const result = { turn: observed.turn, index, task: structuredClone(task),
      randomState: observed.randomState, cosmeticRandom: observed.cosmeticRandom.randomState,
      queue: { cursor: observed.campaignAIs[2].cursor, flags: observed.campaignAIs[2].flags,
        selectionOwner: observed.campaignAIs[2].selectionOwner },
      members, tribePeople, assignedState23: assigned.filter(row => row.person.state === 23).map(row => row.id),
      registeredAssigned: assigned.map(row => row.id),
      knownOrdinaryAssigned: assigned.filter(row => !(row.person.flags2 & 1) &&
        row.nativeFlags7f !== null && !(row.nativeFlags7f & 1)).map(row => row.id),
      unknownSpecialFlagAssigned: assigned.filter(row => row.nativeFlags7f === null).map(row => row.id),
      nativeFields: { task26: null, task08VisitCounter: null, task23BuildingModel: null,
        task2cCondition: null, nativePersonChainOrder: null,
        reason: 'No retained port projection; absence is not zero or native admission proof' },
      registeredCellLists: lists(observed, 2, task.target, cell => objectsInCell(observed.objectCells, cell)),
      defenseAdapterLists: lists(observed, 2, task.target, cell => adapter.cells.get(cell) ?? []),
      derivedOldAll19PayloadPredicate: members.some(row => row.hp > 0) && members.filter(row => row.hp > 0).every(row =>
        row.oldPredicateOrder?.model === 19 && row.oldPredicateOrder.a === task.target),
      returns: { damageReached: task.damage >= task.extra, retriesExceeded: task.retries > 32,
        retreatThreshold: Math.trunc(((task.retreatPercent & 255) * task.requested) / 100) } }
    return result
  } catch (error) {
    emit({ kind: 'observer-helper-error', name: error.name, message: error.message, stack: error.stack })
    throw error
  } finally {
    assertNeutral('live world', liveBefore, serialize(world))
    assertNeutral('detached projection input', detachedBefore, serialize(observed))
  }
}
const computerMock = mock.module(url('app/computer.ts'), { cache: true, namedExports: {
  ...actualComputer,
  requestAttack(ai, ...args) {
    const before = ai.tasks.map(task => !!(task.flags & 1))
    const result = actualComputer.requestAttack(ai, ...args)
    if (world && ai === world.campaignAIs[2]) {
      const index = ai.tasks.findIndex((task, i) => !before[i] && task.flags & 1 && task.type === 20)
      if (index >= 0) {
        assert.equal(allocation, null, 'Bounded to first Chumara allocation')
        allocation = { turn: world.turn, index, args: structuredClone(args), task: structuredClone(ai.tasks[index]) }
        emit({ kind: 'allocation', ...allocation })
      }
    }
    return result
  },
  stepAttackTask(ai, index, input) {
    if (!world || ai !== world.campaignAIs[2]) return actualComputer.stepAttackTask(ai, index, input)
    const phase = ai.tasks[index].phase
    if (![15, 16].includes(phase)) return actualComputer.stepAttackTask(ai, index, input)
    const before = snapshot(index)
    const calls = []
    const observedInput = { ...input }
    for (const name of ['activeMembers', 'targetsRemain', 'entity', 'random']) {
      if (!input[name]) continue
      observedInput[name] = (...args) => {
        const result = input[name](...args)
        calls.push({ name, args: structuredClone(args), result: structuredClone(result) })
        return result
      }
    }
    const actions = actualComputer.stepAttackTask(ai, index, observedInput)
    const event = { kind: phase === 15 ? 'mixed-dispatch' : 'phase16', before,
      calls, actions: structuredClone(actions), afterController: snapshot(index) }
    pending.push(event)
    return actions
  },
} })

try {
  globalThis[callbackKey] = (w, tribe) => {
    if (w === world && tribe === 2)
      for (const event of pending)
        if (!event.afterDispatch) event.afterDispatch = snapshot(event.before.index)
  }
  runtime = await import(url('app/computer-runtime.ts'))
  const { createWorld, tick } = await import(url('app/model.ts'))
  world = createWorld(6)
  emit({ kind: 'world', turn: world.turn, randomState: world.randomState,
    units: world.units.length, buildings: world.buildings.length,
    activeTribes: world.manaTribes.map(tribe => tribe.active),
    mutations: [], checkpoints: 0 })
  while (world.turn < limits.turns && !stopReason) {
    if (performance.now() - started >= limits.wallMilliseconds) { stopReason = 'wall-bound'; break }
    tick(world, 1 / 12)
    for (const event of pending) {
      event.afterTurn = snapshot(event.before.index)
      emit(event)
      if (event.kind === 'mixed-dispatch') {
        dispatch = event
        const models = event.afterDispatch.members.map(row => row.currentOrder?.model)
        mixedDispatch = models.includes(17) && models.includes(19)
        if (!mixedDispatch) stopReason = 'first-dispatch-not-mixed'
      } else {
        visits++
        if (event.afterController.task.phase !== 16) stopReason = 'first-phase16-exit'
        else if (visits >= limits.phase16Visits) stopReason = 'phase16-visit-bound'
      }
    }
    pending = []
    if (world.turn % 2048 === 0) emit({ kind: 'progress', turn: world.turn,
      elapsedMilliseconds: Math.round(performance.now() - started),
      activeAttacks: world.campaignAIs[2].tasks.filter(t => t.flags & 1 && t.type === 20).map(t =>
        ({ phase: t.phase, members: [...t.members] })) })
  }
  stopReason ??= 'turn-bound'
} catch (error) {
  failure = { name: error.name, message: error.message, stack: error.stack }
  stopReason = 'exception'
} finally {
  const unchanged = JSON.stringify(productionHashes()) === JSON.stringify(initial.production)
  const trackedDiff = git('diff', '--name-only', base, '--', 'app')
  const result = { kind: 'result', stopReason, failure, turn: world?.turn ?? null,
    elapsedMilliseconds: Math.round(performance.now() - started), allocation: !!allocation,
    firstDispatch: !!dispatch, mixedDispatch, phase16Visits: visits, productionUnchanged: unchanged,
    terminal: world ? { turn: world.turn, randomState: world.randomState,
      cosmeticRandom: world.cosmeticRandom.randomState,
      chumaraAI: structuredClone(world.campaignAIs[2]),
      activeTribes: world.manaTribes.map(tribe => tribe.active),
      livingCounts: Object.fromEntries(['blue', 'yellow', 'green', 'wild'].map(team =>
        [team, world.units.filter(unit => unit.team === team && unit.hp > 0).length])) } : null,
    trackedDiff, status: git('status', '--short'),
    claim: 'Port-only observation; missing retained native fields prevent native-equivalent admission and caller proof' }
  emit(result)
  const summary = JSON.stringify(result, null, 2) + '\n'
  assert.ok(Buffer.byteLength(summary) <= byteLimits.summary, 'Summary byte bound')
  writeFileSync(`${output}.summary.json`, summary, { flag: 'wx' })
  delete globalThis[callbackKey]
  computerMock.restore()
  console.log(summary)
  if (failure || !unchanged || trackedDiff) process.exitCode = 1
  else if (!mixedDispatch || !visits) process.exitCode = 2
}
