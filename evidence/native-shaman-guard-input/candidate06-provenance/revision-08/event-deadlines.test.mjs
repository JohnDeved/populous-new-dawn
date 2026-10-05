import test from 'node:test'
import assert from 'node:assert/strict'
import {createEventDeadlines} from './event-deadlines.mjs'
function setup(globalLimit=300000){let time=0;const logs=[];return {logs,advance:ms=>{time+=ms},stages:createEventDeadlines({now:()=>time,globalCheck:()=>assert.ok(time<=globalLimit,'overall deadline'),log:x=>logs.push(x)})}}
test('consecutive accepted events each retain their own deadline after retained evidence work',()=>{
 const f=setup();f.stages.begin('selection',4000);f.advance(2019);f.advance(354);assert.equal(f.stages.finish().elapsedMs,2373)
 f.advance(188);f.stages.begin('move',4000);f.advance(2807);f.advance(354);assert.equal(f.stages.finish().elapsedMs,3161)
 assert.deepEqual(f.logs.map(x=>x.action),['event-stage-start','event-stage-complete','event-stage-start','event-stage-complete'])
})
test('serialization/drain time consumes the active event budget and an overrun cannot finish',()=>{
 const f=setup();f.stages.begin('move',4000);f.advance(3700);f.advance(354);assert.throws(()=>f.stages.check(),/move event deadline/);assert.throws(()=>f.stages.finish(),/move event deadline/);assert.equal(f.stages.current().name,'move')
})
test('event transitions never reset or replace the overall real-clock deadline',()=>{
 const f=setup(5000);f.stages.begin('first',4000);f.advance(3000);f.stages.finish();f.stages.begin('second',4000);f.advance(2001);assert.throws(()=>f.stages.check(),/overall deadline/)
})
test('overlapping stages and invalid limits fail without silently replacing an active deadline',()=>{
 const f=setup();assert.throws(()=>f.stages.begin('bad',0));f.stages.begin('save',15000);assert.throws(()=>f.stages.begin('load',15000),/preceding event/);assert.equal(f.stages.current().name,'save')
})
