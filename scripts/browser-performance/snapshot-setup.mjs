import { CHECKPOINT_VERSION } from '../../app/checkpoint-format.ts'
import { restoreCapacityPolicy } from '../../app/capacity-policy.ts'
// Test-only authored snapshot transport and public-Load setup. Never imported by app/.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkpointCodec } from '../tutorial-browser/checkpoint-codec.mjs'
import { bindGame } from '../browser-game.mjs'

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const encoded = value => JSON.stringify(checkpointCodec(value))
export const snapshotAuthoring = Object.freeze({ version: 1, level: 2, frames: 140, secondsPerFrame: 1 / 24,
  transition: 'production skipIntroduction during the first flyby warmup', turn: 70,
  targetId: 54, focusKey: 'f', dragPixels: 32, finalAngle: 0,
  finalInteraction: 'one public right-click clears selection and mode' })

// Deliberately not the entire World. Presentation clocks, sound draining, terrain
// upload queues, cosmetic RNG and tooltip state may advance while ordinarily paused.
// Complete unit state and authored terrain/geometry remain strict input guards.
export function snapshotSimulationIdentity(w) {
  return {
    scalar: { level: w.outcome.level, turn: w.turn, time: w.time, pendingTime: w.pendingTime,
      randomState: w.randomState, nextId: w.nextId },
    units: w.units,
    motionRoutes: w.motionRoutes,
    terrain: { terrain: w.terrain, terrainVersion: w.terrainVersion, landVersion: w.landVersion,
      heights: w.land.heights, flags: w.land.flags, cliffs: w.land.cliffs, categories: w.land.categories,
      walkMasks: w.land.walkMasks, buildingIds: w.land.buildingIds, owners: w.land.owners },
    geometry: { buildings: w.buildings, vehicles: w.vehicles, trees: w.trees, shrines: w.shrines },
  }
}

export function validateSnapshotFixture(fixture) {
  assert.ok(fixture && fixture.receipt && fixture.transfer && fixture.expected, 'Missing snapshot fixture')
  const text = JSON.stringify(fixture.transfer), expectedText = JSON.stringify(fixture.expected)
  assert.ok(Buffer.byteLength(text) < 16 * 1024 * 1024, 'Snapshot transfer exceeds bound')
  assert.equal(hash(text), fixture.receipt.snapshotSha256, 'Snapshot bytes/hash mismatch')
  assert.equal(hash(expectedText), fixture.receipt.expectedLoadedSha256, 'Expected migration bytes/hash mismatch')
  const record = checkpointCodec(fixture.transfer, true), world = checkpointCodec(fixture.expected, true)
  assert.equal(encoded(record), text, 'Snapshot transport is not canonical/lossless')
  assert.equal(encoded(world), expectedText, 'Expected transport is not canonical/lossless')
  assert.equal(record.version, CHECKPOINT_VERSION)
  for (const w of [record.world, world]) {
    assert.deepEqual(w.capacityPolicy, { version: 1, mode: 'scalable' })
    restoreCapacityPolicy(w)
    assert.equal(w.outcome.level, 2); assert.equal(w.turn, 70); assert.equal(w.inputMask, 0)
    assert.equal(w.flyby.flags & 1, 0); assert.equal(w.paused, false)
    assert.deepEqual(w.selected, [54]); assert.ok(w.units.find(u => u.id === 54 && u.kind === 'shaman' && u.native))
  }
  assert.equal(hash(encoded(snapshotSimulationIdentity(world))), fixture.receipt.loadedSimulationSha256,
    'Expected simulation state/hash mismatch')
  return { transferText: text, expectedText }
}

