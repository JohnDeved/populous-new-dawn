import assert from 'node:assert/strict'
import { assertTowerGift, assertTowerPresentation, assertTowerRestore, assertTowerContinuation } from './contracts.mjs'

export const towerScreenshots = Object.freeze([
  'tower-before.png', 'tower-gift.png', 'tower-loaded-gift.png', 'tower-unlocked.png',
])
export function acceptTowerResult(result, revision, inventory) {
  assert.match(revision, /^[a-f0-9]{40}$/)
  assert.equal(result?.status, 'passed')
  assert.equal(result.revision, revision)
  assert.equal(result.cleanupVerified, true)
  assert.notEqual(result.baseline, true)
  assert.notEqual(result.skipped, true)
  assert.deepEqual(result.errors, [])
  assert.ok(Number.isSafeInteger(result.controlledFrames) && result.controlledFrames > 0 && result.controlledFrames <= 24000)
  assert.ok(typeof result.renderer?.version === 'string' && result.renderer.version.length > 0)
  assert.ok(typeof result.renderer.renderer === 'string' && result.renderer.renderer.length > 0)
  assert.equal(result.renderer.dpr, 1)
  const before = result.before
  assert.equal(before.level, 4)
  assert.equal(before.shrine.kind, 'vault')
  assert.equal(before.shrine.reward, 'tower')
  assert.equal(before.shrine.x, 69)
  assert.equal(before.shrine.z, -29)
  assert.equal(before.shrine.active, true)
  assert.equal(before.unlockedTower, false)
  assert.deepEqual(before.gifts, [])
  for (const state of [before, result.acquired, result.saved, result.beforeLoad, result.loaded, result.completed]) {
    assert.equal(state.level, 4)
    assert.ok(Number.isSafeInteger(state.turn) && state.turn >= 0)
    assert.ok(Number.isFinite(state.time) && state.time >= 0)
    assert.ok(state.giftCounts !== null && typeof state.giftCounts === 'object')
    for (const key of ['id', 'kind', 'reward', 'x', 'z'])
      assert.equal(state.shrine[key], before.shrine[key])
    for (const gift of state.gifts) assert.equal(gift.reward, 'tower')
  }
  assert.equal(result.target.shrine, before.shrine.id)
  assert.ok(Number.isFinite(result.target.x) && Number.isFinite(result.target.y))
  assert.equal(result.command.accepted, true)
  assert.deepEqual(result.command.selected, [result.target.shaman])
  assert.ok(Number.isSafeInteger(result.command.lastOrderTurn))
  assertTowerGift(result.acquired)
  assert.equal(result.acquired.shrine.id, before.shrine.id)
  assert.deepEqual(result.saved, result.acquired)
  assertTowerRestore(result.saved, result.beforeLoad, result.loaded)
  assertTowerContinuation(result.saved, result.loaded, result.completed, result.observedGiftIds)
  assert.equal(result.completed.level, 4)
  assert.equal(result.completed.shrine.id, before.shrine.id)
  for (const state of [result.marker, result.giftPresentation, result.loadedGiftPresentation])
    assertTowerPresentation(state)
  const inputs = result.inputEvents
  assert.ok(Array.isArray(inputs))
  assert.ok(inputs.some(event => event.trusted === true && event.canvas === true &&
    Math.abs(event.x - result.target.x) < 1 && Math.abs(event.y - result.target.y) < 1), 'Trusted target canvas input required')
  for (const label of ['Save checkpoint', 'Load checkpoint'])
    assert.ok(inputs.some(event => event.trusted === true && event.label === label), label)
  assert.deepEqual(result.screenshots, towerScreenshots)
  assert.equal(inventory.screenshots, towerScreenshots.length)
  for (const name of towerScreenshots)
    assert.ok(inventory.files.some(file => file.path === name && file.bytes > 0), 'Missing capture: ' + name)
  assert.ok(Array.isArray(result.limitations) && result.limitations.length > 0)
  return result
}
export function acceptTowerSeries(series, revision, inventory) {
  assert.equal(series?.status, 'passed')
  assert.equal(series.revision, revision)
  assert.equal(series.cleanupVerified, true)
  assert.deepEqual(series.errors, [])
  assert.deepEqual(series.observations.map(value => value.screenshot), towerScreenshots)
  return acceptTowerResult(series.result, revision, inventory)
}

