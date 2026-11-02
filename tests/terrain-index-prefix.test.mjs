import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {terrainIndicesBelowCount} from '../app/terrain-index-prefix.ts'

const nativeEvery=Uint32Array.prototype.every
const oracle=(view,position)=>view.every(id=>id<position.count)
const failure={failure:'supplied'}
function outcome(run,view,position,trace) {
 try{return{value:run(view,position),trace}}catch(error){return{error:error instanceof Error?error.constructor.name:error,trace}}
}
function compare(factory) {
 const a=factory(),b=factory()
 const expected=outcome(oracle,a.view,a.position,a.trace),actual=outcome(terrainIndicesBelowCount,b.view,b.position,b.trace)
 assert.deepEqual(actual,expected)
 return actual
}
function fixture(ids,counts,action=()=>{},options={}) {
 return()=>{
  const trace=[],buffer=new ArrayBuffer(Math.max(16,ids.length*4),{maxByteLength:256}),view=new Uint32Array(buffer,0,ids.length)
  view.set(ids);let reads=0
  Object.defineProperty(view,'length',{get(){throw Error('Public length must not be read')}})
  Object.defineProperty(view,'every',{get(){trace.push('every');if(options.detachBefore)structuredClone(buffer,{transfer:[buffer]});return nativeEvery}})
  const position={get count(){const n=reads++;trace.push(['count',n,Array.from(new Uint32Array(buffer))]);action({buffer,view,n,trace});return counts[n%counts.length]}}
  return{trace,view,position}
 }
}

test('actual helper preserves values, early exit and internal length over ordinary edge inputs',()=>{
 for(const ids of [[],[0],[0,1,2],[3,2,1],[0,0,4294967295]])for(const bound of [0,-0,1,2,4,-1,NaN,Infinity,-Infinity])
  compare(fixture(ids,[bound]))
 let seed=17
 for(let trial=0;trial<200;trial++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0
  const ids=Array.from({length:seed%25},(_,i)=>(seed>>>i%20)%37)
  compare(fixture(ids,[trial%39,40]))
 }
})
test('position getter mutations and value coercion remain ordered and uncached',()=>{
 for(const changed of [0,99])compare(fixture([1,2,3,4],[10],({view,n,trace})=>{if(n===0){view[1]=changed;trace.push('changed-next')}}))
 for(const thrown of [null,false,0,undefined,failure])for(const at of [0,1,2])
  compare(fixture([1,2,3],[10],({n})=>{if(n===at)throw thrown}))
 compare(()=>{
  const trace=[],view=new Uint32Array([1,2,3]);let n=0
  const position={get count(){trace.push(['get',n]);return{valueOf(){trace.push(['valueOf',n]);view[2]=++n;return 10}}}}
  return{trace,view,position}
 })
})
test('detachment before entry and during count coercion matches native every',()=>{
 compare(fixture([1,2,3],[10],()=>{},{detachBefore:true}))
 for(const at of [0,1,2])compare(()=>{
  const trace=[],view=new Uint32Array([1,2,3]);let n=0
  const position={get count(){const i=n++;trace.push(['count',i]);if(i===at)structuredClone(view.buffer,{transfer:[view.buffer]});return 10}}
  return{trace,view,position}
 })
})
test('resizable views retain initial iteration length through shrink and grow',()=>{
 for(const tracking of [true,false])for(const bytes of [0,4,8,32])compare(()=>{
  const buffer=new ArrayBuffer(16,{maxByteLength:64}),view=tracking?new Uint32Array(buffer):new Uint32Array(buffer,0,4)
  view.set([1,2,3,4]);const trace=[];let n=0
  const position={get count(){trace.push(['count',n]);if(n++===0)buffer.resize(bytes);return 10}}
  return{trace,view,position}
 })
 compare(()=>{
  const buffer=new ArrayBuffer(16,{maxByteLength:64}),view=new Uint32Array(buffer,8,2);buffer.resize(4)
  return{view,position:{get count(){throw Error('No callback')}},trace:[]}
 })
})
test('custom every getter/method, noncallable and incompatible receiver retain fallback semantics',()=>{
 for(const mode of ['custom','noncallable','native-incompatible','getter-throw'])compare(()=>{
  const trace=[];const view={get every(){trace.push('every');if(mode==='getter-throw')throw failure;if(mode==='noncallable')return 3;if(mode==='native-incompatible')return nativeEvery
   return function(callback){assert.equal(this,view);trace.push('custom');return callback(2)&&callback(1)}}}
  return{trace,view,position:{get count(){trace.push('count');return 3}}}
 })
})
test('reentrant count getter uses independent iteration state',()=>{
 for(const run of [oracle,terrainIndicesBelowCount]){
  let reads=0;const nested=new Uint32Array([1,2])
  const position={get count(){reads++;assert.equal(run(nested,{count:3}),true);return 5}}
  assert.equal(run(new Uint32Array([1,2,3]),position),true);assert.equal(reads,3)
 }
})
test('actual RenderView caller retains guarded subarray coercion/species including negative end',()=>{
 const source=readFileSync(new URL('../app/render-view.ts',import.meta.url),'utf8')
 const begin=source.indexOf('          const packedTerrain ='),end=source.indexOf('          const reuse =',begin)
 assert.ok(begin>=0&&end>begin)
 const block=source.slice(begin,end).replace('index!','index').replace(' as Uint32Array','')
 const caller=new Function('shareTerrainCorners','index','count','position','terrainIndicesBelowCount',block+';return packedTerrain')
 const original=(share,index,count,position)=>share&&index.array.subarray(0,count).every(id=>id<position.count)
 for(const share of [false,0,null,undefined,true])for(const endValue of [-12,-3,-1.5,-0,0,1,1.5,3,99,NaN,Infinity,-Infinity]){
  const execute=fn=>{
   const trace=[],array=new Uint32Array([0,1,2,3]),position={get count(){trace.push('count');return 3}}
   Object.defineProperty(array,'constructor',{get(){trace.push('constructor');return{get [Symbol.species](){trace.push('species');return function(buffer,offset,length){trace.push(['construct',offset,length]);const view=new Uint32Array(buffer,offset,length);Object.defineProperty(view,'length',{get(){throw failure}});return view}}}}})
   const index={get array(){trace.push('array');return array}},count={valueOf(){trace.push('end');return endValue}}
   return{value:fn(share,index,count,position,terrainIndicesBelowCount),trace}
  }
  assert.deepEqual(execute(caller),execute(original))
 }
})

test('custom every result identity is preserved without Boolean conversion',()=>{
 for(const value of [null,undefined,false,0,-0,NaN,'yes','',{},[],Symbol('result')]){
  for(const run of [oracle,terrainIndicesBelowCount]){
   let calls=0,reads=0
   const position={get count(){reads++;return 4}}
   const view={every(callback){assert.equal(this,view);assert.equal(arguments.length,1);calls++;assert.equal(callback(3),true);return value}}
   assert.equal(Object.is(run(view,position),value),true);assert.equal(calls,1);assert.equal(reads,1)
  }
 }
})

test('every getter resize before entry preserves empty versus OOB native validation',()=>{
 for(const tracking of [true,false])for(const bytes of [0,4,32])compare(()=>{
  const trace=[],buffer=new ArrayBuffer(16,{maxByteLength:64})
  const view=tracking?new Uint32Array(buffer):new Uint32Array(buffer,0,4)
  view.set([1,2,3,4]);Object.defineProperty(view,'every',{get(){trace.push('every');buffer.resize(bytes);return nativeEvery}})
  return{trace,view,position:{get count(){trace.push('count');return 10}}}
 })
})
