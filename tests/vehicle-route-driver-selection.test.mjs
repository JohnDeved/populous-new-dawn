import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { createWorld } from '../app/world-initialization.ts'
import { createLivePerson, registerLivePerson } from '../app/live-people.ts'
import { clearLivePath } from '../app/live-pathfinding.ts'
import { boardLiveVehicle, liveVehicles, nearestLiveBoat } from '../app/live-vehicles.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Keep the complete private constructor. Only the build consumer is supplied:
// it invokes the actual findVehicle callback and selector, without route solving.
const source = stripTypeScriptTypes(readFileSync(new URL('../app/live-pathfinding.ts', import.meta.url), 'utf8'))
const starts = [...source.matchAll(/function routeContext\(/g)]
assert.equal(starts.length, 1)
const rest = source.slice(starts[0].index), end = rest.search(/\n}(?:\n|$)/)
assert.notEqual(end, -1)
const declaration = rest.slice(0, end + 2)

function scenario() {
  const w = createWorld(5), base = w.vehicles.find(v => v.model === 1),
    [ownUnit, newcomerUnit] = w.units.filter(u => u.team === 'blue' && u.kind === 'warrior'),
    enemyUnit = w.units.find(u => u.team !== 'blue' && u.team !== 'wild')
  assert.ok(base && ownUnit && newcomerUnit && enemyUnit)
  w.pathfinding.people.clear()
  const own = createLivePerson(w, ownUnit), enemy = createLivePerson(w, enemyUnit),
    newcomer = createLivePerson(w, newcomerUnit)
  assert.notEqual(enemy.tribe, newcomer.tribe)
  for (const [u, p] of [[ownUnit, own], [enemyUnit, enemy], [newcomerUnit, newcomer]]) {
    u.native = p
    w.pathfinding.people.set(p.id, p)
    registerLivePerson(w, p)
  }
  const make = (id, x) => ({ ...base, id, x, active: true, model: 1,
    passengers: [], passengerCount: 0, speed: 0, physics: 2, navigationFlags: 0, reservation: 0 }),
    hostile = make(base.id, base.x), friendly = make(base.id + 100000, (base.x + 1024) & 65535)
  w.vehicles = [hostile, friendly]
  for (const v of w.vehicles) {
    const i = ((v.y >>> 9) & 127) * 128 + ((v.x >>> 9) & 127)
    w.land.flags[i] = 0
    w.land.categories[i] = 2
  }
  assert.equal(boardLiveVehicle(w, enemy, hostile), true)
  assert.equal(boardLiveVehicle(w, own, friendly), true)
  return { w, ownUnit, enemyUnit, newcomerUnit, own, enemy, newcomer, hostile, friendly,
    center: { x: hostile.x, y: hostile.y } }
}
function retireRoutes(s) {
  clearLivePath(s.w, s.ownUnit)
  clearLivePath(s.w, s.enemyUnit)
  assert.equal(s.w.pathfinding.people.has(s.own.id), false)
  assert.equal(s.w.pathfinding.people.has(s.enemy.id), false)
  for (const [u, p, v] of [[s.ownUnit, s.own, s.friendly], [s.enemyUnit, s.enemy, s.hostile]]) {
    assert.equal(u.native, p)
    assert.equal(s.w.objectCells.objects.get(p.id), p)
    assert.equal(p.vehicle, v.id)
    assert.deepEqual(v.passengers, [p.id])
  }
}
function routeChoice(s) {
  let calls = 0
  const ports = {
    rules, liveVehicles, nearestLiveBoat, collisionWorld: () => ({}),
    buildPersonRoute: (routes, person, from, to, option, tribe, effects) => {
      calls++
      assert.equal(routes, s.w.motionRoutes)
      assert.equal(person, s.newcomer)
      return effects.findVehicle(person, s.center, 0, 4096)
    },
  }
  const context = new Function(...Object.keys(ports), `${declaration}\nreturn routeContext`)(...Object.values(ports)),
    before = structuredClone(s.w), ctx = context(s.w, s.newcomerUnit, s.newcomer),
    result = ctx.routeEffects.build(s.newcomer, { x: 0, y: 0 }, { x: 0, y: 0 })
  assert.equal(calls, 1)
  assert.deepEqual(s.w, before, 'constructor and selector leave authoritative state untouched')
  return result
}

test('standalone calls retain their existing active-route and missing-driver policy', () => {
  const s = scenario()
  assert.equal(nearestLiveBoat(s.w, s.newcomer, s.center, 0, 4096), s.friendly)
  retireRoutes(s)
  assert.equal(nearestLiveBoat(s.w, s.newcomer, s.center, 0, 4096), s.hostile)
})

test('actual selector honors an explicit driver view without changing the route map', () => {
  const s = scenario()
  retireRoutes(s)
  const people = new Map([[s.enemy.id, s.enemy], [s.own.id, s.own]]), before = structuredClone(s.w)
  assert.equal(nearestLiveBoat(s.w, s.newcomer, s.center, 0, 4096, people), s.friendly)
  assert.equal(nearestLiveBoat(s.w, s.newcomer, s.center, 0, 4096, new Map()), s.hostile,
    'an explicit empty view is respected, retaining the existing unknown-driver rule')
  assert.deepEqual(s.w, before)
})

for (const role of ['native', 'entry', 'builder']) test(`route selection uses the registered ${role} driver without an active route`, () => {
  const s = scenario()
  retireRoutes(s)
  if (role !== 'native') {
    s.enemyUnit.native = null
    s.enemyUnit[role] = { person: s.enemy }
  }
  assert.equal(routeChoice(s), s.friendly)
  assert.equal(s.w.pathfinding.people.has(s.enemy.id), false)
})

test('actual route retirement preserves seated ownership for the route selector callback', () => {
  const s = scenario(), seats = s.w.vehicles.map(v => [...v.passengers])
  assert.equal(routeChoice(s), s.friendly)
  retireRoutes(s)
  assert.equal(routeChoice(s), s.friendly)
  assert.deepEqual(s.w.vehicles.map(v => v.passengers), seats)
  assert.equal(s.enemyUnit.native, s.enemy)
  assert.equal(s.ownUnit.native, s.own)
})

test('the callback uses validated drivers instead of stale opposite-tribe route aliases', () => {
  const s = scenario()
  retireRoutes(s)
  const falseFriend = { ...s.enemy, tribe: s.newcomer.tribe }, falseEnemy = { ...s.own, tribe: s.enemy.tribe }
  s.w.pathfinding.people.set(s.enemy.id, falseFriend)
  s.w.pathfinding.people.set(s.own.id, falseEnemy)
  assert.equal(routeChoice(s), s.friendly)
  assert.equal(s.w.pathfinding.people.get(s.enemy.id), falseFriend)
  assert.equal(s.w.pathfinding.people.get(s.own.id), falseEnemy)
})

test('new route queries observe registered owner replacement and current tribe fields', () => {
  const s = scenario()
  retireRoutes(s)
  assert.equal(routeChoice(s), s.friendly)
  const replacement = { ...s.enemy, tribe: s.newcomer.tribe }
  s.enemyUnit.native = replacement
  registerLivePerson(s.w, replacement)
  assert.equal(routeChoice(s), s.hostile)
  replacement.tribe = s.enemy.tribe
  assert.equal(routeChoice(s), s.friendly)
  assert.equal(s.w.pathfinding.people.has(s.enemy.id), false)
})
