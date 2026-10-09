import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import route from './mission3-temple-checkpoint.mjs'
import { bindGame } from '../browser-game.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'
import { checkpointObservation } from './checkpoint-observer.mjs'
import { installTempleRouteObservation } from './mission3-temple-witness.mjs'
import { armM3Save, readM3Committed } from './mission3-building-lifecycle.mjs'
import { templeTileOffset, templeSpriteMaterial } from '../../app/temple-art.ts'

export function requireLoadBoundary(transition, saved, digest) {
  assert.equal(transition.kind, 'load')
  assert.equal(transition.trusted, true)
  assert.deepEqual(transition.errors, [])
  assert.deepEqual(transition.after.snapshot, saved.boundary.snapshot, 'Actual synchronous Load restores the exact saved UI/gift/actor state')
  assert.equal(transition.after.resource.bank, 'p')
  assert.equal(transition.after.resource.counter, 0)
  assert.equal(transition.after.resource.tile, 92)
  assert.ok(transition.after.resource.epoch > transition.before.resource.epoch)
  assert.equal(transition.start.calls, 1)
  assert.equal(transition.start.attached, true)
  assert.equal(transition.start.restored, true)
  assert.deepEqual(transition.start.errors, [])
  for (const field of ['level', 'turn', 'time', 'actorsSha256', 'terrainSha256', 'stockSha256'])
    assert.deepEqual(digest[field], saved.digest.checkpoint[field], `Load boundary ${field}`)
}

export function requireRestartBoundary(transition) {
  assert.equal(transition.kind, 'restart')
  assert.equal(transition.trusted, true)
  assert.deepEqual(transition.errors, [])
  assert.equal(transition.before.snapshot.landFlags & 8, 0, 'Only normal same-resource Restart is admitted')
  assert.equal(transition.before.snapshot.acquisition.controllers.building?.active, true,
    'Trusted Restart must observe the actual restored active owner')
  assert.deepEqual(transition.after.resource, transition.before.resource)
  assert.equal(transition.after.snapshot.turn, 0)
  assert.equal(transition.after.snapshot.temple, false)
  assert.deepEqual(transition.after.snapshot.gifts, [])
  assert.deepEqual(transition.after.snapshot.acquisition.requests, [])
  for (const family of ['building', 'companion', 'pulse'])
    assert.equal(transition.after.snapshot.acquisition.controllers[family], null)
}

export function requireScreenProof(epochs, templeId) {
  const values = Object.values(epochs), fresh = epochs.fresh, final = epochs.final
  assert.ok(fresh && final)
  for (const evidence of values) {
    assert.equal(evidence.restored, true)
    assert.deepEqual(evidence.errors, [], 'Partial frame presence cannot override observer errors')
    assert.equal(evidence.source.level, 3)
    assert.equal(evidence.birth.gift.id, fresh.birth.gift.id)
    assert.equal(evidence.birth.turn, fresh.birth.turn)
  }
  assert.equal(fresh.handoffs, 1)
  assert.equal(fresh.stages.hide.turn - fresh.birth.turn, 6)
  assert.equal(fresh.stages.handoff.hud.selected, true)
  assert.equal(fresh.stages.handoff.hud.disabled, true)
  assert.equal(final.handoffs, 0, 'Restored acquisition is not a new authored handoff')
  assert.equal(final.grants, 1)
  assert.equal(final.stages.grant.after.turn - final.birth.turn, 82)
  assert.equal(final.stages.grant.before.gift.remaining, 1)
  const frames = label => values.map(evidence => evidence.frames[label]).filter(Boolean)
  const valid = frame => frame.gpu.fresh && frame.opaquePixels > 0 && frame.vertices > 0 &&
    frame.command.model === 5 && frame.command.geometryModel === 95 && frame.resource.bank === 'p' &&
    frame.material?.uvValidated === true && frame.material.src.split('?')[0].endsWith('/temple-model-p.png') &&
    !!frame.buildingFile?.sha256 && !!frame.overlayFile?.sha256
  for (const label of ['whole', 'flight']) assert.ok(frames(label).some(valid), `Missing validated natural ${label} frame`)
  assert.ok(frames('sharedTile').some(frame => valid(frame) && frame.resource.tile !== 92 &&
    frame.material.sharedVertices > 0 && frame.material.tiles.includes(frame.resource.tile)),
    'Actual submitted UVs must visibly select a non-base shared tile')
  for (const owner of ['companion', 'pulse']) {
    const sample = values.map(evidence => evidence.materialOwners?.[owner]).find(Boolean)
    assert.ok(sample && sample.key === `temple-sparkles-p:${sample.frame}:${sample.resolvedRgb}`,
      `Missing actual ${owner} p crop/tint consumption`)
    const expected = templeSpriteMaterial(sample.frame, sample.palette, sample.resource)
    assert.equal(sample.resolvedRgb, expected.rgb)
    assert.deepEqual(sample.crop, expected.crop)
    assert.equal(sample.width, expected.crop.w)
    assert.equal(sample.height, expected.crop.h)
  }
  assert.equal(final.worldTemple.id, templeId)
  assert.ok(final.worldTempleSamples.length >= 2)
  for (const sample of final.worldTempleSamples) {
    assert.equal(sample.id, templeId)
    assert.deepEqual(sample.offset, templeTileOffset(sample.resource.tile))
    assert.equal(sample.resource.bank, 'p')
    assert.equal(sample.resource.epoch, final.installation.state.resourceLive.epoch)
    assert.equal(sample.afterFrame, sample.beforeFrame + 1)
    assert.ok(sample.src.split('?')[0].endsWith('/temple-model-p.png'))
  }
}

