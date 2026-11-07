import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const read = name => readFileSync(new URL('../app/' + name, import.meta.url), 'utf8')
const sceneSource = read('scene.ts')
const inputSource = read('scene-input-runtime.ts')
const graphSource = read('fps-graph.ts')
const listenSource = sceneSource.match(/ {2}listen\(target: EventTarget,[\s\S]*?\n {2}\}/)?.[0]
const releaseSource = inputSource.match(
  / {2}scene.listen\(\s*window,\s*'keyup',[\s\S]*?(?=\n {2}const trackNavigation)/
)?.[0]
const stopSource = graphSource.match(/function stopGameInput\(event: Event\) \{[\s\S]*?\n\}/)?.[0]
assert.ok(listenSource && releaseSource && stopSource, 'production listener boundaries exist')
const evaluate = (source, globals = {}) => runInNewContext(stripTypeScriptTypes(source), globals)

class KeyboardEvent extends Event {
  constructor(type, fields) {
    super(type, { bubbles: true, cancelable: true })
    Object.assign(this, fields)
  }
}
const stop = evaluate('(' + stopSource + ')', { KeyboardEvent })

// The actual production registration/helper/handlers run over supplied event
// targets. This models capture/target/bubble order, not browser focus or pixels.
function fixture() {
  const listeners = []
  const target = {
    addEventListener(type, handler, capture = false) {
      listeners.push({ type, handler, capture })
    },
    removeEventListener(type, handler, capture = false) {
      const index = listeners.findIndex(
        l => l.type === type && l.handler === handler && l.capture === capture
      )
      if (index >= 0) listeners.splice(index, 1)
    },
  }
  const scene = { keys: new Set(), disposeListeners: [] }
  scene.listen = evaluate('(function ' + listenSource.trim() + ')').bind(scene)
  evaluate(releaseSource, { scene, window: target })
  const emit = (event, isolated = true) => {
    for (const listener of [...listeners])
      if (listener.type === event.type && listener.capture) listener.handler(event)
    if (isolated) stop(event)
    if (!event.cancelBubble)
      for (const listener of [...listeners])
        if (listener.type === event.type && !listener.capture) listener.handler(event)
  }
  return { scene, target, listeners, emit }
}

const keyEvent = (key, code, fields = {}) =>
  new KeyboardEvent('keyup', {
    key,
    code,
    ctrlKey: false,
    shiftKey: false,
    ...fields,
  })

test('held camera keys are released before F8 input isolation, including repeated releases', () => {
  assert.match(graphSource, /'keydown',\s*'keyup',/)
  assert.match(graphSource, /button.addEventListener\(type, stopGameInput\)/)
  assert.match(graphSource, /if \(!pickingDetails.hidden\) stopGameInput\(event\)/)
  for (const [key, code] of [
    ['ArrowUp', 'ArrowUp'],
    ['Shift', 'ShiftLeft'],
    ['Control', 'ControlLeft'],
    ["'", 'Quote'],
    ['1', 'Numpad1'],
  ]) {
    for (const isolated of [false, true]) {
      const { scene, emit } = fixture()
      scene.keys.add(key.toLowerCase())
      scene.keys.add(code.toLowerCase())
      scene.keys.add('arrowleft')
      emit(keyEvent(key, code), isolated)
      emit(keyEvent(key, code), isolated)
      assert.deepEqual([...scene.keys], ['arrowleft'], key + ': only released keys clear')
    }
  }
})

test('capture release preserves the existing modifier snapshot policy', () => {
  const { scene, emit } = fixture()
  scene.keys.add('arrowup')
  emit(keyEvent('ArrowUp', 'ArrowUp', { ctrlKey: true, shiftKey: true }))
  assert.deepEqual([...scene.keys].sort(), ['control', 'shift'])
  emit(keyEvent('Shift', 'ShiftLeft', { ctrlKey: true }))
  assert.deepEqual([...scene.keys], ['control'])
  emit(keyEvent('Control', 'ControlLeft'))
  assert.equal(scene.keys.size, 0)
})

test('Scene disposes capture and default listeners with their original phase and identity', () => {
  const { scene, target, listeners, emit } = fixture()
  const ordinary = () => assert.fail('disposed ordinary listener must not execute')
  scene.listen(target, 'keydown', ordinary)
  assert.equal(listeners.length, 2)
  assert.equal(listeners.find(l => l.type === 'keyup').capture, true)
  assert.equal(listeners.find(l => l.type === 'keydown').capture, false)
  for (const dispose of scene.disposeListeners) dispose()
  assert.equal(listeners.length, 0)
  for (const dispose of scene.disposeListeners) dispose()
  scene.keys.add('arrowup')
  emit(keyEvent('ArrowUp', 'ArrowUp'))
  assert.deepEqual([...scene.keys], ['arrowup'], 'no retired scene handler remains')
})

test('F8 still isolates keydown and pointer input without suppressing its toggle key', () => {
  const { scene, emit } = fixture()
  for (const type of ['keydown', 'pointerdown', 'pointerup', 'wheel', 'click']) {
    const event =
      type === 'keydown'
        ? new KeyboardEvent(type, { key: 'ArrowUp', code: 'ArrowUp' })
        : new Event(type, { cancelable: true })
    emit(event)
    assert.equal(event.cancelBubble, true)
    assert.equal(event.defaultPrevented, false, 'native control actions remain available')
    assert.equal(scene.keys.size, 0)
  }
  for (const type of ['keydown', 'keyup']) {
    const event = new KeyboardEvent(type, {
      key: 'F8',
      code: 'F8',
      ctrlKey: false,
      shiftKey: false,
    })
    emit(event)
    assert.equal(event.cancelBubble, false)
    assert.equal(event.defaultPrevented, false)
  }
})
