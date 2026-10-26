import test from 'node:test'
import assert from 'node:assert/strict'
import { validateTornadoEvidence } from '../scripts/integration-queue/composed-tornado-evidence.mjs'
import { tornadoEvidenceFixture, tornadoDiagnosticPixels, tornadoPng } from './support/composed-tornado-fixture.mjs'
const run = f => validateTornadoEvidence(f.report, f)
const bind = f => { const { elapsedMs, ...host } = structuredClone(f.report); f.hostReport = host }

test('composed Tornado data validates both independently decoded original diagnostic pairs synchronously', () => {
  const f = tornadoEvidenceFixture()
  assert.equal(run(f), true)
  f.report.elapsedMs = 90000
  for (const episode of f.report.episodes) for (const stage of episode.stages)
    stage.view = { scaledSprites: 1, scale: 17746, spriteScale: 17746 }
  const pixels = tornadoDiagnosticPixels('land', 'black'); pixels[0]++ // Existing one-byte tolerance.
  f.files.set('tornado-land-diagnostic-black.png', tornadoPng(8,8,pixels))
  bind(f)
  assert.equal(run(f), true)
})
test('raw Tornado projection removes only elapsedMs and rejects altered report/source identity', () => {
  for (const mutate of [
    f => { f.report.stock += ' changed' }, f => { f.report.episodes[0].target.x++ },
    f => { f.report.additional = true; f.hostReport.additional = true },
    f => { f.hostReport.elapsedMs = f.report.elapsedMs },
    f => { f.mergeSha = 'b'.repeat(40) }, f => { f.browserVersion = 'wrong' },
  ]) { const f = tornadoEvidenceFixture(); mutate(f); assert.throws(() => run(f)) }
})
test('Tornado pass/deadline/readiness/cast/stock/stage/UV/depth/palette/cleanup proof is mandatory', () => {
  const mutations = [
    f => { f.report.status = 'FAIL' }, f => { f.report.elapsedMs = -1 }, f => { f.report.elapsedMs = NaN },
    f => { f.report.elapsedMs = 90001 }, f => { f.report.budgetMs = 90001 }, f => { f.report.budgetMs = 0 },
    f => { f.report.episodes.reverse() }, f => { f.report.episodes.push(f.report.episodes[0]) },
    f => { f.report.episodes[0].failure = 'failed' }, f => { f.report.episodes[0].readiness.after.ready = false },
    f => { f.report.episodes[0].readiness.after.shaman.selectable = false },
    f => { f.report.episodes[0].restartReadiness.after.inputMask = 64 },
    f => { f.report.episodes[0].cast.after.casts++ }, f => { f.report.episodes[0].cast.after.shots++ },
    f => { f.report.episodes[0].cast.before.canvasHit = false }, f => { f.report.episodes[0].cast.before.targetError = {} },
    f => { f.report.episodes[0].cast.after.projectiles = [] },
    f => { f.report.episodes[0].stages.pop() }, f => { f.report.episodes[0].stages[0].samples.pop() },
    f => { f.report.episodes[0].stages[0].samples[0].frame++ },
    f => { f.report.episodes[0].stages[0].samples[0].source++ },
    f => { f.report.episodes[0].stages[0].samples[0].uv[0] += .01 },
    f => { f.report.episodes[0].stages[0].samples[0].bucket++ },
    f => { f.report.episodes[0].stages[0].samples[0].width++ },
    f => { f.report.episodes[0].stages[0].samples[0].palette = 9 },
    f => { f.report.episodes[0].observedPalettes.push(5) },
    f => { f.report.episodes[0].stages[1].visits++ },
    f => { f.report.episodes[0].stages[2].samples[0].ordinal = 0 },
    f => { f.report.episodes[0].diagnostic.loadedAtlasSHA256 = '0'.repeat(64) },
    f => { f.report.episodes[0].diagnostic.cleanup = false },
    f => { f.report.episodes[0].graphics.webgl.contextLost = true },
  ]
  for (const mutate of mutations) { const f = tornadoEvidenceFixture(); mutate(f); bind(f); assert.throws(() => run(f)) }
})
test('Tornado PNG diagnostics bind graphics dimensions, opaque alpha and recomputed original histogram', () => {
  for (const mutate of [
    f => { f.files.delete('tornado-land-diagnostic-black.png') },
    f => { f.report.episodes[0].graphics.canvas.width = 9 },
    f => { f.report.episodes[0].diagnostic.visible++ },
    f => { const p = tornadoDiagnosticPixels('land', 'black'); p[3] = 0; f.files.set('tornado-land-diagnostic-black.png', tornadoPng(8,8,p)) },
    f => { const p = tornadoDiagnosticPixels('land', 'white'); p[3] = 128; f.files.set('tornado-land-diagnostic-white.png', tornadoPng(8,8,p)) },
    f => { const p = tornadoDiagnosticPixels('land', 'black'); p[0] = 255; f.files.set('tornado-land-diagnostic-black.png', tornadoPng(8,8,p)) },
    f => { f.files.set('tornado-land-diagnostic-black.png', f.files.get('tornado-water-diagnostic-black.png')) },
    f => { f.files.set('tornado-land-diagnostic-white.png', Buffer.from('not PNG')) },
    f => { f.sourceBytes['public/original/tornado.png'] = Buffer.from('different source bytes') },
    f => { const j = JSON.parse(f.sourceBytes['tests/fixtures/tornado-original.json']); j.frames[0].source++; f.sourceBytes['tests/fixtures/tornado-original.json'] = Buffer.from(JSON.stringify(j)) },
  ]) { const f = tornadoEvidenceFixture(); mutate(f); bind(f); assert.throws(() => run(f)) }
})
test('normal screenshot ownership and terminal deletion/restart cannot be omitted', () => {
  for (const mutate of [
    f => { f.files.delete('tornado-land-spawn-normal.png') },
    f => { f.files.set('tornado-land-spawn-normal.png', tornadoPng(8,8,tornadoDiagnosticPixels('land','black'))) },
    f => { f.report.episodes[0].exactDeletion.empty = false },
    f => { f.report.episodes[0].exactDeletion.disposed = 15 },
    f => { f.report.episodes[0].cleanup.oldSceneDisposed = false },
    f => { f.report.episodes[0].cleanup.remainingColumns = 1 },
  ]) { const f = tornadoEvidenceFixture(); mutate(f); bind(f); assert.throws(() => run(f)) }
})
