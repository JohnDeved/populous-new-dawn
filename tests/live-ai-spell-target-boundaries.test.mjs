import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { computerSelectionWorld, stepComputerSpells } from '../app/computer-runtime.ts'
import { chooseSpellTarget, summarizeSpellEnemies } from '../app/computer-spells.ts'

function mission10() {
  const w = createWorld(10, 'scalable')
  for (let n = 0; n < 100; n++) {
    assert.equal(w.status, 'playing')
    tick(w, 1 / 12)
    assert.equal(w.turn, n + 1)
  }
  return w
}

function projectedTargets() {
  const w = mission10()
  const u = w.units.find(u => u.id === 111)
  assert.deepEqual([u.team, u.kind], ['blue', 'warrior'])
  assert.equal(w.objectCells.objects.get(u.id), u.native)
  const { world } = computerSelectionWorld(w, 0, true)
  const p = world.people.find(person => person.id === u.id)
  assert.equal(p.model, 3)
  assert.equal(p.tribe, 0)
  const cells = new Map()
  const targetWorld = { tribe: 1, alliances: 0, cells, terrainFlags: () => 0 }
  // These are controlled arrangements of an authored, registered person’s
  // projection. They are not claimed as natural mission AI target layouts.
  const at = (cell, overrides) => ({ ...p, state: 17, x: (cell & 255) << 8,
    y: cell & 0xff00, flags2: 0, flags4: 0, disguise: 0, ...overrides })
  return { targetWorld, cells, at }
}

test('AI caster absence clears the live scan without changing its cached limit', () => {
  const w = mission10()
  const ownedShamans = w.units.filter(u => u.team === 'blue' && u.kind === 'shaman' && u.hp > 0)
  assert.equal(ownedShamans.length, 1)
  ownedShamans[0].hp = 0
  Object.assign(w.spellScan, { cursor: 8, limit: 23, paused: 1, targets: [0x0202, 0x0404, 0x0606, 0x0808] })
  const targets = w.spellScan.targets
  stepComputerSpells(w, 0)
  assert.equal(w.spellScan.targets, targets)
  assert.deepEqual([w.spellScan.cursor, w.spellScan.limit, w.spellScan.paused], [0, 23, 0])
  assert.deepEqual(targets, [0, 0, 0, 0])
})

test('AI enemy summary includes wrapped square edge, excludes allies and hidden people', () => {
  const { targetWorld, cells, at } = projectedTargets()
  const center = 0x0200, wrappedEdge = 0x00fe, beyondEdge = 0x00fc
  cells.set(wrappedEdge, [at(wrappedEdge), at(wrappedEdge, { flags4: 0x1000 })])
  cells.set(center, [at(center, { tribe: 1 })])
  cells.set(beyondEdge, [at(beyondEdge)])
  const read = () => {
    const s = summarizeSpellEnemies(targetWorld, center, 1)
    return [s.total, s.warriors, s.weight, s.requiredWarriors]
  }
  assert.deepEqual(read(), [1, 1, 12, 1])
  targetWorld.alliances = 1
  assert.deepEqual(read(), [0, 0, 0, 0])
})

test('AI Blast moves only to a strictly higher net target score', () => {
  const { targetWorld, cells, at } = projectedTargets()
  const center = 0x0200, neighbor = 0x02fe
  const scan = () => chooseSpellTarget(targetWorld, 2, center, null)
  cells.set(center, [at(center)])
  cells.set(neighbor, [at(neighbor)])
  assert.deepEqual(scan(), { accepted: true, cell: center })
  cells.get(neighbor).push(at(neighbor))
  assert.deepEqual(scan(), { accepted: true, cell: neighbor })
  cells.get(neighbor).push(at(neighbor, { tribe: 1 }))
  assert.deepEqual(scan(), { accepted: true, cell: center })
  cells.get(center).push(at(center, { flags2: 0x10000 }))
  cells.get(neighbor).push(at(neighbor, { flags4: 0x1000 }))
  assert.deepEqual(scan(), { accepted: false, cell: center })
})
