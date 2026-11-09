import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const moduleUrl = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
const session = stripTypeScriptTypes(read('../app/original-credits-session.ts'))
const { startCreditsPlayback } = await import(moduleUrl(session))
const source = read('../app/original-credits-screen.tsx')
const start = '  useEffect(() => {'
const end = '\n  }, [])'
assert.equal(source.split(start).length, 2, 'one screen lifetime effect')
const first = source.indexOf(start) + start.length
const last = source.indexOf(end, first)
assert.ok(last > first, 'complete screen lifetime effect')
const bindings = [
  'startCreditsPlayback', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame',
  'current', 'root', 'backButton', 'playback', 'returnToMenu', 'setFrame',
  'createOriginalCreditsFrame', 'setFontStatus', 'setFailed', 'window', 'document', 'Image',
]
const effect = `export function install(ports) {
  const { ${bindings.join(', ')} } = ports
  return (() => {${source.slice(first, last)}\n})()
}`
const { install } = await import(moduleUrl(stripTypeScriptTypes(effect)))

// Actual screen effect and playback controller; supplied event targets, clock,
// RAF, image decoding and frame-layout leaves. No React/browser focus claim.
function fixture(t) {
  let now = 0
  let nextId = 0
  let returned = 0
  let focused = true
  const callbacks = new Map()
  const listeners = new Map()
  const images = []
  const origins = []
  const failures = []
  const statuses = []
  const captures = []
  const host = {
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
    setPointerCapture: id => captures.push(id),
  }
  const child = {}
  const button = { contains: target => target === button || target === child }
  const window = new EventTarget()
  const document = new EventTarget()
  document.hidden = false
  document.hasFocus = () => focused
  const ports = {
    startCreditsPlayback,
    performance: { now: () => now },
    requestAnimationFrame: callback => { callbacks.set(++nextId, callback); return nextId },
    cancelAnimationFrame: id => callbacks.delete(id),
    current: { current: { screen: { width: 640, height: 480 }, onReturn: () => returned++ } },
    root: { current: host },
    backButton: { current: button },
    playback: { current: null },
    returnToMenu: { current: null },
    setFrame: frame => origins.push(frame.origin),
    createOriginalCreditsFrame: (screen, origin) => ({ ...screen, origin }),
    setFontStatus: value => statuses.push(value),
    setFailed: value => failures.push(value),
    window,
    document,
    Image: class {
      constructor() {
        images.push(this)
        this.promise = new Promise(resolve => { this.resolve = resolve })
      }
      decode() { return this.promise }
    },
  }
  const cleanup = install(ports)
  t.after(() => {
    cleanup()
    assert.equal(callbacks.size, 0)
    assert.equal(listeners.size, 0)
  })
  return {
    host, button, child, origins, failures, statuses, captures, ports, callbacks, listeners,
    cleanup,
    get returned() { return returned },
    async ready() {
      images.forEach(image => image.resolve())
      await Promise.resolve()
      await Promise.resolve()
      assert.deepEqual(statuses, ['ready'])
    },
    fire(name, target = host, overrides = {}) {
      const event = {
        target, code: 'Space', repeat: false, button: 0, pointerId: 1,
        stopped: false, prevented: false,
        stopPropagation() { this.stopped = true },
        preventDefault() { this.prevented = true },
        ...overrides,
      }
      listeners.get(name)(event)
      return event
    },
    step(value) {
      now = value
      assert.equal(callbacks.size, 1)
      const [id, callback] = callbacks.entries().next().value
      callbacks.delete(id)
      callback()
    },
    blur() { focused = false; window.dispatchEvent(new Event('blur')) },
    focus() { focused = true; window.dispatchEvent(new Event('focus')) },
    hide() { document.hidden = true; document.dispatchEvent(new Event('visibilitychange')) },
    show() { document.hidden = false; document.dispatchEvent(new Event('visibilitychange')) },
  }
}

const subsequentFrames = f => [17, 33, 49, 65, 81, 97, 113].forEach(time => f.step(time))

