import assert from 'node:assert/strict'
import test from 'node:test'
import { swampPresentation } from '../app/swamp-presentation.ts'
import { createSwamp, stepSwamp } from '../app/swamp.ts'
import { createNativeTerrain } from '../app/native-terrain.ts'
import { createGameStore } from '../app/game-store.ts'
import { effect } from '../app/model.ts'
import { advanceGame } from '../app/game-clock.ts'
import art from '../app/original-swamp.json' with { type: 'json' }
import * as THREE from 'three'
import { Painter } from '../app/painter.ts'

test('Swamp presentation reads terrain and global animation without changing gameplay', () => {
  const land = createNativeTerrain(new Int16Array(16384).fill(100)),
    game = { randomState: 123 }, swamp = createSwamp({ x: 0, y: 65535, h: -999 }, 0, 255, game),
    before = structuredClone({ swamp, game }), first = swampPresentation(land, swamp, 11, 9)
  assert.equal(first.length, 14)
  assert.ok(first.every(s => s.visible && s.x >= 0 && s.x <= 65535 && s.y >= 0 && s.y <= 65535))
  assert.ok(first.slice(0, 9).every(s => s.h === 68))
  assert.ok(first.slice(9).every(s => s.h === 100))
  assert.deepEqual({ swamp, game }, before)
  assert.deepEqual(swampPresentation(land, { ...swamp, counter: 0, remaining: 1, kills: 9 }, 11, 9), first)
  const next = swampPresentation(land, swamp, 11, 10)
  assert.notDeepEqual(next.slice(0, 9).map(s => s.frame), first.slice(0, 9).map(s => s.frame))
  assert.deepEqual(next.slice(9), first.slice(9))
  for (const variant of [0, 1, 2, 3]) {
    const samples = swampPresentation(land, { ...swamp, variant }, 11, 0)
    assert.deepEqual(samples.slice(0, 9), swampPresentation(land, { ...swamp, variant: 0 }, 11, 0).slice(0, 9))
    assert.deepEqual(samples.slice(9).map(s => art.frames[s.frame].source),
      Array.from({ length: 5 }, (_, i) => 537 + (11 + i * variant) % 12))
  }
  land.cliffs.fill(128)
  assert.ok(swampPresentation(land, swamp, 11, 0).every(s => !s.visible))
  land.cliffs.fill(0)
  land.categories.fill(1)
  assert.ok(swampPresentation(land, swamp, 11, 0).every(s => !s.visible))
})

test('drawing throughout the complete 32000-visit lifetime changes neither expiry nor RNG', () => {
  const land = createNativeTerrain(new Int16Array(16384).fill(100)),
    game = { randomState: 42 }, swamp = createSwamp({ x: 4096, y: 8192, h: 100 }, 0, 3, game),
    state = game.randomState, callbacks = { cell: () => [], kill() {}, remove() {}, sound() {} }
  for (let i = 1; i <= 32000; i++) {
    swamp.counter = (swamp.counter + 1) & 255
    swampPresentation(land, swamp, 42, i * 2)
    assert.equal(stepSwamp(land, swamp, false, callbacks), i < 32000)
  }
  assert.equal(swamp.remaining, 0)
  assert.equal(swamp.kills, 0)
  assert.equal(game.randomState, state)
})

test('four Swamp variants and global frame survive current Save/Load and paused rendering', async () => {
  const store = createGameStore(), w = store.getWorld(), clock = { animationTime: 0, animationFrame: 0 }
  for (let variant = 0; variant < 4; variant++) {
    const fx = effect(w, 'swamp', { x: variant * 8, z: 20 })
    fx.swamp = { ...createSwamp({ x: variant * 2048, y: 12000, h: 50 }, 0, variant, w), variant }
    fx.duration = Infinity
  }
  w.secondaryEffects.animationFrame = 1234
  w.paused = true
  const snapshot = world => world.effects.filter(f => f.swamp).map(f =>
    ({ state: structuredClone(f.swamp), samples: swampPresentation(world.land, f.swamp, f.id, world.secondaryEffects.animationFrame) }))
  const before = snapshot(w), random = w.randomState
  advanceGame(w, clock, 30)
  assert.deepEqual(snapshot(w), before)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(snapshot(store.getWorld()), before)
  assert.equal(store.getWorld().randomState, random)
})

