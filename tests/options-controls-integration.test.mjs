import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
const read = name => readFileSync(new URL(`../scripts/options-controls-evidence/${name}`, import.meta.url), 'utf8')
const source = read('adapter.mjs')
// The actual adapter body with only explicit external boundaries supplied.
// No browser/Playwright lifecycle claim is made by these lightweight controls.
const compiled = source.replace(/^import .*\n/gm, '').replaceAll('export ', '').replace('await import(', 'await injectedImport(')
function fixture({ runtimeError = false, cleanupError = false, abortedAfterCleanup = false, inventory = { bytes: 0, screenshots: 0 } } = {}) {
  const output = mkdtempSync(join(tmpdir(), 'options-adapter-'))
  let contextsClosed = 0, browserClosed = 0, report
  const page = { goto: async () => {} }, browser = { newContext: async () => ({ newPage: async () => page }) }
  const ownBrowser = (b,o,r) => { report = r; return { browser, beginEpisode() {},
    async closeContexts() { contextsClosed++ }, async close() { browserClosed++; if (cleanupError) throw Error('close failed') } } }
  const boundedEpisode = async (run,{close}) => { try { return await run(new AbortController().signal, Date.now()+1000) } finally { await close() } }
  const signal = { throwIfAborted() { if (abortedAfterCleanup && browserClosed) throw Error('late abort') } }
  const injectedImport = async () => ({ default: async () => { if(runtimeError) report.errors.push({kind:'runtime',text:'broken'}); return {status:'passed'} } })
  const names = ['assert','writeFileSync','resolve','pathToFileURL','commonInventory','ownBrowser','boundedEpisode','ordinaryMission','git','fullSha','injectedImport']
  const factory = new Function(...names, compiled + '; return { runOptionsControlsEvidence, assertOptionsArtifactInventory };')
  const api = factory(assert,writeFileSync,resolve,pathToFileURL,()=>inventory,ownBrowser,boundedEpisode,async()=>{},()=> 'b'.repeat(40),x=>x,injectedImport)
  return {api,output,run:()=>api.runOptionsControlsEvidence({browser,candidateRoot:'/candidate',output,url:'http://127.0.0.1',signal}),counts:()=>[contextsClosed,browserClosed]}
}
test('adapter qualifies scoped success only after owned contexts/browser close and global errors pass', async () => {
  const f=fixture();const r=await f.run();assert.equal(r.status,'passed');assert.equal(r.cleanupVerified,true);assert.deepEqual(f.counts(),[1,1])
})
test('global runtime errors, cleanup failures, late abort and artifact overflow each reject scoped success', async () => {
  for(const options of [{runtimeError:true},{cleanupError:true},{abortedAfterCleanup:true},{inventory:{bytes:67108865,screenshots:0}},{inventory:{bytes:0,screenshots:9}}]){
    const f=fixture(options);await assert.rejects(f.run());assert.deepEqual(f.counts(),[1,1]);
    assert.equal(JSON.parse(readFileSync(join(f.output,'options-controls-series.json'))).status,'failed')
  }
})
test('hosted wrapper binds reviewed source, dependency/build manifests, exact candidate and real process supervisor', () => {
  const run=read('run.mjs'), worker=read('browser-worker.mjs')
  for(const marker of ['manualIdentity(process.env)','sourceManifest(candidateRoot, identity.candidateSha)',"name.startsWith('scripts/options-controls-evidence/')",'verifyManifest(candidateRoot, candidateSource)','verifyBuiltOutput(dist, built','capMs: 180000','finalizeArtifactReceipt(output, report); artifactInventory(output)'])assert.ok(run.includes(marker),marker)
  assert.ok(run.includes("from '../native-ui-evidence/supervise.mjs'"))
  assert.ok(run.includes("import { artifactInventory, optionsLimits } from './adapter.mjs'"))
  assert.ok(run.includes('limits: { ...limits, ...optionsLimits }'), 'Receipt must describe actual narrower limits')
  assert.ok(worker.includes('browserConfiguration()'));assert.ok(worker.includes("process.once('SIGTERM'"));assert.ok(worker.includes('await browser?.close(); await server?.close()'))
  assert.doesNotMatch(run,/acceptSeries|Nine-episode|initializeEpisodeLedger/)
})
