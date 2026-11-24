import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { hudTabEpisodeLimitMs } from '../scripts/local-render/hud-tab-shortcuts-browser.mjs'

const helper = readFileSync(new URL('../scripts/local-render/hud-tab-shortcuts-browser.mjs', import.meta.url), 'utf8')
const recovery = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-recovery.mjs', import.meta.url), 'utf8')
// Integration contract only. Actual browser behavior remains a mandatory hosted gate.
test('HUD episode reuses the post-Load page before existing independent empty-store case', () => {
  const loadProof = recovery.indexOf("passed('only explicit Load checkpoint replaces the world")
  const hook = recovery.indexOf('const hudTabShortcuts = await checkHudTabShortcuts(page, output)')
  const close = recovery.indexOf('await page.close()', hook)
  const empty = recovery.indexOf('const emptyContext = await browser.newContext', close)
  assert.ok(loadProof > 0 && hook > loadProof && close > hook && empty > close)
  assert.match(recovery, /heldEscape, hudTabShortcuts,/)
})
test('HUD episode has a local bound and preserves cleanup and failure evidence', () => {
  assert.equal(hudTabEpisodeLimitMs, 20000)
  assert.match(helper, /setTimeout\([\s\S]*page\.close\(\)[\s\S]*hudTabEpisodeLimitMs\)/)
  assert.match(helper, /finally \{\s*clearTimeout\(timer\)\s*save\(\)/)
  assert.match(helper, /report\.status = 'failed'/)
  assert.doesNotMatch(helper, /newContext|\.goto\(|setWorld|\.mutate\(/)
})
test('HUD coverage requires three dedicated keys plus repeat and modal checks', () => {
  for (const key of ['Insert', 'Home', 'PageUp']) assert.ok(helper.includes(`'${key}'`))
  assert.match(helper, /Held Home must not cancel newly armed targeting/)
  assert.match(helper, /\['root', 'options'\]/)
  assert.match(helper, /assert\.deepEqual\(after\.selected, before\.selected\)/)
  assert.match(helper, /assert\.deepEqual\(after\.scroll, before\.scroll\)/)
})