export async function createSnapshotFixture({ output, source }) {
  const root = resolve(import.meta.dirname, '../..')
  assert.match(source?.commit ?? '', /^[a-f0-9]{40}$/)
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), source.commit,
    'Fixture must be authored by the exact trusted base')
  const paths = ['app', 'tests/support/bloodlust-scene.mjs', 'scripts/tutorial-browser/checkpoint-codec.mjs', 'package.json', 'package-lock.json']
  assert.equal(execFileSync('git', ['diff', 'HEAD', '--', ...paths], { cwd: root, encoding: 'utf8' }), '',
    'Fixture runtime source must match its exact commit')
  const files = execFileSync('git', ['ls-files', '-z', '--', ...paths], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)
  const sourceFiles = Object.fromEntries(files.map(name => [name, hash(readFileSync(resolve(root, name)))]))
  const { loadSceneFixture } = await import('../../tests/support/bloodlust-scene.mjs')
  const { createWorld, advanceGame, migrateCheckpoint, cancelInteraction } = await loadSceneFixture()
  const { skipIntroduction } = await import('../../app/scene-camera-runtime.ts')
  const { createTooltipFrame } = await import('../../app/scene-tooltip-runtime.ts')
  const world = createWorld(2, 'scalable'), clock = { animationTime: 0, animationFrame: 0 }
  assert.equal(world.inputMask, 128, 'Authored startup contract changed')
  for (let frame = 0; frame < snapshotAuthoring.frames; frame++)
    advanceGame(world, clock, snapshotAuthoring.secondsPerFrame)
  assert.equal(world.turn, 70); assert.equal(world.inputMask, 64)
  assert.equal(world.flyby.warmup, 6); assert.equal(world.flyby.flags, 21)
  // The genuine controller owns the skip decision and input-mask release. The
  // minimal authoring context supplies only presentation outputs, not fake ticks.
  let changed = 0
  skipIntroduction({ world, tooltipFrame: createTooltipFrame(world.cameras.elapsed), flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() { changed++ } })
  assert.equal(changed, 1); assert.equal(world.inputMask, 0); assert.equal(world.flyby.flags, 20)
  const checkpoint = { version: CHECKPOINT_VERSION, world }
  const expectedWorld = migrateCheckpoint(migrateCheckpoint(structuredClone(world)))
  const admittedWorld = structuredClone(expectedWorld)
  cancelInteraction(admittedWorld)
  assert.deepEqual(admittedWorld.selected, []); assert.equal(admittedWorld.mode, null)
  const transfer = checkpointCodec(checkpoint), expected = checkpointCodec(expectedWorld)
  assert.deepEqual(checkpointCodec(transfer, true), checkpoint)
  const receipt = { version: 1, sourceCommit: source.commit, sourceFiles,
    generatorSha256: hash(readFileSync(import.meta.filename)),
    codecSha256: hash(readFileSync(new URL('../tutorial-browser/checkpoint-codec.mjs', import.meta.url))),
    authoring: snapshotAuthoring, node: process.version,
    setup: 'TEST SETUP: exact-base production-controller authored turn-70 snapshot; not a browser-recorded campaign save',
    snapshotSha256: hash(JSON.stringify(transfer)), expectedLoadedSha256: hash(JSON.stringify(expected)),
    loadedSimulationSha256: hash(encoded(snapshotSimulationIdentity(expectedWorld))),
    admittedSimulationSha256: hash(encoded(snapshotSimulationIdentity(admittedWorld))),
    level: world.outcome.level, turn: world.turn, time: world.time, pendingTime: world.pendingTime,
    randomState: world.randomState, cosmeticRandom: world.cosmeticRandom,
    loadedSelected: [...world.selected], selected: [...admittedWorld.selected], focus: { id: 54, x: world.units.find(u => u.id === 54).x,
      z: world.units.find(u => u.id === 54).z } }
  const fixture = { transfer, expected, receipt }
  const { transferText, expectedText } = validateSnapshotFixture(fixture)
  if (output) for (const [name, text] of [['snapshot-transfer.json', transferText],
    ['snapshot-expected.json', expectedText], ['snapshot-source.json', JSON.stringify(receipt, null, 2)]])
    writeFileSync(resolve(output, name), text, { flag: 'wx' })
  return fixture
}

