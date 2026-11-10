import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Execute the actual animatePerson selection-arrow owner with supplied ports.
// This does not render WebGL or attribute warnings from a different browser run.
const source = readFileSync(new URL('../app/scene-entities.ts', import.meta.url), 'utf8')
const start = '  const arrow = g.userData.selection as THREE.Sprite | undefined'
const end = '\n}\n\n// Borrowed only by this frame'
assert.equal(source.split(start).length, 2)
const from = source.indexOf(start), to = source.indexOf(end, from)
assert.ok(to > from)
const owner = stripTypeScriptTypes(source.slice(from, to))
const run = new Function('g', 'scene', 'selectedIds', 'selectionArrow', 'size', 'frame', 'shaman', 'flags', 'bucket', owner)
function fixture(image = null) {
  const calls = [], imageSource = { data: image }
  const map = { get image() { return imageSource.data } }
  const arrow = { material: { map }, visible: false,
    scale: { set: (...args) => calls.push(['scale', ...args]) },
    center: { set: (...args) => calls.push(['center', ...args]) } }
  const g = { userData: { selection: arrow, unit: 30, owner: 0 } }
  const world = { selected: [30], paused: true, seed: 123 }
  const scene = { world, view: { config: {} } }
  let rect = { x: -4, y: -3, width: 8, height: 6 }
  const execute = selectedIds => run(g, scene, selectedIds, input => input.selectionFlags ? rect : null, n => n, { nativeHeight: 32 }, false, 0, 1)
  return { arrow, g, world, calls, imageSource, execute, setRect: value => { rect = value } }
}
test('pending or failed image keeps selected arrow out of render list', () => {
  const f = fixture()
  f.execute(); f.execute()
  assert.equal(f.arrow.visible, false)
  assert.deepEqual(f.calls, [])
  assert.deepEqual(f.world, { selected: [30], paused: true, seed: 123 })
})
test('shared image arrival reveals selected arrow with unchanged native geometry', () => {
  const f = fixture(); f.execute()
  f.imageSource.data = { width: 32, height: 32 }
  f.execute()
  assert.equal(f.arrow.visible, true)
  assert.deepEqual(f.calls, [['scale', 8, 6, 1], ['center', 0.5, 0.5]])
})
test('ready image still respects selectedIds and world selection', () => {
  const f = fixture({ width: 32, height: 32 })
  f.execute(new Set()); assert.equal(f.arrow.visible, false)
  f.execute(new Set([30])); assert.equal(f.arrow.visible, true)
  f.world.selected = []; f.execute(); assert.equal(f.arrow.visible, false)
})
test('image loss hides a previously visible arrow', () => {
  const f = fixture({ width: 32, height: 32 }); f.execute()
  f.imageSource.data = null; f.execute(); assert.equal(f.arrow.visible, false)
})
test('missing map or sprite is safe', () => {
  const f = fixture(); f.arrow.material.map = null; f.execute(); assert.equal(f.arrow.visible, false)
  delete f.g.userData.selection; assert.doesNotThrow(() => f.execute())
})
test('ready image cannot override absent or empty native rectangle', () => {
  const f = fixture({ width: 32, height: 32 })
  for (const r of [null, { width: 0, height: 6 }, { width: 8, height: 0 }]) {
    f.setRect(r); f.execute(); assert.equal(f.arrow.visible, false)
  }
})
