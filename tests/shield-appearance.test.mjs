// Node-only source/caller coverage. Texture IO, projection and GPU are supplied;
// this is not original instruction execution or a rendered-browser witness.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeSelectionScene } from './support/selection-scene.mjs'

const api = await loadSceneFixture()
const { shieldRectangles } = await import('../app/shield-appearance.ts')
const { createLivePerson, syncLivePersonCells } = await import('../app/live-people.ts')
const { nativeUnitDraw } = await import('../app/unit-kinds.ts')
const { unitRenderAnimationSource } = await import('../app/unit-animation-source.ts')
const { default: units } = await import('../app/original-units.json')
const { default: art } = await import('../app/original-shield.json')
const { spriteCoordinate } = await import('../app/projection.ts')
const view = api.cameraPreset(0)
const colors = [0x333fcb, 0xff4b16, 0xdf9b1f, 0x2fab63]
const state = extra => ({
  remaining: 1440,
  counter: 0,
  unitIndex: 0,
  animationFrame: 0,
  owner: 0,
  frameHeight: 36,
  scaled: false,
  bucket: 1000,
  flags: 0,
  ...extra,
})
const rectangles = (extra, camera = view) =>
  shieldRectangles(state(extra), camera).map(({ frame, x, y, width, height }) => [
    frame.source,
    x,
    y,
    width,
    height,
  ])

test('raw-instruction fixed rectangles distinguish scaled overlay-height and unscaled body-height spans', () => {
  assert.deepEqual(rectangles({}), [
    [1538, -16, -4, 32, 16],
    [1544, -16, -7, 32, 16],
    [1550, -16, -11, 32, 16],
  ])
  assert.deepEqual(rectangles({ animationFrame: 8 }), [
    [1538, -16, -35, 32, 16],
    [1544, -16, -31, 32, 16],
    [1550, -16, -27, 32, 16],
  ])
  assert.deepEqual(rectangles({ scaled: true }), [
    [1538, -16, -4, 32, 16],
    [1544, -16, -6, 32, 16],
    [1550, -16, -8, 32, 16],
  ])
  assert.deepEqual(rectangles({ scaled: true, animationFrame: 8 }), [
    [1538, -16, -20, 32, 16],
    [1544, -16, -18, 32, 16],
    [1550, -16, -16, 32, 16],
  ])
  assert.deepEqual(rectangles({ animationFrame: 1 }), [
    [1539, -16, -7, 32, 16],
    [1543, -16, -4, 32, 16],
    [1549, -16, -7, 32, 16],
  ])
  assert.deepEqual(rectangles({ frameHeight: 37, animationFrame: 8 }), [
    [1538, -16, -36, 32, 16],
    [1544, -16, -32, 32, 16],
    [1550, -16, -28, 32, 16],
  ])
  assert.deepEqual(
    rectangles({ scaled: true, animationFrame: 8 }, { ...view, scale: 2, spriteScale: 1 }),
    [
      [1538, -32, -36, 64, 32],
      [1544, -32, -32, 64, 32],
      [1550, -32, -28, 64, 32],
    ]
  )
})

test('all phases and piece families retain unsigned object/clock staggering and independent owner colors', () => {
  const base = [
    1538, 1539, 1540, 1541, 1542, 1541, 1540, 1539, 1538, 1539, 1540, 1541, 1542, 1541, 1540, 1539,
  ]
  const lift = [0, 32, 64, 96, 128, 160, 192, 224, 256, 224, 192, 160, 128, 96, 64, 32]
  for (const id of [0, 1, 15, 16, 65535, 65536, -1])
    for (const clock of [...Array.from({ length: 32 }, (_, i) => i), 0xffffffff, 0x100000000])
      for (const owner of [0, 1, 2, 3]) {
        const phase = ((id & 0xffff) + (clock >>> 0)) & 15
        const actual = shieldRectangles(
          state({ unitIndex: id, animationFrame: clock, owner }),
          view
        )
        assert.deepEqual(
          actual.map(({ frame, y }) => [frame.source, y]),
          [0, 1, 2].map(piece => {
            const p = (phase + 16 - piece) % 16
            return [base[p] + 5 * piece, -Math.trunc((lift[p] * 31) / 256) - 4]
          })
        )
        for (const piece of actual)
          assert.equal(
            piece.rgb.reduce((n, v) => n * 256 + v, 0),
            colors[owner]
          )
      }
  for (const extra of [
    { remaining: 0 },
    { remaining: -1 },
    { remaining: 120, counter: 2 },
    { frameHeight: 0 },
    { frameHeight: -1 },
    { owner: 4 },
  ])
    assert.deepEqual(rectangles(extra), [])
  assert.equal(rectangles({ remaining: 120, counter: 0 }).length, 3)
  assert.equal(rectangles({ remaining: 128, counter: 2 }).length, 3)
  assert.deepEqual(rectangles({ scaled: true }, { ...view, scale: 0 }), [])
  assert.deepEqual(rectangles({ scaled: true }, { ...view, scale: -view.scale }), [])
})