// Serializable setup seam: synchronous subscription sees replacement before any
// resumed RAF; its property latch also spans Home.beginLoad's later paused=false.
// It never replaces store.change, tick, RAF, a renderer, a picker or a clock.
export function armSnapshotPauseLatch(store, codec) {
  const original = store.getWorld()
  let world, descriptor, boundary, failure, forcedUnpauses = 0, released = false, installed = false
  const unsubscribe = store.subscribe(() => {
    if (store.getWorld() === original || world) return
    world = store.getWorld()
    try {
      descriptor = Object.getOwnPropertyDescriptor(world, 'paused')
      if (!descriptor?.configurable || !descriptor.writable || typeof descriptor.value !== 'boolean')
        throw Error('Snapshot pause property is not an ordinary writable boolean')
      // Witness exact migration before applying the declared setup-only pause.
      boundary = JSON.stringify(codec(world))
      Object.defineProperty(world, 'paused', { enumerable: descriptor.enumerable, configurable: true,
        get: () => true, set: value => { if (value === false) forcedUnpauses++ } })
      installed = true
    } catch (error) { failure = String(error) }
  })
  return {
    read: () => ({ boundary, failure, forcedUnpauses, loaded: !!world, released }),
    release() {
      if (released) return
      released = true
      try {
        if (installed)
          Object.defineProperty(world, 'paused', { ...descriptor, value: true })
      } finally { unsubscribe() }
    },
  }
}

// Compile only trusted helper source into a self-contained Playwright observer.
// Nothing is installed on the page; the codec/identity closures die after the read.
export const observeSnapshotState = Function(`return async function observeSnapshotState() {
  const codec = ${checkpointCodec.toString()};
  const identityOf = ${snapshotSimulationIdentity.toString()};
  const scene = window.testSceneRef?.current, w = window.testStore?.getWorld();
  if (!scene || !w) throw Error('Snapshot scene/store unavailable');
  const digest = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
    new TextEncoder().encode(text))), b => b.toString(16).padStart(2, '0')).join('');
  const observationStartTimestampMs = performance.now();
  const identity = identityOf(w), canvas = scene.renderer.domElement, rect = canvas.getBoundingClientRect();
  const descriptor = Object.getOwnPropertyDescriptor(w, 'paused');
  // Encode every state input synchronously before WebCrypto yields to a real RAF.
  const hashInputs = { simulationSha256: JSON.stringify(codec(identity)),
    unitsSha256: JSON.stringify(codec(identity.units)), terrainSha256: JSON.stringify(codec(identity.terrain)),
    geometrySha256: JSON.stringify(codec(identity.geometry)) };
  const result = {
    ...identity.scalar, paused: w.paused, cosmeticRandom: { ...w.cosmeticRandom },
    observationStartTimestampMs,
    selected: [...w.selected], mode: w.mode, inputMask: w.inputMask, flybyActive: !!(w.flyby.flags & 1),
    sameScene: scene === window.testScene && scene.world === w, sceneConnected: canvas.isConnected,
    latchRemoved: !window.__snapshotPauseLatch && !!descriptor && 'value' in descriptor && descriptor.value === true,
    modalSuspended: scene.modalSuspended, visibility: document.visibilityState,
    camera: { position: { ...scene.cameraPosition }, bearing: scene.cameraBearing,
      viewPoint: { ...scene.viewPoint }, preset: scene.viewPreset, zoom: scene.viewZoom,
      config: { ...scene.view.config }, presetMatches: JSON.stringify(scene.view.config) === JSON.stringify(scene.currentPreset()), transition: scene.viewTransition !== null,
      overview: scene.overviewActive || !!scene.overviewStage || scene.globeMorph.active,
      navigation: scene.navigationButtons(), velocity: { ...scene.cameraVelocity },
      motion: scene.cameraMotion.active, resultMotion: scene.resultCamera.active,
      preview: scene.cameraPreviewButtons, keys: [...scene.keys], pointerButtons: scene.pointerButtons,
      pointerGesture: scene.pointerGesture !== null,
      projection: { width: scene.view.projection.width, height: scene.view.projection.height } },
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio,
      canvas: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } },
  };
  Object.assign(result, Object.fromEntries(await Promise.all(Object.entries(hashInputs).map(async ([key, text]) => [key, await digest(text)]))));
  if (scene !== window.testSceneRef.current || w !== window.testStore.getWorld()) throw Error('Snapshot changed during observation');
  result.timeOriginUnixMs = performance.timeOrigin;
  result.timestampMs = performance.now();
  return result;
}`)()

