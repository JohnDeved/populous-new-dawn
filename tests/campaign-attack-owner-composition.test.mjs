import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import * as orders from '../app/person-orders.ts'
import * as cells from '../app/object-cells.ts'
import { resetPersonMotion, defaultPersonState } from '../app/person-state.ts'
import { createComputerQueue, computerPhase, dispatchComputerTask, requestAttack, stepAttackTask } from '../app/computer.ts'
import { scriptValue } from '../app/popscript.ts'
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
function staleSnapshots(c) {
  return Object.entries(c.owners).filter(([name]) => name !== c.alias).map(([name, p]) => [name, structuredClone(p)])
}
function unchangedStale(c, snapshots) {
  for (const [name, snapshot] of snapshots) assert.deepEqual(c.owners[name], snapshot, `stale ${name} untouched`)
}

// This crosses the actual campaign ATTACK allocator, target lookup, controller,
// dispatcher, writer, order pool and registered owner. Mission identity,
// coordinates, RNG leaves, member admission and phase entry remain supplied.
// It is not a campaign VM, native execution, checkpoint or complete live import.
const campaign = stripTypeScriptTypes(readFileSync(new URL('../app/campaign-command-runtime.ts', import.meta.url), 'utf8'))
const targets = stripTypeScriptTypes(readFileSync(new URL('../app/campaign-runtime.ts', import.meta.url), 'utf8'))
const computer = stripTypeScriptTypes(readFileSync(new URL('../app/computer-runtime.ts', import.meta.url), 'utf8'))
const ready = computer.match(/const computerAttackReady = [\s\S]*?(?=\nconst unsignedAttackField)/)?.[0]
assert.ok(ready)
function campaignRuntime(c) {
  const ports = {
    requestAttack, scriptValue, computerPhase, dispatchComputerTask, stepAttackTask,
    currentPersonOrder: orders.currentPersonOrder, emptyPersonOrder: orders.emptyPersonOrder,
    writePersonOrder: writeLivePersonOrder, appendLiveOrders: c.appendLiveOrders,
    missionData: () => ({ level: { markers: [0, 0, 0, 0x4040] } }),
    campaignTribe: () => 2,
    campaignTeam: (_w, tribe) => tribe === 0 ? 'blue' : 'green',
    campaignInternal: (_w, id) => {
      assert.equal(id, 1223, 'only the existing any-building field is requested')
      return 0
    },
    nativePosition: (_w, unit) => ({ x: unit.nativeX, y: unit.nativeY }),
    isShaman: unit => unit.kind === 'shaman',
    random: w => { w.randomCalls++; return 0 },
    computerAttackTargetsRemain: () => true,
  }
  const actual = [
    declaration(campaign, 'campaignCommand'),
    ...['campaignAttackEntity', 'campaignAttackTarget'].map(name => declaration(targets, name)),
    ...['computerAttackUnits', 'registeredAttackPerson', 'computerAttackHasOrder', 'stepComputerTasks'].map(name => declaration(computer, name)),
    ready,
  ].join('\n')
  return new Function(...Object.keys(ports), `${actual}\nreturn { campaignCommand, stepComputerTasks }`)(...Object.values(ports))
}
function attackFixture(alias, targetId) {
  const c = fixture({ alias })
  c.unit.flight = undefined
  c.unit.fight = undefined
  c.w.land.flags = new Uint16Array(16384)
  c.w.land.buildingIds = new Uint16Array(16384)
  c.w.ai = Object.assign(createComputerQueue(), {
    states: 1 << 20, attributes: Array(48).fill(0), variables: Array(64).fill(0),
    constructionBase: 0x2222,
  })
  c.w.ai.attributes[25] = 1
  c.w.ai.attributes[12] = 100
  c.w.ai.attributes[28] = 25
  c.w.outcome = { level: 3 }
  c.w.turn = 0
  c.w.randomCalls = 0
  c.target = { id: targetId, hp: 100, kind: 'shaman', team: 'blue', inside: null, nativeX: 0x2000, nativeY: 0x3000 }
  c.decoy = { id: 17, hp: 100, kind: 'shaman', team: 'yellow', inside: null, nativeX: 0x4000, nativeY: 0x5000 }
  c.w.units.push(c.target)
  if (targetId !== 17) c.w.units.push(c.decoy)
  const fields = Array.from({ length: 13 }, () => [0, 0])
  fields[1] = [0, 3]
  fields[3] = [2, 1223]
  fields[4] = [0, 8]
  for (const index of [5, 6, 7]) fields[index] = [2, 1224]
  for (const index of [10, 11, 12]) fields[index] = [0, -1]
  c.script = { fields, codes: [], variables: [], commands: {} }
  c.args = [1118, 1, 1071, 3, 4, 5, 6, 7, 1078, 9, 10, 11, 12]
  return Object.assign(c, campaignRuntime(c), { task: c.w.ai.tasks[0] })
}
const handles = [17, 65536, 0x7fffffff, 0x80000000, 0x100000000, 0x100000011, Number.MAX_SAFE_INTEGER]
for (const alias of ['entry', 'builder']) for (const id of handles) for (const phase of [9, 16, 17]) {
  test(`campaign handle ${id} attaches to registered ${alias} through phase${phase} and remains observed`, () => {
    const c = attackFixture(alias, id), stale = staleSnapshots(c)
    const decoy = structuredClone(c.decoy), heads = [...c.w.objectCells.heads]
    c.campaignCommand(c.w, 1059, c.args, c.script)
    assert.equal(c.task.entity, id, 'the actual allocator retains the selected handle')
    assert.equal(c.task.target, 0x3020)
    assert.equal(c.task.phase, 0)
    assert.equal(c.w.randomCalls, 1, 'only actual target selection calls the supplied RNG leaf')
    // This is a supplied post-recruitment boundary, not evidence of admission or
    // phase reachability. Every later dispatch and allocation is actual code.
    Object.assign(c.task, { phase, members: [10], origin: 0x3020 })
    const oldOrder = c.actual.commands[0]
    c.stepComputerTasks(c.w, 2)
    const order = orders.currentPersonOrder(c.w.buildingOrders, c.actual)
    assert.equal(order?.model, phase === 16 ? 19 : 28)
    assert.equal(order?.a, phase === 16 ? 0x3020 : id)
    assert.equal(order?.references, 1)
    assert.equal(c.w.buildingOrders.records[oldOrder].references, 0)
    assert.equal(c.w.objectCells.objects.get(10), c.actual)
    assert.deepEqual([...c.w.objectCells.heads], heads)
    assert.equal(c.task.phase, phase === 9 ? 17 : phase)
    assert.equal(c.task.retries, 0)
    if (phase !== 16) assert.equal(c.unit.target, id)
    unchangedStale(c, stale)
    // Area attacks leave the stale native alias in this supplied state29 case.
    // Direct attacks adopt the registered owner through actual adoptLiveOrders.
    if (phase === 16) assert.equal(c.unit.native, c.owners.native)
    else assert.equal(c.unit.native, c.actual)
    const pool = structuredClone(c.w.buildingOrders)
    const person = structuredClone(c.actual)
    c.w.ai.cursor = 0
    c.stepComputerTasks(c.w, 2)
    assert.ok(isDeepStrictEqual(c.w.buildingOrders, pool), 'next visit observes the allocation without replacing it')
    assert.deepEqual(c.actual, person)
    assert.equal(c.task.entity, id)
    assert.equal(c.task.retries, 0)
    assert.equal(c.w.ai.cursor, 1)
    assert.equal(c.w.randomCalls, 1)
    // Coordinate changes affect an area command but not a direct identity.
    c.target.nativeX = 0x4200
    c.target.nativeY = 0x5400
    c.w.ai.cursor = 0
    c.stepComputerTasks(c.w, 2)
    assert.equal(c.task.target, 0x5442)
    assert.equal(c.task.entity, id)
    if (phase === 16) {
      assert.equal(orders.currentPersonOrder(c.w.buildingOrders, c.actual)?.a, 0x5442)
      assert.equal(c.w.buildingOrders.cursor, pool.cursor + 1, 'one actual replacement follows target movement')
    } else {
      assert.ok(isDeepStrictEqual(c.w.buildingOrders, pool), 'moving direct target retains its exact identity order')
      c.target.hp = 0
      c.w.ai.cursor = 0
      c.stepComputerTasks(c.w, 2)
      const retreat = orders.currentPersonOrder(c.w.buildingOrders, c.actual)
      assert.equal(retreat?.model, 3, 'target loss attaches the real staging order')
      assert.equal(retreat?.a, 0x2280)
      assert.equal(retreat?.b, 0x2280)
      assert.equal(retreat?.references, 1)
      assert.equal(c.task.phase, 23)
      assert.equal(c.unit.target, null)
      assert.equal(c.w.buildingOrders.cursor, pool.cursor + 1)
    }
    assert.deepEqual(c.decoy, decoy, 'an unrelated low-word target is never substituted or mutated')
    unchangedStale(c, stale)
    assert.equal(c.w.objectCells.objects.get(10), c.actual)
    assert.deepEqual([...c.w.objectCells.heads], heads)
    assert.equal(c.w.randomCalls, 1)
  })
}
