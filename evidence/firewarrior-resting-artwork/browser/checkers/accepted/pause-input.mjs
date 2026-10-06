import assert from 'node:assert/strict'

// Passive observation of one real mouse press/release on the shipped Pause button.
export async function installPauseInputObserver({ id, point }) {
  const { unitAnimationSource } = await import('/app/model.ts')
  if (window.firewarriorPauseInput) throw Error('Pause input observer already exists')
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
      object: p?.object, draw: p?.draw, f1: p?.f1, f2: p?.f2, counter: p?.counter }
  }
  const capture = event => events.push(snapshot(event))
  // Document click bubbling follows the root's synchronous React onClick handler.
  document.addEventListener('pointerdown', capture, true)
  document.addEventListener('pointerup', capture, true)
  document.addEventListener('click', capture)
  window.firewarriorPauseInput = { point, events, finish() {
    document.removeEventListener('pointerdown', capture, true)
    document.removeEventListener('pointerup', capture, true)
    document.removeEventListener('click', capture)
    delete window.firewarriorPauseInput
    return { point, events }
  } }
  return { point, turn: world.turn, paused: world.paused }
}

export function requirePauseInput(trace, detected) {
  assert.deepEqual(trace.events.map(e => e.type), ['pointerdown', 'pointerup', 'click'])
  for (const e of trace.events) {
    assert.equal(e.trusted, true)
    assert.equal(e.button, 0)
    for (const key of ['targetMatches', 'pointOwned', 'sceneWorldSame', 'nativeOwnerSame', 'sourceIsNative'])
      assert.equal(e[key], true, key)
    assert.deepEqual([e.x, e.y], [trace.point.x, trace.point.y])
  }
  const [down, up, click] = trace.events
  assert.equal(down.paused, false)
  assert.equal(up.paused, false)
  assert.equal(click.paused, true)
  assert.equal(detected.object, 720); assert.equal(detected.draw, 18)
  assert.ok(detected.f2 <= 3)
  assert.ok(up.turn >= detected.turn && up.now >= detected.now)
  assert.equal(up.object, 720); assert.equal(up.draw, 18); assert.ok(up.f2 <= 5)
  for (const key of ['turn', 'object', 'draw', 'f1', 'f2', 'counter']) assert.equal(click[key], up[key])
  return { detected, down, up, click }
}
