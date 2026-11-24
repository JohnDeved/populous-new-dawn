import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const periodCellLimitMs = 12000
const target = { x: 1, z: 37 }
const axis = (a, b) => Math.abs(((a - b + 32768) & 65535) - 32768)
const distance = (a, b) => axis(a.x, b.x) + axis(a.y, b.y)
const center = p => ({
  x: Math.floor((p.x & 65535) / 512) * 512 + 256,
  y: Math.floor((p.y & 65535) / 512) * 512 + 256,
})

export function observePeriodCell(tile) {
  const owner = window.testSceneRef.current, world = window.testStore.getWorld(),
    canvas = owner.renderer.domElement, id = 30, events = [], incoming = new WeakMap()
  const current = () => {
    if (window.testSceneRef.current !== owner || window.testStore.getWorld() !== world ||
      owner.world !== world || !canvas.isConnected || world.status !== 'playing' ||
      world.outcome.level !== 1 || world.inputMask || world.mode || owner.messageModal ||
      owner.viewTransition || owner.overviewActive || owner.overviewStage ||
      document.querySelector('.loading-world,dialog[open]'))
      throw Error('Period lost the same playable checkpoint scene')
    const u = world.units.find(u => u.id === id)
    if (!u || u.team !== 'blue' || u.kind !== 'shaman' || u.hp <= 0 || !u.native || u.native.id !== id)
      throw Error('Period requires authored Shaman30 and her current native person')
    return u
  }
  const cell = p => ({
    x: Math.floor((Math.round((p.x + 8) * 256) & 65535) / 512),
    y: Math.floor((Math.round((-p.z - 8) * 256) & 65535) / 512),
  })
  const cellTarget = cell(tile)
  const locateGround = () => {
    current()
    const rect = canvas.getBoundingClientRect(), projection = owner.screen(tile)
    const x = Math.round(rect.left + (projection.x + 1) * rect.width / 2),
      y = Math.round(rect.top + (1 - projection.y) * rect.height / 2)
    if (![x, y, projection.z].every(Number.isFinite) || projection.z < -1 || projection.z > 1)
      return null
    // Scene.pick uses a scratch mouse vector. Restore it synchronously before
    // giving the genuine pointer input; this never writes the World or camera.
    const savedMouse = owner.mouse.clone(), probes = []
    try {
      for (const [dx, dy] of [[0, 0], [-2, 0], [2, 0], [0, -2], [0, 2]]) {
        const event = { clientX: x + dx, clientY: y + dy }
        if (document.elementFromPoint(event.clientX, event.clientY) !== canvas ||
          owner.pickUnit(event) || owner.picking.pickPerson(event) || owner.picking.pick(event))
          return null
        const ground = owner.pick(event)
        if (!ground || ground.id) return null
        const hit = cell(ground)
        if (hit.x !== cellTarget.x || hit.y !== cellTarget.y) return null
        probes.push({ x: event.clientX, y: event.clientY, groundX: ground.x, groundZ: ground.z, cell: hit })
      }
      return { x, y, cell: cellTarget, probes }
    } finally { owner.mouse.copy(savedMouse) }
  }
  const sample = () => {
    const u = current(), p = u.native, cmd = p.immediateCommand || p.commands[p.commandCursor]
    const projection = owner.unitScreen(id), rect = canvas.getBoundingClientRect()
    const actorOnCanvas = !!projection && Math.abs(projection.x) < 1 && Math.abs(projection.y) < 1 &&
      document.elementFromPoint(rect.left + (projection.x + 1) * rect.width / 2,
        rect.top + (1 - projection.y) * rect.height / 2) === canvas
    return { frame: owner.renderer.info.render.frame, turn: world.turn, lastOrderTurn: world.lastOrderTurn,
      actorOnCanvas, paused: world.paused, canvasFocus: document.activeElement === canvas, selected: [...world.selected],
      actor: { id, x: p.x & 65535, y: p.y & 65535,
        rawX: Math.round((u.x + 8) * 256) & 65535, rawY: Math.round((-u.z - 8) * 256) & 65535 },
      order: cmd ? { id: cmd, model: world.buildingOrders.records[cmd].model } : null,
      camera: { ...owner.cameraPosition }, moving: !!owner.cameraMotion.active,
      motionTarget: { ...owner.cameraMotion.target } }
  }
  const worldText = (withoutLightView = false) => {
    current()
    if (!withoutLightView) return JSON.stringify(world)
    const { lightView, ...gameplay } = world
    return JSON.stringify(gameplay)
  }
  const pointer = event => {
    if (events.length >= 10 || event.target !== canvas) return
    events.push({ type: event.type, button: event.button, trusted: event.isTrusted,
      modifiers: event.ctrlKey || event.shiftKey || event.altKey || event.metaKey,
      canvas: event.target === canvas, x: event.clientX, y: event.clientY })
  }
  const keyCapture = event => {
    if (event.code === 'Period') incoming.set(event, { world: worldText(), sample: sample() })
  }
  const keyBubble = event => {
    if (event.code !== 'Period') return
    const before = incoming.get(event)
    events.push({ type: event.type, code: event.code, key: event.key, trusted: event.isTrusted,
      repeat: event.repeat, prevented: event.defaultPrevented,
      modifiers: event.ctrlKey || event.shiftKey || event.altKey || event.metaKey,
      sameEvent: !!before, worldUnchanged: !!before && before.world === worldText(),
      before: before?.sample, after: sample() })
  }
  window.addEventListener('pointerdown', pointer, true)
  window.addEventListener('pointerup', pointer, true)
  window.addEventListener('keydown', keyCapture, true)
  window.addEventListener('keydown', keyBubble)
  return { sample, locateGround, events, worldText, close() {
    window.removeEventListener('pointerdown', pointer, true)
    window.removeEventListener('pointerup', pointer, true)
    window.removeEventListener('keydown', keyCapture, true)
    window.removeEventListener('keydown', keyBubble)
  } }
}

