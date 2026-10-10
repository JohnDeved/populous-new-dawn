import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { deserialize } from 'node:v8'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

// Offline only: no model/runtime import or production helper. Files stay immutable.
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const personFields = ['id', 'class', 'model', 'tribe', 'state', 'previousState',
  'substate', 'flags2', 'flags3', 'flags4', 'computerAssignment', 'assignment',
  'vehicle', 'x', 'y', 'immediateCommand', 'commandCursor']
const pick = (object, keys) => Object.fromEntries(keys.map(key => [key, object?.[key] ?? null]))
const aliases = unit => ({ flight: unit.flight, fight: unit.fight?.motion,
  native: unit.native, entry: unit.entry?.person, builder: unit.builder?.person,
  resident: unit.resident?.person })
function registeredPeople(observed, tribe, task) {
  // The registry is authoritative. No hp, task.members, model or alias eligibility filter.
  return [...observed.objectCells.objects.entries()]
    .filter(([, person]) => person.class === 1 && person.tribe === tribe)
    .map(([registryKey, person]) => ({ registryKey, person: pick(person, personFields),
      absentFields: personFields.filter(key => !Object.hasOwn(person, key)),
      listedInTask: task.members.includes(person.id),
      registryKeyMatchesPersonId: registryKey === person.id,
      units: observed.units.flatMap((unit, unitIndex) => {
        const owners = Object.entries(aliases(unit)).filter(([, owner]) => owner)
        if (unit.id !== registryKey && unit.id !== person.id &&
          !owners.some(([, owner]) => owner === person)) return []
        return [{ unitIndex, ...pick(unit, ['id', 'team', 'kind', 'hp', 'inside']),
          nativeFlags7f: Object.hasOwn(unit, 'nativeFlags7f') ? unit.nativeFlags7f : null,
          hasNativeFlags7f: Object.hasOwn(unit, 'nativeFlags7f'),
          authoritativeAliases: owners.filter(([, owner]) => owner === person).map(([name]) => name),
          aliases: owners.map(([name, owner]) => ({ name, isRegisteredPerson: owner === person,
            person: pick(owner, personFields) })) }]
      }) }))
}

