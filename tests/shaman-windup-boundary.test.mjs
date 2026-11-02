import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const source = readFileSync(new URL('../scripts/tutorial-browser/spell-test-menu.mjs', import.meta.url), 'utf8')
const start = source.indexOf('    await page.mouse.click(target.x, target.y)', source.indexOf("diagnostics.stage('real pointer cast and refill')"))
const end = source.indexOf("    await page.evaluate(() => window.shamanCastingObserver.beginHold())", start)
assert.ok(start >= 0 && end > start)
const execute = new Function('assert', 'page', 'menu', 'snapshot', 'target', 'unlocked', `return (async () => {${source.slice(start,end)}; return casting })()`)
async function run({ pollExpires = false, pressExpires = false, change = () => {} } = {}) {
  const events = [], target = { x: 12, y: 34, before: 1, priorShotIds: [10] }
  const state = { casts: 1, shots: { blast: 4 }, shaman: { id: 30, casting: null }, projectiles: [{ id: 10, caster: 30, spell: 'blast', phase: 'windup', remaining: 2 }], castingTribes: [{ cooldown: 0 }] }
  const expire = () => { state.shaman.casting = null; for(const p of state.projectiles) { p.phase='flying'; p.remaining=0 } }
  const page = { mouse: { async click(x,y) {
    assert.deepEqual([x,y],[12,34]); events.push('click'); state.casts++; state.shots.blast--
    state.shaman.casting = { remaining: 0.5 }; state.projectiles.push({ id: 11, caster: 30, spell: 'blast', phase: 'windup', remaining: 6 })
    state.castingTribes[0].cooldown = 10; change(state)
  } }, async waitForFunction(predicate,before) {
    events.push('poll'); assert.equal(state.casts,before+1); if(pollExpires) expire()
  }, keyboard: { async press(key) { assert.equal(key,'F9'); events.push('F9'); if(pressExpires) expire() } } }
  const value = await execute(assert,page,{ async waitFor() { events.push('menu') } }, async () => { events.push('snapshot'); return structuredClone(state) },target,{ shots:{blast:4} })
  return { value, events }
}
test('actual public action snippet checks cast at F9 without an intervening poll', async () => {
  const {value,events} = await run({pollExpires:true})
  assert.equal(value.casts,2);assert.ok(value.shaman.casting.remaining>0)
  assert.deepEqual(events,['click','F9','menu','snapshot'])
})
test('windup that expires before F9 still fails, with no retry or synthetic repair', async () => {
  await assert.rejects(run({pressExpires:true}))
})
test('wrong cast count still fails the same boundary', async () => {
  await assert.rejects(run({change:state=>{state.casts++}}))
})
test('a stale windup projectile cannot stand in for the newly allocated shot', async () => {
  await assert.rejects(run({change:state=>{state.projectiles.pop()}}))
})
test('duplicate new shots, wrong caster and wrong spell are rejected', async () => {
  for(const change of [s=>s.projectiles.push({...s.projectiles[1],id:12}),s=>{s.projectiles[1].caster=99},s=>{s.projectiles[1].spell='swarm'}])
    await assert.rejects(run({change}))
})
test('existing charge, windup, projectile, cooldown, frozen hold and resumption guards remain', () => {
  for(const marker of ['normal cast spent one real charge','actual Shaman windup must still be active','an actual live windup projectile is required','native cooldown remains active','active cast and its windup freeze while F9 is open',"await waitForCastingWitness(page, 'subsequent')",'export const spellTestLimitMs = 75000']) assert.ok(source.includes(marker),marker)
  assert.match(source,/priorShotIds: w\.projectiles\.map\(shot => shot\.id\)/)
})