export default async function mission3BuildingScreen(context) {
  const { page, signal, receipt, output, observeCheckpoint } = context
  const evidence = { product: receipt.source, epochs: {}, transitions: [], activeSave: null,
    status: 'running', cleanupErrors: [],
    limits: 'Live structured checkpoint fields are compared before JSON reporting. No original wall-time/GPU equality, transient ANIBL persistence or old-profile reuse.' }
  let persist, shamanId, birth
  const retain = (label, screen) => {
    if (!screen) return
    evidence.epochs[label] = screen
    for (const [phase, frame] of Object.entries(screen.frames)) for (const field of ['overlay', 'building']) {
      const encoded = frame[`${field}Png`]
      if (!encoded) continue
      assert.match(encoded, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
      const bytes = Buffer.from(encoded.slice('data:image/png;base64,'.length), 'base64')
      const file = `m3-${label}-${phase}-${field}.png`
      writeFileSync(resolve(output, file), bytes, { flag: 'wx' })
      frame[`${field}File`] = { file, sha256: createHash('sha256').update(bytes).digest('hex') }
      delete frame[`${field}Png`]
    }
    persist?.()
  }
  const screenWait = async goal => {
    signal.throwIfAborted()
    await page.waitForFunction(goal => {
      const api = window.m3BuildingScreen
      if (!api) throw new Error('Acquisition observer disappeared')
      const status = api.status()
      if (status.errors.length) throw new Error(status.errors.join('\n'))
      return goal === 'whole' ? status.whole && status.buildingActive : api.read().worldTempleSamples.length >= 2
    }, goal, { timeout: goal === 'whole' ? 420000 : 30000, polling: 50 })
    signal.throwIfAborted()
    assert.deepEqual(receipt.errors, [])
  }
  const replacement = async (kind, input, label) => {
    const transition = { kind, evidence: null, digest: null }
    evidence.transitions.push(transition)
    let armed = false, failed = false, failure
    try {
      await page.evaluate(async options => {
        const { prepareM3Replacement } = await import('/scripts/local-render/mission3-building-lifecycle.mjs')
        await prepareM3Replacement(options)
      }, { kind, shamanId, birth })
      armed = true
      await input.button(kind === 'load' ? 'Load checkpoint' : 'Restart world')
      await bindGame(page)
    } catch (error) { failed = true; failure = error }
    finally {
      if (armed) try { transition.evidence = await page.evaluate(() => window.m3Replacement.close()) }
      catch (error) { transition.cleanupError = String(error); if (!failed) { failed = true; failure = error } }
      try {
        if (transition.evidence?.screen) {
          retain(label, transition.evidence.screen)
          delete transition.evidence.screen
        }
        persist()
      } catch (error) { if (!failed) { failed = true; failure = error } }
    }
    if (failed) throw failure
    if (evidence.epochs[label]) {
      assert.equal(evidence.epochs[label].restored, true)
      assert.deepEqual(evidence.epochs[label].errors, [])
    }
    if (kind === 'load') {
      try { transition.digest = await page.evaluate(checkpointObservation, { observationName: 'm3LoadedBoundary' }) }
      finally { await page.evaluate(() => { delete window.m3LoadedBoundary }); persist() }
      requireLoadBoundary(transition.evidence, evidence.activeSave, transition.digest)
      await page.evaluate(installTempleRouteObservation)
    } else requireRestartBoundary(transition.evidence)
    const committed = await observeCheckpoint(`M3 ${kind} preserves active Save`)
    transition.committed = committed
    persist()
    assert.equal(committed.checkpoint.checkpointSha256, evidence.activeSave.digest.checkpoint.checkpointSha256)
    return transition
  }
  const steps = {
    async begin({ report, save, shamanId: id }) {
      report.acquisition = evidence
      persist = save; shamanId = id
      await page.evaluate(async id => {
        const { installM3Screen, installM3CheckpointState } = await import('/scripts/local-render/mission3-building-lifecycle.mjs')
        installM3CheckpointState(); installM3Screen(id)
      }, shamanId)
      persist()
    },
    async preserveActive({ input }) {
      await screenWait('whole')
      birth = await page.evaluate(() => window.m3BuildingScreen.read().birth)
      await input.pause()
      await input.button('Game settings')
      const saved = evidence.activeSave = { boundary: null, committed: null, digest: null }
      let armed = false, failed = false, failure
      try {
        await page.evaluate(armM3Save); armed = true
        await input.button('Save checkpoint')
      } catch (error) { failed = true; failure = error }
      finally {
        if (armed) try { saved.boundary = await page.evaluate(() => window.finishM3Save()) }
        catch (error) { saved.cleanupError = String(error); if (!failed) { failed = true; failure = error } }
        persist()
      }
      if (failed) throw failure
      assert.deepEqual(saved.boundary.errors, [])
      assert.equal(saved.boundary.trusted, true)
      assert.equal(saved.boundary.snapshot.paused, true)
      assert.equal(saved.boundary.snapshot.temple, false)
      assert.equal(saved.boundary.snapshot.acquisition.controllers.building?.active, true,
        'Public Save missed the naturally active UI controller')
      const matched = await waitForCheckpointReadback(async () => {
        signal.throwIfAborted()
        saved.committed = await page.evaluate(readM3Committed)
        return saved.committed?.version === 1 && isDeepStrictEqual(saved.committed.snapshot, saved.boundary.snapshot)
      })
      persist()
      assert.equal(matched, true, 'Typed committed active Save differs from its trusted boundary')
      saved.digest = await observeCheckpoint('M3 active acquisition Save')
      persist()
      assert.equal(saved.digest.checkpoint.turn, saved.boundary.snapshot.turn)
      assert.equal(saved.digest.checkpoint.time, saved.boundary.snapshot.time)
      await replacement('load', input, 'fresh')
      await input.pause()
      await input.button('Game settings')
      await replacement('restart', input, 'beforeRestart')
      // The fresh restart scene has completed binding; its opening need not be
      // replayed. Settings is a real control admitted through its input mask.
      await input.button('Game settings')
      await replacement('load', input, 'restartWithoutAcquisition')
      await input.resume()
    },
    async observeWorld({ report }) {
      await screenWait('world')
      const final = await page.evaluate(() => window.m3BuildingScreen.close())
      retain('final', final)
      requireScreenProof(evidence.epochs, report.plan.id)
      evidence.proofAccepted = true
      persist()
    },
    async finish() {
      assert.equal(evidence.proofAccepted, true, 'Complete acquisition/lifecycle proof precedes final Save')
      evidence.status = 'passed'
      persist()
    },
  }
  let failed = false, failure, result
  try { result = await route(context, steps) }
  catch (error) { failed = true; failure = error; evidence.status = 'failed'; evidence.failure = String(error?.stack ?? error) }
  finally {
    try {
      const partial = await page.evaluate(() => window.m3BuildingScreen?.close() ?? null)
      if (partial) retain('failure', partial)
    } catch (error) { evidence.cleanupErrors.push(String(error)); if (!failed) { failed = true; failure = error } }
    if (failed) {
      evidence.status = 'failed'; evidence.failure ??= String(failure?.stack ?? failure)
      if (result) { result.status = 'failed'; result.failure ??= evidence.failure }
    }
    try { persist?.() } catch (error) {
      if (!failed) { failed = true; failure = error }
      evidence.status = 'failed'
      if (result) result.status = 'failed'
    }
  }
  if (failed) throw failure
  assert.deepEqual(evidence.cleanupErrors, [])
  return result
}
