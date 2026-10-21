import { skipIntroductionWithSpace } from './browser-introduction.mjs'
import { showAllMissions } from './browser-game.mjs'
// Focused authored HUD validation. Execute only inside the canonical queue.
import assert from 'node:assert/strict'
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {resolve,join} from 'node:path'
import {chromium} from '@playwright/test'
import {bindGame} from './browser-game.mjs'
import native from '../app/original-hud.json' with {type:'json'}
import {SPELLS} from '../app/model.ts'
import {sha256, reviewedSpellHudFrames, checkServedSpellHud, readSpellHudSprite} from './spell-hud-checker-contract.mjs'

const option=name=>{const i=process.argv.indexOf(name);assert.ok(i>=0&&process.argv[i+1],`Required ${name}`);return resolve(process.argv[i+1])}
const output=option('--output-dir'),assetReportBytes=readFileSync(option('--asset-report')),assetReport=JSON.parse(assetReportBytes)
const frames=reviewedSpellHudFrames(assetReport,native)
const currentAtlas={width:native.width,height:native.height,
  pngSHA:sha256(readFileSync(new URL('../public/original/hud.png',import.meta.url))),
  metadataSHA:sha256(readFileSync(new URL('../app/original-hud.json',import.meta.url)))}
assert.ok(process.env.PND_QUEUE_JOB_ID&&process.env.PND_QUEUE_DEADLINE,'Use the canonical queue')
const url=process.env.POPULOUS_URL;assert.equal(new URL(url).port,'4318')
mkdirSync(output,{recursive:false})
const report={startedAt:new Date().toISOString(),job:process.env.PND_QUEUE_JOB_ID,mission:16,states:[],errors:[],
  assets:{historicalAppend:{reportSHA:sha256(assetReportBytes),status:assetReport.status,base:assetReport.base,outputs:assetReport.outputs,
    oldDimensions:assetReport.oldDimensions,newDimensions:assetReport.newDimensions},currentAtlas},
  limits:['Seven served asset crops and the current PNG identity are verified; rendered controls cover Shield states and fresh Bloodlust discovery, not earned Bloodlust casting.',
    'Historical append output hashes are provenance, not a reproduction or whole-atlas preservation proof for later appends.',
    'Simulation is frozen after entering the real mission; no availability, stock, gifts or unlock flags are injected.',
    'Shield inactive artwork uses real pause-charging; mode-2 Bloodlust is an undiscovered reward and cannot charge in normal campaign.',
    'No gameplay/renderer/native-cadence or hardware FPS acceptance is implied.']}
