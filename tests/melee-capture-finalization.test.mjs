import assert from 'node:assert/strict'
import fs from 'node:fs'
import { syncBuiltinESMExports } from 'node:module'
import { performance } from 'node:perf_hooks'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const root = new URL('../scripts/tutorial-browser/', import.meta.url)
let source = fs.readFileSync(new URL('melee-capture-diagnostic.mjs', root), 'utf8')
source = source.replace("import meleeAttack from './melee-attack.mjs'", 'const meleeAttack = (...args) => globalThis.__finalizationMelee(...args)')
for (const name of ['capture-diagnostic-budget.mjs', 'capture-diagnostic-png.mjs']) source = source.replace(`'./${name}'`, JSON.stringify(new URL(name, root).href))
const originals = Object.fromEntries(['openSync','writeSync','closeSync','readFileSync'].map(key => [key, fs[key]]))
const oldClock = Object.getOwnPropertyDescriptor(performance, 'now')
for (const phase of ['tail-write','final-read','descriptor-close','abort','backwards-clock','partial-write','close-error']) {
  const output = fs.mkdtempSync(join(tmpdir(), 'capture-tail-')), descriptors = new Set(), controller = new AbortController()
  let now = 1000, triggered = false, closed = 0, tail = false
  Object.defineProperty(performance, 'now', { configurable: true, value: () => now })
  const trigger = () => {
    triggered = true
    if (phase === 'abort') controller.abort()
    else if (phase === 'backwards-clock') now = 999
    else now = 1200
  }
  fs.openSync = (...args) => { const fd = originals.openSync(...args); descriptors.add(fd); return fd }
  fs.writeSync = (...args) => {
    if (String(args[1]).includes('"caseOutcome"')) {
      tail = true
      if (phase === 'partial-write' && !triggered) {
        triggered = true; originals.writeSync(args[0], Buffer.from('{"caseOutcome":')); throw Error('supplied partial final write')
      }
      const n = originals.writeSync(...args)
      if (['tail-write','abort'].includes(phase) && !triggered) trigger()
      return n
    }
    return originals.writeSync(...args)
  }
  fs.closeSync = (...args) => {
    const result = originals.closeSync(...args); descriptors.delete(args[0])
    if (tail && ['descriptor-close','close-error'].includes(phase) && !triggered) {
      if (phase === 'close-error') { triggered = true; throw Error('supplied descriptor-close failure') }
      trigger()
    }
    return result
  }
  fs.readFileSync = (...args) => {
    const result = originals.readFileSync(...args)
    if (tail && descriptors.size === 0 && ['final-read','backwards-clock'].includes(phase) && !triggered) trigger()
    return result
  }
  syncBuiltinESMExports()
  try {
    const { default: run } = await import('data:text/javascript;base64,' + Buffer.from(source + `\n// ${phase}`).toString('base64'))
    globalThis.__finalizationMelee = async ({ captureDiagnostic: d }) => {
      const diagnostic = { retention: { status: 'complete-comparison-only' }, cleanup: { confirmed: true } }
      d.saveJson('melee-attack.json', { canonicalStatus: 'passed' }); d.saveJson('melee-capture-diagnostic.json', diagnostic)
      return { canonicalStatus: 'passed', captureDiagnostic: diagnostic }
    }
    await assert.rejects(run({ browser: { newContext: async () => ({ newPage: async () => ({}), close: async () => { closed++ } }) }, output,
      expectedRevision: 'a'.repeat(40), routeStartMs: 1000, outerDeadlineMs: 1100, signal: controller.signal }))
    assert.equal(triggered, true, phase); assert.equal(closed, 1); assert.equal(descriptors.size, 0)
    const retained = originals.readFileSync(join(output, 'melee-capture-diagnostic.json'), 'utf8')
    if (phase !== 'partial-write') assert.notEqual(JSON.parse(retained).caseOutcome?.status, 'passed')
    console.log(phase)
  } finally {
    for (const [key, fn] of Object.entries(originals)) fs[key] = fn
    syncBuiltinESMExports()
    if (oldClock) Object.defineProperty(performance, 'now', oldClock); else delete performance.now
    delete globalThis.__finalizationMelee
    for (const fd of descriptors) originals.closeSync(fd)
    fs.rmSync(output, { recursive: true, force: true })
  }
}
