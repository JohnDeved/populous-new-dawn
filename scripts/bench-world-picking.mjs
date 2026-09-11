// Paired CPU checks: extra painter bookkeeping versus the last shipped painter,
// and cached versus freshly projected terrain with identical picking behavior.
import assert from 'node:assert/strict'
import {writeFileSync} from 'node:fs'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
import {preparePainterBaseline,installPainterBaseline} from './painter-baseline.mjs'
const baseline='ebd9180f34bd7b80734b9619201f8b3232ff263e'
preparePainterBaseline(baseline)
const browser=await chromium.launch({headless:true})
try {
 const {page,errors}=await openGame(browser)
 await installPainterBaseline(page)
 const report=await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,m=await import('/app/model.ts')
  cancelAnimationFrame(s.frame);w.speed=0;w.manaWorld.gameFlags=32
  const stats=a=>{a.sort((a,b)=>a-b);return {median:a[Math.floor(a.length/2)],p95:a[Math.floor(a.length*.95)]}}
  const painter=[]
  for(const crowd of [false,true]){
   if(crowd){w.units=[];for(let i=0;i<200;i++)m.addUnit(w,'blue','brave',{x:(i%20)-8,z:Math.floor(i/20)+25})}
   window.selectPainter(true);s.focus({x:2,z:30});s.animate(s.previous);cancelAnimationFrame(s.frame)
   const samples=[[],[]]
   for(let i=0;i<36;i++){
    for(const which of i%2?[1,0]:[0,1]){
     window.selectPainter(!!which)
     const start=performance.now();s.view.painter.update(s.scene,s.renderer);s.view.painter.afterRender()
     if(i>=12)samples[which].push(performance.now()-start)
    }
    const [a,b]=window.painters.map(p=>p.texture.image.data)
    if(a.length!==b.length||a.some((v,j)=>v!==b[j]))throw Error('Painter depth changed')
   }
   painter.push({people:w.units.length,before:stats(samples[0]),after:stats(samples[1])})
  }
  window.selectPainter(true)
  const r=s.renderer.domElement.getBoundingClientRect(),p=s.unitScreen(w.units[0].id)
  const x=r.left+(p.x+1)*r.width/2,y=r.top+(1-p.y)*r.height/2-10
  const samples=[[],[]]
  for(let i=0;i<50;i++){
   const results=[]
   for(const cached of i%2?[1,0]:[0,1]){
    s.picking.lastKey=''
    if(!cached)s.view.groundPickCache=new WeakMap()
    const start=performance.now()
    const id=s.picking.pick({clientX:x+i%5-2,clientY:y+Math.floor(i/5)%5-2})
    if(i>=10)samples[cached].push(performance.now()-start)
    results.push(id)
   }
   if(results[0]!==results[1])throw Error('Projection cache changed picking')
  }
  return {painter,picking:{fresh:stats(samples[0]),cached:stats(samples[1])},userAgent:navigator.userAgent}
 })
 assert.deepEqual(errors,[])
 const path='/private/tmp/populous-world-picking-performance.json'
 writeFileSync(path,JSON.stringify({baseline,...report},null,2))
 console.log(JSON.stringify(report));console.log(path)
}finally{await browser.close()}
