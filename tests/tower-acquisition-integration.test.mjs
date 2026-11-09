import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { createHash } from 'node:crypto'
import level from '../app/level-four.ts'
import models from '../app/original-models.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import towerArt from '../app/original-tower-acquisition.json' with { type: 'json' }
import { templeArt } from '../app/temple-art.ts'
import * as buildingAcquisition from '../app/building-acquisition.ts'
const { initializeBuildingAcquisition, visitBuildingAcquisition, buildingAcquisitionGeometry } = buildingAcquisition
import {
  createWorshipAcquisitionState,
  startBuildingAcquisition,
  startWorshipAcquisition,
  stepWorshipAcquisition,
} from '../app/worship-acquisition.ts'
import {
  createWorshipAcquisitionRuntime,
  startPendingWorshipAcquisitions,
  visitWorshipAcquisition,
} from '../app/worship-acquisition-runtime.ts'
import { collectBuildingAcquisitionTriangles } from '../app/building-acquisition-triangles.ts'
import {
  buildingDrawPoint,
  interpolateBuildingSubmissions,
  interpolateWorshipPoint,
} from '../app/worship-acquisition-layout.ts'
import { random } from '../app/native-math.ts'

const read = path => readFileSync(new URL(`../app/${path}`, import.meta.url), 'utf8')
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const plain = value => JSON.parse(JSON.stringify(value))
const geometry = {
  viewport: { x: 100, y: 0, width: 540, height: 480 },
  origin: { x: 420, y: 180 },
  target: { x: 71, y: 232 },
  targetRect: { x: 48, y: 206, width: 46, height: 52 },
  targetHud: { x: 71, y: 232 },
  hudScale: 1,
}

// Evaluate the real provenance function with the committed M4 level and supplied
// mission lookup. Other world services are not loaded by this source-only test.
function provenance(data = structuredClone(level)) {
  const source = read('building-acquisition-source.ts')
  const start = source.indexOf('const sources = ')
  assert.ok(start >= 0)
  return runInNewContext(
    `${stripTypeScriptTypes(source.slice(start).replaceAll('export ', ''))}\nbuildingAcquisitionSource`,
    { missionData: () => ({ level: data }) }
  )
}

function worldFixture() {
  const head = level.objects.find(object => object.index === 1)
  return {
    turn: 30,
    outcome: { level: 4 },
    shrines: [{ x: head.x, z: head.z, kind: 'vault', mode: 4, reward: 'tower' }],
    manaWorld: { playerTribe: 0 },
    gifts: [],
    effects: [],
    land: { landFlags: 0 },
    cosmeticRandom: { randomState: 1 },
    worshipAcquisition: createWorshipAcquisitionRuntime(),
  }
}

test('authored M4 source admits only its unique local Tower reward link', () => {
  const source = provenance(), world = worldFixture(), head = world.shrines[0]
  assert.deepEqual(plain(source(world, 'tower', head)), {
    mission: 4, head: 1, reward: 0, slot: 0, rewardClass: 2, model: 4,
  })
  assert.equal(source(world, 'tower', { ...head }), undefined)
  assert.equal(source(world, 'camp', head), undefined)
  for (const [key, value] of [['mode', 0], ['kind', 'head'], ['reward', 'camp'], ['rewardRecipient', 1], ['x', head.x + 1]]) {
    const previous = head[key]
    head[key] = value
    assert.equal(source(world, 'tower', head), undefined, key)
    head[key] = previous
  }
  world.outcome.level = 3
  assert.equal(source(world, 'tower', head), undefined)
  for (const edit of [
    data => { data.objects.find(object => object.index === 1).settings[6] = 2 },
    data => { data.objects.find(object => object.index === 1).settings[8] = 1 },
    data => { data.objects.find(object => object.index === 0).settings[1] = 7 },
    data => { data.objects = data.objects.filter(object => object.index !== 0) },
  ]) {
    const data = structuredClone(level), fresh = worldFixture()
    edit(data)
    assert.equal(provenance(data)(fresh, 'tower', fresh.shrines[0]), undefined)
  }
})

