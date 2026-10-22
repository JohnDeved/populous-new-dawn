import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { deserialize } from 'node:v8'
import { cast, spellTargetError } from '../app/live-command.ts'
import {
  landBridgeTargetAllowed,
  validateSpellTarget,
  createTribeCasting,
} from '../app/spell-casting.ts'
import { boardLiveVehicle, leaveLiveVehicle } from '../app/live-vehicles.ts'
import { nativePosition } from '../app/world-terrain-runtime.ts'
import { normalizeHistoricalFixture } from './helpers/historical-checkpoint.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

const target = { x: -87.21484375, z: 26.87109375 }
const archive = () => {
  const bytes = gunzipSync(
    readFileSync(
      new URL('../references/fixtures/m16-seated-casting/before-cast.v8.gz', import.meta.url)
    )
  )
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    '7585ea4141b940d88e29932e87eaa79e947b20e01a8bc849b15e0586e04ec119'
  )
  const w = normalizeHistoricalFixture(deserialize(bytes))
  return { w, u: w.units.find(u => u.id === 8286), v: w.vehicles.find(v => v.id === 8830) }
}
const terrainFlags = (w, point) => {
  const p = nativePosition(w, point),
    cell = ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
  return rules.terrainCategoryFlags[w.land.categories[cell] & 15]
}

// Native 004c24f0's final normal-mode branch; no original executable is run.
test('normal Bridge predicate shares vehicle/dry/override rules with recovered validator', () => {
  for (const flags of [0, 0x80000])
    for (const vehicle of [0, 17])
      for (const terrain of [0, 2]) {
        const expected = !(terrain & 2) && (!vehicle || !!flags)
        assert.equal(landBridgeTargetAllowed(flags, vehicle, terrain), expected)
        const p = {
          x: 0,
          y: 0,
          height: 0,
          flags2: 0,
          flags4: 0x2000000,
          state: 0,
          landIndex: vehicle,
          building: null,
          casting: createTribeCasting(false),
          playerType: 2,
        }
        assert.equal(
          validateSpellTarget(
            0,
            flags,
            { x: 0, y: 0 },
            p,
            12,
            { x: 0, y: 0 },
            terrain,
            false,
            false,
            {
              cursorBlocked: () => false,
              bridgeStart: () => ({ x: 0, y: 0 }),
              notify: () => assert.fail('pure validation'),
            }
          ),
          expected ? 1 : -3
        )
      }
})

test('unchanged historical seated Shaman rejects Bridge and repeated hover remains pure', () => {
  const { w, u } = archive()
  assert.equal(w.turn, 26250)
  assert.equal(u.native.state, 30)
  assert.equal(u.native.vehicle, 8830)
  assert.equal(w.shots.bridge, 0, 'archive proves validity, not an earned Bridge cast')
  assert.equal(terrainFlags(w, target) & 2, 0)
  // nativePosition performs existing terrain synchronization; warm it before purity comparison.
  spellTargetError(w, 'bridge', target)
  const before = structuredClone(w)
  for (let i = 0; i < 12; i++) assert.equal(spellTargetError(w, 'bridge', target)?.code, -3)
  assert.deepEqual(w, before)
  assert.equal(
    spellTargetError(
      w,
      'tornado',
      w.buildings.find(b => b.id === 281)
    ),
    null
  )
})

test('synthetic one-stock clone rejects without debit, projectile, order or passenger mutation', () => {
  const { w, u, v } = archive()
  // Explicit component supply, not original earned-stock evidence.
  w.shots.bridge = 1
  const before = {
    shots: w.shots.bridge,
    mana: structuredClone(w.manaTribes),
    stocks: structuredClone(w.manaWorld.spells),
    projectiles: structuredClone(w.projectiles),
    orders: structuredClone(w.buildingOrders),
    person: structuredClone(u.native),
    vehicle: structuredClone(v),
  }
  for (const world of [w, structuredClone(w)]) {
    assert.equal(cast(world, 'bridge', target), false)
    assert.equal(world.shots.bridge, before.shots)
    assert.deepEqual(world.manaTribes, before.mana)
    assert.deepEqual(world.manaWorld.spells, before.stocks)
    assert.deepEqual(world.projectiles, before.projectiles)
    assert.deepEqual(world.buildingOrders, before.orders)
    assert.deepEqual(world.units.find(u => u.id === 8286).native, before.person)
    assert.deepEqual(
      world.vehicles.find(v => v.id === 8830),
      before.vehicle
    )
  }
})

