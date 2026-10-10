import assert from 'node:assert/strict'
import test from 'node:test'
import { createVaultPrayerWitness } from '../scripts/local-render/vault-prayer-witness.mjs'
import { assertVaultPrayerEpisode, vaultLowWorkLimit } from '../scripts/local-render/vault-prayer-contract.mjs'
import { createMission1VaultInput } from '../scripts/local-render/mission1-vault-input.mjs'

// Supplied callbacks and DOM validate the observation contract only, not gameplay.
function fixture(options = {}) {
  const listeners = [], canvas = {}, hud = {}, doc = { activeElement: null,
    elementFromPoint: () => hud,
    addEventListener: (type, fn, capture = false) => listeners.push({ type, fn, capture }),
    removeEventListener(type, fn, capture = false) {
      const index = listeners.findIndex(row => row.type === type && row.fn === fn && row.capture === capture)
      if (index >= 0) listeners.splice(index, 1)
    } }
  const head = { id: 92, kind: 'vault', model: 154, active: true, enabled: true, followers: 0,
    work: 0, target: 100, progress: 0, uses: 0, forced: false }
  const unit = { id: 46, kind: 'shaman', team: 'blue', hp: 100, work: null, vault: null,
    native: { immediateCommand: 0, commands: [1], commandCursor: 0 } }
  const world = { turn: 100, time: 1, outcome: { level: 3 }, speed: 1, paused: false,
    status: 'playing', inputMask: 0, mode: null, selected: [46], unlockedTemple: false,
    stats: { trained: 0, cast: 0 }, shrines: [head], units: [unit],
    secondaryEffects: { reservations: [] }, buildingOrders: { records: { 1: { model: 0, flags: 0 } } } }
  let current = true
  const panels = { panels: new Map(), automaticVaultLatches: new Set(), inspected: null, frame: 0,
    open(id, immediate, automatic) {
      const element = { isConnected: true, hidden: false, contains: () => false, matches: () => false,
        getAttribute: () => 'Vault of Knowledge: shaman learning; 1% complete', querySelectorAll: () => [] }
      this.panels.set(id, { element, canvas: { width: 20, height: 40 }, automatic, phase: -1, remaining: 0, hold: 16 })
      world.secondaryEffects.reservations = [`object-panel:${id}`]
    },
    requestAutomaticVault(id) {
      if (this.automaticVaultLatches.has(id)) return 'automatic:latched'
      if (!head.followers) return 'automatic:rejected'
      this.open(id, false, true)
      this.automaticVaultLatches.add(id)
      return 'automatic:created'
    },
    update() {
      const panel = this.panels.get(92)
      if (panel && head.followers && head.active) { panel.phase = 1; panel.remaining = 15 }
      else if (panel) { this.panels.clear(); this.automaticVaultLatches.clear(); world.secondaryEffects.reservations = [] }
      this.frame = scene.gameClock.animationFrame
      return 'natural-update-result'
    } }
  const scene = { world, objectPanels: panels, renderer: { domElement: canvas }, hoveredObject: null,
    pointerScreen: { clientX: 20, clientY: 975 }, isCurrent: () => current,
    gameClock: { animationFrame: 1, afterTurn: () => 'after-turn-result' },
    dispose() { panels.panels.clear(); panels.automaticVaultLatches.clear(); world.secondaryEffects.reservations = []; current = false } }
  const store = { getWorld: () => world }
  const originals = [panels.requestAutomaticVault, panels.open, panels.update, scene.gameClock.afterTurn, scene.dispose]
  const witness = createVaultPrayerWitness({ scene, store, targetId: 92, shamanId: 46, doc, ...options })
  const sample = count => {
    world.turn += 4
    panels.requestAutomaticVault(92)
    head.followers = count
    head.work += count ? 1 : -Number(head.work > 0)
    head.progress = head.work / head.target
    assert.equal(scene.gameClock.afterTurn(), 'after-turn-result')
  }
  const update = () => { scene.gameClock.animationFrame++; assert.equal(panels.update(), 'natural-update-result') }
  const input = model => {
    const event = { target: canvas, isTrusted: true, button: 0 }
    for (const row of [...listeners]) if (row.type === 'pointerup' && row.capture) row.fn(event)
    world.buildingOrders.records[1] = { model, a: model === 33 ? 92 : 0, flags: 0, references: 1 }
    unit.vault = model === 33 ? { head: 92, phase: 0, entering: true, remaining: 0 } : null
    unit.work = model === 33 ? 92 : null
    for (const row of [...listeners]) if (row.type === 'pointerup' && !row.capture) row.fn(event)
  }
  return { witness, world, head, unit, scene, panels, store, listeners, originals, sample, update, input,
    stale: () => { current = false } }
}

