import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-style.mjs', import.meta.url), 'utf8')
// Executes only the final coverage assertion, not browser layout or keyboard behavior.
const coverage = source.match(/  assert\.ok\(records\.some\(record => record\.body\.overflow\),\n    'Checkpoint presentation must exercise at least one real overflow and End-key case'\)/)?.[0]
const verify = records => {
  assert.ok(coverage, 'The browser scenario must fail closed if overflow never occurs')
  runInNewContext(coverage, { assert, records })
}
test('rejects an empty or entirely non-overflowing scenario matrix', () => {
  assert.throws(() => verify([]), /at least one real overflow/)
  assert.throws(() => verify(Array.from({ length: 12 }, () => ({ body: { overflow: false } }))), /at least one real overflow/)
})
test('accepts a matrix containing an overflow case without requiring all variants to overflow', () => {
  verify([{ body: { overflow: false } }, { body: { overflow: true } }])
})
test('coverage assertion remains after per-case records and before a successful result', () => {
  assert.ok(coverage)
  const endKey = source.indexOf("await page.keyboard.press('End')")
  const scrolled = source.indexOf('body.scrollTop > 0 && body.scrollTop + body.clientHeight >= body.scrollHeight - 1')
  const recorded = source.indexOf('records.push({ viewport: { width, height }, fallback, blockedFontRequests, ...layout })')
  assert.ok(endKey > 0 && scrolled > endKey && recorded > scrolled)
  assert.ok(source.indexOf(coverage) > recorded)
  assert.ok(source.indexOf('return { records, screenshots, limits: [') > source.indexOf(coverage))
})
