import assert from 'node:assert/strict'
import {resolve} from 'node:path'
import {writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
export default async function({page,output,receipt}) {
 const main=page.getByRole('dialog',{name:'Main menu',exact:true});await main.waitFor()
 await page.emulateMedia({reducedMotion:'reduce'})
 await page.waitForFunction(()=>document.querySelector('[data-original-main-menu] nav button i'))
 const captures=[]
 for(const [width,height]of [[640,480],[1920,1080],[3440,1440],[3840,1080],[768,1024],[641,480]]){
  await page.setViewportSize({width,height});await page.mouse.move(-5,-5)
  await main.getByRole('button',{name:'New Game',exact:true}).focus();await page.keyboard.press('Home')
  await page.waitForTimeout(200)
  const state=await main.evaluate(el=>{
   const canvas=el.querySelector('canvas'),frame=canvas.parentElement,b=frame.getBoundingClientRect(),s=b.width/640
   const bounds=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,logicalX:(r.x-b.x)/s,logicalY:(r.y-b.y)/s}}
   return{viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},frame:bounds(frame),canvas:{...bounds(canvas),width:canvas.width,height:canvas.height},title:bounds(el.querySelector('h1 span')),buttons:[...el.querySelectorAll('nav button')].map(e=>({label:e.getAttribute('aria-label'),...bounds(e)})),active:document.activeElement?.getAttribute('aria-label'),canvasURL:canvas.toDataURL()}
  })
  assert.equal(state.active,'New Game')
  for(const b of state.buttons){assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=width+.01&&b.y+b.height<=height+.01)}
  state.canvasSha256=createHash('sha256').update(state.canvasURL).digest('hex');delete state.canvasURL
  const imageName=`main-unfocused-${width}x${height}.png`;if(width===640||width===1920)await page.screenshot({path:resolve(output,`main-focused-${width}x${height}.png`)})
  await page.evaluate(()=>document.activeElement?.blur());await page.waitForTimeout(80)
  await page.screenshot({path:resolve(output,`main-unfocused-${width}x${height}.png`)})
  if(width===640||width===1920||width===3440){
   await main.getByRole('button',{name:'Options',exact:true}).hover();await page.waitForTimeout(80)
   if(width===1920)await page.screenshot({path:resolve(output,`main-hover-options-${width}x${height}.png`)})
  }
  captures.push({...state,image:imageName});writeFileSync(resolve(output,'captures.json'),JSON.stringify(captures,null,2)+'\n')
 }
 assert.deepEqual(receipt.errors,[])
 return {checks:captures,limits:['Actual production Home with plain React/Vite entry; no Vinext/Cloudflare/RSC serving claim.','Reduced-motion keyboard focus fixed for paired comparisons.','Headless software browser; no hardware performance or native runtime screenshot parity claim.']}
}
