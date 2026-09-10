import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/route-endpoints.json' with { type: 'json' }
import exports from '../decomp/exports.json' with { type: 'json' }
import { correctRouteEndpoints } from '../app/person-routes.ts'

test('route probes preserve native building, coast and vehicle endpoint correction', () => {
  assert.equal(fixture.executableSha256, exports.executableSha256)
  for (const original of fixture.cases) {
    const c = structuredClone(original), events = []
    const land = { flags: new Uint32Array(16384), categories: new Uint8Array(16384), buildingIds: new Uint16Array(16384) }
    for (const t of c.tiles) {
      land.flags[t.i] = t.flags
      land.categories[t.i] = t.category
      land.buildingIds[t.i] = t.building
    }
    const w = { land, checkingPerson: 0, vehicles: new Map([[2, { x: 65530, y: 10 }]]) }
    correctRouteEndpoints(w, c.p, c.from, c.to, {
      outside: id => { events.push(['outside', id]); return { x: (1000 + id * 100) & 65535, y: 2000 } },
      buildingBlocks: cell => { events.push(['blocks', cell]); return !!c.blocks },
      coastDirection: to => { events.push(['coast', { ...to }]); return c.direction },
    })
    assert.deepEqual({ checkingPerson: w.checkingPerson, events, result: { from: c.from, to: c.to } }, c.expected)
  }
})
