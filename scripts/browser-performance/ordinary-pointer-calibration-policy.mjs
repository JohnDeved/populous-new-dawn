import assert from 'node:assert/strict'
import {classify} from './protocol.mjs'
import {ordinaryPointerCommentSelection} from './ordinary-pointer-comment-admission.mjs'

export const ordinaryPointerCalibrationPolicy = Object.freeze({ version: 1,
  role: 'trusted-same-source-feasibility-not-performance', aggregateMs: 1200000,
  sessionMs: 90000, launchMs: 30000, cleanupMs: 2000, runnerMs: 1500000,
  hostedJobMinutes: 30, fileBytes: 8 * 1024 * 1024,
  sessionBytes: 32 * 1024 * 1024, aggregateBytes: 8 * 1024 * 1024,
  totalBytes: 296 * 1024 * 1024,
  order: Object.freeze(['C1','C2','C3','P1-A1','P1-A2','P2-A2','P2-A1','P3-A1','P3-A2']),
  protocolSha256: 'e7272da5a19feb797c691e62b377b1de02e079b79871a0479b50e961616fa23c',
  bindingSha256: '12160689687abb8ac79aec8376df7e282e02af94f6fbd834b12174ae5db62382' })

export function ordinaryPointerCalibrationSelection(event, eventName, ref, sha, scenario, context = {}) {
  if (eventName === 'issue_comment') return scenario === 'ordinary-pointer-calibration' &&
    ordinaryPointerCommentSelection(event, {...context, GITHUB_EVENT_NAME:eventName, GITHUB_REF:ref, GITHUB_SHA:sha})
  return eventName === 'workflow_dispatch' && ref === 'refs/heads/main' &&
    /^[a-f0-9]{40}$/.test(sha ?? '') && event?.inputs?.expected_sha === sha &&
    scenario === 'ordinary-pointer-calibration'
}

const finite = n => typeof n === 'number' && Number.isFinite(n) && n >= 0
const median = values => { const a=[...values].sort((a,b)=>a-b),i=Math.floor(a.length/2); return a.length%2?a[i]:(a[i-1]+a[i])/2 }
const rank = (values,p) => [...values].sort((a,b)=>a-b)[Math.ceil(values.length*p)-1]
const offsets = [[3,0],[3,3],[0,3],[-3,0],[0,-3],[0,0]]
export function summarizeOrdinaryPointerSession(result) {
  assert.equal(result.outcome?.status,'completed'); assert.equal(result.outcome.value?.status,'decoded-consistent-unqualified')
  assert.equal(result.comparisonEligible,false); assert.equal(result.cleanupConfirmed,true)
  assert.equal(result.observerCleanupConfirmed,true); assert.equal(result.operationSettled,true)
  assert.equal(result.waitCleanupFailed,false)
  const {packet}=result,e=result.outcome.value.evidence
  assert.equal(packet.rawMode,true,'Pinned supported smoke used raw-parent pairs')
  assert.match(e.geometrySha256,/^[a-f0-9]{64}$/);assert.equal(e.comparisonEligible,false);
  assert.equal(e.status,'records-consistent-unqualified'); assert.equal(e.warmup.length,6);assert.equal(e.measured.length,48)
  assert.ok(Array.isArray(packet.recent)&&packet.recent.length<1200)
  assert.ok(Number.isSafeInteger(e.observedFrames)&&e.observedFrames>=54&&e.observedFrames<1200 && finite(e.elapsedMs) && e.elapsedMs<90000)
  const all=[...e.warmup,...e.measured],work=[],delay=[],gap=[],serials=[],scan=[],terrain=[]
  for(let i=0;i<54;i++) {
    const v=all[i];assert.equal(v.sequence,i+1);assert.equal(v.phase,i<6?'warmup':'measured')
    assert.deepEqual(v.point,offsets[i%6].map((n,k)=>n+[900,400][k]))
    assert.equal(v.serial,v.anchorSerial+1);assert.ok(Number.isSafeInteger(v.serial)&&v.serial>0)
    const f=packet.recent[v.serial-1];assert.equal(f.timestampMs,v.callbackRafTimestampMs);assert.equal(f.state,'paused')
    const m=f.pointerBreakdown,o=m.ordinaryTerrain
    assert.equal(m.terrainPickCalls,1);assert.equal(m.objectPickCalls,2);assert.equal(o.visitedTriangles,29376)
    assert.equal(v.terrainCalls,1);assert.equal(v.objectCalls,2);assert.equal(v.ordinaryTriangles,29376)
    assert.equal(m.interaction.pointerMoved,true);assert.equal(m.interaction.viewChanged,false)
    assert.ok(finite(o.triangleScanMs)&&finite(m.terrainPickMs))
    const w=v.resultWitness;assert.ok(['world','unmapped-cell','unmapped-object'].includes(w.route))
    for(const k of ['picked','cell','inspectionTarget','hoveredObject'])assert.ok(w[k]===null||(Number.isSafeInteger(w[k])&&w[k]>=0))
    work.push([v.sequence,v.phase,v.point,1,2,29376,w])
    if(i>=6) {
      const d=v.observedCompletedAtMs-v.timestampMs,g=v.timestampMs-all[i-1].observedCompletedAtMs,s=v.serial-all[i-1].serial
      assert.ok(finite(d)&&finite(g)&&Number.isSafeInteger(s)&&s>0)
      delay.push(d);gap.push(g);serials.push(s);scan.push(o.triangleScanMs/m.terrainPickCalls);terrain.push(m.terrainPickMs/m.terrainPickCalls)
    }
  }
  const schedule={delayP50:median(delay),delayP95:rank(delay,.95),gapP50:median(gap),gapP95:rank(gap,.95),serialP50:median(serials),serialP95:rank(serials,.95)}
  const cycles=Array.from({length:8},(_,i)=>({cycle:i+1,delayP50:median(delay.slice(i*6,i*6+6)),gapP50:median(gap.slice(i*6,i*6+6)),serialP50:median(serials.slice(i*6,i*6+6))}))
  return {schedule,cycles,work,geometrySha256:e.geometrySha256,rawMode:packet.rawMode,
    cpu:{scanP50:rank(scan,.5),scanP95:rank(scan,.95),terrainP50:rank(terrain,.5),terrainP95:rank(terrain,.95)},
    samples:48,comparisonEligible:false}
}

