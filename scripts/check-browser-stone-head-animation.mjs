// Run only in the canonical queue, using the owned headless page and output path.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { chromium } from '@playwright/test'
import { bindGame } from './browser-game.mjs'
import { modelMatrix, modelPoint, projectPoint } from '../app/projection.ts'
import { modelShade } from '../app/model-lighting.ts'
import { modelTriangleVisible, polygonBucket } from '../app/painter-order.ts'
import { modelStage, modelTextureModes, modelDepthBias } from '../app/model-faces.ts'
import { stoneHeadPositions } from '../app/stone-head-animation.ts'
import models from '../app/original-models.json' with { type: 'json' }

assert.ok(process.env.PND_QUEUE_JOB_ID && process.env.PND_QUEUE_DEADLINE, 'Use the canonical shared queue')
const argument = process.argv.indexOf('--output-dir')
assert.ok(argument >= 0 && process.argv[argument + 1])
const output = resolve(process.argv[argument + 1]), url = process.env.POPULOUS_URL ?? 'http://127.0.0.1:4318'
assert.equal(new URL(url).port, '4318')
mkdirSync(output, { recursive: false })
const report = { startedAt: new Date().toISOString(), jobId: process.env.PND_QUEUE_JOB_ID, stages: [], frames: [], errors: [],
  limits: ['Headless rendering is not display-refresh performance evidence.', 'Enemy-AI/Blue-only fixture reuses the existing worship regression; normal command/path/admission/reward handlers run.', 'Last-use exhaustion changes remaining-use count only, explicitly labelled; it does not force work or reward.', 'No nativeGPU/frame-rate/audio193 or other Stone Head-family acceptance.'] }
