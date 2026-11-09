// Synthetic authenticated Actions pipeline, not hosted/browser acceptance.
import { createHash } from 'node:crypto'
import { passiveBrowserFixture } from './passive-browser-reader.mjs'
import { tornadoEvidenceFixture } from './composed-tornado-fixture.mjs'
import { spyEvidenceFixture } from './composed-spy-fixture.mjs'
import { readArtifactZip } from '../../scripts/artifact-zip.mjs'
import { artifactZip } from './artifact-zip.mjs'
import { COMPOSED_SOURCE_INPUTS } from '../../scripts/integration-queue/composed-profile-artifact.mjs'
const hash=b=>createHash('sha256').update(b).digest('hex')
const bytes=o=>Buffer.from(JSON.stringify(o))
const json=b=>JSON.parse(b.toString('utf8'))
function unzip(zip){return readArtifactZip(zip,{maxArchiveBytes:16*1024*1024,maxFileBytes:32*1024*1024,maxTotalBytes:128*1024*1024,maxEntries:128,allowName:()=>true})}
export function composedBrowserFixture({secondFrame=1}={}) {
  const f=passiveBrowserFixture({nine:false}),identity=f.f.expected.identity
  f.entry.profileArtifactPolicy='composed-spells-eight-v1';f.entry.browserCheckpointVersion=3
  const tornado=tornadoEvidenceFixture({mergeSha:identity.mergeSha,browserVersion:'synthetic'})
  const spy=spyEvidenceFixture({secondFrame,mergeSha:identity.mergeSha,browserVersion:'synthetic'})
  const sourceBytes={...Object.fromEntries(COMPOSED_SOURCE_INPUTS.map(p=>[p,Buffer.from(p)])),...tornado.sourceBytes,...spy.sourceBytes}
  Object.assign(f.sourceBlobs,sourceBytes)
  const records=[]
  for(const [index,jobId,prefix] of [[0,1004,'PND_PROFILE_CASES'],[1,1005,'PND_MISSION10_CREW']]) {
    const files=unzip(f.archives.get(3000+index)),host=json(files.get('receipt.json'))
    const line=f.logs.get(jobId).split('\n').find(x=>x.startsWith(prefix+'_RECEIPT='))
    const receipt=json(Buffer.from(line.split('=')[1],'base64'))
    Object.assign(host.source.files,Object.fromEntries(Object.entries(sourceBytes).map(([p,b])=>[p,hash(b)])))
    if(index===0){host.tornadoAppearance=structuredClone(tornado.hostReport);for(const [p,b] of tornado.files)files.set(p,b);files.set('tornado-appearance.json',bytes(tornado.report))}
    else {
      host.spySource=structuredClone(spy.report);for(const [p,b] of spy.files)files.set(p,b);files.set('spy-source.json',bytes(spy.report))
      const manifest=json(files.get('mission10-artifacts.json'))
      const report=json(files.get('mission10-profile.json'));report.deadlineAt=spy.mission10Report.deadlineAt
      for(const [i,mode] of ['created','reused'].entries()){
        const path=`mission10-${mode}--receipt.json`,raw=json(files.get(path));Object.assign(raw,spy.phaseReceipts[i]);files.set(path,bytes(raw))
        const digest=hash(files.get(path)),size=files.get(path).length
        const entry=manifest.files.find(e=>e.retained.path===path)
        for(const part of [entry.source,entry.retained]){part.sha256=digest;part.bytes=size}
        report.phases[i].receiptSha256=digest;receipt.mission10.phases[i].receiptSha256=digest
      }
      files.set('mission10-artifacts.json',bytes(manifest));files.set('mission10-profile.json',bytes(report))
      host.mission10Profile=report
      receipt.mission10.reportSha256=hash(files.get('mission10-profile.json'))
      receipt.mission10.artifacts.sha256=hash(files.get('mission10-artifacts.json'));receipt.mission10.artifacts.bytes=files.get('mission10-artifacts.json').length
    }
    records.push({index,jobId,prefix,files,host,receipt})
  }
  function rebuild(record, extraEntries = []) {
    const {index,jobId,prefix,files,host,receipt}=record
    files.set('receipt.json',bytes(host));receipt.receiptSha256=hash(files.get('receipt.json'))
    const zip=artifactZip([...files, ...extraEntries],{compress:true}),metadata=f.artifacts[index]
    metadata.size_in_bytes=zip.length;metadata.digest='sha256:'+hash(zip);Object.assign(f.metadata[index],metadata)
    f.archives.set(metadata.id,zip)
    const start=f.logs.get(jobId).split(prefix+'_RECEIPT=')[0],encoded=bytes(receipt)
    f.logs.set(jobId,start+`${prefix}_RECEIPT=${encoded.toString('base64')}\n${prefix}_SHA256=${hash(encoded)}\nSHA256 digest of uploaded artifact zip is ${hash(zip)}\nArtifact ${metadata.name}.zip successfully finalized. Artifact ID ${metadata.id}\nArtifact ${metadata.name} has been successfully uploaded! Final size is ${zip.length} bytes. Artifact ID is ${metadata.id}`)
  }
  records.forEach(record => rebuild(record))
  return Object.assign(f,{records,rebuild,sourceBytes,tornado,spy})
}
