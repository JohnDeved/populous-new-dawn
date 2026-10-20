import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import units from '../../app/original-units.json' with { type: 'json' }
import { SHIELD_VISUAL_INPUTS } from './shield-visuals-inputs.mjs'
import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { bindGame } from '../browser-game.mjs'
import { m2LoadReady } from './m2-pointer-f8.mjs'
import { checkpointCodec } from './checkpoint-codec.mjs'
import { createShieldCheckpoint } from './shield-checkpoint.mjs'
import { runShieldEpisode } from './shield-budget.mjs'
import { validateShieldCapture, validateShieldPng } from './shield-evidence.mjs'
import {
  readShieldState, shieldCastPoint, shieldTextureReady, captureShieldFrame, pauseVisibleShields,
  watchShieldDisposal, readShieldDisposal, watchShieldLoad, bindShieldHomeStore,
  writeShieldFixture, readCommittedShieldCheckpoint, installShieldExpiryObserver,
} from './shield-observer.mjs'

const sha = bytes => createHash('sha256').update(bytes).digest('hex')

// The shared spell-visuals runner owns browser/server only. This standalone
// episode owns its fresh context, admitted against the unchanged outer deadline.
export default async function spellShield({ browser, url, output, source, expectedRevision, deadlineAt }) {
  const report = { schema: 'populous-new-dawn/shield-visuals', schemaVersion: 1,
    status: 'running', source: { commit: source.commit, files: {} }, expectedRevision, currentCheckpointVersion: CHECKPOINT_VERSION,
    errors: [], captures: [], actions: [], startedAt: new Date().toISOString(),
    method: 'Supplied current-format field checkpoint, actual public Load Game, Shield hotkey 0 and world click, public pause/zoom, current Save/Load and ordinary elapsed-turn expiry of declared near-expiry foreign status.',
    limits: ['Supplied stock and controlled allied population, terrain and foreign status, not earned acquisition or ordinary campaign progression.',
      'Native table/rectangle/palette source coverage is separate from browser GPU consistency. This is not pixel-perfect original executable/GPU equivalence.',
      'Foreign remaining status is declared in the offline checkpoint. The browser never rewrites live status, clocks, actors or ownership.',
      'Pause uses observer-timed DOM activation of the public button; physical-pointer pause timing is not covered.',
      'Near-expiry adapter continuation is covered, not the complete native lifetime or original allocation/index ownership.',
      'Actual current in-session Save/Load is covered, not fresh-process persistence or historical save upgrading.',
      'Old-scene removal and Shield material disposal are covered through public Load. Live per-unit deletion is not manufactured or claimed.',
      'Causal diagnostic redraws temporarily hide only Shield sprites, restore them in finally and compare the complete World and camera/clock. This perturbs rendering and is not a performance measurement.'],
  }
  const save = () => writeFileSync(resolve(output, 'shield-visuals.json'), JSON.stringify(report, null, 2) + '\n')
  return runShieldEpisode({ browser, deadlineAt, report, save, perform: async ({ context, step, remaining }) => {
    assert.equal(CHECKPOINT_VERSION, 4, 'Combined visuals require the merged current-v4 format')
    assert.equal(expectedRevision, source.commit)
    for (const name of SHIELD_VISUAL_INPUTS) {
      const digest = sha(readFileSync(new URL(`../../${name}`, import.meta.url)))
      assert.equal(source.files[name], digest, `Shield source input ${name} must match exact checkout`)
      report.source.files[name] = digest
    }
    const fixture = await step('prepare declared current checkpoint', () => createShieldCheckpoint(output, report.source))
    report.setup = fixture.receipt
    const allIds = [...fixture.ids.blue, ...fixture.ids.foreign]
    const ownerIds = [fixture.ids.blue[0], ...fixture.ids.foreign]
    const page = await step('create page', () => context.newPage())
    page.setDefaultTimeout(8000)
    const error = message => { if (report.errors.length < 20) report.errors.push(String(message).slice(0, 2000)) }
    page.on('pageerror', error)
    page.on('console', message => { if (message.type() === 'error') error(message.text()) })
    page.on('crash', () => error('Page crashed'))
    const action = (name, operation) => step(name, async () => {
      report.actions.push({ name, at: new Date().toISOString() })
      return operation()
    })
    // Keyboard activation uses the same public button without pointer-stability
    // latency consuming the short natural Shield visibility window.
    const button = name => action(name, () => page.getByRole('button', { name, exact: true }).press('Enter'))
    const state = () => page.evaluate(readShieldState, allIds)
    const settle = () => page.waitForFunction(() => {
      const s = window.testSceneRef.current
      return !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition && !s.overviewActive
    }, null, { timeout: Math.min(8000, remaining()) })
    const capture = async (ids, label, owners, scaled) => {
      const retained = await step(`same-render ${label} Shield pixels`, () =>
        page.evaluate(captureShieldFrame, { ids, label }))
      report.captures.push(retained)
      // Retain actual raw crops even if validation rejects the observation.
      for (const sample of retained.samples) {
        assert.match(sample.filename, /^shield-(original|scaled|loaded)-[0-3]\.png$/)
        assert.match(sample.png, /^data:image\/png;base64,/)
        const bytes = Buffer.from(sample.png.split(',')[1], 'base64')
        assert.ok(bytes.length > 64 && bytes.length < 512 * 1024)
        writeFileSync(resolve(output, sample.filename), bytes, { flag: 'wx' })
        sample.pngSha256 = sha(bytes); delete sample.png
        save()
        Object.assign(sample, validateShieldPng(readFileSync(resolve(output, sample.filename)), sample))
      }
      save()
      retained.acceptance = validateShieldCapture(retained, { owners, scaled, units })
      save()
    }
    await step('install lossless checkpoint transport', () => page.addInitScript({
      content: `window.shieldCheckpointCodec = ${checkpointCodec.toString()};`,
    }))
    await step('open shipped Home', () => page.goto(url, { waitUntil: 'domcontentloaded' }))
    const json = JSON.stringify(fixture.transfer)
    assert.equal(await step('commit supplied fixture in fresh IDB', () => page.evaluate(writeShieldFixture, json)), json)
    await step('reload Home for current checkpoint restore', () => page.reload({ waitUntil: 'domcontentloaded' }))
    await step('wait for public Load Game', () => page.waitForFunction(m2LoadReady))
    await page.evaluate(bindShieldHomeStore)
    await page.evaluate(watchShieldLoad)
    await button('Load Game')
    await step('bind real ready Scene', () => bindGame(page))
    const initialBoundary = await page.evaluate(() => window.shieldRestored)
    assert.deepEqual(JSON.parse(initialBoundary), fixture.expected, 'Current public Load restores the entire expected World')
    writeFileSync(resolve(output, 'shield-initial-load-boundary.json'), initialBoundary, { flag: 'wx' })
    report.initialLoad = { completeWorldMatched: true, sha256: sha(initialBoundary) }
    await button('Pause game')
    await page.waitForFunction(() => window.testStore.getWorld().paused)
    report.beforeCast = await state()
    assert.equal(report.beforeCast.shots, 1)
    assert.equal(report.beforeCast.inputMask, 0)
    assert.deepEqual(report.beforeCast.selected, [fixture.ids.shaman])
    assert.ok(report.beforeCast.people.slice(0, 6).every(unit => unit.shield === 0))
    assert.ok(report.beforeCast.people.slice(6).every(unit => unit.shield > 0))
    await settle()
    const point = report.castPoint = await page.evaluate(shieldCastPoint, fixture.target)
    await action('Public Shield hotkey 0', () => page.keyboard.press('0'))
    assert.equal((await state()).mode, 'shield')
    await button('Resume game')
    // Arm before the real pointer cast; the one-shot observer activates only the shipped Pause handler.
    const [pause] = await Promise.all([
      action('Observer-timed DOM activation of public Pause handler', () =>
        page.evaluate(pauseVisibleShields, { blueIds: fixture.ids.blue, ownerIds, timeoutMs: Math.min(8000, remaining()) })),
      action('Public left click on canvas-owned Shield target', () => page.mouse.click(point.x, point.y)),
    ])
    const beforePause = checkpointCodec(JSON.parse(pause.before), true)
    const afterPause = checkpointCodec(JSON.parse(pause.after), true)
    assert.equal(beforePause.paused, false); assert.equal(afterPause.paused, true)
    assert.deepEqual({ ...beforePause, paused: true }, afterPause, 'Only public pause changes the complete World')
    assert.deepEqual(pause.clockBefore, pause.clockAfter)
    report.visiblePause = { ...pause,
      beforeSha256: sha(pause.before), afterSha256: sha(pause.after), onlyPausedChanged: true }
    assert.equal(pause.timestamp, pause.sceneTimestamp)
    report.afterCast = await state()
    assert.equal(report.afterCast.shots, 0)
    assert.ok(report.afterCast.people.every(unit => unit.shield > 0 && unit.flags3 & 0x8000 && !unit.fight))
    await step('wait for actual Shield atlas and four visible owners', () =>
      page.waitForFunction(shieldTextureReady, ownerIds, { timeout: Math.min(5000, remaining()) }))
    report.atlas = await step('verify served original Shield PNG bytes', () => page.evaluate(async id => {
      const sprite = window.testSceneRef.current.unitMeshes.get(id).userData.shield[0]
      const url = sprite.material.map.image.currentSrc || sprite.material.map.image.src
      const response = await fetch(url)
      if (!response.ok) throw Error(`Shield atlas fetch failed: ${response.status}`)
      const bytes = await response.arrayBuffer()
      const sha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
        .map(value => value.toString(16).padStart(2, '0')).join('')
      return { url, bytes: bytes.byteLength, sha256 }
    }, ownerIds[0]))
    const atlasBytes = readFileSync(new URL('../../public/original/shield.png', import.meta.url))
    assert.equal(report.atlas.sha256, sha(atlasBytes))
    assert.equal(report.atlas.bytes, atlasBytes.length)
    await capture(ownerIds, 'original', [0, 1, 2, 3], false)
    await step('retain four-owner viewport context', () => page.screenshot({ path: resolve(output, 'shield-context.png') }))
    report.pauseBefore = await state()
    await step('public pause remains stable', () => page.waitForTimeout(160))
    report.pauseAfter = await state()
    assert.deepEqual(report.pauseAfter, report.pauseBefore)
    await action('Public close zoom for scaled sprite path', () => page.keyboard.press('='))
    await settle()
    assert.equal(await page.evaluate(() => window.testSceneRef.current.viewPreset), 3)
    await capture([ownerIds[0]], 'scaled', [0], true)
    await action('Public zoom back to normal', () => page.keyboard.press('-'))
    await settle()

    // F8 is used only for the shipped build-revision field, not FPS acceptance.
    await action('Public F8 build identity readout', () => page.keyboard.press('F8'))
    await page.waitForFunction(() => window.testSceneRef.current.fpsGraph?.samples.recentFrames().length > 0)
    const [file] = await Promise.all([page.waitForEvent('download'), button('Export recent frames')])
    await step('retain actual build identity export', () => file.saveAs(resolve(output, 'shield-build-frames.json')))
    const frameBytes = readFileSync(resolve(output, 'shield-build-frames.json'))
    const frameReport = JSON.parse(frameBytes)
    assert.equal(frameReport.buildRevision, expectedRevision)
    report.buildIdentity = { revision: frameReport.buildRevision, sha256: sha(frameBytes) }
    await action('Close public F8 readout', () => page.keyboard.press('F8'))

    await page.evaluate(watchShieldDisposal, allIds)
    await button('Game settings'); await button('Save Game'); await button('Save checkpoint')
    await page.getByRole('dialog', { name: 'Game menu', exact: true }).getByRole('status')
      .filter({ hasText: 'Checkpoint saved in this browser.' }).waitFor()
    const committed = await step('read actual current committed checkpoint', () => page.evaluate(readCommittedShieldCheckpoint))
    assert.equal(committed.version, CHECKPOINT_VERSION)
    const { loadSceneFixture } = await import('../../tests/support/bloodlust-scene.mjs')
    const { migrateCheckpoint } = await loadSceneFixture()
    const expectedLoad = checkpointCodec(migrateCheckpoint(checkpointCodec(JSON.parse(committed.world), true)))
    writeFileSync(resolve(output, 'shield-public-save.json'), JSON.stringify({ version: committed.version, world: JSON.parse(committed.world) }), { flag: 'wx' })
    writeFileSync(resolve(output, 'shield-public-load-expected.json'), JSON.stringify(expectedLoad), { flag: 'wx' })
    report.saved = { version: committed.version, worldSha256: sha(committed.world),
      people: (await state()).people }
    await page.evaluate(watchShieldLoad)
    await button('Back'); await button('Load Game'); await button('Load checkpoint')
    await step('bind current loaded Scene', () => bindGame(page))
    const restored = await page.evaluate(() => window.shieldRestored)
    assert.deepEqual(JSON.parse(restored), expectedLoad, 'Current public Save/Load preserves the full normalized World')
    writeFileSync(resolve(output, 'shield-public-load-boundary.json'), restored, { flag: 'wx' })
    report.loaded = { version: CHECKPOINT_VERSION, completeWorldMatched: true, worldSha256: sha(restored) }
    report.disposal = await page.evaluate(readShieldDisposal)
    assert.equal(report.disposal.materials, allIds.length * 3)
    assert.equal(report.disposal.disposedMaterials, report.disposal.materials)
    assert.equal(report.disposal.disposedAtlas, 0)
    for (const key of ['sceneReplaced', 'worldReplaced', 'disposed', 'canvasRemoved'])
      assert.equal(report.disposal[key], true, key)
    await button('Pause game')
    await page.waitForFunction(() => window.testStore.getWorld().paused)
    await settle()
    await step('wait for loaded Blue Shield texture', () => page.waitForFunction(shieldTextureReady, [ownerIds[0]]))
    await capture([ownerIds[0]], 'loaded', [0], false)
    report.beforeExpiry = await state()
    const expectedSeconds = Math.max(...report.beforeExpiry.people.slice(6).map(unit => unit.shield)) / 12
    assert.ok(expectedSeconds > 0, 'Declared near-expiry status must still be present after Load')
    assert.ok(remaining() > expectedSeconds * 1000 + 2000, 'Insufficient time for natural expiry and cleanup, never skip')
    await page.evaluate(installShieldExpiryObserver, fixture.ids.foreign)
    await button('Resume game')
    await step('ordinary elapsed-turn expiry of declared foreign status', () => page.waitForFunction(() =>
      window.shieldExpiry.result.done || window.shieldExpiry.result.error, null,
    { timeout: Math.min(remaining(), expectedSeconds * 1000 + 1500) }))
    report.expiry = await page.evaluate(() => window.shieldExpiry.result)
    assert.equal(report.expiry.error, null); assert.equal(report.expiry.done, true)
    assert.ok(report.expiry.samples[0].people.every(person => person.remaining > 0))
    assert.ok(report.expiry.samples.at(-1).people.every(person =>
      person.remaining === 0 && !(person.flags3 & 0x8000) && person.visible.every(visible => !visible)))
    await button('Pause game')
    report.terminal = await state()
    assert.ok(report.terminal.people.slice(0, 6).every(unit => unit.shield > 0 && unit.flags3 & 0x8000))
    assert.deepEqual(report.errors, [])
    report.finishedAt = new Date().toISOString()
    save()
  } })
}
