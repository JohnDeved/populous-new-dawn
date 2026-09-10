import assert from 'node:assert/strict'
import test from 'node:test'
import { prepareCombatOrderVisit } from '../app/combat-order-search.ts'
import { setPersonAnimation } from '../app/animation.ts'
import sprites from '../app/original-units.json' with { type: 'json' }
import fixture from './fixtures/combat-search.json' with { type: 'json' }

test('attack search, march records and automatic retargeting match native dispatch boundaries', () => {
  for (const { input, expected } of fixture.cases) {
    const c = structuredClone(input)
    const p = c.p,
      w = {
        randomState: c.randomState,
        alert: c.alert,
        playerTribe: c.playerTribe,
        marches: c.marches,
      },
      events = []
    let area = 0,
      selection = 0
    const log = (name, ...args) => events.push([name, ...args, structuredClone(p), w.randomState])
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
            objects: new Map([[3, { passenger: 0 }]]),
          },
          sprites
        )
      },
      releaseMotion: () => log('releaseMotion'),
      approachPoint: o => {
        log('approach', o)
        return c.point
      },
      destination: to => {
        const q = { x: to.x, y: to.y }
        log('destination', q)
        p.goalX = to.x
        p.goalY = to.y
      },
      withinArea: o => {
        log('area', o)
        return c.areas[area++]
      },
      select: (o, vehicle) => {
        log('select', o, vehicle)
        return c.selections[selection++] ?? undefined
      },
      prepareTarget: (o, id) => {
        log('prepare', o, id)
        return c.restart
      },
      range: () => {
        log('range')
        return c.radius
      },
    }
    const result = prepareCombatOrderVisit(w, p, c.order, e)
    assert.deepEqual(
      { p, randomState: w.randomState, events, alert: w.alert, marches: w.marches, result },
      expected
    )
  }
})
