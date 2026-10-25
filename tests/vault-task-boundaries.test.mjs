import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, command, createWorld, select } from '../app/model.ts'
import { processVaultTask } from '../app/vault.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { finishLevelStart } from './level-start-fixture.mjs'

// Supplied task boundaries, not ordinary travel evidence. The genuine opening and
// command create the owner/queue; positions, phases and goals below are explicit fixtures.
function boundary(phase, entering, position, goal = position) {
  const world = finishLevelStart(createWorld(3))
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  select(world, 'shaman')
  assert.equal(command(world, vault), true)
  const person = shaman.native
  Object.assign(person, {
    x: position.x, y: position.y, goalX: goal.x, goalY: goal.y,
    commandPhase: phase, workTarget: vault.id,
    flags2: entering ? person.flags2 | 0x40000000 : person.flags2 & ~0x40000000,
  })
  Object.assign(shaman, browserPosition(person))
  shaman.vault = { head: vault.id, phase, entering, remaining: person.timer }
  return { world, shaman, vault, person }
}

test('supplied first-entry goals are installed before phase-1/4/7/9 arrival checks', () => {
  for (const [phase, expected] of [
    [1, { x: 58112, y: 30976 }],
    [4, { x: 58112, y: 32000 }],
    [7, { x: 58112, y: 30976 }],
    [9, { x: 58112, y: 29952 }],
  ]) {
    const { world, shaman, person } = boundary(phase, true, { x: 58432, y: 30464 })
    assert.equal(processVaultTask(world, shaman), 0)
    assert.deepEqual({ x: person.goalX, y: person.goalY }, expected, `phase ${phase} destination`)
    assert.equal(person.commandPhase, phase, `phase ${phase} must not arrive at its old goal`)
  }
})

test('supplied saved entering-false tasks retain their actual dispatched goal through Load', () => {
  // Offset from current and proposed geometry to represent an already-resolved route endpoint.
  // This is deliberately supplied; it is not claimed as a recovered historical checkpoint.
  for (const [phase, next] of [[1, 2], [4, 5], [7, 8], [9, 9]]) {
    const goal = { x: 58176, y: phase === 4 ? 32000 : phase === 9 ? 30464 : 31488 }
    const original = boundary(phase, false, goal)
    const world = migrateCheckpoint(structuredClone(original.world))
    const shaman = world.units.find(unit => unit.id === original.shaman.id)
    const person = shaman.native
    assert.equal(person.flags2 & 0x40000000, 0)
    const rng = world.randomState
    assert.equal(processVaultTask(world, shaman), phase === 9 ? 1 : 0)
    assert.equal(person.commandPhase, next, `phase ${phase} must use its retained goal`)
    assert.deepEqual({ x: person.goalX, y: person.goalY }, goal)
    assert.equal(world.randomState, rng, 'saved arrival must not install a new route or consume RNG')
  }
})

test('supplied removed Vault target completes without issuing a destination or forcing a reward', () => {
  const { world, shaman, vault, person } = boundary(1, true, { x: 58432, y: 30464 })
  world.shrines = world.shrines.filter(shrine => shrine.id !== vault.id)
  const goal = { x: person.goalX, y: person.goalY }
  const rng = world.randomState
  assert.equal(processVaultTask(world, shaman), 1)
  assert.deepEqual({ x: person.goalX, y: person.goalY }, goal)
  assert.equal(shaman.vault, null)
  assert.equal(shaman.work, null)
  assert.equal(vault.forced, false)
  assert.equal(world.randomState, rng)
})
