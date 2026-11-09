import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import * as orders from '../app/person-orders.ts'
import * as cells from '../app/object-cells.ts'
import { resetPersonMotion, defaultPersonState } from '../app/person-state.ts'
import { createComputerQueue, computerPhase, dispatchComputerTask, stepAttackTask } from '../app/computer.ts'
import { writeLivePersonOrder } from '../app/live-person-order.ts'

// Execute complete maintained issuance, adoption and registry declarations with
// real order pools/cell chains. State initialization and work effects are supplied
// observation ports, not ordinary simulation or native execution.
const movement = stripTypeScriptTypes(readFileSync(new URL('../app/live-movement.ts', import.meta.url), 'utf8'))
const people = stripTypeScriptTypes(readFileSync(new URL('../app/live-people.ts', import.meta.url), 'utf8'))
function declaration(source, name) {
  const matches = [...source.matchAll(new RegExp(`(?:export )?function ${name}\\(`, 'g'))]
  assert.equal(matches.length, 1, `one maintained declaration: ${name}`)
  const tail = source.slice(matches[0].index)
  const end = tail.search(/\n}(?:\n|$)/)
  assert.notEqual(end, -1, `complete maintained declaration: ${name}`)
  return tail.slice(0, end + 2).replace(/^export /, '')
}
const source = [
  ...['appendLiveOrders', 'appendLivePlayerOrders', 'replaceLiveTrainingOrders', 'issueLiveOrders', 'adoptLiveOrders'].map(name => declaration(movement, name)),
  declaration(people, 'registerLivePerson'),
  movement.match(/const personSource = [\s\S]*?(?=\n\n)/)?.[0],
].join('\n')
assert.match(source, /const personSource =/)
const aliases = ['flight', 'fight', 'native', 'entry', 'builder']
const unexpected = label => () => { throw new Error(`Unexpected supplied boundary: ${label}`) }
function runtime() {
  const effects = []
  const ports = {
    ...orders, ...cells, resetPersonMotion, defaultPersonState,
    createLivePerson: unexpected('new person'),
    orderEffects: () => Object.fromEntries(['stopWork', 'releaseSpell', 'deleteObject', 'releaseFight'].map(name => [name, (...args) => effects.push({ name, args })])),
    releasePreacherVictims: (_w, p, radius) => effects.push({ name: 'preacher', args: [p, radius] }),
    initializeBuildingPerson: (_w, p) => effects.push({ name: 'initializeBuilding', args: [p] }),
    changeLivePersonState: (_w, u, state, p) => effects.push({ name: 'initializePerson', args: [p, u, state] }),
    clearTaskBindings: (_w, u) => effects.push({ name: 'clearTask', args: [u] }),
    cancelBuildingEntry: unexpected('entry cancellation'),
    releasePersonRoute: unexpected('route release'),
    clearLivePath: unexpected('path clear'),
    liveBuildingShape: unexpected('building shape'),
    buildingOutsidePoint: unexpected('building outside'),
    unsupported: unexpected('unsupported command'),
  }
  return { ...new Function(...Object.keys(ports), `${source}\nreturn { appendLiveOrders, appendLivePlayerOrders, replaceLiveTrainingOrders, registerLivePerson }`)(...Object.values(ports)), effects }
}
function fixture({ alias = 'entry', id = 10, state = 29, registered = true } = {}) {
  const api = runtime()
  const w = {
    objectCells: cells.createObjectCells(), buildingOrders: orders.createPersonOrderPool(),
    land: { categories: new Uint8Array(16384) }, manaWorld: { gameFlags: 0 }, buildings: [],
  }
  const unit = { id, hp: 100, team: 'green', kind: 'warrior', work: 44, resident: {}, vault: null }
  const owners = Object.fromEntries(aliases.map((name, i) => {
    const p = {
      id, model: 3, tribe: 3, state, substate: 0, x: 0x3800, y: 0x3800, h: 100,
      flags2: 0, flags3: 0, flags4: 0, assignment: 0, selectionFlags: 0,
      commands: [i + 1, 0, 0, 0, 0, 0, 0, 0], commandCursor: 0, immediateCommand: 0,
      orderLocation: 0, commandStatus: 0, workTarget: 0,
      cellNext: 0, cellPrevious: 0, displacement: { x: 0, y: 0, h: 0 },
      motionTimer: 8, motionMode: 2,
    }
    Object.assign(w.buildingOrders.records[i + 1], { model: 28, a: 200 + i, references: 1 })
    return [name, p]
  }))
  w.buildingOrders.active = aliases.length
  w.buildingOrders.cursor = 20
  for (const name of aliases) {
    if (name === 'fight') unit.fight = { motion: owners[name] }
    else if (name === 'entry' || name === 'builder') unit[name] = { person: owners[name] }
    else unit[name] = owners[name]
  }
  const actual = owners[alias]
  if (registered) api.registerLivePerson(w, actual)
  w.units = [unit]
  return { ...api, w, unit, actual, owners, alias }
}
const command = model => ({ ...orders.emptyPersonOrder(), model, a: model === 28 ? 65570 : 0x383a, b: model === 19 ? 0x0808 : 0 })
function staleSnapshots(c) {
  return Object.entries(c.owners).filter(([name]) => name !== c.alias).map(([name, p]) => [name, structuredClone(p)])
}
function unchangedStale(c, snapshots) {
  for (const [name, snapshot] of snapshots) assert.deepEqual(c.owners[name], snapshot, `stale ${name} untouched`)
}
for (const alias of aliases) for (const model of [19, 28]) for (const replace of [false, true]) {
  test(`${replace ? 'replace' : 'append'} command ${model} uses registered ${alias}`, () => {
    const c = fixture({ alias }), snapshots = staleSnapshots(c), old = c.actual.commands[0]
    const chain = [...c.w.objectCells.heads]
    const result = c.appendLiveOrders(c.w, [c.unit], command(model), replace)
    assert.deepEqual(result, { accepted: true, count: 1 })
    assert.equal(c.w.objectCells.objects.get(c.unit.id), c.actual, 'registry retains exact actual owner')
    assert.deepEqual([...c.w.objectCells.heads], chain, 'no replacement cell splice')
    const added = c.w.buildingOrders.records[20]
    assert.equal(added.model, model)
    assert.equal(added.a, command(model).a)
    assert.equal(added.b, command(model).b)
    assert.equal(added.references, 1)
    assert.ok(c.actual.commands.includes(20), 'new allocation attaches to actual person')
    assert.equal(c.w.buildingOrders.records[old].references, replace ? 0 : 1)
    assert.equal(c.w.buildingOrders.active, replace ? 5 : 6)
    unchangedStale(c, snapshots)
  })
}
for (const alias of ['native', 'entry', 'builder']) {
  test(`stale retained aliases do not suppress ${alias} adoption`, () => {
    const c = fixture({ alias, state: 10 }), snapshots = staleSnapshots(c)
    c.appendLiveOrders(c.w, [c.unit], command(28), true)
    assert.equal(c.unit.native, c.actual)
    assert.equal(c.unit.entry, undefined)
    assert.equal(c.w.objectCells.objects.get(c.unit.id), c.actual)
    assert.equal(c.actual.motionTimer, 8, 'direct-target AI path does not restart motion')
    unchangedStale(c, snapshots)
  })
}
for (const alias of ['flight', 'fight']) {
  test(`actual retained ${alias} is not adopted or restarted`, () => {
    const c = fixture({ alias, state: 10 }), native = c.unit.native, entry = c.unit.entry
    c.appendLiveOrders(c.w, [c.unit], command(28), true)
    assert.equal(c.unit.native, native)
    assert.equal(c.unit.entry, entry)
    assert.equal(c.actual.motionTimer, 8)
    assert.equal(c.w.objectCells.objects.get(c.unit.id), c.actual)
  })
}
for (const alias of aliases) {
  test(`training replacement retains existing registered ${alias} behavior`, () => {
    const c = fixture({ alias }), snapshots = staleSnapshots(c)
    const result = c.replaceLiveTrainingOrders(c.w, [c.unit], command(28))
    assert.deepEqual(result, { accepted: true, count: 1 })
    assert.equal(c.w.objectCells.objects.get(c.unit.id), c.actual)
    assert.equal(orders.currentPersonOrder(c.w.buildingOrders, c.actual)?.a, 65570)
    unchangedStale(c, snapshots)
  })
}
test('normal player direct-target restart uses the registered person', () => {
  const c = fixture({ alias: 'entry', state: 10 }), snapshots = staleSnapshots(c)
  c.appendLivePlayerOrders(c.w, [c.unit], command(28), true)
  assert.equal(c.actual.motionTimer, 0)
  assert.equal(c.actual.motionMode, 0)
  assert.equal(c.unit.native, c.actual)
  assert.equal(c.unit.entry, undefined)
  assert.equal(c.effects.find(e => e.name === 'initializeBuilding')?.args[0], c.actual)
  unchangedStale(c, snapshots)
})
test('unregistered and unrelated registry values preserve historical alias fallback', () => {
  for (const unrelated of [false, true]) {
    const c = fixture({ registered: false })
    if (unrelated) cells.setCellObject(c.w.objectCells, c.unit.id, { id: 10, flags2: 0 })
    c.appendLiveOrders(c.w, [c.unit], command(28), true)
    assert.equal(c.w.objectCells.objects.get(c.unit.id), c.owners.flight)
    assert.equal(orders.currentPersonOrder(c.w.buildingOrders, c.owners.flight)?.a, 65570)
    assert.equal(c.owners.entry.commands[0], 4)
  }
})
test('non-player and training fallback keep their different historical orders', () => {
  for (const training of [false, true]) {
    const c = fixture({ registered: false })
    c.unit.flight = undefined
    c.unit.fight = undefined
    const expected = training ? c.owners.entry : c.owners.native
    if (training) c.replaceLiveTrainingOrders(c.w, [c.unit], command(28))
    else c.appendLiveOrders(c.w, [c.unit], command(28), true)
    assert.equal(c.w.objectCells.objects.get(c.unit.id), expected)
    assert.equal(orders.currentPersonOrder(c.w.buildingOrders, expected)?.a, 65570)
  }
})
test('full queue replaces only the actual immediate slot and reference', () => {
  const c = fixture({ alias: 'builder' }), snapshots = staleSnapshots(c)
  c.actual.commands.fill(5)
  c.w.buildingOrders.records[5].references = 8
  c.actual.immediateCommand = 6
  Object.assign(c.w.buildingOrders.records[6], { model: 28, a: 333, references: 1 })
  c.w.buildingOrders.active++
  c.appendLiveOrders(c.w, [c.unit], command(28), false)
  assert.equal(c.actual.immediateCommand, 20)
  assert.equal(c.w.buildingOrders.records[6].references, 0)
  assert.equal(c.w.buildingOrders.records[5].references, 8)
  unchangedStale(c, snapshots)
})
test('pool exhaustion preserves actual and stale commands without replacing registry', () => {
  const c = fixture({ alias: 'entry' }), snapshots = staleSnapshots(c)
  for (const record of c.w.buildingOrders.records) record.references = 1
  c.w.buildingOrders.active = 799
  const commands = [...c.actual.commands], records = structuredClone(c.w.buildingOrders.records)
  assert.deepEqual(c.appendLiveOrders(c.w, [c.unit], command(28), true), { accepted: false, count: 0 })
  assert.equal(c.w.objectCells.objects.get(c.unit.id), c.actual)
  assert.deepEqual(c.actual.commands, commands)
  assert.deepEqual(c.w.buildingOrders.records, records)
  unchangedStale(c, snapshots)
})
test('registered owner is resolved afresh after an alias ownership transition', () => {
  const c = fixture({ alias: 'entry' })
  c.appendLiveOrders(c.w, [c.unit], command(19), true)
  assert.equal(orders.currentPersonOrder(c.w.buildingOrders, c.owners.entry)?.model, 19)
  c.registerLivePerson(c.w, c.owners.builder)
  c.appendLiveOrders(c.w, [c.unit], command(28), true)
  assert.equal(c.w.objectCells.objects.get(c.unit.id), c.owners.builder)
  assert.equal(orders.currentPersonOrder(c.w.buildingOrders, c.owners.builder)?.model, 28)
  assert.equal(orders.currentPersonOrder(c.w.buildingOrders, c.owners.entry)?.model, 19)
})

