import assert from 'node:assert/strict';
import {decodeSurfaceDescriptor as decode} from './decode.mjs';
function fixture(size=108,bpp=16){const b=new Uint8Array(size),d=new DataView(b.buffer),w=(o,v)=>d.setUint32(o,v,true);w(0,size);w(4,0x180f);w(8,2);w(12,2);w(16,8);w(36,0xfe00fffe);w(72,32);w(76,bpp===8?0x60:0x40);w(84,bpp);if(bpp===16){w(88,0xf800);w(92,0x7e0);w(96,0x1f);}return b;}
const options={fullSurface:true};
assert.deepEqual(decode(fixture(),options),{base:0xfe00fffe,width:2,height:2,pitch:8,format:'rgb565le',paletteRequired:false});
assert.equal(decode(fixture(124,8),options).paletteRequired,true);
assert.throws(()=>decode(fixture()),/provenance/);
for(const [offset,value] of [[0,124],[4,0],[72,0],[84,24],[88,0x1f],[16,0xffffffff],[8,1025],[36,0xfffffffe],[100,0xff]]){const b=fixture();new DataView(b.buffer).setUint32(offset,value,true);assert.throws(()=>decode(b,options));}
const padded=new Uint8Array(110);padded.set(fixture(),1);assert.equal(decode(padded.subarray(1,109),options).base,0xfe00fffe);
const shared=new Uint8Array(new SharedArrayBuffer(108));shared.set(fixture());assert.throws(()=>decode(shared,options),/copied/);
console.log('PASS 14 copied descriptor controls: formats, full-surface provenance, bounds, masks, byte offsets and shared rejection');
