import test from 'node:test'
import assert from 'node:assert/strict'
import { acceptTowerResult, acceptTowerSeries, towerScreenshots } from '../scripts/tower-collection-evidence/acceptance.mjs'
const revision = 'a'.repeat(40)
function fixture() {
  const shrine = { id: 7, kind: 'vault', reward: 'tower', x: 69, z: -29, active: false, uses: 1 }
  const pending = { level: 4, turn: 20, time: 2, giftCounts: {}, shrine, unlockedTower: false,
    gifts: [{ id: 9, reward: 'tower', frame: 1076, animation: { object: 1417, draw: 43 }, remaining: 10, phase: 2 }] }
  const presentation = { visible: true, frame: 1076, bodyFrame: 1076, glowFrame: 1417,
    atlas: 'http://localhost/original/vault-knowledge-tower.png', width: 384, height: 384, visibleLayers: 1 }
  const result = { status: 'passed', revision, cleanupVerified: true, errors: [], controlledFrames: 1,
    renderer: { version: 'WebGL 2', renderer: 'fixture', dpr: 1 },
    before: { level: 4, turn: 0, time: 0, giftCounts: {}, shrine: { ...shrine, active: true }, unlockedTower: false, gifts: [] },
    target: { x: 10, y: 20, shrine: 7, shaman: 3 },
    command: { accepted: true, lastOrderTurn: 2, selected: [3] },
    acquired: structuredClone(pending), saved: structuredClone(pending), loaded: structuredClone(pending),
    beforeLoad: { ...structuredClone(pending), turn: 24, time: 3,
      gifts: [{ ...structuredClone(pending.gifts[0]), remaining: 6 }] },
    completed: { level: 4, turn: 100, time: 10, giftCounts: {}, shrine: structuredClone(shrine), unlockedTower: true, gifts: [] },
    observedGiftIds: [9], marker: presentation, giftPresentation: presentation, loadedGiftPresentation: presentation,
    inputEvents: [{ trusted: true, canvas: true, x: 10, y: 20 },
      { trusted: true, label: 'Save checkpoint' }, { trusted: true, label: 'Load checkpoint' }],
    screenshots: [...towerScreenshots], limitations: ['Supplied receipt fixture, no gameplay evidence.'] }
  const inventory = { screenshots: 4, files: towerScreenshots.map(path => ({ path, bytes: 1 })) }
  const series = { status: 'passed', revision, cleanupVerified: true, errors: [], result,
    observations: towerScreenshots.map(screenshot => ({ screenshot })) }
  return { result, inventory, series }
}
test('Trust boundary accepts a complete semantic receipt fixture', () => {
  const { result, inventory, series } = fixture()
  assert.equal(acceptTowerResult(result, revision, inventory), result)
  assert.equal(acceptTowerSeries(series, revision, inventory), result)
})
test('Empty, skipped and incomplete proof cannot masquerade as Tower acceptance', () => {
  const { inventory } = fixture()
  for (const result of [undefined, {}, { status: 'passed' }])
    assert.throws(() => acceptTowerResult(result, revision, inventory))
  const mutations = [
    r => { r.revision = 'b'.repeat(40) }, r => { r.cleanupVerified = false },
    r => { r.baseline = true }, r => { r.skipped = true }, r => { r.errors.push('late runtime error') },
    r => { r.controlledFrames = 24001 }, r => { r.before.level = 5 },
    r => { delete r.before.turn }, r => { delete r.completed.time },
    r => { delete r.saved.giftCounts }, r => { r.acquired.shrine.reward = 'earthquake' },
    r => { delete r.acquired.gifts[0].reward },
    r => { r.command.accepted = false }, r => { r.command.selected = [4] },
    r => { r.acquired.gifts[0].frame = 1077 }, r => { r.saved.shrine.uses++ },
    r => { r.loaded.gifts = [] }, r => { r.completed.unlockedTower = false },
    r => { r.beforeLoad = structuredClone(r.saved) },
    r => { r.loaded = structuredClone(r.beforeLoad) },
    r => { r.observedGiftIds.push(10) }, r => { r.loadedGiftPresentation = { ...r.loadedGiftPresentation, visible: false } },
    r => { r.inputEvents[0].trusted = false }, r => { r.inputEvents[0].x += 2 }, r => { r.inputEvents.pop() },
    r => { r.screenshots.pop() },
  ]
  for (const change of mutations) {
    const { result, inventory } = fixture()
    change(result)
    assert.throws(() => acceptTowerResult(result, revision, inventory))
  }
})
test('Actual artifact entries and owner series evidence are mandatory', () => {
  for (const change of [
    f => { f.inventory.files.pop() },
    f => { f.inventory.files[0].bytes = 0 },
    f => { f.inventory.screenshots = 3 },
    f => { f.series.revision = 'b'.repeat(40) },
    f => { f.series.cleanupVerified = false },
    f => { f.series.errors.push('late cleanup error') },
    f => { f.series.observations.pop() },
  ]) {
    const f = fixture()
    change(f)
    assert.throws(() => acceptTowerSeries(f.series, revision, f.inventory))
  }
})

