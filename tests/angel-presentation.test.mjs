import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  createAngelPresentation, stepAngelPresentation, animateAngelPresentations,
  angelRawPoints, angelPositions,
} from '../app/angel-presentation.ts'
import { nativeModelResource } from '../app/model-resources.ts'
import { modelStage } from '../app/model-faces.ts'
import data from '../app/original-angel-presentation.json' with { type: 'json' }

// Independently read original bank2 PNTS signed shorts, indexed by raw OBJS70–75,
// and applied integer interpolation without importing the production generator.
const nativeFrameHashes = [
  'f31e1dbd76941a82fc5552010b8a8e39bfa7a9de0751955f50dd8dd6a2ce1615',
  'bab8dacf1135b5c36b197a117ab0f0c57b7e6d1166030c18f99e63c28aaab003',
  'f976d6eb0f774294697a25f1e5586ee63559caa14aa9b414611053a0acc366a1',
  '18840bec04b043141d4c23c8823c67abcbf8c04e914c13bda6144b5f82077b8d',
  'f42bcc63165bbab34436ae9efe93f10ae0fa26575dbf8a84eb1b38d474d8207c',
  '9c56d8900cb5d8a8de30b34bde80a7a184ba7c52268bdeac7cfd71691a1faa21',
  '641b0b50df5cb670c100b2a53eb5da0ee81a238ac623ece2b59dccf0c63c251b',
  'fa896708a67b9e2d1650d57135aa57c18c1aec5f879872083451761160c0bcb1',
  '093d453890522d8e17a9d0ebe9f8d8f634264404c1d9ef3ac1a1aad29a0735d2',
  'd7766bd25ca11b615ce6a773abc50f8c22e5375b30f527f6eccfeee83c928caa',
  '01bcd2f0e77d0838658caa910ac911879640aaa10eaa67a5ea206954878a5653',
  'cbf5fcc4b85771496f3eabf08491110bfb652f5fdde075cef81f3b6c45129bca',
]
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')

test('initial attachment uses original model69 topology and matching bank2/6 resource', () => {
  assert.equal(data.base, 69)
  assert.equal(data.scale, 160)
  assert.equal(data.pointCount, 87)
  assert.equal(data.baseGeometry.faces.length, 222)
  assert.equal(data.morphIndex, 5)
  assert.equal(data.frames, 12)
  for (const bank of [2, 6]) {
    const resource = nativeModelResource(69, bank)
    assert.deepEqual(resource.data, data.baseGeometry)
    assert.equal(modelStage(resource.data, 4).p.length, angelPositions(0).length)
  }
})

for (let frame = 0; frame < 12; frame++)
  test(`original Angel raw frame${frame} preserves native signed-coordinate interpolation`, () => {
    const raw = angelRawPoints(frame)
    assert.equal(raw.length, 261)
    assert.equal(hash(raw), nativeFrameHashes[frame])
    const expected = data.visiblePointIndices.flatMap(i => [raw[i * 3] / 480, raw[i * 3 + 1] / 480, -raw[i * 3 + 2] / 480])
    assert.deepEqual(angelPositions(frame), new Float32Array(expected))
    assert.strictEqual(angelPositions(frame), angelPositions(frame))
  })

test('native descriptor4 visits latch before advancing and loop after12 displayed frames', () => {
  const s = createAngelPresentation()
  assert.equal(s.object, 69)
  assert.equal(s.draw, 4)
  assert.equal(s.renderFlags, 0x8188)
  assert.equal(s.palette, 240)
  const frames = []
  for (let i = 0; i < 25; i++) { stepAngelPresentation(s); frames.push(s.displayedFrame) }
  assert.deepEqual(frames, Array.from({ length: 25 }, (_, i) => i % 12))
  assert.equal(s.f1, 4)
})

test('pause and land-pause hold, JSON checkpoint continuation preserves exact next frame', () => {
  const angel = { phase: 'seeking', target: 91, heading: 0.75, timer: 0, lifetime: 2000 }
  const world = { paused: false, land: { landFlags: 0 }, effects: [{ angel }, { age: 7 }] }
  for (let i = 0; i < 7; i++) animateAngelPresentations(world)
  const snapshot = structuredClone(world)
  world.paused = true
  animateAngelPresentations(world)
  world.paused = false
  assert.deepEqual(world, snapshot)
  world.land.landFlags = 2
  animateAngelPresentations(world)
  world.land.landFlags = 0
  assert.deepEqual(world, snapshot)
  const saved = JSON.parse(JSON.stringify(world))
  for (let i = 0; i < 20; i++) {
    animateAngelPresentations(world)
    animateAngelPresentations(saved)
    assert.deepEqual(world, saved)
  }
  const { presentation, ...gameplay } = angel
  assert.ok(presentation, 'Presentation visitor initialized the serialized latch')
  assert.deepEqual(gameplay, { phase: 'seeking', target: 91, heading: 0.75, timer: 0, lifetime: 2000 })
  assert.deepEqual(world.effects[1], { age: 7 })
})

