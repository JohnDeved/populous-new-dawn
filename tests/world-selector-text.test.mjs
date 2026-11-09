import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const root='public/original/world-selector/text/'
const provenance=JSON.parse(readFileSync(root+'provenance.json'))
const runtime=JSON.parse(readFileSync(root+'runtime.json'))
test('native selected titles retain Western sprite text, widths and source y400',()=>{
 for(const [mission,text,width] of [[1,'01 : The Journey Begins',200],[2,'02 : Night Falls',139],[3,'03 : Crisis of Faith',170]]){
  const title=runtime.banks[mission].title
  assert.equal(title.text,text);assert.equal(title.width,width);assert.equal(title.height,19);assert.equal(title.nativeY,400)
  const png=readFileSync(root+title.file)
  assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),19)
 }
 assert.equal(provenance.inputs['data/fenew/felo20we.spr'],'9179950e0b53e1d27a6864ef5848af5fff95883c531b328ae3ba2889111f11ee')
 assert.equal(provenance.inputs['data/fenew/fettwe.spr'],'8d76fc1ef0abf454449e77ddaf6aab8b386072d6f037b1f1463a391f110656ad')
})
test('tooltip mouse glyphs and panel frame12 cursor keep exact source dimensions',()=>{
 for(const bank of Object.values(runtime.banks)){
  for(const [id,width] of [[978,109],[979,167],[980,218]]){
   const tip=bank.tooltips[id],png=readFileSync(root+tip.file)
   assert.equal(tip.width,width);assert.equal(tip.height,10);assert.ok(tip.text.includes('{}'))
   assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),10)
  }
  assert.deepEqual(bank.cursor.hotspot,[0,0]);assert.equal(bank.cursor.width,26);assert.equal(bank.cursor.height,27)
 }
 assert.equal(provenance.inputs['data/plspanel.spr'],'9b3e17fd501c65c7357cb64c0c8f27ec43304da8726afa6044b642e65e50a778')
 assert.ok(provenance.limits.some(value=>value.includes('not yet positively bound')))
})
test('generated runtime metadata stays compact and art keeps recorded output hashes',()=>{
 assert.ok(readFileSync(root+'runtime.json').length<4096)
 const hashes=[]
 function inspect(value){
  if(!value||typeof value!=='object')return
  if(typeof value.file==='string'&&value.outputSha256)hashes.push([value.file,value.outputSha256])
  for(const item of Object.values(value))inspect(item)
 }
 inspect(provenance)
 assert.ok(hashes.length>=15)
 for(const [file,hash] of hashes)assert.equal(createHash('sha256').update(readFileSync(root+file)).digest('hex'),hash)
})
