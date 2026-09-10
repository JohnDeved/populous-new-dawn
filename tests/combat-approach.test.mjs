import assert from 'node:assert/strict'
import test from 'node:test'
import { approachFight, approachCombatPerson, retryCombatTarget } from '../app/combat-approach.ts'
import { setPersonAnimation } from '../app/animation.ts'
import sprites from '../app/original-units.json' with { type: 'json' }
import fixture from './fixtures/fight-approach.json' with { type: 'json' }

test('fight/person pursuit, housed entry, waiting and retries match native visits', () => {
  for (const { input, expected } of fixture.cases) {
    const c = structuredClone(input)
    const p = c.p,
      w = { randomState: c.randomState },
      events = []
    let alert = c.alert
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
            objects: new Map(),
          },
          sprites
        )
      },
      frameCount: object => sprites.frameCounts[object],
      plannedDestination: to => {
        const q = { x: to.x, y: to.y }
        log('planned', q)
        p.goalX = to.x
        p.goalY = to.y
      },
      directDestination: to => {
        log('direct', to)
        p.goalX = to.x
        p.goalY = to.y
      },
      available: () => {
        log('available')
        return c.available
      },
      waitingPosition: () => {
        log('waiting')
        return c.waiting
      },
      move: to => {
        log('height', to)
        const q = { ...to, h: 100 }
        log('move', q)
        Object.assign(p, q)
      },
      releaseMotion: () => log('releaseMotion'),
      buildingAt: q => c.cells[(q.y >>> 9) * 128 + (q.x >>> 9)],
      approachBuilding: radius => {
        log('approachBuilding', radius)
        return c.buildingReady
      },
      fightModel: () => c.fightModel,
    }
    // Outer controller entry and final dispatch are compared too, but remain outside this branch port.
    if (p.tribe === 0 && !alert) alert = 1
    p.flags2 = (p.flags2 | 0x2000000) >>> 0
    if (p.flags2 & 0x40000000) {
      p.flags4 = (p.flags4 & ~0x10007) >>> 0
      p.assignment &= ~512
    }
    let decision
    if (c.mode === 'fight') decision = approachFight(w, p, c.fight, e)
    else if (c.mode === 'person') decision = approachCombatPerson(w, p, c.fight, e)
    else retryCombatTarget(w, p, e)
    if (decision === 'encounter' || decision === 'inside')
      log('encounter', decision === 'inside' ? 2 : 0)
    if (decision === 'retarget') {
      log('range')
      log('retarget', [21, 0, 0, 0, ((p.x >>> 8) & 254) | (p.y & 0xfe00), 0x404])
      decision = 'restart'
    }
    if (decision === 'restart') {
      p.substate = 0
      p.flags2 = (p.flags2 | 0x40000000) >>> 0
    }
    if (decision === 'join') {
      log('join')
      if (!c.join) {
        p.substate = 7
        p.flags2 = (p.flags2 | 0x40000000) >>> 0
      }
    }
    assert.deepEqual(
      { p, fight: c.fight, randomState: w.randomState, events, alert, result: 0 },
      expected,
      c.mode
    )
  }
})
