import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'

// Execute the selected component initializer, media effect and failure handlers.
// Hooks, media promises, activeElement and control retirement are supplied here.
// This is not mounted React, native focus behavior or a trusted-event check.
const source = readFileSync(new URL('../app/startup-logo.tsx', import.meta.url), 'utf8')
assert.equal(source.split('export function StartupLogo(').length, 2)
const start = source.indexOf('export function StartupLogo(')
const end = source.indexOf('\n  return (\n    <dialog', start)
assert.ok(start >= 0 && end > start)
const marker = 'onError={() => {'
assert.equal(source.split(marker).length, 2)
const onError = source.slice(source.indexOf(marker) + marker.length).split('\n          }}')[0]
assert.match(onError, /completed\.current/)
const prefix = source.slice(start, end).replace('export function', 'function')
const selected = stripTypeScriptTypes(`${prefix}
  return { onError: () => {${onError}}, playFromControl, complete,
    playbackControl: typeof playbackControl === 'undefined' ? null : playbackControl }
}
`) + '\nreturn StartupLogo\n'

function fixture() {
  const refs = [], effects = [], states = [], focusCalls = []
  const body = { name: 'body' }
  const sound = { name: 'sound', contains(target) { while (target) { if (target === this) return true; target = target.parent } return false } }
  const child = { name: 'child', parent: sound }
  const skip = { name: 'skip' }, outside = { name: 'outside' }
  const document = { hidden: false, activeElement: body, addEventListener() {}, removeEventListener() {} }
  const modal = { name: 'modal', showModal() {}, close() {}, focus(options) { document.activeElement = modal; focusCalls.push(options) } }
  const media = { error: null, play() { return this.nextPlay ?? Promise.resolve() }, pause() {}, load() {}, removeAttribute() {} }
  let completions = 0, focusAtFailure
  const component = new Function('useRef', 'useState', 'useCallback', 'useEffect', 'document', 'Image', 'source', selected)(
    initial => { const ref = { current: initial }; refs.push(ref); return ref },
    initial => { const at = states.length; states.push(initial); return [initial, next => {
      if (next === 'failed') focusAtFailure = document.activeElement
      states[at] = next
    }] },
    fn => fn, fn => effects.push(fn), document,
    class { decode() { return Promise.resolve() } }, '/original/startup/blogo.webm'
  )
  const owner = component({ onComplete: () => completions++ })
  refs[0].current = modal
  refs[1].current = media
  if (owner.playbackControl) owner.playbackControl.current = sound
  let cleanup
  return {
    owner, states, document, media, modal, sound, child, skip, outside, body, focusCalls,
    start() { cleanup = effects[0](); focusCalls.length = 0 },
    cleanup() { cleanup?.() },
    commit() { if (states[0] === 'failed' && sound.contains(document.activeElement)) document.activeElement = body },
    get completions() { return completions },
    get focusAtFailure() { return focusAtFailure },
  }
}

async function fail(f, path) {
  f.media.error = { code: 3 }
  if (path === 'media-error') f.owner.onError()
  else {
    f.media.nextPlay = Promise.reject(new Error('decode failure'))
    if (path === 'autoplay-rejection') f.start()
    else f.owner.playFromControl()
    await Promise.resolve()
    await Promise.resolve()
  }
}

for (const path of ['media-error', 'autoplay-rejection', 'resume-rejection']) {
  for (const target of ['sound', 'child', 'skip', 'modal', 'outside']) {
    test(`${path}: retain focus before retiring ${target}`, async () => {
      const f = fixture()
      if (path !== 'autoplay-rejection') {
        f.start()
        await Promise.resolve()
        await Promise.resolve()
      }
      // Effect mount normally focuses the modal before the asynchronous rejection.
      if (path === 'autoplay-rejection') {
        let reject
        f.media.error = { code: 3 }
        f.media.nextPlay = new Promise((_, no) => { reject = no })
        f.start()
        f.document.activeElement = f[target]
        reject(new Error('decode failure'))
        await Promise.resolve()
        await Promise.resolve()
      } else {
        f.document.activeElement = f[target]
        await fail(f, path)
      }
      try {
        assert.equal(f.states[0], 'failed')
        const retiring = target === 'sound' || target === 'child'
        assert.equal(f.document.activeElement, retiring ? f.modal : f[target], 'focus must move before the focused control is removed')
        assert.equal(f.focusAtFailure, retiring ? f.modal : f[target], 'focus ownership must settle before the failed state is queued')
        f.commit()
        assert.equal(f.document.activeElement, retiring ? f.modal : f[target])
        assert.equal(f.focusCalls.length, retiring ? 1 : 0)
        if (retiring) assert.deepEqual(f.focusCalls[0], { preventScroll: true })
        assert.equal(f.completions, 0, 'failure must not skip the logo')
      } finally { f.cleanup() }
    })
  }
}

test('disposed media error cannot steal focus', () => {
  const f = fixture()
  f.start()
  f.cleanup()
  f.document.activeElement = f.outside
  f.owner.onError()
  assert.equal(f.document.activeElement, f.outside)
  assert.equal(f.focusCalls.length, 0)
  assert.equal(f.states[0], 'playing')
})

test('ordinary autoplay refusal keeps its focused control', async () => {
  const f = fixture()
  let reject
  f.media.nextPlay = new Promise((_, no) => { reject = no })
  f.start()
  f.document.activeElement = f.sound
  reject(new Error('autoplay policy'))
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(f.states[0], 'blocked')
  assert.equal(f.document.activeElement, f.sound)
  assert.equal(f.focusCalls.length, 0)
  f.cleanup()
})

test('ordinary resume refusal keeps its focused control', async () => {
  const f = fixture()
  f.start()
  f.document.activeElement = f.sound
  f.media.nextPlay = Promise.reject(new Error('autoplay policy'))
  f.owner.playFromControl()
  await Promise.resolve()
  await Promise.resolve()
  assert.equal(f.states[0], 'blocked')
  assert.equal(f.document.activeElement, f.sound)
  assert.equal(f.focusCalls.length, 0)
  f.cleanup()
})

test('the retiring JSX playback control owns the focus ref', () => {
  const marker = "{playback !== 'failed' && ("
  assert.equal(source.split(marker).length, 2)
  const control = source.slice(source.indexOf(marker)).split('</button>')[0]
  assert.match(control, /<button\s+ref=\{playbackControl\}/)
  assert.equal(source.split('ref={playbackControl}').length, 2)
})
