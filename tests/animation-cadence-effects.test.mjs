// Effect cadence (#214): Lightning branch shapes, counterless sprite effects and
// the Armageddon arrival sparkle, driven by the real advanceGame clock and the
// real scene-effects renderer in Node at several display refresh rates.
//
// Original evidence (EXE 3a5065c7..., static read; decomp/research/animation-cadence.md):
// - main_3 0x4a4450 draws every loop iteration (draw_main -> draw_land), also
//   while paused; draw-polygons case 19 (0x46b16a) calls 0x475350 once per drawn
//   bolt segment, so the branch shape and its cosmetic RNG use follow draw visits.
// - 0x4ee770 (sprite animation) is skipped while land_flags_1 & 2 (pause).
// - Effects 60/61/66 (0x509c10) set draws 44/46/44 for HFX1288/1294/1224 with no
//   0x40000 gate: one frame per draw visit, looping over the descriptor hold.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import effectsAtlas from '../app/original-effects.json' with { type: 'json' }
import { loadSceneFixture, makeSceneFixture } from './support/bloodlust-scene.mjs'

async function api() {
  const base = await loadSceneFixture()
  const effects = await import('../app/scene-effects.ts')
  return { ...base, effects }
}

// The scene surface scene-effects reads for sprites and bolts. Projection is a
// fixed, camera-independent function, so geometry changes only when shapes do.
function sceneFor(world, effects) {
  const scene = {
    world,
    overviewActive: false,
    container: { clientWidth: 800, clientHeight: 600 },
    locate() {},
    view: {
      config: { scaledSprites: 0 },
      project: (point, h) => ({ screenX: 400 + point.x * 4, screenY: 300 + point.z * 4 - h, flags: 0, z: 0 }),
    },
  }
  scene.animateLightning = (mesh, b) => effects.animateLightning(scene, mesh, b)
  return scene
}

function boltWorld(base) {
  const w = base.createWorld(1)
  const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  assert.ok(shaman, 'Mission 1 Shaman')
  w.shots.lightning = 1
  assert.ok(base.cast(w, 'lightning', { x: shaman.x + 6, z: shaman.z }), 'ordinary Lightning cast')
  return w
}

// Drive one display refresh schedule. Every RAF runs advanceGame, then renders
// each live bolt through the real animateLightning, as Scene.animate does.
function runLightning(base, refresh, { speed = 1, seconds = 3, pause } = {}) {
  const w = boltWorld(base)
  w.speed = speed
  const scene = sceneFor(w, base.effects)
  const clock = { animationTime: 0, animationFrame: 0 }
  if (base.effects.lightningDrawVisit) clock.drawVisit = () => base.effects.lightningDrawVisit(scene)
  const meshes = new Map(),
    frames = []
  for (let i = 0; i < seconds * refresh; i++) {
    const time = (i + 1) / refresh
    // A wall-time pause window on a grid every refresh rate shares (1/12 s).
    w.paused = !!pause && time > pause.start + 1e-9 && time <= pause.end + 1e-9
    base.advanceGame(w, clock, 1 / refresh)
    for (const f of w.effects) {
      if (!f.lightning?.segments.length) continue
      let mesh = meshes.get(f.id)
      if (!mesh) meshes.set(f.id, (mesh = new THREE.Mesh(new THREE.BufferGeometry())))
      base.effects.animateLightning(scene, mesh, f.lightning)
      const positions = Array.from(mesh.geometry.getAttribute('position').array)
      frames.push({
        time,
        turn: w.turn,
        paused: w.paused,
        visit: clock.animationFrame,
        branchLines: positions.length / 18 - f.lightning.segments.length,
        shape: positions.join(','),
        random: w.cosmeticRandom.randomState,
      })
    }
  }
  return { w, frames }
}

// Distinct consecutive shapes, keyed by the wall time at which they appeared.
const changes = frames => frames.filter((f, i) => i && f.shape !== frames[i - 1].shape)

test('Lightning branches re-roll once per draw visit, independent of display refresh', async () => {
  const base = await api()
  const runs = [30, 60, 144].map(refresh => ({ refresh, ...runLightning(base, refresh) }))
  for (const { refresh, frames } of runs) {
    assert.ok(frames.length >= (refresh * 3) / 12, `${refresh} Hz rendered the bolt`)
    assert.ok(frames.some(f => f.branchLines > 0), `${refresh} Hz drew branches`)
    // A rendered frame without a new draw visit shows exactly the previous shape.
    for (let i = 1; i < frames.length; i++)
      if (frames[i].visit === frames[i - 1].visit && frames[i].turn === frames[i - 1].turn)
        assert.equal(frames[i].shape, frames[i - 1].shape, `${refresh} Hz frame ${i}: shape changed without a draw visit`)
    // Branch shapes change at most once per 24 Hz draw visit (bolt lives 3 turns).
    assert.ok(changes(frames).length <= 7, `${refresh} Hz: ${changes(frames).length} shape changes`)
  }
  // The same visits consume the same cosmetic RNG and draw the same shapes.
  const reference = runs[0]
  for (const run of runs.slice(1)) {
    assert.equal(run.w.cosmeticRandom.randomState, reference.w.cosmeticRandom.randomState, `${run.refresh} Hz RNG`)
    const byVisit = frames => [...new Map(frames.map(f => [`${f.turn}:${f.visit}`, f.shape])).entries()]
    assert.deepEqual(byVisit(run.frames), byVisit(reference.frames), `${run.refresh} Hz shapes per visit`)
  }
})

