import assert from 'node:assert/strict'
import test from 'node:test'
import { buildingPlanInsidePoint, buildingPlanOutsidePoint } from '../app/building-shapes.ts'
import { approachCombatPlan } from '../app/combat-pursuit.ts'
import { attackCombatPlan } from '../app/combat-approach.ts'
import { setPersonAnimation } from '../app/animation.ts'
import sprites from '../app/original-units.json' with { type: 'json' }
import fixture from './fixtures/plan-attack.json' with { type: 'json' }

test('construction-plan entrances, approach and timed attack sequences match native execution', () => {
  for (const { input, expected } of fixture.cases) {
    const c = structuredClone(input)
    const p = c.p,
      plan = c.plan,
      w = { randomState: c.randomState },
      events = []
    let alert = c.alert
    const log = (name, ...args) => events.push([name, ...args, structuredClone(p), w.randomState])
    const cells = new Map(
      c.patches.map(([i, flags, category, building]) => [i, { flags, category, building }])
    )
    const world = {
      cell: q => cells.get((q.y >> 9) * 128 + (q.x >> 9)) ?? { flags: 0, category: 0, building: 0 },
      walkMask: new Uint8Array(8192).fill(c.mask),
    }
    const e = {
      animation: (p, object) => {
        log('animation', object)
        setPersonAnimation(
          p,
          object,
          {
            playerTribe: 0,
            gameFlags: 0,
            sessionSubstate: null,
            tribes: Array.from({ length: 4 }, () => ({ flags: 0, playerType: 0 })),
            objects: new Map(),
          },
          sprites
        )
      },
      inside: () => {
        log('inside', plan.id)
        return buildingPlanInsidePoint(plan)
      },
      outside: () => {
        log('outside', plan.id)
        return buildingPlanOutsidePoint(plan, world)
      },
      destination: to => {
        log('planned', to)
        p.goalX = to.x
        p.goalY = to.y
      },
      directDestination: to => {
        log('direct', to)
        p.goalX = to.x
        p.goalY = to.y
      },
    }
    let result
    if (c.mode === 'inside') result = e.inside()
    else if (c.mode === 'outside') result = e.outside()
    else if (c.mode === 'approach') result = approachCombatPlan(w, p, e)
    else {
      const visit = () => {
        if (p.tribe === 0 && !alert) alert = 1
        p.flags2 = (p.flags2 | 0x2000000) >>> 0
        if (p.flags2 & 0x40000000) {
          p.flags4 = (p.flags4 & ~0x10007) >>> 0
          p.assignment &= ~512
        }
        const decision = attackCombatPlan(p, plan, {
          animation: e.animation,
          approach: () => approachCombatPlan(w, p, e),
          buildingAt: q => world.cell(q).building,
          destroy: cell => log('destroy', cell, 0, 0, 0, 3),
        })
        if (decision === 'restart') {
          p.substate = 0
          p.flags2 = (p.flags2 | 0x40000000) >>> 0
        }
        return 0
      }
      if (c.mode === 'attack') result = visit()
      else {
        result = []
        for (let turn = 0; turn < 19; turn++) {
          const value = visit()
          result.push({ p: structuredClone(p), randomState: w.randomState, value })
          if (turn < 18) p.counter = (p.counter + 1) & 255
        }
      }
    }
    assert.deepEqual(
      { p, plan, events, randomState: w.randomState, alert, result },
      expected,
      c.mode
    )
  }
})
