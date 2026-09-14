import assert from 'node:assert/strict'
import test from 'node:test'
import { createConvertWild, stepConvertWild } from '../app/convert-wild.ts'
import { processComputerSpells } from '../app/computer-spells.ts'
import { createTribeCasting } from '../app/spell-casting.ts'
import { addUnit, cast, command, createWorld, population, selectUnit, tick } from '../app/model.ts'
import { migrateCheckpoint } from '../app/game-store.ts'

test('Convert Wild scans, converts, animates, and casts through player and computer paths', () => {
  const center = { x: 0x8000, y: 0x8000, h: 100 },
    stranded = { ...center, id: 1, class: 1, model: 1 },
    recruit = { x: center.x + 256, y: center.y, h: 100, id: 2, class: 1, model: 1 },
    spell = createConvertWild(center, 0, 0, false),
    events = []
  assert.ok(
    stepConvertWild(
      spell,
      { randomState: 1 },
      {
        population: () => 1,
        people: cell => (cell === 0x8080 ? [stranded, recruit] : []),
        unsupported: person => person === stranded,
        strand: person => events.push(['strand', person.id]),
        suppressed: () => false,
        convert: person => events.push(['convert', person.id]),
        sparkle: (_position, turns) => events.push(['sparkle', turns]),
      }
    )
  )
  assert.deepEqual(events.slice(0, 2), [
    ['strand', 1],
    ['convert', 2],
  ])
  assert.equal(events.filter(event => event[0] === 'sparkle').length, 4)
  assert.equal(spell.remaining, 18)

  const w = createWorld(),
    shaman = w.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman'),
    enemy = w.units.find(unit => unit.team === 'red' && unit.kind === 'shaman')
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = [shaman, enemy]
  Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
  Object.assign(enemy, { x: 30, z: 30, path: [], casting: null })
  const wild = addUnit(w, 'wild', 'brave', { x: 0, z: 14 }),
    oldId = wild.id
  w.shots.convertWild = 1
  assert.ok(cast(w, 'convertWild', { x: 0, z: 14 }))
  for (let i = 0; w.units.some(unit => unit.team === 'wild') && i < 100; i++) tick(w, 1 / 12)
  const converted = w.units.find(unit => unit.team === 'blue' && unit.kind === 'brave')
  assert.ok(converted && converted.id !== oldId)
  assert.equal(converted.native.model, 2)
  assert.equal(converted.native.tribe, 0)
  assert.equal(population(w, 'blue'), 2)
  assert.equal(w.shots.convertWild, 0)
  assert.ok([0x85, 0xb4, 5].every(cue => w.sounds.some(sound => sound.cue === cue)))
  assert.ok(w.effects.some(effect => effect.kind === 'birth'))
  selectUnit(w, converted.id, false)
  assert.deepEqual(w.selected, [converted.id])
  assert.ok(command(w, { x: 2, z: 14 }))

  const wildPerson = id => ({
    id,
    class: 1,
    model: 1,
    state: 8,
    tribe: -1,
    x: 0,
    y: 0,
    flags2: 0,
    flags4: 0,
    assignment: 0,
    disguise: 0,
  })
  const aiWorld = {
      tribe: 1,
      alliances: 0,
      cells: new Map([[0, Array.from({ length: 5 }, (_, i) => wildPerson(i + 1))]]),
      terrainFlags: () => 0,
    },
    caster = {
      x: 0,
      y: 0,
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
  stock.stocks[17] = 1
  processComputerSpells(
    aiWorld,
    { cursor: 0, limit: 0, paused: 0, targets: [0, 0, 0, 0] },
    caster,
    {
      turn: 62,
      mana: 10000,
      reserve: 0,
      gameFlags: 0,
      aiFlags: 0x40,
      aiStates: 4,
      coordinateTarget: 0,
      blastFrequency: 0,
      stock,
    },
    [{ model: 0, mana: 0, people: 0, mode: 0 }],
    {
      enemyShaman: null,
      enemyBuildings: [],
      regionFlags: () => 0,
      categoryFlags: () => 1,
      cast: (...args) => casts.push(args),
    }
  )
  assert.deepEqual(casts, [[17, 0]])

  delete w.shots.convertWild
  delete w.giftCounts.convertWild
  migrateCheckpoint(w)
  assert.equal(w.shots.convertWild, 0)
  assert.equal(w.giftCounts.convertWild, 0)
})
