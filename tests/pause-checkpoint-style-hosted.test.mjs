import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import yaml from 'js-yaml'
import { browserScenarios, browserCapMs } from '../scripts/tutorial-browser/scenario-policy.mjs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('checkpoint style has an additional bounded job without replacing recovery', () => {
  const workflow = yaml.load(read('.github/workflows/tutorial-browser.yml'))
  assert.deepEqual(workflow.permissions, { contents: 'read' })
  assert.deepEqual(workflow.on.pull_request.types, ['ready_for_review'])
  assert.deepEqual(workflow.on.pull_request.branches, ['main'])
  assert.ok(workflow.on.pull_request.paths.includes('scripts/local-render/original-pause-checkpoint-style.mjs'))
  const jobs = workflow.jobs['tutorial-browser'].strategy.matrix.include
  const style = jobs.filter(item => item.scenario === 'pause-checkpoint-style')
  assert.equal(style.length, 1)
  assert.equal(style[0].timeoutMinutes, 15)
  assert.equal(style[0].artifact, 'pause-checkpoint-style-browser')
  assert.equal(jobs.filter(item => item.scenario === 'pause-checkpoint-recovery').length, 1)
  assert.equal(browserScenarios.filter(item => item === 'pause-checkpoint-style').length, 1)
  assert.equal(browserCapMs('pause-checkpoint-style'), 180000)
  assert.equal(browserCapMs('pause-checkpoint-recovery'), 180000)
  assert.equal(browserCapMs('tutorial'), 240000)
})

test('actual style dispatch passes the existing owner and propagates failures', async () => {
  const source = read('scripts/tutorial-browser/run.mjs')
  const marker = "} else if (selectedScenario === 'pause-checkpoint-style') {"
  const start = source.indexOf(marker)
  assert.ok(start >= 0)
  const body = source.slice(start + marker.length, source.indexOf("} else if (selectedScenario === 'pause-checkpoint-recovery')", start))
  assert.equal((body.match(/await import\(/g) ?? []).length, 1)
  const invoke = new Function('load', 'pathToFileURL', 'pauseStyleScenario', 'browser', 'page', 'url', 'root', 'out', 'receipt', 'abort',
    `return (async () => { ${body.replace('await import(', 'await load(')} })()`)
  const browser = {}, page = {}, signal = new AbortController().signal
  const result = { records: ['supplied boundary'], screenshots: ['supplied.png'] }
  const failure = new Error('Preserved style failure')
  for (const fail of [false, true]) {
    const receipt = {}, calls = []
    const work = invoke(async url => {
      assert.equal(url, 'file:///scenario.mjs')
      return { default: async options => {
        calls.push(options)
        if (fail) throw failure
        return result
      } }
    }, path => ({ href: `file://${path}` }), '/scenario.mjs', browser, page, 'http://example.test', '/root', '/output', receipt, { signal })
    if (fail) await assert.rejects(work, error => error === failure)
    else { await work; assert.equal(receipt.pauseCheckpointStyle, result) }
    assert.deepEqual(calls, [{ browser, page, url: 'http://example.test', root: '/root', output: '/output', receipt, signal }])
    if (fail) assert.equal(Object.hasOwn(receipt, 'pauseCheckpointStyle'), false)
  }
  assert.match(source, /pauseStyleScenarioSha256: hash\(pauseStyleScenario\)/)
})

test('style retains native and fallback viewport, freeze, scrolling and cleanup assertions', () => {
  const source = read('scripts/local-render/original-pause-checkpoint-style.mjs')
  assert.match(source, /for \(const fallback of \[false, true\]\)/)
  assert.match(source, /deviceScaleFactor: fallback \? 2 : 1/)
  assert.match(source, /\[\[640, 480\], \[1920, 1080\], \[800, 450\]\]/)
  assert.match(source, /for \(const panel of \['save', 'load'\]\)/)
  assert.match(source, /assert\.equal\(layout\.body\.horizontalOverflow, false\)/)
  assert.match(source, /await page\.keyboard\.press\('End'\)/)
  assert.match(source, /assert\.equal\(await details\.evaluate\(node => node === document\.activeElement\), true\)/)
  assert.match(source, /assert\.equal\(await page\.evaluate\(\(\) => JSON\.stringify\(window\.testStore\.getWorld\(\)\)\), frozen\)/)
  assert.match(source, /finally \{ await context\.close\(\) \}/)
  assert.doesNotMatch(source, /force: true|setWorld\(|setViewportSize\(\{ width: 1,/)
})
