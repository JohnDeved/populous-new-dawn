// Actual production-meter pixels and live charging controls.
import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
import hud from '../app/original-hud.json' with {type:'json'}
import fixture from '../tests/fixtures/hud-mana.json' with {type:'json'}
const browser=await chromium.launch({headless:true})
try{
  const {page,errors}=await openGame(browser)
  await page.evaluate(()=>{window.testScene.world.speed=0})
  const meter=page.getByRole('meter',{name:'Mana production',exact:true})
  const cases=fixture.cases.filter(c=>c.tribe.estimatedRate===100&&[0,1,89,178,179].includes(c.tribe.previousRate)&&!c.override)
  assert.equal(cases.length,15)
  let hashes=0,states=0
  for(const size of [{width:1440,height:1000},{width:1280,height:720}]){
    await page.setViewportSize(size)
    for(const c of cases){
      await page.evaluate(c=>{const s=window.testScene;Object.assign(s.world.manaTribes[0],c.tribe);Object.assign(s.world.manaWorld,c.world);s.onChange()},c)
      const expected=c.colors.map(n=>{const h=hud.colors[n];return `rgb(${[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).join(', ')})`})
      await page.waitForFunction(colors=>JSON.stringify([...document.querySelectorAll('.mana-meter i')].map(i=>i.style.backgroundColor))===JSON.stringify(colors),expected)
      const state=await meter.evaluate(m=>{
        const r=m.getBoundingClientRect(),scale=parseFloat(getComputedStyle(document.querySelector('main')).getPropertyValue('--hud-scale'))
        return {bounds:[r.x/scale,r.y/scale,r.width/scale,r.height/scale],stripes:[...m.querySelectorAll('i')].map(i=>{const b=i.getBoundingClientRect();return [(b.x-r.x)/scale,(b.y-r.y)/scale,b.width/scale,b.height/scale]})}
      })
      assert.deepEqual(state.bounds,[4,190,92,13])
      assert.deepEqual(state.stripes,c.colors.map((_,i)=>[2+i*2,2,1,10]))
      if(size.height===1000){
        const png=await meter.screenshot()
        const hash=await page.evaluate(async bytes=>{
          const image=await createImageBitmap(new Blob([new Uint8Array(bytes)],{type:'image/png'}))
          const canvas=document.createElement('canvas');canvas.width=92;canvas.height=13
          const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0,92,13);image.close()
          const digest=await crypto.subtle.digest('SHA-256',ctx.getImageData(0,0,92,13).data)
          return [...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join('')
        },[...png])
        assert.equal(hash,c.pixelSha256,JSON.stringify(c));hashes++
      }
      states++
    }
  }
  await page.setViewportSize({width:1440,height:1000})
  console.log(`PASS: ${states} desktop states and ${hashes} native pixel hashes`)
  await page.waitForFunction(()=>{const s=window.testScene;return s.renderer.domElement.clientWidth===s.container.clientWidth&&s.renderer.domElement.clientHeight===1000})
  if(await page.getByRole('button',{name:'Resume game',exact:true}).count())await page.getByRole('button',{name:'Resume game',exact:true}).click()
  const cast=await page.evaluate(()=>{
    const s=window.testScene,w=s.world,u=w.units.find(u=>u.kind==='shaman'&&u.team==='blue')
    w.manaWorld.gameFlags=0;w.manaWorld.manaFlags=0;w.speed=1;w.selected=[u.id];s.focus(u);s.onChange()
    const p=s.screen({x:u.x+2,z:u.z+2}),r=s.renderer.domElement.getBoundingClientRect()
    return {x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}
  })
  await page.keyboard.press('1');await page.mouse.click(cast.x,cast.y)
  await page.waitForFunction(()=>{const w=window.testScene.world;return w.shots.blast<4&&w.manaTribes[0].estimatedRate>0&&w.manaTribes[0].previousRate>0}).catch(async error=>{console.log(await page.evaluate(()=>{const w=window.testScene.world;return {turn:w.turn,paused:w.paused,speed:w.speed,mode:w.mode,shots:w.shots.blast,mana:w.manaTribes[0],clock:w.manaWorld.turnsPerSecond,mask:w.inputMask}}));throw error})
  await page.getByRole('button',{name:/^Blast, \d+ shots$/}).click({button:'right'})
  await page.waitForFunction(()=>[...document.querySelectorAll('.mana-meter i')].length===44&&window.testScene.world.manaWorld.manaFlags&1)
  await page.waitForFunction(()=>[...document.querySelectorAll('.mana-meter i')].every(i=>i.style.backgroundColor==='rgb(255, 37, 0)'))
  await page.getByRole('button',{name:/^Blast, \d+ shots$/}).click({button:'right'})
  await page.waitForFunction(()=>!(window.testScene.world.manaWorld.manaFlags&1))
  await page.screenshot({path:'/private/tmp/populous-mana-hud-v120.png'})
  await meter.screenshot({path:'/private/tmp/populous-mana-meter-v120.png'})
  assert.deepEqual(errors,[])
  console.log(`PASS: ${states} real mana displays at two desktop sizes, ${hashes} native pixel hashes; actual Blast cast and charge-off/on production feedback`)
}finally{await browser.close()}
