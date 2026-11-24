import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'

const mission = () => {
  const world = createWorld(2)
  return { world, site: world.levelStart.find(s => s.tribe === 0),
    run: turns => { for (let i = 0; i < turns; i++) tick(world, 1 / 12) } }
}

test('authored M2 opening wave grows, grades terrain, converts Wildmen, and retires', () => {
  const { world, site, run } = mission()
  const heights = [...world.land.heights]
  const wild = new Set(world.units.filter(u => u.team === 'wild').map(u => u.id))
  run(14)
  assert.equal(site.wave.visits, 0)
  assert.deepEqual(site.wave.orbits, [])
  const wave = site.wave
  run(1)
  assert.equal(site.wave, wave)
  assert.deepEqual([wave.visits, wave.terrainRadius, wave.visualRadius, wave.orbits.length], [1, 320, 320, 32])
  const orbitIds = new Set(wave.orbits.map(orbit => orbit.id))
  assert.equal(orbitIds.size, 32)
  assert.ok(wave.orbits.every(orbit => world.effects.some(e => e.id === orbit.id) && orbit.displacement.h === 0))
  run(5)
  assert.ok(world.land.heights.some((height, index) => height !== heights[index]))
  const blueBraves = world.units.filter(u => u.team === 'blue' && u.kind === 'brave')
  assert.equal(blueBraves.length, 7)
  assert.ok(blueBraves.every(u => !wild.has(u.id)))
  run(10)
  assert.deepEqual([wave.visits, wave.terrainRadius, wave.visualRadius], [16, 2560, 2048])
  assert.equal(world.units.filter(u => u.team === 'blue' && u.kind === 'brave').length, 8)
  run(5)
  assert.equal(site.wave, null)
  assert.ok(!world.effects.some(e => orbitIds.has(e.id)))
})

test('first authored M2 stone arrival emits one 32-particle initialized burst', () => {
  const { world, site, run } = mission()
  run(36)
  assert.ok(site.stoneTurns.every(turn => turn === null))
  const preceding = new Set(world.effects.map(fx => fx.id))
  run(1)
  assert.equal(site.stoneTurns[7], 37)
  const burst = world.effects.filter(fx => !preceding.has(fx.id) && fx.sprite?.sequence === 'blastTrail')
  assert.equal(burst.length, 32)
  const start = burst[0].animation
  assert.ok(burst.every(({ animation: p, team }) =>
    team === 'blue' && p.x === start.x && p.y === start.y && p.h === start.h &&
    p.speed === 60 && [1, 2].includes(p.remaining) &&
    p.pitch >= 0 && p.pitch < 2048 && p.yaw >= 0 && p.yaw < 2048 && (p.flags2 & 0x1080) === 0x1080
  ))
})
