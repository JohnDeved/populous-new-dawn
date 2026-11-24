import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Execute the shipped key handler and bookmark consumer, supplying only scene
// and camera-focus boundaries. This is not rendered or native keyboard input.
const input = readFileSync(new URL('../app/scene-input-runtime.ts', import.meta.url), 'utf8')
const camera = readFileSync(new URL('../app/scene-camera-runtime.ts', import.meta.url), 'utf8')
function between(source, begin, end) {
  const start = source.indexOf(begin), stop = source.indexOf(end, start)
  assert(start >= 0 && stop > start)
  return source.slice(start, stop).replace(/^export /, '')
}
const code = stripTypeScriptTypes([
  between(input, 'const cameraKeys:', '\nexport function pickUnit('),
  between(input, 'export function keyDown(', '\nexport function cancelPointerGesture('),
  between(camera, 'export function cameraBookmark(', '\n// Only ordinary ground zoom'),
].join('\n')) + '\nreturn keyDown'
function fixture() {
  const cues = [], focus = []
  const keyDown = new Function('followerGroupDisplayKey', 'requestCameraFocus', code)(
    () => {}, (_motion, _position, target) => focus.push({ ...target }))
  const scene = { world: { inputMask: 0, mode: null }, keys: new Set(),
    cameraBookmarks: [], cameraPosition: { x: 1234, y: 4321, angle: 222 }, cameraMotion: {},
    tooltip: { draw: 0 }, captureCamera() {}, cancelOverview() {}, onSound: cue => cues.push(cue) }
  const press = (key, extra = {}) => keyDown(scene, { key, code: `Key${key.toUpperCase()}`,
    repeat: false, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false,
    target: { closest: () => null }, preventDefault() {}, ...extra })
  return { scene, cues, focus, press }
}
for (const [slot, key] of ['z', 'x', 'c', 'v'].entries()) {
  test(`${key}: held save preserves the initial bookmark; a separate press saves again`, () => {
    const f = fixture()
    f.press(key, { shiftKey: true })
    const first = { ...f.scene.cameraBookmarks[slot] }
    f.scene.cameraPosition.x += 1000
    f.press(key, { shiftKey: true, repeat: true })
    assert.deepEqual(f.scene.cameraBookmarks[slot], first)
    assert.deepEqual(f.cues, [221])
    f.press(key, { shiftKey: true })
    assert.equal(f.scene.cameraBookmarks[slot].x, first.x + 1000)
    assert.deepEqual(f.cues, [221, 221])
  })
  test(`${key}: held recall does not reissue focus/cue; a separate press recalls again`, () => {
    const f = fixture()
    f.scene.cameraBookmarks[slot] = { x: 1234, y: 4321, angle: 222 }
    f.press(key)
    f.press(key, { repeat: true })
    assert.equal(f.focus.length, 1)
    assert.deepEqual(f.focus[0], { x: 1280, y: 4352, angle: 222 })
    assert.deepEqual(f.cues, [222])
    f.press(key)
    assert.equal(f.focus.length, 2)
    assert.deepEqual(f.cues, [222, 222])
  })
  test(`${key}: unsupported modifiers and editable targets remain ignored`, () => {
    const f = fixture()
    f.scene.cameraBookmarks[slot] = { x: 1234, y: 4321, angle: 222 }
    for (const modifier of ['ctrlKey', 'altKey', 'metaKey'])
      for (const shiftKey of [false, true]) f.press(key, { [modifier]: true, shiftKey })
    f.press(key, { target: { closest: () => ({}) } })
    assert.deepEqual(f.cues, [])
    assert.deepEqual(f.focus, [])
  })
}

test('bookmark press filtering does not suppress held camera navigation', () => {
  const f = fixture()
  f.press('w', { repeat: true })
  assert(f.scene.keys.has('w'))
})

test('message and input-lock ownership still block bookmark changes', () => {
  const f = fixture()
  f.scene.messageModal = true
  f.press('z', { shiftKey: true })
  f.scene.messageModal = false
  f.scene.world.inputMask = 1
  f.press('z', { shiftKey: true })
  assert.deepEqual(f.scene.cameraBookmarks, [])
  assert.deepEqual(f.cues, [])
})
