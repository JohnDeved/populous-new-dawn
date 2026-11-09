import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

// Actual component setup, effects and Retry callback with supplied hook commits,
// renderer promises, event delivery and DOM focus. No React or WebGL is mounted.
const source = readFileSync(new URL('../app/world-selector-scene.tsx', import.meta.url), 'utf8')
const marker = 'export function WorldSelectorScene('
assert.equal(source.split(marker).length, 2)
const start = source.indexOf(marker)
const end = source.indexOf('\n  return (\n    <div', start)
assert.ok(end > start)
const retry = source.match(/onClick=\{(\(\) => setGeneration\(value => value \+ 1\))\}/g)
assert.equal(retry?.length, 1)
const retryCallback = retry[0].slice('onClick={'.length, -1)
const selected = stripTypeScriptTypes(source.slice(start, end).replace('export function', 'function') + `
  return { canvasRef, selection, retry: ${retryCallback},
    sceneContainer: typeof sceneContainer === 'undefined' ? null : sceneContainer,
    retryControl: typeof retryControl === 'undefined' ? null : retryControl }
}
`) + '\nreturn WorldSelectorScene\n'

function fixture() {
  const refs = [], states = [], effects = [], listeners = new Map(), renderers = []
  const frames = new Map(), timers = new Map(), focusCalls = [], clears = []
  let refAt = 0, stateAt = 0, nextFrame = 0, nextTimer = 0, cleanup, owner
  const body = { name: 'body' }, mission = { name: 'mission' }, outside = { name: 'outside' }
  const retry = { name: 'retry', contains(node) {
    while (node) { if (node === this) return true; node = node.parent }
    return false
  } }
  const child = { name: 'child', parent: retry }
  const document = { hidden: false, activeElement: body,
    addEventListener() {}, removeEventListener() {} }
  const scene = { name: 'scene', focus(options) {
    focusCalls.push(options)
    document.activeElement = scene
  } }
  const canvas = { dataset: {}, addEventListener(type, listener) { listeners.set(type, listener) },
    removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type) } }
  class Renderer {
    constructor() { this.disposals = 0; renderers.push(this) }
    load() { return new Promise((yes, no) => { this.resolve = yes; this.reject = no }) }
    dispose() { this.disposals++ }
    advanceSun() {}
    render() {}
  }
  const Component = new Function('useRef', 'useState', 'useEffect', 'SelectorMotion',
    'SelectorRenderer', 'document', 'requestAnimationFrame', 'cancelAnimationFrame',
    'setTimeout', 'clearTimeout', 'selectorWorlds', 'sceneStep', selected)(
    initial => refs[refAt++] ?? (refs[refAt - 1] = { current: initial }),
    initial => {
      const index = stateAt++
      if (!(index in states)) states[index] = initial
      return [states[index], next => {
        const value = typeof next === 'function' ? next(states[index]) : next
        if (index === 0 && value === false) clears.push(document.activeElement)
        states[index] = value
      }]
    },
    effect => effects.push(effect), class {}, Renderer, document,
    callback => { const id = ++nextFrame; frames.set(id, callback); return id },
    id => frames.delete(id),
    callback => { const id = ++nextTimer; timers.set(id, callback); return id },
    id => timers.delete(id), [], 1 / 120
  )
  function render() {
    refAt = 0; stateAt = 0; effects.length = 0
    owner = Component({ mission: 1, progressionMission: 1 })
    owner.canvasRef.current = canvas
    if (owner.sceneContainer) owner.sceneContainer.current = scene
    if (owner.retryControl) owner.retryControl.current = states[0] ? retry : null
  }
  return {
    body, mission, outside, retry, child, scene, document, states, focusCalls, clears, renderers,
    mount() { render(); effects[0](); cleanup = effects[1]() },
    fail() { listeners.get('webglcontextlost')({ preventDefault() {} }); render() },
    recover(trigger) {
      if (trigger === 'retry') owner.retry()
      else listeners.get('webglcontextrestored')()
      cleanup()
      render()
      effects[0]()
      cleanup = effects[1]()
    },
    commit() {
      if (!states[0] && retry.contains(document.activeElement)) document.activeElement = body
      render()
    },
    clearObservations() { clears.length = 0; focusCalls.length = 0 },
    restoreHandler() { return listeners.get('webglcontextrestored') },
    cleanup() { cleanup?.() },
  }
}

for (const trigger of ['retry', 'restore']) {
  for (const target of ['retry', 'child', 'scene', 'mission', 'outside']) {
    test(`${trigger}: preserve focus owned by ${target} before failure UI retires`, () => {
      const f = fixture()
      f.mount()
      f.fail()
      assert.equal(f.states[0], true)
      f.document.activeElement = f[target]
      f.clearObservations()
      try {
        f.recover(trigger)
        const retiring = target === 'retry' || target === 'child'
        const expected = retiring ? f.scene : f[target]
        assert.equal(f.states[1], 1)
        assert.equal(f.states[0], false)
        assert.deepEqual(f.clears, [expected], 'focus must settle before failure is cleared')
        assert.equal(f.document.activeElement, expected, 'focus must settle before removal')
        f.commit()
        assert.equal(f.document.activeElement, expected)
        assert.equal(f.focusCalls.length, retiring ? 1 : 0)
        if (retiring) assert.deepEqual(f.focusCalls[0], { preventScroll: true })
        assert.equal(f.renderers.length, 2)
        assert.equal(f.renderers[0].disposals, 2)
      } finally { f.cleanup() }
    })
  }
}

test('initial setup does not take focus from another control', () => {
  const f = fixture()
  f.document.activeElement = f.mission
  f.mount()
  assert.equal(f.document.activeElement, f.mission)
  assert.equal(f.focusCalls.length, 0)
  f.cleanup()
})

test('a disposed context-restored callback does not request another generation', () => {
  const f = fixture()
  f.mount()
  f.fail()
  const restore = f.restoreHandler()
  f.cleanup()
  f.document.activeElement = f.outside
  restore()
  assert.equal(f.states[1], 0)
  assert.equal(f.document.activeElement, f.outside)
  assert.equal(f.focusCalls.length, 0)
})

test('repeated failure and retry preserve ownership before each retirement', () => {
  const f = fixture()
  f.mount()
  try {
    for (let generation = 1; generation <= 3; generation++) {
      f.fail()
      f.document.activeElement = f.retry
      f.clearObservations()
      f.recover('retry')
      assert.equal(f.states[1], generation)
      assert.deepEqual(f.clears, [f.scene])
      assert.equal(f.document.activeElement, f.scene)
      f.commit()
      assert.equal(f.document.activeElement, f.scene)
      assert.deepEqual(f.focusCalls, [{ preventScroll: true }])
    }
  } finally { f.cleanup() }
})

test('JSX binds the retiring control and a stable non-action focus destination', () => {
  assert.match(source, /<div\s+ref=\{sceneContainer\}[\s\S]*?tabIndex=\{-1\}/)
  assert.match(source, /<button\s+ref=\{retryControl\}\s+onClick=/)
  assert.equal(source.split('ref={sceneContainer}').length, 2)
  assert.equal(source.split('ref={retryControl}').length, 2)
})