test('composed old-count request, current-count expiry, reissue and departure retain synchronous boundaries', () => {
  const f = fixture()
  f.input(33)
  f.sample(1)
  f.sample(1)
  for (let i = 0; i < 5; i++) f.update()
  assert.equal(f.witness.status().current.head.work, 2)
  f.input(3)
  f.sample(0)
  f.update()
  f.input(33)
  f.sample(1)
  f.sample(1)
  for (let i = 0; i < 5; i++) f.update()
  f.head.active = false
  f.head.uses = 1
  f.world.unlockedTemple = true
  f.unit.vault = null
  f.world.buildingOrders.records[1].model = 0
  f.update()
  const evidence = f.witness.close()
  assertVaultPrayerEpisode(evidence, 92, 46)
  assert.equal(f.listeners.length, 0)
  assert.deepEqual([f.panels.requestAutomaticVault, f.panels.open, f.panels.update, f.scene.gameClock.afterTurn, f.scene.dispose], f.originals)
  // A retained native slot/id may be reused. Lifetime end and created outcome still prove recreation.
  const reused = structuredClone(evidence)
  for (const row of reused.records) for (const s of [row.before, row.after]) if (s.record) s.record.identity = 1
  reused.held = { 1: 8 }
  assertVaultPrayerEpisode(reused, 92, 46)
  const late = structuredClone(evidence)
  late.records.filter(row => row.kind === 'input')[1].before.head.work = 26
  assert.throws(() => assertVaultPrayerEpisode(late, 92, 46))
  const missingExpiry = structuredClone(evidence)
  missingExpiry.records = missingExpiry.records.filter(row => !(row.kind === 'update' && row.after.head.followers === 0))
  assert.throws(() => assertVaultPrayerEpisode(missingExpiry, 92, 46))
})

test('cancellation close, stale Scene and disposal restore exact owners and remove listeners', () => {
  for (const reason of ['cancel', 'stale', 'dispose']) {
    const f = fixture()
    if (reason === 'stale') { f.stale(); f.scene.gameClock.afterTurn() }
    if (reason === 'dispose') f.scene.dispose()
    const evidence = f.witness.close()
    assert(evidence.closed)
    assert.equal(evidence.disposed, reason === 'dispose')
    assert.equal(evidence.errors.length, Number(reason === 'stale'))
    assert.equal(f.listeners.length, 0)
    assert.deepEqual([f.panels.requestAutomaticVault, f.panels.open, f.panels.update, f.scene.gameClock.afterTurn, f.scene.dispose], f.originals)
  }
})

test('record ranges are bounded, overflow is explicit, and foreign callback ownership is preserved', () => {
  const f = fixture({ maxRecords: 1 })
  f.sample(0)
  assert.equal(f.witness.range(0).length, 1)
  assert.throws(() => f.witness.range(-1), /range/)
  assert(f.witness.status().overflow)
  const foreign = () => 'foreign'
  f.panels.update = foreign
  const result = f.witness.close()
  assert.equal(f.panels.update, foreign)
  assert(result.errors.some(message => message.includes('Foreign update')))
  assert.equal(f.listeners.length, 0)
})

test('maintained input exposes the composed route methods and admits no action after cancellation', async () => {
  const abort = new AbortController(), report = { actions: [] }
  const input = createMission1VaultInput({ page: {}, signal: abort.signal, report, save() {}, originalShamanId: 46 })
  for (const method of ['action', 'button', 'view', 'prepareDispatch', 'fixedGround', 'entityPoint', 'dispatch', 'clickEntity'])
    assert.equal(typeof input[method], 'function')
  abort.abort(Error('ordinary stop'))
  await assert.rejects(input.action('not-delivered', () => assert.fail('input after stop')), /ordinary stop/)
  assert.deepEqual(report.actions, [])
  assert.equal(vaultLowWorkLimit(100), 25)
  assert.throws(() => vaultLowWorkLimit(0))
})
