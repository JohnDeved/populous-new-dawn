import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { groundSampler, freshGroundCandidates, findFreshGround } from './ground-input.mjs'
import { createOrderDispatch } from './ground-dispatch.mjs'

// Execute the exact inherited pure function without its browser-only app imports.
const source = readFileSync(new URL('../preacher-gesture-baseline/inherited/browser-probes.mjs', import.meta.url), 'utf8')
const pureSource = source.slice(source.indexOf('export function findEntityInput('), source.indexOf('\nexport function inspectEntityPoint('))
const { findEntityInput } = await import(`data:text/javascript,${encodeURIComponent(pureSource)}`)
const context = { model: 3, enabled: true, buildingId: null, personId: null, shrineId: null, treeId: null, vehicleId: null }
function fixture({ object = () => null, owned = () => true, terrain = p => ({ x: (p.clientX - 100) / 20, z: (p.clientY - 100) / 20 }) } = {}) {
  const canvas = {}, calls = []
  const scene = { frame: 9, world: { turn: 1893, selected: [46], paused: false, status: 'playing', mode: null, inputMask: 0 },
    renderer: { domElement: canvas }, pick(p) { calls.push(['ground', p.clientX, p.clientY]); return terrain(p) },
    picking: { pick(p) { calls.push(['object', p.clientX, p.clientY]); return object(p) } } }
  return { scene, calls, doc: { elementFromPoint: (x, y) => owned(x, y) ? canvas : {} },
    hit: { x: 100, y: 100, point: { x: 0, z: 0 }, interiorRadius: 2, context },
    selected: [46], findEntityInput, contextAt: () => context, collisionAt: () => 0 }
}

test('failure first: same center terrain and context can lose one of its 25 ownership samples', () => {
  const initial = fixture(), sampler = groundSampler(initial.scene, initial.doc, initial.hit.point, true)
  assert.deepEqual(findEntityInput([initial.hit], 0, sampler.inspect), { x: 100, y: 100, interiorRadius: 2 })
  const changed = fixture({ object: p => p.clientX === 98 && p.clientY === 98 ? 777 : null })
  assert.deepEqual(changed.scene.pick({ clientX: 100, clientY: 100 }), initial.hit.point)
  const stale = groundSampler(changed.scene, changed.doc, changed.hit.point)
  assert.equal(findEntityInput([changed.hit], 0, stale.inspect), null)
  assert.deepEqual(stale.samples.map(s => [s.x, s.y, s.objectId, s.reason]), [[98, 98, 777, 'competing-object']])
  const fresh = findFreshGround(changed)
  assert.deepEqual(fresh.hit, { x: 102, y: 100, interiorRadius: 2, point: { x: 0.1, z: 0 }, context })
  assert.equal(fresh.diagnostics.samples[0].objectId, 777)
  assert.equal(fresh.diagnostics.centers.length, 2, 'Stops as soon as first valid fresh interior is found')
  assert.equal(new Set(fresh.diagnostics.samples.map(p => `${p.x},${p.y}`)).size, fresh.diagnostics.samples.length)
})

test('finite cross and original drift bound reject exhausted ownership/context/collision', () => {
  assert.equal(freshGroundCandidates({ x: 100, y: 100 }).length, 20)
  for (const mutate of [f => { f.doc.elementFromPoint = () => null },
    f => { f.contextAt = () => ({ ...context, enabled: false }) },
    f => { f.contextAt = () => ({ ...context, personId: 777 }) }, f => { f.collisionAt = () => 1 }]) {
    const f = fixture(); mutate(f); const result = findFreshGround(f)
    assert.equal(result.hit, null); assert.equal(result.diagnostics.centers.length, 17)
    assert.ok(result.diagnostics.samples.length <= 425)
  }
  const f = fixture({ object: p => Math.abs(p.clientX - 100) <= 4 ? 777 : null })
  assert.equal(findFreshGround(f).hit, null, 'An otherwise open center beyond <0.25 is not a rescue')
})

test('recipient/scene/world/pause changes fail before any picker call', () => {
  for (const mutate of [f => { f.scene.world.selected = [47] }, f => { f.currentWorld = {} },
    f => { f.currentScene = {} }, f => { f.scene.world.paused = true },
    f => { f.scene.world.inputMask = 1 }, f => { f.scene.world.mode = 'temple' }]) {
    const f = fixture(); mutate(f)
    assert.equal(findFreshGround(f).diagnostics.decision, 'input-owner-or-recipient-changed')
    assert.deepEqual(f.calls, [])
  }
})

test('sampler records actual reasons and adds no diagnostic re-picks', () => {
  const f = fixture({ owned: x => x !== 0, object: p => p.clientX === 1 ? 777 : null,
    terrain: p => p.clientX === 2 ? null : { x: 3, z: 0 } })
  const sampler = groundSampler(f.scene, f.doc, { x: 0, z: 0 })
  for (let x = 0; x < 4; x++) sampler.inspect({ x, y: 0 })
  assert.deepEqual(sampler.samples.map(s => s.reason), ['not-canvas-owned', 'competing-object', 'no-ground-pick', 'outside-target-radius'])
  assert.deepEqual(f.calls.map(c => c[0]), ['object', 'object', 'ground', 'object', 'ground'])
})

test('ground dispatch never clicks an exhausted probe or retries after delivery fails', async () => {
  for (const valid of [false, true]) {
    let clicks = 0, evaluations = 0, finished = 0
    const failure = Error('actual delivered input failed')
    const hit = { x: 102, y: 100, point: { x: 0.1, z: 0 }, context }
    const dispatch = createOrderDispatch({
      page: { evaluate: async () => { evaluations++; return { hit: valid ? hit : null } },
        mouse: { click: async (x, y) => { assert.deepEqual([x, y], [102, 100]); clicks++; throw failure } } },
      read: async () => ({ turn: 2, lastOrderTurn: 1, paused: false, mode: null, selected: [46] }),
      log() {}, health() {}, signal: { throwIfAborted() {} },
      ordinary: { finishEntityClick: async () => { finished++; return null } } })
    await assert.rejects(dispatch.clickOrder({ x: 100, y: 100, point: { x: 0, z: 0 } }),
      valid ? error => error === failure : /No fresh legal 5x5/)
    assert.equal(clicks, valid ? 1 : 0); assert.equal(evaluations, 1); assert.equal(finished, 1)
  }
})
