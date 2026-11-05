import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-style.mjs', import.meta.url), 'utf8')
// Source-order guard only, not evidence that a browser screenshot was captured.
test('retains current layout and pixels before the first layout assertion and cleanup', () => {
  const observed = source.indexOf("writeFileSync(resolve(output, 'checkpoint-style-current.json')")
  const capture = source.indexOf('await page.screenshot({ path: resolve(output, `${name}.png`) })')
  const assertion = source.indexOf('assert.equal(layout.panel, panel)')
  const close = source.indexOf('finally { await context.close() }')
  assert.ok(observed > 0 && capture > observed && assertion > capture && close > assertion)
  assert.equal(source.split('await page.screenshot({ path: resolve(output, `${name}.png`) })').length, 2)
  assert.match(source, /viewport: \{ width, height \}, fallback, blockedFontRequests, layout/)
})
test('glyph failure identifies the failing text while preserving all strict checks', () => {
  assert.match(source, /assert\.equal\(text\.glyphs > 0, !fallback, `\$\{name\}: bitmap glyphs for \$\{text\.copy \?\? text\.label\}`\)/)
  assert.ok(source.indexOf('screenshots.push(`${name}.png`)') > source.indexOf('assert.equal(control.reachable, true)'))
  assert.match(source, /assert\.ok\(records\.some\(record => record\.body\.overflow\)/)
  assert.match(source, /assert\.equal\(await page\.evaluate\(\(\) => JSON\.stringify\(window\.testStore\.getWorld\(\)\)\), frozen\)/)
})
