import assert from 'node:assert/strict';import {GuestMemory} from './guest-memory.mjs';
import {snapshotGuestInput,commitHostRead,snapshotIndexedSurface} from './native-boundary.mjs';
const m=new GuestMemory(4);m.map(0x10000,131072);m.writeSpan(0x1fffe,Uint8Array.of(1,2,3,4));
const input=snapshotGuestInput(m,0x1fffe,4);input[0]=99;assert.equal(m.read8(0x1fffe),1);
assert.equal(commitHostRead(m,0x1fffe,Uint8Array.of(8,9,10,11),2),2);assert.deepEqual([...m.readSpan(0x1fffe,4)],[8,9,3,4]);
assert.equal(commitHostRead(m,0,Uint8Array.of(1),0),0);assert.throws(()=>commitHostRead(m,0x10000,Uint8Array.of(1),2),RangeError);
m.write8(0x2ffff,42);assert.throws(()=>commitHostRead(m,0x2ffff,Uint8Array.of(7,8),2),RangeError);assert.equal(m.read8(0x2ffff),42);
// Three rows straddle a sparse-page boundary; padding must never enter the image.
m.writeSpan(0x1fff9,Uint8Array.of(1,2,3,99,99,4,5,6,99,99,7,8,9));
const image=snapshotIndexedSurface(m,0x1fff9,3,3,5);assert.deepEqual([...image.pixels],[1,2,3,4,5,6,7,8,9]);assert.equal(image.pitch,3);
image.pixels[0]=55;assert.equal(m.read8(0x1fff9),1);
for(const args of [[0x10000,4096,4096,4096],[0xfffffffe,3,1,3],[0x10000,3,1,2]])assert.throws(()=>snapshotIndexedSurface(m,...args),RangeError);
assert.throws(()=>snapshotIndexedSurface(m,0x2fffe,3,1,3),RangeError);
console.log(JSON.stringify({passed:true,scope:'synthetic host-copy boundary only',cases:['snapshot-not-alias','short-read-count','zero-read-no-access','faulted-write-unchanged','pitched-cross-page-surface','surface-overflow-and-budget'],rssBytes:process.memoryUsage().rss}));
