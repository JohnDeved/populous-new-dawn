import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, createWorld, tick } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { startLiveCombatResponse } from '../app/live-building-combat.ts'
import { launchFirewarrior, stepFirewarriorShots } from '../app/firewarrior.ts'
import { launchFirewarriorPoint } from '../app/firewarrior-point.ts'
import { effect, sound } from '../app/world-effects.ts'
import { createGameStore } from '../app/game-store.ts'

// Native 0051fc6f..0051fc93 chooses 25/36, then SAR by the shipped shift 3,
// before storing the byte. These literal expectations are independent of the
// production expression. They prove reload values, not full native cadence.
for (const tower of [false, true]) for (const bloodlust of [0, 1, 1440]) {
  test(`${tower ? 'tower' : 'on-foot'} unit reload, Bloodlust=${bloodlust}`, () => {
    const w = createWorld(),
      source = addUnit(w, 'blue', 'firewarrior', { x: 0, z: 0 }),
      target = addUnit(w, 'red', 'brave', { x: 8, z: 0 })
    if (tower) source.inside = addBuilding(w, 'blue', 'tower', source, true).id
    source.bloodlust = bloodlust
    const randomState = w.randomState
    launchFirewarrior(w, source, target)
    assert.equal(source.cooldown, (tower ? (bloodlust ? 4 : 36) : (bloodlust ? 3 : 25)) / 12)
    assert.equal(w.randomState, randomState)
    assert.deepEqual(w.effects.filter(fx => fx.firewarriorShot).map(fx => [
      fx.firewarriorShot.target, fx.firewarriorShot.impact, fx.firewarriorShot.bloodlust,
    ]), [[target.id, false, !!bloodlust], [target.id, true, !!bloodlust]])
    // Expiry affects the next reload, without rescaling an already launched pair.
    source.bloodlust = 0
    launchFirewarrior(w, source, target)
    assert.equal(source.cooldown, (tower ? 36 : 25) / 12)
  })
}

async function sessionRoundTrip(w) {
  const store = createGameStore()
  store.change(world => Object.assign(world, structuredClone(w)))
  // Node has no IndexedDB: exercise the public current-format session Save
  // and Load, without claiming browser disk durability.
  assert.equal(await store.saveCheckpoint(), false)
  assert.equal(store.hasCheckpoint(), true)
  assert.equal(store.loadCheckpoint(), true)
  return store.getWorld()
}

for (const bloodlust of [false, true]) test(`point-target reload and current Save/Load, Bloodlust=${bloodlust}`, async () => {
  const w = createWorld(1, 'scalable'), source = addUnit(w, 'blue', 'firewarrior', { x: 0, z: 0 }),
    person = createLivePerson(w, source), randomState = w.randomState
  source.native = person
  if (bloodlust) person.flags3 |= 0x80000
  launchFirewarriorPoint(w, source, person, { x: person.x, y: person.y, h: person.h + 3072 }, { effect, sound })
  assert.equal(person.disguise, bloodlust ? 3 : 25)
  assert.equal(source.cooldown, (bloodlust ? 3 : 25) / 12)
  assert.equal(w.randomState, randomState)
  assert.ok(w.effects.filter(fx => fx.firewarriorShot).every(fx => fx.firewarriorShot.point))
  const restored = await sessionRoundTrip(w)
  assert.deepEqual(projection(restored, source.id), projection(w, source.id))
  for (let turn = 0; turn < 4; turn++) {
    stepFirewarriorShots(w)
    stepFirewarriorShots(restored)
    assert.deepEqual(projection(restored, source.id), projection(w, source.id))
  }
})

function scenario(tower, bloodlust) {
  // Controlled actors after ordinary startup; tower admission uses the public
  // command. This is a live consumer regression, not natural acquisition proof.
  const w = createStartedWorld(1, 'scalable')
  w.inputMask = 0
  w.manaWorld.gameFlags = 32
  retainFixtureUnits(w, () => false)
  const source = addUnit(w, 'blue', 'firewarrior', { x: 7, z: 33 })
  if (tower) {
    const building = addBuilding(w, 'blue', 'tower', { x: -2, z: 32 }, true, { angle: Math.PI })
    w.selected = [source.id]
    assert.equal(command(w, building), true)
    for (let i = 0; i < 300 && source.inside !== building.id; i++) tick(w, 1 / 12)
    assert.equal(source.inside, building.id)
    source.entry.person.flags3 &= ~0x800
  }
  source.bloodlust = bloodlust ? 1000 : 0
  const target = addUnit(w, 'red', 'brave', { x: source.x + 8, z: source.z })
  target.hp = target.shield = 1000
  if (!tower) {
    source.native = createLivePerson(w, source)
    source.native.state = 17
    source.native.flags3 |= 0x800
    assert.equal(startLiveCombatResponse(w, source), true)
  }
  return { w, source, target }
}

function projection(w, id) {
  const source = w.units.find(u => u.id === id), person = source.native ?? source.entry.person
  return {
    turn: w.turn, randomState: w.randomState, cooldown: source.cooldown,
    target: source.target, bloodlust: source.bloodlust,
    animation: [person.animationMode, person.timer, person.draw, person.f1, person.f2],
    health: w.units.map(u => [u.id, u.hp]),
    shots: w.effects.filter(fx => fx.firewarriorShot),
  }
}

for (const tower of [false, true]) for (const bloodlust of [false, true]) {
  test(`${tower ? 'tower' : 'on-foot'} actual volley timing and current Save/Load, Bloodlust=${bloodlust}`, async () => {
    const { w, source, target } = scenario(tower, bloodlust), seen = new Set(), launches = []
    const expected = tower ? (bloodlust ? [0, 8, 16] : [0, 36, 72]) : (bloodlust ? [0, 7, 13] : [0, 27, 55])
    const reload = tower ? (bloodlust ? 4 : 36) : (bloodlust ? 3 : 25)
    let restored, checkpointTaken = false
    for (let visit = 0; visit < 100 && launches.length < 3; visit++) {
      tick(w, 1 / 12)
      if (restored) {
        tick(restored, 1 / 12)
        assert.deepEqual(projection(restored, source.id), projection(w, source.id))
      }
      const shots = w.effects.filter(fx => fx.firewarriorShot?.source === source.id && !seen.has(fx.id))
      for (const shot of shots) seen.add(shot.id)
      if (shots.length) {
        launches.push(w.turn)
        assert.equal(shots.length, 2)
        assert.ok(shots.every(fx => fx.firewarriorShot.target === target.id))
        assert.equal(source.cooldown, reload / 12)
      }
      if (launches.length === 1 && w.turn - launches[0] === reload - 1) {
        assert.ok(source.cooldown > 0, 'the turn immediately before reload expiry cannot fire')
        restored = await sessionRoundTrip(w)
        assert.deepEqual(projection(restored, source.id), projection(w, source.id))
        checkpointTaken = true
      }
    }
    assert.equal(checkpointTaken, true)
    // Captured before the correction. Animation recovery, floating-point expiry
    // and tower scan phases remain authoritative; reload is not volley interval.
    assert.deepEqual(launches.map(turn => turn - launches[0]), expected)
  })
}
