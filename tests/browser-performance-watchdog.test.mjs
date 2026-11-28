import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
const source=readFileSync(new URL('../scripts/browser-performance/run.mjs',import.meta.url),'utf8')
const marker="        const recording = JSON.parse(readFileSync(resolve(output, 'snapshot-frames.json')))\n"
const start=source.indexOf(marker)+marker.length
const end=source.indexOf('        for (const name of shards[shard]) {',start)
assert.ok(start>=marker.length && end>start)
const apply=new Function('assert','run','session','recording',source.slice(start,end))
function call(status,session) { const readers={source:'same'};const run={};apply(assert,run,session,{status,readers});return {run,readers} }
test('watchdog rejects a partial-drag arm even with otherwise tolerated errors',()=>{
 for (const errors of [[],['expected drag diagnostic']]) assert.throws(()=>call('passed-with-incomplete-drag',{timedOut:true,errors}),{code:'ERR_ASSERTION'})
})
test('non-watchdog partial drag keeps its existing tolerated diagnostics and readers',()=>{
 const {run,readers}=call('passed-with-incomplete-drag',{errors:['expected drag diagnostic']})
 assert.equal(run.readers,readers)
})
test('ordinary passed recording still requires no watchdog and no errors',()=>{
 assert.doesNotThrow(()=>call('passed',{errors:[]}))
 assert.throws(()=>call('passed',{errors:['unexpected console error']}),{code:'ERR_ASSERTION'})
 assert.throws(()=>call('passed',{timedOut:true,errors:[]}),{code:'ERR_ASSERTION'})
})
