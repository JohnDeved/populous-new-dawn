import assert from 'node:assert/strict'
import test from 'node:test'
import { processComputerSpells } from '../app/computer-spells.ts'
import { createTribeCasting } from '../app/spell-casting.ts'
import {
  addUnit,
  applyHypnotise,
  beginCast,
  cast,
  createWorld,
  nativeCellPoint,
  population,
  stepUnitHypnotise,
  tick,
} from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

const personOf = u =>
  u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person ?? u.builder?.person

test('Hypnotise uses the native footprint, temporary ownership, expiry, and AI target path', () => {
  const w = createWorld(),
    blueShaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    redShaman = w.units.find(u => u.team === 'red' && u.kind === 'shaman')
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = [blueShaman, redShaman]
  Object.assign(blueShaman, { x: 0, z: 20, path: [], casting: null })
  Object.assign(redShaman, { x: 30, z: 30, path: [], casting: null })
  const enemies = Array.from({ length: 7 }, (_, i) => {
      const u = addUnit(w, 'red', 'brave', { x: 1 + i / 8, z: 13 })
      u.hp -= i / 10
      u.cargo = i
      return u
    }),
    excluded = addUnit(w, 'red', 'brave', { x: 1, z: 13 })
  excluded.invisibility = 20
  w.shots.hypnotise = 1
  assert.ok(cast(w, 'hypnotise', { x: 1, z: 13 }))
  for (let i = 0; !w.effects.some(fx => fx.kind === 'hypnotise') && i < 100; i++) tick(w, 1 / 12)
  const controller = w.effects.find(fx => fx.kind === 'hypnotise')
  assert.equal(controller.turnsRemaining, 16)
  tick(w, 4 / 12)
  assert.ok(!w.units.some(u => u.hypnotise))
  assert.equal(controller.turnsRemaining, 12)
  tick(w, 1 / 12)
  assert.equal(controller.turnsRemaining, 11)

  const converted = w.units.filter(u => u.hypnotise)
  assert.equal(converted.length, 6)
  assert.equal(population(w, 'blue'), 7)
  assert.equal(population(w, 'red'), 3)
  assert.ok(converted.every(u => u.team === 'blue' && personOf(u).tribe === 0))
  assert.ok(converted.every(u => personOf(u).flags4 & 0x4000))
  assert.ok(
    converted.every(u => u.hypnotise.originalTeam === 'red' && u.hypnotise.remaining === 55)
  )
  assert.ok(converted.every(u => !enemies.some(old => old.id === u.id)))
  assert.equal(excluded.team, 'red')
  assert.equal(w.shots.hypnotise, 0)
  assert.ok(w.sounds.some(sound => sound.cue === 0x7b))
  tick(w, 11 / 12)
  assert.ok(!w.effects.includes(controller))

  const expiring = converted[0],
    expiringId = expiring.id,
    idsBeforeExpiry = new Set(w.units.map(u => u.id))
  expiring.hypnotise.remaining = 1
  expiring.hypnotise.counter = 6
  stepUnitHypnotise(w)
  assert.ok(w.units.includes(expiring))
  stepUnitHypnotise(w)
  const restored = w.units.find(
    u =>
      !idsBeforeExpiry.has(u.id) &&
      u.team === 'red' &&
      u.x === expiring.x &&
      u.z === expiring.z &&
      u.cargo === expiring.cargo
  )
  assert.ok(restored && personOf(restored) && restored.id !== expiringId && !restored.hypnotise)
  assert.equal(personOf(restored).tribe, 1)

  const dying = w.units.find(u => u.hypnotise),
    deathCredits = w.killCredits[0][1]
  personOf(dying).damageAttacker = 0
  dying.hp = 0
  tick(w, 1 / 12)
  assert.equal(w.killCredits[0][1], deathCredits + 1)
  assert.ok(w.effects.some(fx => fx.kind === 'death' && fx.unit?.team === 'red'))

  const permanent = w.units.find(u => u.hypnotise)
  permanent.hypnotise.remaining = 1
  permanent.hypnotise.counter = 7
  w.manaTribes[1].defeatTimer = 1
  stepUnitHypnotise(w)
  assert.equal(permanent.team, 'blue')
  assert.equal(permanent.hypnotise, undefined)
  assert.equal(personOf(permanent).flags4 & 0x4000, 0)

  const tied = createWorld()
  tied.manaWorld.loadFlags |= 0x200
  tied.terrain.fill(3)
  tied.terrainVersion++
  tied.units = []
  const tiedUnits = Array.from({ length: 7 }, () => addUnit(tied, 'red', 'brave', { x: 1, z: 13 }))
  applyHypnotise(tied, { x: 1, z: 13 }, 'blue')
  assert.ok(tied.units.some(u => u.id === tiedUnits[0].id))
  assert.ok(tiedUnits.slice(1).every(old => !tied.units.some(u => u.id === old.id)))
  applyHypnotise(tied, { x: 1, z: 13 }, 'red')
  assert.equal(tied.units.filter(u => u.hypnotise?.originalTeam === 'red').length, 6)

  const aiLive = createWorld(),
    aiShaman = aiLive.units.find(u => u.team === 'red' && u.kind === 'shaman'),
    blueAiShaman = aiLive.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    targetCell = 0x202
  aiLive.manaWorld.loadFlags |= 0x200
  aiLive.terrain.fill(3)
  aiLive.terrainVersion++
  aiLive.units = [aiShaman, blueAiShaman]
  Object.assign(aiShaman, { x: -6, z: -10, path: [], casting: null })
  Object.assign(blueAiShaman, { x: 30, z: 30, path: [], casting: null })
  const aiTarget = addUnit(aiLive, 'blue', 'brave', { x: -5, z: -11 })
  aiLive.manaWorld.spells[1].stocks[7] = 1
  aiLive.manaTribes[1].mana = 100000
  const aiWorld = {
      tribe: 1,
      alliances: 0,
      cells: new Map([
        [
          targetCell,
          Array.from({ length: 3 }, (_, id) => ({
            id,
            class: 1,
            model: 2,
            state: 10,
            tribe: 0,
            x: 0,
            y: 0,
            flags2: 0,
            flags4: 0,
            assignment: 0,
            disguise: 0,
          })),
        ],
      ]),
      terrainFlags: () => 0,
    },
    caster = {
      x: 0x200,
      y: 0x200,
      height: 256,
      state: 0,
      flags2: 0,
      flags4: 0,
      landIndex: 0,
      building: null,
      playerType: 1,
      casting: createTribeCasting(true),
    },
    stock = { available: 0, disabled: 0, stocks: Array(22).fill(0) },
    casts = []
  stock.stocks[7] = 1
  processComputerSpells(
    aiWorld,
    { cursor: 0, limit: 0, paused: 1, targets: [0x202, 0, 0, 0] },
    caster,
    { turn: 16, mana: 100000, reserve: 0, gameFlags: 0, aiFlags: 0, blastFrequency: 0, stock },
    [{ model: 7, mana: 0, people: 1, mode: 0 }],
    {
      enemyShaman: null,
      enemyBuildings: [],
      regionFlags: () => 0,
      categoryFlags: () => 1,
      cast: (model, cell) => {
        casts.push([model, cell])
        beginCast(aiLive, aiShaman, 'hypnotise', nativeCellPoint(cell))
      },
    }
  )
  assert.deepEqual(casts, [[7, targetCell]])
  assert.equal(aiLive.projectiles[0]?.spell, 'hypnotise')
  for (let i = 0; !aiLive.units.some(u => u.hypnotise) && i < 100; i++) tick(aiLive, 1 / 12)
  assert.ok(
    !aiLive.units.includes(aiTarget) &&
      aiLive.units.some(u => u.team === 'red' && u.hypnotise?.originalTeam === 'blue')
  )

  delete w.shots.hypnotise
  delete w.giftCounts.hypnotise
  migrateCheckpoint(w)
  assert.equal(w.shots.hypnotise, 0)
  assert.equal(w.giftCounts.hypnotise, 0)
})
