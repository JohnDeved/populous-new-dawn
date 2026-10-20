import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'
import { checkpointCodec } from '../scripts/tutorial-browser/checkpoint-codec.mjs'
import { validateSplitBrowserJobs } from '../scripts/integration-queue/browser-jobs.mjs'
import { SPELL_VISUAL_POLICY, SPELL_VISUAL_BROWSER_JOBS, SPELL_VISUAL_INPUTS, SPELL_VISUAL_FILES,
  validateSpellVisualBrowserJobs, spellVisualReceiptLog, readSpellVisualReceiptLog,
  validateSpellVisualReceipt, resolveSpellVisualArtifact } from '../scripts/integration-queue/spell-visuals-policy.mjs'
import { validateAngelPng } from '../scripts/integration-queue/spell-visuals-render-evidence.mjs'
import { validateShieldPng } from '../scripts/tutorial-browser/shield-evidence.mjs'
import { SHIELD_VISUAL_INPUTS } from '../scripts/tutorial-browser/shield-visuals-inputs.mjs'
import { spellReaderFixture as evidence, readerPng } from './support/spell-visuals-reader-fixture.mjs'
import { artifactZip } from './support/artifact-zip.mjs'
const hash = value => createHash('sha256').update(value).digest('hex'), oid = n => String(n).repeat(40)
const source={commit:oid(1)}
const run={id:100,run_attempt:2,check_suite_id:50,head_sha:oid(2),status:'completed',conclusion:'success'}
const admission={policy:SPELL_VISUAL_POLICY,headSha:oid(2)}
function jobs(){return SPELL_VISUAL_BROWSER_JOBS.map(([,name,,buildStep],index)=>({id:200+index,name,run_id:100,run_attempt:2,head_sha:oid(2),status:'completed',conclusion:'success',steps:
 ['Require a ready pull request','Check out exact proposed merge','Set up Node','Install locked dependencies and verify supported Chrome','Record exact tested source',buildStep,'Reject tracked input mutation','Retain bounded validation receipts and screenshots'].map(name=>({name,conclusion:'success'}))}))}

test('explicit nine-job policy rejects missing, duplicate, wrong-name, wrong-head and failed spell jobs without eight-job fallback',()=>{
 assert.equal(validateSpellVisualBrowserJobs(jobs(),run,admission),true)
 assert.equal(validateSplitBrowserJobs(jobs().slice(0,8),run),true)
 assert.throws(()=>validateSplitBrowserJobs(jobs(),run))
 assert.throws(()=>validateSpellVisualBrowserJobs(jobs(),run,{...admission,policy:'profile-split-v1'}))
 for(const mutate of [j=>j.pop(),j=>j.push(j[8]),j=>{j[8].name='Spell browser'},j=>{j[8].head_sha=oid(4)},j=>{j[8].conclusion='failure'},j=>{j[8].status='in_progress'},j=>{j[8].run_attempt=1},j=>{j[8].run_id=99},j=>{j[8].steps.pop()},j=>{j[8].steps[5].conclusion='skipped'},j=>{j[0].head_sha=oid(3)},j=>{j[0].id=j[8].id}]){
  const value=jobs();mutate(value);assert.throws(()=>validateSpellVisualBrowserJobs(value,run,admission))
 }
 assert.throws(()=>validateSpellVisualBrowserJobs(jobs(),{...run,head_sha:oid(4)},admission))
})