export function assertSnapshotAdmission(state, fixture, previous) {
  assert.equal(state.level, 2); assert.equal(state.paused, true)
  for (const field of ['sameScene', 'sceneConnected', 'latchRemoved']) assert.equal(state[field], true, field)
  assert.equal(state.visibility, 'visible'); assert.equal(state.inputMask, 0)
  assert.equal(state.flybyActive, false); assert.equal(state.modalSuspended, false)
  assert.equal(state.simulationSha256, fixture.receipt.admittedSimulationSha256, 'Admitted simulation differs from the declared public-input fixture')
  assert.deepEqual(state.selected, fixture.receipt.selected); assert.equal(state.mode, null)
  assert.equal(state.viewport.width, 1440); assert.equal(state.viewport.height, 1000)
  assert.equal(state.viewport.devicePixelRatio, 1)
  const c = state.camera
  assert.deepEqual(c.viewPoint, { x: fixture.receipt.focus.x, z: fixture.receipt.focus.z })
  assert.deepEqual(c.position, { x: Math.round((fixture.receipt.focus.x + 8) * 256) & 65535,
    y: Math.round((-fixture.receipt.focus.z - 8) * 256) & 65535, angle: 0 })
  assert.equal(c.presetMatches, true)
  assert.deepEqual(c.projection, { width: Math.max(1, Math.round(state.viewport.canvas.width)),
    height: Math.max(1, Math.round(state.viewport.canvas.height)) })
  assert.equal(c.bearing, 0); assert.equal(c.preset, 0); assert.equal(c.zoom, 0)
  for (const field of ['transition', 'overview', 'pointerGesture']) assert.equal(c[field], false, field)
  for (const field of ['navigation', 'motion', 'resultMotion', 'pointerButtons']) assert.equal(c[field], 0, field)
  assert.equal(c.preview, null); assert.deepEqual(c.keys, [])
  assert.deepEqual(c.velocity, { turn: 0, forward: 0, side: 0 })
  if (previous) {
    assert.deepEqual(c, previous.camera, 'Camera must be exactly stable across real RAF boundaries')
    assert.deepEqual(state.viewport, previous.viewport)
    assert.equal(state.unitsSha256, previous.unitsSha256); assert.equal(state.terrainSha256, previous.terrainSha256)
    assert.ok(state.timestampMs > previous.timestampMs)
  }
}

