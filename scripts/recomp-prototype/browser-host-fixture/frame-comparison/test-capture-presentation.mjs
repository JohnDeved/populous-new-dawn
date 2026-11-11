import assert from 'node:assert/strict';
import {GuestMemory} from '../../browser-boundary-fixture/guest-memory.mjs';
import {capturePresentation as capture} from './capture-presentation.mjs';
const m=new GuestMemory(2);m.map(0xfe000000,0x20000);m.writeSpan(0xfe00ffff,Uint8Array.of(1,2));m.writeSpan(0xfe010010,Uint8Array.of(2,1));
const descriptor=new Uint8Array(108),v=new DataView(descriptor.buffer);for(const [o,n] of [[0,108],[4,0x180f],[8,1],[12,2],[16,4],[36,0xfe00ffff],[72,32],[76,0x60],[84,8]])v.setUint32(o,n,true);
const palette=new Uint32Array(256);palette[1]=0xff0000;palette[2]=0x0000ff;
let reads=0;const config={descriptor,fullSurface:true,rendererPath:'software-surface',exclusiveOwner:true,readSpan:(a,n)=>{reads++;return m.readSpan(a,n);},palette};
const first=capture(config);assert.deepEqual([...first.rgba],[255,0,0,255,0,0,255,255]);
// Palette-only presentation changes pixels even with the same surface memory.
palette[1]=0x00ff00;const recolor=capture(config);assert.deepEqual([...recolor.rgba],[0,255,0,255,0,0,255,255]);assert.equal(first.rgba[0],255);
// Flip changes surface pointer before capture; don't retain stale descriptor decoding.
v.setUint32(36,0xfe010010,true);assert.deepEqual([...capture(config).rgba],[0,0,255,255,0,255,0,255]);
for(const patch of [{fullSurface:false},{exclusiveOwner:false},{rendererPath:'hybrid'},{palette:new Uint32Array(new SharedArrayBuffer(1024))}]){const before=reads;assert.throws(()=>capture({...config,...patch}));assert.equal(reads,before);}
console.log(JSON.stringify({scope:'authored descriptor to presentation integration',checks:7,paletteOnlyAndFlip:true,unsupportedPathsRejectedBeforeRead:true}));
