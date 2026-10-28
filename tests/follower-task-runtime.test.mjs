import test from 'node:test'
import assert from 'node:assert/strict'
import { addUnit, addBuilding, createWorld, nativePosition, tick, command, guardShaman } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { BuilderTask } from '../app/building-workers.ts'
import { hudTaskPeople, selectFollowerTask } from '../app/follower-tasks-runtime.ts'
import { followerTaskCounts } from '../app/hud-tasks.ts'
import { vehicleSeat } from '../app/vehicle-seats.ts'

function setup() {
  const world = createWorld(1)
  world.units = []; world.buildings = []; world.shrines = []; world.trees = []
  world.terrain.fill(3); world.terrainVersion++; world.manaWorld.gameFlags = 32
  const unit = addUnit(world, 'blue', 'brave', { x: 0, z: 8 })
  unit.native = createLivePerson(world, unit)
  unit.native.state = 19
  return { world, unit }
}
const category = (world, unit) => hudTaskPeople(world).find(p => p.id === unit.id).category

test('shipped G task classification follows deferred native adoption without mutating HUD reads', () => {
  const { world, unit } = setup()
  addUnit(world, 'blue', 'shaman', { x: 2, z: 8 })
  world.selected = [unit.id]
  guardShaman(world)
  assert.equal(unit.guard, false)
  assert.equal(category(world, unit), 2, 'queued G keeps its current native idle state until preparation')
  tick(world, 1 / 12)
  const before = structuredClone(world)
  assert.equal(category(world, unit), 4)
  assert.deepEqual(world, before)
  guardShaman(world)
  assert.equal(unit.guard, false)
  assert.equal(category(world, unit), 0, 'native replacement clears status until preparation')
  tick(world, 1 / 12)
  assert.equal(category(world, unit), 4, 'repeat G remains Busy after adoption')
})

test('specific legacy work overrides dormant idle while real native disruption remains authoritative', () => {
  const { world, unit } = setup()
  unit.tree = 123
  assert.equal(category(world, unit), 4)
  unit.tree = null; unit.delivery = { target: 321 }
  assert.equal(category(world, unit), 4)
  unit.native.state = 22
  assert.equal(category(world, unit), 0, 'native casting is not overwritten by retained delivery')
  unit.native.state = 19; unit.delivery = undefined; unit.cargo = 1
  assert.equal(category(world, unit), 2, 'carrying wood alone is not a task')
  const before = structuredClone(world)
  hudTaskPeople(world)
  assert.deepEqual(world, before)
})

test('construction, pre-entry, actual entry and native idle routes use their own categories', () => {
  const { world, unit } = setup()
  const hut = addBuilding(world, 'blue', 'hut', { x: 12, z: 8 }, true)
  unit.work = hut.id
  assert.equal(category(world, unit), 4, 'the command8 pre-entry journey is Busy')
  unit.builder = { task: BuilderTask.Work, busy: 0, phase: 0, restart: false, person: unit.native }
  unit.native = null; unit.builder.person.state = 10
  assert.equal(category(world, unit), 4, 'legacy builder status0 projects command6')
  unit.native = unit.builder.person; unit.builder = undefined; unit.work = null
  unit.native.state = 17; unit.path = [{ x: 1, z: 8 }]
  world.pathfinding.people.set(unit.id, unit.native)
  assert.equal(category(world, unit), 2, 'native idle approach paths remain Idle')
  const separate = createLivePerson(world, unit)
  world.pathfinding.people.set(unit.id, separate)
  assert.equal(category(world, unit), 4, 'independent movement owns the legacy path')
  unit.path = []; world.pathfinding.people.clear(); unit.inside = hut.id
  assert.equal(category(world, unit), 3, 'legacy checkpoint occupant uses its actual hut descriptor')
  hut.kind = 'tower'
  assert.equal(category(world, unit), 4, 'tower occupancy is Busy, not Housed')
})

