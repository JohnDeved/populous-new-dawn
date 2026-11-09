import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { createComputerQueue, requestAttack, stepAttackTask } from '../app/computer.ts'
import { scriptValue } from '../app/popscript.ts'

// Actual complete campaign-command/target declarations and allocator/controller,
// with supplied mission, tribe, coordinate and RNG leaves. This is not a full
// world, ordinary mission, native executable or durable-checkpoint witness.
const commandSource = stripTypeScriptTypes(readFileSync(new URL('../app/campaign-command-runtime.ts', import.meta.url), 'utf8'))
const targetSource = stripTypeScriptTypes(readFileSync(new URL('../app/campaign-runtime.ts', import.meta.url), 'utf8'))
function declaration(source, name) {
  const matches = [...source.matchAll(new RegExp(`export function ${name}\\(`, 'g'))]
  assert.equal(matches.length, 1)
  const rest = source.slice(matches[0].index), end = rest.search(/\n}(?:\n|$)/)
  assert.notEqual(end, -1)
  return rest.slice(0, end + 2).replace(/^export /, '')
}
const source = [
  declaration(commandSource, 'campaignCommand'),
  declaration(targetSource, 'campaignAttackEntity'),
  declaration(targetSource, 'campaignAttackTarget'),
].join('\n')
const ports = {
  requestAttack, scriptValue,
  missionData: () => ({ level: { markers: [0, 0, 0, 0x4040] } }),
  campaignTribe: () => 2,
  campaignTeam: (_, tribe) => tribe === 0 ? 'blue' : 'yellow',
  campaignInternal: (_, id) => {
    assert.equal(id, 1223, 'only the unchanged any-building marker is resolved')
    return 0
  },
  random: w => { w.randomCalls++; return 0 },
  nativePosition: (_, u) => ({ x: u.nativeX, y: u.nativeY }),
  isShaman: u => u.kind === 'shaman',
}
const { campaignCommand, campaignAttackEntity } = new Function(...Object.keys(ports),
  `${source}\nreturn { campaignCommand, campaignAttackEntity }`)(...Object.values(ports))
