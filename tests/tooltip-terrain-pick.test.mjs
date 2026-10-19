import assert from 'node:assert/strict'
import test from 'node:test'
import { tooltipCallerFixture } from './support/tooltip-scene.mjs'
import { createPointerFrameMetrics } from '../app/pointer-frame-metrics.ts'

test('drag shares ordinary terrain hits and misses with unchanged tooltip and selection input', async t => {
  const { scene, world, point, hut, api } = await tooltipCallerFixture(t)
  const { GameScene } = await import('../app/scene.ts')
  const { updatePointerFrame } = await import('../app/scene-input-runtime.ts')
  const { publishTooltipInput } = await import('../app/scene-tooltip-runtime.ts')
  const { dragEndpoint } = await import('../app/drag-selection.ts')
  const { positionDistance } = await import('../app/native-math.ts')
  const tree = world.trees.find(tree => tree.logs >= 1 && tree.model >= 1 && tree.model <= 6)
  const head = world.shrines.find(head => head.kind !== 'vault')
  const boat = { ...api.createWorld(5).vehicles[0], id: 1000000, active: true }
  world.vehicles.push(boat)
  assert.ok(tree && head)
  scene.updateDrag = GameScene.prototype.updateDrag.bind(scene)
  scene.pointerScreen = { ...point }
  scene.pointerButtons = 1
  scene.down = { unit: undefined }
  scene.selectionOverlay.update = () => {}
  const selected = [...world.selected]
  for (const [label, id] of [
    ['tree', tree.id], ['head', head.id], ['vehicle', boat.id],
    ['person', world.units[0].id], ['unknown', 2000000], ['ground', null], ['hut', hut.id],
  ]) {
    scene.picking.pick = () => id
    for (const ground of [hut, null]) {
      let calls = 0
      scene.pick = () => { calls++; return ground }
      const start = { x: 512, y: 0 }
      scene.drag = { start, end: start, active: true }
      scene.pointerState = ''
      const metrics = createPointerFrameMetrics()
      updatePointerFrame(scene, 100, metrics)
      const shared = structuredClone(scene.tooltipInput)
      assert.equal(calls, 1, `${label}: one ordinary terrain query, including a miss`)
      assert.equal(metrics.terrainPickCalls, 1, `${label}: metrics count actual queries`)
      const expectedEnd = ground ? dragEndpoint(start, api.nativePosition(world, ground), scene.view.angle) : start
      assert.deepEqual(scene.drag.end, expectedEnd)
      assert.equal(scene.dragActive.value, positionDistance(start, expectedEnd) > 0)
      assert.equal(scene.selectionOverlay.visible, scene.dragActive.value)
      assert.deepEqual(world.selected, selected)
      // Repeating the original standalone publication is the unshared oracle.
      publishTooltipInput(scene, true)
      assert.deepEqual(scene.tooltipInput, shared, `${label}: retain the complete sample, including cell`)
      assert.equal(calls, id === hut.id ? 1 : 2)
    }
  }
})

test('placement shares only ordinary terrain results and refreshes them on the next pointer change', async t => {
  const { scene, world, point, hut } = await tooltipCallerFixture(t)
  const { updatePointerFrame } = await import('../app/scene-input-runtime.ts')
  const { publishTooltipInput } = await import('../app/scene-tooltip-runtime.ts')
  const head = world.shrines.find(head => head.kind !== 'vault')
  scene.pointerScreen = { ...point }
  scene.picking.pick = () => head.id
  scene.picking.pickPerson = () => null
  for (const mode of ['hut', 'lightning', 'blast']) {
    world.mode = mode
    for (const ground of [hut, null]) {
      let calls = 0
      scene.pick = () => { calls++; return ground }
      scene.pointerScreen.clientX += 0.25
      const metrics = createPointerFrameMetrics()
      updatePointerFrame(scene, 100, metrics)
      assert.equal(calls, 1, `${mode}: ordinary terrain query is shared, including misses`)
      assert.equal(metrics.terrainPickCalls, 1)
      assert.strictEqual(scene.pointer, ground)
      const shared = structuredClone(scene.tooltipInput)
      updatePointerFrame(scene, 100, metrics)
      assert.equal(calls, 1, 'unchanged pointer state retains the published cell')
      assert.deepEqual(scene.tooltipInput, shared)
      publishTooltipInput(scene, true)
      assert.deepEqual(scene.tooltipInput, shared)
      assert.equal(calls, 2)
    }
  }
  world.mode = 'blast'
  const person = world.units.find(unit => unit.team === 'blue' && unit.hp > 0)
  scene.picking.pickPerson = () => person.id
  scene.world.manaWorld.gameFlags &= ~32
  let calls = 0
  scene.pick = () => { calls++; return hut }
  scene.pointerState = ''
  updatePointerFrame(scene, 100)
  assert.equal(calls, 1, 'a person-derived spell pointer does not stand in for terrain')
  assert.notStrictEqual(scene.pointer, hut)
  assert.ok(scene.tooltipInput.cell !== null)
})

