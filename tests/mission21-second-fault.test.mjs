import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, command, placeBuilding, select, setSelection, tick } from '../app/model.ts'
import { rightClickSpellCharging } from '../app/spell-charging.ts'
import { SPELLS } from '../app/world-rules.ts'
import { markerHeight } from '../app/campaign-runtime.ts'
import { createGameStore } from '../app/game-store.ts'
const advance = (w, turn) => {
  while (w.turn < turn) tick(w, 1 / 12)
}
const until = (w, predicate, deadline) => {
  while (!predicate() && w.turn < deadline) tick(w, 1 / 12)
  assert.ok(predicate(), `natural route missed turn ${deadline}`)
}
const focus = (w, id) =>
  assert.ok(
    rightClickSpellCharging(
      w,
      SPELLS.find(s => s.id === id),
      { ctrlKey: true, shiftKey: false }
    )
  )
const secondVolcano = w => w.effects.filter(e => e.volcano && e.x === 51 && e.z === 57)

test('M21 natural conversion, worship, housing and earned Land Bridge seal the second fault before its deadline', async () => {
  const store = createGameStore()
  store.startMission(21)
  const w = store.getWorld()
  tick(w, 1 / 12)
  focus(w, 'convertWild')
  until(w, () => w.shots.convertWild > 0, 1000)
  assert.ok(cast(w, 'convertWild', { x: 31, z: 87 }))
  until(w, () => w.units.filter(u => u.team === 'blue' && u.kind === 'brave').length === 6, 1500)
  focus(w, 'bridge')
  const braves = w.units.filter(u => u.team === 'blue' && u.kind === 'brave')
  setSelection(
    w,
    braves.slice(0, 3).map(u => u.id)
  )
  assert.ok(
    command(
      w,
      w.shrines.find(s => s.kind === 'flattenEffect')
    )
  )
  setSelection(
    w,
    braves.slice(3).map(u => u.id)
  )
  assert.ok(placeBuilding(w, 'hut', { x: 34, z: 80 }))
  while (!w.shots.bridge && w.turn < 3700) {
    tick(w, 1 / 12)
    if (w.turn % 128 === 0) {
      select(w, 'shaman')
      command(w, { x: 40, z: 80 })
    }
  }
  assert.ok(w.shots.bridge > 0)
  assert.ok(w.turn < 3700)
  assert.equal(w.campaignAIs[1].variables[22], 2, 'first fault was sealed by ordinary worship')
  assert.equal(w.campaignAIs[1].variables[23], 0)
  assert.equal(w.campaignAIs[1].variables[20], 1, 'second warning block ran naturally')
  assert.equal(markerHeight(w.terrain, 45, 21, w.land.heights), 399)
  assert.ok(w.buildings.some(b => b.team === 'blue' && b.kind === 'hut' && b.progress === 1))
  assert.ok(
    w.units.filter(u => u.team === 'blue').length > 7,
    'ordinary hut births supplied the economy'
  )
  assert.equal(await store.saveCheckpoint(false), false, 'Node has no IndexedDB; session Save only')
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, w)
  for (const world of [w, replay]) assert.ok(cast(world, 'bridge', { x: 52, z: 58 }))
  while (w.turn < 3776) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    if (w.turn % 32 === 0) assert.deepEqual(replay, w)
  }
  assert.deepEqual(replay, w)
  assert.equal(w.campaignAIs[1].variables[23], 2)
  assert.notEqual(markerHeight(w.terrain, 45, 21, w.land.heights), 399)
  assert.equal(secondVolcano(w).length, 0)
  assert.ok(
    !w.messages.slots.some(m => m?.view?.payload === 16668),
    'sealed fault never posted eruption warning'
  )
  assert.equal(w.spellCasts[0][12], 1)
  assert.equal(w.status, 'playing')
})

test('M21 unsealed second fault respects native deadline, erupts once and resumes its active Volcano exactly', async () => {
  const store = createGameStore()
  store.startMission(21)
  const w = store.getWorld()
  advance(w, 2256)
  assert.equal(w.campaignAIs[1].variables[20], 0)
  advance(w, 2272)
  assert.equal(w.campaignAIs[1].variables[20], 1)
  advance(w, 3711)
  assert.equal(w.campaignAIs[1].variables[23], 0)
  assert.equal(secondVolcano(w).length, 0)
  tick(w, 1 / 12)
  assert.equal(w.campaignAIs[1].variables[23], 1)
  assert.equal(secondVolcano(w).length, 1)
  const warning = w.messages.slots.find(m => m?.view?.payload === 16668)
  assert.ok(warning)
  assert.deepEqual(warning.view, { cell: (192 << 8) | 58, payload: 16668 })
  assert.equal(warning.lifetime, 256)
  assert.equal(await store.saveCheckpoint(false), false, 'Node has no IndexedDB; session Save only')
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(replay, w)
  const eruptionId = secondVolcano(w)[0].id
  while (w.turn < 3872) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(replay, w)
    assert.deepEqual(
      secondVolcano(w).map(e => e.id),
      w.turn < 3872 ? [eruptionId] : []
    )
  }
  assert.equal(w.campaignAIs[1].variables[23], 2)
  assert.equal(secondVolcano(w).length, 0)
  assert.equal(w.messages.slots.filter(m => m?.view?.payload === 16668).length, 1)
})
