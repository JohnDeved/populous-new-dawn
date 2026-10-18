import assert from 'node:assert/strict'
import test from 'node:test'
import { population, populationLimit, breedingWork, addUnit } from '../app/world-state.ts'
import { createWorld, tick } from '../app/model.ts'
import constants from '../app/original-constants.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }

// Frozen numeric helpers from main 9cd97887. They intentionally retain the
// old filter/reduce allocations and do not call the optimized helpers.
const originalPopulation = (w, team) =>
  1 + w.units.filter(u => u.team === team && u.kind !== 'shaman' && !u.ghost && u.hp > 0).length
const originalLimit = (w, team) =>
  Math.min(
    200,
    6 +
      w.buildings
        .filter(b => b.team === team && b.kind === 'hut' && b.progress === 1 && b.hp > 0)
        .reduce(
          (sum, b) =>
            sum +
            [
              constants.MAX_POP_VALUE__HUT_1,
              constants.MAX_POP_VALUE__HUT_2,
              constants.MAX_POP_VALUE__HUT_3,
            ][b.level - 1],
          0
        )
  )
const originalWork = (w, b) =>
  Math.floor(
    (rules.hutBreedingWork[b.level - 1] *
      rules.breedingBands[Math.min(19, Math.floor(originalPopulation(w, b.team) / 10))]) /
      256
  )

test('population helpers match original roster semantics, capacity sums and breeding bands', () => {
  const teams = ['blue', 'red', 'yellow', 'green', 'wild']
  const w = { units: [], buildings: [] }
  for (let n = 0; n < 240; n++) {
    w.units.push({
      team: teams[n % teams.length],
      kind: n % 7 ? 'brave' : 'shaman',
      ghost: n % 11 === 0,
      hp: n % 13 ? 50 : 0,
    })
    w.buildings.push({
      team: teams[n % teams.length],
      kind: n % 5 ? 'hut' : 'camp',
      level: (n % 3) + 1,
      progress: n % 7 ? 1 : 0.5,
      hp: n % 11 ? 100 : 0,
    })
    for (const team of teams) {
      assert.equal(population(w, team), originalPopulation(w, team))
      assert.equal(populationLimit(w, team), originalLimit(w, team))
      for (const level of [1, 2, 3]) {
        const b = { team, level }
        assert.equal(breedingWork(w, b), originalWork(w, b))
        assert.equal(breedingWork(w, b, population(w, team)), originalWork(w, b))
      }
    }
  }
  // Capacity must saturate only after the same ordered sum; invalid model
  // levels retain the original NaN behavior rather than being silently clamped.
  w.buildings = Array.from({ length: 100 }, () => ({
    team: 'blue',
    kind: 'hut',
    level: 3,
    progress: 1,
    hp: 1,
  }))
  assert.equal(populationLimit(w, 'blue'), 200)
  w.buildings.push({ team: 'blue', kind: 'hut', level: 4, progress: 1, hp: 1 })
  assert.ok(Number.isNaN(populationLimit(w, 'blue')))
  assert.equal(population({ units: [] }, 'blue'), 1)
})

function twoHuts() {
  const w = createWorld()
  const huts = w.buildings.filter(b => b.kind === 'hut').slice(0, 2)
  assert.equal(huts.length, 2)
  for (const b of huts) {
    b.team = 'blue'
    b.counter = 3
    b.timer = 30000
    // Existing occupied huts are retained; no building/body clock is mocked.
    if (b.admission) b.admission.tribe = 0
  }
  for (const b of w.buildings) if (!huts.includes(b) && b.kind === 'hut') b.timer = -20000
  return { w, huts }
}

test('a first hut birth reaches capacity and prevents the next same-tick birth', () => {
  const { w, huts } = twoHuts()
  while (population(w, 'blue') < populationLimit(w, 'blue') - 1)
    addUnit(w, 'blue', 'brave', { x: huts[0].x, z: huts[0].z })
  assert.equal(population(w, 'blue'), populationLimit(w, 'blue') - 1)
  const ids = new Set(w.units.map(u => u.id))
  tick(w, 1 / 12)
  const newborns = w.units.filter(u => !ids.has(u.id) && u.team === 'blue')
  assert.equal(
    newborns.length,
    1,
    'later hut must observe the earlier birth, not a turn-wide count'
  )
  assert.equal(population(w, 'blue'), populationLimit(w, 'blue'))
  assert.equal(huts[0].timer, 0)
  assert.equal(huts[1].timer, 0, 'capacity rejection resets the second hut clock')
})

test('a first hut birth changes the next hut breeding band during the same tick', () => {
  const { w, huts } = twoHuts()
  while (population(w, 'blue') < 9) addUnit(w, 'blue', 'brave', { x: huts[0].x, z: huts[0].z })
  assert.equal(population(w, 'blue'), 9)
  assert.ok(populationLimit(w, 'blue') > 10)
  const second = huts[1],
    oldCost = breedingWork(w, second)
  second.timer = oldCost
  const ids = new Set(w.units.map(u => u.id))
  tick(w, 1 / 12)
  const newborns = w.units.filter(u => !ids.has(u.id) && u.team === 'blue')
  assert.equal(newborns.length, 1, 'second hut must use the post-birth ten-person breeding band')
  assert.equal(population(w, 'blue'), 10)
  assert.ok(second.timer > oldCost)
  assert.ok(second.timer < breedingWork(w, second))
})

test('breeding work preserves every band edge and upper-band saturation', () => {
  for (const count of [1, 9, 10, 19, 20, 189, 190, 199, 200, 201, 250]) {
    const w = {
      units: Array.from({ length: count - 1 }, () => ({
        team: 'blue',
        kind: 'brave',
        ghost: false,
        hp: 1,
      })),
    }
    for (const level of [1, 2, 3]) {
      const b = { team: 'blue', level }
      assert.equal(population(w, 'blue'), count)
      assert.equal(breedingWork(w, b), originalWork(w, b))
      assert.equal(breedingWork(w, b, count), originalWork(w, b))
    }
  }
})

test('count helpers need no filtered roster arrays', () => {
  const w = {
    units: [{ team: 'blue', kind: 'brave', hp: 1 }],
    buildings: [{ team: 'blue', kind: 'hut', level: 1, progress: 1, hp: 1 }],
  }
  w.units.filter = w.buildings.filter = () =>
    assert.fail('counting must not materialize filtered arrays')
  assert.equal(population(w, 'blue'), 2)
  assert.equal(populationLimit(w, 'blue'), 6 + constants.MAX_POP_VALUE__HUT_1)
  assert.equal(breedingWork(w, { team: 'blue', level: 1 }), Math.floor((4000 * 76) / 256))
})