test('shared cells retain live invalidation fallback, object names, and inspection rejection', async t => {
  const { scene, world, point, hut, api } = await tooltipCallerFixture(t)
  const { GameScene } = await import('../app/scene.ts')
  const { updatePointerFrame } = await import('../app/scene-input-runtime.ts')
  const { publishTooltipInput, updateTooltipController } = await import('../app/scene-tooltip-runtime.ts')
  const { createTooltip } = await import('../app/tooltips.ts')
  const { createTooltipController, createTooltipSession } = await import('../app/tooltip-controller.ts')
  const tree = world.trees.find(tree => tree.logs >= 1 && tree.model >= 1 && tree.model <= 6)
  const head = world.shrines.find(head => head.kind !== 'vault')
  const boat = { ...api.createWorld(5).vehicles[0], id: 1000000, active: true }
  const person = world.units[0]
  const personHp = person.hp
  world.vehicles.push(boat)
  const ground = api.browserPosition({ x: 512, y: 0 })
  world.land.flags[1] = 0
  scene.updateDrag = GameScene.prototype.updateDrag.bind(scene)
  scene.pointerScreen = { ...point }
  scene.pointerButtons = 1
  scene.down = { unit: undefined }
  scene.selectionOverlay.update = () => {}
  scene.pick = () => ground
  const selected = [...world.selected]
  const consume = sample => {
    scene.tooltipInput = sample
    scene.tooltip = createTooltip()
    scene.tooltipController = createTooltipController(scene.tooltip, createTooltipSession())
    for (let i = 0; i < 40; i++) updateTooltipController(scene, i * 1000 / 24)
    scene.renderTooltip()
    return structuredClone({
      tooltip: scene.tooltip,
      output: scene.tooltipController.output,
      visit: scene.tooltipController.lastVisit,
      hidden: scene.tooltipElement.hidden,
      selected: world.selected,
      records: [...scene.objectPanels.buildingRecords.keys()],
    })
  }
  for (const [label, object, invalidate, restore] of [
    ['tree', tree, () => { tree.logs = 0 }, () => { tree.logs = 1 }],
    ['head', head, () => { world.shrines = world.shrines.filter(entry => entry !== head) }, () => { world.shrines.push(head) }],
    ['vehicle', boat, () => { boat.active = false }, () => { boat.active = true }],
    ['person', person, () => { person.hp = 0 }, () => { person.hp = personHp }],
  ]) {
    scene.picking.pick = () => object.id
    const start = api.nativePosition(world, hut)
    scene.drag = { start, end: start, active: true }
    scene.pointerState = ''
    updatePointerFrame(scene, 100)
    const shared = structuredClone(scene.tooltipInput)
    publishTooltipInput(scene, true)
    const original = structuredClone(scene.tooltipInput)
    assert.deepEqual(original, shared)
    assert.equal(shared.cell, 2, `${label}: fallback is retained before consumption`)
    assert.equal(shared.inspectionTarget, null)
    const named = consume(shared)
    assert.equal(named.visit.route, label === 'person' ? 'cell' : 'object')
    assert.equal(named.tooltip.draw, label === 'person' ? 0 : 1)
    assert.equal(named.hidden, label === 'person')
    assert.deepEqual(consume(original), named, `${label}: same visible tooltip and inspection outcome`)
    invalidate()
    const invalidated = consume(shared)
    assert.equal(invalidated.visit.route, 'cell')
    assert.equal(invalidated.hidden, true)
    assert.deepEqual(consume(original), invalidated, `${label}: same fallback after live invalidation`)
    assert.deepEqual(world.selected, selected)
    restore()
  }
})

test('ordinary terrain sharing keeps the actual object picker native-edge occlusion query separate', async t => {
  const { scene, point, hut } = await tooltipCallerFixture(t)
  const THREE = await import('three')
  const { GameScene } = await import('../app/scene.ts')
  const { updatePointerFrame } = await import('../app/scene-input-runtime.ts')
  const edgeModes = []
  scene.view.pickCandidates = (_mouse, _objects, _camera, nativeEdges = false) => {
    edgeModes.push(nativeEdges)
    return []
  }
  scene.pick = GameScene.prototype.pick.bind(scene)
  scene.mouse = new THREE.Vector2()
  scene.updateDrag = GameScene.prototype.updateDrag.bind(scene)
  scene.pointerScreen = { ...point }
  scene.pointerButtons = 1
  scene.drag = { start: { x: 0, y: 0 }, end: { x: 0, y: 0 }, active: false }
  scene.down = { unit: undefined }
  scene.pointerState = ''
  scene.picking.lastKey = ''
  scene.picking.groundHits.clear()
  updatePointerFrame(scene, 100)
  assert.deepEqual(edgeModes, [false, true])
  assert.equal(scene.tooltipInput.picked, hut.id)
  assert.equal(scene.tooltipInput.object.id, hut.id)
})