test('source/receipt contract independently recomputes actual geometry/UV/height/scale evidence and hashes every retained byte',()=>{
 const f=evidence();assert.equal(validateSpellVisualReceipt(f.receipt,f.expected),true)
 assert.deepEqual(readSpellVisualReceiptLog(spellVisualReceiptLog(f.receipt)),f.receipt)
 assert.throws(()=>readSpellVisualReceiptLog(spellVisualReceiptLog(f.receipt)+'\n'+spellVisualReceiptLog(f.receipt)))
 for(const mutate of [f=>{f.angel.source={}},f=>{f.angel.status='failed'},f=>{f.angel.contextClosed=false},f=>{f.angel.elapsedMs=50000},f=>{f.angel.budget.remainingAtAdmissionMs=59999},
  f=>{f.angel.publicSave.version=3},f=>{f.angel.publicLoad.fullBoundaryMatched=false},f=>{f.angel.running.samples[0].shaderScale=1},f=>{f.angel.running.resources[0].uv[0]+=.1},
  f=>{f.angel.running.cleanup.disposed.texture=1},f=>{f.raw.sourceAfter='mutated'},f=>{f.raw.github.head=oid(4)},f=>{f.raw.launch.chromiumSandbox=false},f=>{f.raw.browserCapMs=180001},
  f=>{f.raw.spellVisuals.episodes=[]},f=>{f.angel.running.crops=[]}]){
   const g=evidence();mutate(g);g.rebind();assert.throws(()=>validateSpellVisualReceipt(g.receipt,g.expected))
 }
 const old=evidence();const record=checkpointCodec(JSON.parse(old.files['angel-public-save.json']),true);record.version=3;old.files['angel-public-save.json']=Buffer.from(JSON.stringify(checkpointCodec(record)));old.angel.publicSave.sha256=hash(old.files['angel-public-save.json']);old.rebind();assert.throws(()=>validateSpellVisualReceipt(old.receipt,old.expected))
 const badPng=evidence();badPng.files['angel-paused-context.png']=Buffer.from('not PNG');badPng.rebind();assert.throws(()=>validateSpellVisualReceipt(badPng.receipt,badPng.expected))
 const g=evidence();g.files['angel-public-save.json']=Buffer.from('different bytes');assert.throws(()=>validateSpellVisualReceipt(g.receipt,g.expected))
 assert.throws(()=>validateSpellVisualReceipt(f.receipt,{...f.expected,originalAngel:Buffer.from('{}')}))
 assert.throws(()=>validateSpellVisualReceipt(f.receipt,{...f.expected,policy:'profile-split-v1'}))
})
test('data-only exact numeric artifact resolver rejects wrong digest/name, missing and extra archive entries',()=>{
 const f=evidence(),archive=artifactZip(Object.entries(f.files),{compress:true}),upload={id:123,name:`spell-visuals-browser-${source.commit}`,bytes:archive.length,sha256:hash(archive)}
 assert.equal((resolveSpellVisualArtifact(archive,upload,f.receipt,f.expected)).visualReview,'required')
 assert.throws(()=>resolveSpellVisualArtifact(archive,{...upload,name:'other'},f.receipt,f.expected))
 assert.throws(()=>resolveSpellVisualArtifact(archive,{...upload,sha256:'0'.repeat(64)},f.receipt,f.expected))
 for(const entries of [Object.entries(f.files).slice(1),[...Object.entries(f.files),['unexpected.json','{}']]]){
  const archive=artifactZip(entries,{compress:true});assert.throws(()=>resolveSpellVisualArtifact(archive,{...upload,bytes:archive.length,sha256:hash(archive)},f.receipt,f.expected))
 }
})


