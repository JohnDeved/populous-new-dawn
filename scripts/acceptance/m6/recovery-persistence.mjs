// Earned Mission 6 acceptance stage. Run through check-mission6-earned-victory.mjs.
import { outputPath } from './output-path.mjs'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { deserialize, serialize } from 'node:v8'
import { withStorage } from '../../../tests/support/profile-storage.mjs'
import { tick } from '../../../app/model.ts'
await withStorage({}, async ({ freshStore, records, drain }) => {
  const store = await freshStore()
  store.startMission(6)
  const w = store.getWorld()
  Object.assign(
    w,
    structuredClone(deserialize(readFileSync(outputPath('recovery-pursuit-progress.v8'))))
  )
  assert.equal(w.status, 'playing')
  assert.equal(w.outcome.completedLevel, null)
  assert.ok(await store.saveCheckpoint())
  assert.ok(store.loadCheckpoint())
  const replay = store.getWorld()
  assert.deepEqual(w, replay)
  assert.notEqual(w, replay)
  for (let i = 0; i < 64 && w.status === 'playing'; i++) {
    tick(w, 1 / 12)
    tick(replay, 1 / 12)
    assert.deepEqual(w, replay)
    store.update()
  }
  assert.equal(w.status, 'won')
  assert.equal(w.turn, 29504)
  assert.equal(w.outcome.completedLevel, 5)
  assert.equal(w.units.filter(u => u.team === 'green').length, 0)
  assert.equal(w.units.filter(u => u.team === 'yellow').length, 0)
  assert.ok(w.manaTribes[2].defeatTimer > 0, 'Chumara genuinely defeated')
  assert.ok(w.manaTribes[3].defeatTimer > 0, 'Matak genuinely defeated')
  assert.equal(store.getWorld(), replay)
  assert.deepEqual(store.getCompletedMissions(), [6])
  await drain()
  assert.deepEqual(records.get('profile').completed, [6])
  assert.ok(await store.saveCheckpoint())
  await drain()
  const restored = await freshStore()
  assert.ok(await restored.restoreCheckpoint())
  assert.deepEqual(restored.getCompletedMissions(), [6])
  assert.ok(restored.loadCheckpoint())
  assert.deepEqual(restored.getWorld(), replay)
  const nextMission = restored.getWorld().outcome.level + 1
  assert.equal(nextMission, 7)
  restored.startMission(nextMission)
  assert.equal(restored.getWorld().outcome.level, 7)
  assert.equal(restored.getWorld().status, 'playing')
  assert.deepEqual(restored.getCompletedMissions(), [6])
  writeFileSync(outputPath('recovery-persisted-win.v8'), serialize(replay))
  writeFileSync(outputPath('recovery-continue7.v8'), serialize(restored.getWorld()))
  const result = {
    naturalWinTurn: w.turn,
    completedLevel: w.outcome.completedLevel,
    profile: records.get('profile'),
    reloadStatus: 'won checkpoint restored exactly',
    continueMission: nextMission,
    continueStatus: restored.getWorld().status,
    limits: [
      'Synthetic IndexedDB contract fixture, not browser persistence proof',
      'Store startMission(7) is the shipped Continue handler path; no rendered UI click claim',
    ],
  }
  writeFileSync(outputPath('recovery-persistence-summary.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result))
})
