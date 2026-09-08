// npm run dev, then node scripts/check-browser-model-highlight.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => { window.testScene.world.speed = 0 })
  async function target(kind) {
    const id = await page.evaluate(kind => {
      const s = window.testScene
      const object = kind === 'head' ? s.world.shrines.find(h => h.kind === 'bridge') : s.world.buildings.find(b => b.team === 'red')
      s.focus(object)
      return object.id
    }, kind)
    await page.waitForTimeout(100)
    return page.evaluate(id => {
      const s = window.testScene, object = s.world.shrines.find(o => o.id === id) ?? s.world.buildings.find(o => o.id === id)
      const r = s.renderer.domElement.getBoundingClientRect()
      for (let height = .25; height < 10; height += .25) {
        const q = s.screen(object, s.y(object) + height)
        const x = r.left + (q.x+1)*r.width/2, y = r.top + (1-q.y)*r.height/2
        if (x>r.left && x<r.right && y>r.top && y<r.bottom && s.pickWorldObject({ clientX:x, clientY:y })?.id === id) return { x,y,id }
      }
      throw Error('No visible model hit')
    }, id)
  }
  async function highlight(id) {
    return page.evaluate(id => {
      const s = window.testScene, g = s.shrineMeshes.get(id)?.g ?? s.buildingMeshes.get(id)
      return g.children.find(o => o.userData.highlight).userData.highlight.value
    }, id)
  }
  const head = await target('head')
  await page.mouse.move(head.x, head.y)
  await page.waitForFunction(id => window.testScene.hoveredObject === id, head.id)
  for (const turn of [0,1,2,3,4]) {
    await page.evaluate(turn => { window.testScene.world.turn = turn }, turn)
    await page.waitForFunction(({id,value}) => window.testScene.shrineMeshes.get(id).g.children[0].userData.highlight.value === value, { id:head.id, value:turn&2?255:200 })
  }
  const pixels = await page.evaluate(id => {
    const s=window.testScene, m=s.shrineMeshes.get(id).g.children[0], gl=s.renderer.getContext()
    const capture=()=>{s.renderer.render(s.scene,s.camera);const a=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,a);return a}
    const gray=capture();m.userData.highlight.value=255;const white=capture();m.userData.highlight.value=0;const normal=capture();m.userData.highlight.value=200
    let phase=0,lit=0
    for(let i=0;i<gray.length;i+=4){
      if(gray[i]!==white[i]||gray[i+1]!==white[i+1]||gray[i+2]!==white[i+2])phase++
      if(gray[i]!==normal[i]||gray[i+1]!==normal[i+1]||gray[i+2]!==normal[i+2])lit++
    }
    return {phase,lit}
  },head.id)
  assert.ok(pixels.phase>20 && pixels.lit>20,JSON.stringify(pixels))
  await page.screenshot({path:'/private/tmp/populous-model-highlight.png'})
  await page.mouse.down()
  await page.waitForFunction(()=>window.testScene.hoveredObject===null)
  assert.equal(await highlight(head.id),0)
  await page.mouse.up()
  await page.waitForFunction(id=>window.testScene.hoveredObject===id,head.id)
  await page.keyboard.press('1')
  await page.waitForFunction(()=>window.testScene.hoveredObject===null)
  assert.equal(await highlight(head.id),0)
  await page.keyboard.press('Escape')
  await page.waitForFunction(id=>window.testScene.hoveredObject===id,head.id)
  // Moving the camera must refresh a stationary pointer's target.
  await page.keyboard.down('ArrowRight')
  await page.waitForFunction(id=>window.testScene.hoveredObject!==id,head.id)
  await page.keyboard.up('ArrowRight')
  assert.equal(await highlight(head.id),0)
  const enemy=await target('enemy')
  await page.mouse.move(enemy.x,enemy.y)
  await page.waitForFunction(id=>window.testScene.hoveredObject===id,enemy.id)
  assert.equal(await highlight(enemy.id),0,'Enemy building is not a normal selectable hover target')
  // The same native gate enables an owned building, including its staged mesh.
  await page.evaluate(id=>{const s=window.testScene,b=s.world.buildings.find(b=>b.id===id);b.team='blue';b.progress=.5;s.world.turn++},enemy.id)
  await page.waitForFunction(id=>window.testScene.buildingMeshes.get(id).children[0].userData.highlight.value>0,enemy.id)
  await page.mouse.move(10,10)
  await page.waitForFunction(()=>window.testScene.hoveredObject===null)
  assert.equal(await highlight(enemy.id),0)
  assert.deepEqual(errors,[])
  console.log(`PASS: real mouse hover, native two-turn gray/white phase (${pixels.phase} GPU pixels), sunlight override (${pixels.lit}), press/release, spell mode, stationary-pointer camera refresh, enemy/owned construction gates and leave cleanup; no browser errors`)
} finally { await browser.close() }
