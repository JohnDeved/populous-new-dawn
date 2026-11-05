import assert from 'node:assert/strict'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { verifyHeldEnter } from '../scripts/globe-held-enter-witness.mjs'

// These model the browser protocol to test witness sequencing and rejection.
// They are not renderer, Playwright, real-event or camera-animation evidence.
function fixture(options = {}) {
  const listeners = new Map(), keys = [], frames = [], captures = []
  const scene = { stage: null, overview: false, morph: { active: false, value: 256 },
    remaining: 0, ground: true, preset: 0, bearing: 0.75, center: { x: 100, y: 200 } }
  let held = false
  const window = {
    addEventListener(type, listener, capture) {
      assert.equal(type, 'keydown'); assert.equal(capture, true)
      assert.equal(listeners.size, 0); listeners.set(type, listener)
    },
    removeEventListener(type, listener, capture) {
      assert.equal(type, 'keydown'); assert.equal(capture, true)
      assert.equal(listeners.get(type), listener); listeners.delete(type)
    },
  }
  const page = {
    evaluate: async fn => structuredClone(runInNewContext('(' + fn.toString() + ')()', { window })),
    keyboard: {
      async down(key) {
        assert.equal(key, 'Enter'); keys.push('down')
        const repeat = held; held = true
        listeners.get('keydown')?.({ key, code: 'Enter',
          repeat: options.corruptRepeat ? false : repeat,
          isTrusted: options.untrusted ? false : true,
          target: { closest: () => options.controlOwner ?? false },
        })
        if (scene.stage || (repeat && !options.missingRepeatGuard)) return
        scene.stage = scene.overview ? 'exit' : 'enter'
      },
      async up(key) {
        assert.equal(key, 'Enter'); keys.push('up')
        if (options.keyUpFailure) throw new Error('owned key release failure')
        held = false
      },
      async press(key) { await this.down(key); await this.up(key) },
    },
  }
  const state = async () => structuredClone(scene)
  const frame = async count => {
    frames.push(count)
    if (options.frameFailure) throw new Error('owned frame failure')
    if (options.incompleteTransition) return
    if (scene.stage === 'enter') {
      assert.equal(count, 24); scene.overview = true; scene.morph.value = 0; scene.ground = false
    } else if (scene.stage === 'exit') {
      assert.equal(count, 25); scene.overview = false; scene.morph.value = 256; scene.ground = true
      if (options.wrongReturnPreset) scene.preset = 2
    }
    scene.stage = null
  }
  const capture = async phase => {
    captures.push(phase)
    if (options.captureFailure) throw new Error('owned screenshot failure')
  }
  return { page, state, frame, capture, keys, frames, captures, window, listeners,
    held: () => held, scene }
}

function cleaned(f) {
  assert.equal(f.held(), false, 'key released')
  assert.equal(f.listeners.size, 0, 'observer detached')
  assert.equal(Object.hasOwn(f.window, '__globeHeldEnterWitness'), false, 'observer alias removed')
}

test('witness uses fixed presentation counts, genuine-repeat evidence and both captures', async () => {
  const f = fixture()
  const result = await verifyHeldEnter(f)
  assert.deepEqual(result.presentationFrames, [24, 25, 25, 24, 24, 25])
  assert.deepEqual(f.frames, result.presentationFrames)
  assert.deepEqual(f.captures, ['overview', 'ground'])
  assert.deepEqual(result.events.map(event => event.repeat), [false, true, true, false, true, true, false, false])
  assert.equal(f.keys.filter(key => key === 'down').length, 8)
  assert.equal(f.scene.overview, false)
  cleaned(f)
})

test('witness rejects the missing-repeat-guard behavior and still cleans up', async () => {
  const f = fixture({ missingRepeatGuard: true })
  await assert.rejects(verifyHeldEnter(f), /completed overview must not start returning/)
  assert.deepEqual(f.frames, [24])
  assert.deepEqual(f.captures, [])
  cleaned(f)
})

for (const option of ['corruptRepeat', 'untrusted', 'controlOwner']) {
  test('witness rejects invalid browser-event evidence: ' + option, async () => {
    const f = fixture({ [option]: true })
    await assert.rejects(verifyHeldEnter(f), /real gameplay keydown ownership, trust and repeat sequence/)
    cleaned(f)
  })
}

for (const [option, message] of [
  ['frameFailure', /owned frame failure/],
  ['captureFailure', /owned screenshot failure/],
  ['incompleteTransition', /completed overview must not start returning/],
  ['wrongReturnPreset', /Expected values to be strictly equal/],
]) {
  test('witness propagates ' + option + ' and cleans up', async () => {
    const f = fixture({ [option]: true })
    await assert.rejects(verifyHeldEnter(f), message)
    cleaned(f)
  })
}

test('witness refuses an existing observation without deleting someone else’s state', async () => {
  const f = fixture()
  const sentinel = { existing: true }
  f.window.__globeHeldEnterWitness = sentinel
  await assert.rejects(verifyHeldEnter(f), /Held-Enter observation already installed/)
  assert.equal(f.window.__globeHeldEnterWitness, sentinel)
  assert.deepEqual(f.keys, [])
  assert.equal(f.listeners.size, 0)
})

test('a key-release failure still removes the observer and cannot report success', async () => {
  const f = fixture({ keyUpFailure: true })
  await assert.rejects(verifyHeldEnter(f), /owned key release failure/)
  assert.equal(f.listeners.size, 0)
  assert.equal(Object.hasOwn(f.window, '__globeHeldEnterWitness'), false)
  assert.equal(f.held(), true, 'failed release is not falsely reported as a released key')
  assert.equal(f.keys.filter(key => key === 'up').length, 2, 'normal release and finally release attempted')
})
