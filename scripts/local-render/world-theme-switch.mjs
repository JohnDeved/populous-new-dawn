import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { bindGame, showAllMissions, waitForShamanReadiness } from '../browser-game.mjs'
import {
  installThemeFrame,
  observeThemeAction,
  readThemePose,
  requireThemeCheckpoint,
  waitForThemeSave,
} from './world-theme-witness.mjs'

export async function focusThemeShaman(page) {
  await page.getByRole('button', { name: 'Select and focus shaman', exact: true }).click()
}

export const referenceSource = '219384134d21200f80df0496a4866fb02fb200db'
export const themeViewSequence = Object.freeze([
  Object.freeze({ key: '-', preset: 2, overview: false, capture: 'ground' }),
  Object.freeze({ key: '-', preset: 4, overview: true, capture: 'overview' }),
  Object.freeze({ key: '=', preset: 2, overview: false }),
  Object.freeze({ key: '=', preset: 0, overview: false }),
])
const sha = value => createHash('sha256').update(value).digest('hex')
// Raw PAL/BIGF/CLIFF/DISP/FADE oracle: reviewed PR312 inventory, not the selector.
const terrainHashes = {
  c: '8b23328932f2aeac33a0ce65e64cc0ab9bc110fe35a812b1d53ab81f9e68f68f',
  s: 'e4bbc3509b7eae22ed24648e0a7161ba940a723de1720a9ff479e842075aaaac',
  p: 'a07fc142b38441dd65bc99e55e2eb8f33a6423b4d02b3662f3be78e4eb4880f9',
}
export function admitThemeMode(
  root,
  mode = 'candidate',
  git = args => execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim()
) {
  assert.ok(
    ['candidate', 'reference'].includes(mode),
    'Explicit candidate or reference mode required'
  )
  if (mode === 'candidate') return { mode }
  git(['diff', '--exit-code', referenceSource, '--', 'app', 'public'])
  assert.equal(
    git(['ls-files', '--others', '--exclude-standard', '--', 'app', 'public']),
    '',
    'Reference mode rejects untracked application/assets'
  )
  return {
    mode,
    referenceSource,
    appTree: git(['rev-parse', `${referenceSource}:app`]),
    publicTree: git(['rev-parse', `${referenceSource}:public`]),
    applicationEqual: true,
  }
}

// The maintained harness imports its scenario BEFORE runLocalBrowser. Reference
// admission therefore fails before launching its server/browser; it is never a
// fallback selected after a strict candidate assertion fails.
const selectedMode = process.env.POPULOUS_THEME_MODE ?? 'candidate'
assert.ok(['candidate', 'reference'].includes(selectedMode), 'Unknown POPULOUS_THEME_MODE')
const rootArgument = process.argv.indexOf('--game-root')
const referenceAdmission =
  selectedMode === 'reference'
    ? admitThemeMode(
        resolve(rootArgument < 0 ? process.cwd() : process.argv[rootArgument + 1]),
        selectedMode
      )
    : null

export function requireThemeFrame(frame, expected, { reference = false } = {}) {
  assert.equal(frame.level, expected.level)
  assert.ok(frame.rendererFrame > 0)
  assert.equal(frame.minimap.boundary, 'post-animate-microtask')
  assert.ok(frame.minimap.before.rendererFrame >= frame.rendererFrame)
  assert.deepEqual(frame.minimap.before, frame.minimap.after)
  assert.equal(frame.minimap.before.level, frame.level)
  assert.equal(frame.terrainSha256, terrainHashes[reference ? 'c' : expected.landscape])
  if (!reference) {
    assert.deepEqual(frame.environment.landscape, {
      requested: expected.requestedLandscape,
      bank: expected.landscape,
      supported: true,
      terrain: expected.terrain,
      modelAtlas: expected.atlas,
    })
    assert.deepEqual(frame.environment.objects, {
      requested: expected.requestedObjects,
      bank: expected.objects,
      supported: true,
    })
  }
  assert.ok(frame.trees.length > 0)
  if (!frame.camera.overview)
    assert.ok(frame.visibleTreeIds.length > 0, 'Ground view must include an authored tree')
  for (const tree of frame.trees) {
    const model = expected.models[tree.model]
    assert.ok(model, `Missing independently imported model ${tree.model}`)
    if (!reference) {
      assert.equal(tree.bank, expected.objects)
      assert.equal(tree.dataSha256, model.dataSha256)
      assert.deepEqual(tree.shapes, model.shapes)
    }
    assert.equal(tree.stage, 4)
    assert.equal(tree.positionsSha256, model.positionsSha256)
    assert.equal(tree.uvSha256, model.uvSha256)
    assert.equal(tree.vertices, model.vertices)
  }
  for (const material of frame.materials) {
    const special =
      reference &&
      frame.level === 3 &&
      material.model === 95 &&
      new URL(material.src).pathname === '/original/temple-model-p.png'
    assert.equal(
      new URL(material.src).pathname,
      `/original/${special ? 'temple-model-p' : reference ? 'atlas' : expected.atlas}.png`
    )
    assert.equal(material.encoded, true)
    if (!reference) assert.equal(material.bank, expected.objects)
  }
}

