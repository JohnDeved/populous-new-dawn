// Explicit trusted-main route only. Import does not launch a browser or session.
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync,readdirSync,lstatSync,openSync,readSync,closeSync} from 'node:fs'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
import smoke from './ordinary-pointer-smoke.mjs'
import {ordinaryPointerSmokeArtifact,closeOrdinaryPointerSmokeOwner} from './ordinary-pointer-smoke-policy.mjs'
import {ordinaryPointerCalibrationPolicy as P,summarizeOrdinaryPointerSession,
  ordinaryPointerCalibrationEnvelope,ordinaryPointerHeldout} from './ordinary-pointer-calibration-policy.mjs'

function fileHash(path){
  const fd=openSync(path,'r'),buffer=Buffer.alloc(1024*1024),digest=createHash('sha256')
  try{let count;while((count=readSync(fd,buffer,0,buffer.length,null))>0)digest.update(buffer.subarray(0,count));return digest.digest('hex')}finally{closeSync(fd)}
}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
export function ordinaryPointerCalibrationFiles(directory,limit=P.sessionBytes) {
  let bytes=0;const files=[]
  for(const name of readdirSync(directory).sort()) {
    const path=resolve(directory,name),stat=lstatSync(path)
    assert.ok(stat.isFile()&&!stat.isSymbolicLink(),'Session artifact must be a regular file')
    assert.ok(stat.size<=P.fileBytes,'Session artifact file cap');bytes+=stat.size
    assert.ok(bytes<=limit,'Session artifact total cap')
    files.push({name,bytes:stat.size,sha256:hash(readFileSync(path))})
  }
  return {bytes,files}
}

