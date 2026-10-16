import assert from 'node:assert/strict'
import { preview } from 'vite'
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { storageFixture } from './browser-scenario.mjs'
const output=resolve('outputs/checkpoint-layout-probe');mkdirSync(output)
const result={status:'running',errors:[],warnings:[],views:[]}
let server,browser,context
try{
 server=await preview({configFile:false,root:resolve('scripts/tutorial-browser/fixture'),build:{outDir:resolve('outputs/checkpoint-recovery-attempt4/dist')},preview:{host:'127.0.0.1',port:5198,strictPort:true}})
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader'],timeout:30000})
 context=await browser.newContext({viewport:{width:640,height:480},deviceScaleFactor:1})
 const page=await context.newPage();await page.addInitScript(storageFixture,'open')
 page.on('pageerror',error=>result.errors.push(String(error)));page.on('console',message=>{if(message.type()==='error')result.errors.push(message.text());if(message.type()==='warning')result.warnings.push(message.text())})
 await page.goto('http://127.0.0.1:5198');await page.getByRole('button',{name:'Retry checkpoint lookup',exact:true}).waitFor()
 for(const [width,height]of [[640,480],[1440,900],[640,480]]){
  await page.setViewportSize({width,height})
  await page.waitForFunction(({width,height})=>{
   const frame=document.querySelector('[data-original-main-menu]>div')
   return Math.abs(frame.getBoundingClientRect().height-Math.min(width/640,height/480)*480)<1
  },{width,height})
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
  await page.waitForTimeout(200)
  const layout=await page.getByRole('region',{name:'Browser checkpoint recovery',exact:true}).evaluate(panel=>{
   const rect=panel.getBoundingClientRect(),p=panel.querySelector('p'),button=panel.querySelector('button')
   const overlaps=[...document.querySelectorAll('nav[aria-label="Main menu choices"] button')].filter(node=>{const other=node.getBoundingClientRect();return rect.left<other.right&&rect.right>other.left&&rect.top<other.bottom&&rect.bottom>other.top}).map(node=>node.getAttribute('aria-label'))
   return{rect:rect.toJSON(),overlaps,textOverflow:p.scrollWidth>p.clientWidth||p.scrollHeight>p.clientHeight,button:button.getBoundingClientRect().toJSON()}
  })
  assert.deepEqual(layout.overlaps,[]);assert.equal(layout.textOverflow,false);assert.ok(layout.rect.x>=0&&layout.rect.right<=width&&layout.rect.bottom<=height)
  const screenshot=`layout-${result.views.length}-${width}x${height}.png`;await page.screenshot({path:resolve(output,screenshot)})
  result.views.push({width,height,...layout,screenshot})
 }
 result.status='passed'
}catch(error){result.status='failed';result.failure=String(error);process.exitCode=1}
finally{await context?.close();await browser?.close();server?.httpServer.closeAllConnections();await server?.close();result.cleanupVerified=!browser?.isConnected();if(result.errors.length){result.status='failed';process.exitCode=1}writeFileSync(resolve(output,'layout.json'),JSON.stringify(result,null,2)+'\n')}
console.log(JSON.stringify(result))