// Preserve the actual gift creation and scheduled gift block, while intercepting
// terrain/effect/notification leaves. This is not a whole-world or Save/Load run.
test('M4 creation, six gift visits and 82-visit grant retain independent UI ownership', () => {
  const world = worldFixture(), source = read('world-effects.ts')
  const start = source.indexOf('export function createGift(')
  const end = source.indexOf('\n// Creation/checkpoint migration', start)
  assert.ok(start >= 0 && end > start)
  const createGift = runInNewContext(
    `${stripTypeScriptTypes(source.slice(start, end).replace('export ', ''))}\ncreateGift`,
    {
      buildingAcquisitionSource: provenance(),
      effect: (_world, kind, point) => ({ id: 42, kind, ...point, age: 0 }),
      nativePosition: (_world, point) => point,
      terrainPointHeight: () => 0,
      initializeVaultKnowledgeGift: () => {},
    }
  )
  const gift = createGift(world, 'tower', world.shrines[0])
  assert.equal(gift.buildingAcquisition.model, 4)
  assert.equal(gift.buildingAcquisition.completedTurn, 30)
  assert.equal(gift.recipient, 0)
  assert.equal(gift.phase, 6)
  assert.equal(gift.remaining, 82)
  const turn = read('world-turn.ts')
  const from = turn.indexOf('  for (const gift of w.gifts) {')
  const to = turn.indexOf('\n  stepScenery(w)', from)
  assert.ok(from >= 0 && to > from)
  const effects = [], notices = []
  const visitGifts = runInNewContext(
    stripTypeScriptTypes(`(function (w) { ${turn.slice(from, to)} })`),
    { effect: (_w, kind) => effects.push(kind), tell: (_w, text) => notices.push(text) }
  )
  for (let visit = 1; visit <= 6; visit++) {
    visitGifts(world)
    assert.equal(gift.phase, 6 - visit)
    assert.equal(gift.remaining, 82 - visit)
    assert.deepEqual(world.worshipAcquisition.requests, visit === 6 ? [42] : [])
  }
  const cues = [], selected = []
  startPendingWorshipAcquisitions(world, {
    geometry: () => geometry, cue: cue => cues.push(cue), failed: () => assert.fail(),
  })
  assert.deepEqual(cues, [0xcc, 0xcb])
  assert.equal(world.worshipAcquisition.controllers.building.model, 79)
  for (let visit = 0; visit < 200; visit++)
    visitWorshipAcquisition(world, (...args) => selected.push(args))
  assert.deepEqual(selected, [[4, 'building']])
  assert.equal(gift.remaining, 76, 'the building UI never uses spell payout acceleration')
  for (let visit = 7; visit <= 82; visit++) {
    visitGifts(world)
    assert.equal(!!world.unlockedTower, visit === 82)
  }
  assert.equal(world.gifts.length, 0)
  assert.deepEqual(effects, ['birth'])
  assert.equal(notices.length, 1)
  assert.deepEqual(world.worshipAcquisition.requests, [])
})

// Finite original-data-derived controller counts, independently accepted in
// #23 issuecomment-6728055918. Supplied target, no native/GPU timing claim.
for (const [pause, expected] of [['none', 117], ['initial', 121], ['whole', 120], ['flight', 119], ['pending', 120]]) {
  test(`Tower controller retains the original-derived ${pause} pause result`, () => {
    const rng = { randomState: 1 }
    let draws = 0
    const controller = initializeBuildingAcquisition(42, geometry, () => { draws++; return random(rng) }, 79)
    assert.equal(controller.faces.length, 76)
    assert.equal(draws, 304)
    let left = pause === 'initial' ? 3 : 0, used = pause === 'initial', first = 0, all = 0
    const pulses = [], selected = []
    for (let visit = 1; visit <= expected; visit++) {
      if (!used && ((pause === 'whole' && controller.phase === 3 && controller.visits === 2) ||
        (pause === 'flight' && controller.faces.some(face => face.flags & 1)) ||
        (pause === 'pending' && controller.phase === 1 && controller.pending))) {
        used = true; left = 3
      }
      const result = visitBuildingAcquisition(controller, left-- > 0)
      if (result.selected?.length) { first ||= visit; selected.push(...result.selected) }
      if (controller.allStarted) all ||= visit
      if (result.pulse) pulses.push([visit, result.pulse])
      assert.equal(controller.active, visit !== expected)
    }
    assert.equal(new Set(selected).size, 76)
    assert.equal(draws, 304)
    if (pause === 'none') {
      assert.equal(first, 87)
      assert.equal(all, 106)
      assert.deepEqual(pulses.map(([visit]) => visit), [90, 116])
    }
  })
}

