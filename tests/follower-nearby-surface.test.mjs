// Exact atlas expectations and strict consumer negatives. CSSOM normalization
// itself is separately proved by the retained sandboxed Chrome154 blank probe.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import art from '../app/original-hud.json' with { type: 'json' }
import { followerNumber } from '../app/hud-population.ts'
import { assertNearbySurface } from '../scripts/local-render/follower-nearby-contract.mjs'

const source = ts.createSourceFile('follower-nearby-snapshot.mjs',
  readFileSync(new URL('../scripts/local-render/follower-nearby-snapshot.mjs', import.meta.url), 'utf8'),
  ts.ScriptTarget.Latest, true),
  declaration = name => source.statements.filter(ts.isVariableStatement)
    .flatMap(node => [...node.declarationList.declarations]).find(node => node.name.getText(source) === name),
  sprite = Function('art', `return (${declaration('sprite').initializer.getText(source)})`)(art),
  expectedNumber = Function('followerNumber', 'sprite',
    `return (${declaration('expectedNumber').initializer.getText(source)})`)(followerNumber, sprite)

test('actual atlas expectations canonicalize zero coordinates and retain all frame and number dimensions', () => {
  assert.deepEqual(sprite(876), { position: '0px -535px', width: '19px', height: '16px' })
  for (const id of [875, 876, 877, 878, 'f00t4-65', 'f00t7-54']) {
    const rect = art.rects[id], expected = sprite(id)
    assert.equal(expected.position, `${0 - rect.x}px ${0 - rect.y}px`)
    assert.equal(expected.width, `${rect.w}px`)
    assert.equal(expected.height, `${rect.h}px`)
    assert.ok(!/(^| )-0px/.test(expected.position))
  }
  for (const alternate of [false, true]) {
    const number = expectedNumber(0, true, alternate), id = alternate ? 'f00t5-16' : 'f00t4-16'
    assert.equal(number.count, 0)
    assert.deepEqual(number.glyphs, [sprite(id), sprite(id)])
  }
})

test('strict surface receipt rejects wrong nonzero coordinate, frame, dimension and unit', () => {
  const bounds = { x: 10, y: 10, width: 19, height: 16 },
    row = { disabled: true, expectedDisabled: true, number: null, expected: null },
    surface = { toggle: { pressed: 'false', disabled: false, sprite: sprite(876), expectedSprite: sprite(876) },
      meter: '1 of 2', expectedMeter: '1 of 2', classes: Array(6).fill(row), tasks: Array(24).fill(row),
      layout: { viewport: [1440, 1000], toggle: bounds, sprite: bounds, controls: [bounds] } }
  assertNearbySurface({ nearby: false }, surface)
  for (const change of [
    value => { value.toggle.sprite.position = '-1px -535px' },
    value => { value.toggle.sprite = sprite(875) },
    value => { value.toggle.sprite.width = '20px' },
    value => { value.toggle.sprite.height = '17px' },
    value => { value.toggle.sprite.position = '0% -535px' },
  ]) {
    const wrong = structuredClone(surface)
    change(wrong)
    assert.throws(() => assertNearbySurface({ nearby: false }, wrong))
  }
})