async function field(teams = ['blue']) {
  const world = api.createWorld(1)
  world.units = []
  world.selected = []
  world.buildings = []
  world.shrines = []
  world.trees = []
  for (let i = 0; i < teams.length; i++) {
    const unit = api.addUnit(world, teams[i], 'brave', { x: i * 4, z: 0 })
    pose(world, unit)
  }
  syncLivePersonCells(world)
  for (const unit of world.units) {
    assert.deepEqual(api.shieldFollowers(world, unit, unit.team), [unit])
  }
  return world
}
function pose(world, unit, source = 104) {
  unit.native = createLivePerson(world, unit)
  Object.assign(unit.native, {
    commandStatus: 3,
    object: source,
    draw: nativeUnitDraw(unit.kind),
    f2: 0,
  })
}
function pureRender(fixture) {
  const before = structuredClone(fixture.scene.world)
  fixture.render()
  assert.deepEqual(
    fixture.scene.world,
    before,
    'complete World and both RNG owners must remain unchanged'
  )
}
function capture(group) {
  return group.userData.shield.map(sprite => ({
    source: sprite.userData.source,
    visible: sprite.visible,
    scale: sprite.scale.toArray(),
    center: sprite.center.toArray(),
    uv: sprite.userData.atlasTransform.toArray(),
    color: sprite.material.color.getHex(THREE.SRGBColorSpace),
    opacity: sprite.material.opacity,
  }))
}
function checkActual(fixture, unit) {
  const { scene } = fixture,
    group = scene.unitMeshes.get(unit.id)
  const height = units.frames[group.userData.frame].nativeHeight
  const size = value =>
    scene.view.config.scaledSprites || unit.kind === 'shaman'
      ? spriteCoordinate(
          value,
          group.userData.spriteBucket,
          scene.view.config.scaledSprites ? 256 : 0,
          scene.view.config
        )
      : value
  assert.equal(
    group.userData.frameHeight,
    size(height),
    'use current VFRA header, not combined piece bounds'
  )
  const actual = capture(group)
  assert.equal(actual.length, 3)
  for (let j = 0; j < 3; j++) {
    const sprite = group.userData.shield[j],
      row = actual[j]
    assert.ok(sprite instanceof THREE.Sprite)
    assert.equal(row.color, colors[group.userData.owner])
    assert.equal(row.opacity, 1, 'source alpha, never an arbitrary opacity pulse')
    assert.equal(sprite.material.depthWrite, false)
    assert.equal(sprite.material.map.minFilter, THREE.NearestFilter)
    assert.equal(sprite.material.map.magFilter, THREE.NearestFilter)
    assert.equal(sprite.material.map.generateMipmaps, false)
    assert.deepEqual(sprite.position.toArray(), [0, 0, 0])
    assert.equal(sprite.material.rotation, 0)
    const frame = art.frames[row.source - 1538]
    assert.deepEqual(row.uv, [32 / 512, 1, frame.x / 512, 0])
    assert.deepEqual(row.scale, [size(32), size(16), 1])
    const phase = (unit.id + scene.gameClock.animationFrame - j) & 15
    const lift = phase <= 8 ? phase * 32 : (16 - phase) * 32
    const span = scene.view.config.scaledSprites ? size(16) : Math.trunc((size(height) * 28) / 32)
    const y = -Math.trunc((lift * span) / 256) - Math.trunc(size(height) / 8)
    assert.deepEqual(row.center, [Math.trunc(size(32) / 2) / size(32), 1 + y / size(16)])
    assert.ok(
      group.userData.layers.every(
        layer => group.children.indexOf(layer) < group.children.indexOf(sprite)
      )
    )
  }
  assert.deepEqual(
    group.children.slice(-3),
    group.userData.shield,
    'the painter sees piece0, piece1, piece2 after body'
  )
  return actual
}