test('elapsed presentation clock gives the same Swamp frame at 30/60/120/144Hz and irregular cadence', () => {
  const run = schedule => {
    const w = createGameStore().getWorld(), clock = { animationTime: 0, animationFrame: 0 },
      swamp = createSwamp({ x: 4096, y: 8192, h: 100 }, 0, 0, w)
    w.speed = 0
    w.paused = false
    let elapsed = 0, i = 0
    while (elapsed < 1) {
      const dt = Math.min(schedule[i++ % schedule.length], 1 - elapsed)
      advanceGame(w, clock, dt)
      elapsed += dt
    }
    return { frame: w.secondaryEffects.animationFrame, samples: swampPresentation(w.land, swamp, 17, w.secondaryEffects.animationFrame) }
  }
  const expected = run([1 / 60])
  assert.equal(expected.frame, 24)
  for (const schedule of [[1 / 30], [1 / 120], [1 / 144], [0.002, 0.04, 0.17, 0.3]])
    assert.deepEqual(run(schedule), expected)
})

test('candidate Swamp scenario rejects missing layers before reduced baseline evidence can pass', async () => {
  const { default: scenario } = await import('../scripts/local-render/swamp-presentation.mjs')
  for (const layers of [undefined, 0, 1, 13, 14, 15]) {
    const beyondLayerGate = new Error('Reached texture readiness after the candidate layer gate')
    let evaluations = 0, readiness = false
    const page = {
      keyboard: { press: async key => assert.equal(key, '6') },
      mouse: { click: async (x, y) => assert.deepEqual([x, y], [100, 200]) },
      evaluate: async () => {
        evaluations++
        if (evaluations === 1) return
        if (evaluations === 2) return { x: 100, y: 200 }
        assert.equal(evaluations, 3)
        return { kills: 1, credit: 1, layers }
      },
      waitForFunction: async () => { readiness = true; throw beyondLayerGate },
    }
    await assert.rejects(scenario({
      page, output: 'unused-no-files-written',
      openMission: async (...args) => assert.deepEqual(args, [1, { nativeCampaign: true }]),
    }), error => layers === 14 ? error === beyondLayerGate :
      error.code === 'ERR_ASSERTION' && error.actual === layers && error.expected === 14)
    assert.equal(evaluations, 3)
    assert.equal(readiness, layers === 14)
  }
})

// Independent source-derived oracle: 0046f290 prepends native enqueue ordinals
// to buckets; 004673b0 walks buckets high-to-low and each head-to-next chain.
// Do not reuse Painter's comparator, child ordering or submission index here.
function nativeSwampWalk(depths, visible) {
  const heads = new Map(), next = new Map()
  for (let ordinal = 0; ordinal < depths.length; ordinal++) {
    if (!visible[ordinal]) continue
    const distance = depths[ordinal] + 0x6ed4,
      bucket = distance < 64 ? 0 : Math.min(3584, Math.trunc(distance / 16))
    next.set(ordinal, heads.get(bucket))
    heads.set(bucket, ordinal)
  }
  const order = []
  for (let bucket = 3584; bucket >= 0; bucket--) {
    for (let ordinal = heads.get(bucket); ordinal !== undefined; ordinal = next.get(ordinal))
      order.push(ordinal)
  }
  return order
}

