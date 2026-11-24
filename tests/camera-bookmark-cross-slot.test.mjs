import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import test from 'node:test'
import { createCameraMotion, requestCameraFocus, stepCameraMotion } from '../app/camera-motion.ts'

const from = path => readFileSync(new URL(path, import.meta.url), 'utf8')
function segment(source, start, end) {
  const i = source.indexOf(start), j = source.indexOf(end, i)
  assert(i >= 0 && j > i)
  return source.slice(i, j).replace(/^export /, '')
}
const input = from('../app/scene-input-runtime.ts')
const camera = from('../app/scene-camera-runtime.ts')
const keyDown = new Function('followerGroupDisplayKey', 'requestCameraFocus', stripTypeScriptTypes([
  segment(input, 'const cameraKeys:', '\nexport function pickUnit('),
  segment(input, 'export function keyDown(', '\nexport function cancelPointerGesture('),
  segment(camera, 'export function cameraBookmark(', '\n// Only ordinary ground zoom'),
].join('\n')) + '\nreturn keyDown')(() => {}, requestCameraFocus)

function fixture() {
  const cameraPosition = { x: 4096, y: 8192, angle: 40 }
  const cameraMotion = createCameraMotion()
  const sounds = [], operations = []
  const scene = {
    keys: new Set(), world: { mode: null, inputMask: 0 }, tooltip: { draw: 0 },
    cameraPosition, cameraMotion, cameraBookmarks: [{ x: 16624, y: 19345, angle: 650 }],
    captureCamera() { operations.push('capture') },
    cancelOverview() { operations.push('cancelOverview') },
    onSound(id) { sounds.push(id) },
  }
  const press = (key, options = {}) => keyDown(scene, {
    key: options.shiftKey ? key.toUpperCase() : key,
    code: 'Key' + key.toUpperCase(), repeat: false, shiftKey: false, ctrlKey: false,
    metaKey: false, altKey: false, target: { closest() { return null } },
    preventDefault() {}, ...options,
  })
  const move = steps => {
    for (let i = 0; i < steps; i++)
      stepCameraMotion(cameraMotion, cameraPosition, 1, { rotate() {}, globe() {} })
  }
  const settle = () => {
    for (let i = 0; i < 512 && cameraMotion.active; i++) move(1)
    assert.equal(cameraMotion.active, 0)
  }
  return { scene, press, move, settle, sounds, operations }
}

const cent = ({ x, y, angle }) => ({ x: (x & 0xfe00) | 0x100, y: (y & 0xfe00) | 0x100, angle })
test('a held save of X during travel to Z preserves X’s capture point and Z’s independent recall', () => {
  const { scene, press, move, settle, sounds, operations } = fixture()
  const z = structuredClone(scene.cameraBookmarks[0])
  press('z')
  move(16)
  const midflight = structuredClone(scene.cameraPosition)
  assert.notDeepEqual(midflight, cent(z))
  press('x', { shiftKey: true })
  assert.deepEqual(scene.cameraBookmarks[1], midflight)
  move(16)
  assert.notDeepEqual(scene.cameraPosition, midflight, 'camera must advance while the key is held')
  press('x', { shiftKey: true, repeat: true })
  assert.deepEqual(scene.cameraBookmarks[1], midflight, 'held save must not record a different location')
  assert.deepEqual(scene.cameraBookmarks[0], z)
  settle()
  press('x')
  settle()
  assert.deepEqual(scene.cameraPosition, cent(midflight), 'fresh X must return to its original mid-flight capture')
  press('z')
  settle()
  assert.deepEqual(scene.cameraPosition, cent(z))
  assert.deepEqual(sounds, [222, 221, 222, 222])
  assert.deepEqual(operations, ['cancelOverview', 'capture', 'capture', 'cancelOverview', 'capture', 'cancelOverview', 'capture'])
})

test('a key blocked by a campaign message cannot save a bookmark via repeat after the message closes', () => {
  const { scene, press, sounds, operations } = fixture()
  scene.messageModal = true
  press('v', { shiftKey: true })
  assert.equal(scene.cameraBookmarks[3], undefined)
  scene.messageModal = false
  press('v', { shiftKey: true, repeat: true })
  assert.equal(scene.cameraBookmarks[3], undefined, 'dismissal must not convert held V into a save')
  assert.deepEqual(sounds, [])
  assert.deepEqual(operations, [])
  press('v', { shiftKey: true })
  assert.deepEqual(scene.cameraBookmarks[3], scene.cameraPosition)
  assert.deepEqual(sounds, [221])
  assert.deepEqual(operations, ['capture'])
})

test('held ordinary camera pan remains in the key set when a bookmark repeat is dropped', () => {
  const { scene, press } = fixture()
  press('arrowright', { repeat: true })
  press('x', { repeat: true })
  assert(scene.keys.has('arrowright'))
  assert.equal(scene.cameraBookmarks[1], undefined)
})
