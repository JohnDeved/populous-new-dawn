import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import { chromium } from '@playwright/test'
import { homePopupFixture } from './home-source.mjs'
import { activatePopupFullscreenFromMenu } from './fullscreen-menu.mjs'
import { finalizePopupFixture } from './finalize.mjs'

const root=resolve(import.meta.dirname,'../..'), fixture=resolve(import.meta.dirname,'fixture')
const output=resolve(process.argv[2]), browserPath=process.env.POPULOUS_BROWSER
assert.ok(output && !existsSync(output),'Use a new output directory')
assert.ok(browserPath && existsSync(browserPath),'POPULOUS_BROWSER must be verified installed browser')
mkdirSync(output,{recursive:true})
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex')
const git=(...args)=>execFileSync('git',args,{cwd:root}).toString()
const baseline='be44bc76f21429c472978c3dcb8893e565b6a4fb'
const oldCss=git('show',`${baseline}:app/globals.css`)
assert.ok(oldCss?.includes('.campaign-messages details>div{'))
const homeFixture=resolve(output,'home.tsx')
writeFileSync(homeFixture,homePopupFixture(root))
const baselineCss=resolve(output,'baseline.css')
writeFileSync(baselineCss,oldCss.replace("@import 'tailwindcss'",`@import '${resolve(root,'node_modules/tailwindcss/index.css')}'`))
const diagnosticsHtml=readFileSync(resolve(root,'app/fps-graph.ts'),'utf8').match(/this\.element\.innerHTML = `([\s\S]+?)`/)?.[1]
assert.ok(diagnosticsHtml)
const inputs=['app/original-message-tab.tsx','app/original-message-tab.module.css','app/original-message-tabs.json','app/original-campaign-popup.tsx','app/original-campaign-popup.module.css','app/campaign-popup-layout.ts','app/campaign-popup-session.ts','app/original-campaign-popup.json','app/messages.ts','app/page.tsx','app/globals.css','app/fps-graph.ts','app/hud-layout.ts','app/original-result-ui.json','app/original-hud.json', 'app/fullscreen-session.ts','app/fullscreen-control.tsx','app/fullscreen-control.module.css','app/scene-input-runtime.ts','app/spell-test-cheats.ts','scripts/campaign-popup-fixture/home-source.mjs','scripts/campaign-popup-fixture/run.mjs','scripts/campaign-popup-fixture/fixture/main.tsx','scripts/campaign-popup-fixture/fixture/env.d.ts',
  'scripts/campaign-popup-fixture/fullscreen-menu.mjs','scripts/campaign-popup-fixture/finalize.mjs','scripts/browser-options-audio.mjs',
  'app/query-control.tsx','app/query-control.module.css','app/original-pause-menu.tsx','app/original-pause-menu.module.css','app/original-pause-font.json','app/original-main-menu.module.css','app/frontend-composition.ts','app/checkpoint-scroll-area.tsx','app/checkpoint-scroll-area.module.css','app/checkpoint-scroll.ts',
  ...['pointer','background','felgspen'].map(name=>`public/original/frontend/${name}.png`),
  ...[451,452,453,454,455].map(id=>`public/original/help/hfx-${id}.png`),
  ...[105,...Array.from({length:27},(_,i)=>996+i)].map(id=>`public/original/query-control/hfx-${id}.png`),
  ...['pause-font','campaign-popup-tiles','result-font','hud','hud-button','hud-button-selected','hud-button-hover','message'].map(name=>`public/original/${name}.png`)]
