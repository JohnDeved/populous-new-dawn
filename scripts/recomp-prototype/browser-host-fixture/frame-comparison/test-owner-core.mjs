import assert from 'node:assert/strict';
import {createOwner} from './owner-core.mjs';
const handle=createOwner();const palette=new Uint32Array(256);palette[1]=0x123456;
assert.equal(handle({sequence:1,op:'setFrame',indices:Uint8Array.of(1,1,1,1),palette}).generation,1);
palette[1]=0;assert.deepEqual([...handle({sequence:2,op:'capture'}).rgba.slice(0,4)],[18,52,86,255]);
assert.equal(handle({sequence:3,op:'setFrame',indices:new Uint8Array(new SharedArrayBuffer(4)),palette}).error,'shared input forbidden');
assert.equal(handle({sequence:4,op:'capture'}).generation,1);
// Hide global to model nonisolated environments: positive ordinary-buffer checks work.
const descriptor=Object.getOwnPropertyDescriptor(globalThis,'SharedArrayBuffer');
try{
 Object.defineProperty(globalThis,'SharedArrayBuffer',{value:undefined,configurable:true});
 const h=createOwner();assert.equal(h({sequence:1,op:'setFrame',indices:Uint8Array.of(1,1,1,1),palette}).ok,true);
 assert.equal(h({sequence:2,op:'capture'}).rgba.length,16);
}finally{Object.defineProperty(globalThis,'SharedArrayBuffer',descriptor);}
for(let i=5;i<=32;i++)assert.equal(handle({sequence:i,op:'capture'}).generation,1);
assert.deepEqual(handle({sequence:33,op:'capture'}),{closed:true});
assert.deepEqual(handle({sequence:34,op:'capture'}),{closed:true});
console.log(JSON.stringify({scope:'authored transport neutral core',normalAndMissingSharedGlobal:true,sharedRejected:true,commandCap:true}));
