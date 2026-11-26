import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, browserPosition, cast, createWorld, nativePosition, tick } from '../app/model.ts'
import { createLivePerson, syncLivePersonCells } from '../app/live-people.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { rightClickSpellCharging } from '../app/spell-charging.ts'
import { SPELLS } from '../app/world-rules.ts'

const step = w => tick(w, 1 / 12)
function atTurn(w, turn) {
  const budget = turn - w.turn
  assert.ok(Number.isSafeInteger(budget) && budget >= 0 && budget <= 3000, 'bounded turn horizon')
  for (let i = 0; i < budget; i++) {
    assert.equal(w.status, 'playing', `world stopped before requested turn ${turn}`)
    const before = w.turn
    step(w)
    assert.equal(w.turn, before + 1, 'an ordinary 12 Hz visit must advance exactly one turn')
  }
  assert.equal(w.turn, turn)
}
const coordinates = u => [u.x, u.z]

test('earned Mission 6 Lightning separates displaced aerial destination from the ground target', () => {
  const w = createWorld(6)
  const s = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const spell = SPELLS.find(x => x.id === 'lightning')
  const shot = () => w.projectiles.find(p => p.spell === 'lightning')
  assert.equal(w.shots.lightning, 0)
  assert.ok(rightClickSpellCharging(w, spell, { ctrlKey: true, shiftKey: false }))
  atTurn(w, 2988)
  assert.equal(w.shots.lightning, 1)
  const aim = { x: 59, z: -61 }
  const ground = { x: 17152, y: 13568, h: 223 }
  assert.deepEqual(nativePosition(w, aim), ground)
  assert.ok(cast(w, 'lightning', aim))
  assert.equal(w.shots.lightning, 0)
  atTurn(w, 2993)
  assert.equal(shot().phase, 'windup')
  assert.equal(shot().caster, s.id)
  assert.deepEqual(shot().destination, ground)
  step(w)
  assert.equal(shot().phase, 'flying')
  assert.deepEqual(shot().origin, { x: 15104, y: 13708, h: 288 })
  assert.deepEqual(shot().destination, { x: 15619, y: 13666, h: 1247 })
  assert.deepEqual(shot().target, aim, 'the projectile does not overwrite the later ground target')
  atTurn(w, 2996)
  assert.equal(shot(), undefined)
  const bolt = w.effects.find(f => f.lightning?.tribe === 0)?.lightning
  assert.deepEqual(bolt?.target, ground)
  assert.ok(bolt.start.h > ground.h + 900)
})

test('Mission 6 Teleport with supplied stock moves the registered Shaman on visit 12', () => {
  const w = createWorld(6)
  atTurn(w, 100)
  const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  const person = shaman.native
  const origin = coordinates(shaman)
  assert.deepEqual(origin, [51, -61.546875])
  assert.equal(w.objectCells.objects.get(shaman.id), person)
  assert.equal(w.shots.teleport, 0)
  w.shots.teleport = 1 // Only availability is supplied; cast and effect are normal live calls.
  assert.ok(cast(w, 'teleport', { x: 57, z: -61 }))
  assert.equal(w.shots.teleport, 0)
  atTurn(w, 108)
  const fx = w.effects.find(e => e.teleport)
  assert.deepEqual(fx.teleport, { visits: 0, target: { x: 16640, y: 13568, h: 192 } })
  step(w)
  assert.equal(fx.teleport.visits, 1)
  const sparkle = w.effects.filter(e => e.animation?.object === 1288 && e.sprite?.sequence === 'sparkle')
  assert.deepEqual(sparkle.map(coordinates), [[57, -61]])
  atTurn(w, 119)
  assert.equal(fx.teleport.visits, 11)
  assert.deepEqual(coordinates(shaman), origin, 'no early relocation in the lowest non-negative band')
  assert.equal(w.effects.filter(e => e.sprite?.sequence === 'blastTrail').length, 0)
  step(w)
  assert.equal(w.turn, 120)
  assert.equal(w.effects.includes(fx), false)
  assert.deepEqual(coordinates(shaman), [57, -61])
  assert.equal(w.objectCells.objects.get(shaman.id), person, 'the same owner moved')
  assert.deepEqual([person.x & 65535, person.y & 65535], [16640, 13568])
  assert.equal(w.effects.filter(e => e.sprite?.sequence === 'blastTrail').length, 81)
})

test('Mission 6 live Hypnotise applies callbacks in reverse linked discovery, not distance order', () => {
  const w = createWorld(6)
  atTurn(w, 100)
  const center = { x: 16640, y: 13568 }
  const aim = browserPosition(center)
  // Controlled rival inputs; they run the normal world turns before selection.
  const offsets = [[-512, -512], [0, -512], [512, -512], [-512, 0], [0, 0], [512, 0], [0, 512]]
  const rivals = offsets.map(([dx, dy]) => {
    const u = addUnit(w, 'red', 'brave', browserPosition({ x: center.x + dx, y: center.y + dy }))
    u.native = createLivePerson(w, u)
    u.native.state = 30
    return u
  })
  syncLivePersonCells(w)
  assert.equal(w.shots.hypnotise, 0)
  w.shots.hypnotise = 1
  assert.ok(cast(w, 'hypnotise', aim))
  atTurn(w, 112)
  const fx = w.effects.find(e => e.kind === 'hypnotise')
  assert.equal(fx.turnsRemaining, 12)
  assert.equal(w.units.filter(u => u.hypnotise).length, 0)
  const admitted = [1, 2, 4, 5, 6].map(i => rivals[i])
  const discovery = [-2, 0, 2].flatMap(dy =>
    [-2, 0, 2].flatMap(dx => [...objectsInCell(w.objectCells, (0x40 + dx) | ((0x34 + dy) << 8))])
  ).filter(p => p.class === 1 && p.tribe === 1)
  assert.deepEqual(discovery.map(p => p.id), admitted.map(u => u.id))
  assert.ok(admitted.every(u => w.objectCells.objects.get(u.id) === u.native))
  const reversed = admitted.toReversed().map(coordinates)
  step(w)
  assert.equal(fx.turnsRemaining, 11)
  const changed = w.units.filter(u => u.hypnotise?.originalTeam === 'red').toSorted((a, b) => a.id - b.id)
  assert.deepEqual(changed.map(coordinates), reversed)
  assert.ok(changed.every(u => u.team === 'blue' && w.objectCells.objects.get(u.id) === u.native))
  assert.ok(admitted.every(u => !w.objectCells.objects.has(u.id) && !w.units.includes(u)))
  assert.ok([rivals[0], rivals[3]].every(u => w.units.includes(u) && u.team === 'red'))
})

test('cast witness reports a paused world instead of hanging', () => {
  const w = createWorld(6)
  atTurn(w, 100)
  w.paused = true
  assert.throws(() => atTurn(w, 101), /ordinary 12 Hz visit must advance exactly one turn/)
  assert.equal(w.turn, 100)
})