test('one shared allocation attaches to both exact registered group members', () => {
  const c = fixture({ alias: 'entry' }), snapshots = staleSnapshots(c)
  const second = { ...structuredClone(c.actual), id: 11, commands: Array(8).fill(0), flags2: 0, cellNext: 0, cellPrevious: 0 }
  const stale = { ...structuredClone(second), commands: Array(8).fill(0) }
  const unit = { id: 11, native: stale, builder: { person: second } }
  c.registerLivePerson(c.w, second)
  c.w.units.push(unit)
  assert.deepEqual(c.appendLiveOrders(c.w, c.w.units, command(19), true), { accepted: true, count: 2 })
  assert.equal(c.actual.commands[0], 20)
  assert.equal(second.commands[0], 20)
  assert.equal(c.w.buildingOrders.records[20].references, 2)
  assert.equal(c.w.buildingOrders.active, 5)
  assert.equal(c.w.objectCells.objects.get(10), c.actual)
  assert.equal(c.w.objectCells.objects.get(11), second)
  assert.deepEqual(stale.commands, Array(8).fill(0))
  unchangedStale(c, snapshots)
})
test('eligibility checks the registered owner rather than an eligible stale alias', () => {
  const c = fixture({ alias: 'builder' }), snapshots = staleSnapshots(c)
  c.actual.model = Array.from({ length: 9 }, (_, i) => i).find(model => !orders.acceptsPersonOrder({ model, flags4: 0 }, 28))
  assert.ok(c.actual.model !== undefined)
  const previous = [...c.actual.commands]
  assert.deepEqual(c.appendLiveOrders(c.w, [c.unit], command(28), true), { accepted: true, count: 0 })
  assert.equal(c.w.objectCells.objects.get(10), c.actual)
  assert.deepEqual(c.actual.commands, previous)
  assert.equal(c.w.buildingOrders.records[20].references, 0)
  unchangedStale(c, snapshots)
})
test('replacement releases conversion victims through the selected actual owner port', () => {
  const c = fixture({ alias: 'entry' }), snapshots = staleSnapshots(c)
  c.w.buildingOrders.records[c.actual.commands[0]].model = 17
  c.actual.commandAux = 7
  c.appendLiveOrders(c.w, [c.unit], command(28), true)
  const effect = c.effects.find(e => e.name === 'preacher')
  assert.equal(effect?.args[0], c.actual)
  assert.equal(effect?.args[1], 7)
  unchangedStale(c, snapshots)
})

