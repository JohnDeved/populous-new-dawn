import test from 'node:test'
import assert from 'node:assert/strict'
import fixture from './fixtures/person-panel.json' with { type: 'json' }
import exports from '../decomp/exports.json' with { type: 'json' }
import { personOrderIcons, personPanel, stepPersonPanel } from '../app/person-panel.ts'

test('person panels preserve native command traversal, health and original draw submissions', () => {
  assert.equal(fixture.executableSha256, exports.executableSha256)
  for (const c of fixture.icons) {
    const icons = personOrderIcons({ records: c.orders }, c.person, new Map([[3, c.target]]))
    assert.deepEqual(icons.map(({model, sprite}) => ({model, sprite})), c.expected)
  }
  for (const c of fixture.panels) assert.deepEqual(personPanel(c.health, c.maximum, c.icons), c.expected)
})

test('person-panel lifetime matches native refresh and remains independent of render rate', () => {
  for (const c of fixture.lifetimes) {
    const state = {...c.initial}
    assert.deepEqual(c.holds.map(held => {
      const alive = stepPersonPanel(state, held)
      return { phase: state.phase, remaining: state.remaining, alive }
    }), c.expected)
  }
  for (const fps of [5, 30, 60, 120, 144, 240]) {
    const panel = { phase: -1, remaining: 0, hold: 20 }
    let frames = 0, death = 0
    for (let render = 1; render <= fps * 3 && !death; render++)
      while (frames < Math.floor(render / fps * 24 + 1e-9)) {
        frames++
        if (!stepPersonPanel(panel, false)) { death = frames; break }
      }
    assert.equal(death, 27)
  }
})
