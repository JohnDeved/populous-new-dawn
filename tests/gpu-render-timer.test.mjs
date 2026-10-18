import test from 'node:test'
import assert from 'node:assert/strict'
import { GpuRenderTimer } from '../app/gpu-render-timer.ts'

function fixture(supported = true) {
  const events = new EventTarget(), calls = [], results = []
  const ext = { TIME_ELAPSED_EXT: 1, GPU_DISJOINT_EXT: 2 }
  let active = null, lost = false, disjoint = false
  const queries = []
  const gl = { canvas: events, CURRENT_QUERY: 3, QUERY_RESULT_AVAILABLE: 4, QUERY_RESULT: 5,
    isContextLost: () => lost,
    getExtension: () => supported ? ext : null,
    getParameter: () => { calls.push(['disjoint']); const value=disjoint;disjoint=false;return value },
    getQuery: () => active,
    createQuery() { const q = { ready: false, ns: 2500000 }; queries.push(q); return q },
    beginQuery(target, q) { assert.equal(active,null); active=q; calls.push(['begin',q]) },
    endQuery() { assert.ok(active); calls.push(['end',active]); active=null },
    getQueryParameter(q, what) { calls.push([what,q]); if(what===4)return q.ready; assert.ok(q.ready,'never read an unavailable result');return q.ns },
    deleteQuery(q) { assert.ok(!q.deleted,'delete once');q.deleted=true;calls.push(['delete',q]) },
    finish() { throw Error('GPU synchronization forbidden') }, flush() { throw Error('flush forbidden') }, readPixels() { throw Error('readback forbidden') },
  }
  const expired = new Set(), observer = { after: null }
  const timer = new GpuRenderTimer(gl, r => { results.push(r); observer.after?.() }, frame => !expired.has(frame))
  return {timer,results,queries,calls,gl,events,expired,observer,setLost(v,event=true){lost=v;if(v)active=null;if(event)events.dispatchEvent(new Event(v?'webglcontextlost':'webglcontextrestored'))},setDisjoint(v){disjoint=v},setSupported(v){supported=v}}
}

test('delayed available durations retain originating tokens, never polling-frame attribution', () => {
 const f=fixture();let draws=0
 f.timer.render(17,()=>draws++);f.timer.render(18,()=>draws++)
 f.timer.poll();assert.deepEqual(f.results,[])
 f.queries[1].ready=true;f.timer.poll();assert.deepEqual(f.results,[{frame:18,status:'available',milliseconds:2.5}])
 f.queries[0].ready=true;f.timer.poll();assert.equal(f.results[1].frame,17);assert.equal(draws,2)
 assert.ok(f.queries.every(q=>q.deleted));f.timer.dispose()
})

test('unsupported and bounded busy paths still draw without querying results', () => {
 const u=fixture(false);let draws=0;u.timer.render(1,()=>draws++);u.timer.poll();assert.equal(u.results[0].status,'unsupported');assert.equal(u.queries.length,0);u.timer.dispose()
 const f=fixture();for(let i=0;i<20;i++)f.timer.render(i,()=>draws++)
 assert.equal(f.queries.length,8);assert.equal(f.results.length,12);assert.ok(f.results.every(r=>r.status==='busy'));assert.equal(draws,21)
 f.timer.dispose();assert.ok(f.queries.every(q=>q.deleted));const before=f.calls.length;f.timer.poll();f.timer.render(50,()=>draws++);assert.equal(f.calls.length,before)
})

test('disjoint invalidates every pending query, with no numeric samples', () => {
 const f=fixture();f.timer.render(1,()=>{});f.timer.render(2,()=>{});f.setDisjoint(true);f.timer.poll()
 assert.deepEqual(f.results,[{frame:1,status:'disjoint'},{frame:2,status:'disjoint'}]);assert.ok(f.queries.every(q=>q.deleted));f.setDisjoint(true);f.timer.render(3,()=>{});assert.equal(f.results.at(-1).status,'disjoint');f.timer.dispose()
})

test('context loss clears old tokens and restoration creates fresh queries', () => {
 const f=fixture();f.timer.render(1,()=>{});f.setLost(true);f.timer.poll();assert.equal(f.results[0].status,'context-lost');assert.equal(f.queries[0].deleted,undefined)
 f.timer.render(2,()=>{});f.setLost(false);f.timer.render(3,()=>{});f.queries[1].ready=true;f.timer.poll();assert.equal(f.results.at(-1).frame,3);f.timer.dispose()
})

test('nested render, original exceptions, active disposal and eventless context loss clean up', () => {
 const f=fixture();const error=Error('draw failure')
 assert.throws(()=>f.timer.render(1,()=>{f.timer.render(2,()=>{});throw error}),e=>e===error)
 assert.deepEqual(f.results,[{frame:2,status:'busy'},{frame:1,status:'failed'}]);assert.equal(f.queries.length,1);assert.ok(f.queries[0].deleted)
 f.timer.render(3,()=>f.timer.dispose());assert.ok(f.queries[1].deleted);f.timer.dispose()
 const g=fixture();g.timer.render(4,()=>g.setLost(true,false));assert.deepEqual(g.results,[{frame:4,status:'context-lost'}]);g.timer.dispose()
})