const save=()=>writeFileSync(join(output,'evidence.json'),JSON.stringify(report,null,2)+'\n')
const browser=await chromium.launch({headless:true})
const timer=setTimeout(()=>{report.expired=true;void browser.close()},Math.max(1,Math.min(180000,Date.parse(process.env.PND_QUEUE_DEADLINE)-Date.now()-30000)))
process.on('SIGTERM',()=>void browser.close())
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1})
  const page=await context.newPage();page.setDefaultTimeout(20000)
  page.on('pageerror',error=>report.errors.push(error.stack??error.message))
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000})
  await showAllMissions(page)
  await page.getByRole('button',{name:'Mission 16',exact:true}).press('Enter')
  await bindGame(page)
  await skipIntroductionWithSpace(page, { timeout: 20000 })
  await bindGame(page)
  await page.waitForFunction(()=>window.testScene.world.outcome.level===16&&!window.testScene.world.inputMask)
  report.initial=await page.evaluate(()=>{
    const s=window.testScene,w=s.world
    // Freeze only time/render scheduling. The mission/availability/stock state is
    // whatever the normal authored load produced; controls below use real input.
    w.paused=true;w.speed=0;cancelAnimationFrame(s.frame)
    const gl=s.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info')
    return{level:w.outcome.level,available:w.manaWorld.spells[0].available,disabled:w.manaWorld.spells[0].disabled,
      shield:w.shots.shield,bloodlust:w.shots.bloodlust,gifts:{shield:w.giftCounts.shield,bloodlust:w.giftCounts.bloodlust},
      random:w.randomState,cosmetic:w.cosmeticRandom,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
      viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,turn:w.turn}
  })
  assert.ok(report.initial.available&(1<<19),'Shield remains permanently available')
  assert.equal(report.initial.available&(1<<20),0,'Normal startup clears mode-2 Bloodlust availability')
  assert.equal(report.initial.shield,0);assert.equal(report.initial.bloodlust,0)
  // Historical append crops remain the references; the served atlas may have
  // later appends. Bind all crops to the same bytes as the current checked-out PNG.
  report.servedAtlas=await page.evaluate(async frames=>{
    const response=await fetch('/original/hud.png');if(!response.ok)throw Error('HUD fetch failed: '+response.status)
    const bytes=await response.arrayBuffer(),digest=async data=>
      Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data))).map(n=>n.toString(16).padStart(2,'0')).join('')
    const image=new Image(),objectURL=URL.createObjectURL(new Blob([bytes],{type:'image/png'}))
    try{
      image.src=objectURL;await image.decode()
      const result=[]
      for(const {id,rect}of frames){
        const canvas=document.createElement('canvas');canvas.width=rect.w;canvas.height=rect.h
        const c=canvas.getContext('2d');c.drawImage(image,rect.x,rect.y,rect.w,rect.h,0,0,rect.w,rect.h)
        result.push({id,rgbaSHA:await digest(c.getImageData(0,0,rect.w,rect.h).data)})
      }
      return{pngSHA:await digest(bytes),width:image.naturalWidth,height:image.naturalHeight,frames:result}
    }finally{URL.revokeObjectURL(objectURL)}
  },frames)
  checkServedSpellHud(report.servedAtlas,currentAtlas,frames)
  const blank=async()=>{await page.mouse.move(5,5);await page.evaluate(()=>document.activeElement?.blur())}
  async function capture(card,id,state,spell){
    const rect=native.rects[id]
    const data=await card.evaluate(readSpellHudSprite,{id,rect})
    assert.equal(data.text,'');assert.ok(data.image.includes('/original/hud.png'))
    assert.equal(data.logicalWidth,rect.w);assert.equal(data.logicalHeight,rect.h)
    assert.ok(data.box.width>0&&data.box.height>0)
    assert.equal(data.buttonDisabled,false)
    if(state==='selected')assert.equal(data.selected,'true')
    report.states.push({spell,state,...data})
    await card.screenshot({path:join(output,`${spell}-${state}.png`)})
    await page.screenshot({path:join(output,`${spell}-${state}-full.png`)})
    save()
  }
  for(const [spell,model,frames]of [['shield',19,[408,409,410]]]){
    const name=SPELLS.find(s=>s.id===spell).name
    const card=page.getByRole('button',{name:new RegExp('^'+name+', \\d+ shots$')})
    await card.waitFor({state:'visible'});await card.scrollIntoViewIfNeeded()
    await blank();await capture(card,frames[0],'ready',spell)
    await card.hover();await capture(card,frames[2],'hover',spell)
    await card.click();await blank();await capture(card,frames[0],'selected',spell)
    assert.equal(await page.evaluate(()=>window.testScene.world.mode),spell)
    await card.click();await blank()
    // Shield is an authored permanent slot. Right-click toggles only its existing
    // charge-pause flag; no test-side world flag mutation or artificial stock.
    await card.click({button:'right'});await blank()
    assert.ok(await page.evaluate(model=>!!(window.testScene.world.manaWorld.spells[0].disabled&(1<<(model-1))),model))
    await capture(card,frames[1],'inactive',spell)
    await card.hover();await capture(card,frames[2],'inactive-hover',spell)
    await card.click({button:'right'});await blank();await capture(card,frames[0],'resumed',spell)
  }
  const bloodlustSlot=await page.evaluate(async()=>{
    const {spellHudRoster}=await import('/app/spell-visibility.ts'),
      {spellOrder}=await import('/app/spell-button.ts')
    return spellHudRoster(window.testScene.world)
      .toSorted((a,b)=>spellOrder.indexOf(a.spell.model)-spellOrder.indexOf(b.spell.model))
      .findIndex(entry=>entry.spell.id==='bloodlust'&&entry.visibility==='undiscovered')
  })
  assert.ok(bloodlustSlot>=0,'Authored Bloodlust head must produce a discovery control')
  assert.equal(await page.getByRole('button',{name:/^Bloodlust,/}).count(),0)
  const question=page.locator('.spell-list .spell-card').nth(bloodlustSlot)
  assert.equal(await question.getAttribute('aria-label'),'Undiscovered spell')
  assert.equal(await question.getAttribute('aria-disabled'),'true')
  assert.equal(await question.evaluate(button=>button.disabled),false)
  // Exercise trusted pointer events despite Playwright's aria-disabled actionability guard.
  await question.click({force:true});await question.click({button:'right',force:true});await blank()
  await capture(question,1056,'undiscovered','bloodlust')
  report.final=await page.evaluate(()=>{
    const w=window.testScene.world
    return{available:w.manaWorld.spells[0].available,disabled:w.manaWorld.spells[0].disabled,
      shield:w.shots.shield,bloodlust:w.shots.bloodlust,gifts:{shield:w.giftCounts.shield,bloodlust:w.giftCounts.bloodlust},
      random:w.randomState,cosmetic:w.cosmeticRandom,mode:w.mode,turn:w.turn}
  })
  for(const key of ['available','disabled','shield','bloodlust','gifts','random','cosmetic','turn'])
    assert.deepEqual(report.final[key],report.initial[key],`Preserved ${key}`)
  assert.equal(report.final.mode,null)
  assert.deepEqual(new Set(report.states.map(s=>s.id)),new Set([408,409,410,1056]))
  assert.deepEqual(report.errors,[]);assert.equal(report.expired,undefined)
  report.status='PASS_SEVEN_ASSETS_SHIELD_CONTROLS_BLOODLUST_DISCOVERY'
}catch(error){report.status='FAILED_SPELL_HUD_ACCEPTANCE';report.error=error.stack??String(error);process.exitCode=1}
finally{clearTimeout(timer);await browser.close();report.browserClosed=true;report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({status:report.status,error:report.error,states:report.states.length,output,initial:report.initial,final:report.final,browserClosed:true},null,2))}