test('Lightning at 2x speed keeps one shape per draw visit at 60 and 144 Hz', async () => {
  const base = await api()
  const [a, b] = [60, 144].map(refresh => runLightning(base, refresh, { speed: 2 }))
  assert.equal(a.w.cosmeticRandom.randomState, b.w.cosmeticRandom.randomState)
  assert.ok(changes(a.frames).length <= 4 && changes(b.frames).length <= 4)
})

test('paused Lightning keeps the original draw-loop re-roll at the 24 Hz adapter', async () => {
  const base = await api()
  const shown = runLightning(base, 60).frames[0].time,
    start = Math.ceil((shown + 0.01) * 12) / 12,
    pause = { start, end: start + 0.5 }
  const runs = [60, 144].map(refresh => ({ refresh, ...runLightning(base, refresh, { pause }) }))
  for (const { refresh, frames } of runs) {
    const paused = frames.filter(f => f.paused)
    assert.ok(paused.length >= refresh * 0.45, `${refresh} Hz rendered while paused`)
    // No logical turn and no sprite (presentation) visit happens while paused...
    assert.equal(new Set(paused.map(f => `${f.turn}:${f.visit}`)).size, 1, `${refresh} Hz paused clock`)
    // ...but the draw loop keeps rolling new shapes: 12 draw visits in 0.5 s.
    const changed = changes(paused).length
    assert.ok(changed >= 10 && changed <= 12, `${refresh} Hz paused shape changes ${changed}`)
  }
  assert.equal(runs[0].w.cosmeticRandom.randomState, runs[1].w.cosmeticRandom.randomState)
  const pausedRandom = run => run.frames.filter(f => f.paused).at(-1).random
  assert.equal(pausedRandom(runs[0]), pausedRandom(runs[1]))
})

// Shown atlas cell of an effect sprite, from the UV the real renderer wrote.
function shownSource(group, sequence) {
  const uv = group.userData.sprite.userData.atlasTransform
  const index = Math.round((uv.z * effectsAtlas.width) / 256) + 8 * Math.round(((1 - uv.w) * effectsAtlas.height - uv.y * effectsAtlas.height) / 256)
  const frame = effectsAtlas.animations[sequence].find(entry => entry.index === index)
  assert.ok(frame, `atlas index ${index} belongs to ${sequence}`)
  return frame.source
}

// Render sprite effects created by `produce` through makeFx/animateFx at one
// refresh rate; return the shown HFX source per RAF with the presentation visit.
async function runSprites(base, refresh, produce, { seconds = 1.5, speed = 1, world } = {}) {
  const w = world ? world() : base.createWorld(1)
  w.speed = speed
  const scene = sceneFor(w, base.effects)
  const clock = { animationTime: 0, animationFrame: 0 }
  const tracked = new Map()
  const groups = new Map()
  // Only for its texture-loader and document stubs (no GPU or network).
  const stubs = await makeSceneFixture(w)
  try {
  for (let i = 0; i < seconds * refresh; i++) {
    if (i === Math.round(refresh / 5)) for (const f of produce(w)) tracked.set(f.id, { f, samples: [] })
    base.advanceGame(w, clock, 1 / refresh)
    for (const [id, entry] of tracked) {
      if (!w.effects.includes(entry.f)) continue
      let g = groups.get(id)
      if (!g) groups.set(id, (g = base.effects.makeFx(scene, entry.f)))
      base.effects.animateFx(scene, g, entry.f)
      entry.samples.push({ visit: clock.animationFrame, turn: w.turn, source: shownSource(g, g.userData.sequence) })
    }
  }
  } finally {
    stubs.close()
  }
  return [...tracked.values()]
}

const producers = {
  'combat hit (effect 61, draw 46, HFX1294-1299)': {
    produce: (base, w) => {
      const u = w.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
      return [base.effect(w, 'hit', u)]
    },
    first: 1294,
    hold: 6,
  },
  'building death smoke (effect 66, draw 44, HFX1224-1239)': {
    produce: (base, w) => {
      const b = w.buildings.find(building => building.team === 'blue')
      assert.ok(b, 'Mission 1 building')
      b.hp = 0
      base.tick(w, 1 / 12)
      const smoke = w.effects.filter(f => f.kind === 'death' && !f.unit)
      assert.equal(smoke.length, 1, 'ordinary building destruction produced its smoke')
      return smoke
    },
    first: 1224,
    hold: 16,
  },
}