test('mandatory Shield contract fails closed for missing sources, old versions, lifecycle, pixel and expiry forgeries',()=>{
 const mutations=[
  f=>{f.raw.spellVisuals.episodes=['angel']},f=>{delete f.raw.spellVisuals.shield},
  f=>{f.shield.source.files={}},f=>{f.shield.source.commit=oid(4)},f=>{f.shield.expectedRevision=oid(4)},
  f=>{f.raw.spellVisualEpisodeSha256.shield='a'.repeat(64)},f=>{f.shield.currentCheckpointVersion=3},
  f=>{f.shield.status='skipped'},f=>{f.shield.admission='skipped'},f=>{f.shield.timedOut=true},
  f=>{f.shield.budget.runnerDeadlineAt++},f=>{f.shield.budget.remainingAtAdmissionMs=180001},f=>{f.shield.budget.capMs=45001},f=>{f.shield.budget.remainingAtAdmissionMs=54999},
  f=>{f.shield.budget.elapsedMs=45000},f=>{f.shield.budget.deadlineMonotonicMs++},
  f=>{f.shield.cleanup.contextClosed=false},f=>{f.shield.cleanup.closedWithinBudget=false},
  f=>{f.shield.cleanup.lateCreation=true},f=>{f.shield.cleanup.creationPendingOrFailed=true},
  f=>{f.shield.cleanup.closedElapsedMs=45000},f=>{f.shield.errors=['page error']},
  f=>{f.shield.setup.version=3},f=>{f.shield.saved.version=3},f=>{f.shield.loaded.version=3},
  f=>{f.shield.initialLoad.completeWorldMatched=false},f=>{f.shield.loaded.completeWorldMatched=false},
  f=>{f.shield.beforeCast.shots=0},f=>{f.shield.afterCast.shots=1},
  f=>{delete f.shield.visiblePause.timestamp;delete f.shield.visiblePause.sceneTimestamp},
  f=>{delete f.shield.visiblePause.clockBefore;delete f.shield.visiblePause.clockAfter},
  f=>{f.shield.visiblePause.sceneTimestamp++},f=>{f.shield.visiblePause.clockAfter.animationFrame++},
  f=>{f.shield.visiblePause.beforeSha256=f.shield.visiblePause.afterSha256},f=>{delete f.shield.visiblePause},
  f=>{f.shield.pauseAfter.people[0].shield--},f=>{f.shield.atlas.sha256='0'.repeat(64)},
  f=>{f.shield.buildIdentity.revision=oid(4)},f=>{f.shield.captures.pop()},
  f=>{f.shield.captures[0].samples.pop()},f=>{f.shield.captures[0].samples[0].pieces[0].source++},
  f=>{f.shield.captures[0].samples[0].pieces[1].color=0x00ffff},
  f=>{f.shield.captures[0].samples[0].pieces[2].depth=1},
  f=>{f.shield.captures[0].samples[0].overlays=['HUD']},
  f=>{f.shield.captures[0].samples[0].causal.changedInsideShield=0},
  f=>{f.shield.captures[0].samples[0].retainedRgbaSha256='0'.repeat(64)},
  f=>{f.shield.disposal.disposedAtlas=1},f=>{f.shield.expiry.samples=[]},
  f=>{f.shield.expiry.samples.at(-1).people[0].remaining=1},
  f=>{f.shield.expiry.samples.at(-1).people[0].visible[0]=true},
  f=>{f.shield.expiry.samples.at(-1).turn=179},f=>{f.shield.terminal.people[0].shield=0},
 ]
 for(const mutate of mutations){const f=evidence();mutate(f);f.rebind();assert.throws(()=>validateSpellVisualReceipt(f.receipt,f.expected))}
 for(const name of ['shield-visuals.json','shield-context.png','shield-original-3.png','shield-public-save.json']){
  const f=evidence();delete f.files[name];assert.throws(()=>validateSpellVisualReceipt(f.receipt,f.expected))
 }
 for(const name of ['shield-original-0.png','shield-context.png']){
  const f=evidence();f.files[name]=Buffer.from('not a PNG');f.rebind();assert.throws(()=>validateSpellVisualReceipt(f.receipt,f.expected))
 }
 const old=evidence(),saved=JSON.parse(old.files['shield-public-save.json']);saved.version=3;old.files['shield-public-save.json']=Buffer.from(JSON.stringify(saved));old.rebind();assert.throws(()=>validateSpellVisualReceipt(old.receipt,old.expected))
 const f=evidence();assert.throws(()=>validateSpellVisualReceipt(f.receipt,{...f.expected,originalUnits:Buffer.from('{}')}))
 assert.throws(()=>validateSpellVisualReceipt(f.receipt,{...f.expected,policy:'spell-visuals-nine-v1'}))
 assert.equal(SPELL_VISUAL_FILES.length+22+1,50);assert.equal(new Set(SPELL_VISUAL_INPUTS).size,SPELL_VISUAL_INPUTS.length)
 for(const name of SHIELD_VISUAL_INPUTS)assert.ok(SPELL_VISUAL_INPUTS.includes(name))
})


