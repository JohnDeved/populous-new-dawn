import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const source = readFileSync(process.env.PND_CORPSE_SOURCE || new URL('../scripts/tutorial-browser/follower-corpse.mjs', import.meta.url), 'utf8')
const start = source.indexOf("    assert.equal(report.checkpoint.readyPaused.effect.corpse.phase, 1,")
const end = source.indexOf('    await focus(report.effectId)', start)
assert.ok(start >= 0 && end > start)
const run = new (Object.getPrototypeOf(async function(){}).constructor)('assert', 'report', 'page', 'settle', 'action', source.slice(start,end))

async function exercise(restored, { failPress = false } = {}) {
  let preset = restored
  const events = [], report = { checkpoint: { savedViewPreset: 2, readyPaused: { effect: { corpse: { phase: 1 } } } } }
  const page = { evaluate: async () => preset, keyboard: { press: async key => {
    events.push(key)
    if (failPress) throw null
    // Supplied public-input leaf: actual camera-view order, not a DOM/browser claim.
    const order = [3, 0, 2, 4], index = order.indexOf(preset)
    preset = order[Math.max(0, Math.min(3,index + (key === '=' ? -1 : 1)))]
  } } }
  let failed = false, failure
  try { await run(assert,report,page,async()=>events.push('settle'),async(label,fn)=>fn()) }
  catch(error) { failed=true;failure=error }
  return {failed,failure,preset,events,report}
}
test('actual loaded reframe verifies persisted preset and retains original minus trajectory', async()=>{
 const result=await exercise(2)
 assert.equal(result.failed,false)
 assert.equal(result.report.checkpoint.restoredViewPreset,2)
 assert.equal(result.preset,2)
 assert.deepEqual(result.events,['settle','=','settle','-','settle'])
})
test('wrong restored preset is rejected before any reframe input', async()=>{
 const result=await exercise(0)
 assert.equal(result.failed,true)
 assert.deepEqual(result.events,['settle'])
})
test('falsey public reframe failure propagates without original minus or continuation', async()=>{
 const result=await exercise(2,{failPress:true})
 assert.equal(result.failed,true)
 assert.equal(result.failure,null)
 assert.deepEqual(result.events,['settle','='])
})
test('saved setup remains explicit and all prior assertions remain in loaded block',()=>{
 assert.ok(source.includes("assert.equal(report.checkpoint.savedViewPreset, 2,"))
 assert.ok(source.includes("assert.equal(await page.evaluate(() => window.testSceneRef.current.viewPreset), 0)"))
 assert.ok(source.includes("One public - zoom-out after actual Load checkpoint"))
})
