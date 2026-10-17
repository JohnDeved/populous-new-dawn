// Bounded local closures copied from the accepted campaign input source.
// See provenance.json and verify-preparation.mjs for exact sources and adaptations.
import assert from 'node:assert/strict'
import { acceptedOrderEvidence } from './accepted-input.mjs'
function requireEntityContext(hit, observed, before) {
  if (!Number.isInteger(observed.turn) || observed.turn < before.turn || observed.targetId !== hit.id ||
    JSON.stringify(observed.selected) !== JSON.stringify(before.selected) ||
    !Number.isInteger(observed.context?.model) || observed.context.enabled !== true)
    throw Error('Entity target has no fresh enabled detached-clone command context')
}


const nodeProbes = { requireEntityContext }
export function createOrdinaryInput({ page, read, log, signal, health, pollUI }) {
  const ids = Object.create(null)
  const map = async point => {
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.z))
    assert.equal((await read()).mode, null, 'Camera preparation must precede mode selection')
    const settle = () => pollUI(() => page.evaluate(() => {
      const s = window.testSceneRef.current
      return !s.world.inputMask && !s.cameraMotion.active && !s.resultCamera.active && !s.viewTransition
    }), 30_000, 'camera settlement')
    await settle()
    const input = await page.evaluate(async p => {
      const s = window.testSceneRef.current, { minimapPick } = await import('/app/minimap.ts')
      const { minimapInput } = window.nativeGuardProbes
      const r = s.mini.getBoundingClientRect(), width = s.mini.width, height = s.mini.height
      const center = { x: Math.round((s.viewPoint.x + 8) * 256), y: Math.round((-s.viewPoint.z - 8) * 256) }
      const target = { x: Math.round((p.x + 8) * 256), y: Math.round((-p.z - 8) * 256) }
      const heading = Math.round(s.cameraBearing * 1024 / Math.PI)
      const best = minimapInput({ width, height, rect: r, center, heading, target, maxDistance: 8 * 256 },
        minimapPick, p => document.elementFromPoint(p.x, p.y) === s.mini)
      return best && { ...best, cameraBefore: { point: { ...s.viewPoint }, position: { ...s.cameraPosition },
        bearing: s.cameraBearing, motionActive: s.cameraMotion.active } }
    }, point)
    assert.ok(input, 'Minimap has a visible owned pixel mapping within8 world units of the requested camera point')
    assert.equal(await page.evaluate(p => document.elementFromPoint(p.x, p.y) === window.testSceneRef.current.mini, input), true)
    log({ action: 'minimap-click', target: point, input })
    await page.mouse.click(input.x, input.y); await page.mouse.move(400, 780)
    await settle()
    const cameraAfter = (await read()).camera, short = n => n << 16 >> 16
    log({ action: 'minimap-camera-observed', requested: point, input, cameraAfter })
    assert.ok(Math.hypot(short(cameraAfter.position.x - input.native.x),
      short(cameraAfter.position.y - input.native.y)) <= 1, 'Ordinary camera reached the actually clicked minimap destination')
  }
  const rotate = async () => {
    const corridor = await page.evaluate(() => {
      const s = window.testSceneRef.current
      for (const y of [750, 650, 550]) if ([280, 792].every(x => document.elementFromPoint(x, y) === s.renderer.domElement))
        return { x: 280, y, end: 792 }
      return null
    })
    assert.ok(corridor, 'Visible canvas corridor for camera rotation')
    log({ action: 'camera-right-drag', ...corridor })
    await page.mouse.move(corridor.x, corridor.y); await page.mouse.down({ button: 'right' })
    try { await page.mouse.move(corridor.end, corridor.y, { steps: 12 }) }
    finally { await page.mouse.up({ button: 'right' }) }
    await page.mouse.move(400, 780); await page.waitForTimeout(600)
  }
  const entityHit = (collection, id) => page.evaluate(async ({ collection, id }) => {
    const { findEntityInput, inspectEntityPoint } = window.nativeGuardProbes
    const s = window.testSceneRef.current, o = s.world[collection].find(o => o.id === id)
    if (!o) return null
    const r = s.container.getBoundingClientRect(), candidates = []
    const mesh = collection === 'units' ? s.unitMeshes.get(id) : collection === 'buildings' ? s.buildingMeshes.get(id) : s.shrineMeshes.get(id)?.g
    const q = s.screen(mesh?.position ?? o), center = { x: r.x + (q.x + 1) * r.width / 2, y: r.y + (1 - q.y) * r.height / 2 }
    if (collection === 'units') {
      const b = s.picking.personBounds(id)
      if (b) candidates.push({ x: r.x + b.x + b.width / 2, y: r.y + b.y + b.height / 2 })
    } else mesh?.traverse(child => {
      if (child.userData.nativeModel === undefined || !child.visible) return
      for (const { points } of s.picking.model(child, JSON.stringify(s.view.projection)).filter(c => c.kind === 'model'))
        for (const weights of [[1, 1, 1], [2, 1, 1], [1, 2, 1], [1, 1, 2]]) {
          const total = weights.reduce((a, b) => a + b, 0)
          candidates.push({ x: r.x + points.reduce((sum, p, i) => sum + p.x * weights[i], 0) / total,
            y: r.y + points.reduce((sum, p, i) => sum + p.y * weights[i], 0) / total })
        }
    })
    candidates.sort((a, b) => Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y))
    // Prefer the existing interior anchors; retain the broad scan only as fallback.
    for (let dy = collection === 'units' ? -32 : -150; dy <= 64; dy += 4)
      for (let dx = -100; dx <= 100; dx += 4) candidates.push({ x: center.x + dx, y: center.y + dy })
    const hit = findEntityInput(candidates, id, point => inspectEntityPoint(s, collection, point))
    return hit && { ...hit, id, collection, turn: s.world.turn }
  }, { collection, id })
  const resolveId = value => {
    const id = typeof value === 'number' ? value : ids[value]
    assert.ok(Number.isInteger(id) && id > 0, `Known target identity ${value}`)
    return id
  }
  const targetEntity = async (collection, value) => {
    assert.ok(['units', 'buildings', 'shrines'].includes(collection))
    const id = resolveId(value), target = (await read())[collection].find(o => o.id === id)
    assert.ok(target, `Existing ${collection} ${id}`)
    await map(target)
    let hit
    for (let attempt = 0; attempt < 4; attempt++) {
      hit = await entityHit(collection, id)
      log({ action: 'entity-hit-probe', collection, id, attempt, hit })
      if (hit) return hit
      if (attempt < 3) await rotate()
    }
    assert.fail(`No visible canvas-owned hit for ${collection} ${id}`)
  }
  const prepareEntityClick = async (hit, before) => {
    const context = await page.evaluate(async hit => {
      const { createMoveContextProbe } = window.nativeGuardProbes
      const s = window.testSceneRef.current, target = s.world[hit.collection].find(o => o.id === hit.id)
      return { turn: s.world.turn, selected: [...s.world.selected], targetId: target?.id ?? null,
        scope: 'Source-owned synchronization and command classification on a detached clone only',
        context: target ? createMoveContextProbe(s.world)({ id: target.id, x: target.x, z: target.z }) : null }
    }, hit)
    log({ action: 'entity-detached-command-context', hit, observed: context })
    const { requireEntityContext } = nodeProbes
    requireEntityContext(hit, context, before)
    // This final, synchronous inspection occurs after both the expensive before
    // snapshot and detached context probe. No full read follows before input.
    const fresh = await page.evaluate(async ({ hit, selected }) => {
      const { findEntityInput, inspectEntityPoint, observeEntityPointer, entityInputState } = window.nativeGuardProbes
      const s = window.testSceneRef.current, w = s.world
      if (window.campaignEntityPointer) throw Error('An entity pointer observer is already active')
      const point = findEntityInput([hit], hit.id, point => inspectEntityPoint(s, hit.collection, point))
      const valid = Number.isInteger(hit.x) && Number.isInteger(hit.y) && !!point &&
        !w.paused && w.status === 'playing' && !w.inputMask && w.mode === null &&
        JSON.stringify(w.selected) === JSON.stringify(selected)
      const state = entityInputState(s, hit, hit)
      if (valid) window.campaignEntityPointer = observeEntityPointer(s, document, hit, window.nativeGuardReadInput)
      return { turn: w.turn, point, valid, selected: [...w.selected], state }
    }, { hit, selected: before.selected })
    log({ action: 'entity-immediate-hit-revalidation', hit, fresh })
    assert.equal(fresh.valid, true, 'Entity integer interior target became stale before input')
  }
  const finishEntityClick = async (hit, expected) => {
    const observed = await page.evaluate(() => {
      const observer = window.campaignEntityPointer
      if (!observer) return null
      delete window.campaignEntityPointer
      return observer.finish()
    })
    log({ action: 'entity-delivered-pointer-observation', hit, observed })
    if (!expected && !observed) return
    assert.equal(observed?.restored, true, 'Restore the actual picker functions after input')
    assert.deepEqual(observed.errors, [])
    if (expected) assert.deepEqual(observed.events.map(event => ({ type: event.type, x: event.x, y: event.y,
      button: event.button, canvasOwned: event.canvasOwned, canvasTarget: event.canvasTarget })),
    ['pointerdown', 'pointerup'].map(type => ({ type, x: hit.x, y: hit.y, button: 0, canvasOwned: true, canvasTarget: true })),
    'Retain the actually delivered ordinary pointer pair at the validated integer point')
    return observed
  }

  // New narrow dispatch wrapper and ground adapter follow the copied closures.
  return { map, targetEntity, entityHit, prepareEntityClick, finishEntityClick }
}
