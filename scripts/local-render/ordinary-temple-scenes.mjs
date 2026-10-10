import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { bindGame, showAllMissions, waitForShamanReadiness } from '../browser-game.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import buildTemple from './mission3-temple-checkpoint.mjs'
import { observeThemeAction, requireThemeCheckpoint } from './world-theme-witness.mjs'
import {
  installOrdinaryTempleObserver,
  requireOrdinaryTempleFrame,
  requireTempleCoverage,
} from './ordinary-temple-witness.mjs'

const sha = value => createHash('sha256').update(value).digest('hex')
const route = process.env.POPULOUS_TEMPLE_ROUTE ?? 'authored'
assert.ok(
  ['authored', 'construction'].includes(route),
  'Explicit authored or construction route required'
)

// The minimap shows a local projection, so distant authored Temples need
// intermediate real clicks. This pure planner never changes the live camera.
export function templeViewWaypoints(center, target) {
  for (const point of [center, target])
    assert.ok(Number.isFinite(point?.x) && Number.isFinite(point?.z))
  const wrap = value => ((((value + 128) % 256) + 256) % 256) - 128
  const dx = wrap(target.x - center.x),
    dz = wrap(target.z - center.z)
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 32))
  assert.ok(count <= 6)
  return Array.from({ length: count }, (_, index) =>
    index === count - 1
      ? { x: target.x, z: target.z }
      : {
          x: wrap(center.x + (dx * (index + 1)) / count),
          z: wrap(center.z + (dz * (index + 1)) / count),
        }
  )
}

// Synchronous read-only resource lineage at the trusted shipped click. A later
// browser/host sample cannot prove counter zero or retained phase at replacement.
export function armTempleResourceAction({ kind, label }) {
  let store = window.testStore
  if (!store) {
    const main = document.querySelector('main')
    let fiber = main?.[Object.keys(main).find(key => key.startsWith('__reactFiber'))]
    for (; fiber && !store; fiber = fiber.return)
      for (let hook = fiber.memoizedState; hook; hook = hook.next)
        if (hook.memoizedState?.getWorld && hook.memoizedState?.subscribe)
          store = hook.memoizedState
  }
  if (!store?.getWorld || !store?.getPresentationSnapshot) throw Error('Temple store unavailable')
  const result = { kind, label, errors: [], captured: false, closed: false }
  let active = null,
    beforeWorld,
    unsubscribe = () => {}
  const detach = () => {
    document.removeEventListener('click', begin, true)
    document.removeEventListener('click', end)
    unsubscribe()
    active = null
  }
  const begin = event => {
    const button = event.target?.closest?.('button')
    if ((button?.getAttribute('aria-label') ?? button?.textContent.trim()) !== label) return
    active = event
    beforeWorld = store.getWorld()
    result.before = {
      resource: structuredClone(store.getPresentationSnapshot()),
      level: beforeWorld.outcome.level,
      turn: beforeWorld.turn,
      landFlags: beforeWorld.land.landFlags,
    }
  }
  const end = event => {
    if (active === event) active = null
  }
  document.addEventListener('click', begin, true)
  document.addEventListener('click', end)
  unsubscribe = store.subscribe(() => {
    if (!active || result.captured || result.errors.length) return
    try {
      if (!active.isTrusted || active.button !== 0)
        throw Error('Temple transition requires trusted primary input')
      const world = store.getWorld()
      result.after = {
        resource: structuredClone(store.getPresentationSnapshot()),
        level: world.outcome.level,
        turn: world.turn,
        temples: world.buildings.filter(b => b.kind === 'temple').map(b => b.id),
      }
      result.replaced = world !== beforeWorld
      result.captured = true
    } catch (error) {
      result.errors.push(String(error?.stack ?? error))
    } finally {
      detach()
    }
  })
  return {
    read: () => structuredClone(result),
    close() {
      detach()
      result.closed = true
      return structuredClone(result)
    },
  }
}

export function requireTempleTransition(result, { startup = false } = {}) {
  assert.deepEqual(result.errors, [])
  assert.equal(result.closed, true)
  assert.equal(result.captured, true)
  assert.equal(result.replaced, true)
  const before = result.before.resource,
    after = result.after.resource
  assert.ok(before && after)
  if (result.kind === 'restart') {
    assert.equal(result.before.landFlags & 8, 0)
    assert.deepEqual(after, before)
    assert.equal(result.after.turn, 0)
    assert.deepEqual(result.after.temples, [])
  } else {
    assert.equal(result.kind, 'load')
    if (startup) {
      assert.equal(before.bank, 'c')
      assert.equal(before.modelAtlas, 'atlas')
    }
    assert.ok(after.epoch > before.epoch)
    assert.equal(after.counter, 0)
    assert.equal(after.tile, 92)
    assert.equal(after.bank, startup ? 'p' : before.bank)
    assert.equal(after.modelAtlas, startup ? 'atlas-p' : before.modelAtlas)
  }
}

