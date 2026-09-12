import assert from 'node:assert/strict'
import test from 'node:test'
import { createSwamp, excessSwamp, stepSwamp } from '../app/swamp.ts'
import { createLivePerson } from '../app/live-people.ts'
import { addUnit, cast, createWorld, tick } from '../app/model.ts'

const land = () => ({ cliffs: new Uint8Array(16384), categories: new Uint8Array(16384) })
const target = (id, fields = {}) => ({
  id,
  class: 1,
  flags2: 0,
  flags4: 0,
  attached: 0,
  immune: false,
  ...fields,
})

test('Swamp scans its native 3x3 footprint and honors victim and terrain gates', () => {
  const center = 0x8080,
    rows = new Map([[center, [target(1), target(2, { flags4: 0x800 }), target(3, { flags2: 2 }), target(4, { flags4: 0x400 }), target(5, { attached: 7 }), target(6, { immune: true }), target(7, { flags2: 0x100000 }), target(8, { class: 2 })]]]),
    events = []
  const swamp = { center: { x: 0x8080, y: 0x8080, h: 100 }, tribe: 0, counter: 0, remaining: 32000, kills: 0, variant: 0 }
  assert.ok(stepSwamp(land(), swamp, false, {
    cell: cell => rows.get(cell) ?? [],
    kill: p => events.push(['kill', p.id]),
    remove: p => events.push(['remove', p.id]),
    sound: () => events.push(['sound']),
  }))
  assert.deepEqual(events, [['sound'], ['kill', 1], ['remove', 2]])
  assert.equal(swamp.kills, 1)

  const flooded = land()
  flooded.categories.fill(1)
  const edge = { ...swamp, center: { x: 0, y: 0, h: 0 }, remaining: 100, kills: 0 }
  assert.equal(stepSwamp(flooded, edge, false, { cell: () => [], kill() {}, remove() {}, sound() {} }), false)
})

test('Swamp uses one RNG draw, scans every fourth visit, and expires at ten kills', () => {
  const game = { randomState: 0x12345678 },
    swamp = createSwamp({ x: 0, y: 0, h: 0 }, 2, 0, game),
    victims = Array.from({ length: 12 }, (_, id) => target(id + 1)),
    events = []
  assert.equal(game.randomState, 0x32be789b)
  for (let visit = 1; visit < 4; visit++) {
    swamp.counter = visit
    assert.ok(stepSwamp(land(), swamp, false, { cell: () => victims, kill: p => events.push(p.id), remove() {}, sound() {} }))
  }
  assert.deepEqual(events, [])
  swamp.counter = 4
  assert.equal(stepSwamp(land(), swamp, false, { cell: cell => cell === 0xfefe ? victims : [], kill: p => events.push(p.id), remove() {}, sound() {} }), false)
  assert.equal(swamp.kills, 10)
  assert.deepEqual(events, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

test('the thirtieth same-tribe Swamp discards the oldest remaining controller', () => {
  const traps = Array.from({ length: 30 }, (_, i) => ({
    center: { x: 0, y: 0, h: 0 }, tribe: 0, counter: i, remaining: 31970 + i, kills: 0, variant: 0,
  }))
  assert.equal(excessSwamp(traps), traps[0])
  traps.forEach(trap => { trap.remaining = 32000 })
  assert.equal(excessSwamp(traps), traps[29], 'newest-first native ties discard the new trap')
  assert.equal(excessSwamp(traps.slice(1)), null)
})

test('live Swamp casting kills through the ordinary corpse path independently of refresh rate', () => {
  const run = schedule => {
    const w = createWorld(),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    w.units = [shaman]
    Object.assign(shaman, { x: 0, z: 20, path: [], casting: null })
    const victim = addUnit(w, 'red', 'brave', { x: 1, z: 7 })
    victim.native = createLivePerson(w, victim)
    victim.native.state = 14
    const removed = addUnit(w, 'red', 'brave', { x: -1, z: 7 })
    removed.native = createLivePerson(w, removed)
    removed.native.flags4 |= 0x800
    w.selected = [shaman.id]
    w.shots.swamp = 1
    assert.ok(cast(w, 'swamp', { x: 0, z: 8 }))
    let elapsed = 0,
      frame = 0
    while (elapsed < 4 && w.units.includes(victim)) {
      const dt = schedule[frame++ % schedule.length]
      tick(w, dt)
      elapsed += dt
    }
    const controller = w.effects.find(f => f.swamp)
    assert.ok(controller)
    assert.ok(!w.units.includes(victim))
    assert.ok(!w.units.includes(removed))
    assert.equal(w.killCredits[0][1], 1)
    assert.equal(w.effects.filter(f => f.corpse?.remaining > 0).length, 1)
    assert.ok(w.sounds.some(sound => sound.cue === 0x7f))
    assert.ok(w.sounds.some(sound => sound.cue === 0xaa))
    return { turn: w.turn, shots: w.shots.swamp, kills: controller.swamp.kills, randomState: w.randomState }
  }
  const expected = run([1 / 60])
  for (const schedule of [[1 / 5], [1 / 144], [0.002, 0.04, 0.17, 0.3]])
    assert.deepEqual(run(schedule), expected)
})
