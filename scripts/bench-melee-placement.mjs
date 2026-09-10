// Paired CPU measurement of original versus chosen-point-only height sampling.
// This is a search workload, not a frame-rate benchmark.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import os from 'node:os'
import { relocateFight, validFightSite } from '../app/melee-placement.ts'
import { createIndexedSearch, startIndexedSearch, nextIndexedSearch, endIndexedSearch } from '../app/indexed-search.ts'
import { terrainPointHeight } from '../app/native-terrain.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

// Original 0x519d10 order, with the same validity, search and terrain helpers.
function original(w, fight) {
  const move = to => Object.assign(fight, to, { h: w.height(to) })
  const cell = w.collision.cell(fight)
  if (cell.flags & 512) move(w.outside(cell.building & 1023))
  if (fight.counter & 31 || validFightSite(w, fight, fight)) return
  const id = startIndexedSearch(w.search, 2, fight.angle, 0, 8)
  if (!id) return
  const x = (fight.x >> 8) & 254, y = (fight.y >> 8) & 254
  for (let o = nextIndexedSearch(w.search, id); o; o = nextIndexedSearch(w.search, id)) {
    const to = { x: (((x + o.x * 2) & 255) + 1) * 256 & 65535, y: (((y + o.y * 2) & 255) + 1) * 256 & 65535 }
    to.h = w.height(to)
    if (validFightSite(w, fight, to)) { move(to); break }
  }
  endIndexedSearch(w.search, id)
}
const index = p => ((p.y & 65535) >> 9) * 128 + ((p.x & 65535) >> 9)
const category = rules.terrainCategoryFlags.findIndex(f => f & 1)
const land = { heights: Int16Array.from({length:16384}, (_, i) => (i * 37) % 600), flags: Uint32Array.from({length:16384}, (_, i) => i & 1) }
const cases = Array.from({length:256}, (_, i) => ({ id:1, x:(i * 197)&65535, y:(i * 719)&65535, h:100, angle:(i*53)&2047, counter:0, model:8, flags2:0, flags4:0, tribe:255, workTarget:0, target:0 }))
let heightCalls = 0
const w = {
  search:createIndexedSearch(), height:p => { heightCalls++; return terrainPointHeight(land,p) },
  outside:() => assert.fail('workload has no buildings'), occupied:() => false,
  collision:{ cell:p => ({ flags:land.flags[index(p)] | (index(p)%19 ? 4 : 0), category, building:0 }), objects:new Map(), boatAt:() => false, walkMask:new Uint8Array(8192).fill(255) },
}
for (const c of cases) {
  const a={...c}, b={...c};w.search.fill(0);original(w,a);const pool=[...w.search]
  w.search.fill(0);relocateFight(w,b);assert.deepEqual(b,a);assert.deepEqual([...w.search],pool)
}
function run(fn) {
  heightCalls=0;let checksum=0;const start=performance.now()
  for(let repeat=0;repeat<12;repeat++) for(const c of cases){const f={...c};fn(w,f);checksum+=f.x+f.y+f.h}
  return {ms:performance.now()-start,heightCalls,checksum}
}
for(let i=0;i<4;i++){run(original);run(relocateFight)}
const before=[],after=[]
for(let i=0;i<11;i++){
  const pair=i&1?[run(relocateFight),run(original)].reverse():[run(original),run(relocateFight)]
  assert.equal(pair[0].checksum,pair[1].checksum);before.push(pair[0]);after.push(pair[1])
}
const median = a => a.map(v=>v.ms).sort((a,b)=>a-b)[5]
const report={workload:'256 deterministic restricted-terrain fight sites, 12 repetitions per sample; 11 interleaved warmed samples. CPU search cost only; no display FPS or whole-game speedup claim.',node:process.version,cpu:os.cpus()[0].model,queries:cases.length*12,original:{medianMs:median(before),heightCalls:before[0].heightCalls,samples:before.map(v=>v.ms)},chosenPointOnly:{medianMs:median(after),heightCalls:after[0].heightCalls,samples:after.map(v=>v.ms)}}
writeFileSync('/private/tmp/populous-melee-placement-bench.json',JSON.stringify(report,null,2)+'\n')
console.log(report)
