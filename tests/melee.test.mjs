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
    u.fight = { group: b.id, opponent: i ? defender.id : attacker.id, action: i === 1 ? 'ready' : 'strike', started: 0, remaining: 100 }
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
    assert.deepEqual(defender.fight, { ...original, remaining: original.remaining - 1 })
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

function recoil(slope = 0) {
  const { w, defender, attacker } = group('warrior', 0, 2)
  // A continuous ramp gives both terrain representations the same surface.
  w.terrain = w.terrain.map((_, i) => Math.max(3, 12 - Math.max(0, i % 97 - 48) * slope))
  w.terrainVersion++
  Object.assign(defender, { x: 180 / 256, heading: Math.PI * 1.5 })
  Object.assign(attacker, { x: 0, z: 0 })
  w.fights[0].members = [attacker.id, defender.id]
  attacker.fight.action = 'strike'; attacker.fight.remaining = 100
  defender.fight.action = 'push'; defender.fight.remaining = undefined
  w.randomState = 1
  return { w, defender, attacker }
}

function assertCells(w) {
  const visited = new Set()
  for (let id of w.objectCells.heads) while (id) {
    assert.ok(!visited.has(id), 'no duplicate or cyclic cell membership')
    visited.add(id)
    const p = w.objectCells.objects.get(id)
    assert.ok(p, 'every cell link resolves')
    id = p.cellNext
  }
  for (const u of w.units) if (u.flight) assert.ok(visited.has(u.id))
}

test('knockback waits for terrain physics to settle and preserves cell ownership', () => {
  const flat = recoil(), slope = recoil(2)
  for (let i = 0; i < 3; i++) { tick(flat.w, 1 / 12); tick(slope.w, 1 / 12); assertCells(slope.w) }
  assert.equal(flat.defender.fight.action, 'approach')
  assert.equal(flat.defender.flight, undefined)
  assert.equal(slope.defender.fight.action, 'push')
  assert.equal(slope.defender.fight.remaining, 0, 'the animation timer can finish before the slide')
  assert.ok(slope.defender.flight.flags2 & 0x80000)
  assert.ok(slope.defender.x > flat.defender.x)
  let turns = 3
  while (slope.defender.fight.action === 'push' && turns++ < 40) { tick(slope.w, 1 / 12); assertCells(slope.w) }
  assert.ok(turns > 3 && turns < 40)
  assert.equal(slope.defender.flight, undefined)
  assert.equal(slope.defender.fight.action, 'approach')
  assert.deepEqual([slope.w.fights[0].x, slope.w.fights[0].z], [1, -1], 'recovery recenters the fight on the native cell')
})

test('hits during knockback survive physics and player orders do not teleport the person', () => {
  const { w, defender, attacker } = group()
  for (const u of w.units) u.team = u.team === 'blue' ? 'red' : 'blue'
  defender.fight.action = 'push'; defender.fight.remaining = undefined
  w.randomState = 1
  tick(w, 1 / 12)
  assert.equal(defender.hp, 72)
  assert.equal(defender.flight.life, 1440, 'physics must not restore the pre-hit health')
  assert.equal(attacker.hp, 72, 'odd opportunistic choices still retaliate')
  assertCells(w)
  w.selected = [defender.id]
  const point = [defender.x, defender.z]
  command(w, { x: 12, z: 0 })
  assert.equal(defender.fight, null)
  assert.deepEqual([defender.x, defender.z], point)
  tick(w, 1 / 12)
  assert.equal(defender.flight, undefined)
  assertCells(w)
})

test('sliding recoil, native animation and recovery are independent of render cadence', async () => {
  const { advanceGame } = await import('../app/game-clock.ts')
  const run = frames => {
    const { w } = recoil(2), clock = { animationTime: 0, animationFrame: 0 }
    for (const dt of frames) advanceGame(w, clock, dt)
    assert.equal(clock.animationFrame, 48)
    assert.ok(w.pendingTime < 1e-9)
    return { ...w, pendingTime: 0 }
  }
  const baseline = run(Array(120).fill(1 / 60))
  for (const fps of [5, 30, 144, 240]) assert.deepEqual(run(Array(fps * 2).fill(1 / fps)), baseline, `${fps} Hz`)
  assert.deepEqual(run(Array.from({length: 20}, () => [.01, .09]).flat()), baseline, 'irregular frames')
})

test('shamans and the native level flag suppress ordinary attack knockback', () => {
  for (const kind of ['brave', 'warrior', 'shaman']) for (const flags of [0, 64]) {
    const { w, defender, attacker } = group(kind, 0, 2)
    defender.fight.action = 'ready'
    w.manaWorld.levelFlags |= flags
    tick(w, 1 / 12)
    assert.equal(defender.fight.action, 'attack')
    assert.equal(attacker.fight.action, 'recoil')
    assert.equal(attacker.fight.knockback, kind !== 'shaman' && !flags)
    assert.equal(attacker.fight.remaining, kind !== 'shaman' && !flags ? 3 : 6)
  }
})