const handles = [17, 65536, 0x7fffffff, 0x80000000, 0x100000000, 0x100000011, Number.MAX_SAFE_INTEGER]
function fixture(id) {
  const ai = Object.assign(createComputerQueue(), {
    states: 1 << 20, attributes: Array(48).fill(0), variables: Array(64).fill(0),
  })
  ai.attributes[25] = 1
  ai.attributes[12] = 100
  ai.attributes[28] = 25
  const target = { id, hp: 100, kind: 'shaman', team: 'blue', inside: null, nativeX: 0x2000, nativeY: 0x3000 }
  const alias = { id: 17, hp: 100, kind: 'shaman', team: 'yellow', inside: null, nativeX: 0x4000, nativeY: 0x5000 }
  const w = { ai, outcome: { level: 3 }, units: id === 17 ? [target] : [target, alias], buildings: [], randomCalls: 0 }
  const fields = Array.from({ length: 13 }, () => [0, 0])
  fields[1] = [0, 3]
  fields[3] = [2, 1223]
  fields[4] = [0, 8]
  for (const index of [5, 6, 7]) fields[index] = [2, 1224]
  for (const index of [10, 11, 12]) fields[index] = [0, -1]
  const script = { fields, codes: [], variables: [], commands: {} }
  const args = [1118, 1, 1071, 3, 4, 5, 6, 7, 1078, 9, 10, 11, 12]
  return { w, ai, target, alias, script, args, task: ai.tasks[0] }
}
function request(c) { campaignCommand(c.w, 1059, c.args, c.script) }
function controller(c) {
  return {
    staging: 0x1212,
    ready: () => true,
    activeMembers: () => 1,
    entity: id => campaignAttackEntity(c.w, id),
    tracking: () => false,
  }
}
for (const id of handles) {
  test(`campaign ATTACK retains exact selected handle ${id}`, () => {
    const c = fixture(id), before = structuredClone(c.w.units)
    request(c)
    assert.equal(c.task.entity, id)
    assert.equal(c.task.target, 0x3020)
    assert.equal(c.task.phase, 0)
    assert.equal(c.w.randomCalls, 1)
    assert.deepEqual(c.w.units, before)
    assert.deepEqual(structuredClone(c.ai), c.ai, 'the transient adapter is not saved in the task')
  })
  test(`phase9 direct-target handoff retains selected handle ${id}`, () => {
    const c = fixture(id)
    request(c)
    c.task.phase = 9 // Supplied controller entry, not a recruitment replay.
    assert.deepEqual(stepAttackTask(c.ai, 0, controller(c)), [{ kind: 'attackPerson', target: id, replace: true }])
    assert.equal(c.task.phase, 17)
    assert.equal(c.task.target, 0x3020)
    assert.equal(c.w.randomCalls, 1)
  })
  test(`phase17 tracking and loss do not resolve a truncated alias for ${id}`, () => {
    const c = fixture(id)
    request(c)
    c.task.phase = 17
    assert.deepEqual(stepAttackTask(c.ai, 0, controller(c)), [{ kind: 'attackPerson', target: id, replace: true }])
    assert.equal(c.task.phase, 17)
    c.target.hp = 0
    assert.deepEqual(stepAttackTask(c.ai, 0, controller(c)), [{ kind: 'move', target: 0x1212, replace: true }])
    assert.equal(c.task.phase, 23)
    assert.equal(c.alias.hp, 100, 'the unrelated low-word object remains untouched')
  })
}
for (const id of handles) {
  test(`raw allocator default retains its existing signed coercion for ${id}`, () => {
    const ai = createComputerQueue()
    requestAttack(ai, 0x12345, 0x101, 3, 8, [0, 100], 25, true, 1, id)
    assert.equal(ai.tasks[0].entity, id | 0)
    assert.equal(ai.tasks[0].target, 0x2345)
    assert.equal(ai.tasks[0].mode, 1)
  })
}
test('explicit identity adaptation changes no other allocator field or queue slot', () => {
  const plain = createComputerQueue(), live = createComputerQueue(), high = 0x100000011
  const args = [0x12345, 0x101, 3, 8, [0, 100, 1, 2, 3, 4, 5], 25, true, 1, high, [12, 3, 2], { staging: 0x2020, spell: 16 }]
  let calls = 0
  requestAttack(plain, ...args)
  requestAttack(live, ...args, id => { calls++; assert.equal(id, high); return id })
  assert.equal(live.tasks[0].entity, high)
  assert.equal(calls, 1)
  const expected = structuredClone(plain)
  expected.tasks[0].entity = high
  assert.deepEqual(live, expected)
})
for (const gate of ['disabled', 'cap', 'full']) {
  test(`campaign allocation ${gate} rejection still occurs before selection`, () => {
    const c = fixture(0x100000011)
    if (gate === 'disabled') c.ai.states = 0
    if (gate === 'cap') Object.assign(c.ai.tasks[0], { flags: 1, type: 20, entity: 17 })
    if (gate === 'full') c.ai.tasks.forEach(task => Object.assign(task, { flags: 1, type: 6 }))
    const before = structuredClone(c.w)
    request(c)
    assert.deepEqual(c.w, before)
  })
  test(`raw allocation ${gate} rejection does not invoke the identity adapter`, () => {
    const ai = createComputerQueue()
    if (gate === 'cap') Object.assign(ai.tasks[0], { flags: 1, type: 20, entity: 17 })
    if (gate === 'full') ai.tasks.forEach(task => Object.assign(task, { flags: 1, type: 6 }))
    const before = structuredClone(ai)
    requestAttack(ai, 0x2020, 0, 3, 8, [], 25, gate !== 'disabled', 1, 0x100000011, [], {}, () => assert.fail('rejected adapter call'))
    assert.deepEqual(ai, before)
  })
}
test('marker-only campaign ATTACK retains its zero entity and marker coordinate', () => {
  const c = fixture(0x100000011)
  c.args[2] = 1070
  c.script.fields[3] = [0, 3]
  c.script.fields[4] = [0, 999]
  c.script.fields[12] = [0, 0]
  request(c)
  assert.equal(c.task.entity, 0)
  assert.equal(c.task.target, 0x4040)
  assert.equal(c.w.randomCalls, 0)
})
