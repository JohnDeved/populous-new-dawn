import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
const input=read('app/camera-input.ts'),start=input.indexOf('export function cameraEdgeButtons('),end=input.indexOf('\n//',start)
const body=input.slice(start,end).replace('export ','').replaceAll(': number','')
const edge=runInNewContext(body+';cameraEdgeButtons')
test('actual outer-pixel contract admits x0 but not x1 at middle height',()=>{
 assert.equal(edge(0,500,1440,1000),4);assert.equal(edge(1,500,1440,1000),0)
 assert.equal(edge(1439,500,1440,1000),8);assert.equal(edge(1438,500,1440,1000),0)
})
test('both actual public edge moves use a viewport pixel admitted by the production boundary',async()=>{
 const source=read('scripts/tutorial-browser/camera-motion-evidence.mjs')
 const expressions=[...source.matchAll(/if\(kind(?:\.includes\('edge'\)|==='flyby-edge')\)await step\(\(\)=>(page\.mouse\.move\(\d+,500\))\)/g)].map(m=>m[1])
 assert.equal(expressions.length,2)
 for(const expression of expressions){const moves=[];await runInNewContext(expression,{page:{mouse:{move:async(x,y)=>moves.push([x,y])}}});assert.deepEqual(moves,[[0,500]]);assert.equal(edge(...moves[0],1440,1000),4)}
})
test('exact event and stationary-pointer witnesses bind the same actual outer pixel',()=>{
 const source=read('scripts/tutorial-browser/camera-motion-acceptance.mjs')
 assert.match(source,/e\.type==='pointermove'&&e\.x===0/)
 assert.match(source,/r\.navigationPointer\?\.x===0&&r\.navigationPointer\?\.y===500/)
 assert.match(source,/assert\.equal\(current\.inputButtons!==0,positive/)
 assert.match(source,/assert\.equal\(current\.inputCursor,previous\.inputCursor/)
})
test('sidebar edges are globally tracked by public window movement, not battlefield-target filtering',()=>{
 const source=read('app/scene-input-runtime.ts'),start=source.indexOf('  const trackNavigation ='),end=source.indexOf("  scene.listen(globalThis, 'pointerup'",start),block=source.slice(start,end)
 assert.ok(start>=0&&end>start);assert.match(block,/p\.pointerType === 'mouse'/);assert.match(block,/x: p\.clientX, y: p\.clientY/)
 assert.match(block,/\['pointermove', 'pointerdown', 'pointerup'\]/);assert.match(block,/scene\.listen\(window, event, trackNavigation\)/)
 assert.equal(block.includes('event.target'),false)
 assert.match(input,/outer screen pixels, including the sidebar and corners/)
})
