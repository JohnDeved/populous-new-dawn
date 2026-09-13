import assert from 'node:assert/strict'
import test from 'node:test'
import { processComputerSpells } from '../app/computer-spells.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { createLivePerson } from '../app/live-people.ts'
import { createTribeCasting } from '../app/spell-casting.ts'
import {
  addUnit,
  beginCast,
  campaignPersonCount,
  cast,
  command,
  createWorld,
  joinBattle,
  nativeCellPoint,
  population,
  tick,
} from '../app/model.ts'

test('Ghost Army casts, spawns native ghosts, accepts orders, vanishes in combat, and follows AI', () => {
  const w = createWorld(),
    blueShaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    redShaman = w.units.find(u => u.team === 'red' && u.kind === 'shaman')
  w.manaWorld.loadFlags |= 0x200
  w.terrain.fill(3)
  w.terrainVersion++
  w.units = [blueShaman, redShaman]
  Object.assign(blueShaman, { x: 0, z: 20, path: [], casting: null })
  Object.assign(redShaman, { x: 30, z: 30, path: [], casting: null })
  addUnit(w, 'blue', 'warrior', { x: 1, z: 13 })
  const populationBefore = population(w, 'blue'),
    campaignBefore = campaignPersonCount(w, 0)
  w.shots.ghostArmy = 1
  assert.ok(cast(w, 'ghostArmy', { x: 1, z: 13 }))
  for (let i = 0; !w.effects.some(fx => fx.ghostArmy) && i < 100; i++) tick(w, 1 / 12)
  const controller = w.effects.find(fx => fx.ghostArmy),
    trails = w.effects.filter(fx => fx.kind === 'trail').length
  assert.equal(controller.turnsRemaining, 5)
  tick(w, 1 / 12)
  assert.equal(controller.turnsRemaining, 4)
  assert.equal(w.effects.filter(fx => fx.kind === 'trail').length - trails, 81)
  tick(w, 4 / 12)

  const ghosts = w.units.filter(u => u.ghost)
  assert.equal(ghosts.length, 3)
  assert.ok(ghosts.every(u => u.kind === 'warrior' && u.team === 'blue'))
  assert.ok(ghosts.every(u => u.x >= 0 && u.x < 2 && u.z > 12 && u.z <= 14))
  assert.ok(ghosts.every(u => u.hp >= 67.5 && u.hp < 90))
  assert.ok(ghosts.every(u => u.native.flags4 & 0x800))
  assert.ok(ghosts.every(u => u.native.renderFlags & 0x4000))
  assert.equal(population(w, 'blue'), populationBefore)
  assert.equal(campaignPersonCount(w, 0), campaignBefore)
  assert.equal(w.shots.ghostArmy, 0)
  assert.ok(w.sounds.some(event => event.cue === 0x7d))
  assert.ok(w.sounds.some(event => event.cue === 0xa8))

  w.selected = ghosts.map(u => u.id)
  assert.ok(command(w, { x: 5, z: 13 }))
  assert.ok(ghosts.every(u => u.native.commands[0]))
  const enemy = addUnit(w, 'red', 'brave', ghosts[0])
  enemy.hp = 40
  joinBattle(w, ghosts[0], enemy)
  assert.equal(ghosts[0].hp, 0)
  assert.equal(enemy.hp, 40)
  assert.equal(w.fights.length, 0)
  tick(w, 1 / 12)
  assert.ok(!w.units.includes(ghosts[0]))
  assert.ok(!w.effects.some(fx => fx.unit?.team === 'blue' && fx.unit.kind === 'warrior'))

  const ai = createWorld(),
    aiShaman = ai.units.find(u => u.team === 'red' && u.kind === 'shaman'),
    targetCell = 0x202,
    stock = { available: 0, disabled: 0, stocks: Array(22).fill(0) },
    casts = []
  ai.manaWorld.loadFlags |= 0x200
  ai.terrain.fill(3)
  ai.terrainVersion++
  ai.units = [aiShaman]
  Object.assign(aiShaman, { x: -6, z: -10, path: [], casting: null })
  ai.manaWorld.spells[1].stocks[9] = stock.stocks[9] = 1
  ai.manaTribes[1].mana = 100000
  processComputerSpells(
    {
      tribe: 1,
      alliances: 0,
      cells: new Map([
        [
          targetCell,
          [
            {
              id: 1,
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
            },
          ],
        ],
      ]),
      terrainFlags: () => 0,
    },
    { cursor: 0, limit: 0, paused: 1, targets: [targetCell, 0, 0, 0] },
    {
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
    { turn: 16, mana: 100000, reserve: 0, gameFlags: 0, aiFlags: 0, blastFrequency: 0, stock },
    [{ model: 9, mana: 0, people: 1, mode: 0 }],
    {
      enemyShaman: null,
      enemyBuildings: [],
      regionFlags: () => 0,
      categoryFlags: () => 1,
      cast: (model, cell) => {
        casts.push([model, cell])
        beginCast(ai, aiShaman, 'ghostArmy', nativeCellPoint(cell))
      },
    }
  )
  assert.deepEqual(casts, [[9, targetCell]])
  for (let i = 0; !ai.units.some(u => u.ghost) && i < 100; i++) tick(ai, 1 / 12)
  assert.equal(ai.units.filter(u => u.ghost && u.kind === 'brave').length, 6)

  const capped = createWorld(),
    cappedBlue = capped.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    cappedRed = capped.units.find(u => u.team === 'red' && u.kind === 'shaman')
  capped.manaWorld.loadFlags |= 0x200
  capped.terrain.fill(3)
  capped.terrainVersion++
  capped.units = [cappedBlue, cappedRed]
  Object.assign(cappedBlue, { x: 0, z: 20, path: [], casting: null })
  Object.assign(cappedRed, { x: 30, z: 30, path: [], casting: null })
  const oldGhosts = Array.from({ length: 60 }, (_, i) => {
    const u = addUnit(capped, 'blue', 'brave', { x: i - 30, z: 13 })
    u.ghost = true
    u.native = createLivePerson(capped, u)
    return u
  })
  capped.shots.ghostArmy = 1
  assert.ok(cast(capped, 'ghostArmy', { x: 1, z: 13 }))
  for (let i = 0; !capped.units.some(u => u.ghost && !oldGhosts.includes(u)) && i < 100; i++)
    tick(capped, 1 / 12)
  assert.equal(capped.units.filter(u => u.ghost).length, 60)
  assert.equal(capped.units.filter(u => u.ghost && !oldGhosts.includes(u)).length, 6)
  const ghostBrave = capped.units.find(u => u.ghost && !oldGhosts.includes(u)),
    tree = capped.trees.find(tree => tree.logs > 0)
  capped.selected = [ghostBrave.id]
  assert.ok(command(capped, { ...tree, id: tree.id }))
  assert.equal(ghostBrave.tree, null)
  assert.ok(ghostBrave.native.commands.every(id => id === 0))

  delete w.shots.ghostArmy
  delete w.giftCounts.ghostArmy
  migrateCheckpoint(w)
  assert.equal(w.shots.ghostArmy, 0)
  assert.equal(w.giftCounts.ghostArmy, 0)
})