test('Tower shares companion and pulse owners while preserving Tornado and clone continuation', () => {
  const state = createWorshipAcquisitionState(), rng = { randomState: 1 }
  startBuildingAcquisition(state, { giftId: 1, geometry, model: 7 }, () => random(rng))
  for (let visit = 0; visit < 95; visit++) stepWorshipAcquisition(state, { paused: false, random: () => random(rng) })
  const pulse = state.pulse
  startWorshipAcquisition(state, { giftId: 2, model: 4, geometry })
  const spell = state.spell, companion = state.companion
  startBuildingAcquisition(state, { giftId: 3, model: 4, geometry }, () => random(rng))
  assert.equal(state.building.model, 79)
  assert.equal(state.spell, spell)
  assert.equal(state.pulse, pulse)
  assert.notEqual(state.companion, companion)
  assert.equal(state.companion.model, 4)
  assert.equal(state.companion.family, 'building')
  const restored = structuredClone({ state, rng })
  for (let visit = 0; visit < 200; visit++) {
    const paused = visit < 3 || visit === 95
    const a = stepWorshipAcquisition(state, { paused, random: () => random(rng) })
    const b = stepWorshipAcquisition(restored.state, { paused, random: () => random(restored.rng) })
    assert.deepEqual(a, b)
    assert.deepEqual({ state, rng }, restored)
    for (const command of state.drawCommands.filter(command => command.kind === 'building')) {
      assert.equal(command.model, 4)
      assert.equal(command.geometryModel, 79)
    }
  }
})

test('all Tower faces retain modes, capacity and both original tribe-remap tile groups', () => {
  const submissions = models[79].modes.map((_, face) => {
    const count = models[79].faces[face * 2]
    return { face, flight: 0, transformed: [[0,0,0],[100,0,0],[100,100,0],[0,100,0]].slice(0, count),
      projected: [[10,10],[110,10],[110,110],[10,110]].slice(0, count) }
  })
  const collect = tribe => collectBuildingAcquisitionTriangles({ whole: false, submissions }, { width: 640, height: 480, model: 79, tribe })
  const base = collect(0), before = hash(submissions)
  assert.equal(base.length, 125)
  assert.deepEqual([...new Set(base.map(triangle => triangle.mode))].sort(), [6, 7])
  const remapped = [...new Set(base.filter(triangle => rules.textureFlags[models[79].tiles[triangle.face]] & 1).map(triangle => models[79].tiles[triangle.face]))].sort()
  assert.deepEqual(remapped, [186, 226])
  for (const tribe of [1, 2, 3]) {
    const result = collect(tribe)
    assert.equal(result.length, base.length)
    for (let i = 0; i < result.length; i++) {
      const offset = rules.textureFlags[models[79].tiles[base[i].face]] & 1 ? tribe / 8 : 0
      assert.deepEqual(result[i], { ...base[i], points: base[i].points.map(point => ({ ...point, u: point.u + offset })) })
    }
  }
  assert.equal(hash(submissions), before)
})