function plain(value, path) {
  assert.ok(value && typeof value === 'object' &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value)), `Unsupported membership object: ${path}`)
}
function data(object, key, path, optional = false) {
  const descriptor = Object.getOwnPropertyDescriptor(object, key)
  if (!descriptor && optional) return undefined
  assert.ok(descriptor && Object.hasOwn(descriptor, 'value'), `Unsupported membership field: ${path}.${key}`)
  return descriptor.value
}
function integer(value, path) {
  assert.ok(Number.isSafeInteger(value), `Unsupported membership integer: ${path}`)
}
function personShape(person, path) {
  plain(person, path)
  for (const key of ['id', 'class', 'model', 'tribe', 'state', 'computerAssignment'])
    integer(data(person, key, path), `${path}.${key}`)
  for (const key of personFields)
    if (Object.hasOwn(person, key)) integer(data(person, key, path), `${path}.${key}`)
}
function membershipShape(world, index, tribe) {
  plain(world, 'world')
  assert.ok(Array.isArray(world.units) && Array.isArray(world.campaignAIs), 'Unsupported membership arrays')
  assert.ok(world.objectCells?.objects instanceof Map, 'Unsupported registry map')
  const task = world.campaignAIs[tribe]?.tasks[index]
  plain(task, 'task')
  assert.ok(Array.isArray(task.members), 'Unsupported task members')
  for (const id of task.members) integer(id, 'task.members')
  for (const [key, person] of world.objectCells.objects) {
    integer(key, 'registry key')
    plain(person, `registry[${key}]`)
    integer(data(person, 'class', `registry[${key}]`), `registry[${key}].class`)
    if (person.class !== 1) continue
    integer(data(person, 'tribe', `registry[${key}]`), `registry[${key}].tribe`)
    if (person.tribe === tribe) personShape(person, `registry[${key}]`)
  }
  for (const [i, unit] of world.units.entries()) {
    const path = `units[${i}]`
    plain(unit, path)
    integer(data(unit, 'id', path), `${path}.id`)
    assert.ok(typeof data(unit, 'team', path) === 'string' && typeof data(unit, 'kind', path) === 'string',
      `Unsupported membership unit type: ${path}`)
    assert.ok(Number.isFinite(data(unit, 'hp', path)), `Unsupported membership hp: ${path}`)
    const inside = data(unit, 'inside', path)
    if (inside !== null) integer(inside, `${path}.inside`)
    for (const key of ['flight', 'native', 'fight', 'entry', 'builder', 'resident']) {
      const value = data(unit, key, path, true)
      if (value === undefined || value === null) continue
      plain(value, `${path}.${key}`)
      if (['fight', 'entry', 'builder', 'resident'].includes(key))
        data(value, key === 'fight' ? 'motion' : 'person', `${path}.${key}`, true)
    }
    if (Object.hasOwn(unit, 'nativeFlags7f')) {
      const value = data(unit, 'nativeFlags7f', path)
      integer(value, `${path}.nativeFlags7f`)
      assert.ok(value >= 0 && value <= 255, 'Unsupported membership flag byte')
    }
    // Only aliases actually copied into same-tribe rows need the person shape.
    const owners = Object.values(aliases(unit)).filter(Boolean)
    for (const [key, person] of world.objectCells.objects) {
      if (person.class !== 1 || person.tribe !== tribe ||
        (unit.id !== key && unit.id !== person.id && !owners.includes(person))) continue
      for (const owner of owners) personShape(owner, `${path}.alias`)
    }
  }
}
export function projectCapture(bytes, index, tribe = 2) {
  assert.ok(Buffer.isBuffer(bytes) && bytes.length <= 16 * 1024 * 1024, 'Capture byte bound')
  integer(index, 'task index'); integer(tribe, 'tribe')
  const world = deserialize(bytes)
  membershipShape(world, index, tribe)
  const task = world.campaignAIs[tribe].tasks[index]
  const people = registeredPeople(world, tribe, task)
  return { turn: world.turn, index, tribe, task: structuredClone(task), registeredPeople: people,
    state14RegistryKeys: people.filter(row => row.person.state === 14).map(row => row.registryKey),
    unlistedState14RegistryKeys: people.filter(row => row.person.state === 14 && !row.listedInTask)
      .map(row => row.registryKey),
    unmatchedAliasRegistryKeys: people.filter(row => !row.units.some(unit => unit.authoritativeAliases.length))
      .map(row => row.registryKey),
    nativeFields: { task31: null, nativePersonChainOrder: null, task26: null, task08VisitCounter: null },
    limits: 'Ordinary identity is inside this decoded graph only; original typed backing and native chain order are unproved' }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const prefix = '/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-packet-20261010/phase3-capture-run'
  const receiptPath = '/workspace/scratch/69fd8163d94e/issue248-scheduled-trace-packet-20261010/phase3-capture-command-receipt.json'
  const paths = { receipt: receiptPath, records: `${prefix}.jsonl`, summary: `${prefix}.summary.json`,
    capture: `${prefix}.completion.bin` }
  const inputs = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, readFileSync(path)]))
  const receipt = JSON.parse(inputs.receipt), summary = JSON.parse(inputs.summary)
  assert.equal(receipt.status, 'terminal'); assert.equal(receipt.exitCode, 0)
  assert.equal(receipt.inputGuardsAfter, 'passed'); assert.equal(receipt.limitFailure, null)
  for (const key of ['records', 'summary', 'capture']) {
    const name = paths[key].split('/').at(-1), bound = receipt.evidence[name]
    assert.equal(hash(inputs[key]), bound.sha256); assert.equal(inputs[key].length, bound.bytes)
  }
  assert.equal(summary.completedPositive, true); assert.equal(summary.failure, null)
  const records = inputs.records.toString().trim().split('\n').map(line => JSON.parse(line))
  const completed = records.filter(row => row.kind === 'phase3-visit' && row.outcome === 'completed-positive')
  assert.equal(completed.length, 1)
  const event = completed[0], capture = event.afterDispatch.capture
  assert.equal(capture.path, paths.capture); assert.equal(capture.sha256, hash(inputs.capture))
  assert.equal(capture.bytes, inputs.capture.length)
  const ownPath = 'qa/issue248-scheduled-trace-20261010/project-phase3.mjs'
  assert.equal(hash(readFileSync(fileURLToPath(import.meta.url))), records[0].initial.qaFiles[ownPath])
  assert.equal(receipt.sourceHead, records[0].initial.head)
  const result = { sourceHead: receipt.sourceHead, capture, inputs: Object.fromEntries(
    Object.entries(inputs).map(([key, bytes]) => [paths[key], hash(bytes)])),
    cohort: projectCapture(inputs.capture, event.afterDispatch.index) }
  assert.equal(result.cohort.turn, event.afterDispatch.turn)
  assert.deepEqual(result.cohort.task, event.afterDispatch.task)
  for (const [key, path] of Object.entries(paths)) assert.equal(hash(readFileSync(path)), hash(inputs[key]))
  const output = JSON.stringify(result, null, 2) + '\n'
  assert.ok(inputs.records.length + inputs.capture.length + Buffer.byteLength(output) <= 32 * 1024 * 1024,
    'Combined capture/records/projection byte bound')
  writeFileSync(`${prefix}.cohort.json`, output, { flag: 'wx' })
  console.log(JSON.stringify({ sourceHead: result.sourceHead, turn: result.cohort.turn,
    registeredPeople: result.cohort.registeredPeople.length,
    state14RegistryKeys: result.cohort.state14RegistryKeys,
    unlistedState14RegistryKeys: result.cohort.unlistedState14RegistryKeys,
    output: `${prefix}.cohort.json`, sha256: hash(output) }))
}