test('expired/reset frame tokens never backfill a reused slot and invalid GPU values are rejected', () => {
 const f=fixture();f.timer.render(1,()=>{});f.expired.add(1);f.queries[0].ready=true;f.timer.poll();assert.deepEqual(f.results,[]);assert.ok(f.queries[0].deleted)
 for(const ns of [NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER+1]) { f.timer.render(2,()=>{});const q=f.queries.at(-1);q.ns=ns;q.ready=true;f.timer.poll();assert.equal(f.results.at(-1).status,'failed') }
 f.timer.dispose()
})

test('foreign active elapsed query is never ended or replaced', () => {
 const f=fixture();f.gl.getQuery=()=>({foreign:true});let draws=0;f.timer.render(8,()=>draws++);assert.equal(draws,1);assert.equal(f.queries.length,0);assert.equal(f.results[0].status,'busy');f.timer.dispose()
})


test('observer-reentrant renders still draw but do not start queries or recurse', () => {
 const f=fixture();f.timer.render(1,()=>{});f.queries[0].ready=true;let draws=0
 f.observer.after=()=>{f.timer.render(2,()=>draws++);f.timer.poll()}
 f.timer.poll();assert.equal(draws,1);assert.equal(f.queries.length,1);assert.equal(f.results.length,1);f.timer.dispose()
})

test('loss publication detaches all handles before reentrant callbacks', () => {
 const f=fixture();f.timer.render(1,()=>{});f.timer.render(2,()=>{});let draws=0
 f.observer.after=()=>f.timer.render(3,()=>draws++)
 f.setLost(true);assert.deepEqual(f.results,[{frame:1,status:'context-lost'},{frame:2,status:'context-lost'}]);assert.equal(draws,2);assert.equal(f.queries.length,2);f.timer.dispose()
})

test('throwing observers never skip draw or replace the original draw exception', () => {
 for(const acceptThrows of [false,true]) {
  const f=fixture(false);f.timer.dispose();const error=Error('observer'),drawError=Error('draw')
  const timer=new GpuRenderTimer(f.gl,()=>{throw error},()=>{if(acceptThrows)throw error;return true});let draws=0
  timer.render(1,()=>draws++);assert.equal(draws,1);assert.throws(()=>timer.render(2,()=>{throw drawError}),e=>e===drawError);timer.dispose()
 }
 const f=fixture();f.observer.after=()=>{throw Error('observer')};const original=Error('original')
 assert.throws(()=>f.timer.render(4,()=>{throw original}),e=>e===original);assert.ok(f.queries[0].deleted);f.timer.dispose()
})

test('poll performs no more GL work after a callback disposes or loses context', () => {
 for(const dispose of [false,true]) {
  const f=fixture();f.timer.render(1,()=>{});f.timer.render(2,()=>{});f.queries.forEach(q=>q.ready=true)
  let after
  f.observer.after=()=>{f.observer.after=null;if(dispose)f.timer.dispose();else f.setLost(true);after=f.calls.length}
  f.timer.poll();assert.equal(f.calls.length,after);f.timer.dispose()
 }
})

test('one context owner prevents a second timer from consuming read-to-clear disjoint', () => {
 const f=fixture(),otherResults=[];const other=new GpuRenderTimer(f.gl,r=>otherResults.push(r),()=>true)
 f.timer.render(1,()=>{});f.setDisjoint(true);const before=f.calls.length;other.poll();let draws=0;other.render(2,()=>draws++)
 assert.equal(f.calls.length,before);assert.equal(draws,1);assert.equal(otherResults[0].status,'busy')
 f.timer.poll();assert.equal(f.results[0].status,'disjoint');other.dispose();f.timer.dispose()
 const replacement=new GpuRenderTimer(f.gl,()=>{},()=>true);replacement.render(3,()=>{});assert.equal(f.queries.length,2);replacement.dispose()
})

test('restoration reacquires extension and unsupported restoration makes no queries', () => {
 const f=fixture();f.timer.render(1,()=>{});f.setLost(true);f.setSupported(false);f.setLost(false);f.timer.render(2,()=>{});assert.equal(f.results.at(-1).status,'unsupported');assert.equal(f.queries.length,1)
 f.setLost(true);f.setSupported(true);f.setLost(false);f.timer.render(3,()=>{});assert.equal(f.queries.length,2);f.timer.dispose()
})


test('privacy-restricted extension acquisition stays unsupported without breaking draw or restore', () => {
 const f=fixture();f.timer.dispose();f.gl.getExtension=()=>{throw Error('restricted')}
 const results=[],timer=new GpuRenderTimer(f.gl,r=>results.push(r),()=>true);let draws=0
 timer.render(1,()=>draws++);assert.equal(draws,1);assert.equal(results[0].status,'unsupported')
 f.setLost(true);f.setLost(false);timer.render(2,()=>draws++);assert.equal(draws,2);assert.equal(results.at(-1).status,'unsupported');timer.dispose()
})
