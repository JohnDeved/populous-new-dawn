// Real tooltip rendering, imported glyph pixels, both native font sizes and hover.
import {chromium} from '@playwright/test'
import assert from 'node:assert/strict'
import fixture from '../tests/fixtures/tooltip-layout.json' with {type:'json'}
import {openGame} from './browser-game.mjs'
const browser=await chromium.launch({headless:true})
try{
  const {page,errors}=await openGame(browser)
  await page.evaluate(()=>{
    const s=window.testScene;s.world.speed=0;cancelAnimationFrame(s.frame)
    const b=s.world.buildings.find(b=>b.kind==='hut'&&b.team==='blue')
    s.focus(b);window.tooltipBuilding=b;s.tooltip.target=b.id;s.tooltip.draw=1
    s.tooltip.text='Small Hut: Select Followers and {}to house. |}query.';s.renderTooltip()
  })
  await page.waitForFunction(()=>{window.testScene.renderTooltip();return document.querySelector('.native-tooltip canvas').dataset.layout})
  await page.evaluate(()=>cancelAnimationFrame(window.testScene.frame))
  const sizes=[...new Set(fixture.cases.map(c=>c.screen.join(',')))]
  let checked=0
  for(const size of sizes){
    const [width,height]=size.split(',').map(Number);await page.setViewportSize({width,height})
    for(const c of fixture.cases.filter(c=>c.screen.join(',')===size)){
      const actual=await page.evaluate(async text=>{
        const s=window.testScene;s.tooltip.text=text;s.tooltip.draw=1;s.renderTooltip()
        const canvas=s.tooltipCanvas,pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data
        const digest=await crypto.subtle.digest('SHA-256',pixels)
        return {width:canvas.width,height:canvas.height,hash:[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join(''),label:s.tooltipElement.getAttribute('aria-label')}
      },c.text)
      assert.deepEqual([actual.width,actual.height,actual.hash],[c.width,c.height,c.pixelSha256],JSON.stringify(c))
      assert.doesNotMatch(actual.label,/[{}|]/);checked++
    }
  }
  await page.setViewportSize({width:1440,height:1000})
  await page.waitForFunction(()=>{const s=window.testScene;return s.container.clientHeight===1000&&s.renderer.domElement.clientWidth===s.container.clientWidth&&s.renderer.domElement.clientHeight===1000})
  const target=await page.evaluate(()=>{
    const s=window.testScene,b=window.tooltipBuilding;s.tooltip.draw=0;s.focus(b);s.animate(s.previous);cancelAnimationFrame(s.frame)
    const r=s.renderer.domElement.getBoundingClientRect()
    for(let h=0;h<15;h+=.25){
      const p=s.screen(b,s.y(b)+h),x=r.left+(p.x+1)*r.width/2,y=r.top+(1-p.y)*r.height/2
      if(s.pickWorldObject({clientX:x,clientY:y})?.id===b.id)return {x,y}
    }
    throw Error('No real hut mesh hit')
  })
  await page.mouse.move(target.x,target.y)
  await page.evaluate(()=>{const s=window.testScene;s.animate(s.previous);cancelAnimationFrame(s.frame);s.renderTooltip();s.renderer.render(s.scene,s.camera)})
  assert.equal(await page.locator('.native-tooltip').isVisible(),true)
  assert.match(await page.locator('.native-tooltip').getAttribute('aria-label'),/Hut:.*Left-click.*Right-click/)
  await page.screenshot({path:'/private/tmp/populous-tooltip-font-v119.png'})
  await page.locator('.native-tooltip').screenshot({path:'/private/tmp/populous-tooltip-detail-v119.png'})
  await page.mouse.move(2,2)
  await page.evaluate(()=>{window.testScene.renderTooltip()})
  assert.equal(await page.locator('.native-tooltip').isVisible(),false)
  assert.deepEqual(errors,[])
  console.log(`PASS: ${checked} real tooltip canvases match original glyph pixel hashes, five desktop sizes, native mouse symbols, accessible labels, hut mesh hover and dismissal`)
}finally{await browser.close()}
