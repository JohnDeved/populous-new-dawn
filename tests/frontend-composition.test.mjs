import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assets from '../app/original-frontend.json' with {type:'json'}
import {frontendRows,frontendRowY,frontendScale,frontendTextWidth,fadeMask,frontendBackground} from '../app/frontend-composition.ts'
const bytes=new Uint8Array(readFileSync(new URL('../public/original/frontend/composition.bin',import.meta.url)))
test('main row order and integer reference placement follow native menu0 initializer',()=>{
 assert.deepEqual([...frontendRows],['New Game','Tutorial','Load Game','Multiplayer','Options','Rolling Demo','Credits','Coming Soon','Quit'])
 assert.deepEqual(frontendRows.map((_,i)=>frontendRowY(i)),[139,169,199,229,259,289,319,349,379])
 assert.equal(frontendTextWidth('New Game'),130)
 for(const [w,h,scale] of [[640,480,1],[1280,960,2],[1920,1080,2.25],[3440,1440,3]]){
  assert.equal(frontendScale(w,h),scale);assert.ok(640*scale<=w&&480*scale<=h)
 }
})
test('scoped binary preserves hash-pinned background, palette and full mask bounds',()=>{
 assert.equal(bytes.length,assets.binaryBytes)
 const sha=b=>createHash('sha256').update(b).digest('hex')
 assert.equal(sha(bytes.subarray(0,640*480)),assets.inputs['Febackg1.dat'])
 assert.equal(sha(bytes.subarray(640*480,640*480+1024)),assets.inputs['fepal1.dat'])
 assert.equal(sha(bytes.subarray(640*480+1024,640*480+1024+16384)),assets.inputs['fefade1.dat'])
 for(const masks of Object.values(assets.masks))for(const mask of masks){
  assert.ok(mask.offset+mask.w*mask.h<=bytes.length)
  assert.ok(bytes.subarray(mask.offset,mask.offset+mask.w*mask.h).every(n=>n<64||n===255))
 }
 assert.equal(assets.masks.fecursor.length,8)
 assert.deepEqual(assets.banks.fepointe.rects.map(({w,h})=>[w,h]),[[26,27]])
})
test('fade mask combines mask-row and underlying palette index, preserving transparent/clipped pixels',()=>{
 const source=new Uint8Array(640*480+1024+16384+4),offset=source.length-4
 source.set([2,255,3,4],offset)
 source[640*480+1024+2*256+17]=91
 const target=new Uint8Array(640*480).fill(17)
 fadeMask(target,source,{w:2,h:2,offset},639,479)
 assert.equal(target[479*640+639],91)
 assert.equal(target[479*640+638],17)
 const other=new Uint8Array(640*480).fill(17)
 fadeMask(other,source,{w:2,h:2,offset},10,10)
 assert.equal(other[10*640+11],17)
})
test('native shadow composition is deterministic, pointer-dependent, opaque and non-mutating',()=>{
 const before=bytes.slice(),pointer={x:320,y:240}
 const result=frontendBackground(bytes,pointer,true)
 assert.equal(result.length,640*480*4)
 assert.deepEqual(result,frontendBackground(bytes,pointer,true))
 assert.notDeepEqual(result,frontendBackground(bytes,{x:100,y:100},true))
 assert.notDeepEqual(result,frontendBackground(bytes,pointer,false))
 assert.ok(result.every((n,i)=>i%4!==3||n===255))
 assert.notDeepEqual(result,frontendBackground(bytes,pointer,true,0))
 assert.notDeepEqual(frontendBackground(bytes,pointer,true,0),frontendBackground(bytes,pointer,true,1))
 assert.deepEqual(bytes,before)
 assert.throws(()=>frontendBackground(bytes.subarray(1),pointer,true),/Invalid/)
})
