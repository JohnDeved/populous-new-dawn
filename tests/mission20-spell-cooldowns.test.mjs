import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, campaignPersonCount, tick } from '../app/model.ts'
import { createGameStore } from '../app/game-store.ts'
import { syncLivePersonCells } from '../app/live-people.ts'

const red = 1,
  cooldownFlag = 0x40000,
  models = [2, 17, 5, 6, 19, 12, 3, 7, 4, 11, 15, 14, 10, 8, 13, 16],
  early = [8, 8, 32, 40, 48, 66, 64, 70, 72, 80, 100, 140, 168, 64, 152, 128],
  late = [4, 4, 16, 20, 24, 33, 32, 35, 36, 40, 50, 70, 84, 180, 204, 64]

function step(world) {
  const before = world.turn
  assert.equal(world.status, 'playing')
  assert.equal(world.paused, false)
  tick(world, 1 / 12)
  assert.equal(world.turn, before + 1)
}

for (const [population, expected] of [
  [79, early],
  [80, late],
]) {
  test(`Mission 20 applies the authored Red cooldowns at population ${population}`, () => {
    const store = createGameStore()
    store.startMission(20)
    const world = store.getWorld(),
      ai = world.campaignAIs[red],
      spells = world.castingTribes[red].spells
    while (world.turn < 122) step(world)
    const before = models.map(model => spells[model].interval)
    assert.equal(ai.flags & cooldownFlag, 0)
    step(world)
    assert.equal(world.turn, 123)
    assert.equal(ai.flags & cooldownFlag, 0)
    assert.deepEqual(
      models.map(model => spells[model].interval),
      before
    )

    // Supply only the population boundary; use the normal world tick and script.
    const shaman = world.units.find(
      unit => unit.team === 'red' && unit.kind === 'shaman' && unit.hp > 0
    )
    assert.ok(shaman)
    const missing = population - campaignPersonCount(world, red)
    assert.ok(missing >= 0)
    for (let index = 0; index < missing; index++)
      addUnit(world, 'red', 'brave', {
        x: shaman.x + ((index % 9) - 4) * 0.4,
        z: shaman.z + (Math.floor(index / 9) - 4) * 0.4,
      })
    syncLivePersonCells(world)
    assert.equal(campaignPersonCount(world, red), population)
    step(world)
    assert.equal(world.turn, 124)
    assert.equal(ai.flags & cooldownFlag, cooldownFlag)
    assert.deepEqual(
      models.map(model => spells[model].interval),
      expected
    )

    // Distinguish no refresh from reapplying the same value on the adjacent turn.
    spells[17].interval = 253
    step(world)
    assert.equal(world.turn, 125)
    assert.equal(spells[17].interval, 253)
  })
}