export default async function ordinaryTempleScenes(context, continuation = null) {
  const { page, root, output, signal, receipt, observeCheckpoint } = context
  assert.equal(receipt.profile?.mode, continuation ? 'reused' : 'created')
  if (!continuation) assert.equal(receipt.profile.checkpointAtStart, null)
  const report = {
    status: 'running',
    route: continuation ? 'construction-continuation' : route,
    source: receipt.source,
    actions: [],
    epochs: [],
    transitions: [],
    responses: [],
    cleanupErrors: [],
    limits:
      'Actual shipped-control browser rendering with natural RAF. No injected World, time or storage, original raster parity, original cadence, campaign victory, or hardware performance claim.',
  }
  const save = () =>
    writeFileSync(
      resolve(output, 'ordinary-temple-scenes.json'),
      JSON.stringify(report, null, 2) + '\n'
    )
  const pending = [],
    responseErrors = [],
    served = new Set()
  const response = message => {
    const path = new URL(message.url()).pathname
    if (!/^\/original\/atlas(?:-[sp])?\.png$/.test(path)) return
    pending.push(
      (async () => {
        assert.equal(message.ok(), true)
        const bytes = await message.body(),
          hash = sha(bytes)
        assert.equal(hash, sha(readFileSync(resolve(root, `public${path}`))))
        served.add(path)
        report.responses.push({ path, bytes: bytes.length, sha256: hash })
      })().catch(error => responseErrors.push(String(error?.stack ?? error)))
    )
  }
  page.on('response', response)
  const original = JSON.parse(readFileSync(resolve(root, 'app/original-models.json'))),
    { modelStage, modelTextureModes } = await import(
      pathToFileURL(resolve(root, 'app/model-faces.ts')).href
    ),
    models = Object.fromEntries(
      [95, 96, 97, 98].flatMap(id =>
        [0, 1, 2, 3, 4].map(stage => {
          const data = modelStage(original[id], stage),
            modes = modelTextureModes(original[id], stage)
          return [
            `${id}:${stage}`,
            {
              positionsSha256: sha(Buffer.from(new Float32Array(data.p).buffer)),
              uvSha256: sha(Buffer.from(new Float32Array(data.uv).buffer)),
              modesSha256: sha(Buffer.from(new Float32Array(modes).buffer)),
              vertices: data.p.length / 3,
              mode32Vertices: modes.filter(v => v === 32).length,
              capVertices: modes.filter(v => v === 7).length,
            },
          ]
        })
      )
    )
  let observer = null
  const startObserver = async ids => {
    assert.equal(observer, null)
    observer = await page.evaluateHandle(installOrdinaryTempleObserver, { ids })
  }
  const waitTwo = async id => {
    const deadline = Date.now() + 30000
    for (;;) {
      signal.throwIfAborted()
      const value = await observer.evaluate(api => api.status())
      assert.deepEqual(value.errors, [])
      const samples = value.seen.find(row => row.id === id)?.samples ?? []
      if (new Set(samples.filter(row => row.stage === 4).map(row => row.tile)).size >= 2) return
      assert.ok(
        Date.now() < deadline,
        `Temple ${id} did not visibly submit two natural shared tiles`
      )
      await page.waitForTimeout(100)
    }
  }
  const finishObserver = async (label, expected, ids, construction = false) => {
    const handle = observer
    observer = null
    let evidence
    try {
      const closed = await handle.evaluate(api => api.close())
      evidence = await handle.evaluate(api => api.read())
      for (const [index, frame] of evidence.frames.entries()) {
        const bytes = Buffer.from(frame.png.slice('data:image/png;base64,'.length), 'base64'),
          file = `${label}-${index}.png`
        assert.match(frame.png, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
        writeFileSync(resolve(output, file), bytes, { flag: 'wx' })
        frame.png = { file, sha256: sha(bytes) }
      }
      report.epochs.push({
        label,
        expected: { ...expected, models: undefined },
        ids,
        construction,
        evidence,
      })
      save()
      assert.deepEqual(closed, { closed: true, errors: [] })
      for (const frame of evidence.frames)
        requireOrdinaryTempleFrame(frame, { ...expected, models })
      requireTempleCoverage(evidence, { ids, construction })
      await Promise.all(pending)
      assert.deepEqual(responseErrors, [])
      assert.ok(served.has(`/original/${expected.atlas}.png`))
      await page.screenshot({ path: resolve(output, `${label}-viewport.png`) })
    } finally {
      await handle.dispose()
    }
    return evidence
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
    await waitForShamanReadiness(page, { timeout: 60000 })
    assert.equal(await page.evaluate(() => window.testStore.getWorld().outcome.level), level)
  }
  const action = async (kind, label, startup = false) => {
    const handle = await page.evaluateHandle(armTempleResourceAction, { kind, label })
    let observed, boundary
    try {
      observed = await observeThemeAction({
        page,
        signal,
        kind,
        label,
        click: () => page.getByRole('button', { name: label, exact: true }).click(),
      })
    } finally {
      try {
        boundary = await handle.evaluate(api => api.close())
      } finally {
        await handle.dispose()
      }
      report.transitions.push({ kind, label, observed, boundary })
      save()
    }
    requireTempleTransition(boundary, { startup })
    return observed
  }
  try {
    save()
    if (route === 'authored') {
      for (const [level, bank, atlas, teams] of [
        [10, 'p', 'atlas-p', ['blue', 'green']],
        [17, 'c', 'atlas', ['blue', 'red', 'yellow', 'green']],
      ]) {
        if (level !== 10) {
          await page.getByRole('button', { name: 'Game settings', exact: true }).click()
          await page.getByRole('button', { name: 'Select Level', exact: true }).click()
        }
        await showAllMissions(page)
        report.actions.push(
          await observeThemeAction({
            page,
            signal,
            kind: 'start',
            label: `Mission ${level}`,
            click: () =>
              page.getByRole('button', { name: `Mission ${level}`, exact: true }).click(),
          })
        )
        await ready(level)
        const state = await page.evaluate(() => ({
          shaman: window.testStore
            .getWorld()
            .units.find(u => u.kind === 'shaman' && u.team === 'blue' && u.hp > 0)?.id,
          temples: window.testStore
            .getWorld()
            .buildings.filter(b => b.kind === 'temple' && b.hp > 0)
            .map(b => ({ id: b.id, team: b.team, x: b.x, z: b.z, progress: b.progress })),
        }))
        assert.ok(state.shaman)
        const targets = teams.map(team => {
          const target = state.temples.find(b => b.team === team && b.progress === 1)
          assert.ok(target, `Mission ${level} authored ${team} Temple absent`)
          return target
        })
        report.actions.push({ level, authoredTargets: targets })
        save()
        const input = createMission1VaultInput({
          page,
          signal,
          report,
          save,
          originalShamanId: state.shaman,
        })
        await startObserver(targets.map(b => b.id))
        for (const target of targets) {
          const center = await page.evaluate(() => ({
            x: window.testSceneRef.current.viewPoint.x,
            z: window.testSceneRef.current.viewPoint.z,
          }))
          const waypoints = templeViewWaypoints(center, target)
          report.actions.push({ label: 'authored-Temple-camera-route', target, center, waypoints })
          save()
          for (const point of waypoints) await input.view(point)
          await waitTwo(target.id)
        }
        await finishObserver(
          `m${level}-authored`,
          { level, bank, atlas, objects: 2 },
          targets.map(b => b.id)
        )
      }
    } else {
      const prefix =
        continuation?.prefix ??
        (await buildTemple(context, {
          begin: async () => startObserver(null),
          preserveActive: async () => {},
          observeWorld: async ({ read }) => {
            const temple = (await read()).temples.find(b => b.team === 'blue' && b.progress === 1)
            assert.ok(temple)
            await waitTwo(temple.id)
          },
          finish: async () => {},
        }))
      assert.equal(prefix.status, 'passed')
      assert.deepEqual(prefix.cleanupErrors, [])
      const id = prefix.plan.id,
        expected = { level: 3, bank: 'p', atlas: 'atlas-p', objects: 6 },
        saved = prefix.checkpoint.digest.checkpoint
      report.prefix = {
        file: continuation?.prefixPath ?? 'mission3-temple-checkpoint.json',
        sha256:
          continuation?.prefixSha256 ??
          sha(readFileSync(resolve(output, 'mission3-temple-checkpoint.json'))),
        id,
        saved,
      }
      if (continuation) {
        for (const frame of continuation.epoch.evidence.frames)
          requireOrdinaryTempleFrame(frame, { ...expected, models })
        requireTempleCoverage(continuation.epoch.evidence, { ids: [id], construction: true })
        report.carried = continuation.carried
        save()
      } else await finishObserver('m3-construction', expected, [id], true)
      const loadAndObserve = async (label, startup = false) => {
        const loaded = await action('load', startup ? 'Load Game' : 'Load checkpoint', startup)
        requireThemeCheckpoint(loaded.digest, saved)
        await ready(3)
        await startObserver([id])
        await waitTwo(id)
        await finishObserver(label, expected, [id])
      }
      await loadAndObserve('m3-loaded', !!continuation)
      await page.getByRole('button', { name: 'Game settings', exact: true }).click()
      await action('restart', 'Restart world')
      await ready(3)
      assert.equal(
        (await observeCheckpoint('Temple Restart preserves Save')).checkpoint.checkpointSha256,
        saved.checkpointSha256
      )
      await page.getByRole('button', { name: 'Game settings', exact: true }).click()
      await loadAndObserve('m3-loaded-after-restart')
      assert.equal(
        (await observeCheckpoint('Temple final Load preserves Save')).checkpoint.checkpointSha256,
        saved.checkpointSha256
      )
    }
    await Promise.all(pending)
    assert.deepEqual(responseErrors, [])
    assert.deepEqual(receipt.errors, [])
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error?.stack ?? error)
    throw error
  } finally {
    if (observer) {
      try {
        report.partial = await observer.evaluate(api => {
          api.close()
          return api.read()
        })
      } catch (error) {
        report.cleanupErrors.push(String(error))
      } finally {
        await observer.dispose()
      }
    }
    page.off('response', response)
    await Promise.all(pending)
    report.responseErrors = responseErrors
    save()
  }
  return report
}