test('actual Scene draw selects Tower atlas and local tribe without advancing the controller', () => {
  const source = read('scene-worship-acquisition.ts')
  const start = source.indexOf('export class WorshipAcquisitionPresentation')
  assert.ok(start >= 0)
  const calls = [], canvas = {
    setAttribute() {}, dataset: {}, width: 640, height: 480,
    getContext: () => ({ setTransform() {}, clearRect() {}, drawImage() {} }),
  }
  const state = createWorshipAcquisitionState(), rng = { randomState: 1 }
  startBuildingAcquisition(state, { giftId: 3, model: 4, geometry }, () => random(rng))
  stepWorshipAcquisition(state, { paused: false, random: () => random(rng) })
  state.drawCommands = state.drawCommands.filter(command => command.kind === 'building')
  assert.equal(state.drawCommands.length, 1)
  const before = hash({ state, rng })
  const Presentation = runInNewContext(
    `${stripTypeScriptTypes(source.slice(start).replace('export class ', 'class '))}\nWorshipAcquisitionPresentation`,
    {
      document: { createElement: () => canvas }, devicePixelRatio: 1,
      getWorshipAcquisitionDrawCommands: state => state.drawCommands,
      towerArt, templeArt, buildingAcquisitionGeometry,
      buildingDrawPoint, interpolateBuildingSubmissions, interpolateWorshipPoint,
      texture: name => { calls.push(['atlas', name]); return { image: { complete: true, naturalWidth: 256 } } },
      collectBuildingAcquisitionTriangles: (command, options) => { calls.push(['collect', options.model, options.tribe]); return collectBuildingAcquisitionTriangles(command, options) },
      BuildingAcquisitionTriangleSurface: class { setAtlas() {} draw() { return canvas } },
    }
  )
  const world = { paused: false, land: { landFlags: 0 }, manaWorld: { playerTribe: 2 },
    worshipAcquisition: { ...createWorshipAcquisitionRuntime(), controllers: state } }
  const presentation = new Presentation({ world, templeResourceSnapshot: null,
    container: { parentElement: { appendChild() {}, clientWidth: 640, clientHeight: 480 } } },
  { measure: () => geometry })
  presentation.draw()
  assert.deepEqual(calls, [['atlas', 'tower-model-d'], ['collect', 79, 2]])
  assert.equal(hash({ state, rng }), before)
})

test('actual loader applies ordinary model material policy to the dedicated Tower atlas', async () => {
  const source = read('scene-assets.ts'), from = source.indexOf('type TextureAsset ='), to = source.indexOf('\nexport function effectFrame(', from)
  assert.ok(from >= 0 && to > from)
  const pending = []
  const THREE = { NoColorSpace: 'none', SRGBColorSpace: 'srgb', LinearFilter: 'linear', RepeatWrapping: 'repeat',
    TextureLoader: class { load(url, done) { const texture = { userData: {} }; pending.push({ url, done }); return texture } } }
  const load = runInNewContext(`${stripTypeScriptTypes(source.slice(from, to).replaceAll('export ', ''))}\nloadTexture`,
    { THREE, templeArt, towerArt, nativeUnits: { atlas: 'people' } })
  const asset = load('tower-model-d')
  assert.equal(pending[0].url, '/original/tower-model-d.png')
  assert.equal(asset.texture.colorSpace, 'none')
  assert.equal(asset.texture.userData.encodedColors, true)
  assert.equal(asset.texture.minFilter, 'linear')
  assert.equal(asset.texture.magFilter, 'linear')
  assert.equal(asset.texture.generateMipmaps, false)
  assert.equal(asset.texture.anisotropy, 1)
  assert.equal(load('tower-model-d'), asset)
  pending[0].done()
  assert.equal(await asset.ready, true)
})

test('actual M4 preload requires the Tower atlas and propagates its failure', async () => {
  const source = read('scene.ts'), from = source.indexOf('    const atlasAsset = '), to = source.indexOf('\n    this.cursor = ', from)
  assert.ok(from >= 0 && to > from)
  for (const mission of [1, 3, 4]) for (const fail of [false, true]) {
    const requested = [], uploaded = []
    const asset = name => { requested.push(name); return { ready: Promise.resolve(!(fail && name === 'tower-model-d')), texture: name } }
    const scene = { environment: { landscape: { modelAtlas: 'atlas' } }, terrainLoad: { signal: { aborted: false } }, renderer: { initTexture: name => uploaded.push(name) } }
    const preloads = runInNewContext(stripTypeScriptTypes(`(function () { ${source.slice(from, to)}; return preload }).call(scene)`),
      { scene, world: { outcome: { level: mission } }, templeArt, towerArt, nativeUnits: { atlas: 'people' }, vaultKnowledgeAtlas: () => null,
        retryFailedTexture: asset, loadTexture: asset })
    assert.equal(requested.includes('tower-model-d'), mission === 4)
    if (mission === 4 && fail) await assert.rejects(Promise.all(preloads), /Required scene texture failed to load: tower-model-d/)
    else { await Promise.all(preloads); assert.equal(uploaded.includes('tower-model-d'), mission === 4) }
  }
})
