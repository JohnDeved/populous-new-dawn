import assert from 'node:assert/strict'
import test from 'node:test'
import { attackCombatBuilding } from '../app/combat-building.ts'
import { runBuildingAttack } from './building-attack-case.mjs'
import fixture from './fixtures/building-attack.json' with { type: 'json' }

test('building attack phases, entrances, damage and shake match native execution', () => {
  for (const { input, expected } of fixture.cases)
    assert.deepEqual(runBuildingAttack(structuredClone(input)), expected, input.mode)
})

test('an entirely occupied world cancels special positioning instead of hanging', () => {
  const c = structuredClone(fixture.cases.find(c => c.input.mode === 'sequence').input)
  Object.assign(c.p, { animationMode: 52, assignment: 16, flags2: 0 })
  Object.assign(c.b, { class: 2, tribe: (c.p.tribe + 1) % 4 })
  let probes = 0
  assert.equal(
    attackCombatBuilding(c.w, c.p, c.b, {
      buildingAt: () => {
        probes++
        return 2
      },
      destination: () => assert.fail('No destination exists'),
    }),
    'restart'
  )
  assert.ok(probes > 0 && probes <= 65536)
})
