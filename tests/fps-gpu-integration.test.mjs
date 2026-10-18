import test from 'node:test'
import assert from 'node:assert/strict'
import { FpsGraph } from '../app/fps-graph.ts'
import { FramePerformance } from '../app/frame-performance.ts'

function fixture() {
 const queries=[],events=new EventTarget();let active=null,lost=false,disjoint=false,calls=0
 const gl={canvas:events,CURRENT_QUERY:1,QUERY_RESULT_AVAILABLE:2,QUERY_RESULT:3,
  getExtension(){calls++;return {TIME_ELAPSED_EXT:4,GPU_DISJOINT_EXT:5}},isContextLost:()=>lost,
  getParameter(){calls++;const d=disjoint;disjoint=false;return d},getQuery:()=>active,
  createQuery(){calls++;const q={ready:false};queries.push(q);return q},beginQuery(_,q){active=q},endQuery(){active=null},
  deleteQuery(q){q.deleted=true},getQueryParameter(q,p){calls++;if(p===2)return q.ready;assert.ok(q.ready);return 3000000}}
 const graph=Object.create(FpsGraph.prototype)
 Object.assign(graph,{gl,samples:new FramePerformance(),previous:null,cleared:false,gpuTimer:null,gpuFrame:undefined,text(){},element:{remove(){}},line:{setAttribute(){}},budget:{setAttribute(){}}})
 return {graph,queries,get calls(){return calls},disjoint(){disjoint=true},lose(){lost=true;active=null;events.dispatchEvent(new Event('webglcontextlost'))}}
}
function frame(f,now){f.graph.renderGpu(()=>{});f.graph.update(now,1,2,3,'Live',4)}

test('actual FpsGraph attributes delayed results to accepted generation/serial, not poll callback',()=>{
 const f=fixture();frame(f,10);assert.equal(f.graph.samples.recentFrames().length,0)
 f.queries[0].ready=true;frame(f,20)
 assert.deepEqual(f.graph.samples.recentFrames().map(x=>x.sceneRenderGpu),[{status:'pending'}])
 f.queries[1].ready=true;frame(f,30)
 assert.deepEqual(f.graph.samples.recentFrames().map(x=>x.sceneRenderGpu),[{status:'available',milliseconds:3},{status:'pending'}])
 f.graph.reset();assert.ok(f.queries[2].deleted);f.queries[2].ready=true
 frame(f,40);frame(f,50);assert.deepEqual(f.graph.samples.recentFrames().map(x=>x.sceneRenderGpu),[{status:'pending'}])
 f.graph.dispose();assert.ok(f.queries.every(q=>q.deleted))
})

test('actual adapter handles rejected intervals, disjoint, loss, unsupported and disposal',()=>{
 const f=fixture();frame(f,10);frame(f,10);assert.equal(f.graph.samples.recentFrames().length,0)
 f.queries.forEach(q=>q.ready=true);frame(f,20);assert.equal(f.graph.samples.recentFrames()[0].sceneRenderGpu.status,'pending')
 f.disjoint();frame(f,30);assert.equal(f.graph.samples.recentFrames()[0].sceneRenderGpu.status,'disjoint')
 f.lose();frame(f,40);assert.equal(f.graph.samples.recentFrames().at(-1).sceneRenderGpu.status,'context-lost');f.graph.dispose()
 const u=fixture();u.graph.gl={};frame(u,10);frame(u,20);assert.deepEqual(u.graph.samples.recentFrames()[0].sceneRenderGpu,{status:'unsupported'});assert.equal(u.calls,0);u.graph.dispose()
})


test('nested GPU adapter calls preserve outer token; disposed overlay never resumes queries',()=>{
 const f=fixture();let draws=0
 f.graph.renderGpu(()=>{draws++;f.graph.renderGpu(()=>draws++)});f.graph.update(10,1,2,3,'Live',4)
 assert.equal(draws,2);assert.equal(f.queries.length,1)
 frame(f,20);f.queries[1].ready=true;frame(f,30)
 assert.equal(f.graph.samples.recentFrames()[0].sceneRenderGpu.status,'available')
 f.graph.dispose();const before=f.calls;frame(f,40);assert.equal(f.calls,before);assert.equal(f.graph.samples.recentFrames().length,0)
})
