import { showAllMissions } from './browser-game.mjs'
// Focused authored HUD validation. Execute only inside the canonical queue.
import assert from 'node:assert/strict'
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {resolve,join} from 'node:path'
import {chromium} from '@playwright/test'
import {bindGame} from './browser-game.mjs'
import native from '../app/original-hud.json' with {type:'json'}
import {SPELLS} from '../app/model.ts'

const option=name=>{const i=process.argv.indexOf(name);assert.ok(i>=0&&process.argv[i+1],`Required ${name}`);return resolve(process.argv[i+1])}
const output=option('--output-dir'),assetReport=JSON.parse(readFileSync(option('--asset-report'),'utf8'))
assert.equal(assetReport.status,'PASS_SIX_FRAME_ORIGINALS_AND_PRESERVATION')
assert.ok(process.env.PND_QUEUE_JOB_ID&&process.env.PND_QUEUE_DEADLINE,'Use the canonical queue')
const url=process.env.POPULOUS_URL;assert.equal(new URL(url).port,'4318')
mkdirSync(output,{recursive:false})
const report={startedAt:new Date().toISOString(),job:process.env.PND_QUEUE_JOB_ID,mission:16,states:[],errors:[],
  limits:['Six served asset frames are verified; rendered controls cover Shield states and fresh Bloodlust discovery, not earned Bloodlust casting.',
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
  await page.evaluate(()=>document.querySelector('.skip-introduction')?.click())
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
  // Verify the served image's six crops, separately from DOM placement/art state.
  report.servedFrames=await page.evaluate(async frames=>{
    const image=new Image();image.src='/original/hud.png';await image.decode()
    const result=[]
    for(const {id,rect}of frames){
      const canvas=document.createElement('canvas');canvas.width=rect.w;canvas.height=rect.h
      const c=canvas.getContext('2d');c.drawImage(image,rect.x,rect.y,rect.w,rect.h,0,0,rect.w,rect.h)
      const rgba=c.getImageData(0,0,rect.w,rect.h).data
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',rgba))).map(n=>n.toString(16).padStart(2,'0')).join('')
      result.push({id,rgbaSHA:digest,width:image.naturalWidth,height:image.naturalHeight})
    }
    return result
  },assetReport.newFrames)
  for(const actual of report.servedFrames){
    const original=assetReport.newFrames.find(f=>f.id===actual.id)
    assert.equal(actual.rgbaSHA,original.rgbaSHA,`Served original RGBA ${actual.id}`)
    assert.deepEqual([actual.width,actual.height],assetReport.newDimensions)
  }
  const blank=async()=>{await page.mouse.move(5,5);await page.evaluate(()=>document.activeElement?.blur())}
  async function capture(card,id,state,spell){
    const rect=native.rects[id],position=`${-rect.x}px ${-rect.y}px`
    await card.evaluate((button,position)=>{
      if(![...button.querySelectorAll('i.hud-sprite')].some(n=>n.style.backgroundPosition===position))
        throw Error('Expected original icon position absent: '+position)
    },position)
    const data=await card.evaluate((button,{position,id})=>{
      const sprite=[...button.querySelectorAll('i.hud-sprite')].find(n=>n.style.backgroundPosition===position)
      const css=getComputedStyle(sprite),r=sprite.getBoundingClientRect(),b=button.getBoundingClientRect()
      return{id,position:sprite.style.backgroundPosition,image:css.backgroundImage,text:sprite.textContent,
        logicalWidth:sprite.style.width,logicalHeight:sprite.style.height,box:{x:r.x,y:r.y,width:r.width,height:r.height},
        buttonBox:{x:b.x,y:b.y,width:b.width,height:b.height},border:button.style.borderImageSource,
        selected:button.getAttribute('aria-pressed'),buttonDisabled:button.disabled,label:button.getAttribute('aria-label')}
    },{position,id})
    assert.equal(data.text,'');assert.ok(data.image.includes('/original/hud.png'))
    assert.equal(data.logicalWidth,`${rect.w}px`);assert.equal(data.logicalHeight,`${rect.h}px`)
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
  report.status='PASS_SIX_ASSETS_SHIELD_CONTROLS_BLOODLUST_DISCOVERY'
}catch(error){report.status='FAILED_SIX_FRAME_HUD_ACCEPTANCE';report.error=error.stack??String(error);process.exitCode=1}
finally{clearTimeout(timer);await browser.close();report.browserClosed=true;report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({status:report.status,error:report.error,states:report.states.length,output,initial:report.initial,final:report.final,browserClosed:true},null,2))}
