// Focused heading/direction check; not a repeat of the18-phase worship benchmark.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'
import { createWorld } from '../app/world-initialization.ts'
import { stoneHeadAngle } from '../app/stone-head-orientation.ts'
import { modelMatrix, modelPoint, projectPoint } from '../app/projection.ts'
import { modelShade } from '../app/model-lighting.ts'
import { modelTriangleVisible, polygonBucket } from '../app/painter-order.ts'

const cases = [
  { mission: 1, kind: 'bridge', sceneryIndex: 32, heading: 0 },
  { mission: 5, kind: 'convertWild', sceneryIndex: 117, heading: 1024 },
]
// Fail cheaply before opening graphics when the upstream canonical heading
// producer is absent. A helper-only fixture pass is not shipped acceptance.
for (const item of cases) {
  const world = createWorld(item.mission), head = world.shrines.find(h => h.kind === item.kind)
  assert.ok(head, 'Missing authored head')
  assert.equal(Math.round(stoneHeadAngle(head,item.mission)*1024/Math.PI)&2047,item.heading,
    `Canonical scenery heading producer missing/wrong for mission${item.mission}`)
}
if (process.argv.includes('--preflight')) {
  console.log('PASS_STONE_HEAD_ORIENTATION_SOURCE_PREFLIGHT')
} else {
  await run()
}

