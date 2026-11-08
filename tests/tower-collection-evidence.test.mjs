import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { towerWorldObservation, assertTowerGift, assertTowerPresentation, assertTowerContinuation, assertTowerRestore } from '../scripts/tower-collection-evidence/contracts.mjs'

// Supplied observations test evidence rejection only. They are not gameplay,
// rendering, checkpoint migration, or an executed browser episode.
function pending() {
  return { level: 4, turn: 100, time: 8, unlockedTower: false,
    shrine: { id: 9, kind: 'vault', reward: 'tower', x: 69, z: -29, active: false, uses: 1 },
    gifts: [{ id: 10, reward: 'tower', frame: 1076, remaining: 82, phase: 6, animation: { object: 1417, draw: 43, f1: 0 } }],
    giftCounts: { tower: 0 } }
}

test('Tower observer binds authored coordinates and returns an independent semantic snapshot', () => {
  const state = pending(), world = { ...state, outcome: { level: 4 }, shrines: [state.shrine] }
  const captured = towerWorldObservation(world)
  assert.deepEqual(captured, state)
  world.gifts[0].animation.f1 = 8
  assert.equal(captured.gifts[0].animation.f1, 0)
  for (const changed of [{ outcome: { level: 3 } }, { shrines: [] }, { shrines: [{ ...state.shrine, x: 68 }] }])
    assert.throws(() => towerWorldObservation({ ...world, ...changed }))
})

test('pending gift gate rejects generic Tower frame, wrong animation, early unlock and missing gift', () => {
  assert.doesNotThrow(() => assertTowerGift(pending()))
  for (const mutate of [s => { s.gifts[0].frame = 1077 }, s => { s.gifts[0].animation.draw = 42 },
    s => { s.unlockedTower = true }, s => { s.gifts = [] }, s => { s.gifts[0].phase = 0 }]) {
    const state = pending(); mutate(state)
    assert.throws(() => assertTowerGift(state))
  }
})

test('render gate requires the decoded dedicated atlas and actual original frame identities', () => {
  const view = { visible: true, frame: 1076, bodyFrame: 1076, glowFrame: 1417,
    atlas: 'http://127.0.0.1:5198/original/vault-knowledge-tower.png', width: 384, height: 384, visibleLayers: 1 }
  assert.doesNotThrow(() => assertTowerPresentation(view))
  for (const delta of [{ atlas: 'http://127.0.0.1/original/vault-knowledge.png' }, { bodyFrame: 1077 },
    { visible: false }, { glowFrame: 1431 }, { width: 0 }, { visibleLayers: 0 }])
    assert.throws(() => assertTowerPresentation({ ...view, ...delta }))
})

test('continuation gate rejects stale Load, duplicated gift, inactive reward and replayed shrine use', () => {
  const saved = pending(), loaded = structuredClone(saved)
  const done = { ...structuredClone(saved), unlockedTower: true, gifts: [], turn: 190 }
  assert.doesNotThrow(() => assertTowerContinuation(saved, loaded, done, [10, 10]))
  assert.throws(() => assertTowerContinuation(saved, { ...loaded, turn: 101 }, done, [10]))
  assert.throws(() => assertTowerContinuation(saved, loaded, done, [10, 11]))
  assert.throws(() => assertTowerContinuation(saved, loaded, { ...done, unlockedTower: false }, [10]))
  assert.throws(() => assertTowerContinuation(saved, loaded, { ...done, level: 3 }, [10]))
  assert.throws(() => assertTowerContinuation(saved, loaded, { ...done, shrine: { ...done.shrine, id: 12 } }, [10]))
  assert.throws(() => assertTowerContinuation(saved, loaded, { ...done, shrine: { ...done.shrine, uses: 2 } }, [10]))
})

test('Load evidence requires divergent live state and rejects a replacement that clones it', () => {
  const saved = pending(), live = structuredClone(saved)
  live.turn += 2; live.time += 1 / 6; live.gifts[0].remaining -= 2; live.gifts[0].phase -= 2
  assert.doesNotThrow(() => assertTowerRestore(saved, live, structuredClone(saved)))
  assert.throws(() => assertTowerRestore(saved, saved, structuredClone(saved)))
  assert.throws(() => assertTowerRestore(saved, live, structuredClone(live)))
})

test('episode retains public input/storage and cannot import a dev model or dispatch unrelated workflows', () => {
  const source = readFileSync(new URL('../scripts/tower-collection-evidence/episode.mjs', import.meta.url), 'utf8')
  assert.match(source, /button\('Save checkpoint'\)\.click/)
  assert.match(source, /button\('Load checkpoint'\)\.click/)
  assert.match(source, /transaction\('checkpoints', 'readonly'\)/)
  assert.match(source, /scene\.animate\(window\.__towerClock\)/)
  assert.doesNotMatch(source, /import\(['"]\/app\/|\.startMission\(|\.saveCheckpoint\(|\.loadCheckpoint\(|\btick\(/)
  assert.doesNotMatch(source, /chromium\.launch|--no-sandbox|workflow_dispatch|world\.turn\s*=/)
  assert.match(source, /report\.screenshots\.length < 4/)
  assert.match(source, /report\.controlledFrames <= 24000/)
})