test('actual caller draws all four owners, changing body poses/directions and view depth without simulation mutation', async () => {
  const world = await field(['blue', 'red', 'yellow', 'green'])
  for (const scaled of [false, true])
    for (const depth of [0, 2400]) {
      const fixture = await makeSelectionScene(structuredClone(world), { scaled, depth })
      try {
        for (const source of [0, 1, 104])
          for (const heading of [0, Math.PI / 2, Math.PI])
            for (const frame of [0, 1, 8, 15, 16]) {
              fixture.scene.cameraBearing = heading
              fixture.scene.gameClock.animationFrame = frame
              for (const unit of fixture.scene.world.units) {
                unit.native.object = source
                unit.native.f2 = 0
              }
              pureRender(fixture)
              for (const unit of fixture.scene.world.units) checkActual(fixture, unit)
            }
      } finally {
        fixture.close()
      }
    }
})

test('actual caller uses flight, fight, entry and builder person counters instead of stale native/world phase', async () => {
  for (const owner of ['native', 'flight', 'fight', 'entry', 'builder']) {
    const world = await field(),
      unit = world.units[0],
      active = structuredClone(unit.native)
    const fixture = await makeSelectionScene(world)
    try {
      unit.native.state = 10
      unit.native.commandStatus = 0
      if (owner === 'native') unit.native = active
      if (owner === 'flight') unit.flight = active
      if (owner === 'fight') unit.fight = { action: 'encounter', started: 0, motion: active }
      if (owner === 'entry') unit.entry = { person: active }
      if (owner === 'builder') unit.builder = { task: 2, phase: 4, person: active }
      assert.equal(unitRenderAnimationSource(unit), active)
      for (const [remaining, counter, globalTurn, visible] of [
        [120, 2, 0, false],
        [120, 0, 2, true],
        [128, 2, 2, true],
        [0, 0, 0, false],
      ]) {
        unit.shield = remaining
        unit.native.counter = counter ^ 2
        active.counter = counter
        world.turn = globalTurn
        pureRender(fixture)
        assert.equal(
          fixture.scene.unitMeshes.get(unit.id).userData.shield.some(sprite => sprite.visible),
          visible,
          owner
        )
      }
    } finally {
      fixture.close()
    }
  }
})

test('Spy displayed tribe updates Shield tint, with idempotent pause, hiding, rebuild and cleanup', async () => {
  const world = await field(),
    unit = world.units[0]
  unit.kind = 'spy'
  pose(world, unit)
  unit.native.disguise = 65
  const fixture = await makeSelectionScene(world)
  try {
    pureRender(fixture)
    const group = fixture.scene.unitMeshes.get(unit.id),
      sprites = group.userData.shield
    assert.equal(group.userData.owner, 1)
    assert.equal(capture(group)[0].color, colors[1])
    fixture.scene.gameClock.animationFrame = 2
    pureRender(fixture)
    assert.equal(group.userData.owner, 0)
    assert.equal(capture(group)[0].color, colors[0])
    const before = capture(group)
    world.paused = true
    const savedWorld = structuredClone(world),
      clock = { ...fixture.scene.gameClock }
    for (let i = 0; i < 8; i++) {
      api.advanceGame(world, fixture.scene.gameClock, 2)
      pureRender(fixture)
    }
    assert.deepEqual(world, savedWorld)
    assert.deepEqual(fixture.scene.gameClock, clock)
    assert.deepEqual(capture(group), before)
    assert.deepEqual(group.userData.shield, sprites)
    unit.native.vehicle = 1
    pureRender(fixture)
    assert.equal(group.visible, false)
    unit.native.vehicle = 0
    unit.inside = 999
    pureRender(fixture)
    assert.equal(group.visible, false)
    unit.inside = null
    pureRender(fixture)
    assert.equal(group.visible, true)
    let disposed = 0,
      atlasDisposed = 0
    sprites.forEach(sprite => sprite.material.addEventListener('dispose', () => disposed++))
    sprites[0].material.map.addEventListener('dispose', () => atlasDisposed++)
    unit.team = 'yellow'
    pose(world, unit)
    pureRender(fixture)
    assert.equal(disposed, 3)
    assert.equal(atlasDisposed, 0)
    const replacement = fixture.scene.unitMeshes.get(unit.id)
    assert.notEqual(replacement, group)
    assert.equal(capture(replacement)[0].color, colors[2])
    world.units = []
    pureRender(fixture)
    assert.equal(fixture.scene.unitMeshes.size, 0)
  } finally {
    fixture.close()
  }
})