test('actual Swamp sprites preserve native ordinals and Painter follows tied/mixed-depth bucket chains', async t => {
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  await loadSceneFixture()
  const { makeSwampPresentation, drawSwampPresentation } = await import('../app/scene-swamp.ts')
  const originalLoad = THREE.TextureLoader.prototype.load
  THREE.TextureLoader.prototype.load = function (_url, onLoad) {
    const texture = new THREE.Texture()
    queueMicrotask(() => onLoad?.(texture))
    return texture
  }
  t.after(() => { THREE.TextureLoader.prototype.load = originalLoad })
  const group = makeSwampPresentation(), land = createNativeTerrain(new Int16Array(16384).fill(100)),
    world = { land, secondaryEffects: { animationFrame: 9 } },
    effect = { id: 37, swamp: null },
    drawScene = { world, view: { config: { scaledSprites: 0 }, project: () => ({ z: 0 }) } }
  t.after(() => { for (const sprite of group.children) sprite.material.dispose() })
  assert.deepEqual(group.children.map(sprite => sprite.userData.swampOrdinal),
    Array.from({ length: 14 }, (_, i) => 13 - i))
  const sprites = [...group.children].sort((a, b) => a.userData.swampOrdinal - b.userData.swampOrdinal)
  for (const variant of [0, 1, 2, 3]) {
    effect.swamp = { ...createSwamp({ x: 0, y: 65535, h: 100 }, 0, 0, { randomState: 1 }), variant }
    const before = structuredClone(effect),
      samples = swampPresentation(land, effect.swamp, effect.id, world.secondaryEffects.animationFrame)
    drawSwampPresentation(drawScene, group, effect)
    assert.deepEqual(effect, before, 'Physical draw order must not alter gameplay or native sample identity')
    for (const [ordinal, sprite] of sprites.entries()) {
      const sample = samples[ordinal], frame = art.frames[sample.frame]
      assert.equal(sprite.name, ordinal < 9 ? 'swamp-trap' : 'swamp-plant')
      assert.equal(sprite.userData.source, frame.source)
      assert.deepEqual(sprite.position.toArray(), [
        ((sample.x - effect.swamp.center.x) << 16 >> 16) / 256,
        (sample.h - effect.swamp.center.h) / 128,
        -((sample.y - effect.swamp.center.y) << 16 >> 16) / 256,
      ])
      assert.deepEqual(sprite.scale.toArray(), [frame.w, frame.h, 1])
    }
  }
  // Supply only projection/visibility and GPU submission boundaries. The actual
  // Painter builds commands, GPU depth ranks and Three's transparent comparator.
  const view = {
    materials: new Map(sprites.map(sprite => [sprite.material, {}])),
    uniforms: { nativeBasis: { value: [0, 0, 0, 0, 0, 0, 0, 0, 16384] } },
    center: { x: 0, y: 0 }, overview: false,
    visible: () => true, relative: point => ({ x: 0, y: 0, z: point.z }),
  }, painter = new Painter(view), scene = new THREE.Scene()
  scene.add(group)
  group.userData.cellPosition = { x: 0, z: 0 }
  t.after(() => painter.texture.dispose())
  const tied = Array(14).fill(0),
    mixed = [-512, 0, 64, 0, 512, -512, 64, 1024, 0, 512, 0, 64, 1024, -512]
  for (const [depths, hidden] of [[tied, []], [mixed, []], [mixed, [1, 4, 9]]]) {
    const visible = sprites.map((_, ordinal) => !hidden.includes(ordinal))
    sprites.forEach((sprite, ordinal) => {
      sprite.position.set(0, 0, depths[ordinal])
      sprite.visible = visible[ordinal]
    })
    scene.updateMatrixWorld(true)
    let transparentSort
    painter.update(scene, { setTransparentSort: sort => { transparentSort = sort } })
    const items = sprites.filter((_, ordinal) => visible[ordinal]).map(object => ({
      object, groupOrder: 0, renderOrder: 0, z: 0, id: object.id,
    })), expected = nativeSwampWalk(depths, visible)
    assert.deepEqual(items.slice().sort(transparentSort).map(item => item.object.userData.swampOrdinal), expected)
    assert.deepEqual(items.slice().sort((a, b) => painter.depth(b.object, 0, 0) - painter.depth(a.object, 0, 0))
      .map(item => item.object.userData.swampOrdinal), expected)
    assert.equal(painter.commandsBySlot.filter(Boolean).length, expected.length)
    if (depths === tied) assert.deepEqual(expected, Array.from({ length: 14 }, (_, i) => 13 - i))
    else assert.ok(new Set(items.map(item => painter.command(item.object, 0).bucket)).size > 1)
  }
})
