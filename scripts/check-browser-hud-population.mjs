// Actual count controls and housing feedback; native raster fixtures are the oracle.
import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
import fixture from '../tests/fixtures/hud-population.json' with {type:'json'}
import hud from '../app/original-hud.json' with {type:'json'}
const browser=await chromium.launch({headless:true})
try{
  const {page,errors}=await openGame(browser)
  await page.evaluate(()=>{const s=window.testScene;s.world.speed=0;cancelAnimationFrame(s.frame);s.personAnimationFrame=0;s.animate(s.previous);cancelAnimationFrame(s.frame);window.populationOriginal=s.world.units;window.populationBuildings=s.world.buildings})
  const controls=page.locator('.tribe-classes button'),total=page.getByRole('button',{name:'Select all followers',exact:true})
  const cases=fixture.cases.filter(c=>[0,2,3].includes(c.model)&&[0,9,99,100,200].includes(c.count)&&!c.alternate&&(!c.selected||(c.model>0&&c.count>0)))
  assert.equal(cases.length,38)
  let hashes=0
  for(const c of cases){
    await page.mouse.move(1200,900)
    await page.evaluate(c=>{
      const s=window.testScene,original=window.populationOriginal,template=original.find(u=>u.team==='blue'&&u.kind==='brave')
      const kind=c.model===3?'warrior':'brave'
      s.world.units=[...original.filter(u=>u.team!=='blue'||u.kind==='shaman'),...Array.from({length:c.count},(_,i)=>({...template,id:20000+i,kind}))]
      s.world.selected=[];s.onChange()
    },c)
    const button=c.model===0?total:page.getByRole('button',{name:`Select all ${c.model===2?'braves':'warriors'}`,exact:true})
    await page.waitForFunction(({model,count})=>document.querySelectorAll('.tribe-classes .follower-number')[model===0?0:model-1].getAttribute('aria-label')===String(count),c)
    if(c.selected){await button.click();await page.mouse.move(1200,900);await page.waitForFunction(()=>[...document.querySelectorAll('.tribe-classes button')].some(b=>b.getAttribute('aria-pressed')==='true'))}
    if(c.hover)await button.hover()
    const png=await button.screenshot()
    const hash=await page.evaluate(async bytes=>{
      const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'})),canvas=document.createElement('canvas')
      canvas.width=15;canvas.height=36;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0,15,36);image.close()
      const digest=await crypto.subtle.digest('SHA-256',ctx.getImageData(0,0,15,36).data)
      return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')
    },[...png])
    assert.equal(hash,c.pixelSha256,JSON.stringify(c));hashes++
  }
  await page.evaluate(()=>{const s=window.testScene;s.world.units=window.populationOriginal;s.world.selected=[];s.onChange()})
  for(const size of [{width:1440,height:1000},{width:1280,height:720}]){
    await page.setViewportSize(size)
    const bounds=await controls.evaluateAll(buttons=>{const scale=parseFloat(getComputedStyle(document.querySelector('main')).getPropertyValue('--hud-scale'));return buttons.map(b=>{const r=b.getBoundingClientRect();return [r.x/scale,r.y/scale,r.width/scale,r.height/scale]})})
    assert.deepEqual(bounds,Array.from({length:6},(_,i)=>[i*16,153,15,36]))
  }
  await page.getByRole('button',{name:'Select all braves',exact:true}).click()
  assert.ok(await page.evaluate(()=>{const w=window.testScene.world;return w.selected.length>0&&w.selected.every(id=>w.units.some(u=>u.id===id&&u.kind==='brave'))}))
  await page.setViewportSize({width:1440,height:1000})
  await page.mouse.move(1200,800)
  // The presentation counter freezes with pause, just as the portrait does.
  const flashes=await page.evaluate(()=>{
    const s=window.testScene;s.world.paused=true;const values=[]
    for(const frame of [0,256,288,292,293,295,296,511,512]){s.personAnimationFrame=frame;s.animate(s.previous);cancelAnimationFrame(s.frame);values.push(s.container.parentElement.style.getPropertyValue('--population-full-color'))}
    s.world.paused=false;return values
  })
  assert.deepEqual(flashes,[0,256,288,292,293,295,296,511,512].map(frame=>hud.colors[fixture.meters.find(c=>c.capacity===1&&c.population===1&&c.frame===frame%512).color]))
  await page.evaluate(()=>{const s=window.testScene;window.populationVictim=s.world.units.find(u=>u.team==='blue'&&u.kind==='brave');window.populationBefore=s.world.units.filter(u=>u.team==='blue'&&u.kind!=='shaman'&&u.hp>0).length;window.populationVictim.hp=0;s.world.speed=1;s.animate(s.previous)})
  await page.waitForFunction(()=>!window.testScene.world.units.includes(window.populationVictim))
  await page.waitForFunction(()=>document.querySelector('.population-button .follower-number').getAttribute('aria-label')===String(window.populationBefore-1))
  await page.evaluate(()=>{window.testScene.world.speed=0})
  await page.screenshot({path:'/private/tmp/populous-population-hud-v121.png'})
  await page.locator('.tribe-classes').screenshot({path:'/private/tmp/populous-population-row-v121.png'})
  assert.deepEqual(errors,[])
  console.log(`PASS: ${hashes} original population/class pixel hashes, both desktop layouts, live brave selection, original capacity blink mask and actual follower removal/count update`)
}finally{await browser.close()}