const floors=Object.freeze({delayP50:2,delayP95:5,gapP50:50,gapP95:100,serialP50:1,serialP95:1})
export function ordinaryPointerCalibrationEnvelope(summaries) {
  assert.equal(summaries.length,3); const bounds={},failures=[]
  for(const key of Object.keys(floors)) {
    const v=summaries.map(s=>s.schedule[key]);assert.ok(v.every(finite))
    const low=Math.min(...v),high=Math.max(...v),delta=Math.max(floors[key],.25*median(v))
    bounds[key]={low:Math.max(0,low-delta),high:high+delta,delta}
    if(high-low>2*delta)failures.push(key)
  }
  return {version:1,status:failures.length?'inconclusive':'stable',bounds,failures,comparisonEligible:false}
}

export function ordinaryPointerHeldout(envelope,summaries) {
  assert.equal(envelope.status,'stable');assert.equal(summaries.length,6)
  const scheduling=[]
  summaries.forEach((s,i)=>{for(const [key,b] of Object.entries(envelope.bounds))
    if(!finite(s.schedule[key])||s.schedule[key]<b.low||s.schedule[key]>b.high)scheduling.push({session:i,key})})
  // Pair order is A1,A2; A2,A1; A1,A2. Never treat 48 events as independent sessions.
  const cpu={};let controlSignal=false
  for(const key of ['scanP50','scanP95','terrainP50','terrainP95']) {
    const a=[summaries[0].cpu[key],summaries[3].cpu[key],summaries[4].cpu[key]],b=[summaries[1].cpu[key],summaries[2].cpu[key],summaries[5].cpu[key]]
    assert.ok([...a,...b].every(finite))
    const center=median(a),range=Math.max(...a)-Math.min(...a),floor=Math.max(.1,.05*center,2*range),repeatLimit=Math.max(.1,.15*center)
    const differences=b.map((n,i)=>n-a[i]),signal=differences.every(n=>n>floor)||differences.every(n=>n< -floor)
    const repeatExceeded=range>repeatLimit || Math.max(...b)-Math.min(...b)>Math.max(.1,.15*median(b))
    const classification=classify(a,b) // Existing classifier and thresholds are unchanged.
    cpu[key]={a,b,differences,floor,repeatLimit,signal,repeatExceeded,classification};controlSignal ||= signal||repeatExceeded
  }
  return {status:scheduling.length||controlSignal?'inconclusive':'feasible',scheduling,cpu,
    comparisonEligible:false,limits:'Three same-source pairs are feasibility only, not population precision or performance admission.'}
}