test('task selection preserves orders and RNG during a real movement command and propagates occupied groups', () => {
  const { world, unit } = setup()
  const second = addUnit(world, 'blue', 'warrior', { x: 1, z: 8 })
  world.selected = [unit.id, second.id]
  command(world, { x: 30, z: 8 })
  for (let i = 0; i < 10; i++) tick(world, 1 / 12)
  const people = hudTaskPeople(world)
  assert.ok(people.every(p => p.category === 4))
  const orders = structuredClone(world.buildingOrders), rng = world.randomState, point = nativePosition(world, unit)
  selectFollowerTask(world, 2, 1, point, 'single')
  assert.deepEqual(world.selected, [second.id])
  assert.deepEqual(world.buildingOrders, orders); assert.equal(world.randomState, rng)
  // Supporting occupancy fixture verifies the task command's propagation, not boat gameplay.
  unit.native.vehicle = second.native.vehicle = 999
  world.vehicles = [{ id: 999, active: true, model: 1, passengerCount: 2, passengers: [unit.id, second.id] }]
  world.selected = [unit.id, second.id]
  selectFollowerTask(world, 2, 1, point, 'single')
  assert.deepEqual(world.selected, [], 'Selected Braves also deselect their fellow vehicle passengers')
})

test('live task count reads nearby camera coordinates without creating or registering people', () => {
  const { world, unit } = setup()
  const point = nativePosition(world, unit)
  unit.native.x = point.x + 6144; unit.native.y = point.y
  const before = structuredClone(world)
  const counts = followerTaskCounts(hudTaskPeople(world), point, true)
  assert.equal(counts.totals[2], 1)
  assert.equal(counts.tasks[2][2], 0)
  assert.deepEqual(world, before)
})

test('real boarding through a route owner overrides a dormant native person for Selected task propagation', async () => {
  const { boardLiveVehicle } = await import('../app/live-vehicles.ts')
  const world = createWorld(5), boat = world.vehicles[0],
    units = world.units.filter(u => u.team === 'blue' && u.kind === 'warrior').slice(0,2)
  boat.active = true
  const routes = units.map(unit => {
    unit.native = createLivePerson(world, unit); unit.native.state = 19
    const route = createLivePerson(world, unit)
    route.flags3 = 0x123456f8
    world.pathfinding.people.set(unit.id, route)
    assert.ok(boardLiveVehicle(world, route, boat))
    return route
  })
  // Supplied activation/boarding fixture uses the browser initializer result,
  // not the raw authored seed. Seat geometry has its own native projection tests.
  assert.deepEqual([boat.model,boat.x,boat.y,boat.heading],[1,58226,12429,7*Math.PI/4])
  const seats = units.map((_,i)=>{const p=vehicleSeat(boat,i);return [p.x,p.y]})
  assert.ok(units.every(u => u.native.vehicle === 0))
  world.selected = units.map(u => u.id)
  const before = structuredClone(world), people = hudTaskPeople(world)
  for (let i=0;i<units.length;i++) {
    const person = people.find(p => p.id === units[i].id)
    assert.equal(person.source, routes[i]); assert.equal(person.vehicle, boat.id)
    assert.equal(person.category, 5); assert.deepEqual([person.x,person.y],seats[i])
  }
  assert.deepEqual(world, before, 'task reads do not transfer or mutate simulation ownership')
  selectFollowerTask(world, 3, 1, boat, 'five')
  assert.deepEqual(world.selected, units.map(u => u.id))
  assert.ok(routes.every(p => p.flags3 === (0x123456f8 & ~0x10000000)))
  selectFollowerTask(world, 3, 1, boat, 'single')
  assert.deepEqual(world.selected, [])
  assert.ok(routes.every(p => !(p.selectionFlags & 128) && !(p.flags3 & 128)))
  assert.deepEqual(world.vehicles, before.vehicles)
  assert.deepEqual(world.buildingOrders, before.buildingOrders)
  assert.deepEqual(units.map(u => u.native), before.units.filter(u => units.some(t=>t.id===u.id)).map(u=>u.native))
})

