import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import scenario from './mission1-vault-knowledge.mjs'
import { savedMission1Vault946, assertMission1ContinuationProfile, readMission1ContinuationSeed } from './mission1-vault-continue.mjs'

function fixture() {
  // Synthetic metadata tests validation only; no profile or correspondence is created.
  const checkpoint = structuredClone(savedMission1Vault946.checkpoint)
  const profile = { mode: 'reused', id: savedMission1Vault946.profileId, correspondence: { decision: 'ACCEPT' },
    previousRun: { cleanupVerified: true, continuationVerified: true, checkpointAtEnd: structuredClone(checkpoint) },
    checkpointAtStart: structuredClone(checkpoint) }
  const saved = { level: 1, turn: 946, active: true, camp: false, gifts: 0, bridges: 1,
    glow: { f1: 12, displayedFrame: 2 }, shaman: [{ id: 30, hp: 100, x: -4.28515625, z: 3.11328125 }] }
  const calls = [], page = {
    async evaluate(fn) {
      calls.push(fn.name || 'anonymous-read')
      if (fn.name === 'checkpointObservation') return structuredClone(checkpoint)
      if (fn.name === 'readMission1VaultCheckpoint') return structuredClone(saved)
      if (fn.name === 'installMission1VaultCheckpointState' || fn.name === 'installMission1VaultLoadWitness') return
      if (fn.toString().includes('loaded: window.vaultLoadedBoundary')) return { loaded: structuredClone(saved), error: null }
      if (fn.toString().includes('restoreVaultLoadWitness')) return
      assert.fail('Unexpected browser evaluation in bounded Load entry')
    },
    getByRole(role, options) {
      assert.equal(role, 'dialog'); assert.equal(options.name, 'Start game'); assert.equal(options.exact, true)
      return { async waitFor() { calls.push('startup-visible') }, getByRole(role, options) {
        assert.equal(role, 'button'); assert.equal(options.name, 'Load Game'); assert.equal(options.exact, true)
        return { async click() { calls.push('public-Load-Game') } }
      } }
    },
    async waitForSelector() { throw Error('TEST STOP: entered shared post-load binding') },
  }
  return { checkpoint, profile, saved, calls, page }
}

test('saved946 continuation requires the exact existing profile, checkpoint digest and reviewed correspondence', () => {
  const f = fixture(); assertMission1ContinuationProfile(f.profile, f.checkpoint)
  for (const mutate of [f => { f.profile.mode = 'created' }, f => { f.profile.id = 'another' },
    f => { f.profile.correspondence = null }, f => { f.profile.previousRun.cleanupVerified = false },
    f => { f.profile.checkpointAtStart.turn++ }, f => { f.checkpoint.checkpointSha256 = 'other' },
    f => { f.checkpoint.actorsSha256 = 'other' }, f => { f.checkpoint.terrainSha256 = 'other' },
    f => { f.checkpoint.stockSha256 = 'other' }]) {
    const g = fixture(); mutate(g); assert.throws(() => assertMission1ContinuationProfile(g.profile, g.checkpoint))
  }
})

test('continuation reads committed digest and exact scoped saved cursor before public Load', async () => {
  const f = fixture(), seed = await readMission1ContinuationSeed(f.page, { profile: f.profile })
  assert.equal(seed.originalShamanId, 30); assert.equal(seed.saved.glow.f1, 12)
  assert.deepEqual(f.calls, ['checkpointObservation', 'installMission1VaultCheckpointState', 'readMission1VaultCheckpoint'])
  f.saved.glow.f1 = 0
  await assert.rejects(() => readMission1ContinuationSeed(f.page, { profile: f.profile }))
})

test('actual continuation branch skips openMission/prefix/Save and joins the shared public Load boundary', async () => {
  const f = fixture(), output = mkdtempSync(join(tmpdir(), 'mission1-continue-contract-'))
  try {
    await assert.rejects(() => scenario({ page: f.page, output, continueSaved946: true,
      openMission() { assert.fail('Proven prefix must not replay') }, signal: new AbortController().signal,
      receipt: { source: { commit: 'controlled-fixture' }, profile: f.profile, errors: [] } }), /TEST STOP: entered shared post-load binding/)
    assert.equal(f.calls.filter(c => c === 'public-Load-Game').length, 1)
    assert.ok(f.calls.indexOf('installMission1VaultLoadWitness') < f.calls.indexOf('public-Load-Game'))
    const report = JSON.parse(readFileSync(join(output, 'mission1-vault-knowledge.json'), 'utf8'))
    assert.equal(report.entry, 'public-saved946-continuation')
    assert.deepEqual(report.checkpoint.saved, report.checkpoint.loadedBeforeResume)
    assert.equal(report.checkpoint.saved.turn, 946); assert.equal(report.bridgeOrder, undefined)
  } finally { rmSync(output, { recursive: true, force: true }) }
})

test('continuation digest failure stops before any public Load or mission action', async () => {
  const f = fixture(), output = mkdtempSync(join(tmpdir(), 'mission1-continue-contract-'))
  f.checkpoint.checkpointSha256 = 'wrong'
  try {
    await assert.rejects(() => scenario({ page: f.page, output, continueSaved946: true,
      openMission() { assert.fail('No mission action allowed') }, signal: new AbortController().signal,
      receipt: { source: { commit: 'controlled-fixture' }, profile: f.profile, errors: [] } }))
    assert.equal(f.calls.includes('public-Load-Game'), false)
  } finally { rmSync(output, { recursive: true, force: true }) }
})
