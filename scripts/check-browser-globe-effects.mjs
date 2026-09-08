// npm run dev, then node scripts/check-browser-globe-effects.mjs.
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import { globeCircle } from '../app/globe.ts'
import { lineQuad } from '../app/lightning.ts'
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(() => {
    const s = window.testScene
    cancelAnimationFrame(s.frame); s.world.speed = 0
    s.focus({ x: 2, z: 30 }); s.overview()
    s.animate(s.previous); cancelAnimationFrame(s.frame)
  })
  const frame = (ms = 0) => page.evaluate(ms => {
    const s = window.testScene
    s.animate(s.previous + ms); cancelAnimationFrame(s.frame)
  }, ms)
  const range = () => page.evaluate(() => {
    const s = window.testScene, g = s.globe, ctx = g.canvas.getContext('2d')
    const fills = [], points = [], original = {}
    for (const key of ['beginPath','moveTo','lineTo','fill']) original[key] = ctx[key]
    ctx.beginPath = function () { points.length = 0; original.beginPath.call(this) }
    ctx.moveTo = function (x,y) { points.push(x,y); original.moveTo.call(this,x,y) }
    ctx.lineTo = function (x,y) { points.push(x,y); original.lineTo.call(this,x,y) }
    ctx.fill = function () {
      if (this.globalAlpha > .2 && this.globalAlpha < 1) fills.push({ quad:[...points],alpha:Math.round(this.globalAlpha*255) })
      original.fill.call(this)
    }
    try { g.drawMarkers(g.view,s.world,s.terrainTextures) } finally { Object.assign(ctx,original) }
    return { fills,range:g.spellRange,phase:g.phase,view:g.view,groundAngle:s.halo.angle,groundVisible:s.range.visible,model:s.range.userData.model }
  })
  const pixels = kind => page.evaluate(kind => {
    const s=window.testScene,g=s.globe,w=s.world,gl=s.renderer.getContext()
    const read=()=>{g.drawMarkers(g.view,w,s.terrainTextures);s.renderer.render(s.scene,s.camera);const data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data);return data}
    const before=read(),saved=kind==='range'?g.spellRange:w.effects
    if(kind==='range')g.spellRange=null;else w.effects=[]
    const after=read()
    if(kind==='range')g.spellRange=saved;else w.effects=saved
    read()
    let count=0;for(let i=0;i<before.length;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])count++
    return count
  },kind)
  await page.getByRole('button',{name:/^Blast, \d+ shots$/}).hover()
  await frame()
  const initial=await range()
  assert.equal(initial.model,2);assert.equal(initial.groundVisible,false)
  assert.deepEqual(initial.fills,globeCircle(initial.view,initial.range,initial.range.radius,initial.phase).map(l=>({quad:lineQuad(l),alpha:l.alpha})))
  assert.equal(initial.fills.length,32)
  const rangePixels=await pixels('range');assert.ok(rangePixels>100,`Range contributed only ${rangePixels} GPU pixels`)
  await page.evaluate(()=>{window.testScene.world.paused=true})
  await frame(128)
  const pulsed=await range()
  assert.equal(pulsed.phase,(initial.phase+512)|0)
  assert.notEqual(pulsed.fills[0].alpha,initial.fills[0].alpha)
  assert.equal(pulsed.groundAngle,initial.groundAngle,'Overview must not advance the ground sprite halo')
  await page.keyboard.press('1')
  await page.getByRole('button',{name:/^Lightning, \d+ shots$/}).hover()
  await frame();assert.equal((await range()).model,2,'Selected spell overrides hovered preview')
  await page.keyboard.press('Escape');await frame();assert.equal((await range()).model,3)
  await page.evaluate(()=>{window.testScene.world.inputMask=4})
  await frame();assert.equal((await range()).range,null)
  await page.evaluate(()=>{window.testScene.world.inputMask=0;window.testScene.world.paused=false})
  await page.mouse.move(820,600);await page.keyboard.press('1');await frame()
  await page.screenshot({path:'/private/tmp/populous-globe-range-v106.png'})
  // Cast through the live globe picker and advance real simulation turns.
  const target=await page.evaluate(()=>{const s=window.testScene,q=s.screen({x:19,z:33}),r=s.container.getBoundingClientRect();s.world.speed=1;return {x:r.left+(q.x+1)*r.width/2,y:r.top+(1-q.y)*r.height/2}})
  await page.mouse.click(target.x,target.y)
  let trails=false
  for(let i=0;i<30;i++){
    await frame(80)
    trails=await page.evaluate(()=>window.testScene.world.effects.some(f=>f.sprite?.sequence==='blastTrail'))
    if(trails)break
  }
  assert.ok(trails,await page.evaluate(()=>window.testScene.world.message))
  await page.waitForFunction(()=>window.testScene.globe.effects.naturalWidth>0)
  const effectPixels=await pixels('effects');assert.ok(effectPixels>10,`Trails contributed only ${effectPixels} GPU pixels`)
  const effectState=await page.evaluate(()=>{
    const s=window.testScene,w=s.world,g=s.globe,ctx=g.canvas.getContext('2d'),original=ctx.drawImage
    const calls=[];ctx.drawImage=function(...a){if(a[0]===g.effects||[...g.tintedEffects.values()].includes(a[0]))calls.push(a.slice(1));original.apply(this,a)}
    try{g.drawMarkers(g.view,w,s.terrainTextures)}finally{ctx.drawImage=original}
    window.globeTrail=w.effects.find(f=>f.sprite?.sequence==='blastTrail')
    return {calls:calls.length,tinted:g.tintedEffects.size,teams:w.effects.filter(f=>f.sprite?.sequence==='blastTrail').map(f=>f.team)}
  })
  assert.ok(effectState.calls>4);assert.ok(effectState.tinted>0)
  assert.ok(effectState.teams.every(t=>t==='blue'),'Projectile trails preserve the casting tribe')
  await page.screenshot({path:'/private/tmp/populous-globe-trails-v106.png'})
  const gates=await page.evaluate(()=>{
    const s=window.testScene,w=s.world,g=s.globe,f=window.globeTrail,ctx=g.canvas.getContext('2d'),original=ctx.drawImage,saved=w.effects
    const x=Math.round((f.x+8)*256)&65535,y=Math.round((-f.z-8)*256)&65535,cell=(y>>9)*128+(x>>9),oldFlags=w.land.flags[cell],oldLevel=w.manaWorld.levelFlags,flags=f.animation.renderFlags
    w.effects=[f]
    const count=()=>{let n=0;ctx.drawImage=function(...args){n++;original.apply(this,args)};try{g.drawEffects(ctx,g.view,w,s.terrainTextures)}finally{ctx.drawImage=original}return n}
    const visible=count();f.animation.renderFlags|=16;const hidden=count();f.animation.renderFlags=flags
    w.manaWorld.levelFlags|=4;w.land.flags[cell]&=~8
    const owned=count();f.team='red';const enemy=count();f.team='blue'
    w.effects=saved;w.land.flags[cell]=oldFlags;w.manaWorld.levelFlags=oldLevel
    return {visible,hidden,owned,enemy}
  })
  assert.deepEqual(gates,{visible:1,hidden:0,owned:1,enemy:0})
  for(let i=0;i<30;i++)await frame(80)
  assert.equal(await page.evaluate(()=>window.testScene.world.effects.some(f=>f.sprite)),false,'Expired projectile art must leave the overview')
  await page.keyboard.press('=');await page.keyboard.press('1');await frame()
  assert.equal(await page.evaluate(()=>window.testScene.range.visible&&window.testScene.range.children.length===85),true)
  assert.deepEqual(errors,[])
  console.log(`PASS: native 32-strip overview range (${rangePixels} GPU pixels), paused pulse, hover/selection/input gates; real Blast trails (${effectPixels} GPU pixels), AL tint, tribe/fog/hidden gates, expiry and ground-halo return`)
} finally { await browser.close() }
