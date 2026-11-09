import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { createComputerQueue, computerPhase, dispatchComputerTask, stepAttackTask } from '../app/computer.ts'

// Execute the complete authored task dispatcher with supplied world/campaign,
// target-collection and order-output ports. This is not imported world simulation.
const runtime = stripTypeScriptTypes(readFileSync(new URL('../app/computer-runtime.ts', import.meta.url), 'utf8'))
const orders = stripTypeScriptTypes(readFileSync(new URL('../app/person-orders.ts', import.meta.url), 'utf8'))
function declaration(source, name) {
  const pattern = new RegExp(`(?:export )?function ${name}\\(`, 'g')
  const matches = [...source.matchAll(pattern)]
  assert.equal(matches.length, 1, `one source declaration: ${name}`)
  const start = matches[0].index
  const tail = source.slice(start)
  const end = tail.search(/\n}(?:\n|$)/)
  assert.notEqual(end, -1, `complete source declaration: ${name}`)
  return tail.slice(0, end + 2).replace(/^export /, '')
}
const localSource = [
  declaration(runtime, 'computerAttackUnits'),
  declaration(runtime, 'registeredAttackPerson'),
  declaration(runtime, 'computerAttackHasOrder'),
  declaration(runtime, 'stepComputerTasks'),
  declaration(orders, 'currentPersonOrder'),
].join('\n')
const ready = runtime.match(/const computerAttackReady = [\s\S]*?(?=\nconst unsignedAttackField)/)?.[0]
assert.ok(ready, 'actual readiness declaration is present')
assert.match(localSource, /attackOrdersCurrent: target => computerAttackHasOrder\(w, index, 19, target\)/)
assert.match(localSource, /tracking: id => computerAttackHasOrder\(w, index, 28, id\)/)

