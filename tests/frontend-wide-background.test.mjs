import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {frontendBackground, fadeMask} from '../app/frontend-composition.ts'
import {frontendWideIndexedBackground} from '../app/frontend-wide-background.ts'
const source=new Uint8Array(readFileSync(new URL('../public/original/frontend/composition.bin',import.meta.url)))
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')

// Recorded from the unchanged compositor at d5768f9d, before adaptation.
const nativeCases=[
  {
    "pointer": {
      "x": 320,
      "y": 240
    },
    "menu": true,
    "glowFrame": null,
    "rows": [],
    "sha256": "81c170ca64dbf189a2cd8820eca71643a06e0d83cf7bb7156461b91e99f570e2"
  },
  {
    "pointer": {
      "x": 0,
      "y": 0
    },
    "menu": true,
    "glowFrame": 0,
    "rows": [],
    "sha256": "c473d517f574e03c5899e9e65d21b8fe096c993019e7551519ea9d55ff955842"
  },
  {
    "pointer": {
      "x": 639,
      "y": 479
    },
    "menu": true,
    "glowFrame": 7,
    "rows": [],
    "sha256": "aa0f1d3eb82f8a333ab7f5e1b4110a60b64cafcb1a202993455a3a23607190d0"
  },
  {
    "pointer": {
      "x": 320,
      "y": 240
    },
    "menu": false,
    "glowFrame": null,
    "rows": [
      {
        "text": "Quit?",
        "x": 320,
        "y": 159
      },
      {
        "text": "Yes",
        "x": 320,
        "y": 189
      },
      {
        "text": "No",
        "x": 320,
        "y": 219
      },
      {
        "text": "Back",
        "x": 320,
        "y": 454
      }
    ],
    "sha256": "7a46eb3e86cbbc0e6f96f95d94a0ca983aec202a440240e115658dc22cfd3bfe"
  },
  {
    "pointer": {
      "x": 500,
      "y": 60
    },
    "menu": false,
    "glowFrame": 3,
    "rows": [
      {
        "text": "Options",
        "x": 320,
        "y": 139
      },
      {
        "text": "Back",
        "x": 320,
        "y": 454
      }
    ],
    "sha256": "4148a981bce7b60c78423de55e337c76bd1a0b80e7ecff7f9e39b4c15651608d"
  }
]
test('native 4:3 composition is byte-identical across main, Quit, options, pointer and glow cases',()=>{
 for(const c of nativeCases)assert.equal(sha(frontendBackground(source,c.pointer,c.menu,c.glowFrame,c.rows)),c.sha256)
})
test('wide field uniformly covers from the original safe artwork, without stretching or repeated tiles',()=>{
 for(const width of [642,854,1148,1280,1708]){
  const pixels=frontendWideIndexedBackground(source,width)
  assert.equal(pixels.length,width*480)
  const scale=Math.max(width/640,1.25),left=(640-width/scale)/2,top=384-480/scale
  for(const y of [0,30,200,300,383])for(const x of [0,1,100,width>>1,width-2,width-1]){
   const sx=Math.floor(left+x/scale),sy=Math.floor(top+y/scale)
   assert.ok(sx>=0&&sx<640&&sy>=0&&sy<384)
   assert.equal(pixels[y*width+x],source[sy*640+sx])
  }
 }
})
test('both exact badge panels retain source pixels at native frame scale and viewport bottom corners',()=>{
 for(const width of [642,854,1148,1708]){
  const pixels=frontendWideIndexedBackground(source,width)
  for(const [x,y,w,h,offset]of [[5,387,54,89,0],[569,416,48,60,width-640]])
   for(let row=0;row<h;row++)assert.deepEqual(pixels.subarray((y+row)*width+x+offset,(y+row)*width+x+offset+w),source.subarray((y+row)*640+x,(y+row)*640+x+w))
 }
})
test('cached wide sampling remains immutable when callers apply palette effects',()=>{
 const before=source.slice(),first=frontendWideIndexedBackground(source,854),expected=first.slice()
 first.fill(255)
 assert.deepEqual(frontendWideIndexedBackground(source,854),expected)
 frontendBackground(source,{x:100,y:200},true,3,[],854)
 assert.deepEqual(frontendWideIndexedBackground(source,854),expected)
 assert.deepEqual(source,before)
})
test('palette fade uses wide stride and clips only at actual wide canvas bounds',()=>{
 const width=854,bytes=new Uint8Array(640*480+1024+16384+4),offset=bytes.length-4
 bytes.set([2,255,3,4],offset);bytes[640*480+1024+2*256+17]=91
 const pixels=new Uint8Array(width*480).fill(17)
 fadeMask(pixels,bytes,{w:2,h:2,offset},width-1,479,width)
 assert.equal(pixels[width*480-1],91);assert.equal(pixels[width*480-2],17)
})
test('wide final composition stays opaque and rejects fractional or invalid widths',()=>{
 const pixels=frontendBackground(source,{x:320,y:240},true,null,[],854)
 assert.equal(pixels.length,854*480*4);assert.ok(pixels.every((n,i)=>i%4!==3||n===255))
 for(const width of [639,641,854.5,NaN,Infinity])assert.throws(()=>frontendBackground(source,{x:0,y:0},true,null,[],width),/Invalid frontend composition width/)
})