function pngChunk(name, data) {
  const chunk = Buffer.alloc(data.length + 12)
  chunk.writeUInt32BE(data.length); chunk.write(name, 4, 'latin1'); data.copy(chunk, 8)
  let crc = 0xffffffff
  for (const byte of chunk.subarray(4, -4)) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, chunk.length - 4)
  return chunk
}
function customPng({ filter = 0, extra = [], trailingCompressed = false, idatType = 'IDAT', split = false, between = [], colorType = 6, alpha = 255 } = {}) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(4); header.writeUInt32BE(4, 4); header[8] = 8; header[9] = colorType
  const channels = colorType === 6 ? 4 : 3, stride = 4 * channels + 1
  const raw = Buffer.alloc(4 * stride, 255)
  for (let row = 0; row < 4; row++) {
    raw[row * stride] = filter
    if (channels === 4) for (let pixel = 0; pixel < 4; pixel++) raw[row * stride + 1 + pixel * 4 + 3] = alpha
  }
  const packed = deflateSync(raw)
  const image = trailingCompressed ? Buffer.concat([packed, Buffer.from([0])]) : packed
  const data = split ? [pngChunk(idatType, image.subarray(0, 5)), ...between, pngChunk(idatType, image.subarray(5))] : [pngChunk(idatType, image)]
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), pngChunk('IHDR', header), ...extra,
    ...data, pngChunk('IEND', Buffer.alloc(0))])
}

test('bounded PNG readers reject CRC, critical chunks, invalid filters, chunk floods and compressed suffixes', () => {
  const sample = { clip: { width: 4, height: 4 }, framebufferRgbaSha256: hash(Buffer.alloc(64, 255)) }
  const good = customPng()
  assert.deepEqual(validateAngelPng(good, 4, 4, false), { width: 4, height: 4 })
  assert.equal(validateShieldPng(good, sample).retainedRgbaSha256, sample.framebufferRgbaSha256)
  assert.deepEqual(validateAngelPng(customPng({split:true}), 4, 4, false), {width:4,height:4})
  assert.equal(validateShieldPng(customPng({split:true}), sample).retainedRgbaSha256, sample.framebufferRgbaSha256)
  const badCrc = Buffer.from(good); badCrc[29] ^= 1
  const invalid = [Buffer.from('not a PNG'), badCrc, good.subarray(0, -1),
    customPng({ filter: 5 }), customPng({ extra: [pngChunk('ABCD', Buffer.alloc(0))] }),
    customPng({ extra: Array.from({ length: 126 }, () => pngChunk('tEXt', Buffer.alloc(0))) }),
    customPng({ trailingCompressed: true }), customPng({idatType:'\u00c9DAT'}),
    customPng({extra:[pngChunk('texT',Buffer.alloc(0))]}),
    customPng({split:true,between:[pngChunk('tEXt',Buffer.from('key\0value'))]})]
  for (const bytes of invalid) {
    assert.throws(() => validateAngelPng(bytes, 4, 4, false))
    assert.throws(() => validateShieldPng(bytes, sample))
  }
  assert.throws(() => validateAngelPng(good, 1441, 4))
  assert.throws(() => validateShieldPng(good, { ...sample, clip: { width: 5, height: 4 } }))
})


test('RGB transparency chunks cannot impersonate opaque framebuffer pixels; ordinary RGB/RGBA stay exact', () => {
  const opaque = Buffer.alloc(64, 255), transparent = Buffer.from(opaque)
  for (let i = 3; i < transparent.length; i += 4) transparent[i] = 0
  const checksum = pixels => {
    let result = 2166136261
    for (const byte of pixels) result = Math.imul(result ^ byte, 16777619) >>> 0
    return result.toString(16).padStart(8, '0')
  }
  const sample = pixels => ({ clip: { width: 4, height: 4 }, framebufferRgbaSha256: hash(pixels) })
  for (const [options, pixels, colors] of [
    [{colorType:2}, opaque, 1], [{colorType:6}, opaque, 1], [{colorType:6,alpha:0}, transparent, 0],
  ]) {
    const bytes = customPng(options)
    assert.deepEqual(validateAngelPng(bytes,4,4), {width:4,height:4,opaqueColors:colors,pixelChecksum:checksum(pixels)})
    assert.deepEqual(validateShieldPng(bytes,sample(pixels)), {pngSha256:hash(bytes),retainedRgbaSha256:hash(pixels)})
  }
  // Correctly encoded RGB8 tRNS: each white RGB sample is transparent. The former
  // readers ignored this CRC-valid chunk and authenticated the opaque RGBA hash.
  const transparency = pngChunk('tRNS', Buffer.from([0,255,0,255,0,255]))
  const rgb = customPng({colorType:2,extra:[transparency]})
  assert.notEqual(hash(opaque),hash(transparent))
  for (const inspectPixels of [false,true]) assert.throws(()=>validateAngelPng(rgb,4,4,inspectPixels),/Unsupported PNG transparency/)
  for (const pixels of [opaque,transparent]) assert.throws(()=>validateShieldPng(rgb,sample(pixels)),/Unsupported PNG transparency/)
  // tRNS is invalid for RGBA; reject instead of silently treating it as metadata.
  const rgba = customPng({colorType:6,extra:[transparency]})
  assert.throws(()=>validateAngelPng(rgba,4,4),/Unsupported PNG transparency/)
  assert.throws(()=>validateShieldPng(rgba,sample(opaque)),/Unsupported PNG transparency/)
})

