import { skipIntroductionWithSpace } from '../browser-introduction.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { bindGame } from '../browser-game.mjs'
import { openCampaignFromMainMenu } from '../browser-new-game.mjs'

export default async function ({ page, context, output, url }) {
  const paths = ['/original/pause-font.png', ...[0, 1, 2].map(n => `/original/options/ingame-${n}.png`), '/original/world-selector/text/tooltip-font-c.png']
  const mode = process.env.POPULOUS_INGAME_MODE ?? 'healthy'
  assert.ok(['healthy', 'font-failure', 'slider-failure', 'late-font', 'late-sliders'].includes(mode))
  const failed = mode === 'font-failure' ? paths[0] : mode === 'slider-failure' ? paths[2] : null
  const held = mode === 'healthy' ? paths : mode === 'late-font' ? [paths[0]] : mode === 'late-sliders' ? paths.slice(1, 4) : []
  const report = { status: 'running', mode, phases: [], requests: [], releases: [], frozen: [], errors: [], warnings: [],
    limits: ['Actual Home/GameScene via plain React/Vite, not hosted serving/hydration.',
      'Only pause font, ingame sliders and the shared tooltip atlas have held real responses. No state/readiness/clock injection.',
      'Routing disables HTTP cache; warm reopen is same-document reuse. Native decode promises are forwarded.',
      'DOM changes do not alone establish painted frames; separate animation-frame samples are retained.',
      'No original executable, hardware performance, unrelated asset, or CI work.'] }
  const save = () => writeFileSync(resolve(output, 'prepared.json'), JSON.stringify(report, null, 2) + '\n')
  const start = performance.now(), now = () => Math.round(performance.now() - start)
  const gates = new Map(held.map(path => { let release;const promise = new Promise(resolve => { release = resolve });return [path, { promise, release }] }))
  const release = paths => { for (const path of paths) { gates.get(path)?.release();report.releases.push({path,at:now()}) } }
  const route = async route => {
    const path = new URL(route.request().url()).pathname
    if (path === failed) return route.fulfill({ status: 404, body: 'Controlled missing menu asset' })
    if (gates.has(path)) await gates.get(path).promise
    await route.continue().catch(error => report.errors.push({kind:'route',path,message:error.message}))
  }
  await context.route('**/original/**', route)
  for (const event of ['request','requestfinished','requestfailed']) page.on(event, request => {
    const path = new URL(request.url()).pathname
    if (paths.includes(path)) report.requests.push({event,path,at:now(),failure:request.failure()?.errorText ?? null})
  })
  page.on('pageerror', error => report.errors.push({kind:'page',message:String(error)}))
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push({kind:'console',message:message.text(),location:message.location()})
    if (message.type() === 'warning') report.warnings.push(message.text())
  })
  await context.addInitScript(() => {
    const data = window.ingamePrepared = {phase:'boot',samples:[],frames:[],decodes:[],loading:[]}
    const decode = HTMLImageElement.prototype.decode
    HTMLImageElement.prototype.decode = function (...args) {
      const row = {src:this.src,start:performance.now()};data.decodes.push(row)
      return Reflect.apply(decode,this,args).then(value => {row.end=performance.now();row.status='resolved';return value},error=>{row.end=performance.now();row.status='rejected';throw error})
    }
    const rect = node => {
      if (!node) return null
      const r = node.getBoundingClientRect()
      return Object.fromEntries(['x','y','width','height'].map(k=>[k,Math.round(r[k]*100)/100]))
    }
    window.ingameSnapshot = () => {
      const main=document.querySelector('main'),pause=document.querySelector('[data-original-pause-menu]'),options=pause?.querySelector('[data-original-options]')
      let scene=window.ingameObservedScene,store=window.ingameObservedStore
      if (!scene && main) {
        const scenes=[],stores=[]
        let fiber=main[Object.keys(main).find(key=>key.startsWith('__reactFiber'))]
        for (;fiber;fiber=fiber.return) for(let hook=fiber.memoizedState;hook;hook=hook.next) {
          if(hook.memoizedState?.current?.unitMeshes)scenes.push(hook.memoizedState.current)
          if(hook.memoizedState?.getWorld)stores.push(hook.memoizedState)
        }
        for(const candidate of stores){const owned=scenes.find(s=>s.world===candidate.getWorld());if(owned){scene=window.ingameObservedScene=owned;store=window.ingameObservedStore=candidate;break}}
      }
      if (!store && main) {
        let fiber=main[Object.keys(main).find(key=>key.startsWith('__reactFiber'))]
        for (;fiber;fiber=fiber.return) for(let hook=fiber.memoizedState;hook;hook=hook.next) {
          if(hook.memoizedState?.getWorld) store=window.ingameObservedStore=hook.memoizedState
        }
      }
      const world=store?.getWorld(),active=document.activeElement
      return {phase:data.phase,loading:document.querySelector('.loading-world')?.dataset.loadingPhase??null,pauseOpen:!!pause?.open,optionsOpen:!!options,
        category:options?.dataset.category??null,sliders:options?.dataset.artReady??null,
        fallback:(options??pause)?.querySelectorAll('[class*="fallback"]').length??0,
        focus:{tag:active?.tagName,label:active?.getAttribute('aria-label')??active?.textContent?.trim().slice(0,60)},
        controls:[...(options??pause??document.createElement('div')).querySelectorAll('button')].filter(b=>['Continue Game','Options','Back','Game','Sound'].includes(b.getAttribute('aria-label'))).map(b=>({label:b.getAttribute('aria-label'),box:rect(b),textBox:rect(b.querySelector('span')),glyphs:b.querySelectorAll('i').length})),
        scene:scene?{started:scene.started,disposed:scene.disposed,ownsWorld:scene.world===world,modalSuspended:scene.modalSuspended,
          previous:scene.previous,frame:scene.frame,turn:world.turn,time:world.time,paused:world.paused,inputMask:world.inputMask,
          animationFrame:scene.gameClock.animationFrame,animationTime:scene.gameClock.animationTime,
          camera:scene.camera.position.toArray(),keys:[...scene.keys]}:null}
    }
    const record=source=>{
      const snapshot=window.ingameSnapshot()
      // Timestamp sampling advances while modal simulation is suspended; omit it from visual deduplication.
      const visual={...snapshot,scene:snapshot.scene?{...snapshot.scene,previous:undefined,frame:undefined}:null},signature=JSON.stringify(visual)
      const array=source==='frame'?data.frames:data.samples,key=source==='frame'?'lastFrame':'lastMutation'
      if(signature!==data[key]&&array.length<2000){array.push({at:performance.now(),...snapshot});data[key]=signature}
      if(source==='frame'&&snapshot.loading&&snapshot.scene&&!snapshot.scene.started&&data.loading.length<300)data.loading.push({at:performance.now(),...snapshot.scene})
    }
    new MutationObserver(()=>record('mutation')).observe(document,{subtree:true,childList:true,attributes:true})
    const frame=()=>{record('frame');requestAnimationFrame(frame)};requestAnimationFrame(frame)
  })
  const button=name=>page.getByRole('button',{name,exact:true})
  const twoFrames=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
  const phase=async name=>{
    await page.evaluate(name=>{window.ingamePrepared.phase=name},name)
    const row={name,at:now(),snapshot:await page.evaluate(()=>window.ingameSnapshot())};report.phases.push(row);save()
    await page.screenshot({path:resolve(output,`${name}.png`),timeout:5000});return row.snapshot
  }
  const frozen=()=>page.evaluate(async()=>{
    const scene=window.testSceneRef.current,world=window.testStore.getWorld()
    const bytes=new TextEncoder().encode(JSON.stringify(world)),digest=await crypto.subtle.digest('SHA-256',bytes)
    return {worldSha256:[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join(''),turn:world.turn,time:world.time,
      paused:world.paused,modalSuspended:scene.modalSuspended,inputMask:world.inputMask,animationFrame:scene.gameClock.animationFrame,
      animationTime:scene.gameClock.animationTime,uiTimer:scene.uiTimer,camera:scene.camera.position.toArray(),keys:[...scene.keys]}
  })
  const assertFrozen=async name=>{
    const before=await frozen()
    assert.equal(before.paused,true);assert.equal(before.modalSuspended,true)
    await page.keyboard.press('w');await page.keyboard.press('ArrowLeft');await page.keyboard.press('=')
    await page.waitForTimeout(500)
    const after=await frozen();assert.deepEqual(after,before,`${name}: clock/world/camera/input freeze`)
    report.frozen.push({name,holdMs:500,keys:['w','ArrowLeft','='],before,after});save()
  }
  const decodeCount = () => page.evaluate(() => window.ingamePrepared.decodes.filter(d => /pause-font|options\/ingame-|tooltip-font-c/.test(d.src)).length)
  const expectedFont = !['font-failure', 'late-font'].includes(mode)
  const expectedSliders = !['slider-failure', 'late-sliders'].includes(mode)
  const assertMenu = state => {
    assert.equal(state.pauseOpen, true);assert.equal(state.loading, null)
    assert.equal(state.fallback === 0, expectedFont)
    if (state.optionsOpen) assert.equal(state.sliders, String(expectedSliders))
  }
  try {
    await page.goto(url,{waitUntil:'domcontentloaded'})
    await page.waitForFunction(() => window.ingamePrepared.decodes.filter(d => /pause-font|options\/ingame-|tooltip-font-c/.test(d.src)).length === 5)
    if (held.length) {
      const loading = await phase('01-startup-assets-held')
      assert.ok(loading.loading);assert.equal(loading.pauseOpen, false)
      assert.equal(await page.getByRole('dialog',{name:'Main menu',exact:true}).count(),0)
      const state = () => page.evaluate(async () => {
        window.ingameSnapshot()
        const world = window.ingameObservedStore.getWorld()
        const hash = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(world)))
        return {worldSha256:[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join(''),turn:world.turn,time:world.time,
          scene:!!window.ingameObservedScene,loading:!!document.querySelector('.loading-world')}
      })
      const before=await state()
      for (const key of ['w','ArrowLeft','=','Space','Escape','Enter']) await page.keyboard.press(key)
      await page.mouse.click(640,400)
      await page.waitForTimeout(500)
      const after=await state();assert.deepEqual(after,before)
      assert.equal(before.scene,false);assert.equal(before.loading,true)
      report.startupShield={keys:['w','ArrowLeft','=','Space','Escape','Enter'],click:[640,400],holdMs:500,before,after}
      if (mode === 'healthy') {
        release([paths[0]])
        await page.waitForFunction(() => window.ingamePrepared.decodes.some(d=>d.src.endsWith('/pause-font.png')&&d.status==='resolved'))
        await twoFrames();assert.ok((await phase('02-font-ready-sliders-held')).loading)
        release(paths.slice(1))
      }
    }
    await page.getByRole('dialog',{name:'Main menu',exact:true}).waitFor()
    const frontend = await page.evaluate(() => {
      const menu=document.querySelector('[data-original-main-menu]')
      return {fallback:menu.querySelectorAll('[class*="fallback"]').length,background:menu.dataset.backgroundReady,cursor:menu.dataset.cursorReady}
    })
    assert.deepEqual(frontend,{fallback:0,background:'true',cursor:'true'})
    if (mode.startsWith('late-')) {
      const elapsed=await page.evaluate(()=>performance.now()-Math.min(...window.ingamePrepared.decodes.map(d=>d.start)))
      assert.ok(elapsed>=9900&&elapsed<20000,`single native startup deadline ${elapsed}`)
      report.nativeTimeoutMs=elapsed
    }
    await openCampaignFromMainMenu(page);await button('Start Mission 1').click()
    await bindGame(page)
    await skipIntroductionWithSpace(page, { timeout: 45000 })
    await page.waitForFunction(()=>!window.testStore.getWorld().inputMask&&window.testStore.getWorld().turn>0)
    assert.equal(await decodeCount(),paths.length)
    await button('Menu').click();await twoFrames()
    assertMenu(await phase('03-cold-pause'));await assertFrozen('cold-pause')
    await button('Options').click();await twoFrames()
    assertMenu(await phase('04-cold-options'))
    await button('Sound').click();await assertFrozen('cold-options')
    await phase('05-sound')
    await button('Back').click();await button('Options').click();await twoFrames()
    assertMenu(await phase('06-warm-options'));await assertFrozen('warm-options')
    if (mode.startsWith('late-')) {
      release(held)
      await page.waitForFunction(() => window.ingamePrepared.decodes.filter(d=>/pause-font|options\/ingame-|tooltip-font-c/.test(d.src)).every(d=>d.status==='resolved'))
      await twoFrames();assertMenu(await phase('07-late-success-still-frozen'))
      await button('Back').click();await button('Options').click();await twoFrames()
      assertMenu(await phase('08-remount-after-late-success'))
    }
    await button('Back').click()
    const beforeContinue=await frozen()
    await page.evaluate(()=>{window.ingameResumeAt=performance.now()})
    await button('Continue Game').click()
    await page.waitForFunction(turn=>window.testStore.getWorld().turn>turn,beforeContinue.turn)
    report.resumed=await page.evaluate(()=>({sinceResume:(performance.now()-window.ingameResumeAt)/1000,
      turn:window.testStore.getWorld().turn,time:window.testStore.getWorld().time,speed:window.testStore.getWorld().speed,
      paused:window.testStore.getWorld().paused,modalSuspended:window.testSceneRef.current.modalSuspended}))
    assert.equal(report.resumed.paused,false);assert.equal(report.resumed.modalSuspended,false)
    assert.ok(report.resumed.time-beforeContinue.time<=report.resumed.sinceResume*report.resumed.speed+1/12,'resume must not catch up held modal time')
    await button('Menu').click();await twoFrames()
    assertMenu(await phase('09-warm-pause'));await assertFrozen('warm-pause')
    assert.equal(await decodeCount(),paths.length,'cold and warm mounts do not repeat asset decode')
    assert.equal(report.requests.filter(r=>r.event==='request').length,paths.length,'each menu asset is requested once')
    const frames=await page.evaluate(()=>window.ingamePrepared.frames.filter(f=>f.pauseOpen))
    assert.ok(frames.length>=4)
    for(const frame of frames) assertMenu(frame)
    const unexpected=report.errors.filter(e=>!(failed&&e.kind==='console'&&e.location?.url?.endsWith(failed)&&e.message.includes('404')))
    assert.deepEqual(unexpected,[])
    report.status='passed'
  } catch(error) {
    report.status='failed';report.failure=String(error.stack)
    await page.screenshot({path:resolve(output,'failed.png'),timeout:5000}).catch(()=>{})
    throw error
  } finally {
    release(paths)
    report.browser=await page.evaluate(()=>window.ingamePrepared).catch(()=>null);save()
  }
  return {status:report.status,phases:report.phases.length,freezeChecks:report.frozen.length}
}