function bindings() {
  const calls = []
  const ports = {
    computerPhase, dispatchComputerTask, stepAttackTask,
    missionData: () => ({ level: {} }),
    campaignTeam: () => 'yellow',
    isShaman: u => u.kind === 'shaman',
    campaignAttackEntity: w => ({ id: 90, target: w.ai.tasks[0].target }),
    computerAttackTargetsRemain: () => true,
    random: () => { throw new Error('These nonempty-target controls must not consume RNG') },
    emptyPersonOrder: () => ({}),
    writePersonOrder: (order, model, a, b) => Object.assign(order, { model, a, b }),
    appendLiveOrders: (w, units, order, replace) => {
      calls.push({ ids: units.map(u => u.id), order: { ...order }, replace })
      return { accepted: true, count: units.length }
    },
  }
  const get = new Function(...Object.keys(ports), `${localSource}\n${ready}\nreturn { stepComputerTasks, computerAttackHasOrder }`)
  return { ...get(...Object.values(ports)), calls }
}
function fixture({ alias = 'fight', matching = true, phase = 16, registered = true } = {}) {
  const ai = createComputerQueue()
  ai.constructionBase = 0x2222
  const task = ai.tasks[0]
  Object.assign(task, {
    flags: 1, type: 20, phase, target: 0x383a, origin: 0x383a,
    entity: 90, members: [10], requested: 1, damage: 0, extra: 20,
  })
  const model = phase === 17 ? 28 : 19
  const target = phase === 17 ? task.entity : task.target
  const order = good => ({ model, a: good ? target : target + 1 })
  const owner = id => ({ id: 10, immediateCommand: 0, commands: [id, 0, 0, 0, 0, 0, 0, 0], commandCursor: 0 })
  const actual = owner(1), stale = owner(2)
  const unit = { id: 10, hp: 100, team: 'yellow', kind: 'warrior', native: stale }
  if (alias === 'native') {
    unit.native = actual
    unit.entry = { person: stale }
  } else if (alias === 'fight') unit.fight = { motion: actual }
  else if (alias === 'flight') unit.flight = actual
  else unit[alias] = { person: actual }
  const w = {
    turn: 0, outcome: { level: 6 }, ai, units: [unit], buildings: [],
    objectCells: { objects: new Map(registered ? [[10, actual]] : []) },
    buildingOrders: { records: [null, order(matching), order(!matching)] },
  }
  return { w, task, unit, actual, stale, model, target, ...bindings() }
}
const aliases = ['native', 'fight', 'flight', 'entry', 'builder']
for (const alias of aliases) for (const matching of [true, false]) {
  test(`registered ${alias} owns the command observation (${matching ? 'matching' : 'different'} target)`, () => {
    const c = fixture({ alias, matching })
    const before = structuredClone(c.w)
    assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), matching)
    assert.deepEqual(c.w, before, 'observation must not mutate either owner or the world')
    assert.equal(c.w.objectCells.objects.get(10), c.actual)
  })
  test(`cached-target dispatcher uses registered ${alias} (${matching ? 'retain' : 'refresh'})`, () => {
    const c = fixture({ alias, matching })
    const before = structuredClone(c.w.buildingOrders)
    c.stepComputerTasks(c.w, 2)
    assert.equal(c.calls.length, matching ? 0 : 1)
    if (!matching) assert.deepEqual(c.calls[0], {
      ids: [10], order: { model: 19, a: c.target, b: 0x0808 }, replace: true,
    })
    assert.equal(c.task.phase, 16)
    assert.equal(c.task.retries, 0)
    assert.equal(c.w.ai.cursor, 1, 'actual queue dispatcher advances once')
    assert.deepEqual(c.w.buildingOrders, before, 'supplied output port leaves the pool untouched')
  })
}
for (const alias of ['native', 'entry', 'builder']) for (const matching of [true, false]) {
  test(`direct-target tracking uses registered ${alias} (${matching ? 'retain' : 'refresh'})`, () => {
    const c = fixture({ alias, matching, phase: 17 })
    c.stepComputerTasks(c.w, 2)
    assert.equal(c.calls.length, matching ? 0 : 1)
    if (!matching) assert.deepEqual(c.calls[0], {
      ids: [10], order: { model: 28, a: c.target, b: 0 }, replace: true,
    })
    assert.equal(c.task.phase, 17)
    assert.equal(c.task.retries, 0)
  })
}
for (const alias of ['fight', 'flight']) {
  test(`direct-target ${alias} still waits for existing readiness`, () => {
    const c = fixture({ alias, matching: false, phase: 17 })
    c.stepComputerTasks(c.w, 2)
    assert.deepEqual(c.calls, [])
    assert.equal(c.task.phase, 17)
  })
}
test('an immediate command on the registered owner still takes priority', () => {
  const c = fixture({ matching: false })
  c.actual.immediateCommand = 2
  assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), true)
  c.stepComputerTasks(c.w, 2)
  assert.deepEqual(c.calls, [])
})
test('a matching stale command cannot hide the registered owner having no command', () => {
  const c = fixture({ matching: false })
  c.actual.commands.fill(0)
  assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), false)
  c.stepComputerTasks(c.w, 2)
  assert.equal(c.calls.length, 1)
})
test('registry identity is authoritative, not alias precedence', () => {
  const c = fixture({ alias: 'native', matching: true })
  c.unit.flight = c.stale
  c.unit.fight = { motion: c.stale }
  assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), true)
})
test('unregistered worlds retain the prior native-then-fight fallback', () => {
  const c = fixture({ matching: true, registered: false })
  assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), false)
  c.unit.native = null
  assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), true)
  c.unit.fight = null
  assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), false)
})
test('an unrelated registered object does not expand the supported owner aliases', () => {
  const c = fixture({ matching: false })
  c.w.objectCells.objects.set(10, { ...c.actual })
  assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), true)
})
test('empty and dead member sets still have no current attack order', () => {
  const c = fixture()
  c.unit.hp = 0
  assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), false)
  c.task.members = []
  assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), false)
})
test('all live members must still match; mixed command semantics are unchanged', () => {
  const c = fixture()
  const p = { ...c.actual, id: 11, commands: [3, 0, 0, 0, 0, 0, 0, 0] }
  c.w.units.push({ id: 11, hp: 100, native: p })
  c.task.members.push(11)
  c.w.objectCells.objects.set(11, p)
  c.w.buildingOrders.records.push({ model: 17, a: c.target })
  assert.equal(c.computerAttackHasOrder(c.w, 0, c.model, c.target), false)
})
