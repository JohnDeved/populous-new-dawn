import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, addUnit, tick, random, fightPosition, meleeDamage, command } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { automaticMeleeTarget } from '../app/live-combat.ts'
import { pursuitDestinationChanged } from '../app/person-routes.ts'

test('pursuit refresh uses the original inclusive axis threshold and signed coordinates', () => {
  const goal = { goalX: 1000, goalY: 2000 }
  for (const axis of ['x', 'y']) for (const sign of [-1, 1]) {
    for (const delta of [167, 168, 169]) {
      const target = { x: 1000, y: 2000 }; target[axis] += delta * sign
      assert.equal(pursuitDestinationChanged(goal, target, 224), delta >= 168)
    }
  }
  assert.equal(pursuitDestinationChanged({ goalX: 32767, goalY: 0 }, { x: 32768, y: 0 }, 224), true)
  assert.equal(pursuitDestinationChanged({ goalX: 65535, goalY: 0 }, { x: 0, y: 0 }, 224), false)
})

test('live pursuit updates before reaching the old destination and reuses unchanged routes', () => {
  const run = fps => {
    const w = createWorld(); w.units = []; w.buildings = []; w.shrines = []; w.terrain.fill(3); w.terrainVersion++
    const u = addUnit(w, 'blue', 'warrior', { x: 0, z: 0 })
    const enemy = addUnit(w, 'red', 'shaman', { x: 12, z: 0 })
    w.selected = [u.id]; command(w, enemy)
    const initial = w.pathfinding.people.get(u.id)
    assert.ok(initial)
    enemy.z = 167 / 256
    tick(w, 1 / 12)
    assert.equal(w.pathfinding.people.get(u.id), initial, 'small movement must not replan')
    enemy.z = 168 / 256
    tick(w, 1 / 12)
    assert.notEqual(w.pathfinding.people.get(u.id), initial, 'replan on the threshold, while still far away')
    assert.ok(u.x < 2)
    enemy.x = 8; enemy.z = 6
    for (let i = 0; i < fps; i++) tick(w, 1 / fps)
    assert.equal(u.target, enemy.id); assert.ok(u.z > 0)
    assert.deepEqual(u.path.at(-1), { x: 8, z: 6 })
    assert.equal(u.native, null, 'path refresh must not take over sprite ownership')
    const result = { x: u.x, z: u.z, path: u.path, randomState: w.randomState, routes: w.motionRoutes }
    w.selected = [u.id]; command(w, { x: -12, z: -6 }); tick(w, 1 / 12)
    assert.equal(u.target, null)
    assert.deepEqual(u.path.at(-1), { x: -12, z: -6 })
    return result
  }
  const expected = run(60)
  for (const fps of [5, 30, 120, 144, 240]) assert.deepEqual(run(fps), expected)
})

test('automatic engagement uses equal tribe ranges, whole cells and original scan cadence', () => {
  for (const team of ['blue', 'red']) {
    const w = createWorld(); w.units = []; w.buildings = []; w.turn = 4
    const u = addUnit(w, team, 'warrior', { x: 1.9, z: -1 })
    const enemy = addUnit(w, team === 'blue' ? 'red' : 'blue', 'brave', { x: 2.1, z: -1 })
    assert.equal(automaticMeleeTarget(w, u), enemy, 'idle scan crosses the neighboring cell')
    u.path = [{ x: -12, z: -1 }]
    assert.equal(automaticMeleeTarget(w, u), undefined, 'move order ignores the enemy across the cell edge, even at close range')
    enemy.x = .1
    assert.equal(automaticMeleeTarget(w, u), enemy, 'the entire current cell remains eligible')
    u.path = []; enemy.x = 5.9
    assert.equal(automaticMeleeTarget(w, u), enemy, 'idle range includes two cells on each side')
    enemy.x = 6
    assert.equal(automaticMeleeTarget(w, u), undefined)
    enemy.x = .1
    for (const turn of [5, 6, 7]) { w.turn = turn; assert.equal(automaticMeleeTarget(w, u), undefined) }
    w.turn = 8; assert.equal(automaticMeleeTarget(w, u), enemy)
    w.outcome.alliances[team === 'blue' ? 0 : 1] = team === 'blue' ? 2 : 1
    assert.equal(automaticMeleeTarget(w, u), undefined)
  }
})

test('native inhibition and pending scans apply without giving idle shamans automatic attacks', () => {
  const w = createWorld(); w.units = []; w.turn = 4
  const u = addUnit(w, 'blue', 'warrior', { x: 1, z: -1 })
  const enemy = addUnit(w, 'red', 'brave', { x: 1.5, z: -1 })
  u.native = createLivePerson(w, u)
  for (const flag of [4, 0]) {
    u.native.assignment = flag
    assert.equal(automaticMeleeTarget(w, u), flag ? undefined : enemy)
  }
  w.turn = 5; u.native.flags3 |= 0x800
  assert.equal(automaticMeleeTarget(w, u), enemy)
  assert.equal(u.native.flags3 & 0x800, 0)
  assert.equal(automaticMeleeTarget(w, u), undefined)
  w.turn = 8; u.native = null; u.kind = 'shaman'
  assert.equal(automaticMeleeTarget(w, u), undefined)
})