export default async function worldThemeSwitch({
  page,
  root,
  url,
  output,
  receipt,
  signal,
  observeCheckpoint,
}) {
  assert.ok(receipt.profile, 'Theme route requires a fresh owned --profile')
  assert.equal(receipt.profile.mode, 'created', 'Theme route must start with its own fresh profile')
  assert.equal(receipt.profile.checkpointAtStart, null)
  const admission = admitThemeMode(root, selectedMode),
    reference = selectedMode === 'reference'
  if (reference)
    assert.deepEqual(admission, referenceAdmission, 'Reference admission changed after launch')
  const report = {
    status: 'running',
    admission,
    source: receipt.source,
    actions: [],
    views: [],
    responses: [],
    method:
      'Shipped controls, real RAF, synchronous read-only action boundaries and one natural frame per view.',
    limits:
      'Headless rendered functional evidence. Cross-mission images are not matched comparisons. Reference mode does not establish corrected resource selection. No native raster parity, ordinary campaign victory, acquisition animation or hardware performance claim.',
  }
  const save = () =>
    writeFileSync(
      resolve(output, 'world-theme-switch.json'),
      `${JSON.stringify(report, null, 2)}\n`
    )
  const pending = [],
    responseErrors = [],
    bodies = new Map()
  const response = message => {
    const pathname = new URL(message.url()).pathname
    if (
      !/^\/original\/(?:atlas(?:-[sp])?\.png|landscape(?:-[sp])?\.bin|temple-model-p\.png|temple-sparkles-p\.png)$/.test(
        pathname
      )
    )
      return
    const work = (async () => {
      assert.equal(message.ok(), true, `Selected resource HTTP failure: ${pathname}`)
      const bytes = await message.body(),
        hash = sha(bytes)
      assert.equal(
        hash,
        sha(readFileSync(resolve(root, `public${pathname}`))),
        `Served resource ${pathname}`
      )
      bodies.set(pathname, hash)
      report.responses.push({ path: pathname, bytes: bytes.length, sha256: hash })
    })().catch(error => responseErrors.push(String(error?.stack ?? error)))
    pending.push(work)
  }
  page.on('response', response)
  const button = name => page.getByRole('button', { name, exact: true })
  const act = async (kind, label) => {
    const result = await observeThemeAction({
      page,
      signal,
      kind,
      label,
      click: () => button(label).click(),
    })
    report.actions.push(result)
    save()
    return result
  }
  const settled = async () => {
    await page.waitForFunction(
      () => {
        const scene = window.testSceneRef.current
        return (
          scene.world === window.testStore.getWorld() &&
          !scene.world.inputMask &&
          !(scene.world.flyby.flags & 1) &&
          !scene.viewTransition &&
          !scene.overviewStage &&
          !scene.cameraMotion.active &&
          !scene.resultCamera.active
        )
      },
      undefined,
      { timeout: 30000 }
    )
    signal.throwIfAborted()
  }
  const ready = async level => {
    await bindGame(page)
    await page.waitForFunction(
      () =>
        window.testSceneRef.current.world.flyby.flags & 1 ||
        !window.testSceneRef.current.world.inputMask
    )
    const skip = page.locator('.skip-introduction')
    if (await skip.isVisible()) await skip.click()
    await waitForShamanReadiness(page)
    await settled()
    assert.equal((await page.evaluate(readThemePose)).level, level)
  }
  const { modelStage } = await import(pathToFileURL(resolve(root, 'app/model-faces.ts')).href)
  const original = JSON.parse(readFileSync(resolve(root, 'app/original-models.json')))
  const shapes = JSON.parse(readFileSync(resolve(root, 'app/original-shapes.json'))).objects
  const bank6 = reference
    ? null
    : JSON.parse(readFileSync(resolve(root, 'app/original-models-bank6.json')))
  const expectedFor = level => {
    const landscape = ['c', 's', 'p'][level - 1],
      objects = level === 3 ? 6 : 2
    const models = Object.fromEntries(
      [13, 14, 15, 16, 17, 18].map(id => {
        const data = !reference && objects === 6 ? bank6.models[id] : original[id]
        const stage = modelStage(data, 4)
        return [
          id,
          {
            dataSha256: sha(JSON.stringify(data, Object.keys(data).sort())),
            shapes: !reference && objects === 6 ? bank6.shapes[id] : shapes[id],
            positionsSha256: sha(Buffer.from(new Float32Array(stage.p).buffer)),
            uvSha256: sha(Buffer.from(new Float32Array(stage.uv).buffer)),
            vertices: stage.p.length / 3,
          },
        ]
      })
    )
    return {
      level,
      landscape,
      objects,
      requestedLandscape: [12, 28, 25][level - 1],
      requestedObjects: level === 3 ? 6 : 0,
      terrain: landscape === 'c' ? 'landscape.bin' : `landscape-${landscape}.bin`,
      atlas: landscape === 'c' ? 'atlas' : `atlas-${landscape}`,
      models,
    }
  }
  const capture = async (label, level) => {
    signal.throwIfAborted()
    const handle = await page.evaluateHandle(installThemeFrame, { requireIdentity: !reference })
    let frame
    try {
      // Poll the actual observer handle; no replaceable global observation API.
      for (let tries = 0; tries < 100; tries++) {
        signal.throwIfAborted()
        const state = await handle.evaluate(observer => observer.status())
        assert.deepEqual(state.errors, [])
        if (state.captured) break
        await page.waitForTimeout(50)
      }
      frame = await handle.evaluate(observer => observer.read())
      requireThemeFrame(frame, expectedFor(level), { reference })
      await Promise.all(pending)
      assert.deepEqual(responseErrors, [])
      for (const material of frame.materials)
        assert.ok(
          bodies.has(new URL(material.src).pathname),
          'Loaded material must have its actual served-byte receipt'
        )
      for (const [owner, key] of [
        [frame, 'png'],
        [frame.minimap, 'minimapPng'],
      ]) {
        const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(owner.png)
        assert.ok(match, 'Natural frame must be PNG')
        const name = `${label}-${key}.png`,
          bytes = Buffer.from(match[1], 'base64')
        writeFileSync(resolve(output, name), bytes)
        owner.png = { file: name, sha256: sha(bytes) }
      }
      const before = await page.evaluate(readThemePose)
      await page.screenshot({ path: resolve(output, `${label}-viewport.png`) })
      const after = await page.evaluate(readThemePose)
      report.views.push({
        label,
        frame,
        screenshot: { file: `${label}-viewport.png`, before, after },
      })
    } finally {
      try {
        const closed = await handle.evaluate(observer => observer.close())
        assert.equal(closed.closed, true)
        assert.deepEqual(closed.errors, [])
      } finally {
        await handle.dispose()
      }
      save()
    }
  }
  const views = async (label, level) => {
    // Same delivered controls in both modes; retain actual poses rather than
    // inventing exact cross-run camera/turn correspondence.
    await focusThemeShaman(page)
    await settled()
    const initial = await page.evaluate(readThemePose)
    assert.equal(initial.preset, 0)
    assert.equal(initial.overview, false)
    for (const step of themeViewSequence) {
      await page.keyboard.press(step.key)
      await settled()
      const pose = await page.evaluate(readThemePose)
      assert.equal(pose.preset, step.preset)
      assert.equal(pose.overview, step.overview)
      if (step.capture) await capture(`${label}-${step.capture}`, level)
    }
  }
  const switchTo = async level => {
    await button('Game settings').click()
    await button('Select Level').click()
    await showAllMissions(page)
    const result = await act('start', `Mission ${level}`)
    assert.equal(result.digest.level, level)
    assert.equal(result.digest.turn, 0)
    await ready(level)
  }
  try {
    save()
    await button('Select Mission 1').click()
    await act('start', 'Start Mission 1')
    await ready(1)
    await views('fresh-m1', 1)
    await switchTo(3)
    await views('fresh-m3', 3)
    await button('Game settings').click()
    const saved = await act('save', 'Save checkpoint')
    report.saved = await waitForThemeSave({
      observeCheckpoint,
      expected: saved.digest,
      signal,
      pause: () => page.waitForTimeout(100),
    })
    await page.getByRole('button', { name: 'Continue Game', exact: false }).click()
    await switchTo(1)
    await capture('warm-m1', 1)
    await switchTo(2)
    await views('warm-m2', 2)
    await button('Game settings').click()
    const loaded = await act('load', 'Load checkpoint')
    requireThemeCheckpoint(loaded.digest, report.saved.checkpoint)
    await ready(3)
    await capture('loaded-m3', 3)
    await button('Game settings').click()
    const restarted = await act('restart', 'Restart world')
    assert.equal(restarted.digest.level, 3)
    assert.equal(restarted.digest.turn, 0)
    await ready(3)
    await capture('restarted-m3', 3)
    assert.equal(
      (await observeCheckpoint('After theme Restart')).checkpoint.checkpointSha256,
      report.saved.checkpoint.checkpointSha256
    )
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.getByRole('dialog', { name: 'Start game', exact: true }).waitFor()
    const restored = await act('load', 'Load Game')
    requireThemeCheckpoint(restored.digest, report.saved.checkpoint)
    await ready(3)
    await capture('startup-loaded-m3', 3)
    assert.equal(
      (await observeCheckpoint('After startup theme Load')).checkpoint.checkpointSha256,
      report.saved.checkpoint.checkpointSha256
    )
    await Promise.all(pending)
    assert.deepEqual(responseErrors, [])
    assert.deepEqual(receipt.errors, [])
    report.status = reference ? 'captured-reference' : 'passed'
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error?.stack ?? error)
    throw error
  } finally {
    page.off('response', response)
    await Promise.all(pending)
    report.responseErrors = responseErrors
    save()
  }
  return report
}
