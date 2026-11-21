import assert from 'node:assert/strict'
import test from 'node:test'
import { addUnit, createWorld, nativePosition, tick } from '../app/model.ts'
import { campaignRules } from '../app/campaign-command-runtime.ts'
import { campaignInternal, withCampaignTribe } from '../app/campaign-runtime.ts'
import { migrateCheckpoint } from '../app/game-store.ts'
import { strikeLiveLightning, syncLivePersonCells } from '../app/live-people.ts'

const warnings = w => w.messages.slots.filter(Boolean).filter(m => [703, 704].includes(m.stringId))
const latch = (w, index) => w.campaignAIs[1].variables[index]
function observedTick(w) {
  const before = w.turn, serials = new Set(warnings(w).map(m => m.serial))
  tick(w, 1 / 12)
  for (const m of warnings(w).filter(m => !serials.has(m.serial))) {
    assert.equal((before + 1) & 63, 0, 'Red authored EVERY63 visit, not arbitrary wall time')
    assert.deepEqual(m.view, { cell: (30 << 8) | 72, payload: 850 })
    assert.equal(m.lifetime, 3000)
    assert.equal(m.flags & 0x3620, 0x3620, 'positioned message plus authored1180 flag')
  }
}
function throughNextCadence(w) {
  for (let n = 0; n < 64; n++) observedTick(w)
}

// Supplied counter controls are not a natural combat/playthrough witness.
test('M19 internal1178 reads only self-attributed Yellow deaths as an unsigned word', () => {
  const w = createWorld(19)
  w.killCredits = [[11,12,13,14],[21,22,65535,24],[31,32,33,34],[41,42,43,44]]
  for (const tribe of [1, 2])
    assert.equal(withCampaignTribe(w, tribe, () => campaignInternal(w, 1178)), w.killCredits[tribe][2])
  const restored = migrateCheckpoint(structuredClone(w))
  assert.deepEqual(restored.killCredits, w.killCredits)
})

test('M19 first distress keeps exact >2 boundary, Red ownership and one-shot checkpoint latch', () => {
  const w = createWorld(19)
  w.killCredits[1][2] = 2
  w.killCredits[0][2] = w.killCredits[1][0] = 50
  throughNextCadence(w)
  assert.equal(warnings(w).length, 0)
  w.killCredits[1][2] = 3
  const restored = migrateCheckpoint(structuredClone(w))
  for (let n = 0; n < 64; n++) { observedTick(w); observedTick(restored) }
  assert.deepEqual(restored, w)
  assert.equal(warnings(w).filter(m => m.stringId === 703).length, 1)
  assert.equal(latch(w, 16), 1)
  const delivered = migrateCheckpoint(structuredClone(w))
  const serial = delivered.messages.nextSerial
  throughNextCadence(delivered)
  assert.equal(delivered.messages.nextSerial, serial)
  assert.equal(latch(delivered, 16), 1)
})

// Evaluate the exact authored visit with supplied predicates. Ticking 64 turns
// after trimming population would let real housing births invalidate a 30-person boundary.
test('M19 second distress retains >25, population >30 and incomplete Firewarrior Hut protection', () => {
  for (const [kills, population, schoolProgress, expected] of [
    [25, 31, null, false],
    [26, 30, null, false],
    [26, 31, 0.1, false],
    [26, 31, 1, false],
    [26, 31, null, true],
  ]) {
    const w = createWorld(19)
    w.campaignAIs[1].variables[16] = 1
    w.killCredits[1][2] = kills
    const schools = w.buildings.filter(b => b.team === 'yellow' && b.kind === 'firewarriorHut')
    assert.ok(schools.length)
    if (schoolProgress === null) w.buildings = w.buildings.filter(b => !schools.includes(b))
    else for (const b of schools) b.progress = schoolProgress
    const red = w.units.filter(u => u.team === 'red' && u.hp > 0 && !u.ghost)
    assert.ok(red.length >= population)
    const excess = new Set(red.slice(population).map(u => u.id))
    w.units = w.units.filter(u => !excess.has(u.id))
    assert.equal(w.units.filter(u => u.team === 'red' && u.hp > 0 && !u.ghost).length, population)
    w.turn = 63
    withCampaignTribe(w, 1, () => campaignRules(w))
    const messages = warnings(w).filter(m => m.stringId === 704)
    assert.equal(messages.length, expected ? 1 : 0, JSON.stringify({ kills, population, schoolProgress }))
    assert.equal(latch(w, 15), expected ? 1 : 0)
    if (expected) {
      assert.deepEqual(messages[0].view, { cell: (30 << 8) | 72, payload: 850 })
      assert.equal(messages[0].lifetime, 3000)
      assert.equal(messages[0].flags & 0x3620, 0x3620)
      const restored = migrateCheckpoint(structuredClone(w)), serial = w.messages.nextSerial
      for (let n = 0; n < 64; n++) { observedTick(w); observedTick(restored) }
      assert.deepEqual(restored, w)
      assert.equal(w.messages.nextSerial, serial)
    }
  }
})

test('supplied Red Lightning uses ordinary damage/death cleanup before M19 distress delivery', () => {
  const w = createWorld(19)
  const victims = Array.from({ length: 3 }, () => addUnit(w, 'yellow', 'brave', { x: 0, z: 0 }))
  syncLivePersonCells(w)
  const before = w.killCredits[1][2]
  strikeLiveLightning(w, nativePosition(w, victims[0]), 1)
  assert.equal(w.killCredits[1][2], before, 'strike does not award premature kill credit')
  for (let n = 0; n < 128 && victims.some(v => w.units.includes(v)); n++) observedTick(w)
  assert.ok(victims.every(v => !w.units.includes(v)))
  assert.equal(w.killCredits[1][2], before + 3)
  throughNextCadence(w)
  assert.equal(warnings(w).filter(m => m.stringId === 703).length, 1)
  const restored = migrateCheckpoint(structuredClone(w))
  const credits = structuredClone(w.killCredits)
  for (let n = 0; n < 64; n++) { observedTick(w); observedTick(restored) }
  assert.deepEqual(restored, w)
  assert.deepEqual(w.killCredits, credits, 'retired victims never award duplicate credit')
})
