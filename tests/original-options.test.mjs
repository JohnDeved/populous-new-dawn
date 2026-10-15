import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import artwork from '../app/original-options-art.json' with {type:'json'}
import {frontendBackground} from '../app/frontend-composition.ts'
const source=new Uint8Array(readFileSync(new URL('../public/original/frontend/composition.bin',import.meta.url)))
test('Options uses separate source-hashed original slider banks with unclipped thumb dimensions',()=>{
 assert.equal(artwork.inputs['data/fenew/feslider.spr'],'99dd18f3d07b7e8b36977b60f1543fe089972523c5f364db7fe19d85dc5667c8')
 assert.equal(artwork.inputs['data/fenew/igmslidr.spr'],'ab91567305e23bdbe9923cd8b9ea49956a562fd06dcf549513f27db1220d63da')
 assert.equal(artwork.inputs['data/pal0-c.dat'],'6c61cd586fc96ef5f777c71966a9ac1875491a4a521342ba06d108df5e92bf53')
 const hashes={}
 for(const skin of ['frontend','ingame']) {
  assert.deepEqual(artwork.banks[skin].map(({w,h})=>[w,h]),[[308,19],[23,22],[23,22]])
  hashes[skin]=artwork.banks[skin].map(({file,w,h})=>{
   const data=readFileSync(new URL(`../public/original/options/${file}`,import.meta.url))
   assert.equal(data.readUInt32BE(16),w);assert.equal(data.readUInt32BE(20),h)
   return createHash('sha256').update(data).digest('hex')
  })
 }
 assert.notDeepEqual(hashes.frontend,hashes.ingame)
 assert.notEqual(hashes.frontend[1],hashes.frontend[2])
 assert.notEqual(hashes.ingame[1],hashes.ingame[2])
})
test('Options indexed shadows are tied to actual labels and reference positions, without stale main labels',()=>{
 const pointer={x:320,y:240},rows=[{text:'Game',x:170,y:420},{text:'Sound',x:320,y:420},{text:'Graphics',x:470,y:420},{text:'Back',x:320,y:454}]
 const plain=frontendBackground(source,pointer,false),options=frontendBackground(source,pointer,false,null,rows)
 assert.notDeepEqual(options,plain)
 assert.notDeepEqual(options,frontendBackground(source,pointer,true))
 assert.deepEqual(options,frontendBackground(source,pointer,false,null,rows))
 assert.notDeepEqual(options,frontendBackground(source,pointer,false,null,[...rows,{text:'Master volume : <35%>',x:320,y:139}]))
 assert.deepEqual(options.subarray(110*640*4,130*640*4),plain.subarray(110*640*4,130*640*4))
})
