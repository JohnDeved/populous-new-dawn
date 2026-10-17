import assert from 'node:assert/strict'
export const median=values=>{const v=[...values].sort((a,b)=>a-b);return(v[(v.length-1)>>1]+v[v.length>>1])/2}
export const stats=values=>{const v=[...values].sort((a,b)=>a-b);return{count:v.length,medianNs:median(v),p95Ns:v[Math.ceil(v.length*.95)-1],p99Ns:v[Math.ceil(v.length*.99)-1],maxNs:v.at(-1),totalNs:v.reduce((a,b)=>a+b,0)}}
const spread=values=>Math.max(...values)/Math.min(...values)
export function summarize(rows,config) {
  const warm=rows.filter(r=>r.type==='warmup'),samples=rows.filter(r=>r.type==='sample')
  assert.equal(warm.length,128);assert.equal(samples.length,256)
  for(const entries of [warm,samples])entries.forEach((r,i)=>{assert.equal(r.index,i);assert.ok(Number.isFinite(r.ns)&&r.ns>0)})
  const w=warm.map(r=>r.ns),v=samples.map(r=>r.ns)
  const quarterMedians=[0,64,128,192].map(i=>median(v.slice(i,i+64)))
  const ratios={earlyLate:quarterMedians[0]/quarterMedians[3],warmWindows:median(w.slice(0,64))/median(w.slice(64)),warmToFirst:median(w.slice(64))/quarterMedians[0]}
  return{...stats(v),quarterMedians,ratios,stable:Object.values(ratios).every(x=>x>=1/config.ratioGuard&&x<=config.ratioGuard)}
}
export function qualify(runs,config) {
  assert.equal(runs.length,4)
  const medianSpread=spread(runs.map(r=>r.medianNs)),p95Spread=spread(runs.map(r=>r.p95Ns))
  return{pass:runs.every(r=>r.stable)&&medianSpread<=config.ratioGuard&&p95Spread<=config.ratioGuard,medianSpread,p95Spread,withinRuns:runs.map(r=>r.stable),guard:config.ratioGuard,note:'Chosen engineering noise guardrail, not a statistical confidence test.'}
}
export function compare(qualificationRuns,abba,config) {
  assert.equal(abba.length,4)
  const baselineRuns=[...qualificationRuns,abba[0],abba[3]]
  const medSpread=spread(baselineRuns.map(r=>r.medianNs)),p95Spread=spread(baselineRuns.map(r=>r.p95Ns))
  const stable=abba.every(r=>r.stable)&&medSpread<=config.ratioGuard&&p95Spread<=config.ratioGuard
  const pairs=[[abba[0],abba[1]],[abba[3],abba[2]]].map(([baseline,candidate])=>({baseline,candidate,medianRatio:candidate.medianNs/baseline.medianNs,p95Ratio:candidate.p95Ns/baseline.p95Ns}))
  const positive=stable&&pairs.every(p=>p.medianRatio<=config.improvementScreen&&p.p95Ratio<=config.tailGuard)
  const slower=stable&&pairs.every(p=>p.medianRatio>1)
  return{status:positive?'positive screening only':slower?'negative evidence, no acceptance':'inconclusive',stable,baselineMedianSpread:medSpread,baselineP95Spread:p95Spread,pairs,note:'Two process pairs only; inner samples are correlated. P99 uses about three upper-tail observations. No causal, FPS, rare-stutter or merge claim.'}
}
