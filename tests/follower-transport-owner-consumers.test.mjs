import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { createWorld, addUnit, browserPosition } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { boardLiveVehicle, damageLiveVehicle } from '../app/live-vehicles.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { teamForTribe, tribeForTeam, vehicleApparentTribe } from '../app/world-types.ts'
import { originalVehicleUV } from '../app/vehicle-appearance.ts'

// Execute the maintained adapter itself. Only its renderer/engine leaves are
// supplied; this verifies source wiring, not native/GPU rendering or full Blast.
function adapter(file, name, leaves) {
  const source = readFileSync(new URL(`../app/${file}`, import.meta.url), 'utf8')
  const start = source.indexOf(`export function ${name}(`)
  const end = source.indexOf('\nexport function ', start + 1)
  assert.ok(start >= 0 && end > start)
  const body = source.slice(start, end).replace('export function', 'function')
  return runInNewContext(ts.transpileModule(`${body}\n${name}`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText, leaves)
}

function splitOwner(model) {
  const world = createWorld(22), vehicle = world.vehicles.find(v => v.model === model)
  const add = (team, kind) => {
    const unit = addUnit(world, team, kind, browserPosition(vehicle))
    unit.native = createLivePerson(world, unit)
    world.pathfinding.people.set(unit.id, unit.native)
    return unit
  }
  const brave = add('blue', 'brave'), spy = add('red', 'spy')
  spy.native.disguise = 0
  assert.ok(boardLiveVehicle(world, brave.native, vehicle))
  assert.ok(boardLiveVehicle(world, spy.native, vehicle))
  assert.equal(vehicle.team, 'red'); assert.equal(vehicle.apparentTribe, 0)
  return { world, vehicle }
}

test('vehicle creation and frame cache use apparent tribe, including checkpoints and legacy fallback', () => {
  for (const model of [1, 3]) {
    const { world, vehicle } = splitOwner(model), copies = []
    const update = adapter('scene-entities.ts', 'updateVehiclesFrame', {
      browserPosition, originalVehicleUV, teamForTribe, vehicleApparentTribe,
      makeVehicle: () => ({ userData: {}, children: [{ geometry: { getAttribute: () => ({
        copyArray: array => copies.push([...array]), needsUpdate: false,
      }) } }] }),
    })
    const scene = { world: { vehicles: [vehicle] }, vehicleMeshes: new Map(),
      objects: { add() {}, remove() {} }, releaseGroup() {}, locate() {}, orientModel() {} }
    update(scene)
    assert.deepEqual(copies.at(-1), [...originalVehicleUV(model, 'blue')])
    assert.equal(scene.vehicleMeshes.get(vehicle.id).userData.vehicleTeam, 'blue')
    update(scene); assert.equal(copies.length, 1, 'unchanged appearance reuses cached UVs')
    vehicle.apparentTribe = 2
    update(scene)
    assert.deepEqual(copies.at(-1), [...originalVehicleUV(model, 'yellow')])
    assert.equal(scene.vehicleMeshes.get(vehicle.id).userData.vehicleTeam, 'yellow')
    const restored = migrateCheckpoint(structuredClone(world)).vehicles.find(v => v.id === vehicle.id)
    scene.world.vehicles = [restored]; update(scene)
    assert.equal(copies.length, 2, 'checkpoint keeps the apparent material')
    delete restored.apparentTribe; update(scene)
    assert.deepEqual(copies.at(-1), [...originalVehicleUV(model, 'red')])
    assert.equal(scene.vehicleMeshes.get(vehicle.id).userData.vehicleTeam, 'red')
  }
})

test('vehicle damage immunity follows apparent tribe while real-owner counts stay unchanged', () => {
  for (const model of [1, 3]) {
    const { world, vehicle } = splitOwner(model)
    vehicle.life = 5000
    damageLiveVehicle(world, vehicle, 0, 50); assert.equal(vehicle.life, 5000)
    damageLiveVehicle(world, vehicle, 1, 50); assert.equal(vehicle.life, 4950)
    assert.equal(vehicle.team, 'red'); assert.equal(tribeForTeam(vehicle.team), 1)
    delete vehicle.apparentTribe
    damageLiveVehicle(world, vehicle, 1, 50); assert.equal(vehicle.life, 4950)
  }
})

test('live Blast projects class4 apparent tribe without changing the real owner', () => {
  for (const model of [1, 3]) {
    const { world, vehicle } = splitOwner(model), observed = []
    world.units = []; world.buildings = []; world.trees = []; world.vehicles = [vehicle]
    const step = adapter('spell-effects-runtime.ts', 'stepLiveBlastWave', {
      tribeForTeam, vehicleApparentTribe, syncLandscapeObjects() {},
      stepBlastWave: (_state, _wave, search) => {
        const cell = ((vehicle.y & 65535) >> 9) * 128 + ((vehicle.x & 65535) >> 9)
        observed.push(search.cell(cell).find(p => p.id === vehicle.id).tribe)
        return false
      },
    })
    assert.equal(step(world, { tribe: 2 }), false)
    assert.deepEqual(observed, [0]); assert.equal(vehicle.team, 'red')
    delete vehicle.apparentTribe
    step(world, { tribe: 2 }); assert.deepEqual(observed, [0, 1])
  }
})