for (const target of ['host', 'button', 'child']) {
  test(`Space release on ${target} ends the Credits-owned hold`, async t => {
    const f = fixture(t)
    await f.ready()
    f.fire('keydown')
    f.step(1)
    // Supplied cancelled Back activation, with no click or inferred browser focus.
    f.fire('pointerdown', f.button)
    f.fire('pointerup')
    const released = f.fire('keyup', f[target])
    subsequentFrames(f)
    assert.equal(released.stopped, true)
    assert.equal(released.prevented, false)
    assert.deepEqual(f.origins, [-1, -2, -3, -4, -5, -6, -7, -8])
    assert.equal(f.returned, 0)
    assert.deepEqual(f.failures, [])
  })
}

test('a Space tap released over Back before the first RAF does not accelerate', async t => {
  const f = fixture(t)
  await f.ready()
  f.fire('keydown')
  f.fire('keyup', f.button)
  f.step(17)
  assert.deepEqual(f.origins, [-2])
  assert.equal(f.returned, 0)
})

test('ignored OS repeats over Back do not steal the original release', async t => {
  const f = fixture(t)
  await f.ready()
  f.fire('keydown')
  f.step(1)
  const repeat = f.fire('keydown', f.button, { repeat: true })
  assert.equal(repeat.stopped, false)
  f.fire('keyup', f.button)
  subsequentFrames(f)
  assert.deepEqual(f.origins, [-1, -2, -3, -4, -5, -6, -7, -8])
})

test('an actual held Space retains the existing repeat and interval model', async t => {
  const f = fixture(t)
  await f.ready()
  f.fire('keydown')
  f.step(1)
  subsequentFrames(f)
  assert.deepEqual(f.origins, [-1, -2, -3, -4, -5, -9, -13, -17])
})

for (const code of ['Space', 'Enter']) {
  test(`Back-only ${code} retains native activation without Credits ownership`, async t => {
    const f = fixture(t)
    await f.ready()
    for (const type of ['keydown', 'keyup']) {
      const event = f.fire(type, f.button, { code })
      assert.equal(event.stopped, false)
      assert.equal(event.prevented, false)
    }
    f.step(17)
    assert.deepEqual(f.origins, [-2])
    assert.equal(f.returned, 0)
    const back = f.ports.returnToMenu.current
    back()
    back()
    assert.equal(f.returned, 1)
    assert.equal(f.callbacks.size, 0)
  })
}

for (const mode of ['blur', 'hidden', 'pointercancel']) {
  test(`${mode} clears held ownership with the existing playback pause reset`, async t => {
    const f = fixture(t)
    await f.ready()
    f.fire('keydown')
    f.step(1)
    if (mode === 'blur') {
      f.blur()
      // Supplied input while paused must not establish a new owner.
      f.fire('keydown')
      f.focus()
    } else if (mode === 'hidden') {
      f.hide()
      f.fire('keydown')
      f.show()
    } else f.fire('pointercancel')
    const released = f.fire('keyup', f.button)
    assert.equal(released.stopped, false)
    assert.equal(released.prevented, false)
    subsequentFrames(f)
    assert.deepEqual(f.origins, [-1, -2, -3, -4, -5, -6, -7, -8])
    assert.equal(f.returned, 0)
  })
}

test('redundant focus notification does not lose an active ownership record', async t => {
  const f = fixture(t)
  await f.ready()
  f.fire('keydown')
  f.step(1)
  f.focus()
  const released = f.fire('keyup', f.button)
  assert.equal(released.stopped, true)
  subsequentFrames(f)
  assert.deepEqual(f.origins, [-1, -2, -3, -4, -5, -6, -7, -8])
})

for (const target of ['host', 'button']) {
  test(`Escape on ${target} still returns once`, t => {
    const f = fixture(t)
    const event = f.fire('keydown', f[target], { code: 'Escape' })
    assert.equal(event.stopped, true)
    assert.equal(event.prevented, true)
    f.step(1)
    assert.equal(f.returned, 1)
    f.ports.returnToMenu.current()
    assert.equal(f.returned, 1)
  })
}

test('unmount disposes held input and stale handlers cannot restart playback or return', async t => {
  const f = fixture(t)
  await f.ready()
  f.fire('keydown')
  const release = f.listeners.get('keyup')
  const stale = [...f.callbacks.values()][0]
  f.cleanup()
  release({ target: f.button, code: 'Space', stopPropagation() {} })
  f.focus()
  stale()
  assert.equal(f.callbacks.size, 0)
  assert.equal(f.returned, 0)
  assert.deepEqual(f.origins, [])
})