export async function loadSnapshot({ page, url, fixture, expectedRevision }) {
  const { transferText, expectedText } = validateSnapshotFixture(fixture)
  assert.match(expectedRevision, /^[a-f0-9]{40}$/)
  const receipt = { fixture: fixture.receipt, expectedRevision, status: 'incomplete' }
  let failure, cleanupError
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    const readback = await page.evaluate(async ({ text, codecSource }) => {
      const codec = (0, eval)(`(${codecSource})`)
      const record = codec(JSON.parse(text), true)
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open('populous-new-dawn', 1)
        r.onupgradeneeded = () => r.result.createObjectStore('checkpoints')
        r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error)
      })
      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction('checkpoints', 'readwrite')
          tx.objectStore('checkpoints').put(record, 'latest')
          tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error)
        })
        return await new Promise((resolve, reject) => {
          const tx = db.transaction('checkpoints', 'readonly'), r = tx.objectStore('checkpoints').get('latest')
          tx.oncomplete = () => resolve(JSON.stringify(codec(r.result)))
          tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error)
        })
      } finally { db.close() }
    }, { text: transferText, codecSource: checkpointCodec.toString() })
    assert.equal(readback, transferText, 'IDB must preserve exact lossless snapshot bytes')
    receipt.idbReadbackSha256 = hash(readback)
    await page.reload({ waitUntil: 'domcontentloaded' })
    const load = page.getByRole('dialog', { name: 'Main menu', exact: true })
      .getByRole('button', { name: 'Load Game', exact: true })
    await load.waitFor({ state: 'visible' })
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Main menu choices"] button[aria-label="Load Game"]')?.getAttribute('aria-disabled') === 'false')
    await page.evaluate(({ latchSource, codecSource }) => {
      if (window.__snapshotPauseLatch) throw Error('Existing snapshot latch')
      const main = document.querySelector('main')
      let fiber = main[Object.keys(main).find(k => k.startsWith('__reactFiber'))], store
      for (; fiber && !store; fiber = fiber.return)
        for (let hook = fiber.memoizedState; hook; hook = hook.next)
          if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe) { store = hook.memoizedState; break }
      if (!store) throw Error('Store unavailable before public Load')
      window.__snapshotPauseLatch = (0, eval)(`(${latchSource})`)(store, (0, eval)(`(${codecSource})`))
    }, { latchSource: armSnapshotPauseLatch.toString(), codecSource: checkpointCodec.toString() })
    await load.click()
    const boundary = await page.evaluate(() => window.__snapshotPauseLatch.read())
    assert.equal(boundary.failure, undefined); assert.equal(boundary.loaded, true)
    assert.equal(boundary.boundary, expectedText, 'Exact public-Load migration boundary mismatch')
    assert.equal(boundary.forcedUnpauses, 1, 'Witness Home public Load forced-unpause exactly once')
    receipt.loadBoundarySha256 = hash(boundary.boundary); receipt.forcedUnpauses = boundary.forcedUnpauses
    await bindGame(page)
    await page.evaluate(() => {
      window.__snapshotPauseLatch.release()
      delete window.__snapshotPauseLatch
    })
    // The saved selected Shaman is already at the constructor's ordinary exact
    // focus. The public focus request is therefore idempotent, not a timed pan.
    await page.locator('canvas.battlefield').focus()
    await page.keyboard.press(snapshotAuthoring.focusKey)
    await page.waitForFunction(() => !window.testSceneRef.current.cameraMotion.active)
    const point = await page.evaluate(() => {
      const c = window.testSceneRef.current.renderer.domElement, r = c.getBoundingClientRect()
      const x = Math.floor(r.left + r.width / 2), y = Math.floor(r.top + r.height / 2)
      if (document.elementFromPoint(x, y) !== c || document.elementFromPoint(x + 32, y) !== c)
        throw Error('Public camera drag path is not owned by battlefield')
      return { x, y }
    })
    for (const dx of [snapshotAuthoring.dragPixels, -snapshotAuthoring.dragPixels]) {
      await page.mouse.move(point.x, point.y); await page.mouse.down({ button: 'right' })
      try { await page.mouse.move(point.x + dx, point.y) } finally { await page.mouse.up({ button: 'right' }) }
    }
    await page.mouse.click(point.x, point.y, { button: 'right' })
    const first = await page.evaluate(observeSnapshotState)
    assertSnapshotAdmission(first, fixture)
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    const admitted = await page.evaluate(observeSnapshotState)
    assertSnapshotAdmission(admitted, fixture, first)
    receipt.admitted = admitted; receipt.status = 'ready'
  } catch (error) { failure = error } finally {
    // Also remove a partially armed latch after click, migration, or readiness
    // failure. No failure path can silently leave it active for measurement.
    try { await page.evaluate(() => { try { window.__snapshotPauseLatch?.release() }
      finally { delete window.__snapshotPauseLatch } }) } catch (error) { cleanupError = error }
  }
  if (cleanupError && !page.isClosed())
    throw new AggregateError(failure ? [failure, cleanupError] : [cleanupError],
      'Snapshot latch cleanup could not be verified')
  if (failure) throw failure
  return receipt
}
