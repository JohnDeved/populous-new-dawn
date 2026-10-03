// Exact-commit real-browser acceptance for the ordinary Mission1–3 opening.
// Holds only requestAnimationFrame, then drives the shipped scene's frame callback.
// No entity, terrain, ownership, RNG or startup-state injection.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { bindGame } from './browser-game.mjs'
const output=resolve(process.env.POPULOUS_LEVEL_START_OUTPUT??`work/orchestration/level-start-browser-${process.pid}`)
mkdirSync(output,{recursive:true})
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()
const browser=await chromium.launch({headless:!process.argv.includes('--headed')})
const report={commit,platform:process.platform,headed:process.argv.includes('--headed'),missions:[],limits:'Native helper/asset comparisons are separate; these are real browser lifecycle and rendered-state checks.'}
try {
 for(const level of [1,2,3]) {
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.stack??e.message))
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.addInitScript(()=>{window.requestAnimationFrame=()=>0})
  await page.goto(process.env.POPULOUS_URL??'http://localhost:3000',{waitUntil:'networkidle'})
  await page.getByRole('button',{name:`Mission ${level}`,exact:true}).click()
  await bindGame(page)
  const frames=[]
  for(const [label,turn] of [['before',0],['flyby-warmup',1],['shaman-pose',8],['terrain-conversion',24],['stones-rising',44],['after',80]]) {
   await page.evaluate(turn=>{
    const scene=window.testScene
    scene.world.speed=1
    let attempts=0
    while(scene.world.turn<turn&&attempts++<turn*4+10) {
      scene.animate(scene.previous+1000/24)
      if(scene.world.flyby.warmup>0 && scene.flybyCamera.angle!==256)
        throw new Error(`Fresh camera angle lost during flyby warmup: ${scene.flybyCamera.angle}`)
    }
    if(scene.world.turn!==turn)throw new Error(`Could not reach requested native turn${turn}: ${scene.world.turn}`)
    scene.animate(scene.previous)
   },turn)
   const state=await page.evaluate(()=>{
    const s=window.testScene,w=s.world,u=w.units.find(u=>u.team==='blue'&&u.kind==='shaman'),g=s.unitMeshes.get(u.id)
    return {turn:w.turn,sites:structuredClone(w.levelStart),blue:w.units.filter(u=>u.team==='blue').length,wild:w.units.filter(u=>u.team==='wild').length,
      height:Array.from(w.land.heights),pose:{object:u.native?.object,frame:u.native?.f2,draw:g?.userData.draw,state:g?.userData.state},
      stones:s.decorations.children.filter(g=>g.name==='reincarnation-stone'&&g.visible).map(g=>({tribe:g.userData.startTribe,index:g.userData.startStone,y:g.position.y})),
      effects:w.effects.map(f=>f.sprite?.sequence).filter(Boolean),inputMask:w.inputMask,flyby:{flags:w.flyby.flags,cursor:w.flyby.cursor,warmup:w.flyby.warmup,camera:{...s.flybyCamera}},
      camera:{x:s.cameraPosition.x,y:s.cameraPosition.y,angle:s.cameraPosition.angle}}
   })
   const heightHash=createHash('sha256').update(JSON.stringify(state.height)).digest('hex');delete state.height
   if(turn===0){assert.equal(state.stones.length,0);const site=state.sites.find(s=>s.tribe===0);assert.deepEqual(state.camera,{x:(site.center.x-256)&65535,y:site.center.y,angle:256})}
   if(turn===8)assert.equal(state.pose.object,520)
   if(turn===24)assert.ok(state.effects.includes('sparkle'))
   if(turn===80){assert.equal(state.stones.length,level===3?16:8);assert.ok(state.sites.every(s=>s.phase===4));assert.equal(state.blue,[0,7,9,13][level])}
   const screenshot=`${output}/mission-${level}-${label}.png`
   await page.screenshot({path:screenshot})
   frames.push({...state,heightHash,screenshot})
  }
  assert.notEqual(frames[0].heightHash,frames[2].heightHash)
  assert.equal(frames[3].heightHash,frames[4].heightHash)
  assert.deepEqual(errors,[])
  report.missions.push({level,frames,errors})
  await context.close()
 }
 writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2)+'\n')
 console.log(JSON.stringify({status:'PASS_BROWSER_LEVEL_START',commit,output,missions:report.missions.length}))
}finally{await browser.close()}
