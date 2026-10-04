import assert from 'node:assert/strict'
import test from 'node:test'
import { createHutOccupancySmoke } from '../app/hut-occupancy-smoke.ts'
import {
  stepSecondaryEffects,
  reconcileWorldHutSmoke,
  restoreSecondaryEffects,
} from '../app/hut-smoke-runtime.ts'
import {
  allocateSecondaryEffect,
  createSecondaryEffects,
  releaseSecondaryEffect,
  rebuildSecondaryLists,
  secondaryEffectCount,
} from '../app/secondary-effects.ts'

// Inverse of the original 32-bit cosmetic generator. This is a supplied native
// conformance input; ordinary command/scene acceptance below does not reseed RNG.
const seedForOutput = output => {
  let a = 0x24a1n,
    b = 1n << 32n,
    x = 1n,
    y = 0n
  while (b) {
    const q = a / b
    ;[a, b] = [b, a % b]
    ;[x, y] = [y, x - q * y]
  }
  const rotated = ((output << 13) | (output >>> 19)) >>> 0
  return Number(BigInt.asUintN(32, (BigInt(rotated) - 0x24dfn) * x))
}
const children = w =>
  w.secondaryEffects.order
    .map(slot => w.secondaryEffects.slots[slot])
    .filter(entry => entry.kind === 'hutPuff')
function rootWorld({ phase = 7, reserved = 0, seed = seedForOutput(0x12345600) } = {}) {
  const owner = createSecondaryEffects(),
    building = {
      id: 4,
      kind: 'hut',
      team: 'blue',
      progress: 1,
      hp: 100,
      counter: 1,
      level: 1,
    }
  owner.reservations = Array.from({ length: reserved }, (_, i) => `panel:${i}`)
  const slot = allocateSecondaryEffect(owner, {
    kind: 'hutRoot',
    building: 4,
    counter: phase,
    position: { x: 8192, y: 12288, h: 400 },
  })
  assert.notEqual(slot, null)
  owner.roots[4] = { state: createHutOccupancySmoke(1, 3, 3, 0), slot }
  return {
    turn: 1,
    secondaryEffects: owner,
    effectCounter: 37,
    cosmeticRandom: { randomState: seed },
    randomState: 0xaabbccdd,
    buildings: [building],
    units: [],
    effects: [],
  }
}

test('full roots copy the allocation byte and defer newly prepended children', () => {
  const w = rootWorld()
  stepSecondaryEffects(w)
  assert.equal(children(w).length, 1)
  assert.equal(children(w)[0].counter, 37)
  assert.equal(children(w)[0].lifetime, 16)
  assert.deepEqual(children(w)[0].position, { x: 8192, y: 12288, h: 400 })
  assert.equal(w.effectCounter, 37)
  assert.equal(w.randomState, 0xaabbccdd)
  stepSecondaryEffects(w)
  assert.equal(children(w)[0].lifetime, 16, 'a second observation cannot repeat this turn')
  w.turn++
  stepSecondaryEffects(w)
  assert.equal(children(w)[0].counter, 38)
  assert.equal(children(w)[0].lifetime, 15)
})

test('all byte phases and low-five-bit outcomes use the proved root gate', () => {
  for (let phase = 0; phase < 256; phase++)
    for (let low = 0; low < 32; low++) {
      const output = 0x12345600 | low,
        seed = seedForOutput(output),
        w = rootWorld({ phase, seed })
      stepSecondaryEffects(w)
      const eligible = !((phase + 1) & 7)
      assert.equal(children(w).length, Number(eligible && low < 2))
      assert.equal(w.cosmeticRandom.randomState, eligible ? output : seed)
      assert.equal(w.effectCounter, 37)
    }
})

test('actual UI reservations participate in inclusive gates after the root RNG draw', () => {
  for (const reserved of [138, 139, 140, 150, 159]) {
    const w = rootWorld({ reserved })
    stepSecondaryEffects(w)
    assert.equal(children(w).length, Number(reserved + 1 <= 140))
    assert.equal(w.cosmeticRandom.randomState, 0x12345600)
    assert.equal(secondaryEffectCount(w.secondaryEffects), reserved + 1 + children(w).length)
  }
})

