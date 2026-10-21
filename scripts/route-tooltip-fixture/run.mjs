// Actual route-tooltip canvas and shipped CSS; no full Home, game or GPU fixture.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import tailwindcss from '@tailwindcss/postcss'
import { chromium } from '@playwright/test'
const root=resolve(import.meta.dirname,'../..'),fixture=resolve(import.meta.dirname,'fixture')
assert.ok(process.argv[2],'Provide a new evidence directory')
const output=resolve(process.argv[2]),browserPath=process.env.POPULOUS_BROWSER
assert.ok(!existsSync(output),'Preserve prior evidence');assert.ok(browserPath&&existsSync(browserPath),'Use verified installed browser')
mkdirSync(output,{recursive:true})
const git=(...a)=>execFileSync('git',a,{cwd:root}).toString(), hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
const baseline='be44bc76f21429c472978c3dcb8893e565b6a4fb',css=git('show',`${baseline}:app/globals.css`)
const oldCss=css.split('\n').filter(l=>l.startsWith('.world-message{')||l.startsWith('.route-notice{')).join('\n')
assert.ok(oldCss.includes('@keyframes route-notice'))
const sources=['app/route-tooltip.ts','app/tooltip-layout.ts','app/tooltips.ts','app/tooltip-controller.ts','app/scene-tooltip-runtime.ts','app/scene-input-runtime.ts','app/scene-camera-runtime.ts','app/live-command.ts','app/world-effects.ts','app/world-types.ts','app/world-state.ts','app/page.tsx','app/globals.css','app/original-hud.json','app/native-math.ts','app/native-terrain.ts','app/projection.ts','app/original-rules.json','app/original-camera.json','public/original/hud.png','public/original/tooltip-border.png','decomp/research/route-tooltip/native/source-data.json','decomp/research/route-tooltip/hud-font-pixel-verification.json','scripts/route-tooltip-fixture/run.mjs','scripts/route-tooltip-fixture/fixture/main.ts','scripts/route-tooltip-fixture/fixture/index.html']
const inputs=Object.fromEntries(sources.map(f=>[f,hash(resolve(root,f))]))
const source=JSON.parse(readFileSync(resolve(root,'decomp/research/route-tooltip/native/source-data.json'))),hud=JSON.parse(readFileSync(resolve(root,'app/original-hud.json')))
const receipt={status:'running',head:git('rev-parse','HEAD').trim(),trackedDiffSha256:createHash('sha256').update(git('diff','HEAD','--binary')).digest('hex'),baseline,inputs,browserPath,browserSha256:hash(browserPath),observations:[],errors:[],limits:['Actual production canvas paint and source-native anchor helper with shipped CSS; supplied identity projection, flat terrain and solid background, not the full game.','Independent pixel expectation uses retained native layout lines and raw verified source atlas/border; it does not call production layout or frame composition.','Lifetime here exercises actual shared tooltip helper; composed Home/Scene/menu/controller ownership is covered by separate caller tests.','Opaque red is accepted only for ordinary initialized active-HUD D3D state. No universal inherited blend, native GPU raster, runtime palette, native screenshot or hardware performance claim.']}
const save=()=>writeFileSync(resolve(output,'receipt.json'),JSON.stringify(receipt,null,2)+'\n')
let server,browser,timer,memoryGuard;save()
try{
 server=await createServer({configFile:false,root:fixture,publicDir:resolve(root,'public'),cacheDir:resolve(output,'vite-cache'),plugins:[{name:'route-before',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/before.css'){res.setHeader('Content-Type','text/css');res.end(oldCss)}else next()})}}],css:{postcss:{plugins:[tailwindcss({base:fixture})]}},server:{host:'127.0.0.1',port:4381,strictPort:true,fs:{allow:[root]}},logLevel:'warn'})
 await server.listen();browser=await chromium.launch({executablePath:browserPath,headless:true,chromiumSandbox:true,timeout:30000});receipt.browserVersion=browser.version()
 timer=setTimeout(()=>{receipt.timedOut=true;void browser.close()},90000)
 memoryGuard=setInterval(()=>{const kb=Number(readFileSync('/proc/meminfo','utf8').match(/MemAvailable:\s+(\d+)/)?.[1]);if(kb&&kb<1024*1024){receipt.memoryGuard={availableKb:kb};void browser.close()}},2000)
 for(const [width,height,dpr] of [[640,480,1],[800,600,1],[1024,768,1],[1280,720,2]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr}),page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>receipt.errors.push(String(e)))
  await page.goto('http://127.0.0.1:4381/?before');await page.locator('.route-notice').waitFor();await page.screenshot({path:resolve(output,`before-${width}x${height}-dpr${dpr}.png`)})
  await page.goto('http://127.0.0.1:4381/');const node=page.locator('.native-route-tooltip');await node.waitFor()
  const layout=source.layoutExamples.find(e=>e.screen[0]===width&&e.screen[1]===height)
  assert.ok(layout,'Expected pixels require independent native layout example')
  const metrics=await node.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {...JSON.parse(n.dataset.layout),left:r.left,top:r.top,right:r.right,bottom:r.bottom,frameWidth:r.width,frameHeight:r.height,background:s.backgroundColor,border:s.borderWidth,pointerEvents:s.pointerEvents,position:s.position,label:n.getAttribute('aria-label'),intercepts:document.elementFromPoint(r.left+8,r.top+8)?.closest('.native-route-tooltip')===n}})
  assert.deepEqual(metrics.anchor,{x:Math.trunc((width-160)/2+164),y:height/2});assert.equal(metrics.left,metrics.anchor.x-4);assert.equal(metrics.top,metrics.anchor.y-4)
  assert.equal(metrics.width,layout.width);assert.equal(metrics.height,layout.height);assert.equal(metrics.frameWidth,layout.width+7);assert.equal(metrics.frameHeight,layout.height+7)
  assert.equal(metrics.position,'fixed');assert.equal(metrics.border,'0px');assert.equal(metrics.background,'rgba(0, 0, 0, 0)');assert.equal(metrics.pointerEvents,'none');assert.equal(metrics.intercepts,false);assert.equal(metrics.label,source.message603)
  const actual=await node.screenshot()
  const comparison=await page.evaluate(async({png,layout,hud,dpr})=>{
   const decode=async src=>{const i=new Image();i.src=src;await i.decode();return i},atlas=await decode('/original/hud.png'),border=await decode('/original/tooltip-border.png'),captured=await decode(`data:image/png;base64,${png}`)
   const tile=document.createElement('canvas');tile.width=tile.height=12;const t=tile.getContext('2d');t.drawImage(border,0,0);const b=t.getImageData(0,0,12,12).data
   const expected=document.createElement('canvas');expected.width=layout.width+7;expected.height=layout.height+7;const c=expected.getContext('2d'),pixels=c.createImageData(expected.width,expected.height)
   for(let y=0;y<expected.height;y++)for(let x=0;x<expected.width;x++){
    const i=(y*expected.width+x)*4;pixels.data.set([255,37,0,255],i)
    if(x>=4&&x<expected.width-4&&y>=4&&y<expected.height-4)continue
    const sx=x<4?x:x>=expected.width-4?8+x-(expected.width-4):4+(x-4)%4,
      sy=y<4?y:y>=expected.height-4?8+y-(expected.height-4):4+(y-4)%4,j=(sy*12+sx)*4
    if(b[j+3]!==0&&b[j+3]!==255)throw Error('Source border requires explicit fractional-alpha audit')
    if(b[j+3]===255)pixels.data.set(b.slice(j,j+4),i)
   }
   c.putImageData(pixels,0,0);c.imageSmoothingEnabled=false
   layout.lines.forEach((line,row)=>{let x=4+((layout.width-layout.lineWidths[row])>>1);for(const char of line){const g=hud.rects[`f00t${layout.font}-${char.charCodeAt(0)-32}`];c.drawImage(atlas,g.x,g.y,g.w,g.h,x,4+row*layout.lineHeight,g.w,g.h);x+=g.w}})
   const scaled=document.createElement('canvas');scaled.width=expected.width*dpr;scaled.height=expected.height*dpr;const s=scaled.getContext('2d');s.imageSmoothingEnabled=false;s.drawImage(expected,0,0,scaled.width,scaled.height)
   const ac=document.createElement('canvas');ac.width=captured.width;ac.height=captured.height;const a=ac.getContext('2d');a.drawImage(captured,0,0)
   const av=a.getImageData(0,0,ac.width,ac.height).data,ev=s.getImageData(0,0,scaled.width,scaled.height).data;let differences=0;for(let i=0;i<av.length;i++)if(av[i]!==ev[i])differences++
   return {actual:[ac.width,ac.height],expected:[scaled.width,scaled.height],differences,png:scaled.toDataURL()}
  },{png:actual.toString('base64'),layout,hud,dpr})
  writeFileSync(resolve(output,`actual-${width}x${height}-dpr${dpr}.png`),actual);writeFileSync(resolve(output,`expected-${width}x${height}-dpr${dpr}.png`),Buffer.from(comparison.png.split(',')[1],'base64'))
  receipt.observations.push({viewport:[width,height],dpr,...metrics,pixelByteDifferences:comparison.differences});save()
  assert.deepEqual(comparison.actual,comparison.expected);assert.equal(comparison.differences,0,'Actual pixels versus independent source-data expectation')
  await page.screenshot({path:resolve(output,`after-${width}x${height}-dpr${dpr}.png`)})
  await page.evaluate(()=>window.routeFixture.setMode('edge'))
  const edge=await node.evaluate(n=>({layout:JSON.parse(n.dataset.layout),left:n.getBoundingClientRect().left,top:n.getBoundingClientRect().top}))
  assert.deepEqual(edge.layout.anchor,{x:width-layout.width,y:height-layout.height});assert.equal(edge.left,width-layout.width-4);assert.equal(edge.top,height-layout.height-4)
  await page.screenshot({path:resolve(output,`edge-${width}x${height}-dpr${dpr}.png`)})
  await page.evaluate(()=>window.routeFixture.setMode('left'));assert.deepEqual(await node.evaluate(n=>JSON.parse(n.dataset.layout).anchor),{x:0,y:0})
  await page.evaluate(()=>window.routeFixture.setMode('clip'));assert.equal(await node.isVisible(),false)
  await page.evaluate(()=>{window.routeFixture.setMode('center');window.routeFixture.setCell(undefined)});assert.equal(await node.isVisible(),false)
  await page.evaluate(()=>window.routeFixture.setCell(0));await node.waitFor();await page.evaluate(()=>window.routeFixture.tick(70));assert.equal(await node.isVisible(),true)
  await page.evaluate(()=>window.routeFixture.tick(1));assert.equal(await node.isVisible(),false)
  await page.evaluate(()=>window.routeFixture.reset());await page.setViewportSize({width:800,height:601});await page.waitForFunction(()=>JSON.parse(document.querySelector('.native-route-tooltip').dataset.layout).height===38)
  await page.setViewportSize({width:800,height:600});await page.waitForFunction(()=>JSON.parse(document.querySelector('.native-route-tooltip').dataset.layout).height===30)
  receipt.observations.at(-1).edge=edge;receipt.observations.at(-1).gates=['left text clamp','clipped anchor hidden','missing legacy anchor hidden','72nd eligible visit expires','600/601 font boundary'];save();await context.close()
 }
 assert.deepEqual(receipt.errors,[]);for(const[f,h]of Object.entries(inputs))assert.equal(hash(resolve(root,f)),h,`Source drift ${f}`)
 receipt.status='passed'
}catch(e){receipt.status='failed';receipt.error=String(e.stack??e);process.exitCode=1}
finally{clearTimeout(timer);clearInterval(memoryGuard);await browser?.close();await server?.close();receipt.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({status:receipt.status,error:receipt.error,observations:receipt.observations.length,output}))}
