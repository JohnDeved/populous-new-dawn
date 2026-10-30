// Actual native-status component only; no full game, simulation or camera fixture.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import { chromium } from '@playwright/test'
import { pauseStatusLayout } from '../../app/pause-status-layout.ts'

const root=resolve(import.meta.dirname,'../..'), fixture=resolve(import.meta.dirname,'fixture')
assert.ok(process.argv[2], 'Provide a new evidence output directory')
const output=resolve(process.argv[2]), browserPath=process.env.POPULOUS_BROWSER
assert.ok(!existsSync(output),'Do not overwrite prior evidence')
assert.ok(browserPath && existsSync(browserPath),'Use the verified installed browser')
mkdirSync(output,{recursive:true})
const git=(...args)=>execFileSync('git',args,{cwd:root}).toString()
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex')
const baseline='be44bc76f21429c472978c3dcb8893e565b6a4fb'
const oldCss=git('show',`${baseline}:app/globals.css`).split('\n').find(line=>line.startsWith('.paused-badge{'))
assert.ok(oldCss)
const inputs=['app/original-pause-status.tsx','app/original-pause-status.module.css','app/pause-status-layout.ts','app/original-hud.json','app/page.tsx','app/globals.css','app/fps-graph.ts','app/spell-test-menu.tsx','app/spell-test-menu.module.css','app/spell-test-cheats.ts','public/original/hud.png','scripts/pause-status-fixture/run.mjs','scripts/pause-status-fixture/fixture/main.tsx','scripts/pause-status-fixture/fixture/index.html']
const fingerprints=Object.fromEntries(inputs.map(file=>[file,hash(resolve(root,file))]))
const receipt={status:'running',head:git('rev-parse','HEAD').trim(),baseline,sourceDirty:git('status','--porcelain'),inputs:fingerprints,browserPath,browserSha256:hash(browserPath),observations:[],checks:[],errors:[],limits:['Actual OriginalPauseStatus component with shipped CSS and raw HUD atlas in minimal React fixture, not full Home or natural gameplay.','Background is a solid fixture color, not game terrain or an original framebuffer.','Paired before is the exact removed base CSS and badge markup, on the same solid background.','Actual Home keyboard ownership is covered by separate source-extracted effect tests; this fixture injects no gameplay input/controller.','No full-game, WebGL, hardware performance or native timer-lifetime parity claim.']}
const save=()=>writeFileSync(resolve(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n')
let server,browser,timer,memoryGuard
save()
try{
  server=await createServer({configFile:false,root:fixture,publicDir:resolve(root,'public'),cacheDir:resolve(output,'vite-cache'),plugins:[react(),{name:'pause-before',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/before.css'){res.setHeader('Content-Type','text/css');res.end(oldCss)}else next()})}}],css:{postcss:{plugins:[tailwindcss({base:fixture})]}},optimizeDeps:{include:['react','react-dom','react-dom/client','react/jsx-runtime','react/jsx-dev-runtime']},server:{host:'127.0.0.1',port:4379,strictPort:true,fs:{allow:[root]}},logLevel:'warn'})
  await server.listen()
  browser=await chromium.launch({executablePath:browserPath,headless:true,chromiumSandbox:true,timeout:30000})
  receipt.browserVersion=browser.version()
  timer=setTimeout(()=>{receipt.timedOut=true;void browser.close()},90000)
  memoryGuard=setInterval(()=>{const kb=Number(readFileSync('/proc/meminfo','utf8').match(/MemAvailable:\s+(\d+)/)?.[1]);if(kb&&kb<1024*1024){receipt.memoryGuard={availableKb:kb};void browser.close()}},2000)
  for(const [width,height,dpr] of [[640,480,1],[640,480,2],[639,480,1],[900,300,1]]){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr}),page=await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('pageerror',error=>receipt.errors.push(String(error)))
    await page.goto('http://127.0.0.1:4379/?before');await page.locator('.paused-badge').waitFor()
    await page.screenshot({path:resolve(output,`before-${width}x${height}-dpr${dpr}.png`)})
    await page.goto('http://127.0.0.1:4379/')
    const node=page.locator('[data-original-pause-status]');await node.waitFor()
    await page.waitForFunction(()=>[...document.querySelectorAll('[data-original-pause-status] span')].some(n=>getComputedStyle(n).backgroundImage.includes('hud.png')))
    await page.evaluate(async()=>{const image=new Image();image.src='/original/hud.png';await image.decode();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))})
    const metrics=await node.evaluate(node=>{const r=node.getBoundingClientRect(),style=getComputedStyle(node);return {font:Number(node.dataset.font),left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height,background:style.backgroundColor,pointerEvents:style.pointerEvents,accessibleLabel:node.getAttribute('aria-label'),topTarget:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('[data-original-pause-status]')===node,scrollOverflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight}})
    const layout=pauseStatusLayout(width,height),textWidth=layout.glyphs.reduce((sum,g)=>sum+g.w,0)
    assert.equal(metrics.font,layout.font);assert.equal(metrics.width,textWidth);assert.equal(metrics.height,layout.height)
    assert.equal(metrics.right,width-2);assert.equal(metrics.bottom,height)
    assert.equal(metrics.pointerEvents,'none');assert.equal(metrics.topTarget,false);assert.equal(metrics.accessibleLabel,'Paused')
    assert.equal(metrics.background,'rgba(0, 0, 0, 0)');assert.equal(metrics.scrollOverflow,false)
    assert.equal(await page.locator('.paused-badge,.skip-introduction,.target-prompt,.desktop-recommendation,.world-message').count(),0)
    const actual=await node.screenshot()
    const comparison=await page.evaluate(async({png,layout,textWidth,dpr})=>{
      const decode=async src=>{const image=new Image();image.src=src;await image.decode();return image}
      const image=await decode(`data:image/png;base64,${png}`),atlas=await decode('/original/hud.png')
      const expected=document.createElement('canvas');expected.width=textWidth*dpr;expected.height=layout.height*dpr
      const ctx=expected.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.fillStyle='#163030';ctx.fillRect(0,0,expected.width,expected.height)
      let left=0
      for(const g of layout.glyphs){ctx.drawImage(atlas,g.x,g.y,g.w,g.h,left*dpr,0,g.w*dpr,g.h*dpr);left+=g.w}
      const captured=document.createElement('canvas');captured.width=image.width;captured.height=image.height
      const actualCtx=captured.getContext('2d');actualCtx.drawImage(image,0,0)
      const a=actualCtx.getImageData(0,0,captured.width,captured.height).data,e=ctx.getImageData(0,0,expected.width,expected.height).data
      let differences=0
      for(let i=0;i<a.length;i++)if(a[i]!==e[i])differences++
      return {actual:[image.width,image.height],expected:[expected.width,expected.height],differences,png:expected.toDataURL('image/png')}
    },{png:actual.toString('base64'),layout,textWidth,dpr})
    assert.deepEqual(comparison.actual,comparison.expected)
    const differences=comparison.differences
    writeFileSync(resolve(output,`expected-${width}x${height}-dpr${dpr}.png`),Buffer.from(comparison.png.split(',')[1],'base64'))
    writeFileSync(resolve(output,`actual-${width}x${height}-dpr${dpr}.png`),actual)
    receipt.observations.push({viewport:[width,height],dpr,...metrics,pixelByteDifferences:differences});save()
    assert.equal(differences,0,'Rendered glyphs must exactly match untinted source atlas at viewport DPR')
    await page.screenshot({path:resolve(output,`after-${width}x${height}-dpr${dpr}.png`)})
    await page.setViewportSize({width:900,height:342});await page.waitForFunction(()=>document.querySelector('[data-original-pause-status]').dataset.font==='3')
    await page.setViewportSize({width:900,height:341});await page.waitForFunction(()=>document.querySelector('[data-original-pause-status]').dataset.font==='4')
    await context.close()
  }
  for(const file of ['app/fps-graph.ts','app/spell-test-menu.tsx','app/spell-test-menu.module.css','app/spell-test-cheats.ts'])assert.equal(git('show',`${baseline}:${file}`),readFileSync(resolve(root,file),'utf8'),`${file} exemption remains byte-identical`)
  assert.deepEqual(receipt.errors,[])
  for(const[file,sha]of Object.entries(fingerprints))assert.equal(hash(resolve(root,file)),sha,`Source drift: ${file}`)
  receipt.checks.push('Raw native glyph pixels identical at DPR1/2 and F00T3/F00T4','Total-area resize boundary retained','No background panel or pointer interception','F8 and F9 production components byte-identical to base')
  receipt.status='passed'
}catch(error){receipt.status='failed';receipt.error=String(error.stack??error);process.exitCode=1}
finally{clearTimeout(timer);clearInterval(memoryGuard);await browser?.close();await server?.close();receipt.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({status:receipt.status,error:receipt.error,captures:receipt.observations.length,output}))}