// These are supplied mixed-tribe occupancy fixtures using the existing live
// boarding owner, not evidence of natural public mixed-crew acquisition. Ordinary
// boarding's same-driver-tribe gate and all production input gates stay unchanged.
async function mixedTaskCrew(kind = 1, routeOnly = false) {
  const { browserPosition, selectFollowers } = await import('../app/model.ts')
  const { boardLiveVehicle } = await import('../app/live-vehicles.ts')
  const world = createWorld(22), vehicle = world.vehicles.find(v => v.model === kind)
  assert.ok(vehicle)
  world.units = []; world.pathfinding.people.clear(); world.selected = []
  world.inputMask = 0; world.manaWorld.gameFlags &= ~32
  const add = (kind, team = 'blue', boarded = true) => {
    const unit = addUnit(world, team, kind, browserPosition(vehicle))
    unit.native = createLivePerson(world, unit); unit.native.state = 19
    const source = routeOnly && boarded ? createLivePerson(world, unit) : unit.native
    source.state = 19; source.flags3 = 0x123456f8
    world.pathfinding.people.set(unit.id, source)
    if (boarded) assert.ok(boardLiveVehicle(world, source, vehicle))
    return { unit, source }
  }
  const primary = add('brave'), companion = add('warrior', 'red')
  companion.source.flags4 |= 0x880
  selectFollowers(world, 2, vehicle, 'single')
  assert.deepEqual(world.selected, [primary.unit.id, companion.unit.id],
    'start with the existing persistent-strip mixed-crew contract')
  return { world, vehicle, primary, companion, add }
}

function expectedTaskSelection(before, touchedIds, selected) {
  const expected = structuredClone(before), ids = new Set(expected.selected)
  for (const id of touchedIds) {
    const source = expected.pathfinding.people.get(id)
    assert.ok(source, 'fixture retains each real boarded source')
    if (selected) {
      ids.add(id); source.selectionFlags |= 128
      source.flags3 = (source.flags3 & ~0x10000000) >>> 0
    } else {
      ids.delete(id); source.selectionFlags &= ~128
      source.flags3 = (source.flags3 & ~128) >>> 0
    }
  }
  expected.selected = expected.units.filter(u => u.hp > 0 && ids.has(u.id)).map(u => u.id)
  expected.mode = null
  return expected
}

test('Selected task single/Ctrl/Shift preserves complete mixed-tribe crew owner transitions', async () => {
  for (const kind of [1, 3]) for (const routeOnly of [false, true])
    for (const model of [0, 2]) for (const mode of ['single', 'five', 'all']) {
      const { world, vehicle, primary, companion } = await mixedTaskCrew(kind, routeOnly)
      const before = structuredClone(world)
      selectFollowerTask(world, model, 1, vehicle, mode)
      assert.deepEqual(world, expectedTaskSelection(before,
        [primary.unit.id, companion.unit.id], mode === 'five'),
      `${kind}/${routeOnly}/${model}/${mode}: only selected/work flags and roster may change`)
      if (routeOnly) assert.deepEqual(world.units.map(u => u.native), before.units.map(u => u.native),
        'dormant native records are not adopted or rewritten')
    }
})

test('task acquisition stays Blue-only while unrelated foreign selection and owners remain intact', async () => {
  const { world, vehicle, primary, companion, add } = await mixedTaskCrew(1, true)
  const nearestEnemy = add('brave', 'red', false), retainedEnemy = add('spy', 'yellow', false)
  const blue = add('brave', 'blue', false)
  nearestEnemy.source.x = (vehicle.x + 10) & 65535
  blue.source.x = (vehicle.x + 2000) & 65535
  // A displayed foreign selection must not cause unrelated source normalization.
  // Only the acquired Blue owner and its actual crew are writable recipients.
  retainedEnemy.source.selectionFlags = 1
  world.selected.push(retainedEnemy.unit.id)
  const before = structuredClone(world)
  selectFollowerTask(world, 2, 2, vehicle, 'single')
  const expected = expectedTaskSelection(before, [blue.unit.id], true)
  // Idle single acquisition retains the existing Brave cue at the browser unit
  // position, not its native-grid point. Specify the whole event independently.
  expected.sounds.push({ serial: ++expected.soundSerial, cue: 0x58,
    x: blue.unit.x, z: blue.unit.z, turn: expected.turn })
  if (expected.sounds.length > 128) expected.sounds.shift()
  assert.deepEqual(world, expected)
  assert.deepEqual(world.selected, [primary.unit.id, companion.unit.id, retainedEnemy.unit.id, blue.unit.id])
  assert.ok(!world.selected.includes(nearestEnemy.unit.id), 'foreign nearest Idle is never a primary')
})

