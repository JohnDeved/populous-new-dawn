import { corruptSpyDelivery } from './support/spy-delivery-fixture.mjs'
import { COMPOSED_SOURCE_INPUTS } from '../scripts/integration-queue/composed-profile-artifact.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { validateSpyEvidence } from '../scripts/integration-queue/composed-spy-evidence.mjs'
import { spyEvidenceFixture } from './support/composed-spy-fixture.mjs'
const run = f => validateSpyEvidence(f.report,f)
test('version3 requires genuine frame0/1, not any two later finite Spy frames',()=>{
  assert.equal(run(spyEvidenceFixture()),true)
  for(let secondFrame=2;secondFrame<=11;secondFrame++)assert.throws(()=>run(spyEvidenceFixture({secondFrame})))
})
test('Spy rejects report/source/pixel splices, timing, cleanup and unsupported current versions',()=>{
  for(const mutate of [
    ...corruptSpyDelivery.map(mutate => f => mutate(f.report)),
    f=>{f.report.captureCleanup.completed=false},f=>{f.report.captureCleanup.errors=['restore']},
    f=>{f.report.captureCleanup.hook.foreign=true},
    f=>{f.report.capture.startTurn=-1},f=>{f.report.capture.turns=f.report.capture.frames+1},
    f=>{f.report.holdBefore.turn++},f=>{f.report.observation.nonAdvancingCallbacks=-1},
    f=>{delete f.report.evidenceVersion},f=>{f.report.evidenceVersion=1},
    f=>{delete f.report.sources['spy-source-capture.mjs']},
    f=>{f.report.inputs['scripts/controlled-scene-frames.mjs']='f'.repeat(64)},
    f=>{f.report.capture.resumedRAF=false},f=>{f.report.capture.released=false},
    f=>{f.report.capture.foreign=true},f=>{f.report.capture.handback.evidence=true},
    f=>{f.report.capture.handback.spyAndAnimationUnchanged=false},
    f=>{f.report.capture.handback.stamp=200},f=>{f.report.capture.frames=385},
    f=>{f.report.capture.deadlineAt++},f=>{f.report.captureCleanupFailure='failed'},
    f=>{f.report.observation.hook.restored=false},
    f=>{f.report.observation.turnSamples.splice(2,1)},
    f=>{f.report.observation.turnSamples[2].object=48},
    f=>{f.report.observation.turnSamples[2].timer=22},
    f=>{f.report.observation.turnSamples[2].f2=1},
    f=>{f.report.observation.turnSamples[2].turn++},
    f=>{f.report.observation.samples.splice(2,1);f.report.observation.crops.shift()},
    f=>{f.report.sourceCommit='f'.repeat(40)},f=>{f.report.inputs['app/checkpoint-format.ts']='f'.repeat(64)},
    f=>{f.report.fixture.version=4},f=>{f.report.checkpointReadbackSha256='f'.repeat(64)},
    f=>{f.report.budget.capMs=46000},f=>{f.report.budget.hostDeadlineAt++},f=>{f.report.budget.endedAt=f.report.budget.deadlineAt+1},
    f=>{f.phaseReceipts[1].endedAt=new Date(f.report.budget.startedAt+1).toISOString()},
    f=>{f.report.cleanupVerified=false},f=>{f.report.cleanupError='failed'},f=>{f.report.actions.pop()},
    f=>{f.report.order.target++},f=>{f.report.observation.samples[2].timer++},f=>{f.report.observation.samples[2].pieces=[99]},
    f=>{f.report.observation.samples[2].frame=11},f=>{f.report.observation.crops[0].stamp++},
    f=>{f.report.holdBefore.spy.native.object=42;f.report.holdAfter.spy.native.object=42},
    f=>{f.report.holdBefore.spy.id=999;f.report.holdAfter.spy.id=999},
    f=>{f.report.resumed.spy.id=999},
    f=>{f.report.readiness.startedAt=f.report.budget.endedAt+1;f.report.readiness.endedAt=f.report.readiness.startedAt+2;f.report.readiness.deadlineAt=f.report.readiness.startedAt+8000},
    f=>{f.report.observation.samples[0].turn=99999},
    f=>{f.report.observation.samples[0].stamp=99999},
    f=>{f.report.holdAfter.spy.native.object++},f=>{f.report.resumed.turn=f.report.holdAfter.turn},
    f=>{f.report.observation.crops[1].sha256='f'.repeat(64)},f=>{f.report.observation.crops[0].opaqueColors=3},
    f=>{f.files.set('spy-source-frame-1.png',Buffer.alloc(256*1024))},f=>{f.files.delete('spy-source-frame-0.png')},
    f=>{f.files.set('spy-source-frame-2.png',f.files.get('spy-source-frame-1.png'))},
    f=>{f.report.observation.crops[0].clip.width=257},f=>{f.report.readiness.after.inputMask=64},
  ]) {const f=spyEvidenceFixture();mutate(f);f.hostReport=structuredClone(f.report);assert.throws(()=>run(f))}
  const f=spyEvidenceFixture();f.hostReport.status='failed';assert.throws(()=>run(f))
})

test('composed Spy reader applies the aggregate600 bound across both logical ledgers and raster samples', () => {
  const f = spyEvidenceFixture(), observation = f.report.observation
  const padding = 600 - observation.samples.length - observation.turnSamples.length - observation.turns.length
  observation.samples.unshift(...Array.from({ length: padding }, () => structuredClone(observation.samples[0])))
  f.hostReport = structuredClone(f.report)
  assert.equal(run(f), true)
  observation.samples.unshift(structuredClone(observation.samples[0]))
  assert.ok(observation.samples.length + observation.turnSamples.length <= 600, 'old two-ledger bound still passes')
  f.hostReport = structuredClone(f.report)
  assert.throws(() => run(f), /Spy aggregate observation bound/)
  for (const key of ['samples', 'turnSamples', 'turns']) {
    for (const malformed of [null, {}, 'not-an-array', undefined]) {
      const bad = spyEvidenceFixture(); bad.report.observation[key] = malformed
      bad.hostReport = structuredClone(bad.report)
      assert.throws(() => run(bad))
    }
  }
})

test('Spy helper provenance uses its exact report key and canonical immutable bytes', () => {
  const key = '../browser-command-categories.mjs', path = 'scripts/browser-command-categories.mjs'
  for (const dependency of [path, 'scripts/browser-world-input.mjs',
    'scripts/browser-space-ownership.mjs', 'scripts/browser-introduction.mjs'])
    assert.equal(COMPOSED_SOURCE_INPUTS.filter(name => name === dependency).length, 1)
  const original = spyEvidenceFixture()
  assert.ok(Object.hasOwn(original.report.sources, key))
  assert.ok(Object.hasOwn(original.sourceBytes, path))
  assert.equal(Object.hasOwn(original.sourceBytes, 'scripts/tutorial-browser/' + key), false)
  assert.equal(run(original), true)
  for (const mutate of [
    f => { delete f.report.sources[key] },
    f => { f.report.sources[key] = 'f'.repeat(64) },
    f => { f.report.sources['browser-command-categories.mjs'] = f.report.sources[key]; delete f.report.sources[key] },
    f => { f.sourceBytes[path] = Buffer.from('changed command-category owner') },
    f => { f.sourceBytes['scripts/tutorial-browser/' + key] = f.sourceBytes[path]; delete f.sourceBytes[path] },
  ]) {
    const f = spyEvidenceFixture(); mutate(f); f.hostReport = structuredClone(f.report)
    assert.throws(() => run(f))
  }
})
