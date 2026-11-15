import assert from 'node:assert/strict';import {GuestMemory} from './guest-memory.mjs';
const m=new GuestMemory(3);m.map(0x10000,0x20000);assert.throws(()=>{m.maxPages=99},TypeError);assert.equal(m.maxPages,3);
for(const [bits,value] of [[8,255],[16,65535],[32,0xffffffff]]){m[`write${bits}`](0x1ffff,value);assert.equal(m[`read${bits}`](0x1ffff),value);assert.throws(()=>m[`write${bits}`](0x10000,2**bits),RangeError);}
for(const width of [32,64])for(const value of [-0,Infinity,-Infinity,1.5,NaN]){m[`writeFloat${width}`](0x1fffe,value);assert.ok(Object.is(m[`readFloat${width}`](0x1fffe),value));}
// Protection change is atomic if later page is absent.
assert.throws(()=>m.protect(0x20000,131072,false),RangeError);m.write8(0x20000,9);assert.equal(m.read8(0x20000),9);
// Directional byte copy faults after prior byte effects, unlike host writeSpan.
m.writeSpan(0x10000,Uint8Array.of(7,8));m.write8(0x2ffff,0);assert.throws(()=>m.moveBytes(0x2ffff,0x10000,2),RangeError);assert.equal(m.read8(0x2ffff),7);
// Adjacent readonly page rejects full host span before changing first byte.
m.write8(0x1ffff,3);m.protect(0x20000,65536,false);assert.throws(()=>m.write16(0x1ffff,0xffff),RangeError);assert.equal(m.read8(0x1ffff),3);
assert.throws(()=>m.readCString(0x10000,0),RangeError);assert.throws(()=>m.readSpan(-1,1),RangeError);assert.throws(()=>m.writeSpan(0x10000,[]),TypeError);
console.log(JSON.stringify({passed:true,scope:'synthetic scalar/host span contract; not original CPU exception emulation',maxPages:m.maxPages,bytes:m.allocatedBytes,tests:['immutable-budget','unsigned-range','cross-page-scalars','float-special-values','protection-rollback','partial-directional-fault','atomic-host-span-fault'],rssBytes:process.memoryUsage().rss}));
