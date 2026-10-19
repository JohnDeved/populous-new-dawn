import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { frontendScale } from '../app/frontend-composition.ts'

const css = name => readFileSync(new URL(`../app/${name}.module.css`, import.meta.url), 'utf8')
const declarations = (source, selector) => [...source.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(([, selectors]) => selectors.split(',').some(value => value.trim() === selector))
  .flatMap(([, , body]) => [...body.matchAll(/image-rendering:\s*([^;]+);/g)].map(match => match[1]))

test('main menu bitmap logo and every normal/highlight/low glyph use sharp sampling', () => {
  const source = css('original-main-menu')
  for (const selector of ['.logo', '.text'])
    assert.deepEqual(declarations(source, selector), ['pixelated', 'crisp-edges'])
  assert.deepEqual(declarations(source, '.fallback'), [], 'system-font fallback is not bitmap art')
  assert.deepEqual(declarations(source, '.background'), [], 'do not change the animated background filter')
})

test('frontend and ingame Options atlas text share the same sampling policy', () => {
  assert.deepEqual(declarations(css('original-options'), '.text'), ['pixelated', 'crisp-edges'])
  const source = readFileSync(new URL('../app/original-options.tsx', import.meta.url), 'utf8')
  assert.match(source, /className={styles\.text}/)
  assert.match(source, /skin === 'frontend' \? frontend\.banks\[name\] : ingame/)
})

test('sampling does not quantize responsive sizing or change pointer-coordinate geometry', () => {
  for (const [width, height] of [[2560, 1267], [1280, 800], [1365, 767], [640, 480]]) {
    const scale = frontendScale(width, height)
    assert.equal(scale, Math.min(width / 640, height / 480))
    assert.ok(640 * scale <= width && 480 * scale <= height)
  }
  assert.match(css('original-main-menu'), /transform: translate\(-50%, -50%\) scale\(var\(--frontend-scale\)\)/)
})
