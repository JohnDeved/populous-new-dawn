import assert from 'node:assert/strict'
import test from 'node:test'
import fixture from './fixtures/spell-icon-states.json' with { type: 'json' }
import hud from '../app/original-hud.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { spellHudButton } from '../app/spell-visibility.ts'
import { SPELLS } from '../app/world-rules.ts'
import { spellIconStateNames } from '../scripts/spell-icon-state-evidence.mjs'

test('retained original descriptor table covers exactly the shipped spell models', () => {
  assert.deepEqual(fixture.states.map(s => s.name), spellIconStateNames)
  assert.deepEqual(Object.keys(fixture.icons).map(Number), SPELLS.map(s => s.model).sort((a, b) => a - b))
  for (const [model, icons] of Object.entries(fixture.icons))
    assert.deepEqual(rules.spellCharging[model].icons, icons, `original model ${model}`)
})

for (const spell of SPELLS) {
  test(`${spell.id}: original artwork, border, stock and charge state matrix`, () => {
    const rule = rules.spellCharging[spell.model]
    for (const state of fixture.states) {
      const input = { model: spell.model, permanent: state.permanent, charging: !!state.charging,
        stock: state.stock, gifts: state.gifts ?? 0, selected: !!state.selected,
        hovered: !!state.hovered, progress: Math.floor(rule.cost / 2) }
      const view = spellHudButton(state.disabled ? 'visible-disabled' : 'visible', input)
      const icon = fixture.icons[spell.model][state.icon], rect = hud.rects[icon]
      assert.equal(view.frame, state.frame, state.name)
      assert.deepEqual(view.sprites.at(-1), { id: icon,
        x: 15 - Math.trunc(rect.w / 2), y: 21 - Math.trunc(rect.h / 2) }, state.name)
      assert.equal(view.sprites.length, rule.normalLimit + 1)
      const empty = state.permanent ? 55 : state.hovered ? 67 : 66
      assert.deepEqual(view.sprites.slice(0, -1).map(s => s.id),
        Array.from({ length: rule.normalLimit }, (_, i) => i < state.stock ? (i < (state.gifts ?? 0) ? 65 : 54) : empty), state.name)
      assert.equal(view.fills.length > 0, !!state.charging && rule.mode !== 2, state.name)
      const question = spellHudButton('undiscovered', input)
      assert.deepEqual(question, { border: 821, frame: 'button',
        sprites: [{ id: 1056, x: 5, y: 10 }], fills: [] }, state.name)
    }
  })
}
