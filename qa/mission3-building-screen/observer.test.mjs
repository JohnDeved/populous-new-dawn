// Supplied callback/DOM/GL fixtures adapted from PR274. No browser or GPU evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { installMission3BuildingScreenWitness } from '../../scripts/local-render/mission3-building-screen-witness.mjs'
import { templeArt, templeSpriteMaterial, templeTileOffset } from '../../app/temple-art.ts'
import { createSharedAniblResource } from '../../app/shared-anibl.ts'
import { createGameStore } from '../../app/game-store.ts'
import { tick } from '../../app/model.ts'
import {
  startPendingWorshipAcquisitions,
  visitWorshipAcquisition,
} from '../../app/worship-acquisition-runtime.ts'
import { requireScreenProof } from '../../scripts/local-render/mission3-building-screen.mjs'

function fixture(
  t,
  {
    pixels = true,
    mutateDraw = false,
    initialBirth = null,
    skipGpu = false,
    skipHandoff = false,
    lazySurface = false,
    missedResume = false,
    wrongAtlas = false,
    wrongWorldEpoch = false,
    throwDraw = false,
  } = {}
) {
  const rect = { x: 3, y: 260, width: 46, height: 52 },
    geometry = {
      viewport: { x: 200, y: 0, width: 440, height: 480 },
      origin: { x: 350, y: 180 },
      target: { x: 26, y: 286 },
      targetRect: rect,
      targetHud: { x: 26, y: 286 },
      hudScale: 1,
    }
  const world = {
    turn: 10,
    speed: 1,
    paused: false,
    mode: 'blast',
    unlockedTemple: false,
    outcome: { level: 3 },
    units: [{ id: 30, hp: 100, kind: 'shaman', team: 'blue' }],
    manaWorld: { playerTribe: 0 },
    land: { landFlags: 0 },
    buildings: [],
    shrines: [{ id: 2, kind: 'vault', mode: 4, reward: 'temple', x: -37, z: -133, active: true }],
    gifts: [],
    cosmeticRandom: { randomState: 1 },
    worshipAcquisition: {
      controllers: { building: null, spell: null, companion: null, pulse: null, drawCommands: [] },
      previousDrawCommands: [],
      requests: [],
      clock: { elapsed: 0, nextVisit: 0, lastVisit: 0, limiter: 0, normalRate: 40 },
    },
  }
  let buildingsSelected = false,
    uiWhole = true,
    uiFlight = 0
  const card = {
    get disabled() {
      return !world.unlockedTemple
    },
    getBoundingClientRect: () => rect,
  }
  const root = {
    clientWidth: 640,
    clientHeight: 480,
    getBoundingClientRect: () => ({ x: 0, y: 0 }),
    querySelector(selector) {
      if (selector.includes('buildings B')) return { getAttribute: () => String(buildingsSelected) }
      if (selector.includes('Temple')) return buildingsSelected ? card : null
      if (selector === '.native-hud')
        return { offsetWidth: 200, getBoundingClientRect: () => ({ width: 200 }) }
      throw new Error(selector)
    },
  }
  const canvas = {
    width: 8,
    height: 8,
    hidden: false,
    toDataURL: () => 'data:image/png;base64,AAAA',
  }
  const gl = {
    RGBA: 1,
    UNSIGNED_BYTE: 2,
    readPixels(_x, _y, _w, _h, _format, _type, bytes) {
      if (pixels) for (let i = 3; i < bytes.length; i += 4) bytes[i] = 255
    },
  }
  const token = {},
    calls = [],
    resource = createSharedAniblResource()
  resource.transition({ bank: 'p', modelAtlas: 'atlas-p' })
  const mainCanvas = {}
  const scene = {
    world,
    scene: {},
    objects: {},
    buildingMeshes: new Map(),
    templeResourceSnapshot: resource.snapshot(),
    renderer: {
      domElement: mainCanvas,
      info: { render: { frame: 0 } },
      render() {
        this.info.render.frame++
        return 15
      },
    },
    container: { parentElement: root, getBoundingClientRect: () => geometry.viewport },
    fxMeshes: new Map(),
    gameClock: { animationFrame: 1 },
    worshipPresentation: null,
  }
  const start = () => {
    buildingsSelected = true
    world.worshipAcquisition.controllers.building = {
      active: true,
      phase: 1,
      visits: 0,
      pending: false,
      model: 95,
      family: 'building',
      giftId: 54,
      geometry,
      x: 350,
      y: 180,
      scale: 8,
      yaw: 0,
      tilt: 1536,
      faces: [{ flags: 0, threshold: 0, angles: [0, 0, 0], heading: 0, countdown: 0 }],
      allStarted: false,
    }
  }
  const originalBefore = function (value) {
    assert.equal(this, scene.gameClock)
    assert.equal(value, token)
    calls.push('before')
    return 11
  }
  const originalAfter = function (value) {
    assert.equal(this, scene.gameClock)
    assert.equal(value, token)
    calls.push('after')
    if (
      !skipHandoff &&
      world.gifts[0]?.phase === 0 &&
      !world.worshipAcquisition.controllers.building
    )
      start()
    return 12
  }
  scene.gameClock.beforeTurn = originalBefore
  scene.gameClock.afterTurn = originalAfter
  const image = {
      src: `/original/${wrongAtlas ? 'atlas' : 'temple-model-p'}.png`,
      width: 256,
      height: 1024,
    },
    source = { data: image }
  const atlas = { image, source, colorSpace: '', minFilter: 1006, magFilter: 1006 }
  const surface = {
    atlas,
    atlasSource: { source },
    material: { uniforms: { atlas: { value: atlas } } },
    uv: { array: new Float32Array(6) },
    geometry: { drawRange: { count: 3 } },
    renderer: { domElement: canvas, getContext: () => gl, info: { render: { frame: 0 } } },
  }
  scene.worshipPresentation = {
    canvas,
    anchors: new Map([[54, { point: geometry.origin, viewport: geometry.viewport, valid: true }]]),
    buildingSurface: lazySurface ? undefined : surface,
    sprites: new Map(),
    bridge: { measure: () => geometry },
    sprite(command) {
      const material = templeSpriteMaterial(
        3,
        command.frame,
        command.palette,
        scene.templeResourceSnapshot
      )
      const key = `${material.atlas}:${command.frame}:${material.rgb}`
      if (!this.sprites.has(key))
        this.sprites.set(key, { width: material.crop.w, height: material.crop.h })
      return this.sprites.get(key)
    },
    visit(value) {
      assert.equal(this, presentation)
      assert.equal(value, token)
      calls.push('ui')
      const b = world.worshipAcquisition.controllers.building
      if (b) {
        b.visits++
        b.phase = uiWhole ? 3 : 4
        world.worshipAcquisition.controllers.drawCommands = [
          {
            kind: 'building',
            family: 'building',
            giftId: 54,
            model: 5,
            geometryModel: 95,
            geometry,
            whole: uiWhole,
            anchor: { x: b.x, y: b.y },
            selected: [],
            submissions: [
              { face: 0, transformed: [[0, 0, 0]], projected: [[0, 0]], flight: uiFlight },
            ],
          },
        ]
      }
      return 13
    },
    draw(value) {
      assert.equal(this, presentation)
      assert.equal(value, token)
      calls.push('draw')
      if (throwDraw) throw null
      if (scene.fxMeshes.has(54)) scene.fxMeshes.get(54).visible = !!world.gifts[0]?.phase
      if (
        !skipGpu &&
        world.worshipAcquisition.controllers.drawCommands.some(
          command => command.kind === 'building'
        )
      ) {
        this.buildingSurface ??= surface
        this.buildingSurface.renderer.info.render.frame++
      }
      const resource = scene.templeResourceSnapshot
      surface.uv.array.set(
        Array.from({ length: 3 }, () => [
          ((resource.tile & 7) * 32 + 0.5) / 256,
          1 - ((resource.tile >> 3) * 32 + 0.5) / 1024,
        ]).flat()
      )
      if (world.worshipAcquisition.controllers.drawCommands.length)
        this.sprite({
          kind: 'sprite',
          family: 'building',
          giftId: 54,
          owner: 'companion',
          frame: templeArt.frames[0].source,
          palette: templeArt.tints[0].selector,
          rgb: 0,
        })
      if (mutateDraw) world.cosmeticRandom.randomState++
      return 14
    },
  }
  const presentation = scene.worshipPresentation
  const originalClock = scene.gameClock,
    originalUi = presentation.visit,
    originalDraw = presentation.draw,
    originalSprite = presentation.sprite,
    originalRender = scene.renderer.render
  globalThis.window = {
    testSceneRef: { current: scene },
    testStore: { getWorld: () => world, getPresentationSnapshot: resource.snapshot },
  }
  const birth = () => {
    world.shrines[0].active = false
    world.gifts.push({
      id: 54,
      reward: 'temple',
      recipient: 0,
      phase: 6,
      remaining: 82,
      buildingAcquisition: {
        mission: 3,
        head: 91,
        reward: 92,
        slot: 0,
        rewardClass: 2,
        model: 5,
        geometryModel: 95,
      },
    })
    scene.fxMeshes.set(54, { visible: true })
  }
  const turn = action => {
    assert.equal(scene.gameClock.beforeTurn(token), 11)
    world.turn++
    action()
    assert.equal(scene.gameClock.afterTurn(token), 12)
  }
  const giftVisit = () =>
    turn(() => {
      const gift = world.gifts[0]
      if (gift.phase) gift.phase--
      if (!--gift.remaining) {
        world.gifts = []
        world.unlockedTemple = true
      }
    })
  if (initialBirth) {
    birth()
    world.turn = initialBirth.turn + 6
    world.gifts[0].phase = 0
    world.gifts[0].remaining = 76
    start()
  }
  if (missedResume) {
    world.gifts = []
    world.unlockedTemple = true
    world.worshipAcquisition.controllers.building.active = false
  }
  installMission3BuildingScreenWitness({
    shamanId: 30,
    birth: initialBirth,
    templeArt,
    templeSpriteMaterial,
    templeTileOffset,
    mapDraw(_command, _current, _width, _height, _previous, _fraction, resource) {
      return [
        {
          mode: 32,
          points: Array.from({ length: 3 }, () => ({
            u: ((resource.tile & 7) * 32 + 0.5) / 256,
            v: 1 - ((resource.tile >> 3) * 32 + 0.5) / 1024,
          })),
        },
      ]
    },
  })
  const api = window.m3BuildingScreen
  t.after(() => {
    if (globalThis.window?.m3BuildingScreen === api) api.close()
    delete globalThis.window
  })
  const close = () => {
    const result = api.close()
    assert.equal(originalClock.beforeTurn, originalBefore)
    assert.equal(originalClock.afterTurn, originalAfter)
    assert.equal(presentation.visit, originalUi)
    assert.equal(presentation.draw, originalDraw)
    assert.equal(presentation.sprite, originalSprite)
    assert.equal(scene.renderer.render, originalRender)
    return result
  }
  return {
    world,
    scene,
    api,
    turn,
    birth,
    giftVisit,
    close,
    calls,
    ui(whole, flight = 0) {
      resource.advance()
      uiWhole = whole
      uiFlight = flight
      assert.equal(presentation.visit(token), 13)
    },
    draw() {
      scene.templeResourceSnapshot = resource.snapshot()
      assert.equal(presentation.draw(token), 14)
    },
    worldDraw() {
      resource.advance()
      scene.templeResourceSnapshot = resource.snapshot()
      world.buildings = [
        {
          id: 1021,
          team: 'blue',
          kind: 'temple',
          object: 95,
          hp: 260,
          progress: 1,
          logs: 8,
          x: 25,
          z: 69,
        },
      ]
      const [x, y] = templeTileOffset(resource.snapshot().tile)
      scene.buildingMeshes.set(1021, {
        visible: true,
        parent: scene.objects,
        children: [
          {
            userData: {
              nativeModel: 95,
              stage: 4,
              templeResourceEpoch: resource.snapshot().epoch + Number(wrongWorldEpoch),
              templeTileOffset: { value: { x, y } },
            },
            material: { map: { ...atlas, image: { ...image, src: '/original/atlas-p.png' } } },
          },
        ],
      })
      assert.equal(scene.renderer.render(scene.scene), 15)
    },
  }
}