test('actual CPU painter submits body then Shield pieces in one native bucket and culls hidden groups', async () => {
  const { RenderView } = await import('../app/render-view.ts')
  const world = await field(),
    unit = world.units[0],
    fixture = await makeSelectionScene(world)
  const view = new RenderView(),
    graph = new THREE.Scene()
  graph.userData.world = world
  graph.add(fixture.scene.objects)
  fixture.scene.view = view
  let transparentSort
  const renderer = {
    setTransparentSort: sort => {
      transparentSort = sort
    },
  }
  try {
    for (const angle of [0, 512, 1024, 1536]) {
      view.update(800, 600, unit, angle, 0, false)
      pureRender(fixture)
      graph.updateMatrixWorld(true)
      view.prepare(graph)
      const before = structuredClone(world)
      view.painter.update(graph, renderer)
      const group = fixture.scene.unitMeshes.get(unit.id)
      const body = group.userData.layers.filter(sprite => sprite.visible)
      const shield = group.userData.shield
      assert.ok(body.length)
      const commands = [...body, ...shield].map(sprite => view.painter.command(sprite, 0))
      assert.ok(commands.every(Boolean), 'real painter must submit each actual visible sprite')
      assert.equal(new Set(commands.map(command => command.bucket)).size, 1)
      for (let piece = 0; piece < shield.length; piece++) {
        const depth = view.painter.depth(shield[piece], 0, 0)
        for (const layer of body) assert.ok(view.painter.depth(layer, 0, 0) > depth)
        if (piece) {
          assert.ok(view.painter.depth(shield[piece - 1], 0, 0) > depth)
          const item = (object, id) => ({
            object,
            group: null,
            groupOrder: 0,
            renderOrder: 0,
            z: 0,
            id,
          })
          assert.ok(transparentSort(item(shield[piece - 1], 1), item(shield[piece], 2)) < 0)
        }
      }
      assert.deepEqual(world, before)
      view.painter.afterRender()
    }
    const group = fixture.scene.unitMeshes.get(unit.id)
    group.visible = false
    view.painter.update(graph, renderer)
    assert.equal(view.painter.commandsBySlot.length, 0)
    view.painter.afterRender()
  } finally {
    view.dispose()
    fixture.close()
  }
})

test('presentation clock follows elapsed schedules, expiry leaves gameplay and the existing Bloodlust mesh unchanged', async () => {
  const initial = await field(),
    results = []
  for (const schedule of [
    ...[30, 60, 120, 144].map(hz => [1 / hz]),
    [0.007, 0.013, 0.28, 0.6, 0.1],
  ]) {
    const world = structuredClone(initial),
      unit = world.units[0]
    world.speed = 0
    unit.bloodlust = 1440
    const fixture = await makeSelectionScene(world)
    try {
      let left = 1
      for (let i = 0; left > 1e-10; i++) {
        const dt = Math.min(left, schedule[i % schedule.length])
        api.advanceGame(world, fixture.scene.gameClock, dt)
        pureRender(fixture)
        left -= dt
      }
      const group = fixture.scene.unitMeshes.get(unit.id),
        bloodlust = group.userData.bloodlust
      assert.ok(bloodlust instanceof THREE.Mesh)
      assert.equal(bloodlust.geometry.type, 'TorusGeometry')
      assert.equal(bloodlust.material.color.getHex(), 0xff3d18)
      assert.equal(bloodlust.material.opacity, 0.8)
      assert.equal(bloodlust.rotation.z, world.time * 4)
      results.push([fixture.scene.gameClock.animationFrame, capture(group)])
      unit.shield = 1
      api.stepUnitShields(world)
      pureRender(fixture)
      assert.ok(group.userData.shield.every(sprite => !sprite.visible))
      assert.equal(unit.bloodlust, 1440)
      assert.equal(bloodlust.visible, true)
      assert.equal(bloodlust.rotation.z, world.time * 4)
      const restored = api.migrateCheckpoint(structuredClone(world))
      assert.equal(restored.units[0].shield, 0)
    } finally {
      fixture.close()
    }
  }
  for (const result of results) assert.deepEqual(result, results[0])
  assert.equal(results[0][0], 24)
})
