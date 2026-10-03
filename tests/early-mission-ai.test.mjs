import assert from 'node:assert/strict'
import test from 'node:test'
import script from '../app/original-script-three.json' with { type: 'json' }
import { runScript, scriptState, scriptValue } from '../app/popscript.ts'
import { createWorld, tick, select, placeBuilding, command, setSelection } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

// Paired with check-native-early-mission-ai.py: same authored block and threshold cases.
test('Mission 3 periodic raid preserves native mask, strict thresholds and arguments', () => {
  const block = { ...script, codes: [12, 1003, ...script.codes.slice(796, 833), 1004, 1019] }
  for (const [turn, warriors, blue, chumara, expected] of [
    [2045, 3, 31, 26, false],
    [2046, 2, 31, 26, false],
    [2046, 3, 30, 26, false],
    [2046, 3, 31, 25, false],
    [2046, 3, 31, 26, true],
    [2047, 3, 31, 26, false],
    [4094, 3, 31, 26, true],
  ]) {
    const state = scriptState(script), calls = []
    const readInternal = id => {
      assert.ok([1153, 2, 1, 1223, 1224].includes(id))
      return { 1153: warriors, 2: blue, 1: chumara, 1223: 0, 1224: 0 }[id]
    }
    runScript(block, state, { turn, tribe: 2, readInternal, command: (opcode, args) => {
      calls.push({ opcode, targetTribe: args[0], targetType: args[2], attackType: args[8],
        values: [1, 3, 4, 5, 6, 7, 9, 10, 11, 12].map(i => scriptValue(script, state, args[i], readInternal)) })
    } })
    assert.deepEqual(calls, expected ? [{ opcode: 1059, targetTribe: 1118, targetType: 1071,
      attackType: 1078, values: [3, 0, 8, 0, 0, 0, 0, -1, -1, -1] }] : [], `turn ${turn}`)
  }
})

test('Mission 3 naturally grows both tribes and recruits the authored three-Brave raid', () => {
  const w = createWorld(3)
  const living = team => w.units.filter(unit => unit.team === team && unit.hp > 0)
  const until = (predicate, limit = 20000) => {
    for (let i = 0; i < limit && !predicate(); i++) tick(w, 1 / 12)
    assert.ok(predicate(), `Condition not reached at turn ${w.turn}`)
  }
  // All entities and counters come from the shipped mission, births and player commands.
  until(() => living('blue').length >= 6)
  for (const [kind, x, z] of [['hut', 26, 70], ['hut', 42, 70], ['hut', 22, 78], ['camp', 42, 78]]) {
    select(w, 'brave')
    assert.ok(placeBuilding(w, kind, { x, z }))
    const building = w.buildings.findLast(b => b.team === 'blue' && b.kind === kind)
    until(() => building.progress === 1)
    until(() => !living('blue').some(unit => unit.builder))
  }
  until(() => living('blue').length > 30, 50000)
  assert.ok(living('yellow').length > 25)
  assert.ok(!w.ai.tasks.some(task => task.flags & 1 && task.type === 20))
  const camp = w.buildings.find(b => b.team === 'blue' && b.kind === 'camp')
  setSelection(w, living('blue').filter(unit => unit.kind === 'brave').slice(0, 3).map(unit => unit.id))
  assert.ok(command(w, camp))
  until(() => living('blue').filter(unit => unit.kind === 'warrior').length >= 3)
  until(() => w.ai.tasks.some(task => task.flags & 1 && task.type === 20), 2048)
  const raid = w.ai.tasks.find(task => task.flags & 1 && task.type === 20)
  assert.equal((w.turn - 1 + 2) & 2047, 0)
  assert.deepEqual({ requested: raid.requested, mode: raid.mode, damage: raid.extra,
    spells: raid.spells, quotas: raid.quotas }, {
    requested: 3, mode: 0, damage: 8, spells: [0, 0, 0], quotas: [100, 0, 0, 0, 0, 0],
  })
  assert.ok(w.buildings.some(b => b.id === raid.entity && b.team === 'blue'))
  const restored = migrateCheckpoint(structuredClone(w))
  assert.deepEqual(restored.ai.tasks, w.ai.tasks)
  for (let i = 0; i < 100; i++) { tick(w, 1 / 12); tick(restored, 1 / 12) }
  assert.deepEqual(restored.ai.tasks, w.ai.tasks)
  assert.equal(restored.randomSeed, w.randomSeed)
  assert.equal(w.ai.tasks.filter(task => task.flags & 1 && task.type === 20).length, 1)
  assert.equal(raid.members.length, 3)
  const members = raid.members.map(id => w.units.find(unit => unit.id === id))
  assert.ok(members.every(unit => unit?.team === 'yellow' && unit.kind === 'brave'))
  assert.ok(members.some(unit => unit.native && currentPersonOrder(w.buildingOrders, unit.native)?.model === 3))
  const killsBefore = w.killCredits[0][2]
  until(() => members.some(unit => unit.fight || unit.fighting || unit.hp < 50), 4000)
  until(() => !(raid.flags & 1), 4000)
  assert.ok(members.every(unit => unit.hp <= 0))
  assert.equal(w.killCredits[0][2] - killsBefore, 3)
})
