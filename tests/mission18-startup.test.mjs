import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, distance, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'

const blueShaman = world => world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
const openingCommand = (world, unit) =>
  unit.native ? currentPersonOrder(world.buildingOrders, unit.native)?.model : undefined
const openingWildmen = [464, 465, 466, 467, 468, 469]

test('Mission 18 fresh start hands the authored Blue Shaman exactly one opening command', () => {
  const world = createWorld(18, 'scalable')
  const shaman = blueShaman(world)
  const wildmen = world.units.filter(unit => unit.team === 'wild' && distance(unit, shaman) < 4)
  assert.deepEqual(wildmen.map(unit => unit.id).sort((a, b) => a - b), openingWildmen)
  assert.deepEqual(
    world.levelStart.map(site => [site.tribe, site.shaman, site.phase]),
    [[0, shaman.id, 0]]
  )
  assert.equal(openingCommand(world, shaman), 18)

  const site = world.levelStart[0]
  const phases = [site.phase]
  const initialBlue = new Set(world.units.filter(unit => unit.team === 'blue').map(unit => unit.id))
  for (let turn = 0; turn < 120; turn++) {
    tick(world, 1 / 12)
    assert.equal(world.shots.convertWild, 0, 'the opening does not award a free spell')
    assert.equal(world.levelStart.length, 1, 'no duplicate opening controller')
    assert.equal(world.levelStart[0], site)
    if (site.phase !== phases.at(-1)) phases.push(site.phase)
  }

  assert.deepEqual(phases, [0, 1, 2, 3, 4])
  assert.equal(openingCommand(world, shaman), undefined)
  assert.ok(wildmen.every(wildman => !world.units.some(unit => unit.id === wildman.id)))
  const recruits = world.units.filter(unit => unit.team === 'blue' && !initialBlue.has(unit.id))
  assert.equal(recruits.length, 6)
  assert.ok(recruits.every(unit => unit.kind === 'brave'))
})

test('a new Mission 18 factory start does not retain or duplicate finished opening state', () => {
  const first = createWorld(18, 'scalable')
  for (let turn = 0; turn < 60; turn++) tick(first, 1 / 12)
  if (first.levelStart.length) assert.equal(first.levelStart[0].phase, 4)
  const fresh = createWorld(18, 'scalable')
  assert.equal(fresh.levelStart.length, 1)
  assert.equal(fresh.levelStart[0].phase, 0)
  assert.equal(openingCommand(fresh, blueShaman(fresh)), 18)
  assert.equal(fresh.shots.convertWild, 0)
  assert.deepEqual(
    fresh.units
      .filter(unit => unit.team === 'wild' && openingWildmen.includes(unit.id))
      .map(unit => unit.id)
      .sort((a, b) => a - b),
    openingWildmen
  )
})

test('Mission 1 retains its existing authored opener', () => {
  const world = createWorld(1)
  assert.equal(openingCommand(world, blueShaman(world)), 18)
})

test('Mission 17 remains outside the modeled opening controller', () => {
  assert.equal(createWorld(17).levelStart.length, 0)
})
