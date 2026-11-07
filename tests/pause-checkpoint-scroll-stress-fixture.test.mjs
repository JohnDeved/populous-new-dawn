import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const main = read('scripts/tutorial-browser/fixture/main.tsx')
const fixture = read('scripts/tutorial-browser/fixture/pause-checkpoint-scroll-stress.tsx')
const scenario = read('scripts/local-render/original-pause-checkpoint-style.mjs')

test('only exact hosted query mounts stress; default path mounts Home without stress import', async () => {
  const branch = main.slice(main.indexOf("if (new URLSearchParams(location.search).get('pause-checkpoint-scroll-stress')"))
    .replace("import('./pause-checkpoint-scroll-stress')", 'load()').replace('<Stress />', 'Stress').replace('<Home />', 'Home')
    .replaceAll("document.getElementById('root')!", "document.getElementById('root')")
  assert.ok(branch.startsWith('if ('))
  for (const search of ['', '?pause-checkpoint-scroll-stress=0', '?pause-checkpoint-scroll-stress=1']) {
    let imports = 0; const rendered = []
    const work = new Function('URLSearchParams', 'location', 'load', 'createRoot', 'document', 'Home', branch)
    work(URLSearchParams, { search }, async () => { imports++; return { default: 'Stress' } },
      () => ({ render: value => rendered.push(value) }), { getElementById: () => ({}) }, 'Home')
    await Promise.resolve()
    assert.equal(imports, search.endsWith('=1') ? 1 : 0)
    assert.deepEqual(rendered, [search.endsWith('=1') ? 'Stress' : 'Home'])
  }
})
test('fixture uses real production menu, bounded supported ASCII and actual disabled-reason prop', () => {
  assert.match(fixture, /import \{ OriginalPauseMenu \} from '\.\.\/\.\.\/\.\.\/app\/original-pause-menu'/)
  const expression = fixture.match(/export const stressReason = (.+)/)[1]
  const reason = new Function(`return ${expression}`)()
  assert.ok(reason.length >= 800 && reason.length < 1024)
  assert.match(reason, /^[\x20-\x7e]+$/)
  assert.match(fixture, /saveDisabledReason=\{stressReason\}/)
  assert.match(fixture, /data-evidence-scope="component-scroll-stress"/)
  assert.doesNotMatch(fixture, /prepared=|testStore|setWorld|createWorld|game-store|\.style\b|<style|dangerouslySetInnerHTML/)
})
test('native waits for decoded glyphs and fallback verifies new failed request before stress measurement', () => {
  const block = scenario.slice(scenario.indexOf('// Ordinary gameplay proof is complete'))
  assert.match(block, /page\.waitForEvent\('requestfailed'/)
  assert.match(block, /blockedFontRequests > blockedBeforeStress/)
  assert.match(block, /await stressDetails\.locator\('i'\)\.first\(\)\.waitFor\(\{ state: 'visible' \}\)/)
  assert.ok(block.indexOf("locator('i').first().waitFor") < block.indexOf('const start = await observeStress()'))
  assert.match(block, /assert\.ok\(start\.overflow, 'Component stress must actually overflow'\)/)
  assert.match(block, /assert\.equal\(end\.lastLineVisible, true\)/)
  assert.match(block, /assert\.deepEqual\(\[start\.top, start\.width, start\.height\], \[81, 576, 270\]\)/)
  assert.doesNotMatch(block, /setWorld|createWorld|testStore/)
})

test('zero-height scope wrapper needs attachment, then actual modal visibility', () => {
  assert.ok(scenario.includes(`page.locator('[data-evidence-scope="component-scroll-stress"]').waitFor({ state: 'attached' })`))
  assert.ok(scenario.includes("await modal.waitFor({ state: 'visible' })"))
})
test('actual scenario ASCII regex accepts the fixture and rejects non-ASCII or control characters', () => {
  const expression = scenario.match(/assert.match\(start.reason, (.+)\)/)[1]
  const regex = new Function(`return ${expression}`)()
  const reason = new Function(`return ${fixture.match(/export const stressReason = (.+)/)[1]}`)()
  assert.equal(regex.test(reason), true)
  for (const invalid of ['é', '\n', '\t']) assert.equal(regex.test(invalid), false)
})