const pauseRoot=resolve(process.env.POPULOUS_PAUSE_ROOT || root),pauseFile=resolve(pauseRoot,'app/original-pause-status.tsx')
const actualPause=existsSync(pauseFile)
const pauseInputs=actualPause?['app/original-pause-status.tsx','app/original-pause-status.module.css','app/pause-status-layout.ts','app/original-hud.json','app/globals.css'].map(file=>resolve(pauseRoot,file)):[]
const pauseA11y=actualPause?readFileSync(resolve(pauseRoot,'app/globals.css'),'utf8').match(/\.game-a11y-status\{[^}]+\}/)?.[0]??'':''
if(actualPause)assert.ok(pauseA11y,'Actual native status screenreader rule is required')
const fingerprints=Object.fromEntries([...inputs,...pauseInputs].map(file=>[file,hash(resolve(root,file))]))
const receipt={status:'running',head:git('rev-parse','HEAD').trim(),baseline,pauseComponent:actualPause?pauseFile:'source-metric fixture (actual component absent)',inputs:fingerprints,startedAt:new Date().toISOString(),browserPath,browserSha256:hash(browserPath),observations:[],checks:[],errors:[],limits:['Actual popup component plus source-extracted Home effects/JSX and scene keyboard listeners in a bounded integration fixture, not full Home mount or natural campaign execution.','Before is retained be44bc76 campaign body markup and exact CSS against the same text/background/viewport.','Source-palette native reconstruction, not an original GPU capture or hardware performance test.','No fullgame WebGL renderer launched.']}
const save=()=>writeFileSync(resolve(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n')
let browser,server,timer,memoryGuard,deadlineAt,episodeError
let episodeFailed=false
save()
try {
 server=await createServer({configFile:false,root:fixture,publicDir:resolve(root,'public'),cacheDir:resolve(output,'vite-cache'),plugins:[react(),{name:'baseline-campaign-css',resolveId(id){if(id==='virtual:campaign-home')return homeFixture;if(id==='virtual:campaign-baseline.css')return baselineCss;if(id==='virtual:native-pause-component')return actualPause?pauseFile:'\0pause-fallback'},load(id){if(id==='\0pause-fallback')return 'export const OriginalPauseStatus=null'},configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/native-status-a11y.css'){res.setHeader('Content-Type','text/css');res.end(pauseA11y)}else if(req.url==='/diagnostics.html'){res.setHeader('Content-Type','text/html');res.end(diagnosticsHtml)}else if(req.url==='/before.css'){res.setHeader('Content-Type','text/css');res.end(oldCss)}else next()})}}],css:{postcss:{plugins:[tailwindcss({base:fixture})]}},optimizeDeps:{include:['react','react-dom','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime']},server:{host:'127.0.0.1',port:4378,strictPort:true,fs:{allow:[root,output,pauseRoot]}},logLevel:'warn'})
 await server.listen()
 browser=await chromium.launch({executablePath:browserPath,headless:true,chromiumSandbox:true,timeout:30000})
 receipt.browserVersion=browser.version()
 memoryGuard=setInterval(()=>{const kb=Number(readFileSync('/proc/meminfo','utf8').match(/MemAvailable:\s+(\d+)/)?.[1]);if(kb&&kb<1024*1024){receipt.memoryGuard={availableKb:kb,minimumKb:1024*1024};void browser.close()}},2000)
 deadlineAt=Date.now()+120000
 timer=setTimeout(()=>{receipt.timedOut=true;void browser.close()},120000)
 const context=await browser.newContext({viewport:{width:640,height:480}}),page=await context.newPage()
 page.setDefaultTimeout(10000)
 page.on('pageerror',error=>receipt.errors.push(String(error)))
 const open=async query=>{await page.goto(`http://127.0.0.1:4378/?${query??''}`);await page.locator('summary').first().waitFor();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))}
 const capture=async name=>{
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
   const value=await page.locator('details[open] [data-native-campaign-panel]').evaluate(panel=>{
     const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}}
     const buttons=[...panel.querySelectorAll('button')].map(button=>({label:button.getAttribute('aria-label'),...rect(button)}))
     return {viewport:[innerWidth,innerHeight],panel:rect(panel),font:panel.dataset.font,failed:panel.dataset.artFailed??false,buttons,glyphs:panel.querySelectorAll('[data-popup-glyph]').length,text:panel.querySelector('[data-campaign-text]').getAttribute('aria-label'),parentOpen:panel.closest('details').open,side:parseFloat(getComputedStyle(panel).getPropertyValue('--hud-scale'))*100}
   })
   const shot=await page.screenshot({path:resolve(output,`${name}.png`)})
   const glyphPixels=await page.evaluate(async data=>{
     const text=document.querySelector('[data-campaign-text]'),glyphs=[...text.querySelectorAll('[data-popup-glyph]')].slice(0,12)
     const textBox=text.getBoundingClientRect(),panel=text.closest('[data-native-campaign-panel]').getBoundingClientRect()
     const contained=textBox.left>=panel.left&&textBox.top>=panel.top&&textBox.right<=panel.right&&textBox.bottom<=panel.bottom
     if(getComputedStyle(text).position!=='absolute'||!contained)return {positioned:false,opaque:0,mismatches:-1}
     if(![[640,480],[900,300]].some(([w,h])=>w===innerWidth&&h===innerHeight))return {positioned:true,pixelCheck:'not sampled at scaled dimensions'}
     const read=async src=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const context=c.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0);return context}
     const screenshot=await read(data),url=getComputedStyle(glyphs[0]).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1],source=await read(url)
     let opaque=0,mismatches=0
     for(const glyph of glyphs){const style=getComputedStyle(glyph),box=glyph.getBoundingClientRect(),w=parseFloat(style.width),h=parseFloat(style.height),sx=-parseFloat(style.backgroundPositionX),sy=-parseFloat(style.backgroundPositionY),pixels=source.getImageData(sx,sy,w,h).data,actual=screenshot.getImageData(Math.round(box.left),Math.round(box.top),w,h).data
       if(box.width!==w||box.height!==h)return {positioned:true,pixelCheck:'not sampled at scaled dimensions'}
       for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]===255){opaque++;if(pixels[i]!==actual[i]||pixels[i+1]!==actual[i+1]||pixels[i+2]!==actual[i+2])mismatches++}
     }
     return {positioned:true,opaque,mismatches}
   },`data:image/png;base64,${shot.toString('base64')}`)
   value.glyphPixels=glyphPixels
   receipt.observations.push({name,...value});save()
   assert.equal(value.failed,false);assert.ok(value.glyphs>100);assert.equal(glyphPixels.positioned,true,'Body text is positioned above the panel tiles');if('mismatches' in glyphPixels){assert.ok(glyphPixels.opaque>40);assert.equal(glyphPixels.mismatches,0,'Visible body glyph pixels equal the original atlas, not merely present DOM')}
   assert.ok(value.panel.x>=value.side-1 && value.panel.y>=0 && value.panel.right<=value.viewport[0] && value.panel.bottom<=value.viewport[1])
   assert.ok(Math.abs(value.panel.x+(value.panel.width/2)-(value.side+(value.viewport[0]-value.side)/2))<=1)
   for(const button of value.buttons)assert.ok(button.x>=value.panel.x&&button.right<=value.panel.right&&button.bottom<=value.panel.bottom)
   return value
 }
 // Source-extracted actual Home effects/JSX and scene key listeners, no WebGL.
 await page.addInitScript(()=>{
   if(!location.search.includes('home'))return
   let active=false,lastEvent=null,requests=0,exits=0
   const set=value=>{active=value;document.dispatchEvent(new Event('fullscreenchange'))}
   Object.defineProperty(document,'fullscreenElement',{get:()=>active?document.documentElement:null,configurable:true})
   Object.defineProperty(document,'fullscreenEnabled',{get:()=>true,configurable:true})
   HTMLElement.prototype.requestFullscreen=async()=>{requests++;set(true)};document.exitFullscreen=async()=>{exits++;set(false)}
   addEventListener('keydown',event=>{lastEvent=event},true)
   window.fullscreenFixture={set,read:()=>({active,requests,exits,lastDefault:lastEvent?.defaultPrevented})}
 })
 const homeRead=()=>page.evaluate(()=>window.homePopupFixture.read())
 const auto=async()=>{await page.evaluate(()=>{window.homePopupFixture.hold();window.homePopupFixture.autoOpen()});await page.locator('details[open]').waitFor();await page.waitForFunction(()=>!(window.homePopupFixture.read().world.messages.slots[0].flags&2))}
 for(const focus of ['body','world']){
   await open('home');await page.evaluate(focus=>{const node=focus==='body'?document.body:document.querySelector('.world-viewport');node.tabIndex=-1;node.focus()},focus)
   await auto();const before=await homeRead();assert.deepEqual(before.keys,[],'Opening clears previously held camera/modifier input')
   assert.equal(await page.evaluate(focus=>document.activeElement===(focus==='body'?document.body:document.querySelector('.world-viewport')),focus),true,'Automatic opening does not steal focus')
   for(const key of ['Space','Escape','h','g','f','b','1','z','ArrowUp']){await page.keyboard.press(key);assert.deepEqual(await homeRead(),before,`${focus}: popup owns ${key} before actual Home/scene gameplay`)}
   for(const modifier of ['Shift','Control'])for(const exempt of ['Tab','F8','F9']){
     await page.keyboard.down(modifier);await page.keyboard.press(exempt);await page.keyboard.up(modifier)
     assert.deepEqual((await homeRead()).keys,[],`${modifier}+${exempt} release cannot re-add a stuck scene modifier`)
     await page.evaluate(focus=>{const node=focus==='body'?document.body:document.querySelector('.world-viewport');node.focus()},focus)
     assert.deepEqual(await homeRead(),before,'Exempt key sequences preserve native popup/world state and browser focus can return')
   }
   await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter')
   const after=await homeRead();assert.equal(after.acknowledgments,1,'Held Enter produces exactly one ACK click');assert.ok(after.world.messages.slots[0]);assert.deepEqual(after.calls,before.calls);assert.equal(after.world.paused,true);assert.equal(await page.locator('details[open]').count(),0)
   assert.equal(await page.locator('summary').evaluate(n=>n===document.activeElement),true,'Retained notification is the explicit browser focus return')
   await page.getByLabel('Read campaign message').click();assert.equal((await homeRead()).calls.focus,1,'Manual positioned reopen focuses camera once')
   await page.getByLabel('Read campaign message').click();assert.equal(await page.locator('details[open]').count(),0)
   await page.getByLabel('Read campaign message').click();await page.getByRole('button',{name:'Acknowledge campaign message'}).focus();await page.keyboard.press('Space')
   assert.equal(await page.locator('details[open]').count(),0,'Focused HTML Space activation is a browser accessibility adaptation')
   await auto();await page.getByRole('button',{name:'Delete campaign message'}).click();assert.equal(await page.locator('details').count(),0);assert.equal(await page.locator('.world-viewport').evaluate(n=>n===document.activeElement),true)
   receipt.checks.push(`Actual Home from ${focus}: auto-open key priority, held input cleanup, Enter ACK once, manual positioned reopen/close, browser Space activation and delete focus return`)
 }
 await open('home');await auto();await page.evaluate(()=>window.homePopupFixture.setFlyby());await page.locator('.world-viewport').focus()
 for(const key of ['Space','Escape'])await page.keyboard.press(key)
 assert.equal((await homeRead()).calls.skip,0,'Popup ownership precedes input-mask flyby skipping')
 await page.keyboard.press('F8');assert.equal((await homeRead()).calls.f8,1)
 await page.keyboard.press('F9');await page.locator('[data-cheat-test-open]').waitFor({state:'attached'});await page.keyboard.press('F9');assert.equal(await page.locator('[data-cheat-test-open]').count(),0)
 const fullscreenMenuTrace={};receipt.checks.push({fullscreenMenuTrace});save()
 await activatePopupFullscreenFromMenu(page,{deadlineAt,trace:fullscreenMenuTrace});save()
 assert.equal((await page.evaluate(()=>window.fullscreenFixture.read())).active,true)
 await page.locator('.world-viewport').focus();await page.keyboard.down('Escape')
 assert.equal((await page.evaluate(()=>window.fullscreenFixture.read())).lastDefault,false,'Fullscreen Escape retains browser default before popup capture')
 await page.evaluate(()=>window.fullscreenFixture.set(false));await page.keyboard.down('Escape');await page.keyboard.up('Escape')
 assert.equal(await page.locator('details[open]').count(),1);assert.equal((await homeRead()).calls.cancel,0)
 await page.waitForTimeout(260);await page.keyboard.press('Escape');assert.equal((await page.evaluate(()=>window.fullscreenFixture.read())).lastDefault,true,'Outside fullscreen popup consumes Escape without acknowledgment')
 await page.screenshot({path:resolve(output,'home-input-ownership.png')})
 await page.evaluate(()=>window.homePopupFixture.setOneShot());await page.keyboard.press('Enter');assert.equal(await page.locator('details').count(),0);assert.equal(await page.locator('.world-viewport').evaluate(n=>n===document.activeElement),true)
 receipt.checks.push('Actual Home/scene owners: input-mask priority, F8/F9 preservation, actual fullscreen session Escape priority and one-shot focus return (Fullscreen API supplied, not native browser exit proof)')
 // The existing paused scenario above is retained. Add an initially running
 // world so legitimate menu suspension and Continue restoration are both proved.
 await open('home&running');await auto()
 const runningFullscreenMenuTrace={};receipt.checks.push({runningFullscreenMenuTrace});save()
 await activatePopupFullscreenFromMenu(page,{deadlineAt,trace:runningFullscreenMenuTrace});save()
 receipt.checks.push('Shipped Query/Menu/Fullscreen/Continue path retains the exact popup and restores both prior pause states; no gameplay fullscreen host')
 for(const [width,height]of [[640,480],[900,360],[1920,1080]]){
   await page.setViewportSize({width,height});await open('before')
   await page.screenshot({path:resolve(output,`before-${width}x${height}.png`)})
   await open();await capture(`after-${width}x${height}`)
 }
 await page.setViewportSize({width:640,height:480});await open()
 await page.getByRole('button',{name:'Acknowledge campaign message'}).click()
 assert.equal(await page.locator('details').getAttribute('open'),null)
 assert.equal((await page.evaluate(()=>window.popupFixture.read())).state.slots[0].stringId,641)
 await page.getByLabel('Read campaign message').click();await capture('after-ok-reopen')
 await page.getByRole('button',{name:'Delete campaign message'}).click()
 assert.equal(await page.locator('details').count(),0)
 receipt.checks.push('OK retains notification and supports reopen; Delete removes it')
 await open('oneShot');assert.equal(await page.getByRole('button',{name:'Delete campaign message'}).count(),0)
 await page.getByRole('button',{name:'Acknowledge campaign message'}).click()
 assert.equal(await page.locator('details').count(),0);receipt.checks.push('Authored one-shot OK removes notification without a Delete action')
 for(const key of ['Enter','Space']){
   await open();await page.getByRole('button',{name:'Acknowledge campaign message'}).focus()
   await page.keyboard.down(key);await page.keyboard.down(key);await page.keyboard.up(key)
   const state=await page.evaluate(()=>window.popupFixture.read())
   assert.equal(state.acknowledgments,1);assert.equal(state.leakedKeys,0);assert.ok(state.state.slots[0])
   assert.equal(await page.locator('details').getAttribute('open'),null)
   receipt.checks.push(`${key} acknowledges once with no gameplay key propagation`)
 }
 for(const query of ['multi','multi&mixed']){
   await open(query)
   const initial=await page.evaluate(()=>window.popupFixture.read())
   await page.locator('details[data-message-serial="1"] summary').click()
   assert.equal(await page.locator('details[open]').count(),1)
   assert.equal(await page.locator('details[open]').getAttribute('data-message-serial'),'1')
   await page.screenshot({path:resolve(output,`ownership-${query.replaceAll('&','-')}-second.png`)})
   await page.locator('details[data-message-serial="0"] summary').click()
   assert.equal(await page.locator('details[open]').getAttribute('data-message-serial'),'0')
   let current=await page.evaluate(()=>window.popupFixture.read())
   assert.deepEqual(current.state,initial.state,'Manual replacement does not acknowledge either ordinary or one-shot')
   assert.equal(current.focusCalls.length,1,'Positioned message focuses only when manually opened')
   assert.equal(current.paused,true)
   await page.evaluate(()=>window.popupFixture.autoOpen(1))
   assert.equal(await page.locator('details[open]').count(),1)
   await page.locator('details[data-message-serial="0"] summary').click()
   assert.equal(await page.locator('details[open]').getAttribute('data-message-serial'),'0')
   current=await page.evaluate(()=>window.popupFixture.read())
   assert.deepEqual(current.state,initial.state)
   await page.getByRole('button',{name:'Acknowledge campaign message'}).click()
   assert.equal(await page.locator('details[open]').count(),0)
   await page.locator('details[data-message-serial="1"] summary').click()
   await page.getByRole('button',{name:'Acknowledge campaign message'}).click()
   current=await page.evaluate(()=>window.popupFixture.read())
   assert.equal(current.state.slots[1]===null,query.includes('mixed'))
   assert.equal(current.paused,true)
   receipt.checks.push(`${query}: one visible body, replacement retains both records, reopen/focus/OK/paused owner preserved`)
 }
 await open();await page.setViewportSize({width:390,height:844});await capture('after-resize-390x844')
 await page.setViewportSize({width:900,height:300});await capture('after-resize-900x300')
 for(const [width,height]of [[640,480],[900,360]]){
   await page.setViewportSize({width,height});await open('before&diagnostics');await page.locator('.fps-graph').waitFor();await page.screenshot({path:resolve(output,`before-diagnostics-${width}x${height}.png`)});await open('diagnostics');await page.locator('.fps-graph').waitFor()
   await capture(`after-diagnostics-${width}x${height}`)
   const diagnostics=await page.locator('.fps-graph').evaluate(graph=>{
     const box=n=>{const r=n.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom}}
     const walker=document.createTreeWalker(graph,NodeFilter.SHOW_TEXT),text=[];let node;while(node=walker.nextNode()){if(!node.textContent.trim()||node.parentElement.closest('[hidden]'))continue;const range=document.createRange();range.selectNodeContents(node);text.push({value:node.textContent,rects:[...range.getClientRects()].map(r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom}))})}
     const style=getComputedStyle(graph);return {font:style.fontSize,lineHeight:style.lineHeight,text,pause:box(document.querySelector('[data-original-pause-status],[data-native-paused-fixture]')),box:box(graph),panel:box(document.querySelector('[data-native-campaign-panel]')),rows:[...graph.querySelectorAll('dl>div')].filter(n=>!n.closest('[hidden]')).map(n=>({box:box(n),fits:n.scrollWidth<=n.clientWidth})),export:box(graph.querySelector('.fps-export'))}
   })
   receipt.checks.push({diagnostics:[width,height],...diagnostics});save()
   assert.ok(diagnostics.box.top>=diagnostics.panel.bottom+3,'Diagnostics stay below the native body with a gutter')
   assert.ok(diagnostics.box.bottom<=diagnostics.pause.top-3,'Diagnostics do not cover the full native Paused glyph line')
   assert.ok(diagnostics.box.left>=0&&diagnostics.box.right<=width&&diagnostics.box.bottom<=height)
   assert.equal(diagnostics.font,'11px');assert.equal(diagnostics.lineHeight,'13.2px')
   for(const [index,run] of diagnostics.text.entries()) for(const fragment of run.rects){
     assert.ok(fragment.left>=diagnostics.box.left-.5&&fragment.right<=diagnostics.box.right+.5&&fragment.top>=diagnostics.box.top-.5&&fragment.bottom<=diagnostics.box.bottom+.5,'Every diagnostic text fragment fits')
     for(const other of diagnostics.text.slice(index+1))for(const next of other.rects)assert.ok(!(fragment.left<next.right&&fragment.right>next.left&&fragment.top<next.bottom&&fragment.bottom>next.top),`Distinct diagnostic text must not overlap: ${run.value} / ${other.value}`)
   }
   for(const row of diagnostics.rows)assert.ok(row.fits&&row.box.left>=diagnostics.box.left&&row.box.right<=diagnostics.box.right&&row.box.bottom<=diagnostics.box.bottom,'Every diagnostic row fits')
   for(const expanded of [false,true]){
     if(expanded)await page.getByRole('button',{name:'Picking paths'}).click()
     const summaries=await page.locator('summary').evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect(),graph=document.querySelector('.fps-graph').getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{rect:r.toJSON(),graph:graph.toJSON(),hit:node===hit||node.contains(hit)}}))
     for(const item of summaries){assert.ok(item.rect.right+3<=item.graph.left,'F8 never paints over the original notification strip');assert.equal(item.hit,true,'Notification center remains actionable with collapsed/expanded F8');assert.ok(item.rect.left>=0&&item.rect.top>=0&&item.rect.bottom<=height)}
     receipt.checks.push({notificationStrip:[width,height],expanded,summaries});save()
     if(expanded){
       const bounds=await page.locator('.fps-graph').evaluate(n=>({graph:n.getBoundingClientRect().toJSON(),panel:document.querySelector('[data-native-campaign-panel]').getBoundingClientRect().toJSON(),scrollable:n.scrollHeight>n.clientHeight,overflow:getComputedStyle(n).overflowY}))
       assert.ok(bounds.graph.top>=bounds.panel.bottom+3,'Expanded F8 scrolls below native popup rather than painting over it');assert.equal(bounds.overflow,'auto')
       await page.screenshot({path:resolve(output,`after-diagnostics-expanded-${width}x${height}.png`)})
       const graph=page.locator('.fps-graph')
       await page.getByRole('button',{name:'Picking paths'}).focus();await page.keyboard.press('End');await page.waitForTimeout(150)
       assert.ok(await graph.evaluate(n=>n.scrollTop>0),'Expanded compact diagnostics support isolated keyboard scrolling')
       await graph.evaluate(n=>n.scrollTop=0);await graph.hover();await page.mouse.wheel(0,2000);await page.waitForTimeout(150)
       const last=await graph.evaluate(n=>{const g=n.getBoundingClientRect(),last=n.querySelector('.fps-picking p').getBoundingClientRect();return{end:n.scrollTop+n.clientHeight>=n.scrollHeight-2,visible:last.top>=g.top&&last.bottom<=g.bottom}})
       assert.deepEqual(last,{end:true,visible:true},'Last optional picking explanation is visibly reachable, not merely clipped in the DOM')
       receipt.checks.push({compactExpandedLastField:[width,height],...last});save()
       await page.screenshot({path:resolve(output,`after-diagnostics-expanded-${width}x${height}-last-fields.png`)})
       await graph.evaluate(n=>n.scrollTop=0);await page.getByRole('button',{name:'Picking paths'}).click()
     }
   }

   await page.locator('summary').click()
   assert.deepEqual(await page.locator('.fps-graph').evaluate(n=>{const s=getComputedStyle(n);return[s.fontSize,s.lineHeight]}),['12px','16.8px'],'Closed-popup diagnostics retain their original font')
 }

 for(const [width,height] of [[390,844],[480,800],[560,700],[1920,1080]]){
   await page.setViewportSize({width,height});await open('diagnostics');await page.locator('.fps-graph').waitFor()
   for(const expanded of [false,true]){
     if(expanded)await page.getByRole('button',{name:'Picking paths'}).click()
     const value=await page.locator('.fps-graph').evaluate(n=>{const rect=node=>node.getBoundingClientRect().toJSON();return{graph:rect(n),panel:rect(document.querySelector('[data-native-campaign-panel]')),pause:rect(document.querySelector('[data-original-pause-status]')),summary:rect(document.querySelector('summary')),bottom:getComputedStyle(n).bottom}})
     receipt.checks.push({diagnosticStatusClearance:[width,height],expanded,...value});save()
     assert.ok(value.graph.bottom<=value.pause.top-3,'Native Paused is unscaled and needs its complete glyph height plus gutter')
     assert.ok(value.graph.top>=value.panel.bottom+3,'Popup/F8 remain separated at portrait and high HUD sizes')
     assert.ok(value.graph.left>=value.summary.right+3,'Original notification strip stays visually uncovered')
     assert.ok(value.graph.left>=0&&value.graph.right<=width&&value.graph.top>=0)
     const summaryHit=await page.locator('summary').evaluate(n=>{const r=n.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return n===hit||n.contains(hit)})
     assert.equal(summaryHit,true,'Portrait/high-HUD notification stays actionable')
     if(width<560||height>800)assert.equal(await page.locator('.fps-graph').evaluate(n=>getComputedStyle(n).fontSize),'12px','Noncompact diagnostics keep the original font')
     if(await page.locator('.fps-graph').evaluate(n=>n.scrollHeight>n.clientHeight)){
       const graph=page.locator('.fps-graph')
       const last=page.locator('.fps-export');await last.focus();await page.keyboard.press('Tab')
       assert.ok(await graph.evaluate(n=>n.scrollTop>0),'Keyboard focus can reach final diagnostic controls')
       await page.getByRole('button',{name:'Picking paths'}).focus();await page.keyboard.press('End')
       await page.waitForTimeout(150)
       assert.ok(await graph.evaluate(n=>n.scrollTop>0),'Focused diagnostic keyboard scrolling works')
       await graph.evaluate(n=>n.scrollTop=0);await graph.hover();await page.mouse.wheel(0,2000);await page.waitForTimeout(150)
       assert.ok(await graph.evaluate(n=>n.scrollTop+n.clientHeight>=n.scrollHeight-2),'Pointer scrolling reaches the final diagnostic field')
       assert.ok(await last.evaluate(n=>{const r=n.getBoundingClientRect(),p=n.closest('.fps-graph').getBoundingClientRect();return r.top>=p.top&&r.bottom<=p.bottom}),'Last control is visibly reachable, not clipped away')
       await page.screenshot({path:resolve(output,`after-diagnostics-${width}x${height}${expanded?'-expanded':''}-last-fields.png`)})
       await graph.evaluate(n=>n.scrollTop=0)
     }
     await page.screenshot({path:resolve(output,`after-diagnostics-${width}x${height}${expanded?'-expanded':''}.png`)})
   }
 }
 await page.setViewportSize({width:640,height:480});await open()
 const ok=page.getByRole('button',{name:'Acknowledge campaign message'})
 await ok.hover();await page.screenshot({path:resolve(output,'after-button-hover.png')})
 assert.ok((await ok.evaluate(n=>getComputedStyle(n).getPropertyValue('--popup-button'))).includes('hud-button-selected'))
 await page.mouse.down();await page.screenshot({path:resolve(output,'after-button-pressed.png')})
 assert.ok((await ok.evaluate(n=>getComputedStyle(n).getPropertyValue('--popup-button'))).includes('hud-button-hover'))
 await page.mouse.up()
 receipt.checks.push('Native hover830 and pressed839 bitmap mappings are active')

 await page.route('**/original/*.png',route=>route.abort())
 for(const [width,height]of [[640,480],[900,300]]){
   await page.setViewportSize({width,height});await open();await page.locator('[data-art-failed]').waitFor()
   const fallbackShot=await page.screenshot({path:resolve(output,`art-failure-recovery-${width}x${height}.png`)})
   const text=page.locator('[data-campaign-text]')
   assert.equal(await text.textContent(),await text.getAttribute('aria-label'))
   const fallback=await text.evaluate(n=>{const range=document.createRange();range.selectNodeContents(n);return{rects:[...range.getClientRects()].map(r=>({top:r.top,bottom:r.bottom,right:r.right})),box:n.getBoundingClientRect().toJSON(),button:document.querySelector('[aria-label="Acknowledge campaign message"]').getBoundingClientRect().toJSON()}})
   for(const [index,rect]of fallback.rects.entries()){
     assert.ok(rect.bottom<=fallback.button.top && rect.right<=fallback.box.right+.5,'Recovery text stays clear of controls')
     if(index)assert.ok(rect.top>=fallback.rects[index-1].bottom,'Recovery text lines do not overlap')
   }
   const ink=await page.evaluate(async data=>{
     const image=new Image();image.src=data;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0)
     const range=document.createRange();range.selectNodeContents(document.querySelector('[data-campaign-text]'))
     return [...range.getClientRects()].map(rect=>{const pixels=context.getImageData(Math.floor(rect.left),Math.floor(rect.top),Math.ceil(rect.width),Math.ceil(rect.height)).data;let count=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<100&&pixels[i+1]<100&&pixels[i+2]<100)count++;return count})
   },`data:image/png;base64,${fallbackShot.toString('base64')}`)
   assert.ok(ink.length>0&&ink.every(count=>count>10),'Every fallback text line paints visible dark ink, not just DOM text')
   receipt.checks.push({fallbackViewport:[width,height],visibleInkPixelsPerLine:ink})
   await page.getByRole('button',{name:'Acknowledge campaign message'}).click()
   assert.equal(await page.locator('details[open]').count(),0)
 }
 receipt.checks.push('Art failure retains readable, non-overlapping authored text and functional acknowledgment for both bitmap-font thresholds')
 assert.equal(receipt.errors.length,0,receipt.errors.join('\n'))
 for(const[file,sha]of Object.entries(fingerprints))assert.equal(hash(resolve(root,file)),sha,`Source drift: ${file}`)
 receipt.status='passed'
}catch(error){episodeFailed=true;episodeError=error;receipt.status='failed';receipt.error=String(error?.stack??error);process.exitCode=1}
finally{
 clearTimeout(timer);clearInterval(memoryGuard)
 const terminal=await finalizePopupFixture({receipt,failed:episodeFailed,primaryError:episodeError,browser,server,save,
   emit:retainedReceipt=>console.log(JSON.stringify({output,receipt:retainedReceipt},null,2))})
 if(terminal.failed)process.exitCode=1
}