const computer = stripTypeScriptTypes(readFileSync(new URL('../app/computer-runtime.ts', import.meta.url), 'utf8'))
const dispatcherSource = ['computerAttackUnits', 'registeredAttackPerson', 'computerAttackHasOrder', 'stepComputerTasks'].map(name => declaration(computer, name)).join('\n')
const ready = computer.match(/const computerAttackReady = [\s\S]*?(?=\nconst unsignedAttackField)/)?.[0]
assert.ok(ready)
function dispatcher(c) {
  const ports = {
    computerPhase, dispatchComputerTask, stepAttackTask,
    currentPersonOrder: orders.currentPersonOrder, emptyPersonOrder: orders.emptyPersonOrder,
    writePersonOrder: writeLivePersonOrder,
    missionData: () => ({ level: {} }), campaignTeam: () => 'green',
    isShaman: u => u.kind === 'shaman',
    campaignAttackEntity: w => ({ id: w.ai.tasks[0].entity, target: w.ai.tasks[0].target }),
    computerAttackTargetsRemain: () => true,
    random: unexpected('nonempty raid RNG'),
    appendLiveOrders: c.appendLiveOrders,
  }
  return new Function(...Object.keys(ports), `${dispatcherSource}\n${ready}\nreturn stepComputerTasks`)(...Object.values(ports))
}
for (const alias of ['entry', 'builder']) for (const phase of [16, 17]) {
  test(`actual phase ${phase} dispatcher attaches its replacement to registered ${alias}`, () => {
    const c = fixture({ alias }), snapshots = staleSnapshots(c)
    // Phase17's unchanged readiness requires no flight/fight adapter. Both
    // actual and stale orders miss this target, so main's observer requests it.
    c.unit.flight = undefined
    c.unit.fight = undefined
    c.w.ai = createComputerQueue()
    c.w.ai.constructionBase = 0x2222
    c.w.outcome = { level: 6 }
    c.w.turn = 0
    Object.assign(c.w.ai.tasks[0], { flags: 1, type: 20, phase, target: 0x383a, origin: 0x383a, entity: 65570, members: [10], requested: 1, damage: 0, extra: 20 })
    dispatcher(c)(c.w, 2)
    const result = orders.currentPersonOrder(c.w.buildingOrders, c.actual)
    assert.equal(result?.model, phase === 16 ? 19 : 28)
    assert.equal(result?.a, phase === 16 ? 0x383a : 65570)
    assert.equal(result?.references, 1)
    assert.equal(c.w.objectCells.objects.get(10), c.actual)
    assert.equal(c.w.ai.tasks[0].phase, phase)
    assert.equal(c.w.ai.tasks[0].retries, 0)
    assert.equal(c.w.ai.cursor, 1)
    if (phase === 17) assert.equal(c.unit.target, 65570)
    unchangedStale(c, snapshots)
  })
}