test('renderer consumes mesh/serialized phase, not Warrior source or simulation age', () => {
  const source = readFileSync(new URL('../app/scene-effects.ts', import.meta.url), 'utf8')
  assert.ok(source.includes('g.add(nativeModel(69, 2, 4, false, scene.environment))'))
  assert.ok(source.includes('f.angel.presentation?.displayedFrame ?? 0'))
  assert.ok(source.includes('position.copyArray(positions)'))
  assert.ok(source.includes('angelPosePositions(pose)'))
  assert.ok(source.includes('nativeModel(pose.object, 2, 4, false, scene.environment)'))
  assert.ok(source.includes('scene.releaseGroup(mesh)'))
  assert.ok(!source.includes("nativeUnits.animations['blue-warrior'].stagger"))
  assert.ok(!source.includes('f.angel.heading, g.userData.directions, f.age'))
  const clock = readFileSync(new URL('../app/game-clock.ts', import.meta.url), 'utf8')
  assert.ok(clock.includes('animateAngelPresentations(w)'))
})

test('out-of-range frames reject rather than silently selecting unrelated artwork', () => {
  for (const frame of [-1, 12, 1.5, NaN, Infinity]) assert.throws(() => angelRawPoints(frame), RangeError)
})

test('public cast and real clock retain gameplay and checkpoint continuation', async () => {
  const { createWorld, addUnit, cast } = await import('../app/model.ts')
  const { retainFixtureUnits } = await import('./level-start-fixture.mjs')
  const { syncLandscapeObjects } = await import('../app/world-terrain-runtime.ts')
  const { createLivePerson, syncLivePersonCells } = await import('../app/live-people.ts')
  const { advanceGame } = await import('../app/game-clock.ts')
  const { createGameStore } = await import('../app/game-store.ts')
  // Same explicitly supplied arena as angel-impact.test.mjs. Public casting,
  // projectile arrival, target acquisition and death are not injected.
  function launch() {
    const w = createWorld(1, 'scalable')
    w.manaWorld.loadFlags |= 0x200
    w.terrain.fill(3)
    w.terrainVersion++
    retainFixtureUnits(w, () => false)
    w.buildings = []; w.trees = []; w.shrines = []
    syncLandscapeObjects(w)
    addUnit(w, 'blue', 'shaman', { x: 0, z: 8 })
    const victim = addUnit(w, 'red', 'brave', { x: 0, z: 0 })
    victim.native = createLivePerson(w, victim)
    victim.native.damageAttacker = 255
    syncLivePersonCells(w)
    w.shots.angel = 1
    assert.equal(cast(w, 'angel', { x: 0, z: 0 }), true)
    return w
  }
  const w = launch(), control = launch()
  const clock = { animationTime: 0, animationFrame: 0 }, other = { ...clock }
  const strip = world => {
    const copy = structuredClone(world)
    for (const e of copy.effects) if (e.angel) delete e.angel.presentation
    return copy
  }
  let partialStrike = false
  for (let i = 0; i < 96; i++) {
    advanceGame(w, clock, 1 / 24)
    advanceGame(control, other, 1 / 24)
    for (const e of control.effects) if (e.angel) delete e.angel.presentation
    assert.deepEqual(strip(w), control)
    const pending = w.effects.find(e => e.angel)?.angel
    if (pending?.phase === 'striking' && pending.presentation?.transitionCounter > 0 &&
        pending.presentation.transitionCounter < 5) { partialStrike = true; break }
  }
  assert.equal(partialStrike, true, 'Actual casting reaches a partial strike transition')
  const angel = w.effects.find(e => e.angel)
  assert.ok(angel?.angel.presentation)
  const store = createGameStore()
  Object.assign(store.getWorld(), w)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld(), resumedClock = { ...clock }
  assert.deepEqual(restored, w)
  for (let i = 0; i < 60; i++) {
    advanceGame(w, clock, 1 / 24)
    advanceGame(restored, resumedClock, 1 / 24)
    assert.deepEqual(restored, w)
  }
  assert.equal(w.killCredits[0][1], 1)
  const partial = structuredClone(store.getWorld().effects.find(e => e.angel).angel.presentation)
  const missingCounter = {...partial}
  delete missingCounter.transitionCounter
  const invalidTimer = {...partial, morphTimer: -4, morphFrames: 2,
    renderFlags: (partial.renderFlags | 0x1000) & ~0x400, sourceKey: 69, targetKey: 76}
  for (const malformed of [missingCounter, invalidTimer, null, 0]) {
    store.getWorld().effects.find(e => e.angel).angel.presentation = malformed
    await assert.rejects(store.saveCheckpoint(), /incompatible with this development version/)
    assert.equal(store.loadCheckpoint(), true, 'Invalid save attempt retains prior checkpoint')
    assert.ok(store.getWorld().effects.find(e => e.angel).angel.presentation.transitionCounter > 0)
  }
})
