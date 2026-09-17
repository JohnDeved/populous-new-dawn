import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {bindGame} from './browser-game.mjs'

const browser=await chromium.launch({headless:true})
try {
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[]
 page.on('pageerror',error=>errors.push(error.stack??error.message))
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
 await page.goto(process.env.POPULOUS_URL??'http://127.0.0.1:4318',{waitUntil:'domcontentloaded',timeout:45000})
 await page.getByRole('button',{name:'Mission 23',exact:true}).waitFor({timeout:20000})
 await page.getByRole('button',{name:'Mission 23',exact:true}).click()
 await bindGame(page)
 if(await page.evaluate(()=>!!window.testScene.world.inputMask))await page.keyboard.press('Escape')
 await page.waitForFunction(()=>!window.testScene.world.inputMask)
 const result=await page.evaluate(async()=>{
  const s=window.testScene,w=s.world,m=await import('/app/model.ts')
  cancelAnimationFrame(s.frame)
  w.units=[];w.buildings=[];w.trees=[];w.shrines=[];w.selected=[]
  w.terrain.fill(3);w.terrainVersion++;w.manaWorld.gameFlags=32;w.speed=0
  const first=m.addUnit(w,'blue','brave',{x:0,z:8})
  const second=m.addUnit(w,'red','brave',{x:0,z:8})
  const hut=m.addBuilding(w,'blue','hut',{x:8,z:8},true)
  s.focus({x:2,z:8});s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  const r=s.renderer.domElement.getBoundingClientRect()
  const p=s.unitScreen(second.id),frame=s.unitMeshes.get(second.id).userData.frameHeight
  const event={clientX:r.left+(p.x+1)*r.width/2,clientY:r.top+(1-p.y)*r.height/2-frame/2}
  const picked=s.picking.pick(event),owned=s.pickUnit(event)?.id??null
  w.units.reverse();s.animate(s.previous);cancelAnimationFrame(s.frame)
  const reversed=s.picking.pick(event)
  second.x=12;s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  const moved=s.picking.pick(event)
  second.x=0;s.onChange();s.animate(s.previous);cancelAnimationFrame(s.frame)
  const g=s.buildingMeshes.get(hut.id),mesh=g.children.find(c=>c.userData.nativeModel!==undefined)
  const commands=s.picking.model(mesh,'test'),faces=commands.filter(c=>c.kind==='model')
  let target
  for(const face of faces){
   const x=Math.trunc(face.points.reduce((a,p)=>a+p.x,0)/3),y=Math.trunc(face.points.reduce((a,p)=>a+p.y,0)/3)
   const e={clientX:r.left+x,clientY:r.top+y}
   if(s.pickWorldObject(e)?.id===hut.id){target={...e,id:hut.id};break}
  }
  if(!target)throw Error('Hut has no selectable face')
  const samples=[]
  for(let i=0;i<30;i++){
   // Distinct pixels defeat pointer-result and terrain-result caching.
   const start=performance.now()
   s.picking.pick({clientX:target.clientX+(i%7)-3,clientY:target.clientY+Math.floor(i/7)-2})
   samples.push(performance.now()-start)
  }
  samples.sort((a,b)=>a-b)
  return {first:first.id,second:second.id,picked,owned,reversed,moved,target,samples:{median:samples[15],p95:samples[28]}}
 })
 assert.equal(result.picked,result.second,'the later painted enemy owns the overlapping sprite rectangle')
 assert.equal(result.owned,null,'the enemy blocks selection of the friendly behind it')
 assert.equal(result.reversed,result.second,'world array order does not decide hits')
 assert.equal(result.moved,result.first,'moving the top unit invalidates the prior pointer result')
 await page.evaluate(id=>{window.testScene.world.selected=[id]},result.first)
 await page.mouse.click(result.target.clientX,result.target.clientY)
 assert.equal(await page.evaluate(id=>window.testScene.world.units.find(u=>u.id===id).work,result.first),result.target.id,'a visible building click issues the building order')
 const reviewCases=await page.evaluate(async({target,firstId})=>{
  const s=window.testScene,w=s.world,
    shapes=await import('/app/building-shapes.ts'),
    terrainRuntime=await import('/app/world-terrain-runtime.ts'),
    types=await import('/app/world-types.ts')
  const directCandidates=s.view.pickCandidates.bind(s.view)
  const rect=()=>s.renderer.domElement.getBoundingClientRect()
  const mouse=event=>{
   const r=rect(),x=Math.trunc(event.clientX-r.left),y=Math.trunc(event.clientY-r.top)
   return s.mouse.clone().set((x*2)/r.width-1,1-(y*2)/r.height)
  }
  const signature=hit=>{
   if(!hit)return null
   const command=s.view.painter.command(hit.object,hit.triangle,hit.instance)
   return [hit.object.id,hit.triangle,hit.instance,Number(hit.depth.toFixed(6)),command?.bucket??null,command?.cell??null,command?.phase??null,command?.object??null,command?.face??null]
  }
  const identity=hit=>hit&&[hit.object.id,hit.triangle,hit.instance]
  const compare=(event,label)=>{
   s.picking.lastKey=''
   const picked=s.picking.pick(event),r=rect(),pixel=`${Math.trunc(event.clientX-r.left)},${Math.trunc(event.clientY-r.top)}`,
     candidates=s.picking.groundHits.get(pixel)
   if(!candidates)throw Error(`${label}: ScenePicking did not cache terrain candidates`)
   const cached=s.view.resolvePickCandidates(candidates),
     fresh=s.view.resolvePickCandidates(directCandidates(mouse(event),[s.terrain],s.camera,true)),
     a=signature(cached),b=signature(fresh)
   if(JSON.stringify(a)!==JSON.stringify(b))throw Error(`${label}: cached ${JSON.stringify(a)} != fresh ${JSON.stringify(b)}`)
   return {picked,signature:a,key:s.picking.groundKey,candidates:candidates.length}
  }
  const render=()=>s.renderSceneFrame(null,null)
  render()
  const stable=compare(target,'stable')

  // Isolate camera/view invalidation at the same pixel with unchanged land state.
  const first=w.units.find(u=>u.id===firstId),savedFirst={x:first.x,z:first.z},savedPoint={...s.viewPoint},savedBearing=s.cameraBearing
  first.x=s.viewPoint.x;first.z=s.viewPoint.z;s.updateUnitsFrame();render()
  const r0=rect(),p0=s.unitScreen(firstId),frame=s.unitMeshes.get(firstId).userData.frameHeight,
    centerEvent={clientX:r0.left+(p0.x+1)*r0.width/2,clientY:r0.top+(1-p0.y)*r0.height/2-frame/2},
    originalPickCandidates=s.view.pickCandidates.bind(s.view)
  let queries=0
  s.view.pickCandidates=(...args)=>{queries++;return originalPickCandidates(...args)}
  s.picking.groundKey='';s.picking.groundHits.clear();s.picking.lastKey=''
  compare(centerEvent,'camera-base')
  const baseQueries=queries,landVersion=w.landVersion
  compare(centerEvent,'camera-repeat')
  if(queries!==baseQueries)throw Error('same pixel/view did not reuse terrain candidates')
  s.cameraBearing=(savedBearing+Math.PI/2)%(Math.PI*2);s.updateView()
  compare(centerEvent,'camera-only')
  if(queries<=baseQueries)throw Error('camera change did not invalidate terrain candidates')
  if(w.landVersion!==landVersion)throw Error('camera invalidation was confounded by landVersion')
  s.cameraBearing=savedBearing;s.updateView();render()

  // Real pre-render pick -> render -> same-pixel revisit. Move camera center and the
  // test person together so the pointer target is unchanged while submitted terrain changes.
  const shift=4
  s.viewPoint={x:savedPoint.x+shift,z:savedPoint.z};first.x+=shift;s.updateView();s.updateUnitsFrame()
  const submissionBefore=s.view.pickSubmissionKey([s.terrain]),queriesBefore=queries
  compare(centerEvent,'submission-prerender')
  const preRenderQueries=queries
  if(preRenderQueries<=queriesBefore)throw Error('pre-render view change did not invalidate candidates')
  render()
  const submissionAfter=s.view.pickSubmissionKey([s.terrain])
  if(submissionAfter===submissionBefore)throw Error('rendered terrain submission change was not detected')
  compare(centerEvent,'submission-postrender')
  if(queries<=preRenderQueries)throw Error('post-render submitted terrain did not invalidate candidates')
  s.viewPoint=savedPoint;first.x=savedFirst.x;first.z=savedFirst.z;s.updateView();s.updateUnitsFrame();render()
  s.view.pickCandidates=originalPickCandidates

  // Natural Mission23 footprint coverage. The real footprint toggles painter ordering
  // without changing landVersion, but this chosen camp does not necessarily provide
  // an object/triangle/instance winner crossing. Keep that outcome explicit while
  // still requiring overlap plus cached-vs-fresh agreement across remove/restore.
  const hut=w.buildings.find(b=>b.id===target.id),pose=shapes.buildingPose(hut),registered={...pose,id:hut.id,tribe:types.tribeForTeam(hut.team)},
    footprintVersion=w.landVersion,footprintCells=shapes.buildingFootprintCells(registered),candidateSets=[]
  if(!footprintCells.some(i=>w.land.flags[i]&0x200))throw Error('natural footprint was not registered before removal')
  for(let dy=-28;dy<=28;dy+=4)for(let dx=-28;dx<=28;dx+=4){
   const event={clientX:target.clientX+dx,clientY:target.clientY+dy},candidates=directCandidates(mouse(event),[s.terrain],s.camera,true),winner=s.view.resolvePickCandidates(candidates)
   if(candidates.length>1)candidateSets.push({event,candidates,on:signature(winner),onIdentity:identity(winner)})
  }
  if(!candidateSets.length)throw Error('natural footprint sample has no overlapping terrain candidates')
  shapes.registerBuildingFootprint(w.land,registered,0,i=>w.land.shadows[i]&15,()=>{})
  if(w.landVersion!==footprintVersion)throw Error('footprint removal unexpectedly changed landVersion')
  if(footprintCells.some(i=>w.land.flags[i]&0x200))throw Error('footprint removal left occupied terrain flags set')
  render()
  let identityChanges=0,signatureChanges=0
  for(const entry of candidateSets){
   const cached=s.view.resolvePickCandidates(entry.candidates),fresh=s.view.pick(mouse(entry.event),[s.terrain],s.camera,true),
     cachedSignature=signature(cached),freshSignature=signature(fresh),offIdentity=identity(cached)
   if(JSON.stringify(cachedSignature)!==JSON.stringify(freshSignature))throw Error('footprint removal cached winner differs from fresh winner')
   if(JSON.stringify(cachedSignature)!==JSON.stringify(entry.on))signatureChanges++
   if(JSON.stringify(offIdentity)!==JSON.stringify(entry.onIdentity))identityChanges++
  }
  shapes.registerBuildingFootprint(w.land,registered,1,i=>w.land.shadows[i]&15,()=>{})
  if(w.landVersion!==footprintVersion)throw Error('footprint addition unexpectedly changed landVersion')
  if(footprintCells.some(i=>!(w.land.flags[i]&0x200)))throw Error('footprint addition did not restore occupied terrain flags')
  render()
  for(const entry of candidateSets){
   const cached=s.view.resolvePickCandidates(entry.candidates),fresh=s.view.pick(mouse(entry.event),[s.terrain],s.camera,true),
     cachedSignature=signature(cached),freshSignature=signature(fresh)
   if(JSON.stringify(cachedSignature)!==JSON.stringify(freshSignature))throw Error('footprint restoration cached winner differs from fresh winner')
   if(JSON.stringify(identity(cached))!==JSON.stringify(entry.onIdentity))throw Error('footprint restoration did not restore original terrain winner identity')
  }
  const naturalFootprint={naturalGameplay:true,overlappingPixels:candidateSets.length,signatureChanges,identityChanges,naturalIdentityWitness:identityChanges>0}

  // Actual terrain edits rebuild CPU geometry before render. Compare cached/fresh
  // both before and after the following render, then restore the terrain.
  const native=terrainRuntime.nativePosition(w,hut),cell=((native.y&65535)>>9)*128+((native.x&65535)>>9),height=w.land.heights[cell],beforeEdit=w.landVersion
  compare(target,'terrain-before')
  w.land.heights[cell]=height+4;terrainRuntime.refreshTerrainSurface(w);s.updateTerrainFrame()
  if(w.landVersion===beforeEdit)throw Error('terrain edit did not advance landVersion')
  const terrainPre=compare(target,'terrain-prerender')
  render()
  const terrainPost=compare(target,'terrain-postrender')
  w.land.heights[cell]=height;terrainRuntime.refreshTerrainSurface(w);s.updateTerrainFrame();render()

  // Zoom gets its own cache dependency check, independent of the camera/land case.
  const savedZoom=s.viewZoom
  s.viewZoom=savedZoom+1;s.updateView()
  const zoomTarget=(()=>{
   const g=s.buildingMeshes.get(hut.id),mesh=g.children.find(c=>c.userData.nativeModel!==undefined),viewKey=[s.view.center.x,s.view.center.y,s.view.rawCenter.x,s.view.rawCenter.y,...Object.values(s.view.projection)].join(','),faces=s.picking.model(mesh,viewKey).filter(c=>c.kind==='model'),r=rect()
   for(const face of faces){const x=Math.trunc(face.points.reduce((a,p)=>a+p.x,0)/3),y=Math.trunc(face.points.reduce((a,p)=>a+p.y,0)/3),event={clientX:r.left+x,clientY:r.top+y};s.picking.lastKey='';if(s.picking.pick(event)===hut.id)return event}
   throw Error('zoomed hut has no selectable face')
  })()
  const zoomPre=compare(zoomTarget,'zoom-prerender');render();const zoomPost=compare(zoomTarget,'zoom-postrender')
  s.viewZoom=savedZoom;s.updateView();render()
  return {stable,cameraQueries:queries,submissionBefore,submissionAfter,footprint:naturalFootprint,terrain:{pre:terrainPre.signature,post:terrainPost.signature},zoom:{pre:zoomPre.signature,post:zoomPost.signature}}
 },{target:result.target,firstId:result.first})
 assert.equal(reviewCases.footprint.naturalGameplay,true)
 assert.ok(reviewCases.footprint.overlappingPixels>0,'natural footprint sample retains overlapping terrain candidates')
 let cacheQueries=0
 for(const [width,height] of [[1440,1000],[3440,1440]]){
  await page.setViewportSize({width,height})
  cacheQueries+=await page.evaluate(async hutId=>{
   const s=window.testScene
   let count=0
   for(const bearing of [0,Math.PI/2,Math.PI]){
    s.cameraBearing=bearing;s.updateView();s.animate(s.previous);cancelAnimationFrame(s.frame)
    for(const x of [-.5,0,.5])for(const y of [-.5,0,.5]){
     const query=()=>s.view.pick(s.mouse.clone().set(x,y),[s.terrain],s.camera,true)
     const a=query();s.view.groundPickCache=new WeakMap();const b=query()
     const result=h=>h&&[h.triangle,h.instance,h.depth,h.point]
     if(JSON.stringify(result(a))!==JSON.stringify(result(b)))throw Error('Stale projected terrain after camera/display change')
     count++
    }
   }
   // Exercise ScenePicking itself after the real viewport resize. The cached
   // candidate winner must match a fresh current-submission query at the resized target.
   s.setSize();s.updateView();s.renderSceneFrame(null,null)
   const hutGroup=s.buildingMeshes.get(hutId),hutMesh=hutGroup.children.find(c=>c.userData.nativeModel!==undefined),
     viewKey=[s.view.center.x,s.view.center.y,s.view.rawCenter.x,s.view.rawCenter.y,...Object.values(s.view.projection)].join(','),
     faces=s.picking.model(hutMesh,viewKey).filter(c=>c.kind==='model'),r=s.renderer.domElement.getBoundingClientRect()
   let target=null
   for(const face of faces){
    const x=Math.trunc(face.points.reduce((a,p)=>a+p.x,0)/3),y=Math.trunc(face.points.reduce((a,p)=>a+p.y,0)/3),event={clientX:r.left+x,clientY:r.top+y}
    s.picking.lastKey=''
    if(s.picking.pick(event)===hutId){target=event;break}
   }
   if(!target)throw Error('Resized hut has no selectable face')
   s.picking.lastKey='';s.picking.pick(target)
   const px=`${Math.trunc(target.clientX-r.left)},${Math.trunc(target.clientY-r.top)}`,
     cached=s.picking.groundHits.get(px),mouse=s.mouse.clone().set(((target.clientX-r.left)*2)/r.width-1,1-((target.clientY-r.top)*2)/r.height)
   if(!cached)throw Error('Resize did not populate ScenePicking terrain candidates')
   const result=h=>h&&[h.object.id,h.triangle,h.instance,Number(h.depth.toFixed(6))],
     a=result(s.view.resolvePickCandidates(cached)),b=result(s.view.pick(mouse,[s.terrain],s.camera,true))
   if(JSON.stringify(a)!==JSON.stringify(b))throw Error('ScenePicking cache differs from fresh pick after viewport resize')

   // A new position buffer may have the same version as the old one.
   const mesh=s.buildingMeshes.values().next().value.children.find(c=>c.userData.nativeModel!==undefined)
   const modelBefore=s.picking.model(mesh,'same-view'),position=mesh.geometry.getAttribute('position').clone()
   for(let i=0;i<position.count;i++)position.setY(i,position.getY(i)+1)
   mesh.geometry.setAttribute('position',position)
   const modelAfter=s.picking.model(mesh,'same-view')
   if(modelBefore===modelAfter)throw Error('Model picking reused replaced geometry')
   return count
  },result.target.id)
 }

 assert.deepEqual(errors,[])
 console.log('PASS: enemy occlusion, stable overlapping sprite ownership, actual hut orders, natural footprint cached/fresh coverage (identity witness='+reviewCases.footprint.naturalIdentityWitness+'), and '+cacheQueries+' cached/fresh terrain queries across rotations/displays; replaced model buffers invalidate picking')
} finally {await browser.close()}
