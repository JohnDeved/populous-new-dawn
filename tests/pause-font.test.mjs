import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import font from '../app/original-pause-font.json' with {type:'json'}
test('native in-game F00T9 bank has bounded atlas and exact question advances',()=>{
 assert.equal(font.inputs['data/f00t9-0.dat'],'9ebc84d92250f403977323ba88aae01ff2de98b7790cce8dfebb42b1fc19e168')
 assert.equal(font.rects.length,224)
 for(const r of font.rects){assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=font.width&&r.y+r.h<=font.height)}
 const width=s=>[...s].reduce((n,c)=>n+font.rects[c.charCodeAt(0)-32].w,0)
 for(const [text,w] of [['Continue Game',200],['Restart Level?',203],['Quit Level?',159],['Quit Game?',157]])assert.equal(width(text),w)
 const png=readFileSync(new URL('../public/original/pause-font.png',import.meta.url))
 assert.equal(png.readUInt32BE(16),font.width);assert.equal(png.readUInt32BE(20),font.height)
})
