import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const source = readFileSync(new URL('../scripts/spell-icon-state-browser.mjs', import.meta.url), 'utf8')
const start = source.indexOf('    // Whole-card evidence for the three already-supplied mode-2 charging cases.')
const end = source.indexOf('    await capture(card, fixture.icons[spell.model][state.icon]', start)
const block = start >= 0 && end > start ? source.slice(start, end) : ''
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
function run({ model = 18, state = 'charging', png, drift = false, report = { viewport: { dpr: 1 } }, failWrite = false } = {}) {
  assert.ok(block, 'actual whole-card capture block')
  const calls = [], bytes = png ?? Buffer.alloc(24)
  if (!png) { Buffer.from('89504e470d0a1a0a', 'hex').copy(bytes); bytes.write('IHDR', 12); bytes.writeUInt32BE(31, 16); bytes.writeUInt32BE(43, 20) }
  let reads = 0
  const snap = { card: { x: 1, y: 2, width: 31, height: 43 }, fills: [{ width: '11px' }], disabled: 'false', pressed: 'false' }
  const card = { scrollIntoViewIfNeeded: async () => calls.push('scroll'), evaluate: async () => { calls.push('read'); return reads++ && drift ? { ...snap, pressed: 'true' } : snap }, screenshot: async () => { calls.push('screenshot'); return bytes } }
  const rules = { spellCharging: { [model]: { mode: [18,20,21].includes(model) ? 2 : 1 } } }
  const fn = new AsyncFunction('assert','state','rules','spell','charging','card','report','writeFileSync','join','output','sha256','save',block)
  return { calls, report, promise: fn(assert,{name:state},rules,{model,id:`model-${model}`},true,card,report,(path,b,options)=>{ calls.push(['write',path,options]); if(failWrite)throw null },(...x)=>x.join('/'),'out',()=> 'supplied-digest',()=>calls.push('save')) }
}
test('three existing mode-2 charging cases retain whole cards before sprite substitution', async () => {
  const report = { viewport: { dpr: 1 } }
  for (const model of [18,20,21]) { const x=run({model,report}); await x.promise; assert.deepEqual(x.calls.slice(0,4),['scroll','read','screenshot','read']); assert.equal(x.calls[4][2].flag,'wx'); assert.equal(x.calls.at(-1),'save') }
  assert.deepEqual(report.mode2ChargeCards.map(x=>x.model),[18,20,21]); assert.ok(report.mode2ChargeCards.every(x=>x.bytes===24 && x.width===31 && x.height===43 && x.before===x.after))
})
test('other states and ordinary models do not add captures',async()=>{for(const args of [{state:'hover'},{model:2}]){const x=run(args);await x.promise;assert.deepEqual(x.calls,[])}})
test('oversized PNG refuses before any write',async()=>{const x=run({png:Buffer.alloc(256*1024+1)});await assert.rejects(x.promise,/byte cap/);assert.equal(x.calls.length,3)})
test('state drift refuses before any write',async()=>{const x=run({drift:true});await assert.rejects(x.promise,/changed during capture/);assert.equal(x.calls.length,4)})
test('duplicate model refuses before capture',async()=>{const x=run({report:{viewport:{dpr:1},mode2ChargeCards:[{model:18,bytes:24}]}});await assert.rejects(x.promise);assert.deepEqual(x.calls,['scroll','read'])})
test('falsey exclusive-write failure is preserved without success record',async()=>{const x=run({failWrite:true});let caught=false;try{await x.promise}catch(e){caught=true;assert.equal(e,null)}assert.ok(caught);assert.deepEqual(x.report.mode2ChargeCards,[]);assert.ok(!x.calls.includes('save'))})
test('final coverage and all original native pixel and exact width guards remain',()=>{
  assert.ok(source.includes("assert.deepEqual(report.mode2ChargeCards?.map(entry => entry.model).sort((a, b) => a - b), [18, 20, 21])"))
  for(const s of ["assert.deepEqual(actual, expected, `Rendered atlas crop ${name}`)","assertSpellIconInventory(report.states, SPELLS, episode)","el.style.width)), expectedChargeWidth)","assertOriginalSpellIconPixels(report.originalPixels, originalPixelFixture)"])assert.ok(source.includes(s),s)
})

test('wrong full-card pixel dimensions refuse before write', async () => {
  const png=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(png);png.write('IHDR',12);png.writeUInt32BE(30,16);png.writeUInt32BE(43,20)
  const x=run({png});await assert.rejects(x.promise);assert.deepEqual(x.calls,['scroll','read','screenshot'])
})
test('unexpected DPR refuses rather than assuming full-card pixel correspondence',async()=>{
 const x=run({report:{viewport:{dpr:2}}});await assert.rejects(x.promise);assert.deepEqual(x.calls,['scroll'])
})
