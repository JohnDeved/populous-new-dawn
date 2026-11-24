import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'

export const queuedTimberEpisodeLimitMs = 18000
const ids = { brave: 281, first: 68, next: 66 }
const stagingTurns = { first: 420, last: 480 }

// This witness starts only AFTER the resource workload, heap, and aliases
// have been finalized. Only real pointer/keyboard actions change gameplay.
export async function checkPostObservationQueuedTimber({ page, output, deadlineAt, signal }) {
  const deadline = Math.min(deadlineAt, Date.now() + queuedTimberEpisodeLimitMs)
  const report = { status: 'running', ids, inputs: [], images: [], episodeLimitMs: queuedTimberEpisodeLimitMs, stagingTurns,
    scope: 'Authored Mission 2 after resource comparison; natural full cargo only. No seeded state, partial load or construction claim.' }
  const save = () => writeFileSync(resolve(output, 'post-observation-queued-timber.json'), JSON.stringify(report, null, 2) + '\n')
  const remaining = () => {
    signal.throwIfAborted()
    const left = deadline - Date.now()
    assert.ok(left > 0, 'Post-observation queued timber exhausted its existing deadline')
    return left
  }
  const started = performance.now()
  let observer, timer, timedOut = false, rebound = false
  const see = (second = 0) => observer.evaluate(({ snapshot }, id) => snapshot(id), second)
  const wait = async (predicate, args, limit) => {
    const handle = await page.waitForFunction(predicate, { ...args, observer }, { timeout: Math.min(remaining(), limit) })
    try { return await handle.jsonValue() } finally { await handle.dispose() }
  }
  const click = async (id, ctrl) => {
    remaining()
    const hit = await observer.evaluate(({ locate }, { id, ctrl }) => locate(id, ctrl), { id, ctrl })
    assert.ok(hit?.point, `No unoccluded authored picker target #${id}: ${JSON.stringify(hit)}`)
    const { x, y } = hit.point
    await observer.evaluate(({ arm }, record) => arm(record), { x, y, id, ctrl })
    await page.mouse.click(x, y, { button: 'left' })
    const events = await observer.evaluate(({ take }) => take())
    report.inputs.push({ id, ctrl, hit, events }); save()
    assert.deepEqual(events.map(e => [e.type, e.trusted, e.canvas, e.ctrl, e.shift, e.alt, e.meta, e.button, e.hit, e.x, e.y]), [
      ['pointerdown', true, true, ctrl, false, false, false, 0, id, x, y],
      ['pointerup', true, true, ctrl, false, false, false, 0, id, x, y],
    ])
  }
  const capture = async (file, predicate, secondId) => {
    const before = await see(secondId)
    assert.ok(predicate(before) && before.braveOnCanvas, `Missing live timber snapshot on canvas before ${file}`)
    await wait(({ observer, frame }) => observer.snapshot().frame > frame, { frame: before.frame }, 2000)
    await page.screenshot({ path: resolve(output, file), timeout: Math.min(remaining(), 2000) })
    const after = await see(secondId)
    assert.ok(predicate(after) && after.braveOnCanvas, `Timber owner changed during ${file}`)
    assert.ok(after.frame > before.frame)
    report.images.push({ file, before, after, sha256: createHash('sha256').update(readFileSync(resolve(output, file))).digest('hex') })
    save()
  }
  save()
  try {
    timer = setTimeout(() => { timedOut = true; void page.close().catch(() => {}) }, remaining())
    assert.equal(await page.evaluate(() => (
      !('testScene' in window) && !('testSceneRef' in window) && !('testStore' in window) &&
      !('__populousGameplayOwnershipV1' in window)
    )), true, 'Original resource fixture must already have removed its aliases')
    rebound = true
    await bindGame(page)
    await page.locator('.world-viewport canvas.battlefield').focus({ timeout: Math.min(remaining(), 1500) })
    observer = await page.evaluateHandle(ids => {
      const scene = window.testSceneRef.current, world = window.testStore.getWorld(), canvas = scene.renderer.domElement
      const originalIds = new Set(world.trees.map(t => t.id)), events = []
      let armed, watch, frameRequest = 0
      const current = () => {
        if (window.testSceneRef.current !== scene || window.testStore.getWorld() !== world || scene.world !== world ||
            !canvas.isConnected || world.outcome.level !== 2 || world.status !== 'playing' || world.inputMask ||
            scene.messageModal || scene.overviewActive || scene.overviewStage ||
            document.querySelector('.loading-world,dialog[open]'))
          throw Error('Timber lost the authored current scene or public input')
        return world
      }
      const snapshot = (id = 0) => {
        const w = current(), u = w.units.find(p => p.id === ids.brave), native = u?.native
        const first = w.trees.find(t => t.id === ids.first), next = w.trees.find(t => t.id === ids.next)
        if (!u || u.team !== 'blue' || u.kind !== 'brave' || !native || u.hp <= 0 || !first || !next)
          throw Error('Required authored Brave/trees are not materialized')
        const anchor = scene.unitScreen(ids.brave), rect = canvas.getBoundingClientRect()
        const braveOnCanvas = !!anchor && Math.abs(anchor.x) < 1 && Math.abs(anchor.y) < 1 &&
          document.elementFromPoint(rect.left + (anchor.x + 1) * rect.width / 2,
            rect.top + (1 - anchor.y) * rect.height / 2) === canvas
        const orders = native.commands.filter(Boolean).map(command => ({
          id: command, model: w.buildingOrders.records[command].model, references: w.buildingOrders.records[command].references,
        }))
        return { turn: w.turn, paused: w.paused, mode: w.mode, selected: [...w.selected], orders,
          current: native.immediateCommand || native.commands[native.commandCursor] || 0,
          cargo: native.cargo, displayedCargo: u.cargo, target: u.tree, motion: native.motionGroup || 0, work: !!u.harvest,
          first: first.logs, next: next.logs, nextRefs: id ? w.buildingOrders.records[id]?.references ?? null : null,
          loose: w.trees.filter(t => t.model === 11 && !originalIds.has(t.id)).length,
          frame: scene.renderer.info.render.frame, braveOnCanvas,
          position: { x: native.x, y: native.y, worldX: u.x, worldZ: u.z },
          projected: anchor ? { x: anchor.x, y: anchor.y } : null }
      }
      const stopRoute = () => { if (frameRequest) cancelAnimationFrame(frameRequest); frameRequest = 0 }
      const trackRoute = second => {
        if (watch) throw Error('Prior queued timber route observer active')
        watch = { second, samples: [] }
        function visit(timestamp) {
          frameRequest = 0
          try {
            const row = snapshot(second)
            if (row.current === second && row.target === ids.next && row.motion > 0 && !row.work &&
                row.cargo === 100 && row.displayedCargo === 1 && row.nextRefs === 1 && row.braveOnCanvas) {
              const prior = watch.samples.at(-1)
              if (!prior || (row.frame > prior.frame && row.turn > prior.turn && timestamp > prior.timestamp)) {
                watch.samples.push({ ...row, timestamp })
                const first = watch.samples[0]
                if (prior && (row.position.x !== first.position.x || row.position.y !== first.position.y) &&
                    (row.position.worldX !== first.position.worldX || row.position.worldZ !== first.position.worldZ) &&
                    (row.projected.x !== first.projected.x || row.projected.y !== first.projected.y)) {
                  watch.pair = [first, watch.samples.at(-1)]
                  return
                }
              }
            }
            if (!row.current && row.cargo === 100 && row.nextRefs === 0)
              throw Error('Second timber order released before two owned route frames')
            if (watch.samples.length >= 24) throw Error('Queued timber motion has no authored displacement')
            frameRequest = requestAnimationFrame(visit)
          } catch (error) { watch.error = String(error) }
        }
        frameRequest = requestAnimationFrame(visit)
      }
      const route = () => {
        if (watch?.error) throw Error(watch.error)
        return watch?.pair ?? false
      }
      function pick(x, y, ctrl) {
        const w = current(), e = { clientX: x, clientY: y }
        if (document.elementFromPoint(x, y) !== canvas) return null
        const downPerson = scene.pickUnit(e)
        if (!ctrl) return downPerson?.id ?? null
        if (downPerson) return null
        const pickedPerson = scene.picking.pickPerson(e)
        return w.units.find(u => u.id === pickedPerson)?.id ?? scene.pickWorldObject(e)?.id ??
          w.buildings.find(b => b.id === pickedPerson)?.id ?? w.shrines.find(s => s.id === pickedPerson)?.id ??
          (!pickedPerson ? scene.picking.pick(e) : null)
      }
      const locate = (id, ctrl) => {
        const w = current(), target = (ctrl ? w.trees : w.units).find(u => u.id === id)
        if (!target) return null
        const rect = canvas.getBoundingClientRect(), seen = new Set()
        const anchors = [!ctrl ? scene.unitScreen(id) : null,
          ...[0, 4, 8, 14, 20].map(offset => scene.screen(target, scene.y(target) + offset))]
        for (const p of anchors) {
          if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue
          const a = rect.left + (p.x + 1) * rect.width / 2, b = rect.top + (1 - p.y) * rect.height / 2
          for (const dy of [0, 3, -3, 6, -6]) for (const dx of [0, 3, -3, 6, -6]) {
            const x = Math.round(a + dx), y = Math.round(b + dy), key = x + ':' + y
            if (seen.has(key) || x - 2 < rect.left || x + 2 >= rect.right || y - 2 < rect.top || y + 2 >= rect.bottom) continue
            seen.add(key)
            if ([[0, 0], [-2, 0], [2, 0], [0, -2], [0, 2]].every(([ox, oy]) => pick(x + ox, y + oy, ctrl) === id))
              return { point: { x, y }, inspected: seen.size }
          }
        }
        return { point: null, inspected: seen.size }
      }
      const record = e => {
        if (!armed) return
        events.push({ type: e.type, x: e.clientX, y: e.clientY, trusted: e.isTrusted, turn: current().turn,
          canvas: e.target === canvas && document.elementFromPoint(e.clientX, e.clientY) === canvas,
          ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, meta: e.metaKey, button: e.button,
          hit: pick(e.clientX, e.clientY, armed.ctrl) })
      }
      window.addEventListener('pointerdown', record, true)
      window.addEventListener('pointerup', record, true)
      return { snapshot, locate, trackRoute, route, routeDiagnostics: () => watch, arm(row) {
        if (armed || pick(row.x, row.y, row.ctrl) !== row.id) throw Error('Authored timber hit changed before click')
        armed = row
      }, take() { armed = null; return events.splice(0) }, close() {
        stopRoute()
        window.removeEventListener('pointerdown', record, true)
        window.removeEventListener('pointerup', record, true)
      } }
    }, ids)
    const initial = await see()
    report.initial = initial
    const assertStagingTurn = turn => assert.ok(
      Number.isInteger(turn) && turn >= stagingTurns.first && turn <= stagingTurns.last,
      `Authored timber staging turn ${turn} outside observed safe window ${stagingTurns.first}–${stagingTurns.last}`)
    assertStagingTurn(initial.turn)
    assert.equal(initial.paused, false); assert.equal(initial.mode, null)
    assert.equal(initial.cargo, 0); assert.deepEqual(initial.orders, [])
    assert.equal(initial.first, 4); assert.equal(initial.next, 4)
    await click(ids.brave, false)
    assert.deepEqual((await see()).selected, [ids.brave])
    await page.keyboard.down('Control')
    try { await click(ids.first, true); await click(ids.next, true) }
    finally { if (!page.isClosed()) await page.keyboard.up('Control') }
    report.staged = await see()
    for (const input of report.inputs) for (const event of input.events) assertStagingTurn(event.turn)
    assertStagingTurn(report.staged.turn)
    assert.deepEqual(report.staged.orders.map(o => o.model), [7, 7])
    const [first, second] = report.staged.orders.map(o => o.id)
    assert.notEqual(first, second); assert.equal(report.staged.current, first); assert.equal(report.staged.cargo, 0)
    // The authored model trace also finishes queue staging by cancelling the
    // current selection. Use the actual Page Escape owner; queued work remains.
    await page.keyboard.press('Escape')
    const releasedSelection = await see(second)
    assert.deepEqual(releasedSelection.selected, [])
    assert.equal(releasedSelection.current, first)
    await observer.evaluate(({ trackRoute }, id) => trackRoute(id), second)
    report.routeFrames = await wait(({ observer }) => observer.route(), {}, 9500)
    const [routeFrom, routeTo] = report.routeFrames
    assert.equal(routeFrom.current, second); assert.equal(routeTo.current, second)
    assert.ok(routeTo.turn > routeFrom.turn && routeTo.frame > routeFrom.frame && routeTo.timestamp > routeFrom.timestamp)
    assert.notDeepEqual(routeFrom.position, routeTo.position)
    assert.notDeepEqual(routeFrom.projected, routeTo.projected)
    report.routed = routeTo
    assert.ok(report.routed.first < 4, 'First natural harvest consumes authored stock')
    assert.ok(report.routeFrames.every(row => row.next === 4 && !row.loose))
    report.work = await wait(({ observer, second }) => {
      const s = observer.snapshot(second)
      return s.current === second && s.target === 66 && s.work && s.cargo === 100 && s.nextRefs === 1 ? s : false
    }, { second }, 5000)
    assert.ok(report.work.turn > report.routed.turn)
    await page.keyboard.press('Space')
    const working = s => s.paused && s.current === second && s.target === ids.next &&
      s.work && s.cargo === 100 && s.next === 4 && !s.loose
    await capture('queued-timber-second-work.png', working, second)
    await page.keyboard.press('Space')
    report.released = await wait(({ observer, second }) => {
      const s = observer.snapshot(second)
      return !s.paused && !s.current && s.nextRefs === 0 && s.cargo === 100 && s.next === 4 && !s.loose ? s : false
    }, { second }, 4500)
    assert.ok(report.released.turn > report.work.turn)
    await capture('queued-timber-released.png', s => !s.current && s.nextRefs === 0 && s.cargo === 100 && s.next === 4 && !s.loose, second)
    remaining()
    assert.equal(timedOut, false, 'Queued timber must finish before its deadline')
    report.status = 'passed'
    return report
  } catch (error) {
    report.status = 'failed'; report.error = String(error); report.timedOut = timedOut
    if (observer && !page.isClosed()) {
      try { report.routeDiagnostics = await observer.evaluate(({ routeDiagnostics }) => routeDiagnostics()) }
      catch (diagnosticError) { report.routeDiagnosticError = String(diagnosticError) }
    }
    throw error
  } finally {
    clearTimeout(timer)
    report.elapsedMs = performance.now() - started
    try {
      if (!page.isClosed() && observer) {
        try { await observer.evaluate(({ close }) => close()) } finally { await observer.dispose() }
      }
    } finally {
      try {
        if (rebound && !page.isClosed()) await page.evaluate(() => {
          delete window.testScene; delete window.testSceneRef; delete window.testStore
        })
      } finally { save() }
    }
  }
}
