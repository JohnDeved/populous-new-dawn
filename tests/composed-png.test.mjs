import test from 'node:test'
import assert from 'node:assert/strict'
import { deflateSync } from 'node:zlib'
import { decodeComposedPng } from '../scripts/integration-queue/composed-png.mjs'
function chunk(type,data=Buffer.alloc(0)) {
  const out=Buffer.alloc(12+data.length);out.writeUInt32BE(data.length);out.write(type,4,'latin1');data.copy(out,8)
  let c=0xffffffff;for(const b of out.subarray(4,-4)){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^(c&1?0xedb88320:0)}out.writeUInt32BE((c^0xffffffff)>>>0,out.length-4);return out
}
const signature=Buffer.from('89504e470d0a1a0a','hex')
function png({color=6,filter=0,metadata=[],after=[],packedSuffix=Buffer.alloc(0),split=false}={}) {
  const header=Buffer.alloc(13);header.writeUInt32BE(2);header.writeUInt32BE(2,4);header[8]=8;header[9]=color
  const channels=color===6?4:3,decoded=Buffer.from(Array.from({length:4*channels},(_,i)=>i%channels===3?255:30+i)),stride=2*channels,raw=Buffer.alloc(2*(stride+1))
  const paeth=(a,b,c)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c}
  for(let y=0;y<2;y++){raw[y*(stride+1)]=filter;for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?decoded[i-channels]:0,b=y?decoded[i-stride]:0,c=y&&x>=channels?decoded[i-stride-channels]:0;raw[y*(stride+1)+1+x]=(decoded[i]-[0,a,b,(a+b)>>1,paeth(a,b,c)][filter])&255}}
  const packed=Buffer.concat([deflateSync(raw),packedSuffix]),ids=split?[chunk('IDAT',packed.subarray(0,4)),chunk('IDAT',packed.subarray(4))]:[chunk('IDAT',packed)]
  const rgba=Buffer.alloc(16);for(let p=0;p<4;p++)rgba.set([...decoded.subarray(p*channels,p*channels+3),channels===4?decoded[p*channels+3]:255],p*4)
  return {bytes:Buffer.concat([signature,chunk('IHDR',header),...metadata,...ids,...after,chunk('IEND')]),rgba}
}
test('bounded composed PNG decodes ordinary RGB/RGBA and all filters exactly',()=>{
  for(const color of [2,6])for(let filter=0;filter<=4;filter++){const f=png({color,filter,split:true});assert.deepEqual(Buffer.from(decodeComposedPng(f.bytes,{width:2,height:2}).rgba),f.rgba)}
  const gamma=Buffer.alloc(4);gamma.writeUInt32BE(45455);const phys=Buffer.alloc(9);phys.writeUInt32BE(1);phys.writeUInt32BE(1,4)
  assert.equal(decodeComposedPng(png({metadata:[chunk('sRGB',Buffer.from([0])),chunk('gAMA',gamma),chunk('pHYs',phys)]}).bytes).width,2)
})
test('composed PNG rejects animation, transparency, unsupported metadata, malformed bytes and bounds',()=>{
  for(const type of ['tRNS','acTL','fcTL','fdAT','iCCP','cICP','sBIT','bKGD','tEXt','PLTE','IDaT','\xc9DAT'])assert.throws(()=>decodeComposedPng(png({metadata:[chunk(type,Buffer.alloc(6))]}).bytes))
  assert.throws(()=>decodeComposedPng(png({color:2,metadata:[chunk('tRNS',Buffer.from([0,255,0,255,0,255]))]}).bytes))
  assert.throws(()=>decodeComposedPng(png({metadata:[chunk('sRGB',Buffer.from([0])),chunk('sRGB',Buffer.from([0]))]}).bytes))
  assert.throws(()=>decodeComposedPng(png({after:[chunk('sRGB',Buffer.from([0]))]}).bytes))
  assert.throws(()=>decodeComposedPng(png({packedSuffix:Buffer.from([0])}).bytes))
  assert.throws(()=>decodeComposedPng(png({metadata:Array.from({length:129},()=>chunk('sRGB',Buffer.from([0])))}).bytes))
  const f=png();for(const bytes of [Buffer.alloc(16*1024*1024+1),f.bytes.subarray(0,-1),Buffer.concat([f.bytes,Buffer.from([0])])])assert.throws(()=>decodeComposedPng(bytes))
  const bad=Buffer.from(f.bytes);bad[45]^=1;assert.throws(()=>decodeComposedPng(bad))
  for(const dimensions of [{width:3,height:2},{maxWidth:1},{maxHeight:1}])assert.throws(()=>decodeComposedPng(f.bytes,dimensions))
  assert.throws(()=>decodeComposedPng(Promise.resolve(f.bytes)))
})
