// Compare live React spell art with native draw-call captures.
import {collapseCampaignMessages} from './browser-game.mjs'
import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame,chooseSpell} from './browser-game.mjs'
import fixture from '../tests/fixtures/spell-button.json' with {type:'json'}
import hud from '../app/original-hud.json' with {type:'json'}
const browser=await chromium.launch({headless:true})
const names={2:['blast','Blast'],3:['lightning','Lightning'],12:['bridge','Land Bridge']}
const frames={821:'button',830:'button-selected',839:'button-hover',510:'button-gift',519:'button-gift-selected',528:'button-gift-hover'}
try {
  const {page,errors}=await openGame(browser)
  await page.evaluate(()=>{const s=window.testScene;s.world.speed=0;cancelAnimationFrame(s.frame)})
  // The opening campaign message owns gameplay keys; collapse it publicly first.
  await collapseCampaignMessages(page)
  // Fresh Mission 1 (0049e800/004c3110/004c31e0): permanent chargeable Blast plus two
  // current-level reward sources shown as undiscovered placeholders.
  const roster=()=>page.locator('.spell-card').evaluateAll(bs=>bs.map(b=>[b.title,b.getAttribute('aria-label'),b.getAttribute('aria-disabled')]))
  const charge='Blast · Right-click to pause or resume charging · Ctrl: charge only this · Shift: all'
  assert.deepEqual((await roster()).map(([title,,disabled])=>[title,disabled]),[[charge,'false'],['Undiscovered spell','true'],['Undiscovered spell','true']])
  // Stock wins over the placeholder and exposes 004c2fe0 mana-cost ordering.
  await page.evaluate(()=>{const s=window.testScene;s.world.shots.bridge=1;s.world.shots.lightning=1;s.onChange()})
  await page.waitForFunction(()=>document.querySelectorAll('.spell-card[aria-disabled="false"]').length===3)
  const stocked=await roster()
  assert.deepEqual(stocked.map(([title])=>title),[charge,'Land Bridge','Lightning'])
  assert.match(stocked[0][1],/^Blast, \d+ shots$/);assert.deepEqual(stocked.slice(1).map(([,label])=>label),['Land Bridge, 1 shots','Lightning, 1 shots'])
  await page.evaluate(()=>{const s=window.testScene;s.world.shots.bridge=0;s.world.shots.lightning=0;s.onChange()})
  await page.waitForFunction(()=>document.querySelectorAll('.spell-card[aria-label="Undiscovered spell"]').length===2)
  await page.keyboard.press('4')
  assert.equal(await page.evaluate(()=>window.testScene.world.mode),null,'number 4 recalls follower group 4, never a spell')
  assert.equal(await chooseSpell(page,'Flatten'),false,'an absent mission spell has no card')
  await page.evaluate(()=>{const s=window.testScene;s.world.shots.flatten=1;s.onChange()})
  assert.equal(await chooseSpell(page,'Flatten'),true)
  assert.equal(await page.evaluate(()=>window.testScene.world.mode),'flatten','stocked spell remains reachable for integration')
  await page.evaluate(()=>{const s=window.testScene;s.world.mode=null;s.world.shots.flatten=0;s.onChange()})
  let checked=0,placeholders=0
  const question=hud.rects['1056']
  for(let i=0;i<fixture.cases.length;i++) {
    const c=fixture.cases[i]
    if(!names[c.model] || c.permanent!==(c.model===2) || c.charging!==(c.model===2) || ![0,4].includes(c.stock) || c.gifts!==1)continue
    const [id,name]=names[c.model],expected=fixture.expected[i]
    await page.mouse.move(500,900)
    await page.evaluate(({c,id})=>{
      const s=window.testScene,w=s.world
      w.mode=c.selected?id:null;w.shots[id]=c.stock;w.giftCounts[id]=c.gifts
      // The HUD reads native per-model charge progress (manaTribes[player].spellProgress).
      w.charging=c.charging;w.manaTribes[w.manaWorld.playerTribe].spellProgress[c.model]=c.progress;s.onChange()
    },{c,id})
    // A zero-stock reward spell is never a populated control in 0049e800: it draws the
    // HFX1056 placeholder (decomp/research/spell-hud-visibility.md), so those native
    // renderer captures are unreachable live. Check the placeholder at the ordered slot.
    const placeholder=c.stock===0&&!c.permanent
    const button=placeholder?page.locator('.spell-card').nth(c.model===12?1:2):page.getByRole('button',{name:`${name}, ${c.stock} shots`,exact:true})
    if(c.hovered)await button.hover()
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
    const actual=await button.evaluate(b=>{
      const box=b.getBoundingClientRect(),style=getComputedStyle(document.querySelector('main')),
        sx=parseFloat(style.getPropertyValue('--hud-scale')),sy=parseFloat(style.getPropertyValue('--hud-scale'))
      return {frame:getComputedStyle(b).borderImageSource,width:Math.round(box.width/sx),height:Math.round(box.height/sy),
        sprites:[...b.querySelectorAll('.spell-art .hud-sprite')].map(s=>{
          const r=s.getBoundingClientRect();return {position:getComputedStyle(s).backgroundPosition,x:Math.round((r.x-box.x)/sx),y:Math.round((r.y-box.y)/sy),w:Math.round(r.width/sx),h:Math.round(r.height/sy)}
        }),
        fills:[...b.querySelectorAll('.native-charge>i')].map(f=>({width:parseFloat(f.style.width),color:f.style.backgroundColor})),
        label:b.getAttribute('aria-label'),disabled:b.getAttribute('aria-disabled'),pressed:b.getAttribute('aria-pressed'),
      }
    })
    if(placeholder) {
      assert.deepEqual(actual,{frame:actual.frame,width:31,height:43,
        sprites:[{position:`-${question.x}px -${question.y}px`.replaceAll('-0px','0px'),x:15-Math.trunc(question.w/2),y:21-Math.trunc(question.h/2),w:question.w,h:question.h}],
        fills:[],label:'Undiscovered spell',disabled:'true',pressed:'false'},JSON.stringify({c,actual}))
      assert.ok(actual.frame.endsWith('/hud-button.png")'),actual.frame)
      await page.evaluate(()=>{const s=window.testScene;s.world.mode=null;s.onChange()})
      await button.click({force:true}) // Real pointer click; Playwright refuses aria-disabled targets otherwise.
      assert.equal(await page.evaluate(()=>window.testScene.world.mode),null,'an undiscovered placeholder is not selectable')
      placeholders++
      continue
    }
    assert.equal(actual.label,`${name}, ${c.stock} shots`)
    assert.ok(actual.frame.endsWith(`/hud-${frames[expected[0][1]]}.png")`),actual.frame)
    assert.equal(actual.width,31)
    assert.equal(actual.height,43)
    assert.deepEqual(actual.sprites,expected.filter(e=>e[0]==='sprite').map(([,id,x,y])=>{
      const r=hud.rects[id];return {position:`-${r.x}px -${r.y}px`.replaceAll('-0px','0px'),x,y,w:r.w,h:r.h}
    }))
    assert.deepEqual(actual.fills,expected.filter(e=>e[0]==='fill').map(([,palette,rect])=>({
      width:rect[2]-rect[0],color:`rgb(${hud.colors[palette].slice(1).match(/../g).map(s=>parseInt(s,16)).join(', ')})`,
    })))
    checked++
  }
  assert.equal(checked,16);assert.equal(placeholders,8)
  await page.mouse.move(500,900)
  await page.evaluate(()=>{const s=window.testScene;s.world.mode=null;s.world.charging=true;s.world.mana=3.333;s.onChange()})
  await page.screenshot({path:'/private/tmp/populous-spell-panel-v114.png'})
  const blast=page.getByRole('button',{name:/^Blast, \d+ shots$/})
  await blast.click({button:'right'});assert.equal(await page.evaluate(()=>window.testScene.world.charging),false)
  await page.mouse.move(500,900);assert.equal(await blast.locator('.native-charge').count(),0)
  await blast.click({button:'right'});await page.mouse.move(500,900)
  await page.waitForFunction(()=>!!document.querySelector('.native-charge'))
  assert.deepEqual(errors,[])
  console.log(`PASS: ${checked} native/browser spell-art states, ${placeholders} native-precedence undiscovered placeholders, fresh Mission 1 roster, mana-cost ordering, exact logical sprite bounds, reward/hover/selected frames, layered fills and real charging controls; no browser errors`)
} finally {await browser.close()}