test('M3 synchronous6/82, latched natural frames, p sprites and completed world bank compose', t => {
  const f = fixture(t)
  f.turn(f.birth)
  for (let i = 0; i < 6; i++) f.giftVisit()
  f.ui(true)
  f.draw()
  // Multiple logical visits can precede one rendered frame. Controller phase
  // is later state; renderer-facing commands stay independently latched.
  f.ui(false, 0.2)
  f.ui(false, 0.4)
  f.world.worshipAcquisition.controllers.building.phase = 5
  f.draw()
  for (let i = 6; i < 82; i++) f.giftVisit()
  f.world.worshipAcquisition.controllers.building.active = false
  f.draw()
  f.worldDraw()
  f.worldDraw()
  const evidence = f.close()
  assert.deepEqual(evidence.errors, [])
  assert.equal(evidence.restored, true)
  assert.equal(evidence.stages.hide.turn - evidence.birth.turn, 6)
  assert.equal(evidence.stages.grant.after.turn - evidence.birth.turn, 82)
  assert.equal(evidence.stages.beforeGrant.gift.remaining, 1)
  assert.equal(evidence.handoffs, 1)
  assert.equal(evidence.grants, 1)
  assert.equal(evidence.frames.whole.command.geometryModel, 95)
  assert.equal(evidence.frames.flight.command.whole, false)
  assert.equal(evidence.frames.flight.state.acquisition.controllers.building.phase, 5)
  assert.equal(evidence.frames.whole.opaquePixels, 64)
  assert.equal(evidence.frames.whole.material.src, '/original/temple-model-p.png')
  assert.ok(evidence.materialSamples[0].key.startsWith('temple-sparkles-p:'))
  assert.equal(evidence.materialSamples[0].commandRgb, 0)
  assert.equal(
    evidence.materialSamples[0].resolvedRgb,
    templeSpriteMaterial(
      3,
      templeArt.frames[0].source,
      templeArt.tints[0].selector,
      f.scene.templeResourceSnapshot
    ).rgb
  )
  assert.equal(evidence.worldTemple.id, 1021)
  assert.equal(evidence.worldTempleSamples.length, 2)
  assert.notEqual(
    evidence.worldTempleSamples[0].resource.tile,
    evidence.worldTempleSamples[1].resource.tile
  )
})

