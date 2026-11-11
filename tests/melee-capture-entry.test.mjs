import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, readdirSync, writeFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { makePng, rgbaPixels } from './support/capture-png-fixture.mjs'

// The exact entry function and artifact/ownership implementation run here.
// Only its melee dependency is supplied; actual observer/retention is tested
// separately. This does not claim complete public setup integration coverage.
const root = new URL('../scripts/tutorial-browser/', import.meta.url)
let source = readFileSync(new URL('melee-capture-diagnostic.mjs', root), 'utf8')
assert.equal(source.split("import meleeAttack from './melee-attack.mjs'").length, 2)
source = source.replace("import meleeAttack from './melee-attack.mjs'", 'const meleeAttack = (...args) => globalThis.__suppliedMelee(...args)')
for (const name of ['capture-diagnostic-budget.mjs', 'capture-diagnostic-png.mjs'])
  source = source.replace(`'./${name}'`, JSON.stringify(new URL(name, root).href))
const { default: run, captureDiagnosticContract } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
assert.equal(captureDiagnosticContract, 'same-frame-ab-v1')
const sha256 = data => createHash('sha256').update(data).digest('hex')
const png = makePng(2, 1), expected = { width: 2, height: 1, pngSha256: sha256(png),
  rawPixelSha256: sha256(rgbaPixels(2, 1)), opaqueColors: 2, readbackColorSpace: 'srgb' }
const dataUrl = 'data:image/png;base64,' + png.toString('base64')
let count = 0
async function check(name, options = {}) {
  const output = mkdtempSync(resolve(tmpdir(), 'pnd-capture-test-')), controller = new AbortController()
  const calls = { context: 0, page: 0, close: 0, melee: 0, screenshots: 0 }
  const page = { screenshot: async () => { calls.screenshots++; if (options.screenshotFail) throw Error('supplied partial screenshot'); return png } }
  const context = { newPage: async () => { calls.page++; if (options.pageFail) throw Error('supplied page failure'); return page },
    close: async () => { calls.close++; if (options.closeFail) throw Error('supplied close failure') } }
  const browser = { newContext: async input => {
    calls.context++; assert.deepEqual(input, { viewport: { width: 960, height: 720 }, deviceScaleFactor: 1 })
    if (options.createFail) throw Error('supplied creation failure')
    if (options.lateContext) { controller.abort(); await Promise.resolve() }
    return context
  } }
  globalThis.__suppliedMelee = async ({ captureDiagnostic: d }) => {
    calls.melee++; assert.equal(d.context, context); assert.equal(d.page, page)
    if (options.unknownInput) throw Error('Unknown public input outcome')
    if (options.abort) { controller.abort(); d.budget.check() }
    if (options.badName) d.writePng('../escape.png', dataUrl, expected)
    if (options.badHash) d.writePng('melee-attack-frame-0.png', dataUrl, { ...expected, pngSha256: '0'.repeat(64) })
    if (options.blank) d.writePng('melee-attack-frame-0.png', dataUrl, { ...expected, opaqueColors: 1 })
    if (options.bigJson) d.saveJson('melee-capture-diagnostic.json', { huge: 'x'.repeat(8388608) })
    for (let i = 0; i < 4; i++) {
      d.writePng(`melee-attack-frame-${i}.png`, dataUrl, expected)
      d.writePng(`diagnostic-melee-B-frame-${i}.png`, dataUrl, expected)
    }
    if (options.duplicate) d.writePng('melee-attack-frame-0.png', dataUrl, expected)
    const diagnostic = { pairs: [], retention: { status: options.incomplete ? 'failed' : 'complete-comparison-only' }, cleanup: { confirmed: true } }
    d.saveJson('melee-capture-diagnostic.json', diagnostic)
    d.saveJson('melee-attack.json', { status: 'passed', observation: { samples: [], crops: [] } })
    try { await d.screenshot(page, 'context') }
    catch (error) { assert.equal(await d.screenshot(page, 'failure'), null); throw error }
    assert.equal(await d.screenshot(page, 'failure'), null)
    return { status: options.canonicalFail ? 'failed' : 'passed', canonicalStatus: options.canonicalFail ? 'failed' : 'passed', captureDiagnostic: diagnostic }
  }
  const start = performance.now()
  const args = { browser, url: 'https://example.invalid', output, expectedRevision: 'a'.repeat(40), routeStartMs: start, outerDeadlineMs: start + 180000, signal: controller.signal }
  if (Object.keys(options).length) await assert.rejects(run(args))
  else {
    const result = await run(args)
    assert.equal(result.status, 'passed'); assert.equal(result.canonical.status, 'passed')
    assert.equal(result.diagnostic.status, 'complete-comparison-only'); assert.equal(result.contextClosed, true)
    assert.equal(result.artifacts.length, 11)
  }
  assert.equal(calls.context, 1)
  assert.equal(calls.close, options.createFail ? 0 : 1)
  assert.ok(calls.page <= 1 && calls.melee <= 1 && calls.screenshots <= 1)
  const files = readdirSync(output)
  assert.ok(files.filter(name => name.endsWith('.png')).length <= 9)
  assert.ok(!(files.includes('melee-attack-context.png') && files.includes('melee-attack-failure.png')))
  const sidecar = readFileSync(resolve(output, 'melee-capture-diagnostic.json'), 'utf8')
  assert.equal(sidecar.includes('data:image'), false)
  assert.equal(JSON.parse(sidecar).caseOutcome.status, Object.keys(options).length ? 'failed' : 'retained-awaiting-host-return')
  writeFileSync(resolve(output, 'control-receipt.json'), JSON.stringify({ name, calls, files, suppliedDependency: true }) + '\n')
  rmSync(output, { recursive: true, force: true })
  count++; console.log(name)
}
await check('exact success inventory, decoded actual fixture PNGs, one context/page/screenshot')
for (const flag of ['createFail','pageFail','lateContext','closeFail','unknownInput','abort','badName','badHash','blank','bigJson','duplicate','incomplete','canonicalFail','screenshotFail'])
  await check(flag, { [flag]: true })
delete globalThis.__suppliedMelee
console.log(JSON.stringify({ controls: count, status: 'passed', scope: 'actual entry with supplied melee dependency; not full public route' }))
