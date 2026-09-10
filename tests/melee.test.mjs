import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, tick, random, fightPosition, meleeDamage, command } from '../app/model.ts'

function group(kind = 'warrior', choice = 0, count = 3, offset = 0) {
  const w = createWorld()
  w.terrain.fill(3); w.terrainVersion++; w.units = []; w.buildings = []
  const defender = addUnit(w, 'red', 'warrior', { x: offset / 256, z: 0 })
  const attacker = addUnit(w, 'blue', kind, { x: 180 / 256, z: 0 })
  const members = [defender, attacker]
  for (let i = 2; i < count; i++) members.push(addUnit(w, 'blue', 'brave', { x: 0, z: 0 }))
  const b = { id: w.nextId++, x: 0, z: 0, angle: 512, members: members.map(u => u.id) }
  w.fights = [b]
  for (let i = 0; i < members.length; i++) {
    const u = members[i]
    if (i) Object.assign(u, fightPosition(b, i))
    u.fight = { group: b.id, opponent: i ? defender.id : attacker.id, action: i === 1 ? 'ready' : 'strike', started: 0, until: 100 }
    u.heading = .37
  }
  let seed = 0
  while ((random({ randomState: seed }) & 15) !== choice) seed++
  w.randomState = seed
  return { w, defender, attacker }
}

test('group attacks hit busy opponents without restarting their action or facing', () => {
  for (const kind of ['brave', 'warrior', 'shaman']) for (const count of [2, 3, 4]) for (let choice = 0; choice < 16; choice++) {
    const { w, defender, attacker } = group(kind, choice, count)
    const action = count > 2 && choice < 4 ? (choice & 1 ? 'strike' : 'special') : null
    const original = structuredClone(defender.fight), hp = defender.hp, attackerHp = attacker.hp
    const damage = meleeDamage(attacker), counter = meleeDamage(defender)
    tick(w, 1 / 12)
    assert.equal(attacker.fight.action, action ?? 'ready', `${kind}, ${count} fighters, choice ${choice}`)
    assert.equal(defender.hp, hp - (action ? damage : 0))
    assert.equal(attacker.hp, attackerHp - (action === 'strike' ? counter : 0))
    assert.deepEqual(defender.fight, original)
    assert.equal(defender.heading, .37)
  }
})

test('opportunistic reach is measured from the opponent slot with an exclusive 360-unit boundary', () => {
  for (const offset of [-361, -360, -359, 0, 359, 360, 361]) {
    const { w, defender } = group('warrior', 0, 3, offset)
    const hp = defender.hp
    tick(w, 1 / 12)
    assert.equal(defender.hp < hp, Math.abs(offset) < 360, `slot offset ${offset}`)
  }
})

test('group combat stays deterministic across render schedules and yields to player orders', () => {
  const baseline = group().w
  for (let i = 0; i < 24; i++) tick(baseline, 1 / 12)
  for (const fps of [5, 30, 60, 144, 240]) {
    const w = group().w
    for (let i = 0; i < fps * 2; i++) tick(w, 1 / fps)
    assert.deepEqual(w, baseline, `${fps} Hz`)
  }
  const { w, attacker } = group()
  tick(w, 1 / 12)
  w.selected = [attacker.id]
  command(w, { x: 12, z: 0 })
  assert.equal(attacker.fight, null)
  assert.ok(attacker.path.length)
})