test('skipped GPU submission cannot become a natural whole-frame success', t => {
  const f = fixture(t, { skipGpu: true })
  f.turn(f.birth)
  for (let i = 0; i < 6; i++) f.giftVisit()
  f.ui(true)
  f.draw()
  const evidence = f.close()
  assert.deepEqual(evidence.errors, [])
  assert.equal(evidence.frames.whole, undefined)
  assert.equal(evidence.skippedGpuDraws, 1)
})

test('wrong p atlas retains the first actual PNG before rejecting material ownership', t => {
  const f = fixture(t, { wrongAtlas: true })
  f.turn(f.birth)
  for (let i = 0; i < 6; i++) f.giftVisit()
  f.ui(true)
  f.draw()
  const evidence = f.close()
  assert.equal(evidence.frames.handoff.buildingPng, 'data:image/png;base64,AAAA')
  assert.ok(evidence.errors.some(error => error.includes('not the p atlas')))
})

test('world material rejects a different epoch without manufacturing a render success', t => {
  const f = fixture(t, { wrongWorldEpoch: true })
  f.worldDraw()
  const evidence = f.close()
  assert.equal(evidence.worldTemple, undefined)
  assert.ok(evidence.errors.some(error => error.includes('same latched p tile/epoch')))
})

test('drawing cannot advance World-owned cosmetic state', t => {
  const f = fixture(t, { mutateDraw: true })
  f.turn(f.birth)
  for (let i = 0; i < 6; i++) f.giftVisit()
  f.ui(true)
  f.draw()
  assert.ok(f.close().errors.some(error => error.includes('RAF draw mutated')))
})

