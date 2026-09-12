import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, cast, createWorld, nativePosition, tick } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

const stepUntil = (w, predicate, limit = 160) => {
  for (let i = 0; !predicate() && i < limit; i++) tick(w, 1 / 12)
  assert.ok(predicate())
}

test('Swarm follows player and computer cast paths, panics eligible enemies, and expires', () => {
  const w = createWorld()
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = []
  w.buildings = []
  w.trees = []
  w.shrines = []
  addUnit(w, 'blue', 'shaman', { x: 0, z: 0 })
  const victim = addUnit(w, 'red', 'brave', { x: 2, z: 0 }),
    protectedVictim = addUnit(w, 'red', 'warrior', { x: 2, z: 0 }),
    removedVictim = addUnit(w, 'red', 'preacher', { x: 2, z: 0 }),
    enemyShaman = addUnit(w, 'red', 'shaman', { x: 2, z: 0 }),
    ally = addUnit(w, 'blue', 'brave', { x: 2, z: 0 }),
    farEnemy = addUnit(w, 'red', 'brave', { x: 20, z: 20 })
  const untouchedLife = new Map(
    [protectedVictim, enemyShaman, ally, farEnemy].map(unit => [unit.id, unit.hp])
  )
  for (const unit of w.units) {
    unit.native = createLivePerson(w, unit)
    unit.native.state = 14
  }
  protectedVictim.native.flags2 |= 0x100000
  removedVictim.native.flags4 |= 0x800
  victim.hp = 20 // Browser damage may lead its retained native record between effect visits.
  const life = victim.hp

  w.shots.swarm = 1
  assert.ok(cast(w, 'swarm', { x: 2, z: 0 }))
  stepUntil(w, () => victim.native?.state === 26)
  const swarm = w.effects.find(fx => fx.swarm)
  assert.ok(swarm)
  assert.equal(w.shots.swarm, 0)
  assert.equal(victim.hp, life - 5)
  assert.equal(protectedVictim.native.state === 26, false)
  assert.equal(protectedVictim.hp, untouchedLife.get(protectedVictim.id) - 5)
  assert.equal(removedVictim.hp, 0)
  for (const unit of [enemyShaman, ally, farEnemy]) assert.equal(unit.hp, untouchedLife.get(unit.id))
  assert.ok(w.sounds.some(sound => sound.cue === 0xa4))
  stepUntil(w, () => !w.effects.some(fx => fx.id === swarm.id), 70)

  const ai = createWorld(),
    red = ai.units.find(u => u.team === 'red' && u.kind === 'shaman'),
    blue = ai.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    target = ai.units.find(u => u.team === 'blue' && u.kind === 'brave')
  ai.terrain.fill(3)
  ai.terrainVersion++
  ai.units = [red, blue, target]
  Object.assign(red, { x: 0, z: 0, path: [], casting: null })
  Object.assign(target, { x: 2, z: 0, path: [], casting: null })
  for (const unit of [blue, target]) {
    unit.native = createLivePerson(ai, unit)
    unit.native.state = 14
  }
  ai.turn = 16
  ai.manaTribes[1].mana = 40000
  ai.manaTribes[1].available = 0
  ai.manaWorld.spells[1].stocks[5] = 1
  ai.ai.spellEntries = ai.ai.spellEntries.map((entry, i) => ({
    ...entry,
    model: i ? 0 : 5,
    mana: 0,
    people: 1,
    mode: 0,
  }))
  const p = nativePosition(ai, target)
  ai.spellScan.targets[0] = ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) || 1
  tick(ai, 1 / 12)
  assert.equal(ai.projectiles.at(-1)?.spell, 'swarm')
  stepUntil(ai, () => target.native?.state === 26)
  assert.ok(ai.effects.some(fx => fx.swarm?.tribe === 1))

  delete ai.shots.swarm
  delete ai.giftCounts.swarm
  migrateCheckpoint(ai)
  assert.equal(ai.shots.swarm, 0)
  assert.equal(ai.giftCounts.swarm, 0)
})