const save = () => writeFileSync(join(output, 'evidence.json'), JSON.stringify(report, null, 2) + '\n')
const browser = await chromium.launch({ headless: true })
const timer = setTimeout(() => { report.expired = true; void browser.close() }, Math.max(1, Math.min(300000, Date.parse(process.env.PND_QUEUE_DEADLINE) - Date.now() - 30000)))
process.on('SIGTERM', () => void browser.close())
process.on('SIGINT', () => void browser.close())
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.setDefaultTimeout(20000)
  page.on('pageerror', error => report.errors.push(error.stack ?? error.message))
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  // Existing startup layout can position this button outside pointer viewport;
  // activate its real keyboard handler inside the owned headless page.
  await page.getByRole('button', { name: 'Mission 1', exact: true }).press('Enter')
  await bindGame(page)
  const skip = page.getByRole('button', { name: /Skip introduction/ })
  if (await skip.isVisible()) await skip.click()
  await bindGame(page)
  await page.waitForFunction(() => !window.testScene.world.inputMask)
  await page.evaluate(async () => {
    window.testScene = window.testSceneRef.current
    const s = window.testScene, w = s.world
    const { advanceGame } = await import('/app/game-clock.ts')
    const { stoneHeadFrame } = await import('/app/stone-head-animation.ts')
    w.paused = true; w.speed = 0; cancelAnimationFrame(s.frame)
    window.stoneHead = w.shrines.find(h => h.kind === 'bridge')
    if (!window.stoneHead?.stoneHead) throw Error('Authored model45 head was not initialized')
    s.focus(window.stoneHead) // game camera only; no OS window focus operation
    s.cameraBearing = 0; s.viewPreset = 0; s.viewZoom = 0; s.viewTransition = null
    s.updateView()
    window.renderStone = () => { s.animate(s.previous); cancelAnimationFrame(s.frame) }
    window.stepStone = () => { w.paused = false; advanceGame(w, s.gameClock, 1 / 24); w.paused = true }
    for (let i = 0; stoneHeadFrame(window.stoneHead.stoneHead) !== 0 && i < 18; i++) window.stepStone()
    window.renderStone()
  })
  report.environment = await page.evaluate(() => {
    const s = window.testScene, gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
    return { renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), viewport: [innerWidth, innerHeight], dpr: devicePixelRatio, visible: !document.hidden }
  })
  report.browser = browser.version()
  const geometryIds = new Set(), materialIds = new Set(), pixelHashes = new Set()
  for (let phase = 0; phase < 18; phase++) {
    const frame = await page.evaluate(async () => {
      const { stoneHeadFrame } = await import('/app/stone-head-animation.ts')
      const s = window.testScene, head = window.stoneHead
      window.renderStone()
      const root = s.shrineMeshes.get(head.id).g, mesh = root.children[0]
      const origin = mesh.getWorldPosition(mesh.position.clone()), d = mesh.userData
      const attr = name => Array.from(mesh.geometry.getAttribute(name).array)
      const gl = s.renderer.getContext(), pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
      // Fresh render immediately before reading, avoiding a discarded default buffer.
      s.renderer.render(s.scene, s.camera)
      gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels)
      let checksum = 2166136261
      for (let i = 0; i < pixels.length; i += 4) checksum = Math.imul(checksum ^ (pixels[i] | pixels[i+1] << 8 | pixels[i+2] << 16), 16777619) >>> 0
      return { preset: s.viewPreset, bearing: s.cameraBearing, projection: s.view.projection, center: s.view.center,
        followers: head.followers, visible: root.visible, geometry: mesh.geometry.uuid, material: mesh.material.uuid, pixelChecksum: checksum,
        models: [{ id: d.nativeModel, stoneFrame: stoneHeadFrame(head.stoneHead),
          scale: d.nativeScale, size: d.nativeSize ?? d.nativeScale,
          heading: root.userData.nativeHeading ?? 0, tilt: root.userData.nativeTilt ?? 0, roll: root.userData.nativeRoll ?? 0,
          position: [Math.round((origin.x+8)*256)&65535,Math.round((-origin.z-8)*256)&65535,Math.round(origin.y*128)],
          relative: s.view.relative(origin,(origin.y*128)/45), vertices: attr('position'), uv: attr('uv'), modes: attr('textureMode'),
          shades: attr('faceShade'), biases: attr('painterBias'),
          picking: s.picking.model(mesh,'stone-pose-'+head.id).map(c => c.kind==='bounds'?{kind:c.kind,bounds:c.bounds,bucket:c.bucket}:{kind:c.kind,points:c.points,bucket:c.bucket}),
          submitted: Array.from({length:mesh.geometry.getAttribute('position').count/3},(_,i)=>s.view.painter.depth(mesh,i,0)<=1) }],
        renderInfo: { ...s.renderer.info.render } }
    })
    const model = frame.models[0]
    assert.equal(model.id,45); assert.equal(model.stoneFrame,phase); assert.equal(frame.followers,0); assert.equal(frame.visible,true)
    assert.deepEqual(model.vertices,[...stoneHeadPositions(phase)])
    assert.deepEqual(model.uv,[...new Float32Array(modelStage(models[45],4).uv)])
    assert.deepEqual(model.modes,[...new Float32Array(modelTextureModes(models[45],4))])
    assert.deepEqual(model.biases,[...new Float32Array(modelDepthBias(models[45],4))])
    const basis=modelMatrix(model.heading,model.tilt,model.roll), points=[]
    for(let i=0;i<model.vertices.length;i+=3){
      const raw=model.vertices.slice(i,i+3).map((n,a)=>Math.round(n*model.scale*3*(a===2?-1:1)))
      points.push(projectPoint(modelPoint(raw,model.size,basis,model.relative),frame.projection))
    }
    model.triangles=[]
    for(let i=0;i<points.length;i+=3){
      const p=points.slice(i,i+3), visible=modelTriangleVisible(p,frame.projection.width,frame.projection.height)
      assert.equal(model.submitted[i/3],visible)
      if(visible)model.triangles.push({screen:p.flatMap(v=>[v.screenX,v.screenY]),shade:modelShade(model.shades[i],p[0].z),bucket:polygonBucket(p.map(v=>v.z),model.biases[i])})
    }
    assert.ok(model.triangles.length>0)
    geometryIds.add(frame.geometry);materialIds.add(frame.material);pixelHashes.add(frame.pixelChecksum)
    for(const key of ['vertices','uv','modes','shades','biases','submitted'])delete model[key]
    report.frames.push(frame)
    if([0,4,9,13].includes(phase))await page.screenshot({path:join(output,`idle-phase-${phase}.png`)})
    await page.evaluate(()=>window.stepStone())
  }
  assert.equal(geometryIds.size,1);assert.equal(materialIds.size,1);assert.ok(pixelHashes.size>1)
  writeFileSync(join(output,'native-model-input.json'),JSON.stringify(report.frames)+'\n')
  report.stages.push({idleFrames:18,withoutFollowers:true,distinctPixelChecksums:pixelHashes.size,geometryAndMaterialReused:true})
  save()
  // Actual headless-page pointer dispatch into the shipped picking/command route.
  const click = await page.evaluate(() => {
    const s=window.testScene,w=s.world,head=window.stoneHead
    w.manaWorld.gameFlags=32;w.units=w.units.filter(u=>u.team==='blue');w.selected=w.units.map(u=>u.id)
    w.paused=false;w.speed=0;window.renderStone()
    const p=s.screen(head),r=s.container.getBoundingClientRect()
    return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}
  })
  await page.mouse.click(click.x,click.y)
  assert.equal(await page.evaluate(()=>window.testScene.world.units[0].native?.commandStatus),27)
  report.worship = await page.evaluate(async () => {
    const {advanceGame}=await import('/app/game-clock.ts'),{liveWorshippers}=await import('/app/live-worship.ts')
    const {stoneHeadFrame}=await import('/app/stone-head-animation.ts')
    const s=window.testScene,w=s.world,head=window.stoneHead,history=[]
    cancelAnimationFrame(s.frame);w.paused=false;w.speed=1
    for(let i=0;i<560;i++){
      advanceGame(w,s.gameClock,1/24)
      history.push({turn:w.turn,uses:head.uses,enabled:head.enabled,frame:stoneHeadFrame(head.stoneHead),shots:w.shots.bridge,followers:head.followers})
    }
    w.paused=true;window.renderStone()
    const mesh=s.shrineMeshes.get(head.id).g.children[0]
    return{history,uses:head.uses,shots:w.shots.bridge,roster:liveWorshippers(w,head).map(p=>p.id),renderedFrame:mesh.userData.stoneHeadFrame,expectedFrame:stoneHeadFrame(head.stoneHead)}
  })
  assert.ok(report.worship.uses>0&&report.worship.shots>0);assert.equal(report.worship.roster.length,7)
  assert.ok(report.worship.history.some(h=>!h.enabled&&h.frame===1),'Disabled reward/refill interval must hold nativeframe1')
  assert.equal(report.worship.renderedFrame,report.worship.expectedFrame)
  await page.screenshot({path:join(output,'ordinary-worship-reward.png')})
  const checkpointState=await page.evaluate(()=>window.stoneHead.stoneHead)
  assert.equal(await page.evaluate(()=>window.testStore.saveCheckpoint()),true)
  const restored=await context.newPage();restored.setDefaultTimeout(20000)
  await restored.goto(url,{waitUntil:'domcontentloaded'})
  await restored.getByRole('button',{name:'Load Game',exact:true}).press('Enter')
  await bindGame(restored)
  const loaded=await restored.evaluate(()=>window.testScene.world.shrines.find(h=>h.kind==='bridge').stoneHead)
  assert.deepEqual(loaded,checkpointState)
  await restored.close()
  report.stages.push({newPageCheckpointPhasePreserved:true})
  report.exhaustion=await page.evaluate(async()=>{
    const {advanceGame}=await import('/app/game-clock.ts'),{stoneHeadFrame}=await import('/app/stone-head-animation.ts')
    const s=window.testScene,w=s.world,head=window.stoneHead,priorUses=head.uses
    // Explicit final-use edge fixture; do not force followers, work or gifts.
    head.remaining=1;w.paused=false;w.speed=1;let visits=0
    while(head.active&&visits++<2600)advanceGame(w,s.gameClock,1/24)
    const a=stoneHeadFrame(head.stoneHead)
    advanceGame(w,s.gameClock,1/24);w.paused=true;window.renderStone()
    return{active:head.active,remaining:head.remaining,uses:head.uses,priorUses,visits,
      visible:s.shrineMeshes.get(head.id).g.visible,phaseBefore:a,phaseAfter:stoneHeadFrame(head.stoneHead),
      fixture:'Onlyremaininguses=1; existing normal worship/target/reward handlers complete the next use.'}
  })
  assert.equal(report.exhaustion.active,false);assert.equal(report.exhaustion.remaining,0)
  assert.ok(report.exhaustion.uses>report.exhaustion.priorUses);assert.equal(report.exhaustion.visible,true)
  assert.notEqual(report.exhaustion.phaseBefore,report.exhaustion.phaseAfter)
  await page.screenshot({path:join(output,'exhausted-trigger-retained-stone.png')})
  report.pause=await page.evaluate(async()=>{
    const {advanceGame}=await import('/app/game-clock.ts'),s=window.testScene,h=window.stoneHead
    const before=JSON.stringify(h.stoneHead);s.world.paused=true;advanceGame(s.world,s.gameClock,3)
    const mesh=s.shrineMeshes.get(h.id).g.children[0],position=mesh.geometry.getAttribute('position'),version=position.version
    const costs=[];for(let i=0;i<12;i++){const start=performance.now();window.renderStone();costs.push(performance.now()-start)}
    return{unchanged:before===JSON.stringify(h.stoneHead),positionVersionStable:position.version===version,costs,
      limit:'12paused draw calls only; not actualRAF/pairedFPS/nonregression certification.'}
  })
  assert.equal(report.pause.unchanged,true);assert.equal(report.pause.positionVersionStable,true)
  assert.deepEqual(report.errors,[]);assert.equal(report.expired,undefined)
  report.status='PASS_STONE_HEAD_45_LIVE_PENDING_ORIGINAL_SUBMISSION_COMPARISON'
}catch(error){report.status='FAILED_STONE_HEAD_LIVE';report.error=error.stack??String(error);process.exitCode=1}
finally{
  clearTimeout(timer);await browser.close();report.browserClosed=true;report.finishedAt=new Date().toISOString();save()
  console.log(JSON.stringify({status:report.status,error:report.error,environment:report.environment,stages:report.stages,
    views:report.frames.length,worshipUses:report.worship?.uses,exhaustion:report.exhaustion,output,browserClosed:true},null,2))
}
