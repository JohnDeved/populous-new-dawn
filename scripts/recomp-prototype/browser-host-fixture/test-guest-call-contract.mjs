import assert from 'node:assert/strict';
import {GuestMemory} from '../browser-boundary-fixture/guest-memory.mjs';
import {callGuest,hostArgument,completeShim,MAGIC_RETURN} from './guest-call-contract.mjs';
const memory=new GuestMemory(2);memory.map(0x10000,0x20000);
const initial=()=>({eax:0,ecx:1,edx:2,ebx:3,esp:0x20008,ebp:4,esi:5,edi:6,df:1,fs_base:0x18000,thread:7});
let checks=0;
for(const argc of [2,-1]){
 const cpu=initial(),snapshot={...cpu};
 assert.equal(callGuest(memory,cpu,0xfe000010,[11,22],(r,token)=>{
  assert.equal(token,0xfe000010);assert.equal(memory.read32(r.esp),MAGIC_RETURN);
  assert.deepEqual([hostArgument(memory,r,0),hostArgument(memory,r,1)],[11,22]);
  const frameEsp=r.esp;completeShim(r,argc,33);assert.equal(r.esp,frameEsp+(argc===2?12:4));
  r.ecx=90;r.df=0;
 }),33);
 assert.deepEqual(cpu,{...snapshot,eax:33});checks++;
}
const cpu=initial();assert.throws(()=>callGuest(memory,cpu,1,Array(17).fill(0),()=>{}),/budget/);assert.deepEqual(cpu,initial());checks++;
const unmapped=initial();unmapped.esp=0x10004;const prior={...unmapped};assert.throws(()=>callGuest(memory,unmapped,1,[2],()=>{}),/Guest span/);assert.deepEqual(unmapped,prior);checks++;
const fault=initial();assert.throws(()=>callGuest(memory,fault,1,[],()=>{throw Error('synthetic trap')}),/synthetic trap/);assert.equal(fault.esp,initial().esp-4);checks++;
assert.throws(()=>callGuest(memory,initial(),1,[],()=>Promise.resolve()),/synchronous guest stack/);checks++;
assert.throws(()=>memory.read32(0xfe000010),/Unmapped/);checks++;
console.log(JSON.stringify({scope:'synthetic guest ABI model, not original C execution',checks,allocatedBytes:memory.allocatedBytes,rss:process.memoryUsage().rss},null,2));
