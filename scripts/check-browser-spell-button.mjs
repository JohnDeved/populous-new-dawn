// Compare live React spell art with native draw-call captures.
import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
import fixture from '../tests/fixtures/spell-button.json' with {type:'json'}
import hud from '../app/original-hud.json' with {type:'json'}
const browser=await chromium.launch({headless:true})
const names={2:['blast','Blast'],3:['lightning','Lightning'],12:['bridge','Land Bridge']}
const frames={821:'button',830:'button-selected',839:'button-hover',510:'button-gift',519:'button-gift-selected',528:'button-gift-hover'}
try {
  const {page,errors}=await openGame(browser)
  await page.evaluate(()=>{const s=window.testScene;s.world.speed=0;cancelAnimationFrame(s.frame)})
  assert.deepEqual(await page.locator('.spell-card').evaluateAll(bs=>bs.map(b=>b.title)),['Blast','Land Bridge','Lightning'])
  let checked=0
  for(let i=0;i<fixture.cases.length;i++) {
    const c=fixture.cases[i]
    if(!names[c.model] || c.permanent!==(c.model===2) || c.charging!==(c.model===2) || ![0,4].includes(c.stock) || c.gifts!==1)continue
    const [id,name]=names[c.model],expected=fixture.expected[i]
    await page.mouse.move(500,900)
    await page.evaluate(({c,id})=>{
      const s=window.testScene,w=s.world
      w.mode=c.selected?id:null;w.shots[id]=c.stock;w.giftCounts[id]=c.gifts
      w.charging=c.charging;w.mana=c.progress/1000;s.onChange()
    },{c,id})
    const button=page.getByRole('button',{name:`${name}, ${c.stock} shots`,exact:true})
    if(c.hovered)await button.hover()
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
    const actual=await button.evaluate(b=>{
      const box=b.getBoundingClientRect(),scale=box.width/31
      return {frame:getComputedStyle(b).borderImageSource,width:box.width/scale,height:box.height/scale,
        sprites:[...b.querySelectorAll('.spell-art .hud-sprite')].map(s=>{
          const r=s.getBoundingClientRect();return {position:getComputedStyle(s).backgroundPosition,x:(r.x-box.x)/scale,y:(r.y-box.y)/scale,w:r.width/scale,h:r.height/scale}
        }),
        fills:[...b.querySelectorAll('.native-charge>i')].map(f=>({width:parseFloat(f.style.width),color:f.style.backgroundColor})),
      }
    })
    assert.ok(actual.frame.endsWith(`/hud-${frames[expected[0][1]]}.png")`),actual.frame)
    assert.equal(actual.height,43)
    assert.deepEqual(actual.sprites,expected.filter(e=>e[0]==='sprite').map(([,id,x,y])=>{
      const r=hud.rects[id];return {position:`-${r.x}px -${r.y}px`.replaceAll('-0px','0px'),x,y,w:r.w,h:r.h}
    }))
    assert.deepEqual(actual.fills,expected.filter(e=>e[0]==='fill').map(([,palette,rect])=>({
      width:rect[2]-rect[0],color:`rgb(${hud.colors[palette].slice(1).match(/../g).map(s=>parseInt(s,16)).join(', ')})`,
    })))
    checked++
  }
  assert.equal(checked,24)
  await page.mouse.move(500,900)
  await page.evaluate(()=>{const s=window.testScene;s.world.mode=null;s.world.charging=true;s.world.mana=3.333;s.onChange()})
  await page.screenshot({path:'/private/tmp/populous-spell-panel-v114.png'})
  const blast=page.getByRole('button',{name:/^Blast, \d+ shots$/})
  await blast.click({button:'right'});assert.equal(await page.evaluate(()=>window.testScene.world.charging),false)
  await page.mouse.move(500,900);assert.equal(await blast.locator('.native-charge').count(),0)
  await blast.click({button:'right'});await page.mouse.move(500,900)
  await page.waitForFunction(()=>!!document.querySelector('.native-charge'))
  assert.deepEqual(errors,[])
  console.log(`PASS: ${checked} native/browser spell-art states, mana-cost ordering, exact logical sprite bounds, reward/hover/selected frames, layered fills and real charging controls; no browser errors`)
} finally {await browser.close()}
