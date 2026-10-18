import assert from 'node:assert/strict'
import test from 'node:test'
import { PainterDepthOrder, DISTRIBUTION_MIN, DISTRIBUTION_MAX } from '../app/painter-depth-order.ts'

// Frozen original comparator, independent of the production helper.
const original = (a,b) => b.bucket-a.bucket || b.order-a.order
const records = (count,bucket=i=>(Math.imul(i,137)+17)%3585) => Array.from({length:count},(_,order)=>({
 bucket:bucket(order),order,alpha:order%3!==0,mesh:order%7,kind:['terrain','sprite','selection'][order%3],
}))
function compare(input,sorter=new PainterDepthOrder()) {
 const expected=input.slice().sort(original),actual=input.slice(),fields=input.map(x=>({...x}))
 assert.equal(sorter.sort(actual),actual)
 for(let i=0;i<actual.length;i++)assert.equal(actual[i],expected[i],'same original object at exact global position')
 assert.deepEqual(input,fields,'fields and original order values unchanged')
 return sorter
}

test('frozen comparator matches empty, small, threshold and bounded large interleaving',()=>{
 for(const count of [0,1,2,63,DISTRIBUTION_MIN-1,DISTRIBUTION_MIN,DISTRIBUTION_MAX,DISTRIBUTION_MAX+1]){
  const sorter=compare(records(count))
  assert.equal(!!sorter.counts,count>=DISTRIBUTION_MIN&&count<=DISTRIBUTION_MAX)
 }
 for(const bucket of [()=>0,()=>3584,i=>i%2?3584:0,i=>i%5])compare(records(DISTRIBUTION_MIN,bucket))
})

test('every ambiguous/custom bucket or order retains frozen comparator behavior',()=>{
 for(const value of [-1,3585,0.5,NaN,Infinity,-Infinity,'12',null,undefined,{},new Number(7)]){
  const input=records(DISTRIBUTION_MIN);input[17].bucket=value
  compare(input)
 }
 for(const value of [0,-1,0.5,NaN,Infinity,'17']){
  const input=records(DISTRIBUTION_MIN);input[17].order=value;compare(input)
 }
 const input=records(DISTRIBUTION_MIN);input[0].bucket=-0;compare(input)
})

test('reusable bounded storage drops prior commands and custom sort retains dispatch',()=>{
 const sorter=compare(records(DISTRIBUTION_MIN)),counts=sorter.counts,scratch=sorter.scratch
 assert.ok(scratch.every(x=>x===undefined))
 compare(records(DISTRIBUTION_MIN),sorter);assert.equal(sorter.counts,counts);assert.equal(sorter.scratch,scratch)
 compare(records(DISTRIBUTION_MAX),sorter);assert.equal(sorter.scratch.length,DISTRIBUTION_MAX)
 assert.ok(sorter.scratch.every(x=>x===undefined))
 const commands=records(DISTRIBUTION_MIN),sort=commands.sort
 let called=0
 commands.sort=function(compare){called++;return sort.call(this,compare)}
 sorter.sort(commands);assert.equal(called,1)
 const prototype=Array.prototype.sort
 Array.prototype.sort=function(compare){called++;return prototype.call(this,compare)}
 try{sorter.sort(records(DISTRIBUTION_MIN));assert.equal(called,2)}finally{Array.prototype.sort=prototype}
 sorter.clear();assert.equal(sorter.counts,undefined);assert.equal(sorter.scratch.length,0)
})

test('unsupported arithmetic values retain original comparator exceptions',()=>{
 for(const value of [1n,Symbol('bucket')]){
  const input=records(DISTRIBUTION_MIN);input[17].bucket=value
  assert.throws(()=>input.slice().sort(original),TypeError)
  assert.throws(()=>new PainterDepthOrder().sort(input.slice()),TypeError)
 }
})
