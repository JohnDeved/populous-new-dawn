import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { deserialize, serialize } from 'node:v8'
import { createHash } from 'node:crypto'
import { createWorld, addUnit, addBuilding } from '../app/model.ts'
import { createLivePerson } from '../app/live-people.ts'
import { stepFirewarriorShots } from '../app/firewarrior.ts'
import { launchFirewarriorPoint } from '../app/firewarrior-point.ts'
import { effect, sound } from '../app/world-effects.ts'
import { browserPosition, nativeStep3D } from '../app/world-coordinates.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import { normalizeHistoricalFixture } from './helpers/historical-checkpoint.ts'
import { advanceGame } from '../app/game-clock.ts'

test('explicit celebration pair preserves native point height, support offset, allocation sides and non-damaging arrival', () => {
  for (const supportHeight of [0, 64]) {
    const w = createWorld(),
      u = addUnit(w, 'blue', 'firewarrior', { x: 0, z: 0 }),
      p = createLivePerson(w, u)
    u.native = p
    p.heading = 768
    p.supportHeight = supportHeight
    if (supportHeight) p.flags3 |= 0x80000
    const target = { ...nativeStep3D(p, p.heading, 512, 1280), h: p.h + 3072 }
    const victim = addUnit(w, 'red', 'brave', browserPosition(target)),
      building = addBuilding(w, 'red', 'hut', browserPosition(target), true)
    const hp = [victim.hp, building.hp],
      mana = structuredClone(w.manaTribes),
      spells = structuredClone(w.shots),
      random = w.randomState
    w.effects = []
    w.sounds = []
    launchFirewarriorPoint(w, u, p, target, { effect, sound })
    const shots = w.effects.filter(e => e.firewarriorShot)
    assert.equal(shots.length, 2)
    assert.equal(new Set(shots.map(e => e.id)).size, 2)
    assert.deepEqual(
      shots.map(e => e.firewarriorShot.target),
      [0, 0]
    )
    assert.deepEqual(
      shots.map(e => e.firewarriorShot.impact),
      [false, true]
    )
    for (const [i, fx] of shots.entries()) {
      const pos = nativeStep3D(p, p.heading + [-1, 1][i] * 512, 512, 96)
      pos.h = Math.max(pos.h, terrainPointHeight(w.land, pos)) + supportHeight + 16
      assert.deepEqual({ x: fx.x, z: fx.z }, browserPosition(pos))
      assert.equal(fx.height, pos.h / 45)
      assert.deepEqual(fx.firewarriorShot.destination, target)
    }
    assert.deepEqual(
      w.sounds.map(s => s.cue),
      [161, 161]
    )
    assert.equal(p.disguise, supportHeight ? 3 : 25)
    assert.equal(u.cooldown, p.disguise / 12)
    const twin = deserialize(serialize(w))
    let turns = 0,
      trailCount = 0
    while (w.effects.some(e => e.firewarriorShot && e.duration === Infinity) && turns++ < 100) {
      stepFirewarriorShots(w)
      stepFirewarriorShots(twin)
      assert.deepEqual(w, twin)
      trailCount = w.effects.filter(e => e.animation?.object === 314).length
      w.effects = w.effects.filter(e => !e.firewarriorShot || e.duration === Infinity)
      twin.effects = twin.effects.filter(e => !e.firewarriorShot || e.duration === Infinity)
    }
    assert.ok(turns < 100)
    assert.ok(trailCount > 2)
    assert.equal(w.sounds.filter(s => s.cue === 178).length, 1)
    assert.deepEqual([victim.hp, building.hp], hp)
    assert.deepEqual(w.manaTribes, mana)
    assert.deepEqual(w.shots, spells)
    assert.equal(w.randomState, random)
    assert.equal(
      w.effects.some(e => e.kind === 'hit'),
      false
    )
  }
})

