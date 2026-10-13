import assert from 'node:assert/strict'
import test from 'node:test'
import { addBuilding, addUnit, createWorld, tick } from '../app/model.ts'
import { campaignRules, campaignCommand } from '../app/campaign-command-runtime.ts'
import { campaignInternal } from '../app/campaign-runtime.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { createLivePerson } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { messageStringId } from '../app/messages.ts'
import { retainFixtureUnits } from './level-start-fixture.mjs'

test('M7 economic EVERY255 runs on Chumara phase254 and510, capped at40', () => {
  const w = createWorld(7)
  const initial = w.ai.attributes[0]
  for (const turn of [253, 254, 255, 509, 510]) {
    w.turn = turn
    campaignRules(w)
    assert.equal(w.ai.attributes[0], initial + Number(turn >= 254) + Number(turn >= 510))
  }
  w.ai.attributes[0] = 40
  w.turn = 766
  campaignRules(w)
  assert.equal(w.ai.attributes[0], 40)
})

test('M7 economic building reads use live owners and consume include-incomplete once', () => {
  const w = createWorld(7)
  addBuilding(w, 'yellow', 'temple', { x: 0, z: 0 }, true)
  addBuilding(w, 'yellow', 'camp', { x: 8, z: 0 }, true)
  addBuilding(w, 'yellow', 'hut', { x: 16, z: 0 }, true, { level: 2 })
  addBuilding(w, 'yellow', 'hut', { x: 24, z: 0 }, true, { level: 3 })
  addBuilding(w, 'blue', 'camp', { x: 32, z: 0 }, false)
  addBuilding(w, 'blue', 'temple', { x: 40, z: 0 }, false)
  for (const read of [1070, 1072, 1067, 1068]) assert.equal(campaignInternal(w, read), 1)
  for (const read of [1088, 1086]) {
    assert.equal(campaignInternal(w, read), 0)
    campaignCommand(w, 1136, [])
    assert.equal(campaignInternal(w, read), 1)
    assert.equal(campaignInternal(w, read), 0)
  }
  w.turn = 254
  campaignRules(w)
  assert.equal(w.ai.attributes[2], 1)
})

test('M7 controlled school admission requires five available Braves for either school', () => {
  for (const kind of ['camp', 'temple'])
    for (const count of [4, 5, 6]) {
      const w = createWorld(7)
      retainFixtureUnits(w, u => u.team !== 'yellow' || u.kind === 'shaman')
      for (let i = 0; i < count; i++) {
        const u = addUnit(w, 'yellow', 'brave', { x: 0, z: i })
        u.native = createLivePerson(w, u)
        u.native.state = 17
      }
      const school = addBuilding(w, 'yellow', kind, { x: 0, z: 0 }, true)
      w.ai.states = 64
      w.ai.attributes[6] = kind === 'temple' ? 100 : 0
      w.ai.attributes[7] = kind === 'camp' ? 100 : 0
      for (const task of w.ai.tasks) task.flags = 0
      w.turn = 61
      stepComputerTasks(w, 2)
      const tasks = w.ai.tasks.filter(t => t.flags & 1)
      assert.equal(tasks.length, Number(count >= 5), `${kind}/${count}`)
      if (tasks.length) assert.deepEqual([tasks[0].type, tasks[0].target], [6, school.id])
    }
})

test('M7 original roster builds its settlement and retains producer history on reload', () => {
  const w = createWorld(7)
  while (w.turn < 320) tick(w, 1 / 12)
  const plans = w.buildings.filter(b => b.team === 'yellow')
  assert.equal(plans.length, 4)
  assert.equal(plans[0].kind, 'tower')
  assert.equal(plans.filter(b => b.kind === 'hut').length, 3)
  assert.equal(w.ai.producers.find(p => p.id === 1).attempts, 5)
  const replay = migrateCheckpoint(structuredClone(w))
  for (let i = 0; i < 64; i++) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
  }
  assert.deepEqual(replay, w)
})

test('M7 settlement projection leaves later raid/message51 branch unbound', () => {
  const w = createWorld(7)
  // Supplied latch would trigger the excluded raid warning; no false completion claim.
  w.ai.variables[26] = 1
  w.turn = 8190
  campaignRules(w)
  assert.equal(w.ai.variables[26], 1)
  assert.ok(!w.messages.slots.some(m => m?.stringId === messageStringId(51)))
  assert.equal(w.ai.tasks.filter(t => t.flags & 1 && t.type === 20).length, 0)
})
