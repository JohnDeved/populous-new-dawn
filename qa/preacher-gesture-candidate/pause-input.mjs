import assert from 'node:assert/strict'

// Passive observation of one real mouse press/release on the shipped Pause button.
export async function installPauseInputObserver({ id, point }) {
  const { unitAnimationSource } = await import('/app/model.ts')
  if (window.preacherPauseInput) throw Error('Pause input observer already exists')
  const button = document.querySelector('button[aria-label="Pause game"]')
  const scene = window.testSceneRef.current, world = scene.world
  const person = world.units.find(u => u.id === id)?.native
  if (!button || button.disabled || !person || world.paused || world.mode || world.inputMask ||
    !button.contains(document.elementFromPoint(point.x, point.y))) throw Error('Pause target is not ready')
  const events = []
  const snapshot = event => {
    const w = window.testStore.getWorld(), u = w.units.find(u => u.id === id), p = u?.native
    return { type: event.type, trusted: event.isTrusted, button: event.button,
      x: event.clientX, y: event.clientY, targetMatches: button.contains(event.target),
      pointOwned: button.contains(document.elementFromPoint(point.x, point.y)),
      sceneWorldSame: window.testSceneRef.current === scene && w === world,
      nativeOwnerSame: p === person, sourceIsNative: unitAnimationSource(u) === p,
      now: performance.now(), turn: w.turn, paused: w.paused,
      object: p?.object, draw: p?.draw, f1: p?.f1, f2: p?.f2, counter: p?.counter,
      sourceId:id,state:p?.state,substate:p?.substate,commandStatus:p?.commandStatus,
      animationMode:p?.animationMode,workTarget:p?.workTarget,assignment:p?.assignment,
      timer:p?.timer,statusFlags:p?.statusFlags,flags2:p?.flags2,flags3:p?.flags3,flags4:p?.flags4,
      order:p?structuredClone(w.buildingOrders.records[p.immediateCommand||p.commands[p.commandCursor]]??null):null
 }
  }
  const capture = event => events.push(snapshot(event))
  // Document click bubbling follows the root's synchronous React onClick handler.
  document.addEventListener('pointerdown', capture, true)
  document.addEventListener('pointerup', capture, true)
  document.addEventListener('click', capture)
  window.preacherPauseInput = { point, events, finish() {
    document.removeEventListener('pointerdown', capture, true)
    document.removeEventListener('pointerup', capture, true)
    document.removeEventListener('click', capture)
    delete window.preacherPauseInput
    return { point, events }
  } }
  return { point, turn: world.turn, paused: world.paused }
}

export function requireGesturePause(trace, detected) {
  assert.deepEqual(trace.events.map(e => e.type), ['pointerdown', 'pointerup', 'click'])
  for (const event of trace.events) {
    assert.equal(event.trusted, true); assert.equal(event.button, 0)
    for (const key of ['targetMatches', 'pointOwned', 'sceneWorldSame', 'nativeOwnerSame', 'sourceIsNative'])
      assert.equal(event[key], true, key)
    assert.deepEqual([event.x, event.y], [trace.point.x, trace.point.y])
  }
  const [down, up, click] = trace.events
  assert.equal(down.paused, false); assert.equal(up.paused, false); assert.equal(click.paused, true)
  for (const sample of [detected, up, click]) {
    assert.ok([176, 184].includes(sample.object)); assert.equal(sample.object, detected.object)
    assert.equal(sample.draw, 14); assert.equal(sample.state, 10); assert.equal(sample.substate, 3)
    assert.equal(sample.commandStatus, 17); assert.equal(sample.order?.model, 17)
    assert.ok(sample.statusFlags & 1); assert.ok(sample.statusFlags & 2)
  }
  for (const key of ['turn', 'object', 'draw', 'f1', 'f2', 'counter', 'timer']) assert.equal(up[key], click[key])
  assert.ok(up.now >= detected.now && up.turn >= detected.turn)
  const count = detected.object === 176 ? 10 : 18, elapsedVisits = up.turn - detected.turn
  assert.ok(Number.isInteger(detected.f1) && detected.f1 >= 0 && detected.f1 <= 1)
  assert.ok(Number.isInteger(detected.f2) && detected.f2 >= 0 && detected.f2 < count)
  const remainingVisits = detected.f1 + count - detected.f2
  assert.ok(elapsedVisits < remainingVisits, 'Pause release belongs to a later same-family episode')
  assert.equal(up.f1, Math.max(0, detected.f1 - elapsedVisits))
  assert.equal(up.f2, detected.f2 + Math.max(0, elapsedVisits - detected.f1))
  assert.equal(up.counter, (detected.counter + elapsedVisits) & 255)
  assert.equal(up.timer, detected.timer + elapsedVisits)
  return { detected, down, up, click, elapsedVisits, remainingVisits }
}

// Reuses the reviewed pre-pressed ordinary Pause delivery. The predicate follows
// an observed live owner; no fixed wall-time prediction triggers the release.
export async function pauseNaturalGesture({ page, id, sources, remainingMs, maxFrame = 255 }) {
  const box = await page.getByRole('button', { name: 'Pause game', exact: true }).boundingBox()
  assert.ok(box)
  const point = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) }
  await page.evaluate(installPauseInputObserver, { id, point })
  let held = false, handle, trace
  try {
    await page.mouse.move(point.x, point.y); held = true; await page.mouse.down({ button: 'left' })
    handle = await page.waitForFunction(({ id, sources, maxFrame }) => {
      if (window.preacherCandidate?.tracker.progress.status === 'failed')
        throw Error(window.preacherCandidate.tracker.progress.reason)
      if (window.preacherCandidate?.tracker.progress.status === 'passed')
        throw Error('Original finite observation ended before the requested gesture capture')
      const s = window.testSceneRef.current, w = s.world, u = w.units.find(u => u.id === id), p = u?.native
      if (!u || u.hp <= 0 || u.inside !== null || p?.vehicle || u.flight || u.fight ||
        w.status !== 'playing' || w.speed !== 1 || document.visibilityState !== 'visible')
        throw Error('Ordinary gesture Pause wait lost its live owner')
      const order = p && w.buildingOrders.records[p.immediateCommand || p.commands[p.commandCursor]]
      if (w.paused || !sources.includes(p.object) || p.state !== 10 || p.substate !== 3 ||
        p.commandStatus !== 17 || order?.model !== 17 || !(p.statusFlags & 1) || p.f2 > maxFrame) return false
      return { now: performance.now(), turn: w.turn, object: p.object, draw: p.draw, f1: p.f1, f2: p.f2,
        state: p.state, substate: p.substate, commandStatus: p.commandStatus, statusFlags: p.statusFlags,
        timer: p.timer, counter: p.counter, order: structuredClone(order) }
    }, { id, sources, maxFrame }, { polling: 'raf', timeout: Math.max(1, remainingMs()) })
    held = false; await page.mouse.up({ button: 'left' })
    const detected = await handle.jsonValue()
    trace = await page.evaluate(() => window.preacherPauseInput.finish())
    const result = requireGesturePause(trace, detected)
    await page.waitForFunction(now => window.testSceneRef.current.previous > now,
      result.click.now, { polling: 'raf', timeout: 3000 })
    return result
  } finally {
    if (held) await page.mouse.up({ button: 'left' })
    await handle?.dispose()
    if (!trace) await page.evaluate(() => window.preacherPauseInput?.finish()).catch(() => {})
  }
}