export async function checkPeriodCell(page, output, signal) {
  const report = { status: 'running', limitMs: periodCellLimitMs, target,
    scope: 'Ordinary checkpoint-loaded M1, genuine input; same-event complete World equality, settled equality excludes only camera-derived lightView.' }
  const file = resolve(output, 'period-native-cell.json')
  const started = performance.now(), deadline = started + periodCellLimitMs
  let observer, timer, timedOut = false
  const remaining = limit => {
    signal.throwIfAborted()
    const left = Math.floor(deadline - performance.now())
    assert.ok(left > 0 && !timedOut, 'Period witness exceeded its fixed deadline')
    return Math.min(left, limit)
  }
  const save = () => writeFileSync(file, JSON.stringify(report, null, 2) + '\n')
  const see = () => observer.evaluate(h => h.sample())
  const closeObserver = async () => {
    if (!observer) return
    const owned = observer
    observer = null
    try { if (!page.isClosed()) await owned.evaluate(h => h.close()) }
    finally { await owned.dispose() }
  }
  const wait = async (fn, args, cap) => {
    const handle = await page.waitForFunction(fn, { ...args, observer }, { timeout: remaining(cap) })
    try { return await handle.jsonValue() } finally { await handle.dispose() }
  }
  save()
  try {
    timer = setTimeout(() => { timedOut = true; void page.close().catch(() => {}) }, periodCellLimitMs)
    observer = await page.evaluateHandle(observePeriodCell, target)
    const initial = await see()
    report.initial = initial
    assert.equal(initial.paused && initial.canvasFocus && !initial.moving, true)
    assert.deepEqual(initial.selected, [30])
    assert.deepEqual([initial.actor.x, initial.actor.y], [4352, 55040])
    assert.equal(initial.order, null)
    const ground = await observer.evaluate(h => h.locateGround())
    assert.ok(ground, 'Declared authored tile is not a safe empty public terrain hit')
    report.ground = ground
    await page.getByRole('button', { name: 'Resume game', exact: true }).click({ timeout: remaining(1500) })
    await page.locator('.world-viewport canvas.battlefield').focus({ timeout: remaining(1000) })
    const running = await see()
    assert.equal(running.paused, false)
    assert.deepEqual(running.selected, [30])
    const confirmed = await observer.evaluate(h => h.locateGround())
    assert.ok(confirmed, 'Empty five-point terrain hit after ordinary Resume')
    assert.deepEqual([confirmed.x, confirmed.y, confirmed.cell], [ground.x, ground.y, ground.cell])
    report.groundAfterResume = confirmed
    await page.mouse.click(ground.x, ground.y, { button: 'left' })
    report.move = await wait(({ observer, actor }) => {
      const row = observer.sample()
      return !row.paused && row.order?.model === 3 && (row.actor.x !== actor.x || row.actor.y !== actor.y) && row
    }, { actor: initial.actor }, 2200)
    assert.ok(report.move.lastOrderTurn >= running.turn && report.move.turn > report.move.lastOrderTurn,
      'New live move order must precede the observed displacement')
    await page.keyboard.press('Space')
    const frozen = await wait(({ observer }) => {
      const row = observer.sample()
      return row.paused && row
    }, {}, 1800)
    report.frozen = frozen
    assert.equal(frozen.canvasFocus, true)
    assert.equal(frozen.order?.model, 3)
    assert.deepEqual(frozen.selected, [30])
    const expected = center(frozen.actor)
    assert.deepEqual([frozen.actor.x, frozen.actor.y], [frozen.actor.rawX, frozen.actor.rawY])
    assert.ok(distance(frozen.actor, expected) >= 16, 'Public movement must freeze away from the native cell center')
    report.expected = expected
    await page.keyboard.down('ArrowUp')
    try {
      await wait(({ observer, expected }) => {
        const row = observer.sample(), axis = (a, b) => Math.abs(((a - b + 32768) & 65535) - 32768)
        return row.paused && axis(row.camera.x, expected.x) + axis(row.camera.y, expected.y) >= 1536
      }, { expected }, 2600)
    } finally { if (!page.isClosed()) await page.keyboard.up('ArrowUp') }
    const before = await see()
    assert.equal(before.paused && before.canvasFocus, true)
    assert.deepEqual(before.actor, frozen.actor)
    assert.ok(distance(before.camera, expected) >= 1536)
    const gameplay = await observer.evaluate(h => h.worldText(true))
    remaining(12000)
    await page.keyboard.press('Period')
    report.events = await observer.evaluate(h => h.events)
    const [down, up, period] = report.events
    assert.equal(report.events.length, 3)
    for (const [index, edge] of [down, up].entries())
      assert.deepEqual(edge, { type: index ? 'pointerup' : 'pointerdown', button: 0, trusted: true,
        modifiers: false, canvas: true, x: ground.x, y: ground.y })
    assert.deepEqual([period.type, period.code, period.key, period.trusted, period.repeat, period.prevented,
      period.modifiers, period.sameEvent, period.worldUnchanged], ['keydown', 'Period', '.', true, false, true, false, true, true])
    assert.equal(period.before.paused && period.before.canvasFocus && period.after.moving, true)
    assert.deepEqual(period.before.actor, frozen.actor)
    assert.deepEqual(period.after.selected, [30])
    assert.deepEqual({ x: period.after.motionTarget.x, y: period.after.motionTarget.y }, expected)
    report.settled = await wait(({ observer, expected }) => {
      const row = observer.sample()
      return !row.moving && row.camera.x === expected.x && row.camera.y === expected.y && row
    }, { expected }, 3800)
    assert.ok(report.settled.frame > period.after.frame)
    assert.equal(report.settled.turn, frozen.turn)
    assert.equal(report.settled.camera.angle, period.before.camera.angle)
    assert.deepEqual(report.settled.actor, frozen.actor)
    assert.equal(report.settled.actorOnCanvas, true)
    const png = await page.screenshot({ path: resolve(output, 'period-native-cell.png'), timeout: remaining(1800) })
    const after = await see()
    assert.deepEqual(after.camera, report.settled.camera)
    assert.deepEqual(after.actor, frozen.actor)
    assert.equal(after.actorOnCanvas, true)
    assert.equal(after.turn, frozen.turn)
    assert.equal(await observer.evaluate(h => h.worldText(true)), gameplay)
    report.screenshot = { name: 'period-native-cell.png', sha256: createHash('sha256').update(png).digest('hex') }
    await closeObserver()
    remaining(12000)
    report.status = 'passed'
    return report
  } catch (error) {
    report.status = 'failed'; report.error = String(error)
    throw error
  } finally {
    clearTimeout(timer)
    try {
      await closeObserver()
    } finally {
      report.elapsedMs = performance.now() - started
      save()
    }
  }
}
