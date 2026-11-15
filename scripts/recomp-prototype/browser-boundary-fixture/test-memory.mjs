import assert from 'node:assert/strict';import {GuestMemory} from './guest-memory.mjs';
const m=new GuestMemory(4);m.map(0x10000,0x20000);m.map(0xfe000000,0x10000);m.map(0xffff0000,0x10000);
for(const address of [0x10000,0x1fffe,0xfe000000,0xfffffffc]){m.write32(address,0xdeadbeef);assert.equal(m.read32(address),0xdeadbeef);}
assert.equal(m.allocatedBytes,262144);assert.throws(()=>m.map(0x400000,65536),RangeError);assert.equal(m.allocatedBytes,262144);
assert.throws(()=>m.read32(0),RangeError);assert.throws(()=>m.read32(0xfffffffe),RangeError);assert.throws(()=>m.read32(0x400000),RangeError);
m.write32(0x2fffc,0x11223344);assert.throws(()=>m.write32(0x2fffe,0xaabbccdd),RangeError);assert.equal(m.read32(0x2fffc),0x11223344);
assert.throws(()=>m.map(0x10001,65536),RangeError);assert.throws(()=>m.write32(0x10000,-1),RangeError);
console.log(JSON.stringify({passed:true,scope:'synthetic sparse-address model, not original runtime',mappedBytes:m.allocatedBytes,maxGuestAddress:'0xffffffff',nullProtection:true,wrapRejection:true,atomicUnmappedWrite:true,nodeRssBytes:process.memoryUsage().rss}));