test('live move orders cross nearby enemies without the old distance interruption', () => {
  const w = createWorld(); w.units = []; w.buildings = []; w.terrain.fill(3); w.terrainVersion++
  const u = addUnit(w, 'blue', 'warrior', { x: 1.9, z: -1 })
  const enemy = addUnit(w, 'red', 'shaman', { x: 2.1, z: -1 })
  // The opposing shaman has no attack order, so only the moving follower can initiate.
  w.selected = [u.id]; command(w, { x: -12, z: -1 })
  w.turn = 3; tick(w, 1 / 12)
  assert.equal(u.fight, null); assert.equal(enemy.fight, null)
  assert.ok(u.x < 1.9); assert.ok(u.path.length)
  w.selected = [u.id]; command(w, enemy); tick(w, 1 / 12)
  assert.ok(u.fight, 'explicit attacks remain immediate between detection visits')
})

test('idle followers of either tribe pursue detected enemies at every render cadence', () => {
  const run = (team, frames) => {
    const w = createWorld(); w.units = []; w.buildings = []; w.terrain.fill(3); w.terrainVersion++
    const u = addUnit(w, team, 'warrior', { x: 1, z: -1 })
    const enemy = addUnit(w, team === 'blue' ? 'red' : 'blue', 'shaman', { x: 5, z: -1 })
    for (const dt of frames) tick(w, dt)
    assert.equal(u.target, enemy.id); assert.ok(u.x > 1); assert.ok(u.path.length)
    return { ...w, pendingTime: 0 }
  }
  for (const team of ['blue', 'red']) {
    const baseline = run(team, Array(60).fill(1 / 60))
    for (const fps of [5, 30, 144, 240]) assert.deepEqual(run(team, Array(fps).fill(1 / fps)), baseline)
    assert.deepEqual(run(team, Array.from({length: 10}, () => [.01, .09]).flat()), baseline)
  }
})

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
  for (const u of w.units) if (u.flight || u.fight?.motion) assert.ok(visited.has(u.id))
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

test('fight sites use the native 32-turn search and retain groups when no site is available', async () => {
  const { nativePosition, browserPosition } = await import('../app/model.ts')
  const { w } = group()
  tick(w, 1 / 12) // Synchronize the flat terrain before applying native cell restrictions.
  const b = w.fights[0], original = { x: b.x, z: b.z }, p = nativePosition(w, b)
  const cell = p => ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
  w.land.flags[cell(p)] |= 4
  w.turn = 30
  tick(w, 1 / 12)
  assert.deepEqual({ x: b.x, z: b.z }, original, 'no radial search on intervening turns')
  tick(w, 1 / 12)
  assert.notEqual(cell(nativePosition(w, b)), cell(p))
  assert.deepEqual({ x: b.x, z: b.z }, browserPosition(nativePosition(w, b)))
  const relocated = { x: b.x, z: b.z }
  w.land.flags.fill(4); w.turn = 63
  tick(w, 1 / 12)
  assert.deepEqual({ x: b.x, z: b.z }, relocated)
  assert.equal(w.fights.length, 1, 'failed searches keep the fight alive')
  assert.ok(w.units.every(u => u.fight?.group === b.id))
  for (let i = 1; i < 16; i++) assert.equal(w.indexedSearch[i * 12], 0, 'search slot released')
})

test('fight sites leave original building footprints even between periodic search visits', async () => {
  const { nativePosition, browserPosition, buildingPose } = await import('../app/model.ts')
  const { buildingOutsidePoint } = await import('../app/building-shapes.ts')
  const building = createWorld().buildings[0], { w } = group()
  tick(w, 1 / 12)
  w.buildings = [building]
  const b = w.fights[0], p = nativePosition(w, b), i = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
  w.land.flags[i] |= 512; w.land.buildingIds[i] = building.id | 0xfc00
  tick(w, 1 / 12)
  assert.deepEqual({ x: b.x, z: b.z }, browserPosition(buildingOutsidePoint(buildingPose(building))))
})

test('sequential fight searches avoid other fight centers and release exhausted searches', async () => {
  const { relocateFight } = await import('../app/melee-placement.ts')
  const { createIndexedSearch } = await import('../app/indexed-search.ts')
  const rules = (await import('../app/original-rules.json', { with: { type: 'json' } })).default
  const category = rules.terrainCategoryFlags.findIndex(f => f & 1), search = createIndexedSearch()
  const fight = { id: 1, x: 256, y: 256, h: 100, angle: 512, counter: 0, model: 8, flags2: 0, flags4: 0, tribe: 255, workTarget: 0, target: 0 }
  const cell = p => ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
  let heights = 0
  const w = { search, collision: { cell: () => ({ flags: 0, category, building: 0 }), walkMask: new Uint8Array(8192).fill(255), objects: new Map(), boatAt: () => false }, occupied: (p, except) => { assert.equal(except, 1); return cell(p) === 0 }, outside: () => assert.fail('no building'), height: () => { heights++; return 100 } }
  for (let i = 1; i < 16; i++) search[i * 12] = 1
  relocateFight(w, fight)
  assert.equal(cell(fight), 0, 'allocation exhaustion retains the center')
  assert.equal(heights, 0)
  search.fill(0); relocateFight(w, fight)
  assert.notEqual(cell(fight), 0)
  assert.equal(heights, 1, 'only the accepted point is interpolated')
})