test('marker expiry and child allocation share the same newest-first traversal', () => {
  for (const markerFirst of [true, false]) {
    const w = rootWorld({ reserved: 139 }),
      owner = w.secondaryEffects,
      rootSlot = owner.roots[4].slot,
      root = owner.slots[rootSlot]
    if (!markerFirst) releaseSecondaryEffect(owner, rootSlot)
    w.effects.push({ id: 20, kind: 'orderMarker', age: 0, duration: 4 / 12, turnsRemaining: 1 })
    allocateSecondaryEffect(owner, { kind: 'orderMarker', effect: 20, counter: 37 })
    if (!markerFirst) owner.roots[4].slot = allocateSecondaryEffect(owner, root)
    stepSecondaryEffects(w)
    assert.equal(children(w).length, Number(markerFirst))
    assert.equal(w.effects.length, 0)
    assert.equal(w.cosmeticRandom.randomState, 0x12345600)
  }
})

test('children keep their own sixteen visits after the root is removed', () => {
  const w = rootWorld()
  stepSecondaryEffects(w)
  const serial = children(w)[0].serial
  reconcileWorldHutSmoke(w, w.buildings[0])
  assert.equal(w.secondaryEffects.roots[4].state.root, null)
  for (let visit = 1; visit <= 16; visit++) {
    w.turn++
    stepSecondaryEffects(w)
    assert.equal(
      children(w).some(puff => puff.serial === serial),
      visit < 16
    )
  }
})

test('native free-list reuse and checkpoint reconstruction preserve physical slot ownership', () => {
  const state = createSecondaryEffects(),
    allocated = []
  for (let n = 0; n < 160; n++)
    allocated.push(allocateSecondaryEffect(state, { kind: 'orderMarker', effect: n, counter: 37 }))
  assert.deepEqual(
    allocated,
    Array.from({ length: 160 }, (_, i) => 159 - i)
  )
  assert.equal(
    allocateSecondaryEffect(state, { kind: 'orderMarker', effect: 999, counter: 37 }),
    null
  )
  for (const slot of [159, 70, 2]) releaseSecondaryEffect(state, slot)
  for (const slot of [2, 70, 159])
    assert.equal(
      allocateSecondaryEffect(state, { kind: 'orderMarker', effect: 999, counter: 37 }),
      slot
    )
  const counters = state.slots.map(entry => entry.counter)
  rebuildSecondaryLists(state)
  assert.deepEqual(
    state.order,
    Array.from({ length: 160 }, (_, i) => 159 - i)
  )
  assert.deepEqual(
    state.slots.map(entry => entry.counter),
    counters
  )
})

test('panel and preview reservations are derived from live adapter owners', async () => {
  const { syncSecondaryReservations } = await import('../app/scene-secondary-effects.ts')
  const world = { secondaryEffects: createSecondaryEffects() },
    scene = {
      world,
      objectPanels: {
        panels: new Map([
          [10, {}],
          [11, {}],
        ]),
      },
      buildingPanels: new Map([
        [20, { hidden: false }],
        [21, { hidden: true }],
      ]),
      cursor: { visible: true },
    }
  syncSecondaryReservations(scene)
  assert.deepEqual(world.secondaryEffects.reservations, [
    'object-panel:10',
    'object-panel:11',
    'building-panel:20',
    'placement-preview',
  ])
  scene.objectPanels.panels.clear()
  scene.buildingPanels.get(20).hidden = true
  scene.cursor.visible = false
  syncSecondaryReservations(scene)
  assert.deepEqual(world.secondaryEffects.reservations, [])
})

test('legacy marker overflow cannot leave ownerless immortal effects after restore', () => {
  const world = {
    turn: 0,
    effectCounter: 37,
    buildings: [],
    effects: Array.from({ length: 161 }, (_, id) => ({
      id,
      kind: 'orderMarker',
      age: 0,
      duration: 4 / 12,
      turnsRemaining: 4,
    })),
  }
  restoreSecondaryEffects(world)
  assert.equal(world.effects.length, 160)
  assert.equal(world.secondaryEffects.order.length, 160)
  for (let turn = 1; turn <= 4; turn++) {
    world.turn = turn
    stepSecondaryEffects(world)
  }
  assert.deepEqual(world.effects, [])
  assert.deepEqual(world.secondaryEffects.order, [])
  assert.equal(world.secondaryEffects.free.length, 160)
})