export default async function ordinaryPointerCalibration({chromium,launch,url,output,source,expectedRevision,dist,browserIdentity,receipt={},
  runSession=smoke,closeOwner=closeOrdinaryPointerSmokeOwner,now=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout}) {
  assert.equal(source.commit,expectedRevision,'One trusted source/build for all labels')
  assert.match(source.commit,/^[a-f0-9]{40}$/)
  assert.match(browserIdentity.sha256,/^[a-f0-9]{64}$/)
  const verifyBrowser=()=>assert.equal(fileHash(browserIdentity.path),browserIdentity.sha256,'Browser executable changed')
  verifyBrowser()
  const root=resolve(output,'ordinary-pointer-calibration');mkdirSync(root)
  Object.assign(receipt,{version:1,role:P.role,status:'incomplete',policy:P,sourceCommit:source.commit,
    expectedRevision,browserIdentity:{...browserIdentity},comparisonEligible:false,sessions:[],qualification:'incomplete'})
  let stopped=false,finalized=false,operationSettled=false,owner,launchPending=false,timer,failed=false,primary,
    referenceWork,referenceGeometry,referenceProvenance,referenceBrowser,totalBytes=0,envelope,envelopeHash
  let started,last,initialClockFailed=false,initialClockError
  try{started=now();assert.ok(Number.isFinite(started)&&started>=0);last=started}
  catch(error){initialClockFailed=true;initialClockError=error;receipt.initialClockFailed=true;receipt.initialClockError=error}
  const safelyClose=async operation=>{try{return await closeOwner(operation)}catch(error){return {confirmed:false,error}}}
  const check=()=>{if(initialClockFailed)throw initialClockError;const t=now();assert.ok(Number.isFinite(t)&&t>=last,'Aggregate clock must be monotonic');last=t;if(stopped||t-started>=P.aggregateMs)throw Error('Aggregate deadline/terminal boundary')}
  const save=()=>{if(!finalized)writeFileSync(resolve(root,'aggregate.json'),ordinaryPointerSmokeArtifact(receipt))}
  const execute=async()=>{
    try {
      for(let index=0;index<P.order.length;index++) {
        check();const label=P.order[index],directory=resolve(root,label);mkdirSync(directory)
        const session={label,index,status:'incomplete',comparisonEligible:false};receipt.sessions.push(session);save()
        if(index>=3) {
          assert.equal(hash(readFileSync(resolve(root,'calibration-envelope.json'))),envelopeHash,'Frozen envelope changed')
          assert.equal(envelope.status,'stable')
          for(const calibration of receipt.sessions.slice(0,3)){
            const raw=resolve(root,calibration.label,'ordinary-pointer-raw.json'),stat=lstatSync(raw)
            assert.ok(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=P.fileBytes)
            assert.equal(fileHash(raw),calibration.rawSha256,'Calibration raw evidence changed')
          }
        }
        let sessionFailed=false,sessionError
        try {
          verifyBrowser();launchPending=true
          try {owner=await chromium.launch({...launch,timeout:P.launchMs})} finally {launchPending=false}
          check()
          const version=owner.version();if(referenceBrowser===undefined)referenceBrowser=version
          assert.equal(version,referenceBrowser,'Browser version changed')
          session.browserVersion=version
          const detail={}
          await runSession({browser:owner,url,output:directory,source,expectedRevision,dist,receipt:detail})
          check()
          verifyBrowser();assert.equal(detail.status,'passed');assert.equal(detail.readerAdmission,'admitted')
          assert.equal(detail.contextCleanup?.confirmed,true);assert.equal(detail.browserCleanup?.confirmed,true)
          assert.equal(detail.operationSettled,true)
          const prep=detail.preparation,p=prep.provenance
          const provenance={dependencies:p.dependencies.sha256,bundle:p.bundle,readerSource:p.readerSource,readerProvenance:p.readerProvenance}
          if(referenceProvenance===undefined)referenceProvenance=structuredClone(provenance)
          assert.deepEqual(provenance,referenceProvenance,'Same-source runtime/provenance drift')
          const path=resolve(directory,'ordinary-pointer-raw.json'),stat=lstatSync(path)
          assert.ok(stat.isFile()&&!stat.isSymbolicLink()&&stat.size<=P.fileBytes)
          const bytes=readFileSync(path),summary=summarizeOrdinaryPointerSession(JSON.parse(bytes))
          if(referenceWork===undefined){referenceWork=structuredClone(summary.work);referenceGeometry=summary.geometrySha256}
          assert.deepEqual(summary.work,referenceWork,'Ordered per-event work/result mismatch')
          assert.equal(summary.geometrySha256,referenceGeometry,'Geometry changed across sessions')
          session.summary=summary;session.rawSha256=hash(bytes);session.status='passed'
          session.cleanup={context:true,browser:true,operationSettled:true};owner=undefined
        } catch(error) {sessionFailed=true;sessionError=error;session.status='failed';session.error=error}
        finally {
          if(owner){session.ownerCleanup=await safelyClose(()=>owner.close());if(session.ownerCleanup.confirmed)owner=undefined
            else {session.status='failed';if(!sessionFailed){sessionFailed=true;sessionError=Error('Aggregate session owner cleanup unconfirmed')}}}
          if(!finalized){
            try {
              writeFileSync(resolve(directory,'calibration-session.json'),ordinaryPointerSmokeArtifact(session),{flag:'wx'})
              const files=ordinaryPointerCalibrationFiles(directory);session.files=files;totalBytes+=files.bytes
              assert.ok(totalBytes<=9*P.sessionBytes,'Aggregate session artifact quota');save()
            } catch(error) {session.status='failed';session.artifactError=error;if(!sessionFailed){sessionFailed=true;sessionError=error}}
          }
        }
        if(sessionFailed)throw sessionError
        check()
        if(index===2) {
          envelope=ordinaryPointerCalibrationEnvelope(receipt.sessions.map(s=>s.summary))
          const text=ordinaryPointerSmokeArtifact({sourceCommit:source.commit,protocol:P.protocolSha256,
            calibration:receipt.sessions.map(s=>({label:s.label,rawSha256:s.rawSha256})),...envelope})
          writeFileSync(resolve(root,'calibration-envelope.json'),text,{flag:'wx'});envelopeHash=hash(text)
          receipt.envelopeSha256=envelopeHash;receipt.envelope=envelope;save()
          if(envelope.status!=='stable'){receipt.qualification='inconclusive';return}
        }
      }
      receipt.heldout=ordinaryPointerHeldout(envelope,receipt.sessions.slice(3).map(s=>s.summary))
      receipt.qualification=receipt.heldout.status
    } finally {operationSettled=true}
  }
  const operation=Promise.resolve().then(execute)
  try {
    save()
    await Promise.race([operation,new Promise((_,reject)=>{timer=schedule(()=>{stopped=true;reject(Error('Aggregate wall deadline'))},P.aggregateMs)})])
    check();receipt.status=receipt.qualification==='feasible'?'passed':'inconclusive'
  } catch(error) {failed=true;primary=error;receipt.status='failed';receipt.failure=error}
  finally {
    stopped=true
    try {cancel(timer)}catch(error){receipt.timerCleanupFailed=true;receipt.timerCleanupError=error;receipt.status='failed';if(!failed){failed=true;primary=error}}
    if(owner)receipt.finalOwnerCleanup=await safelyClose(()=>owner.close())
    receipt.operationSettled=operationSettled;receipt.launchPending=launchPending
    receipt.cleanupVerified=operationSettled&&!launchPending&&(!owner||receipt.finalOwnerCleanup?.confirmed===true)
    if(!receipt.cleanupVerified&&!failed){failed=true;primary=Error('Aggregate operation/owner cleanup uncertain');receipt.status='failed'}
    receipt.sessionArtifactBytes=totalBytes
    try {const ended=now();assert.ok(!initialClockFailed&&Number.isFinite(ended)&&ended>=last,'Aggregate clock must be monotonic');receipt.elapsedMs=ended-started}
    catch(error){receipt.clockFailed=true;receipt.clockError=error;receipt.status='failed';if(!failed){failed=true;primary=error}}
    try{receipt.sessions=structuredClone(receipt.sessions)}catch(error){
      receipt.detachmentFailed=true;receipt.detachmentError=error;receipt.status='failed'
      receipt.sessions=receipt.sessions.map(({label,index,status})=>({label,index,status,evidenceOmitted:'Noncloneable failure value'}))
      if(!failed){failed=true;primary=error}
    }
    try {save()}catch(error){if(!failed){failed=true;primary=error;receipt.status='failed'}}finally{finalized=true}
    // Late launches settle into execute's check/finally path and close their owner;
    // they cannot launch another session or rewrite the frozen aggregate receipt.
    operation.catch(()=>{})
  }
  if(failed)throw primary
  return receipt
}
