// Keep first-mission vegetation visible beside huts, including scene rebuilds.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({headless:true})
try {
  const {page,errors} = await openGame(browser)
  const state = await page.evaluate(() => {
    const s=window.testScene,w=s.world
    w.speed=0;cancelAnimationFrame(s.frame)
    const t=w.trees.find(t=>t.id===3),b=w.buildings.find(b=>b.id===1)
    s.focus(t);s.updateView()
    window.nearHutTree=t
    // Native building anchors moved since this regression was introduced.
    // Explicitly recreate close proximity so the removed distance filter
    // remains covered without changing the original first-mission placement.
    const original={x:b.x,z:b.z}
    b.x=t.x+1;b.z=t.z
    s.releaseGroup(s.decorations);s.decorations.clear();s.makeDecorations()
    const crowded=s.decorations.children.some(g=>g.userData.point===t)
    Object.assign(b,original)
    s.releaseGroup(s.decorations);s.decorations.clear();s.makeDecorations()
    return {crowded,tree:{x:t.x,z:t.z,id:t.id},building:{x:b.x,z:b.z,id:b.id},distance:Math.hypot(t.x-b.x,t.z-b.z),logs:t.logs,
      rendered:s.decorations.children.some(g=>g.userData.point===t)}
  })
  assert.ok(state.distance>3.7 && state.distance<5 && state.logs>=1,JSON.stringify(state))
  assert.ok(state.rendered,'original first-mission tree beside hut must have a mesh')
  assert.ok(state.crowded,'a nearby building must not suppress the tree')
  const pixels = await page.evaluate(() => {
    const s=window.testScene,t=window.nearHutTree,result=[]
    for(let turn=0;turn<4;turn++) {
      // Rebuilds used to reapply the arbitrary building-distance filter.
      s.releaseGroup(s.decorations);s.decorations.clear();s.makeDecorations()
      s.cameraBearing=turn*Math.PI/2;s.updateView();s.animate(s.previous);cancelAnimationFrame(s.frame)
      const g=s.decorations.children.find(g=>g.userData.point===t)
      if(!g)throw new Error('tree disappeared after scenery rebuild')
      const gl=s.renderer.getContext(),n=gl.drawingBufferWidth*gl.drawingBufferHeight*4,
        before=new Uint8Array(n),after=new Uint8Array(n)
      s.renderer.render(s.scene,s.camera);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,before)
      g.visible=false;s.renderer.render(s.scene,s.camera);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,after);g.visible=true
      let changed=0;for(let i=0;i<n;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])changed++
      result.push(changed)
    }
    s.cameraBearing=0;s.updateView();s.renderer.render(s.scene,s.camera)
    return result
  })
  assert.ok(pixels.some(n=>n>100),`tree must contribute visible pixels: ${pixels}`)
  await page.screenshot({path:'/private/tmp/populous-scenery-visibility-v113.png'})
  assert.deepEqual(errors,[])
  console.log(`PASS: first-mission tree beside hut remains rendered across four rotations/rebuilds (${pixels.join(', ')} GPU pixels); no browser errors`)
} finally { await browser.close() }
