import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spellButton } from '../app/spell-button.ts'
import rules from '../app/original-rules.json' with { type: 'json' }
import fixture from './fixtures/spell-icon-states.json' with { type: 'json' }

const source = readFileSync(new URL('../scripts/spell-icon-state-browser.mjs', import.meta.url), 'utf8')
const match = source.match(/^    const charging = (.+)$/m)
assert.ok(match, 'actual maintained matrix charge expectation')
const expected = new Function('state', 'rules', 'spell', `return (${match[1]})`)
const flags = source.match(/w\.manaWorld\.gameFlags = (.+)/)
assert.ok(flags, 'actual maintained matrix flags setup')
const suppliedFlags = new Function('state', `return (${flags[1]})`)
const models = Object.keys(fixture.icons).map(Number)

test('actual matrix expectation matches permitted charge fill for every retained state/model', () => {
  assert.equal(models.length * fixture.states.length, 160)
  for (const model of models) for (const state of fixture.states) {
    const gameFlags = suppliedFlags(state), rule = rules.spellCharging[model]
    const allowed = !(gameFlags & 32) && (rule.mode !== 2 || !!(gameFlags & 256))
    const input = { model, ...state, charging: !!state.permanent && allowed && !!state.charging,
      mode2ChargingAllowed: !!(gameFlags & 256), progress: Math.floor(rule.cost / 2), gifts: state.gifts ?? 0 }
    assert.equal(Number(expected(state, rules, { model })), Number(spellButton(input).fills.length > 0), `${model}/${state.name}`)
  }
})

test('mode-2 absent permission remains negative; granted fill leaves sprites and borders unchanged', () => {
  for (const model of models.filter(model => rules.spellCharging[model].mode === 2)) {
    const state = fixture.states.find(state => state.name === 'charging')
    assert.equal(suppliedFlags(state), 256)
    const input = { model, ...state, hovered: false, selected: false, gifts: 0, progress: Math.floor(rules.spellCharging[model].cost / 2) }
    const denied = spellButton({ ...input, mode2ChargingAllowed: false })
    const granted = spellButton({ ...input, mode2ChargingAllowed: true })
    assert.deepEqual(denied.fills, [])
    assert.ok(granted.fills.length > 0)
    assert.deepEqual(granted.sprites, denied.sprites)
    assert.equal(granted.border, denied.border)
    assert.equal(granted.frame, denied.frame)
  }
})

test('native crop equality, half-width and matrix inventory assertions remain required', () => {
  for (const line of [
    'assert.deepEqual(actual, expected, `Rendered atlas crop ${name}`)',
    "if (charging) assert.equal(await card.locator('.native-charge > i').last().evaluate(el => parseFloat(el.style.width)), 12)",
    "assert.equal(await card.locator('.hud-sprite').count(), rules.spellCharging[spell.model].normalLimit + 1)",
    'assertSpellIconInventory(report.states, SPELLS, episode)',
    'assertOriginalSpellIconPixels(report.originalPixels, originalPixelFixture)',
  ]) assert.ok(source.includes(line), line)
})