test('supplied Boat and Balloon use live boarding/exit link; only seated Bridge is blocked', () => {
  for (const model of [1, 3]) {
    const { w, u, v } = archive(),
      p = u.native
    const origin = { x: p.x, y: p.y }
    leaveLiveVehicle(w, v, p, origin)
    // Supplied vehicle variant and stock exercise runtime consumers, not ordinary construction/acquisition.
    v.model = model
    v.active = true
    w.shots.bridge = 1
    assert.equal(boardLiveVehicle(w, p, v), true)
    assert.equal(p.vehicle, v.id)
    assert.equal(spellTargetError(w, 'bridge', target)?.code, -3)
    assert.equal(
      spellTargetError(
        w,
        'tornado',
        w.buildings.find(b => b.id === 281)
      ),
      null
    )
    const clone = structuredClone(w)
    assert.equal(spellTargetError(clone, 'bridge', target)?.code, -3)
    leaveLiveVehicle(w, v, p, nativePosition(w, target))
    assert.equal(p.vehicle, 0)
    assert.equal(spellTargetError(w, 'bridge', target), null)
    assert.equal(cast(w, 'bridge', target), true)
    assert.equal(w.shots.bridge, 0)
    assert.equal(w.projectiles.at(-1).spell, 'bridge')
  }
})

test('Bridge preserves wet/range precedence, override, alternate mode and native-owner fallback', () => {
  const { w, u } = archive()
  // Force existing native state10 fallback without allocating or replacing the owner.
  u.native.state = 10
  assert.equal(spellTargetError(w, 'bridge', target)?.code, -3)
  const far = { x: u.x + 100, z: u.z + 100 }
  assert.equal(spellTargetError(w, 'bridge', far)?.code, -2)
  // Supplied water category isolates precedence independently of this archive's dry island.
  const wet = { x: target.x + 2, z: target.z },
    n = nativePosition(w, wet),
    cell = ((n.y & 65535) >> 9) * 128 + ((n.x & 65535) >> 9)
  w.land.categories[cell] = rules.terrainCategoryFlags.findIndex(flags => flags & 2)
  assert.equal(spellTargetError(w, 'bridge', wet)?.message, 'Land Bridge must target dry terrain.')
  w.castingTribes[0].flags |= 0x80000
  assert.equal(spellTargetError(w, 'bridge', target), null)
  assert.equal(spellTargetError(w, 'bridge', wet)?.code, -3)
  w.castingTribes[0].flags = 0
  w.manaWorld.gameFlags |= 32
  assert.equal(spellTargetError(w, 'bridge', target), null)
  assert.equal(spellTargetError(w, 'bridge', wet)?.code, -3)
})

test('supplied ground and Tower occupancy without vehicle remain eligible', () => {
  const { w, u, v } = archive()
  leaveLiveVehicle(w, v, u.native, nativePosition(w, target))
  assert.equal(spellTargetError(w, 'bridge', target), null)
  const tower = w.buildings.find(b => b.kind === 'tower' && b.hp > 0)
  assert.ok(tower)
  // Component occupancy control, not an ordinary Tower admission claim.
  u.inside = tower.id
  u.native.flags2 |= 0x800000
  assert.equal(spellTargetError(w, 'bridge', target), null)
})

test('current-format in-session Save/Load retains supplied seated Bridge rejection', async () => {
  const { createGameStore } = await import('../app/game-store.ts')
  const { createLivePerson } = await import('../app/live-people.ts')
  const store = await createCampaignFixtureStore([22])
  assert.equal(store.startMission(22), true)
  const w = store.getWorld(),
    u = w.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    v = w.vehicles.find(v => v.model === 1)
  // Supplied boarding/stock isolates current-format persistence from route/acquisition evidence.
  u.native ??= createLivePerson(w, u)
  assert.equal(boardLiveVehicle(w, u.native, v), true)
  w.shots.bridge = 1
  let dry
  for (let dx = -8; dx <= 8 && !dry; dx += 2)
    for (let dz = -8; dz <= 8; dz += 2) {
      const p = { x: u.x + dx, z: u.z + dz }
      if (!(terrainFlags(w, p) & 2) && spellTargetError(w, 'bridge', p)?.code === -3) {
        dry = p
        break
      }
    }
  assert.ok(dry)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.equal(restored.units.find(person => person.id === u.id).native.vehicle, v.id)
  assert.equal(spellTargetError(restored, 'bridge', dry)?.code, -3)
  assert.equal(cast(restored, 'bridge', dry), false)
  assert.equal(restored.shots.bridge, 1)
  // Node has no IndexedDB here: this is the actual current in-session store, not persisted-disk proof.
})
