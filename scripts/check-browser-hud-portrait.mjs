import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
import units from '../app/original-units.json' with {type:'json'}
import fixture from '../tests/fixtures/hud-portrait.json' with {type:'json'}
const browser=await chromium.launch({headless:true})
try {
  const {page,errors}=await openGame(browser)
  const portrait=page.getByRole('button',{name:'Select and focus shaman',exact:true})
  await page.mouse.move(1000,700)
  await page.waitForFunction(()=>[...window.testScene.unitMeshes.values()].some(g=>g.userData.layers?.[0]?.material.map.image?.complete))
  const count=await page.evaluate(async({units,cases})=>{
    const s=window.testScene,u=s.world.units.find(u=>u.team==='blue'&&u.kind==='shaman')
    s.world.paused=true;cancelAnimationFrame(s.frame)
    window.portraitShaman=u
    window.portraitOriginal={heading:u.heading,native:u.native}
    const {createLivePerson}=await import('/app/live-people.ts')
    u.native=createLivePerson(s.world,u)
    for(const c of cases){
      u.native.object=units.animations[c.signature][c.action][0].source
      u.native.f2=c.step;u.native.state=0
      u.heading=Math.PI-s.cameraBearing+(c.direction*256+0x380)*Math.PI/1024
      s.animate(s.previous);cancelAnimationFrame(s.frame)
      const g=s.unitMeshes.get(u.id)
      if(g.userData.frame!==c.frame||g.userData.frameFlip!==c.flip)throw Error(`Live frame mismatch ${c.action}/${c.direction}`)
      const pixels=s.portrait.getContext('2d').getImageData(0,0,100,480).data
      const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',pixels))].map(b=>b.toString(16).padStart(2,'0')).join('')
      if(hash!==c.pixelsSha256)throw Error(`Native pixel mismatch ${c.action}/${c.direction}/${c.step}: ${hash}`)
    }
    Object.assign(u,window.portraitOriginal);s.animate(s.previous);cancelAnimationFrame(s.frame)
    return cases.length
  },{units,cases:fixture.cases.filter(c=>c.signature==='blue-shaman')})
  for(const size of [{width:1440,height:1000},{width:1280,height:720}]){
    await page.setViewportSize(size)
    const bounds=await portrait.evaluate(b=>{const r=b.getBoundingClientRect(),style=getComputedStyle(document.querySelector('main')),sx=parseFloat(style.getPropertyValue('--hud-scale-x')),sy=parseFloat(style.getPropertyValue('--hud-scale-y'));return [Math.round(r.x/sx),Math.round(r.y/sy),Math.round(r.width/sx),Math.round(r.height/sy)]})
    assert.deepEqual(bounds,[33,114,30,35])
    await portrait.hover()
    const hover=await page.evaluate(()=>{const s=window.testScene;s.animate(s.previous);cancelAnimationFrame(s.frame);return [...s.portrait.getContext('2d').getImageData(35,116,1,1).data]})
    assert.deepEqual(hover,[255,255,255,255])
    assert.ok((await portrait.evaluate(b=>getComputedStyle(b).backgroundImage)).endsWith('/hud-portrait-hover.png")'))
    await page.mouse.move(1000,600)
  }
  await portrait.click()
  assert.ok(await page.evaluate(()=>window.testScene.world.selected.includes(window.portraitShaman.id)))
  await page.mouse.move(1000,600)
  await page.evaluate(()=>{const s=window.testScene;s.world.selected=[];s.world.paused=false;s.world.speed=1;s.animate(performance.now());window.portraitFrame=s.unitMeshes.get(window.portraitShaman.id).userData.frame})
  await page.waitForFunction(()=>window.testScene.unitMeshes.get(window.portraitShaman.id).userData.frame!==window.portraitFrame)
  await page.keyboard.down('ArrowLeft');await page.waitForTimeout(600);await page.keyboard.up('ArrowLeft')
  await page.setViewportSize({width:1440,height:1000})
  await page.screenshot({path:'/private/tmp/populous-shaman-portrait-v117.png'})
  await portrait.screenshot({path:'/private/tmp/populous-shaman-portrait-detail-v117.png'})
  // Real death/removal clears the portrait; real reincarnation supplies a new frame.
  await page.evaluate(()=>{window.portraitShaman.hp=0;window.testScene.world.speed=1})
  await page.waitForFunction(()=>{const s=window.testScene;if(s.world.units.includes(window.portraitShaman))return false;s.world.speed=0;return true})
  await page.waitForFunction(()=>{
    const p=window.testScene.portrait.getContext('2d').getImageData(0,0,100,480).data
    let count=0;for(let i=3;i<p.length;i+=4)if(p[i])count++
    return count===750
  })
  await page.evaluate(()=>{window.testScene.world.speed=8})
  await page.waitForFunction(()=>{const s=window.testScene,u=s.world.units.find(u=>u.team==='blue'&&u.kind==='shaman');if(!u)return false;s.world.speed=0;return u.id!==window.portraitShaman.id})
  await page.waitForFunction(()=>{
    const p=window.testScene.portrait.getContext('2d').getImageData(0,0,100,480).data
    for(let i=0;i<p.length;i+=4)if(p[i+3]&&(p[i]!==11||p[i+1]!==15||p[i+2]!==11))return true
    return false
  })
  assert.deepEqual(errors,[])
  console.log(`PASS: ${count} live shaman poses match original portrait pixel hashes, both desktop layouts, hover/selection, live animation/camera input, death/absence/reincarnation`)
} finally {await browser.close()}