test('live groups relocate sequentially without sharing another fight center', async () => {
  const { nativePosition } = await import('../app/model.ts'), { w } = group()
  tick(w, 1 / 12)
  const first = w.fights[0], a = addUnit(w, 'blue', 'brave', { x: 0, z: 0 }), b = addUnit(w, 'red', 'warrior', { x: 180 / 256, z: 0 })
  const second = { ...first, id: w.nextId++, members: [a.id, b.id] }
  w.fights.push(second)
  for (const u of [a,b]) u.fight = { group: second.id, opponent: u === a ? b.id : a.id, action: 'strike', started: 0, remaining: 100 }
  const cell = f => { const p = nativePosition(w,f); return ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9) }
  const original = cell(first)
  w.turn = 31; tick(w, 1 / 12)
  assert.notEqual(cell(first), original)
  assert.equal(cell(second), original, 'later groups see the earlier group has vacated this cell')
  assert.equal(w.fights.length, 2)
})

function approachFixture(direction = 0) {
  const c = group('warrior', 0, 2)
  c.attacker.fight.action = 'approach'
  c.attacker.x += Math.cos(direction) * 2
  c.attacker.z += Math.sin(direction) * 2
  c.w.randomState = 1
  return c
}

test('native approach reaches its slot from every direction and waits one turn to chase a moved slot', () => {
  for (let direction = 0; direction < 8; direction++) {
    const { w, attacker } = approachFixture(direction * Math.PI / 4)
    const speeds = new Set()
    let turns = 0
    do { tick(w, 1 / 12); speeds.add(attacker.fight.motion.speed); assertCells(w) } while (attacker.fight.action !== 'ready' && ++turns < 24)
    assert.ok(turns < 24, `direction ${direction} must arrive without circling`)
    assert.ok(speeds.size > 2, 'approach redraws native speed on every visit')
    assert.deepEqual([attacker.x, attacker.z + 0], [180 / 256, 0])
    assert.equal(attacker.fight.motion.speed, 0)
    assert.ok(attacker.fight.motion.flags2 & 0x200, 'native arrival clamp retained')
    w.fights[0].x += .5
    const point = { x: attacker.x, z: attacker.z }
    tick(w, 1 / 12)
    assert.equal(attacker.fight.action, 'approach')
    assert.deepEqual({ x: attacker.x, z: attacker.z }, point, 'ready-to-approach transition does not move early')
    tick(w, 1 / 12)
    assert.ok(attacker.x > point.x)
  }
})

test('approach uses native cell collision and preserves the person across attack, recoil and new orders', async () => {
  const { nativePosition } = await import('../app/model.ts')
  const { w, attacker } = approachFixture()
  tick(w, 1 / 12)
  const p = attacker.fight.motion, before = [attacker.x, attacker.z]
  w.land.flags.fill(4)
  tick(w, 1 / 12)
  assert.deepEqual([attacker.x, attacker.z], before, 'native restricted cells block an otherwise dry browser surface')
  assert.equal(attacker.fight.motion, p)
  w.land.flags.fill(0)
  for (let i = 0; i < 12; i++) tick(w, 1 / 12)
  assert.equal(attacker.fight.action, 'ready')
  assert.equal(attacker.fight.motion, p)
  assertCells(w)
  w.selected = [attacker.id]
  const position = nativePosition(w, attacker)
  command(w, { x: 12, z: 0 })
  assert.equal(attacker.fight, null)
  assert.deepEqual(nativePosition(w, attacker), position)
  // Native command/engagement ownership remains separate: remove the nearby contact.
  w.units.find(u => u !== attacker).x = 30
  tick(w, 1 / 12)
  assert.ok(attacker.x > position.x / 256 - 8)
  assert.ok(!w.objectCells.objects.has(attacker.id), 'adapted ordinary order releases retained combat cells')
})

test('approach, native animation and subsequent combat stay identical across frame rates', async () => {
  const { advanceGame } = await import('../app/game-clock.ts')
  const run = frames => {
    const { w } = approachFixture(Math.PI / 4), clock = { animationTime: 0, animationFrame: 0 }
    for (const dt of frames) advanceGame(w, clock, dt)
    assert.ok(w.pendingTime < 1e-9)
    return { ...w, pendingTime: 0 }
  }
  const baseline = run(Array(180).fill(1 / 60))
  for (const fps of [5, 30, 144, 240]) assert.deepEqual(run(Array(fps * 3).fill(1 / fps)), baseline, `${fps} Hz`)
  assert.deepEqual(run(Array.from({length:30}, () => [.01, .09]).flat()), baseline)
})
