import assert from 'node:assert/strict';
import {normalizeSurface as n} from './normalize-surface.mjs';
let passed=0;
const source={bytes:Uint8Array.of(0,248,224,7,99,99,31,0,255,255),width:2,height:2,pitch:6,format:'rgb565le'};
assert.deepEqual([...n(source).rgba],[255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,255]);passed++;
// Exhaustive channel field coverage against independently expressed integer scaling.
for(let c=0;c<65536;c++){
 const out=n({bytes:Uint8Array.of(c&255,c>>>8),width:1,height:1,pitch:2,format:'rgb565le'}).rgba;
 const r=c>>>11,g=(c>>>5)&63,b=c&31;
 assert.deepEqual([...out],[r*8+Math.floor(r/4),g*4+Math.floor(g/16),b*8+Math.floor(b/4),255]);
}passed++;
const palette=new Uint32Array(256);palette[1]=0xff123456;palette[255]=0xabcdef;
const p={bytes:Uint8Array.of(1,99,255),width:1,height:2,pitch:2,format:'indexed8',palette};
assert.deepEqual([...n(p).rgba],[18,52,86,255,171,205,239,255]);passed++;
const copy=n(source).rgba;source.bytes[0]=255;assert.equal(copy[2],0);passed++;
for(const patch of [{width:0},{height:1025},{pitch:3},{pitch:-6},{bytes:new Uint8Array(9)},{format:'rgb555'},{bytes:new Uint8Array(11)}]){assert.throws(()=>n({...source,...patch}));passed++;}
assert.throws(()=>n({...p,palette:new Uint32Array(255)}));passed++;
assert.throws(()=>n({...p,palette:undefined}));passed++;
console.log(JSON.stringify({scope:'authored surface normalization only',passed,rgb565Values:65536,rss:process.memoryUsage().rss}));
