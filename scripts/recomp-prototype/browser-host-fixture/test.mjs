import assert from 'node:assert/strict';
import {Host} from './host.mjs';
const checks=[];
function test(name,fn){fn();checks.push(name);}
test('repeatable clock and cooperative ordering',()=>{
 const run=()=>{const h=new Host();h.spawn((function*(){yield{op:'sleep',ms:5};yield{op:'yield'};})());h.spawn((function*(){yield{op:'sleep',ms:2};yield{op:'sleep',ms:3};})());assert.equal(h.run(),'complete');assert.equal(h.now,5);return h.trace;};assert.deepEqual(run(),run());
});
test('auto reset wakes only one waiter',()=>{const h=new Host();h.event('e');const out=[];for(let i=0;i<2;i++)h.spawn((function*(){out.push([i,yield{op:'wait',event:'e'}]);})());h.spawn((function*(){yield{op:'signal',event:'e'};})());assert.equal(h.run(),'blocked');assert.deepEqual(out,[[0,'signaled']]);h.signal('e');assert.equal(h.run(),'complete');assert.deepEqual(out,[[0,'signaled'],[1,'signaled']]);});
test('manual reset wakes all and remains set',()=>{const h=new Host();h.event('e',{manual:true});let n=0;for(let i=0;i<3;i++)h.spawn((function*(){assert.equal(yield{op:'wait',event:'e'},'signaled');n++;})());h.signal('e');assert.equal(h.run(),'complete');assert.equal(n,3);assert.equal(h.events.get('e').signaled,true);h.reset('e');assert.equal(h.events.get('e').signaled,false);});
test('zero timeout and finite timeout',()=>{const h=new Host();h.event('e');const out=[];h.spawn((function*(){out.push(yield{op:'wait',event:'e',ms:0});out.push(yield{op:'wait',event:'e',ms:7});})());assert.equal(h.run(),'complete');assert.equal(h.now,7);assert.deepEqual(out,['timeout','timeout']);});
test('pre-signaled auto event consumed',()=>{const h=new Host();h.event('e',{signaled:true});h.spawn((function*(){assert.equal(yield{op:'wait',event:'e',ms:0},'signaled');})());h.run();assert.equal(h.events.get('e').signaled,false);});
test('infinite yielding bounded',()=>{const h=new Host({maxSteps:4});h.spawn((function*(){while(true)yield{op:'yield'};})());assert.throws(()=>h.run(),/step cap/);assert.equal(h.steps,4);});
test('invalid handles and duration fail',()=>{for(const action of [{op:'wait',event:'missing'},{op:'sleep',ms:-1},{op:'sleep',ms:Infinity}]){const h=new Host();h.spawn((function*(){yield action;})());assert.throws(()=>h.run());}});
test('task limit and callback exception retained',()=>{const h=new Host({maxTasks:1});h.spawn((function*(){throw Error('sentinel');})());assert.throws(()=>h.spawn((function*(){})()),/task cap/);assert.throws(()=>h.run(),/sentinel/);assert.equal(h.tasks[0].state,'failed');});
console.log(JSON.stringify({scope:'synthetic host only',checks,passed:checks.length,memory:process.memoryUsage()},null,2));