for (const [name, { produce, first, hold }] of Object.entries(producers))
  test(`${name} advances one frame per presentation visit at every refresh rate`, async () => {
    const base = await api()
    const timelines = []
    for (const [speed, refresh] of [
      [1, 30],
      [1, 60],
      [1, 144],
      [2, 60],
    ]) {
      const [{ samples }] = await runSprites(base, refresh, w => produce(base, w), { speed })
      assert.ok(samples.length > 3, `${refresh} Hz samples`)
      for (const s of samples) assert.ok(s.source >= first && s.source < first + hold, `${s.source} in cycle`)
      // The shown frame is the visit count since creation, looping over the hold.
      const start = samples[0].visit - (samples[0].source - first)
      for (const s of samples)
        assert.equal(s.source - first, (s.visit - start) % hold, `${speed}x/${refresh} Hz visit ${s.visit}`)
      const visits = samples.at(-1).visit - samples[0].visit
      assert.ok(visits >= (speed === 1 ? 10 : 4), `${speed}x/${refresh} Hz spans ${visits} presentation visits`)
      if (speed === 1) timelines.push([...new Map(samples.map(s => [s.visit, s.source])).entries()])
    }
    for (const timeline of timelines.slice(1)) assert.deepEqual(timeline, timelines[0], 'same visits show the same frames')
  })

test('spell sparkle visuals use effect 60 counters (draw 44, HFX1288)', async () => {
  const base = await api()
  const [{ samples, f }] = await runSprites(base, 60, w => {
    const shaman = w.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    w.shots.invisibility = 1
    const before = new Set(w.effects.map(e => e.id))
    assert.ok(base.cast(w, 'invisibility', { x: shaman.x + 3, z: shaman.z }), 'ordinary Invisibility cast')
    for (let i = 0; i < 120 && !w.effects.some(e => !before.has(e.id) && e.sprite?.sequence === 'sparkle'); i++) base.tick(w, 1 / 12)
    return w.effects.filter(e => !before.has(e.id) && e.sprite?.sequence === 'sparkle')
  })
  assert.ok(f.animation, 'native sprite counters')
  assert.deepEqual([f.animation.draw, f.animation.object], [44, 1288])
  const start = samples[0].visit - (samples[0].source - 1288)
  for (const s of samples) assert.equal(s.source - 1288, (s.visit - start) % 16)
})

// Mission 17 Armageddon through the live cast path until special-battle arrival
// allocates its draw 44/HFX1401 visuals (0x4dfac0 at 004dfb94).
let armageddonArrival
function armageddonWorld(base) {
  if (!armageddonArrival) {
    const w = base.createWorld(17)
    const shaman = w.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
    for (let index = 0; index < 8; index++) base.addUnit(w, 'blue', index & 1 ? 'warrior' : 'brave', shaman)
    w.shots.armageddon = 1
    w.selected = [shaman.id]
    assert.ok(base.cast(w, 'armageddon', { x: shaman.x + 1, z: shaman.z }), 'ordinary Armageddon cast')
    const arrival = f => f.animation && 'object' in f.animation && f.animation.object >= 1401 && f.animation.object <= 1416
    for (let turn = 0; turn < 3000 && !w.effects.some(arrival); turn++) base.tick(w, 1 / 12)
    assert.ok(w.effects.some(arrival), 'special-battle arrival sparkle allocated')
    armageddonArrival = w
  }
  return structuredClone(armageddonArrival)
}

test('Armageddon arrival sparkle cycles HFX1401-1416 at one frame per presentation visit', async () => {
  const base = await api()
  assert.deepEqual(
    effectsAtlas.animations.armageddonSparkle?.map(f => f.source),
    Array.from({ length: 16 }, (_, i) => 1401 + i),
    'imported HFX1401-1416'
  )
  const arrivals = await runSprites(
    base,
    60,
    w => w.effects.filter(f => f.animation?.object >= 1401 && f.animation.object <= 1416),
    { world: () => armageddonWorld(base), seconds: 1 }
  )
  assert.ok(arrivals.length >= 1)
  for (const { f, samples } of arrivals) {
    assert.equal(f.sprite.sequence, 'armageddonSparkle')
    assert.ok(samples.length > 10)
    const shown = new Set(samples.map(s => s.source))
    assert.equal(shown.size, 16, `whole cycle shown (${[...shown]})`)
    for (let i = 1; i < samples.length; i++)
      assert.equal((samples[i].source - samples[i - 1].source + 16) % 16, (samples[i].visit - samples[i - 1].visit) % 16)
  }
})
