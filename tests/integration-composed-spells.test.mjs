import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { COMPOSED_SOURCE_INPUTS } from '../scripts/integration-queue/composed-profile-artifact.mjs'
import { composedBrowserFixture } from './support/composed-browser-reader.mjs'
import { passiveBrowserFixture } from './support/passive-browser-reader.mjs'
import { validateEntry,validatePassedGate,gatesFor } from '../scripts/integration-queue/policy.mjs'
import { resolveProfileCasesArtifact,resolveMission10Artifact,profileArchiveLimit } from '../scripts/integration-queue/profile-artifact.mjs'
const checkView=f=>({head:f.pr.head.sha,base:f.pr.base.sha,synthetic:f.synthetic,currentChecks:f.checks.map(c=>({id:c.id,name:c.name,appId:c.app.id,head:c.head_sha,startedAt:c.started_at,status:c.status,conclusion:c.conclusion}))})
test('composed pipeline requires version3 Spy frame0/1 without accepting later second frames',()=>{
  const f=composedBrowserFixture();validateEntry(f.entry);const row=f.run()
  assert.equal(row.tornadoVerified,true);assert.equal(row.spySourceVerified,true)
  assert.equal(row.spellVisualsVerified,undefined);validatePassedGate(checkView(f),gatesFor(f.entry)[1],row)
  for(let secondFrame=2;secondFrame<=11;secondFrame++)assert.throws(()=>composedBrowserFixture({secondFrame}).run())
})
test('legacy eight/v3 and nine/v4 paths remain strict and do not infer composition',()=>{
  for(const nine of [false,true]){const f=passiveBrowserFixture({nine});assert.equal(f.run().identityVerified,true)}
  const f=composedBrowserFixture();delete f.entry.profileArtifactPolicy;assert.throws(()=>f.run(),/Unexpected artifact path/)
  for(const mutate of [e=>delete e.browserCheckpointVersion,e=>{e.browserCheckpointVersion=4},e=>{e.browserPolicy='spell-visuals-nine-v2'},e=>{e.profileArtifactPolicy='unknown'}]){const f=composedBrowserFixture();mutate(f.entry);assert.throws(()=>validateEntry(f.entry))}
  assert.equal(profileArchiveLimit,16*1024*1024)
})
test('missing, extra, duplicate, mixed and spliced composed artifacts fail closed',()=>{
  for(const mutate of [
    f=>f.records[0].files.delete('tornado-land-first-tail-normal.png'),
    f=>f.records[0].files.set('tornado-land-failure.png',Buffer.from('bad')),
    f=>f.records[1].files.delete('spy-source-frame-0.png'),
    f=>f.records[1].files.set('spy-source-frame-2.png',f.records[1].files.get('spy-source-frame-1.png')),
    f=>f.records[1].files.set('spy-source-frame-12.png',Buffer.from('bad')),
    f=>f.records[0].files.set('spy-source.json',f.records[1].files.get('spy-source.json')),
    f=>{f.records[0].host.tornadoAppearance.status='FAIL'},
    f=>{f.records[1].host.spySource.fixture.version=4},
    f=>{f.records[1].host.source.files['public/original/unit-layers.png']='f'.repeat(64)},
    f=>{f.records[0].host.source.files['app/game-clock.ts']='f'.repeat(64)},
    f=>f.records[1].files.set('spy-source-frame-1.png',Buffer.from('bad')),
  ]){const f=composedBrowserFixture();mutate(f);f.records.forEach(record => f.rebuild(record));assert.throws(()=>f.run())}
  const f=composedBrowserFixture(),r=f.records[0];f.rebuild(r,[[...r.files][0]]);assert.throws(()=>f.run(),/Duplicate/)
})
test('composed source/run/job/check/upload provenance is never spliced',()=>{
  for(const mutate of [f=>{f.sourceBlobs['public/original/tornado.png']=Buffer.from('changed')},f=>{f.jobs[4].head_sha='f'.repeat(40)},
    f=>{f.checks[5].app.id=1},f=>{f.checks[4].check_suite.id++},f=>{f.exact.run_attempt++},f=>{f.metadata[1].expired=true},
    f=>{f.artifacts.push({...f.artifacts[0],name:'alternate-name'})},f=>{f.logs.set(1005,f.logs.get(1004))},
  ]){const f=composedBrowserFixture();mutate(f);assert.throws(()=>f.run())}
})
test('Promise results at artifact, verifier and actual caller boundaries cannot set composed acceptance',()=>{
  for(const method of ['profileEvidence','mission10Evidence','verifyProfileRecoveryRun','verifyMission10Run','composedSourceBlob']){
    const f=composedBrowserFixture();f.reader[method]=()=>Promise.resolve({composedVerified:true});assert.throws(()=>f.run())
  }
  const f=composedBrowserFixture(),row=f.run()
  for(const key of ['tornadoVerified','spySourceVerified'])for(const value of [undefined,false,Promise.resolve(true)])assert.throws(()=>validatePassedGate(checkView(f),gatesFor(f.entry)[1],{...row,[key]:value}))
  const record=f.records[0],upload={bytes:f.archives.get(3000).length,sha256:f.artifacts[0].digest.slice(7)}
  assert.throws(()=>resolveProfileCasesArtifact(Promise.resolve(f.archives.get(3000)),upload,record.receipt,Promise.resolve({})))
  assert.throws(()=>resolveMission10Artifact(f.archives.get(3001),{bytes:f.archives.get(3001).length,sha256:f.artifacts[1].digest.slice(7)},f.records[1].receipt,{profileArtifactPolicy:'composed-spells-eight-v1',browserPolicy:'profile-split-v1',checkpointVersion:4}))
})