async function run() {
  assert.ok(process.env.PND_QUEUE_JOB_ID && process.env.PND_QUEUE_DEADLINE, 'Use canonical queue')
  const i = process.argv.indexOf('--output-dir')
  assert.ok(i >= 0 && process.argv[i+1])
  const output = resolve(process.argv[i+1]), url = process.env.POPULOUS_URL
  assert.equal(new URL(url).port,'4318')
  mkdirSync(output,{recursive:false})
  const report = { startedAt:new Date().toISOString(),jobId:process.env.PND_QUEUE_JOB_ID,frames:[],stages:[],errors:[],
    limits:['Two authored model45 heads, four camera bearings and one retained morph pose each; no full18-phase repeat.',
      'Native heading must be loaded independently from canonical scenery records before comparing draw commands.',
      'Headless software/hardware renderer identity is reported; no native GPU or FPS certification.',
      'Mode3/base8/default149 source headings are covered by the native postprocessor check, not their browser artwork.'] }
  const save = () => writeFileSync(join(output,'evidence.json'),JSON.stringify(report,null,2)+'\n')
  const browser = await chromium.launch({headless:true})
  const deadline = setTimeout(()=>void browser.close(),Math.max(1,Math.min(180000,Date.parse(process.env.PND_QUEUE_DEADLINE)-Date.now()-30000)))
  process.on('SIGTERM',()=>void browser.close())
  try {
    const context = await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1})
    for (const item of cases) {
      const page = await context.newPage();page.setDefaultTimeout(15000)
      page.on('pageerror',error=>report.errors.push(error.stack??error.message))
      await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000})
      await page.getByRole('button',{name:`Mission ${item.mission}`,exact:true}).press('Enter')
      await bindGame(page)
      await page.evaluate(()=>document.querySelector('.skip-introduction')?.click())
      await page.waitForFunction(()=>!window.testScene.world.inputMask)
      await page.evaluate(async item=>{
        const {advanceGame}=await import('/app/game-clock.ts'),{stoneHeadFrame}=await import('/app/stone-head-animation.ts')
        const s=window.testScene,w=s.world,h=w.shrines.find(h=>h.kind===item.kind)
        window.orientationHead=h;w.paused=true;w.speed=0;cancelAnimationFrame(s.frame)
        // Use a real presentation pose; advancing the existing clock changes no
        // simulation turns at speed0. The orientation is never forced by the test.
        for(let n=0;stoneHeadFrame(h.stoneHead)!==9&&n<18;n++){
          w.paused=false;advanceGame(w,s.gameClock,1/24);w.paused=true
        }
        s.focus(h);s.viewPreset=0;s.viewZoom=0;s.viewTransition=null
        window.drawOrientation=()=>{s.animate(s.previous);cancelAnimationFrame(s.frame)}
      },item)
      if (!report.environment) report.environment=await page.evaluate(()=>{
        const gl=window.testScene.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info')
        return{renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),viewport:[innerWidth,innerHeight],dpr:devicePixelRatio}
      })
      for (const bearing of [0,512,1024,1536]) {
        const frame=await page.evaluate(async ({item,bearing})=>{
          const {stoneHeadFrame}=await import('/app/stone-head-animation.ts'),s=window.testScene,h=window.orientationHead
          s.cameraBearing=bearing*Math.PI/1024;s.updateView();window.drawOrientation()
          const root=s.shrineMeshes.get(h.id).g,mesh=root.children[0],d=mesh.userData
          const origin=mesh.getWorldPosition(mesh.position.clone()),attr=name=>Array.from(mesh.geometry.getAttribute(name).array)
          return{mission:item.mission,preset:s.viewPreset,bearing,projection:s.view.projection,center:s.view.center,
            rotationY:root.rotation.y,checkpointState:structuredClone(h.stoneHead),
            models:[{id:d.nativeModel,sceneryIndex:item.sceneryIndex,heading:root.userData.nativeHeading,stoneFrame:stoneHeadFrame(h.stoneHead),
              scale:d.nativeScale,size:d.nativeSize??d.nativeScale,tilt:root.userData.nativeTilt??0,roll:root.userData.nativeRoll??0,
              position:[Math.round((origin.x+8)*256)&65535,Math.round((-origin.z-8)*256)&65535,Math.round(origin.y*128)],
              relative:s.view.relative(origin,(origin.y*128)/45),vertices:attr('position'),shades:attr('faceShade'),biases:attr('painterBias'),
              picking:s.picking.model(mesh,'rotation-'+h.id).map(c=>c.kind==='bounds'?{kind:c.kind,bounds:c.bounds,bucket:c.bucket}:{kind:c.kind,points:c.points,bucket:c.bucket}),
              submitted:Array.from({length:mesh.geometry.getAttribute('position').count/3},(_,n)=>s.view.painter.depth(mesh,n,0)<=1)}]}
        },{item,bearing})
        const model=frame.models[0]
        assert.equal(model.heading,item.heading)
        assert.ok(Math.abs(frame.rotationY+item.heading*Math.PI/1024)<1e-9)
        assert.equal(model.stoneFrame,9)
        const basis=modelMatrix(model.heading,model.tilt,model.roll),points=[]
        for(let j=0;j<model.vertices.length;j+=3){
          const raw=model.vertices.slice(j,j+3).map((x,a)=>Math.round(x*model.scale*3*(a===2?-1:1)))
          points.push(projectPoint(modelPoint(raw,model.size,basis,model.relative),frame.projection))
        }
        model.triangles=[]
        for(let j=0;j<points.length;j+=3){
          const triangle=points.slice(j,j+3),visible=modelTriangleVisible(triangle,frame.projection.width,frame.projection.height)
          assert.equal(model.submitted[j/3],visible)
          if(visible)model.triangles.push({screen:triangle.flatMap(p=>[p.screenX,p.screenY]),shade:modelShade(model.shades[j],triangle[0].z),bucket:polygonBucket(triangle.map(p=>p.z),model.biases[j])})
        }
        assert.ok(model.triangles.length>0)
        const pick=await page.evaluate(()=>{
          const s=window.testScene,h=window.orientationHead,mesh=s.shrineMeshes.get(h.id).g.children[0],rect=s.container.getBoundingClientRect()
          for(const p of s.picking.model(mesh,'rotation-pick-'+h.id)){
            if(p.kind!=='model')continue
            const x=p.points.reduce((n,p)=>n+p.x,0)/3,y=p.points.reduce((n,p)=>n+p.y,0)/3
            if(x<1||y<1||x>=rect.width-1||y>=rect.height-1)continue
            const event={clientX:rect.left+x,clientY:rect.top+y}
            if(s.picking.pick(event)===h.id)return{...event,id:h.id}
          }
          return null
        })
        assert.ok(pick,'Correctly oriented authored mesh must be pickable')
        await page.mouse.move(pick.clientX,pick.clientY)
        await page.evaluate(()=>window.drawOrientation())
        assert.equal(await page.evaluate(()=>window.testScene.hoveredObject),pick.id)
        for(const k of ['vertices','shades','biases','submitted'])delete model[k]
        report.frames.push(frame)
        await page.screenshot({path:join(output,`mission-${item.mission}-bearing-${bearing}.png`)})
      }
      // Restore through the unchanged real store body; no animation replay or
      // producer injection. Read the postrestore world before intentional resume.
      const prior=await page.evaluate(()=>({head:structuredClone(window.orientationHead),world:window.testScene.world.outcome.level}))
      assert.equal(await page.evaluate(()=>window.testStore.saveCheckpoint()),true)
      assert.equal(await page.evaluate(()=>window.testStore.loadCheckpoint()),true)
      await bindGame(page)
      const after=await page.evaluate(async kind=>{
        const s=window.testScene,h=s.world.shrines.find(h=>h.kind===kind)
        s.world.paused=true;s.focus(h);s.animate(s.previous);cancelAnimationFrame(s.frame)
        return{heading:s.shrineMeshes.get(h.id).g.userData.nativeHeading,head:structuredClone(h),world:s.world.outcome.level}
      },item.kind)
      assert.equal(after.heading,item.heading);assert.equal(after.world,prior.world)
      assert.deepEqual(after.head,prior.head)
      report.stages.push({mission:item.mission,authoredHeading:item.heading,cameraBearings:4,actualPointerPick:true,checkpointIdentityAndPhasePreserved:true})
      await page.close();save()
    }
    writeFileSync(join(output,'native-model-input.json'),JSON.stringify(report.frames)+'\n')
    assert.deepEqual(report.errors,[])
    report.status='PASS_STONE_HEAD_ORIENTATION_BROWSER_PENDING_NATIVE'
  }catch(error){report.status='FAILED_STONE_HEAD_ORIENTATION_BROWSER';report.error=error.stack??String(error);process.exitCode=1}
  finally{clearTimeout(deadline);await browser.close();report.browserClosed=true;report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({status:report.status,error:report.error,stages:report.stages,views:report.frames.length,output},null,2))}
}