test('genuine M17 won6784 passes prior celebration throw with physical sky shots and historical clone/normalization twins', () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL('../references/fixtures/m17-celebration/won-terminal.v8.gz', import.meta.url)
    )
  )
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    '446756fc1241f1a0a52f2a87f096788321e6022b15ec48d4c4e181c191dc0538'
  )
  const w = normalizeHistoricalFixture(deserialize(bytes)),
    twin = normalizeHistoricalFixture(structuredClone(w))
  assert.equal(w.turn, 6784)
  assert.equal(w.status, 'won')
  const clock = () => ({
      animationTime: 0,
      animationFrame: 0,
      afterTurn() {},
      presentationHidden: () => false,
    }),
    a = clock(),
    b = clock()
  const ids = new Set(),
    retired = new Set()
  let previous = []
  for (let i = 0; i < 80; i++) {
    advanceGame(w, a, 1 / 12)
    advanceGame(twin, b, 1 / 12)
    assert.deepEqual(w, twin)
    const shots = w.effects.filter(e => e.firewarriorShot?.point)
    for (const fx of shots) {
      ids.add(fx.id)
      assert.equal(fx.firewarriorShot.target, 0)
      assert.equal(fx.firewarriorShot.destination.h > 1000, true)
    }
    for (const id of previous) if (!shots.some(e => e.id === id)) retired.add(id)
    previous = shots.map(e => e.id)
    assert.equal(w.status, 'won')
    assert.equal(w.units.filter(u => u.hp > 0 && u.team !== 'blue').length, 0)
  }
  assert.ok(ids.size >= 2)
  assert.ok(retired.size >= 2)
  assert.equal(w.turn, 6864)
})

test('explicit wrapped point shots live beyond the ordinary sixteen-visit timeout and both retire on arrival', () => {
  const w = createWorld(),
    u = addUnit(w, 'blue', 'firewarrior', { x: 119, z: 0 }),
    p = createLivePerson(w, u)
  u.native = p
  p.heading = 512
  p.x = 65000
  Object.assign(u, browserPosition(p))
  const target = { x: (p.x + 12000) & 65535, y: p.y, h: p.h + 3072 }
  launchFirewarriorPoint(w, u, p, target, { effect, sound })
  const pair = w.effects.filter(e => e.firewarriorShot),
    ids = pair.map(e => e.id)
  for (let i = 0; i < 17; i++) stepFirewarriorShots(w)
  assert.ok(
    pair.every(e => e.duration === Infinity),
    'No inherited sixteen-turn expiry'
  )
  for (let i = 0; i < 100 && pair.some(e => e.duration === Infinity); i++) {
    stepFirewarriorShots(w)
    w.effects = w.effects.filter(e => !e.firewarriorShot || e.duration === Infinity)
  }
  assert.ok(pair.every(e => e.duration === e.age))
  assert.ok(ids.every(id => !w.effects.some(e => e.id === id)))
  assert.equal(w.sounds.filter(s => s.cue === 178).length, 1)
})

// Static 0x4bbf30 at 0x4bc059–0x4bc09a gates each separately sign-extended
// coordinate before wrapped distance. This is not a new native-execution claim.
test('point arrival rejects a close wrapped destination across either signed coordinate seam', () => {
  for (const axis of ['x', 'y']) {
    const w = createWorld(),
      u = addUnit(w, 'blue', 'firewarrior', { x: 0, z: 0 }),
      p = createLivePerson(w, u),
      start = { x: 0, y: 0, h: 128, [axis]: 32760 },
      destination = { x: 0, y: 0, h: 128, [axis]: -32760 }
    u.native = p
    w.land.heights.fill(128)
    w.landVersion = w.terrainVersion
    w.effects = []
    w.sounds = []
    launchFirewarriorPoint(w, u, p, destination, { effect, sound })
    const pair = w.effects.filter(fx => fx.firewarriorShot)
    for (const fx of pair) Object.assign(fx, browserPosition(start), { height: 128 / 45 })
    stepFirewarriorShots(w)
    assert.ok(
      pair.every(fx => fx.duration === Infinity),
      'wrapped distance alone cannot retire a shot'
    )
    assert.equal(w.sounds.filter(s => s.cue === 178).length, 0)
    stepFirewarriorShots(w)
    assert.ok(
      pair.every(fx => fx.duration === fx.age),
      'arrival resumes after crossing the signed seam'
    )
    assert.equal(w.sounds.filter(s => s.cue === 178).length, 1)
  }
})
