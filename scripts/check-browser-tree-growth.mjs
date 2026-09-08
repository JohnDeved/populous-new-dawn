// Native depletion -> delayed planting -> visible growth through the live simulation.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { timberScale } from '../app/timber.ts'
import rules from '../app/original-rules.json' with {type:'json'}
import models from '../app/original-models.json' with {type:'json'}
const browser=await chromium.launch({headless:true})
try {
  const {page,errors}=await openGame(browser)
  await page.evaluate(()=>{
    const s=window.testScene,w=s.world,t=w.trees.find(t=>t.id===21)
    window.growingTree=t;window.oldTreeIds=new Set(w.trees.map(t=>t.id))
    for(const u of w.units){u.guard=true}
    t.logs=1;t.burn={remaining:76,started:true,wood:100,scale:100}
    s.focus(t);w.speed=4
  })
  await page.waitForFunction(()=>{
    const s=window.testScene,t=window.growingTree,r=s.world.replants.find(r=>r.model===t.model)
    if(!r||t.logs!==0||s.decorations.children.some(g=>g.userData.point===t))return false
    s.world.speed=0;window.replantRequest=r;return true
  })
  const initial=await page.evaluate(()=>({remaining:window.replantRequest.remaining,turn:window.testScene.world.turn,model:window.growingTree.model}))
  assert.ok(initial.remaining>3900&&initial.remaining<=4000)
  await page.screenshot({path:'/private/tmp/populous-tree-depleted-v112.png'})
  await page.evaluate(()=>{window.testScene.world.speed=32})
  await page.waitForFunction(()=>{
    const s=window.testScene,t=s.world.trees.find(t=>!window.oldTreeIds.has(t.id)&&t.model===window.growingTree.model)
    if(!t||!s.decorations.children.some(g=>g.userData.point===t))return false
    s.world.speed=0;window.newTree=t;s.focus(t);return true
  })
  const sapling=await page.evaluate(()=>{
    const s=window.testScene,t=window.newTree,mesh=s.decorations.children.find(g=>g.userData.point===t).children[0]
    return {wood:Math.round(t.logs*100),size:mesh.userData.nativeSize,turn:s.world.turn,pending:s.world.replants.includes(window.replantRequest)}
  })
  assert.ok(sapling.turn-initial.turn>=initial.remaining)
  assert.ok(sapling.wood>=100&&sapling.wood<=110);assert.equal(sapling.pending,false)
  const scale=models[rules.sceneryObjects[initial.model]].scale
  assert.equal(sapling.size,timberScale(sapling.wood,rules.sceneryWood[initial.model],scale))
  await page.screenshot({path:'/private/tmp/populous-tree-sapling-v112.png'})
  await page.evaluate(()=>{window.testScene.world.speed=32})
  await page.waitForFunction(()=>{
    const s=window.testScene
    if(window.newTree.logs<4)return false
    s.world.speed=0;return true
  })
  const grown=await page.evaluate(small=>{
    const s=window.testScene,t=window.newTree,g=s.decorations.children.find(g=>g.userData.point===t),mesh=g.children[0],gl=s.renderer.getContext()
    const read=()=>{s.renderer.render(s.scene,s.camera);const p=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p}
    const size=mesh.userData.nativeSize,before=read();mesh.userData.nativeSize=small;const after=read();mesh.userData.nativeSize=size
    let pixels=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])pixels++
    return {size,pixels,shadow:s.world.sceneryShadows.has(t.id),oldHidden:!s.decorations.children.some(g=>g.userData.point===window.growingTree)}
  },sapling.size)
  assert.equal(grown.size,scale);assert.ok(grown.pixels>0);assert.ok(grown.shadow&&grown.oldHidden)
  await page.screenshot({path:'/private/tmp/populous-tree-regrown-v112.png'})
  assert.deepEqual(errors,[])
  console.log(`PASS: real depletion and full replant countdown, original small tree (${sapling.wood} wood), model growth (${grown.pixels} GPU pixels), restored shade and removed original tree; no browser errors`)
} finally {await browser.close()}
