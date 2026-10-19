import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { artifactZip } from './support/artifact-zip.mjs'
import { readArtifactZip } from '../scripts/artifact-zip.mjs'
import { writeMission10Fixture } from './support/mission10-profile-receipt.mjs'
import { profileRecoveryReceipt } from '../scripts/tutorial-browser/profile-recovery-receipt.mjs'
import { profileArtifactUpload, resolveProfileArtifact, validateProfileArtifactMetadata, profileArchiveLimit } from '../scripts/integration-queue/profile-artifact.mjs'
import { GitHubReader } from '../scripts/integration-queue/github.mjs'
const hash = value => createHash('sha256').update(value).digest('hex')
const options = { maxArchiveBytes: 1024, maxFileBytes: 100, maxTotalBytes: 150, maxEntries: 2, allowName: name => name === 'a.json' || name === 'b.json' }
const read = bytes => readArtifactZip(bytes, options)
test('bounded multi-file ZIP rejects traversal, duplicate, links, corruption, overlaps and archive bombs', () => {
  const good = artifactZip([['a.json', '{}'], ['b.json', '{}']])
  assert.deepEqual([...read(good).keys()], ['a.json', 'b.json'])
  for (const files of [[['a.json','{}'],['a.json','{}']], [['../a.json','{}']], [['/a.json','{}']], [['a.json/../b.json','{}']], [['unknown.json','{}']], [['a.json','x'.repeat(101)]], [['a.json','x'.repeat(80)],['b.json','x'.repeat(80)]]])
    assert.throws(() => read(artifactZip(files)))
  const central = good.readUInt32LE(good.length - 6)
  for (const mutate of [
    b => { b[14] ^= 1 }, b => b.writeUInt32LE(0xa1ff0000, central + 38),
    b => b.writeUInt32LE(0, central + 52 + 42), b => b.writeUInt32LE(0xffffffff, central + 24),
    b => b.writeUInt16LE(1, central + 8), b => b.writeUInt16LE(99, central + 10),
    b => b.writeUInt16LE(65535, b.length - 12), b => b.writeUInt32LE(0xffffffff, b.length - 6),
    b => b.writeUInt16LE(1, b.length - 18), b => b.writeUInt16LE(1, b.length - 2),
  ]) { const bad = Buffer.from(good); mutate(bad); assert.throws(() => read(bad)) }
  assert.throws(() => read(good.subarray(0, good.length - 1)))
  assert.throws(() => read(Buffer.concat([good, Buffer.alloc(1024)])))
})
test('streamed zero local fields require a consistent bounded data descriptor', () => {
  const original = artifactZip([['a.json', '{}']]), central = original.readUInt32LE(original.length - 6)
  const descriptor = Buffer.alloc(16); descriptor.writeUInt32LE(0x08074b50)
  original.copy(descriptor, 4, 14, 26)
  const streamed = Buffer.concat([original.subarray(0, central), descriptor, original.subarray(central)])
  streamed.writeUInt16LE(8, 6); streamed.fill(0, 14, 26)
  streamed.writeUInt16LE(8, central + 16 + 8)
  streamed.writeUInt32LE(central + 16, streamed.length - 6)
  assert.equal(read(streamed).get('a.json').toString(), '{}')
  for (const offset of [central + 4, central + 8, central + 12]) {
    const bad = Buffer.from(streamed); bad[offset] ^= 1
    assert.throws(() => read(bad))
  }
})

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'artifact-admission-'))
  const h = 'a'.repeat(64), source = { commit: '1'.repeat(40), files: {} }
  const host = { status: 'passed', source, profileRecovery: { status: 'passed', cases: [], screenshots: [] },
    browserSha256: h, browserVersion: 'Chrome', node: process.version, launch: {}, buildPackageVersions: {} }
  host.mission10Profile = writeMission10Fixture(dir, host)
  const env = { GITHUB_REPOSITORY: 'JohnDeved/populous-new-dawn', GITHUB_RUN_ID: '100', GITHUB_RUN_ATTEMPT: '2', PR_HEAD_SHA: '2'.repeat(40), PR_BASE_SHA: '3'.repeat(40) }
  host.github = { head: env.PR_HEAD_SHA, base: env.PR_BASE_SHA, merge: source.commit, runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT }
  writeFileSync(join(dir,'receipt.json'), JSON.stringify(host))
  writeFileSync(join(dir,'profile-recovery.json'), JSON.stringify(host.profileRecovery))
  const receipt = profileRecoveryReceipt(host,dir,env)
  const files = readdirSync(dir).filter(name => statSync(join(dir,name)).isFile()).map(name => [name,readFileSync(join(dir,name))])
  rmSync(dir,{recursive:true,force:true})
  const archive = artifactZip(files), upload = { id: 200, name: `profile-recovery-browser-${source.commit}`, bytes: archive.length, sha256: hash(archive) }
  const log = `SHA256 digest of uploaded artifact zip is ${upload.sha256}\nArtifact ${upload.name}.zip successfully finalized. Artifact ID ${upload.id}\nArtifact ${upload.name} has been successfully uploaded! Final size is ${upload.bytes} bytes. Artifact ID is ${upload.id}`
  const url = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/artifacts/200`
  const metadata = { id: 200, name: upload.name, expired: false, size_in_bytes: archive.length, digest: `sha256:${upload.sha256}`,
    url, archive_download_url: `${url}/zip`, workflow_run: { id: 100, head_sha: env.PR_HEAD_SHA } }
  return { receipt, archive, upload, log, metadata, files }
}
test('artifact identity binds current upload, API run/head, raw receipts, source and every retained manifest file', () => {
  const f = fixture()
  assert.deepEqual(profileArtifactUpload(f.log, f.receipt.identity.mergeSha), f.upload)
  validateProfileArtifactMetadata(f.metadata, f.upload, f.receipt.identity)
  assert.equal(resolveProfileArtifact(f.archive, f.upload, f.receipt).length, 2)
  for (const log of ['', f.log+'\n'+f.log, f.log.replace('Artifact ID is 200','Artifact ID is 201'), f.log.replace(f.upload.name, 'unknown')])
    assert.throws(() => profileArtifactUpload(log, f.receipt.identity.mergeSha))
  for (const mutate of [v => { v.id++ }, v => { v.expired=true }, v => { v.name+='x' }, v => { v.size_in_bytes++ }, v => { v.digest='sha256:'+'b'.repeat(64) }, v => { v.workflow_run.id++ }, v => { v.workflow_run.head_sha='3'.repeat(40) }, v => { v.archive_download_url='https://example.com' }]) {
    const bad=structuredClone(f.metadata);mutate(bad);assert.throws(()=>validateProfileArtifactMetadata(bad,f.upload,f.receipt.identity))
  }
  for (const mutate of [r => { r.receiptSha256='b'.repeat(64) }, r => { r.identity.mergeSha='3'.repeat(40) }, r => { r.mission10.artifacts.bytes++ }, r => { r.mission10.phases[0].resultSha256='b'.repeat(64) }, r => { r.mission10.phases[0].binding[3]='wrong-profile' }, r => { r.mission10.sourceFingerprint='b'.repeat(64) }]) {
    const bad=structuredClone(f.receipt);mutate(bad);assert.throws(()=>resolveProfileArtifact(f.archive,f.upload,bad))
  }
  const bad = Buffer.from(f.archive); bad[40]^=1
  assert.throws(()=>resolveProfileArtifact(bad,f.upload,f.receipt))
  for (const files of [f.files.slice(1), [...f.files, f.files[0]], [...f.files,['unknown.json','{}']], f.files.map(([name,data]) => [name,name === 'mission10-created--boat-checkpoint.json' ? Buffer.from('{}') : data])]) {
    const archive=artifactZip(files), upload={...f.upload,bytes:archive.length,sha256:hash(archive)}
    assert.throws(()=>resolveProfileArtifact(archive,upload,f.receipt))
  }
  // Even with a fresh compact identity and newly hashed/uploaded archive,
  // an older same-source host receipt must not be replayed into a new attempt.
  for (const key of ['head', 'base', 'merge', 'runId', 'runAttempt']) {
    const files=f.files.map(([n,b])=>[n,Buffer.from(b)]), at=files.findIndex(([n])=>n==='receipt.json')
    const host=JSON.parse(files[at][1]);host.github[key]=key === 'runAttempt' ? '1' : 'prior';files[at][1]=Buffer.from(JSON.stringify(host))
    const receipt=structuredClone(f.receipt);receipt.receiptSha256=hash(files[at][1])
    const archive=artifactZip(files)
    assert.throws(()=>resolveProfileArtifact(archive,{...f.upload,bytes:archive.length,sha256:hash(archive)},receipt),/Raw host GitHub/)
  }
  // Rebinding a malformed manifest does not make its schema/inventory acceptable.
  for (const mutate of [m => m.files.pop(), m => { m.files[0]=m.files[1] }, m => { m.files[0].source.path='../receipt.json' }, m => { m.complete=false }, m => { m.files[0].retained.bytes++ }]) {
    const files=f.files.map(([n,b])=>[n,Buffer.from(b)]), at=files.findIndex(([n])=>n==='mission10-artifacts.json')
    const m=JSON.parse(files[at][1]);mutate(m);files[at][1]=Buffer.from(JSON.stringify(m))
    const receipt=structuredClone(f.receipt);receipt.mission10.artifacts.bytes=files[at][1].length;receipt.mission10.artifacts.sha256=hash(files[at][1])
    const archive=artifactZip(files)
    assert.throws(()=>resolveProfileArtifact(archive,{...f.upload,bytes:archive.length,sha256:hash(archive)},receipt))
  }
})
test('reader has an explicitly injected, bounded, numeric-only binary GET and no generic URL transport', () => {
  const calls=[]
  const reader=new GitHubReader({cwd:'/trusted',execute:()=>assert.fail('Unexpected text transport'),executeBinary:(...args)=>{calls.push(args);return Buffer.from('zip')}})
  assert.deepEqual(reader.artifactArchive(200),Buffer.from('zip'))
  assert.deepEqual(calls[0].slice(0,2),['gh',['api','--hostname','github.com','--method','GET','repos/JohnDeved/populous-new-dawn/actions/artifacts/200/zip']])
  assert.equal(calls[0][2].cwd,'/trusted');assert.equal(calls[0][2].maxBuffer,profileArchiveLimit);assert.equal(calls[0][2].timeout,30000)
  assert.equal(calls[0][2].encoding,undefined)
  for (const id of ['200','https://example.com',0,-1,1.5,Infinity]) assert.throws(()=>reader.artifactArchive(id))
  assert.equal(calls.length,1)
  assert.throws(()=>new GitHubReader({execute:()=>{}}).artifactArchive(200),/explicitly injected/)
  const f=fixture(); const seen=[]
  reader.pages=(endpoint,key)=>{seen.push(endpoint);assert.equal(key,'artifacts');return [f.metadata]}
  reader.get=endpoint=>{seen.push(endpoint);return f.metadata}
  reader.artifactArchive=id=>{assert.equal(id,200);return f.archive}
  assert.equal(reader.profileEvidence(f.log,f.receipt,f.receipt.identity).length,2)
  assert.deepEqual(seen,['repos/JohnDeved/populous-new-dawn/actions/runs/100/artifacts','repos/JohnDeved/populous-new-dawn/actions/artifacts/200'])
  reader.pages=()=>[f.metadata,f.metadata];assert.throws(()=>reader.profileEvidence(f.log,f.receipt,f.receipt.identity),/duplicate/)
})
