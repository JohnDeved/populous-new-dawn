import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
import fixture from '../tests/fixtures/hud-health.json' with {type:'json'}
const browser=await chromium.launch({headless:true})
try {
  const {page,errors}=await openGame(browser)
  await page.evaluate(()=>{const s=window.testScene;s.world.speed=0;window.healthShaman=s.world.units.find(u=>u.kind==='shaman'&&u.team==='blue')})
  const meter=page.getByRole('meter',{name:'Shaman health',exact:true})
  const measurements=()=>meter.evaluate(m=>{
    const r=m.getBoundingClientRect(),style=getComputedStyle(document.querySelector('main')),sx=parseFloat(style.getPropertyValue('--hud-scale')),sy=parseFloat(style.getPropertyValue('--hud-scale'))
    const bg=m.querySelector('span'),fill=m.querySelector('i'),b=bg.getBoundingClientRect(),f=fill.getBoundingClientRect()
    return {x:Math.round(r.x/sx),y:Math.round(r.y/sy),w:Math.round(r.width/sx),h:Math.round(r.height/sy),background:getComputedStyle(bg).backgroundColor,color:getComputedStyle(fill).backgroundColor,
      top:Math.round((f.y-r.y)/sy),width:Math.round(f.width/sx),height:Math.round(f.height/sy),inner:[Math.round((b.x-r.x)/sx),Math.round((b.y-r.y)/sy),Math.round(b.width/sx),Math.round(b.height/sy)],frame:getComputedStyle(m).backgroundImage}
  })
  let count=0
  for(const size of [{width:1440,height:1000},{width:1280,height:720}]) {
    await page.setViewportSize(size)
    for(const health of [0,1,110,111,112,999,1000,1111,1112,1999,2000,2001]) {
      const index=fixture.cases.findIndex(([max,h])=>max===2000&&h===health),height=fixture.pixels[index]
      assert.notEqual(index,-1)
      await page.evaluate(health=>{window.healthShaman.hp=health/20;window.testScene.onChange()},health)
      await page.waitForFunction(height=>parseFloat(document.querySelector('.health-bar i').style.height)===height,height)
      const r=await measurements()
      assert.deepEqual([r.x,r.y,r.w,r.h],[64,126,10,22]);assert.deepEqual(r.inner,[2,2,6,18])
      assert.equal(r.height,height);assert.equal(r.width,6);assert.equal(r.top,20-height)
      assert.equal(r.background,'rgb(11, 15, 11)');assert.equal(r.color,'rgb(255, 255, 255)')
      assert.ok(r.frame.endsWith('/hud-health.png")'))
      assert.equal(Number(await meter.getAttribute('aria-valuenow')),Math.min(100,health/20))
      count++
    }
  }
  await page.setViewportSize({width:1440,height:1000})
  await page.evaluate(()=>{window.healthShaman.hp=50;window.testScene.onChange()})
  await page.waitForFunction(()=>document.querySelector('.health-bar i').style.height==='9px')
  await meter.screenshot({path:'/private/tmp/populous-health-meter-v115.png'})
  await page.screenshot({path:'/private/tmp/populous-health-hud-v115.png'})
  // Exercise the live removal/reincarnation path, without replacing the unit list.
  await page.evaluate(()=>{window.healthShaman.hp=0;window.testScene.world.speed=1})
  await page.waitForFunction(()=>{
    const s=window.testScene
    if(s.world.units.includes(window.healthShaman))return false
    s.world.speed=0;s.onChange();return true
  })
  assert.ok(await page.evaluate(()=>window.testScene.world.respawn>0))
  await page.waitForFunction(()=>document.querySelector('.health-bar i').style.height==='0px')
  assert.equal(Number(await meter.getAttribute('aria-valuenow')),0)
  await page.evaluate(()=>{window.testScene.world.speed=8})
  await page.waitForFunction(()=>{
    const s=window.testScene,u=s.world.units.find(u=>u.kind==='shaman'&&u.team==='blue')
    if(!u)return false
    s.world.speed=0;s.onChange();return u.id!==window.healthShaman.id
  })
  await page.waitForFunction(()=>document.querySelector('.health-bar i').style.height==='18px')
  assert.equal(Number(await meter.getAttribute('aria-valuenow')),100)
  assert.deepEqual(errors,[])
  console.log(`PASS: ${count} native/browser health states at two desktop sizes, exact logical bounds/colors, accessible readings, live shaman death/absence/reincarnation; no browser errors`)
} finally {await browser.close()}