test('cleanup preserves a foreign replacement and reports failed ownership', t => {
  const f = fixture(t),
    foreign = () => null
  f.scene.worshipPresentation.sprite = foreign
  const evidence = f.api.close()
  assert.equal(evidence.restored, false)
  assert.equal(f.scene.worshipPresentation.sprite, foreign)
  assert.ok(evidence.errors.some(error => error.includes('Observer ownership changed: sprite')))
})

test('passive wrappers preserve an original primitive throw and still restore their owners', t => {
  const f = fixture(t, { throwDraw: true })
  let threw = false
  try {
    f.draw()
  } catch (failure) {
    threw = true
    assert.equal(failure, null)
  }
  assert.equal(threw, true)
  const evidence = f.close()
  assert.equal(evidence.restored, true)
  assert.deepEqual(evidence.errors, ['null'])
})

test('active in-session Save restores exact UI state on Load but resets only the transient bank; normal Restart retains bank', async () => {
  // Supplied completion and HUD geometry, using actual product store/caller APIs.
  // No browser, committed IndexedDB, trusted click or ordinary-route claim.
  const store = createGameStore()
  store.startMission(3)
  const world = store.getWorld(),
    binding = store.bindPresentation(world)
  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  vault.forced = true
  vault.reset = false
  tick(world, 1 / 12)
  for (let i = 0; i < 6; i++) tick(world, 1 / 12)
  startPendingWorshipAcquisitions(world, {
    cue() {},
    failed() {
      assert.fail('Supplied HUD geometry')
    },
    geometry: () => ({
      viewport: { x: 100, y: 0, width: 540, height: 480 },
      origin: { x: 420, y: 180 },
      target: { x: 25, y: 230 },
      targetRect: { x: 2, y: 204, width: 46, height: 52 },
      targetHud: { x: 25, y: 230 },
      hudScale: 1,
    }),
  })
  visitWorshipAcquisition(world)
  binding.advance()
  binding.advance()
  assert.equal(world.worshipAcquisition.controllers.building.active, true)
  const savedUi = structuredClone(world.worshipAcquisition),
    savedBank = store.getPresentationSnapshot()
  const savedRandom = structuredClone(world.cosmeticRandom)
  await store.saveCheckpoint()
  assert.equal(store.getPresentationSnapshot(), savedBank)
  binding.advance()
  visitWorshipAcquisition(world)
  let replacement
  const unsubscribe = store.subscribe(() => {
    const next = store.getWorld()
    if (next !== world)
      replacement = {
        world: next,
        resource: store.getPresentationSnapshot(),
        ui: structuredClone(next.worshipAcquisition),
      }
  })
  assert.equal(store.loadCheckpoint(), true)
  unsubscribe()
  assert.deepEqual(replacement.ui, savedUi)
  assert.deepEqual(replacement.world.cosmeticRandom, savedRandom)
  assert.equal(replacement.resource.counter, 0)
  assert.equal(replacement.resource.tile, 92)
  assert.ok(replacement.resource.epoch > savedBank.epoch)
  assert.equal(binding.isCurrent(), false)
  const loadedBinding = store.bindPresentation(replacement.world)
  loadedBinding.advance()
  loadedBinding.advance()
  const retained = store.getPresentationSnapshot()
  assert.equal(replacement.world.land.landFlags & 8, 0)
  store.restart()
  assert.equal(store.getPresentationSnapshot(), retained)
  assert.equal(loadedBinding.isCurrent(), false)
  assert.equal(store.getWorld().turn, 0)
  for (const family of ['building', 'companion', 'pulse'])
    assert.equal(store.getWorld().worshipAcquisition.controllers[family], null)
})

