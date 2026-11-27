import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { campaignCommand, campaignRules } from '../app/campaign-command-runtime.ts'
import { missionData } from '../app/mission-data.ts'
import { nativeCellPoint } from '../app/world-coordinates.ts'
import script from '../app/original-script-seven.json' with { type: 'json' }

const args = script.codes.slice(883, 896)
const raids = w => w.ai.tasks.filter(t => (t.flags & 1) && t.type === 20)

function fixture() {
  const w = createWorld(7), home = w.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  const p = nativeCellPoint(missionData(7).level.markers[4])
  for (let i = 0; i < 5; i++) addUnit(w, 'yellow', 'warrior', home)
  for (let i = 0; i < 6; i++) addUnit(w, 'blue', 'brave', p)
  return w
}

test('exact marker4 signature keeps Lightning and authored cap three', () => {
  const w = createWorld(7)
  w.ai.variables[18] = 6
  campaignCommand(w, 1059, args, script)
  assert.equal(raids(w).length, 1)
  assert.deepEqual(raids(w)[0].spells, [3, 0, 0])
  for (let i = 0; i < 4; i++) campaignCommand(w, 1059, args, script)
  assert.equal(raids(w).length, 3)
})

test('original marker4 cadence dispatches through rules and restores quotas', () => {
  const w = fixture()
  w.turn = 922
  campaignRules(w)
  assert.equal(raids(w).length, 0)
  w.turn = 923
  campaignRules(w)
  assert.equal(raids(w).length, 1)
  assert.deepEqual(raids(w)[0].quotas, [0, 50, 50, 0, 0, 100])
  assert.equal(w.ai.attributes[12], 0)
  assert.equal(w.ai.attributes[13], 100)
})

test('disabled attack state rejects without RNG changes', () => {
  const w = createWorld(7)
  w.ai.variables[18] = 6
  w.ai.states &= ~(1 << 20)
  const seed = w.randomState
  campaignCommand(w, 1059, args, script)
  assert.equal(raids(w).length, 0)
  assert.equal(w.randomState, seed)
})

test('all slots occupied and authored cap reject without touching tasks or RNG', () => {
  for (const mode of ['full', 'cap']) {
    const w = createWorld(7)
    w.ai.variables[18] = 6
    for (let i = 0; i < (mode === 'full' ? 10 : 3); i++)
      Object.assign(w.ai.tasks[i], { flags: 1, type: mode === 'full' ? 1 : 20 })
    const before = structuredClone(w.ai.tasks), seed = w.randomState
    campaignCommand(w, 1059, args, script)
    assert.deepEqual(w.ai.tasks, before)
    assert.equal(w.randomState, seed)
  }
})

test('other marker signatures stay unsupported', () => {
  const w = createWorld(7)
  w.ai.variables[18] = 6
  const other = [...args]
  other[3] = 22 // original literal marker1
  assert.throws(() => campaignCommand(w, 1059, other, script), /Unsupported computer attack/)
})

test('ordinary tick dispatch recruits the authored mix and checkpoints outbound movement', () => {
  const w = createWorld(7), home = w.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
  // Supplied trained roster and Blue incursion, not naturally earned training.
  for (let i = 0; i < 8; i++) {
    addUnit(w, 'yellow', 'warrior', home)
    addUnit(w, 'yellow', 'preacher', home)
  }
  for (let i = 0; i < 6; i++) addUnit(w, 'blue', 'brave', nativeCellPoint(missionData(7).level.markers[4]))
  w.turn = 922
  for (let i = 0; i < 21; i++) tick(w, 1 / 12)
  const task = raids(w)[0]
  assert.ok(task)
  assert.equal(task.phase, 10)
  assert.deepEqual(task.spells, [3, 0, 0])
  const cohort = task.members.map(id => w.units.find(u => u.id === id))
  assert.equal(cohort.filter(u => u.kind === 'warrior').length, 3)
  assert.equal(cohort.filter(u => u.kind === 'preacher').length, 3)
  assert.equal(cohort.filter(u => u.kind === 'shaman').length, 1)
  const replay = migrateCheckpoint(structuredClone(w))
  for (let i = 0; i < 24; i++) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, w)
  }
})

test('four Warriors or equal local counts do not dispatch', () => {
  for (const mode of ['warriors', 'equal']) {
    const w = createWorld(7), home = w.units.find(u => u.team === 'yellow' && u.kind === 'shaman')
    const point = nativeCellPoint(missionData(7).level.markers[4])
    for (let i = 0; i < (mode === 'warriors' ? 4 : 5); i++) addUnit(w, 'yellow', 'warrior', home)
    for (let i = 0; i < 6; i++) {
      addUnit(w, 'blue', 'brave', point)
      if (mode === 'equal') addUnit(w, 'yellow', 'brave', point)
    }
    w.turn = 923
    campaignRules(w)
    assert.equal(raids(w).length, 0)
  }
})
