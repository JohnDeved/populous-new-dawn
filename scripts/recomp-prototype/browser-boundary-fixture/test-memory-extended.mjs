import assert from 'node:assert/strict';import {GuestMemory} from './guest-memory.mjs';
const m=new GuestMemory(4);m.map(0x10000,0x20000);m.map(0xffff0000,0x10000);
m.write64(0x1fffc,0xfedcba9876543210n);assert.equal(m.read64(0x1fffc),0xfedcba9876543210n);
m.write32(0x10000,0x80000000);assert.ok(Object.is(m.readFloat32(0x10000),-0));m.write32(0x10000,0x7f800000);assert.equal(m.readFloat32(0x10000),Infinity);
m.writeSpan(0x1fffe,Uint8Array.of(65,66,0));assert.deepEqual([...m.readCString(0x1fffe,4)],[65,66]);assert.throws(()=>m.readCString(0x1fffe,2),RangeError);
m.protect(0x20000,65536,false);const before=m.readSpan(0x1fffe,4);assert.throws(()=>m.writeSpan(0x1fffe,Uint8Array.of(1,2,3,4)),RangeError);assert.deepEqual(m.readSpan(0x1fffe,4),before);m.protect(0x20000,65536,true);
// Independent byte-array oracle: sequential reads/writes, including overlap.
for(const [dst,src,n,dir] of [[1,0,5,1],[0,1,5,1],[4,5,5,-1],[5,4,5,-1]]){const initial=Uint8Array.of(1,2,3,4,5,6,7,8);const expected=[...initial];for(let i=0;i<n;i++)expected[dst+i*dir]=expected[src+i*dir];m.writeSpan(0x10000,initial);m.moveBytes(0x10000+dst,0x10000+src,n,dir);assert.deepEqual([...m.readSpan(0x10000,8)],expected);}
assert.throws(()=>m.protect(0x10000,NaN,false),RangeError);assert.throws(()=>m.protect(0xffff0000,131072,false),RangeError);
const copy=m.readSpan(0x10000,8);copy[0]=255;assert.notEqual(m.readSpan(0x10000,1)[0],255);
assert.throws(()=>m.map(0x400000,3*65536),RangeError);assert.equal(m.allocatedBytes,3*65536);assert.throws(()=>m.readSpan(0x10000,65537),RangeError);
console.log(JSON.stringify({passed:true,scope:'synthetic bounded spans and ordered byte-copy only',allocatedBytes:m.allocatedBytes,features:['readonly-cross-page-atomic-host-write','uint64-cross-page','float-bits','bounded-strings','forward-backward-overlap-oracle','copy-not-alias','map-budget-rollback'],rssBytes:process.memoryUsage().rss}));
