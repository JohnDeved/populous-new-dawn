import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
const source = readFileSync(new URL('../scripts/tutorial-browser/melee-attack.mjs', import.meta.url), 'utf8')
const start = source.indexOf('const retained = await page.evaluate(async () => {') + 'const retained = await page.evaluate('.length
const end = source.indexOf('\n      })\n      captureDiagnostic.budget.check()', start) + '\n      }'.length
const fn = source.slice(start, end)
function fixture() {
  const sample = { captureSlot: 0, cropFile: 'melee-attack-frame-0.png', captureClip: { x: 1, y: 2, width: 3, height: 4 },
    captureSourceDimensions: { width: 960, height: 720 }, cropVisibility: { clip: { x: 1, y: 2, width: 3, height: 4 } },
    turn: 1, stamp: 2, animationFrame: 3, id: 54, action: 'special', started: 1, fightGroup: 7, opponent: 20,
    object: 2, draw: 3, f1: 0, f2: 0, direction: 2, frame: 77, phase: 'running' }
  const pair = { slot: 0, turn: 1, stamp: 2, animationFrame: 3, sourceWidth: 960, sourceHeight: 720,
    clip: structuredClone(sample.captureClip), visibility: { cropVisibility: structuredClone(sample.cropVisibility) },
    pose: Object.fromEntries(['id','action','started','fightGroup','opponent','object','draw','f1','f2','direction','frame','phase'].map(key => [key, sample[key]])),
    identity: { actorId: 54, started: 1, opponent: 20, fightGroup: 7, source: 'source:1', scene: 'scene:1', world: 'world:1', physicalPerson: 'person:1' },
    arms: { A: { filename: sample.cropFile, png: 'supplied-encoded-field', opaqueColors: 2 } } }
  const observation = { samples: [sample], crops: [] }, diagnostic = { pairs: [pair] }
  let disposed = 0
  const probe = { stop() {}, retain: async () => diagnostic, dispose() { disposed++ } }
  const observer = { stop() {}, retain: () => observation, diagnosticOwner: probe }
  return { sample, pair, observation, diagnostic, disposed: () => disposed,
    run: () => vm.runInNewContext(`(${fn})()`, { window: { __pndMeleeObservation: observer } }) }
}
let count = 0
const good = fixture(); const accepted = await good.run(); assert.equal(accepted.observation.crops.length, 1); assert.equal(good.disposed(), 1); count++
const mutants = [
  f => { f.sample.captureSlot = 1 }, f => { f.pair.arms.A.filename = 'diagnostic-melee-B-frame-0.png' },
  f => { f.pair.slot = 4 }, f => { f.pair.clip.x++ }, f => { f.pair.sourceWidth++ },
  f => { f.pair.visibility.cropVisibility.clip.x++ }, f => { f.pair.identity.source = 'foreign' },
  ...['turn','stamp','animationFrame'].map(key => f => { f.pair[key]++ }),
  ...['id','action','started','fightGroup','opponent','object','draw','f1','f2','direction','frame','phase'].map(key => f => { f.pair.pose[key] = 'wrong' }),
  ...['actorId','started','opponent','fightGroup'].map(key => f => { f.pair.identity[key]++ }),
]
for (const mutate of mutants) { const f = fixture(); mutate(f); await assert.rejects(f.run()); assert.equal(f.disposed(), 1); count++ }
const onlyB = fixture(); onlyB.pair.arms.B = onlyB.pair.arms.A; delete onlyB.pair.arms.A
assert.equal((await onlyB.run()).observation.crops.length, 0); count++
console.log(JSON.stringify({ controls: count, status: 'passed', scope: 'actual serialized mapping closure with supplied retained records; no browser acceptance' }))
