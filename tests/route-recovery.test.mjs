import test from 'node:test'
import assert from 'node:assert/strict'
import { initializeRouteRecovery, stepRouteRecovery } from '../app/person-route-recovery.ts'
import captures from './fixtures/route-recovery.json' with { type: 'json' }
import { createWorld, addUnit, addBuilding, command, tick, GRID } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { advanceGame } from '../app/game-clock.ts'
import { AUDIO_CUES } from '../app/audio.ts'

test('failed-route initialization and retries match native fields, timing and ordered consumers', () => {
  for (const { input, expected } of captures) {
    const c = structuredClone(input), p = c.p, events = []
    const log = (name, ...args) => events.push([name, ...args, structuredClone(p)])
    const e = {
      animation: (_, object) => log('animation', object & 65535), release: () => log('release'),
      sound: cue => log('sound', cue), notify: (flags, message) => log('notify', flags, message),
      unsupportedGround: () => c.unsupported, adjacentBuilding: () => { log('adjacentBuilding'); return c.building },
      build: option => { log('build', option); return c.route }, clearFailure: id => log('clearFailure', id),
      attach: id => log('attach', id), initialize: () => log('initialize'),
    }
    ;(c.mode === 'initialize' ? initializeRouteRecovery : stepRouteRecovery)(c.w, p, e)
    assert.deepEqual({ p, events }, expected)
  }
})

function islands(count = 6, kind = 'warrior', team = 'red') {
  const w = createWorld()
  Object.assign(w, { units: [], buildings: [], trees: [], shrines: [] })
  w.manaWorld.gameFlags = 96
  w.terrain.fill(0)
  for (let z = -9; z <= 9; z++) for (let x = -29; x <= 29; x++)
    if (x <= -10 || x >= 10) w.terrain[(z + 48) * GRID + x + 48] = 3
  w.terrainVersion++
  const b = addBuilding(w, team, 'hut', { x: 20, z: 0 })
  const units = Array.from({ length: count }, (_, i) => addUnit(w, 'blue', kind, { x: -20, z: i / 4 }))
  w.selected = units.map(u => u.id)
  command(w, b, { ctrlKey: true })
  command(w, { x: 20, z: 6 })
  return { w, b, units, people: units.map(u => u.native) }
}
function until(w, done, limit = 1800) {
  for (let i = 0; i < limit && !done(); i++) tick(w, 1 / 12)
  assert.ok(done(), 'scenario completes')
}

test('disconnected groups stop, retain shared attack/waypoint orders, retry and resume after land connects', () => {
  const { w, b, units, people } = islands()
  const ids = people[0].commands.filter(Boolean)
  until(w, () => people.every(p => p.state === 33))
  assert.ok(people.every(p => !p.speed && !p.motionGroup))
  assert.ok(ids.every(id => w.buildingOrders.records[id].references === 6))
  assert.ok(w.sounds.some(s => s.cue === 225))
  assert.deepEqual(w.tutorialNotices, [{ flags: 0x200000, message: 603 }])
  const points = units.map(u => [u.x, u.z])
  until(w, () => people.every(p => p.substate === 3), 100)
  assert.deepEqual(units.map(u => [u.x, u.z]), points)
  w.terrain.fill(3); w.terrainVersion++
  until(w, () => people.every(p => p.state === 10), 150)
  assert.ok(units.every((u, i) => u.native === people[i]))
  assert.ok(people.every(p => currentPersonOrder(w.buildingOrders, p).model === 19))
  until(w, () => !w.buildingOrders.active)
  assert.equal(b.hp, 0)
  assert.ok(units.every(u => u.hp > 0 && u.x > 18 && u.z > 3))
  assert.ok(ids.every(id => !w.buildingOrders.records[id].references))
})

test('new orders and death release blocked commands; shaman failures use their own original voice', () => {
  for (const action of ['replace', 'death']) {
    const { w, units: [u], people: [p] } = islands(1, 'shaman')
    until(w, () => p.state === 33)
    assert.ok(w.sounds.some(s => s.cue === 226))
    const ids = p.commands.filter(Boolean)
    if (action === 'replace') { w.selected = [u.id]; command(w, { x: -22, z: 4 }) }
    else u.hp = 0
    tick(w, 1 / 12)
    assert.ok(ids.every(id => !w.buildingOrders.records[id].references))
    assert.equal(w.buildingOrders.active, action === 'replace' ? 1 : 0)
    if (action === 'replace') {
      until(w, () => !w.buildingOrders.active)
      assert.ok(u.x < -20 && u.z > 2)
    }
  }
  for (const cue of [45, 46, 47, 48, 225, 226]) assert.ok(AUDIO_CUES.includes(cue), `voice ${cue} must be preloaded`)
})

test('blocked groups retry on simulation counters, with identical recovery and combat at 5–240 Hz', () => {
  const run = schedule => {
    const { w } = islands(), clock = { animationTime: 0, animationFrame: 0 }
    let elapsed = 0, frame = 0
    for (const end of [8, 60]) {
      while (elapsed < end - 1e-9) {
        const dt = Math.min(end - elapsed, schedule[frame++ % schedule.length])
        advanceGame(w, clock, dt); elapsed += dt
      }
      if (end === 8) { w.terrain.fill(3); w.terrainVersion++ }
    }
    assert.equal(w.buildingOrders.active, 0)
    return { ...w, pendingTime: 0 }
  }
  const baseline = run([1/60])
  for (const schedule of [[1/5], [1/30], [1/120], [1/144], [1/240], [.003,.7,.02,.16]]) assert.deepEqual(run(schedule), baseline)
})


test('blocked building-entry owners resume the same person and finish ordinary admission', () => {
  const { w, b, units: [u] } = islands(1, 'brave', 'blue')
  const p = u.entry.person, ids = p.commands.filter(Boolean)
  until(w, () => p.state === 33 && p.substate === 3, 100)
  assert.equal(u.native, null)
  assert.ok(ids.every(id => w.buildingOrders.records[id].references === 1))
  w.terrain.fill(3); w.terrainVersion++
  until(w, () => p.state === 10)
  assert.equal(u.entry.person, p)
  until(w, () => u.inside === b.id)
  assert.equal(w.buildingOrders.active, 0)
  assert.ok(ids.every(id => !w.buildingOrders.records[id].references))
})