// The fixture derives its source map from this finite inventory. Require the new
// checkpoint dependency explicitly, so removing it cannot make fixture and reader
// agree on the same incomplete input set.
test('composed checkpoint source inventory includes scenery provenance exactly once', () => {
  assert.equal(COMPOSED_SOURCE_INPUTS.filter(path => path === 'app/scenery-provenance.ts').length, 1)
})

test('composed evidence rejects missing or changed scenery provenance bytes', () => {
  const path = 'app/scenery-provenance.ts'
  const mismatch = /Composed immutable source differs: app\/scenery-provenance\.ts/
  for (const index of [0, 1]) {
    for (const missing of [true, false]) {
      const f = composedBrowserFixture()
      const record = f.records[index]
      if (missing) delete record.host.source.files[path]
      else record.host.source.files[path] = 'f'.repeat(64)
      // Rebind the artifact ZIP/upload to the altered host receipt, so rejection
      // must come from immutable source comparison, not a stale transport hash.
      f.rebuild(record)
      assert.throws(() => f.run(), mismatch)
    }
  }
  const f = composedBrowserFixture()
  f.sourceBlobs[path] = Buffer.from('changed scenery provenance')
  assert.throws(() => f.run(), mismatch)
})

// Read the tracked application independently: synthetic host fixtures deliberately
// derive their source bytes from the allowlist and cannot detect omissions alone.
function requireApplicationInventory(inputs, applicationPaths) {
  assert.equal(new Set(inputs).size, inputs.length, 'Duplicate composed source input')
  assert.deepEqual(inputs.filter(path => path.startsWith('app/')).sort(),
    [...applicationPaths].sort(), 'Composed inventory must bind every tracked app file')
}
test('composed source inventory covers every tracked application file exactly once', () => {
  const tracked = execFileSync('git', ['ls-files', '--cached', '-z', '--', 'app/'], {
    cwd: new URL('..', import.meta.url), encoding: 'utf8', timeout: 10_000, maxBuffer: 1024 * 1024,
  }).split('\0').filter(Boolean)
  assert.ok(tracked.length > 0, 'Tracked application inventory must not be empty')
  requireApplicationInventory(COMPOSED_SOURCE_INPUTS, tracked)
  const added = 'app/future-composed-dependency.ts'
  assert.ok(!tracked.includes(added))
  assert.throws(() => requireApplicationInventory(COMPOSED_SOURCE_INPUTS, [...tracked, added]),
    /Composed inventory must bind every tracked app file/)
  assert.throws(() => requireApplicationInventory([...COMPOSED_SOURCE_INPUTS, tracked[0]], tracked),
    /Duplicate composed source input/)
})

test('composed evidence binds all Angel presentation dependencies in both artifact kinds', () => {
  for (const path of ['app/angel-presentation.ts', 'app/original-angel-presentation.json',
    'app/original-angel-strike.json']) {
    assert.equal(COMPOSED_SOURCE_INPUTS.filter(input => input === path).length, 1)
    const mismatch = error => error.code === 'ERR_ASSERTION' &&
      error.message.split('\n')[0] === `Composed immutable source differs: ${path}`
    for (const index of [0, 1]) {
      for (const missing of [true, false]) {
        const f = composedBrowserFixture(), record = f.records[index]
        if (missing) delete record.host.source.files[path]
        else record.host.source.files[path] = 'f'.repeat(64)
        // Authenticate the altered transport so only the source comparison fails.
        f.rebuild(record)
        assert.throws(() => f.run(), mismatch)
      }
      const f = composedBrowserFixture(), changed = Buffer.from(`changed immutable ${path}`)
      f.sourceBlobs[path] = changed
      // Rebind the OTHER kind to the changed blob: the selected kind must reject
      // its stale hash itself, rather than accidentally failing Profile first.
      const other = f.records[1 - index]
      other.host.source.files[path] = createHash('sha256').update(changed).digest('hex')
      f.rebuild(other)
      assert.throws(() => f.run(), mismatch)
    }
  }
})
