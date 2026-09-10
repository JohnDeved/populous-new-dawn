import test from 'node:test'
import assert from 'node:assert/strict'
import placeFixture from './fixtures/worship-place.json' with { type: 'json' }
import fixture from './fixtures/person-worship.json' with { type: 'json' }
import exports from '../decomp/exports.json' with { type: 'json' }
import { findWorshipPlace, stepWorshipHead } from '../app/worship.ts'
import { stepWorshipPerson } from '../app/person-worship.ts'

test('worship placement preserves native two-pass search, occupancy, route order and failure flags', () => {
  assert.equal(placeFixture.executableSha256, exports.executableSha256)
  for (const original of placeFixture.cases) {
    const c = structuredClone(original),
      queries = []
    const result = findWorshipPlace(
      c.head,
      c.person,
      p => c.occupied.some(o => o.x === p.x && o.y === p.y),
      p => {
        queries.push([
          [c.person.x >> 8, c.person.y >> 8],
          [p.x >> 8, p.y >> 8],
        ])
        const ok = c.answers[Math.min(queries.length - 1, c.answers.length - 1)]
        c.person.flags4 = ((c.person.flags4 & ~0x10000000) | (ok ? 0 : 0x10000000)) >>> 0
        return ok
      }
    )
    assert.deepEqual({ result, flags4: c.person.flags4, queries }, c.expected)
  }
})

test('worship command preserves native approach, prayer, retry and presentation RNG decisions', () => {
  assert.equal(fixture.executableSha256, exports.executableSha256)
  for (const original of fixture.cases) {
    const c = structuredClone(original),
      p = c.person,
      events = [],
      config = c.config
    const occupied = { x: p.turnAngle, y: p.turnY }
    const done = stepWorshipPerson(c, p, c.head, Array(256).fill(8), {
      findPlace: () => {
        events.push(['find'])
        p.flags4 = ((p.flags4 & ~0x10000000) | (config.routeFailed ? 0x10000000 : 0)) >>> 0
        return config.place
      },
      occupied: to => config.occupied && to.x === occupied.x && to.y === occupied.y,
      shamanOnly: () => config.shamanOnly,
      destination: to => {
        events.push(['destination', { ...to }])
        Object.assign(p, {
          goalX: to.x,
          destinationX: to.x,
          turnAngle: to.x,
          goalY: to.y,
          destinationY: to.y,
          turnY: to.y,
        })
        p.flags2 = ((p.flags2 & ~128) | 0x1000) >>> 0
      },
      recover: () => {
        events.push(['recover'])
        p.speed = 40
      },
      disembark: () => {
        events.push(['disembark'])
        p.vehicle = 0
      },
      anchor: to => events.push(['anchor', { x: to.x, y: to.y }]),
      relocate: to => {
        events.push(['relocate', { ...to }])
        Object.assign(p, to, { h: 100 })
      },
      releaseRoute: () => events.push(['releaseRoute']),
      animation: object => events.push(['animation', object]),
      sound: cue => events.push(['sound', cue]),
    })
    assert.deepEqual(
      { person: p, head: c.head, randomState: c.randomState, done, events },
      c.expected
    )
  }
})

test('ordinary stone-head visits expire the standing-slot cursor at the native byte timer', () => {
  for (const { nextSlot, slotTimer, expected } of placeFixture.timers) {
    const head = { nextSlot, slotTimer }
    stepWorshipHead(head)
    assert.deepEqual(head, expected)
  }
})
