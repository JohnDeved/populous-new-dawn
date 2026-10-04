import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, placeBuilding, select, setSelection, tick } from '../app/model.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'
import { buildingOutsidePoint, buildingPose } from '../app/building-shapes.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

const until = (world, predicate, limit = 20000) => {
  for (let i = 0; i < limit && !predicate(); i++) tick(world, 1 / 12)
  assert.ok(predicate(), `Condition not reached at turn ${world.turn}`)
}
const baseCell = building => {
  const p = buildingOutsidePoint(buildingPose(building))
  return ((p.x >>> 8) & 254) | (p.y & 0xfe00)
}

test('Mission 2 producer matches native base, loss, capacity and resource boundary cases', () => {
  // Controlled consumer fixtures, paired with check-native-mission2-rebuilding.py.
  for (const [established, tower, huts, available, disabled, occupied, model] of [
    [false, true, 3, 2, false, false, 4], [true, true, 3, 2, false, false, 0],
    [true, false, 3, 2, false, false, 4], [true, true, 0, 2, false, false, 1],
    [true, false, 0, 2, false, false, 4], [true, true, 1, 2, false, false, 0],
    [false, true, 3, 1, false, false, 0], [false, true, 3, 2, true, false, 0],
    [false, true, 3, 2, false, true, 0],
  ]) {
    const world = createWorld(2)
    // Isolate this construction-predicate fixture from the separate native scanner.
    // ai-response-task.test.mjs covers their ordinary pre-table composition.
    world.ai.states &= ~512
    if (established) world.ai.constructionBase = 0x8234
    const braves = new Set(world.units.filter(u => u.team === 'green' && u.kind === 'brave').slice(0, available).map(u => u.id))
    world.units = world.units.filter(u => u.team !== 'green' || u.kind === 'shaman' || braves.has(u.id))
    let remaining = huts
    world.buildings = world.buildings.filter(b => b.team !== 'green' ||
      (b.kind === 'tower' ? tower : b.kind === 'hut' ? remaining-- > 0 : true))
    for (const task of world.ai.tasks) task.flags = 0
    if (occupied) Object.assign(world.ai.tasks[0], { flags: 1, type: 0, requested: 0 })
    if (disabled) world.ai.flags |= 0x400
    const before = structuredClone(world.ai.tasks), seed = world.randomState
    world.turn = 60
    stepComputerTasks(world, 3)
    const request = world.ai.tasks.find(t => t.flags & 1 && t.type === 0 && t.requested)
    if (!model) assert.deepEqual(world.ai.tasks, before)
    else assert.deepEqual({ model: request.requested, origin: request.origin, phase: request.phase },
      { model, origin: established ? 0x8234 : 0x8062, phase: 0 })
    assert.equal(world.randomState, seed)
  }
})

test('Mission 2 naturally establishes a new home Tower base and preserves phase3 checkpoint continuation', () => {
  const world = createWorld(2), original = new Set(world.buildings.map(b => b.id))
  assert.equal(world.ai.constructionBase, undefined)
  assert.equal(world.buildings.filter(b => b.team === 'green' && b.kind === 'tower').length, 1)
  until(world, () => world.ai.tasks.some(t => t.flags & 1 && t.type === 0 && t.phase === 0), 64)
  const request = world.ai.tasks.find(t => t.flags & 1 && t.type === 0)
  assert.equal(world.turn, 61)
  assert.equal(request.origin, 0x8062)
  until(world, () => request.phase === 3, 1000)
  assert.equal(world.ai.constructionBase, undefined)
  const home = world.buildings.find(b => b.id === request.entity)
  assert.ok(home && !original.has(home.id))
  const restored = migrateCheckpoint(structuredClone(world))
  for (let i = 0; i < 3000 && home.progress !== 1; i++) { tick(world, 1 / 12); tick(restored, 1 / 12) }
  assert.equal(home.progress, 1)
  assert.equal(world.ai.constructionBase, baseCell(home))
  assert.equal(restored.ai.constructionBase, world.ai.constructionBase)
  assert.deepEqual(restored.ai.tasks, world.ai.tasks)
  assert.equal(typeof restored.randomState, 'number')
  assert.equal(restored.randomState, world.randomState)
  assert.equal(world.buildings.filter(b => b.team === 'green' && b.kind === 'tower' && b.hp > 0).length, 2)
  for (let i = 0; i < 512; i++) tick(world, 1 / 12)
  assert.equal(world.buildings.filter(b => b.team === 'green' && b.kind === 'tower' && b.hp > 0).length, 2)
})

test('Mission 2 rebuilds after a real player army destroys both Towers, retaining its first construction base', () => {
  const world = createWorld(2)
  const people = team => world.units.filter(unit => unit.team === team && unit.hp > 0)
  const warriors = () => people('blue').filter(unit => unit.kind === 'warrior')
  until(world, () => world.turn >= 70, 1000)
  for (const [x, z] of [[-96, -120], [-88, -116], [-88, -108]]) {
    select(world, 'brave')
    assert.ok(placeBuilding(world, 'hut', { x, z }))
    const hut = world.buildings.findLast(b => b.team === 'blue' && b.kind === 'hut')
    until(world, () => hut.progress === 1)
    until(world, () => !people('blue').some(u => u.builder))
  }
  until(world, () => people('blue').length >= 30, 50000)
  select(world, 'brave')
  assert.ok(placeBuilding(world, 'camp', { x: -99, z: -105 }))
  const camp = world.buildings.find(b => b.team === 'blue' && b.kind === 'camp')
  until(world, () => camp.progress === 1)
  until(world, () => !people('blue').some(u => u.builder))
  setSelection(world, people('blue').filter(u => u.kind === 'brave').slice(0, 20).map(u => u.id))
  assert.ok(command(world, camp))
  until(world, () => warriors().length >= 20, 15000)
  const towers = world.buildings.filter(b => b.team === 'green' && b.kind === 'tower' && b.hp > 0)
  assert.equal(towers.length, 2)
  const base = world.ai.constructionBase
  for (const target of towers) {
    setSelection(world, warriors().map(u => u.id))
    assert.ok(command(world, target))
    until(world, () => target.hp <= 0)
  }
  setSelection(world, warriors().map(u => u.id))
  assert.ok(command(world, { x: -108, z: -105 }))
  // Building handles may be reused; a replacement is a new object lifetime.
  assert.ok(towers.every(tower => tower.hp <= 0))
  const replacement = () => world.buildings.find(b => b.team === 'green' && b.kind === 'tower' && b.hp > 0 && !towers.includes(b))
  until(world, () => !!replacement(), 3000)
  const building = replacement()
  assert.equal(world.ai.constructionBase, base)
  until(world, () => building.progress === 1)
  assert.equal(world.ai.constructionBase, base)
  assert.equal(world.status, 'playing')
})
