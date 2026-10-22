import test from 'node:test'
import assert from 'node:assert/strict'
import help from '../app/original-help.json' with { type: 'json' }
import { missionAllowsBuilding } from '../app/mission-data.ts'
import { createWorldState } from '../app/world-state.ts'
import {
  helpBuildingDiscoveryModels,
  readHelpBuildingKnowledge,
  readHelpInitialBuildingProfile,
} from '../app/help-building-discovery.ts'

const fields = new Map([
  [4, 'unlockedTower'], [5, 'unlockedTemple'], [6, 'unlockedSpyHut'],
  [7, 'unlockedCamp'], [8, 'unlockedFirewarriorHut'],
  [13, 'unlockedBoatHouse'], [15, 'unlockedBalloonHut'],
])
const state = patch => ({
  ...Object.fromEntries([...fields.values()].map(field => [field, false])),
  manaWorld: { playerTribe: 0 }, ...patch,
})
const profileBit = (profile, model) => profile.buildings.find(row => row.model === model).initiallyAvailable

test('building readers cover exact imported predicate arguments, not picked object models', () => {
  const topics = Object.values(help.topics).filter(topic => topic.discovery.predicate === '00425110')
  const models = [...new Set(topics.map(topic => topic.discovery.argument))].sort((a, b) => a - b)
  assert.deepEqual(helpBuildingDiscoveryModels, models)
  assert.equal(topics.length, 18)
  assert.equal(topics.filter(topic => readHelpBuildingKnowledge(state(), topic.discovery.argument).kind === 'known').length, 16)
  for (const model of [0, 2, 3, 9, 18, 31])
    assert.deepEqual(readHelpBuildingKnowledge(state(), model), { kind: 'unsupported', reason: 'not-help-building-predicate' })
})

test('each live knowledge answer reads exactly its existing unlock owner', () => {
  for (const [model, field] of fields) {
    const world = state({ [field]: true })
    for (const [other, otherField] of fields) {
      assert.deepEqual(readHelpBuildingKnowledge(world, other), {
        kind: 'known', available: other === model, source: 'browser-current-unlock', field: otherField,
      })
    }
    world[field] = false
    assert.equal(readHelpBuildingKnowledge(world, model).available, false)
    world[field] = true
    assert.equal(readHelpBuildingKnowledge(world, model).available, true)
  }
})

test('initial authored profile remains separate from current knowledge and preserves M22 Hut absence', () => {
  for (const level of [...Array.from({ length: 23 }, (_, i) => i + 1), 79]) {
    const profile = readHelpInitialBuildingProfile({ outcome: { level } })
    assert.equal(profile.kind, 'authored-initial-profile')
    assert.equal(profile.level, level)
    assert.equal(profile.player, 0)
    assert.deepEqual(profile.buildings.map(row => row.model), helpBuildingDiscoveryModels)
    for (const row of profile.buildings)
      assert.equal(row.initiallyAvailable, missionAllowsBuilding(level, row.model))
    assert.equal(profileBit(profile, 1), level !== 22)
    assert.equal(profileBit(profile, 17), ![1, 3, 4, 12, 15, 22, 79].includes(level))
    for (const model of [1, 17]) {
      const world = state({ outcome: { level }, buildings: [{ kind: 'hut' }], unlockedHut: true, unlockedGuardPost: true })
      assert.deepEqual(readHelpBuildingKnowledge(world, model), { kind: 'unsupported', reason: 'unowned-building-bit' })
    }
  }
})

test('current World initialization and cloned state use live owners, not a fresh mission header', () => {
  for (const level of [3, 8, 12, 22]) {
    const world = createWorldState(level)
    const profile = readHelpInitialBuildingProfile(world)
    for (const [model] of fields)
      assert.equal(readHelpBuildingKnowledge(world, model).available, profileBit(profile, model))
    world.unlockedTemple = !world.unlockedTemple
    const restored = structuredClone(world), before = structuredClone(restored)
    assert.equal(readHelpBuildingKnowledge(restored, 5).available, !profileBit(profile, 5))
    assert.deepEqual(restored, before)
  }
})

test('counts, affordability, pause, selected units and campaign progress cannot change a known answer', () => {
  const world = state({ unlockedCamp: true })
  world.wood = 0
  world.paused = true
  world.units = []
  world.buildings = []
  world.outcome = { level: 22, progressFlags: 0xffffffff }
  Object.freeze(world.manaWorld)
  Object.freeze(world)
  assert.equal(readHelpBuildingKnowledge(world, 7).available, true)
  assert.equal(readHelpBuildingKnowledge(world, 5).available, false)
})

test('player-0 fields never answer another player or an invalid player identity', () => {
  for (const playerTribe of [1, 2, 3])
    assert.deepEqual(readHelpBuildingKnowledge(state({ unlockedCamp: true, manaWorld: { playerTribe } }), 7),
      { kind: 'unsupported', reason: 'unowned-player' })
  for (const playerTribe of [-1, 4, 0.5, NaN, Infinity, undefined, '0'])
    assert.throws(() => readHelpBuildingKnowledge(state({ manaWorld: { playerTribe } }), 7), /Invalid current Help player/)
})

test('malformed knowledge bits and absent/malformed owned fields fail rather than defaulting to false', () => {
  for (const model of [-1, 32, 1.5, NaN, Infinity, undefined, '7'])
    assert.throws(() => readHelpBuildingKnowledge(state(), model), /Invalid native building knowledge bit/)
  for (const value of [undefined, null, 0, 1, 'true'])
    assert.throws(() => readHelpBuildingKnowledge(state({ unlockedCamp: value }), 7), /Missing owned building knowledge/)
  for (const level of [0, 24, -1, 1.5, NaN, Infinity, undefined, '1'])
    assert.throws(() => readHelpInitialBuildingProfile({ outcome: { level } }))
})

test('initial profile results are detached and cannot mutate generated header knowledge', () => {
  const profile = readHelpInitialBuildingProfile({ outcome: { level: 1 } })
  profile.buildings.find(row => row.model === 1).initiallyAvailable = false
  profile.buildings.splice(0)
  assert.equal(profileBit(readHelpInitialBuildingProfile({ outcome: { level: 1 } }), 1), true)
})
