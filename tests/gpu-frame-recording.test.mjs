import test from 'node:test'
import assert from 'node:assert/strict'
import { FramePerformance, RECENT_FRAME_CAPACITY } from '../app/frame-performance.ts'
import { validGpuFrameTiming } from '../app/gpu-frame-timing.ts'
function sample(r, token, timing={status:'pending'}, interval=10) { return r.sample(interval,1,2,3,4,0,10,'live',undefined,undefined,undefined,{token,timing}) }

test('GPU completion uses raw accepted slot rather than UI publication boolean',()=>{
 const r=new FramePerformance(),token=r.reserveGpuFrame()
 assert.equal(sample(r,token),false)
 assert.equal(r.acceptsGpuFrame(token),true)
 assert.equal(r.completeGpuFrame(token,{status:'available',milliseconds:4.25}),true)
 assert.deepEqual(r.recentFrames()[0].sceneRenderGpu,{status:'available',milliseconds:4.25})
 assert.equal(r.recentFrames()[0].sceneRenderCpuMs,2)
 const rejected=r.reserveGpuFrame();sample(r,rejected,{status:'pending'},0)
 assert.equal(r.acceptsGpuFrame(rejected),false)
})
test('generation/serial rejects stale callbacks after reset, rejection and ring eviction',()=>{
 const r=new FramePerformance(),first=r.reserveGpuFrame();sample(r,first)
 for(let i=0;i<RECENT_FRAME_CAPACITY;i++)sample(r,r.reserveGpuFrame())
 assert.equal(r.completeGpuFrame(first,{status:'available',milliseconds:9}),false)
 const before=r.reserveGpuFrame();sample(r,before);r.reset();const after=r.reserveGpuFrame();sample(r,after)
 assert.notEqual(before.generation,after.generation)
 assert.equal(r.completeGpuFrame(before,{status:'available',milliseconds:8}),false)
 assert.deepEqual(r.recentFrames()[0].sceneRenderGpu,{status:'pending'})
 assert.equal(r.completeGpuFrame(after,{status:'unsupported'}),true)
 assert.deepEqual(r.recentFrames()[0].sceneRenderGpu,{status:'unsupported'})
})
test('optional unknown remains absent; malformed GPU states never become numeric zero',()=>{
 const r=new FramePerformance();r.sample(10,0,0,0,0)
 assert.equal(r.recentFrames()[0].sceneRenderGpu,undefined)
 for(const value of [null,{},[],{status:'unsupported',milliseconds:0},{status:'available'},{status:'available',milliseconds:-1},{status:'available',milliseconds:Infinity}])assert.equal(validGpuFrameTiming(value),false)
 assert.equal(validGpuFrameTiming({status:'available',milliseconds:0}),true)
})