test('no matching owned task primary preserves already-selected foreign recipients without writes', async () => {
  for (const mode of ['single', 'five', 'all']) {
    const { world, vehicle, add } = await mixedTaskCrew(3, true)
    const foreign = add('spy', 'red', false)
    foreign.source.selectionFlags = 1
    world.selected.push(foreign.unit.id)
    const before = structuredClone(world)
    selectFollowerTask(world, 5, 1, vehicle, mode)
    assert.deepEqual(world, before, 'there is no Blue Spy to acquire or deselect')
  }
})

test('actual Home task-row control reaches crew transitions once and retains Scene admission gates', async () => {
  const { readFileSync } = await import('node:fs')
  const { default: ts } = await import('typescript')
  const { pageSource, pageNode, evaluatePage, nearbyEvent } = await import('./support/follower-nearby-page.mjs')
  const { loadSceneFixture } = await import('./support/bloodlust-scene.mjs')
  const { hudTransports } = await import('../app/follower-transports-runtime.ts')
  const { transportCounts } = await import('../app/hud-transports.ts')
  const { followerTaskPosition } = await import('../app/hud-layout.ts')
  await loadSceneFixture()
  const { GameScene } = await import('../app/scene.ts')
  const viewSource = ts.createSourceFile('follower-tasks-view.tsx',
    readFileSync(new URL('../app/follower-tasks-view.tsx', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const declarations = viewSource.statements.filter(node => ts.isVariableStatement(node) &&
    node.declarationList.declarations.some(d => ['columns', 'tasks'].includes(d.name.getText(viewSource))))
  const view = viewSource.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === 'FollowerTasks')
  assert.equal(declarations.length, 2); assert.equal(view.length, 1)
  const render = evaluatePage(`function(){${declarations.map(n => n.getText(viewSource)).join('\n')}
    ${view[0].getText(viewSource).replace(/^export\s+/, '')}; return FollowerTasks}`, {
    transportCounts, followerTaskPosition, TaskIcon: 'TaskIcon', FollowerNumber: 'FollowerNumber',
  })()
  const mounted = pageNode(node => ts.isJsxSelfClosingElement(node) && node.tagName.getText(pageSource) === 'FollowerTasks')
  for (const input of ['pointer', 'ctrl', 'shift', 'keyboard', 'keyboard-ctrl', 'keyboard-shift',
    'input-mask', 'overview-stage', 'overview-active', 'level-lock', 'drag', 'pointer-buttons', 'focus']) {
    const { world, vehicle, primary, companion } = await mixedTaskCrew(1, true)
    let changes = 0
    const focused = [], panels = []
    const scene = Object.assign(Object.create(GameScene.prototype), {
      world, cameraPosition: { x: vehicle.x, y: vehicle.y }, overviewActive: false, overviewStage: null,
      drag: null, pointerButtons: 0, hudFocus: Array(9).fill(0), hudTaskFocus: Array(54).fill(0),
      focus: (...args) => focused.push(args), objectPanels: { open: id => panels.push(id) },
      onChange: () => changes++,
    })
    if (input === 'input-mask') world.inputMask = 1
    if (input === 'overview-stage') scene.overviewStage = 'opening'
    if (input === 'overview-active') scene.overviewActive = true
    if (input === 'level-lock') world.manaWorld.gameFlags |= 32
    if (input === 'drag') scene.drag = {}
    if (input === 'pointer-buttons') scene.pointerButtons = 1
    const makeControl = evaluatePage(pageNode(node => ts.isFunctionDeclaration(node) &&
      node.name?.text === 'followerControl').getText(pageSource), {
      engine: { current: scene }, followerPress: { current: null },
    })
    const props = evaluatePage(mounted.getText(pageSource), {
      FollowerTasks: render, world, followerCounts: followerTaskCounts(hudTaskPeople(world), vehicle),
      hudTransports, hudTaskPeople, followerControl: makeControl, hudCamera: vehicle, nearby: false,
    }).props
    const button = render(props).children.flat(Infinity).find(node =>
      node?.type === 'button' && node.props['aria-label'] === 'Currently selected Braves')
    assert.ok(button); assert.equal(button.props.disabled, false)
    const event = nearbyEvent({ ctrlKey: input.includes('ctrl'), shiftKey: input.includes('shift'),
      detail: input.startsWith('keyboard') ? 0 : 1 })
    const before = structuredClone(world)
    if (input === 'focus') button.props.onContextMenu(nearbyEvent({ button: 2 }))
    else {
      if (!input.startsWith('keyboard')) {
        button.props.onPointerDown(event)
        if (event.ctrlKey) button.props.onContextMenu(event)
        button.props.onPointerUp(event)
      }
      button.props.onClick(event)
    }
    const blocked = ['input-mask', 'overview-stage', 'overview-active', 'level-lock', 'drag', 'pointer-buttons'].includes(input)
    assert.equal(changes, blocked ? 0 : 1, `${input}: one accepted dispatch, or none when blocked`)
    if (blocked || input === 'focus') assert.deepEqual(world, before)
    else assert.deepEqual(world, expectedTaskSelection(before,
      [primary.unit.id, companion.unit.id], event.ctrlKey))
    if (input === 'focus') {
      assert.equal(panels[0], primary.unit.id); assert.equal(focused.length, 1)
    } else assert.deepEqual([focused, panels], [[], []])
  }
})


test('canonical follower-task check fingerprints the composed source and fixture closure', async () => {
  const { readFileSync } = await import('node:fs')
  const registry = JSON.parse(readFileSync(new URL('../engineering/checks.json', import.meta.url), 'utf8'))
  const checks = registry.checks.filter(check => check.id === 'follower-tasks-portable')
  assert.equal(checks.length, 1)
  const [check] = checks
  assert.equal(check.executable, 'node')
  assert.deepEqual(check.args, ['--test', 'tests/follower-tasks.test.mjs', 'tests/follower-task-runtime.test.mjs'])
  assert.equal(check.cwd, '.')
  assert.deepEqual(check.env, [], 'optional precompiled fixtures must not become mandatory')
  // app conservatively closes actual model/Scene imports and Home/view source reads.
  // The named helpers/data/self-read are outside that directory fingerprint.
  for (const path of [
    'app/hud-tasks.ts',
    'app/follower-tasks-runtime.ts',
    'app/follower-tasks-view.tsx',
    'tests/follower-tasks.test.mjs',
    'tests/follower-task-runtime.test.mjs',
    'app',
    'tests/support/follower-nearby-page.mjs',
    'tests/support/bloodlust-scene.mjs',
    'tests/support/scene-fixture-source.mjs',
    'decomp/research/follower-task-panel/native-panel-contract.json',
    'engineering/checks.json',
    'scripts/prepare-scene-fixture.mjs',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'package-lock.json',
    'public/original/world-selector/native/runtime.json',
    'public/original/world-selector/text/provenance.json',
  ]) assert.ok(check.inputs.includes(path), `canonical input is fingerprinted: ${path}`)
  assert.equal(new Set(check.inputs).size, check.inputs.length)
  assert.ok(check.prerequisites.some(value => value.includes('registerHooks')))
  assert.ok(check.knownLimits.some(value => value.includes('optional external precompiled fixture')))
})