test('strict bounded log/ZIP transport is synchronous and rejects unresolved async values', () => {
  const f = evidence(), archive = artifactZip(Object.entries(f.files), { compress: true })
  const upload = { id: 123, name: `spell-visuals-browser-${source.commit}`, bytes: archive.length, sha256: hash(archive) }
  assert.equal(validateSpellVisualReceipt(f.receipt, f.expected), true)
  const result = resolveSpellVisualArtifact(archive, upload, f.receipt, f.expected)
  assert.equal(result.then, undefined)
  assert.throws(() => validateSpellVisualReceipt(Promise.resolve(f.receipt), f.expected))
  assert.throws(() => validateSpellVisualReceipt(f.receipt, { ...f.expected, files: Promise.resolve(f.files) }))
  assert.throws(() => resolveSpellVisualArtifact(Promise.resolve(archive), upload, f.receipt, f.expected))
  assert.throws(() => spellVisualReceiptLog({ padding: 'x'.repeat(24000) }))
  const huge = Buffer.from(JSON.stringify({ padding: 'x'.repeat(24000) }))
  assert.throws(() => readSpellVisualReceiptLog(`PND_SPELL_VISUALS_RECEIPT=${huge.toString('base64')}\nPND_SPELL_VISUALS_SHA256=${hash(huge)}`))
  for (const broken of [archive.subarray(0, -1), Buffer.concat([archive, Buffer.from([0])]), Buffer.from('not zip')]) {
    assert.throws(() => resolveSpellVisualArtifact(broken, { ...upload, bytes: broken.length, sha256: hash(broken) }, f.receipt, f.expected))
  }
  const duplicate = artifactZip([...Object.entries(f.files), ['receipt.json', f.files['receipt.json']]], { compress: true })
  assert.throws(() => resolveSpellVisualArtifact(duplicate, { ...upload, bytes: duplicate.length, sha256: hash(duplicate) }, f.receipt, f.expected))
  assert.throws(() => resolveSpellVisualArtifact(archive, { ...upload, id: Number.MAX_SAFE_INTEGER + 1 }, f.receipt, f.expected))
  assert.throws(() => resolveSpellVisualArtifact(archive, upload, f.receipt, { ...f.expected, policy: undefined }))
})

test('explicit nine-job inventory rejects invalid numeric identities without changing strict eight-job acceptance', () => {
  for (const field of ['id', 'run_attempt', 'check_suite_id']) for (const value of [0, -1, '100', NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateSpellVisualBrowserJobs(jobs(), { ...run, [field]: value }, admission))
  }
  for (const value of [0, -1, '208', NaN, Number.MAX_SAFE_INTEGER + 1]) {
    const bad = jobs(); bad[8].id = value
    assert.throws(() => validateSpellVisualBrowserJobs(bad, run, admission))
  }
  assert.equal(validateSplitBrowserJobs(jobs().slice(0, 8), run), true)
  assert.throws(() => validateSplitBrowserJobs(jobs(), run))
  const fixture = evidence()
  for (const [name, bytes] of Object.entries(fixture.sourceBlobs)) assert.equal(hash(bytes), fixture.expected.inputs[name])
})