test('proposed controls and Load/Restart resource owners match the current product callers', () => {
  const read = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
  const page = read('app/page.tsx'),
    store = read('app/game-store.ts'),
    scene = read('app/scene.ts')
  for (const label of [
    'Game settings',
    'Save checkpoint',
    'Load checkpoint',
    'Restart world',
    'Pause game',
    'Resume game',
  ])
    assert.ok(page.includes(label), label)
  assert.ok(page.includes('Temple'))
  assert.ok(store.includes('getPresentationSnapshot: presentation.snapshot'))
  assert.ok(store.includes('replaceWorld(migrateCheckpoint(structuredClone(checkpoint)))'))
  assert.ok(store.includes('world.outcome.level === 3 && !(world.land.landFlags & 8)'))
  assert.ok(
    scene.includes('this.templeResourceSnapshot = this.presentationBinding?.snapshot() ?? null')
  )
})

test('final proof requires clean restored evidence, evaluated dynamic UVs and both actual p sprite owners', t => {
  const f = fixture(t)
  f.turn(f.birth)
  for (let i = 0; i < 6; i++) f.giftVisit()
  f.ui(true)
  f.draw()
  f.ui(false, 0.2)
  f.draw()
  f.scene.worshipPresentation.sprite({
    family: 'building',
    giftId: 54,
    owner: 'pulse',
    frame: templeArt.frames[0].source,
    palette: 0,
    rgb: 0,
  })
  for (let i = 6; i < 82; i++) f.giftVisit()
  f.world.worshipAcquisition.controllers.building.active = false
  f.draw()
  f.worldDraw()
  f.worldDraw()
  const fresh = f.close()
  for (const frame of Object.values(fresh.frames)) {
    // Supplied artifact metadata exercises only the pure final predicate.
    frame.overlayFile = { sha256: 'a'.repeat(64) }
    frame.buildingFile = { sha256: 'b'.repeat(64) }
  }
  const final = structuredClone(fresh)
  final.handoffs = 0
  const epochs = { fresh, final }
  requireScreenProof(epochs, 1021)
  const dirty = structuredClone(epochs)
  dirty.fresh.errors.push('Retained failed partial')
  assert.throws(() => requireScreenProof(dirty, 1021), /Partial frame presence/)
  const unrestored = structuredClone(epochs)
  unrestored.final.restored = false
  assert.throws(() => requireScreenProof(unrestored, 1021))
  const wrongUv = structuredClone(epochs)
  for (const epoch of Object.values(wrongUv)) epoch.frames.sharedTile.material.tiles = [92]
  assert.throws(() => requireScreenProof(wrongUv, 1021), /non-base shared tile/)
  const missingPulse = structuredClone(epochs)
  for (const epoch of Object.values(missingPulse)) delete epoch.materialOwners.pulse
  assert.throws(() => requireScreenProof(missingPulse, 1021), /pulse/)
})
