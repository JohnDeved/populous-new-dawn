import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { captureSnapshotQueryWitnessCore } from './snapshot-query-witness-core.mjs'
import { createSnapshotGeometryObserver } from './snapshot-geometry.mjs'
import { installSnapshotObserver } from './snapshot-observer.mjs'
import { observeSnapshotState, assertSnapshotAdmission } from './snapshot-setup.mjs'
import { recognizeReaderSources } from './snapshot-readers.mjs'
import { validateReaderEvidence } from './snapshot-reader-proof.mjs'
import { summarizeSnapshotPhase } from './snapshot-protocol.mjs'

export function installQueryGeometry({ source, token }) {
  for (const name of ['__pndSnapshotQueryWitnessOwner', '__pndSnapshotReaderSession', '__pndSnapshotGeometry', '__pndSnapshotObserver'])
    if (Object.hasOwn(window, name)) throw Error('Query observer namespace already owned')
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, '__pndReaderTypes')
  if (!descriptor || descriptor.writable !== false || descriptor.configurable !== false ||
      !Object.isFrozen(descriptor.value) || typeof descriptor.value.Matrix4 !== 'function')
    throw Error('Trusted fixture reader binding missing')
  const scene = window.testSceneRef.current
  const session = { Matrix4: descriptor.value.Matrix4 }
  const geometry = (0, eval)(`(${source})`)(scene, session)
  const owner = { token, scene, session, geometry, observer: null }
  window.__pndSnapshotQueryWitnessOwner = owner
  window.__pndSnapshotReaderSession = session
  window.__pndSnapshotGeometry = geometry
  return geometry.readerEvidence()
}
export function stopQueryObserver(token) {
  const owner = window.__pndSnapshotQueryWitnessOwner
  if (!owner || owner.token !== token) return { confirmed: false, observer: null }
  let observer = null, confirmed = true, failed = false, failure
  const attempt = fn => {
    try { fn() } catch (error) { confirmed = false; if (!failed) { failed = true; failure = error } }
  }
  attempt(() => {
    if (owner.observer) {
      if (window.__pndSnapshotObserver !== owner.observer) confirmed = false
      else observer = owner.observer.stop()
    } else if (Object.hasOwn(window, '__pndSnapshotObserver')) confirmed = false
  })
  for (const [name, value] of [['__pndSnapshotGeometry', owner.geometry], ['__pndSnapshotReaderSession', owner.session], ['__pndSnapshotQueryWitnessOwner', owner]]) attempt(() => {
    if (window[name] === value) delete window[name]
    else confirmed = false
  })
  if (failed) throw failure
  return { confirmed, observer }
}
export async function readBoundedQueryDownload(download, cap) {
  assert.match(download.suggestedFilename(), /^populous-frames-.*\.json$/)
  const stream = await download.createReadStream()
  assert.ok(stream, 'Production frame download stream missing')
  const chunks = []; let size = 0
  try {
    for await (const chunk of stream) {
      const bytes = Buffer.from(chunk); size += bytes.length
      assert.ok(size <= cap, 'Query raw byte cap exceeded')
      chunks.push(bytes)
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks, size))
  } finally { stream.destroy() }
}

export async function waitForQueryFour(page, token) {
  const handle = await page.waitForFunction(token => {
    const own = window.__pndSnapshotQueryWitnessOwner
    if (!own || own.token !== token || own.observer !== window.__pndSnapshotObserver) throw Error('Query observer replaced during input')
    return own.observer.ready(4)
  }, token)
  await handle.dispose()
}

// Caller must first admit exact source/build/runtime and perform strict public
// Load on its exclusively owned page. This module never alters comparison policy.
export async function captureSnapshotQueryWitness(options) {
  const { page, fixture, expectedRevision, readerSource, readerProvenance, check } = options
  const token = randomUUID(); let geometryAttempted = false, geometryInstalled = false
  const owner = fn => page.evaluate(({ source, token }) => {
    const own = window.__pndSnapshotQueryWitnessOwner
    if (!own || own.token !== token || own.scene !== window.testSceneRef.current ||
        window.__pndSnapshotGeometry !== own.geometry || window.__pndSnapshotReaderSession !== own.session)
      throw Error('Query observer owner changed')
    return (0, eval)(`(${source})`)(own)
  }, { source: fn.toString(), token })
  return captureSnapshotQueryWitnessCore(options, {
    prepare: async () => {
      assert.equal(typeof readerSource?.profile, 'string', 'Exact source profile required')
      assert.ok(readerProvenance)
      await page.mouse.move(900, 400); check()
      await page.waitForTimeout(2000); check()
      const graph = page.locator('.fps-graph')
      await graph.waitFor({ state: 'hidden' }); check()
      await page.keyboard.press('F8'); check()
      await graph.waitFor({ state: 'visible' }); check()
      const recording = await page.waitForFunction(() => window.testSceneRef.current.fpsGraph.samples.recentCount >= 2)
      await recording.dispose(); check()
      return { warmupMs: 2000, initialPoint: [900, 400], recorderOpened: true }
    },
    observe: async () => {
      const state = await page.evaluate(observeSnapshotState)
      assertSnapshotAdmission(state, fixture)
      return state
    },
    installGeometry: async () => {
      geometryAttempted = true
      const observed = await page.evaluate(installQueryGeometry, { source: createSnapshotGeometryObserver.toString(), token })
      geometryInstalled = true
      const recognized = recognizeReaderSources(observed.sources)
      const readers = { ...observed, rawSha256: recognized.rawSha256, allSourcesSha256: recognized.allSourcesSha256,
        semanticSha256: recognized.semanticSha256, source: readerSource, provenance: readerProvenance }
      validateReaderEvidence(readers)
      return readers
    },
    installObserver: () => page.evaluate(({ source, token }) => {
      const owner = window.__pndSnapshotQueryWitnessOwner
      if (!owner || owner.token !== token || owner.observer || Object.hasOwn(window, '__pndSnapshotObserver')) throw Error('Query observer installation owner changed')
      try { (0, eval)(`(${source})`)() }
      finally { owner.observer = window.__pndSnapshotObserver ?? null }
    }, { source: installSnapshotObserver.toString(), token }),
    boundary: () => owner(own => own.geometry.captureBoundary()),
    arm: expected => page.evaluate(({ token, expected }) => {
      const own = window.__pndSnapshotQueryWitnessOwner
      if (!own || own.token !== token || own.observer !== window.__pndSnapshotObserver) throw Error('Query observer replaced before input')
      return own.observer.arm(expected)
    }, { token, expected }),
    move: (x, y) => page.mouse.move(x, y),
    waitFour: () => waitForQueryFour(page, token),
    finishFour: () => owner(own => {
      if (own.observer !== window.__pndSnapshotObserver) throw Error('Query observer replaced after input')
      return own.observer.finish(4)
    }),
    cleanup: async () => {
      if (!geometryAttempted) return { confirmed: true, observer: null }
      const result = await page.evaluate(stopQueryObserver, token)
      // An uncertain install cannot manufacture successful cleanup from absence.
      if (!geometryInstalled && !result.confirmed) return result
      return result
    },
    exportRaw: async cap => {
      const button = page.getByRole('button', { name: 'Export recent frames', exact: true })
      await button.focus(); check()
      const [download] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Space')])
      check()
      return readBoundedQueryDownload(download, cap)
    },
    summarize: (raw, packet) => summarizeSnapshotPhase(raw, packet, expectedRevision, packet.readers),
  })
}
