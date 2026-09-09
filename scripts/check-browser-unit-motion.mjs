import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'

const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  const result = await page.evaluate(async () => {
    const s = window.testScene
    const { createWorld, command } = await import('/app/model.ts')
    const { UnitMotion } = await import('/app/unit-motion.ts')
    cancelAnimationFrame(s.frame)
    const reset = () => {
      s.world = createWorld()
      s.unitMotion = new UnitMotion()
      s.gameClock.animationTime = s.gameClock.animationFrame = 0
      s.previous = 0
      s.world.inputMask = 0
      s.world.flyby.flags &= ~1
      s.wasFlying = false
      s.cameraBearing = 0
      s.focus({x:2,z:30})
      const u = s.world.units.find(u=>u.team==='blue'&&u.kind==='brave')
      s.world.selected = [u.id]
      command(s.world,{x:u.x+3,z:u.z+1})
      if (!u.path.length) throw Error('Movement setup has no route')
      return u
    }
    const draw = now => { s.animate(now); cancelAnimationFrame(s.frame) }
    const same = (a,b) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.z-b.z)<1e-9
    const runs = [], render = s.renderer.render
    s.renderer.render = () => {} // Timing cases inspect real Scene positions; GPU probes follow separately.
    for (const hz of [5,12,24,30,60,120,144,240,0]) {
      const u = reset(), schedule = hz ? [1/hz] : [.007,.013,.28,.6,.1]
      draw(0)
      let time=0, frame=0, visibleMoves=0, simulationMoves=0, firstVisible=null, firstSimulation=null
      let previous=s.unitMeshes.get(u.id).position.clone(), previousUnit={x:u.x,y:0,z:u.z}
      while(time<2-1e-10){
        time=Math.min(2,time+schedule[frame++%schedule.length])
        draw(time*1000)
        const position=s.unitMeshes.get(u.id).position.clone(), unit={x:u.x,y:0,z:u.z}
        if(!same(position,previous)){visibleMoves++;firstVisible??=time}
        if(!same(unit,previousUnit)){simulationMoves++;firstSimulation??=time}
        previous=position;previousUnit=unit
      }
      runs.push({hz,visibleMoves,simulationMoves,firstVisible,firstSimulation,position:previous.toArray(),turn:s.world.turn,frame:s.gameClock.animationFrame})
    }
    // Actual consecutive 240 Hz GPU frames: isolate units so autonomous sky,
    // terrain or camera changes cannot provide a false smoothing signal.
    s.renderer.render = render
    const u=reset()
    for(let i=0;i<=40;i++)draw(i*1000/240)
    const group=s.unitMeshes.get(u.id)
    s.world.paused=true
    const paused=group.position.toArray()
    draw(s.previous+1000)
    const pausedAfter=group.position.toArray()
    s.world.paused=false
    const r=s.renderer,gl=r.getContext()
    const pixels=()=>{
      const hidden=[], ancestors=new Set(), background=s.scene.background
      s.scene.background=null
      for(let p=group;p;p=p.parent)ancestors.add(p)
      s.scene.traverse(object=>{
        if(!ancestors.has(object)&&!group.getObjectById(object.id)&&object.visible){
          hidden.push(object);object.visible=false
        }
      })
      r.render(s.scene,s.camera)
      const data=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4)
      gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,data)
      s.scene.background=background
      for(const object of hidden)object.visible=true
      return data
    }
    const images=[pixels()]
    for(let i=0;i<2;i++){draw(s.previous+1000/240);images.push(pixels())}
    const pixelChanges=images.slice(1).map((b,j)=>{
      let changed=0;const a=images[j]
      for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])changed++
      return changed
    })
    r.render(s.scene,s.camera)
    // Place a large visual/authoritative separation to test the real pointer path.
    // A flying person's old ground anchor is far outside its displayed sprite.
    const frame=s.unitMotion.frames.get(u)
    u.flight={h:unitHeight()}
    function unitHeight(){return (group.position.y+4)*128}
    frame.from={x:u.x-6,y:u.flight.h/128,z:u.z}
    frame.to={x:u.x,y:u.flight.h/128,z:u.z}
    frame.inside=u.inside
    s.world.pendingTime=1/24
    s.world.paused=true
    // Supply an already valid render pose without touching animation ownership.
    group.position.copy(s.unitMotion.position(s.world,u))
    const q=s.unitScreen(u.id),rect=r.domElement.getBoundingClientRect(),bounds=group.userData.bounds
    const x=rect.left+(q.x+1)*rect.width/2+(bounds.left+bounds.right)/2
    const y=rect.top+(1-q.y)*rect.height/2+(bounds.top+bounds.bottom)/2
    s.world.selected=[]
    s.down={x,y,button:0}
    s.pointerUp({clientX:x,clientY:y,button:0,buttons:0,pointerType:'mouse',shiftKey:false})
    const selected=s.world.selected.includes(u.id)
    const cell = (value,center) => ((((value>>9)-(center>>9)+64)&127)-64)+110
    const cx=cell(Math.round((u.x+8)*256),s.view.center.x)
    const cy=cell(Math.round((-u.z-8)*256),s.view.center.y)+1
    s.view.bounds=Array.from({length:222},()=>[0,0])
    s.view.bounds[cy]=[cx,cx+1]
    s.view.boundsTexture.image.data.fill(0)
    s.view.boundsTexture.image.data.set([cx,cx+1],cy*2)
    s.view.boundsTexture.needsUpdate=true
    const currentCellVisible=s.view.visible(u), displayedCellVisible=s.view.visible(group.position)
    const anchored=pixels()
    let anchoredPixels=0
    for(let i=3;i<anchored.length;i+=4)if(anchored[i])anchoredPixels++
    u.flight=undefined
    return {runs,paused,pausedAfter,pixelChanges,selected,currentCellVisible,displayedCellVisible,anchoredPixels,cellDebug:{cx,cy,center:s.view.center,current:[u.x,u.z],displayed:group.position.toArray(),from:frame.from,to:frame.to,phase:s.world.pendingTime}}
  })
  writeFileSync('/private/tmp/populous-unit-motion-latest.json',JSON.stringify(result,null,2)+'\n')
  const first=result.runs[0]
  for(const r of result.runs){
    if(r.hz)assert.ok(r.firstVisible-r.firstSimulation<=1/r.hz+1e-7,JSON.stringify(r))
    assert.equal(r.turn,first.turn)
    assert.equal(r.frame,first.frame)
    r.position.forEach((v,i)=>assert.ok(Math.abs(v-first.position[i])<1e-7,JSON.stringify(r)))
  }
  const fast=result.runs.find(r=>r.hz===240)
  assert.ok(fast.visibleMoves>fast.simulationMoves*5,JSON.stringify(fast))
  assert.deepEqual(result.paused,result.pausedAfter)
  assert.ok(result.pixelChanges.every(n=>n>0),JSON.stringify(result.pixelChanges))
  assert.ok(result.selected,'Click must select the displayed airborne sprite')
  assert.ok(result.currentCellVisible && !result.displayedCellVisible && result.anchoredPixels>0,'Visibility must use the authoritative cell while drawing the interpolated position')
  assert.deepEqual(errors,[])
  writeFileSync(process.argv[2]??'/private/tmp/populous-unit-motion.json',JSON.stringify(result,null,2)+'\n')
  console.log('PASS: nine actual Scene cadences, distinct 240 Hz unit pixels, pause and displayed-sprite selection',JSON.stringify(result))
}finally{await browser.close()}
