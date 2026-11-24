import assert from 'node:assert/strict'
import test from 'node:test'
import { breedingWork, createWorld, population, populationLimit, tick } from '../app/model.ts'

function beforeVisit(mission, turn, id) {
  const world = createWorld(mission, 'scalable')
  while (world.turn < turn && world.status === 'playing') tick(world, 1 / 12)
  assert.equal(world.turn, turn)
  const hut = world.buildings.find(building => building.id === id)
  assert.ok(hut && hut.kind === 'hut' && hut.progress === 1 && hut.hp > 0)
  const ids = new Set(world.units.map(unit => unit.id))
  return { world, hut, newborns: () => world.units.filter(unit => !ids.has(unit.id)) }
}

test('the ordinary housing gate clears the sampled breeding clock of the authored over-cap tribe', () => {
  // Mission 3 starts a normal authored house; opening converts bring Blue above its housing limit.
  const { world, hut, newborns } = beforeVisit(3, 23, 1)
  assert.deepEqual([hut.team, hut.counter, hut.timer, population(world, 'blue'), populationLimit(world, 'blue')],
    ['blue', 23, 1143, 13, 9])
  tick(world, 1 / 12)
  assert.deepEqual([hut.counter, hut.timer, population(world, 'blue'), newborns().length], [24, 0, 13, 0])
})

test('the ordinary populated mature hut consumes the active breeding band on a real birth', () => {
  const { world, hut, newborns } = beforeVisit(2, 71, 3)
  assert.deepEqual([hut.level, hut.counter, hut.timer, population(world, 'green'), populationLimit(world, 'green'),
    breedingWork(world, hut)], [3, 71, 691, 19, 27, 695])
  assert.deepEqual(world.units.filter(unit => unit.inside === hut.id).map(unit => unit.id), [15, 16])
  tick(world, 1 / 12)
  assert.deepEqual([hut.counter, hut.timer, population(world, 'green')], [72, 0, 20])
  assert.deepEqual(newborns().map(unit => [unit.id, unit.team, unit.kind]), [[2196, 'green', 'brave']])
})

test('the real hut birth flash anchors its height on the outside terrain and starts the 16-turn clock', () => {
  const { world, hut, newborns } = beforeVisit(2, 51, 71)
  const old = new Set(world.effects.map(effect => effect.id))
  tick(world, 1 / 12)
  assert.deepEqual(newborns().map(unit => [unit.id, unit.team, unit.kind, unit.x, unit.z]),
    [[2158, hut.team, 'brave', 103, 117]])
  const flashes = world.effects.filter(effect => effect.kind === 'birth' && !old.has(effect.id))
  assert.equal(flashes.length, 1)
  const [flash] = flashes
  assert.deepEqual([flash.id, flash.x, flash.z, Math.round(flash.height * 45), flash.turnsRemaining,
    flash.animation.object, flash.animation.draw], [2159, 106.75, 117, 49, 16, 1441, 41])
})
