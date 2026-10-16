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
test('wide field keeps the original face and crown at native logical scale',()=>{
 for(const width of [642,660,720,800,854,1148,1708]){
  const pixels=frontendWideIndexedBackground(source,width),offset=(width-640)/2
  assert.equal(pixels.length,width*480)
  for(let y=0;y<480;y++)assert.deepEqual(pixels.subarray(y*width+offset+120,y*width+offset+520),source.subarray(y*640+120,y*640+520))
 }
})
test('the first wide logical pixels preserve every original art pixel without a crop or zoom jump',()=>{
 const pixels=frontendWideIndexedBackground(source,642)
 for(let y=0;y<480;y++)assert.deepEqual(pixels.subarray(y*642+1,y*642+641),source.subarray(y*640,(y+1)*640))
})
test('both badge panels retain exact source pixels and original centered-frame positions',()=>{
 for(const width of [642,854,1148,1708]){
  const pixels=frontendWideIndexedBackground(source,width),offset=(width-640)/2
  for(const [x,y,w,h]of [[5,387,54,89],[569,416,48,60]])
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
