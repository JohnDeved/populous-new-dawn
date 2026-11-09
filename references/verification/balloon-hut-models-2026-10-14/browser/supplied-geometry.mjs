import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const self=fileURLToPath(import.meta.url), hash=p=>createHash('sha256').update(readFileSync(p)).digest('hex')
export default async function({page,openMission,root,output,receipt,signal}) {
  const before=hash(self), models=JSON.parse(readFileSync(resolve(root,'app/original-models.json'),'utf8'))
  const report={source:receipt.source,status:'running',checkerBefore:before,stages:[],
    scope:'Supplied completed Balloon Hut geometry fixture on public-paused M1; owner variants87–90, not acquired gameplay, construction, destruction, mission completion or hardware performance',
    mutations:'One completed Balloon Hut at fixed0,0 via addBuilding per owner; remove prior supplied fixture from world.buildings; scene.focus camera; public pause keeps simulation stopped, normal RAF renders; CSS moves visible pause badge to top-right for unobscured fixture inspection',
    atlasSha256:hash(resolve(root,'public/original/atlas.png'))}
  const save=()=>writeFileSync(resolve(output,'supplied-geometry.json'),JSON.stringify(report,null,2)+'\n')
  try {
    await openMission(1)
    await page.waitForFunction(()=>!window.testSceneRef.current.world.inputMask)
    await page.getByRole('button',{name:'Pause game',exact:true}).click()
    await page.waitForFunction(()=>window.testSceneRef.current.world.paused)
    await page.addStyleTag({content:'.paused-badge { left: auto !important; right: 16px !important; top: 16px !important; transform: none !important; }'})
    for(const [index,team] of ['blue','red','yellow','green'].entries()) {
      signal.throwIfAborted()
      const setup=await page.evaluate(async team=>{
        const s=window.testSceneRef.current,w=s.world,{addBuilding}=await import('/app/model.ts')
        if(window.balloonHutFixtureId) w.buildings=w.buildings.filter(b=>b.id!==window.balloonHutFixtureId)
        const b=addBuilding(w,team,'balloonHut',{x:0,z:0},true)
        window.balloonHutFixtureId=b.id;s.focus(b)
        return{id:b.id,object:b.object,team:b.team,x:b.x,z:b.z,turn:w.turn,paused:w.paused}
      },team)
      assert.equal(setup.object,87+index);assert.equal(setup.paused,true)
      await page.waitForFunction(id=>{const s=window.testSceneRef.current;return s.buildingMeshes.has(id)&&!s.cameraMotion.active&&!s.viewTransition},setup.id)
      const sample=()=>page.evaluate(id=>{
        const s=window.testSceneRef.current,g=s.buildingMeshes.get(id),m=g.children[0],gl=s.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info')
        return {turn:s.world.turn,paused:s.world.paused,frame:s.frame,model:m.userData.nativeModel,stage:m.userData.stage,
          visible:g.visible&&m.visible,vertices:m.geometry.attributes.position.count,uv:m.geometry.attributes.uv.count,
          projected:s.picking.model(m,JSON.stringify(s.view.projection)).filter(p=>p.kind==='model').length,
          camera:{...s.cameraPosition},viewport:[innerWidth,innerHeight],renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),contextLost:gl.isContextLost()}
      },setup.id)
      const row={team,setup,before:await sample()};report.stages.push(row);save()
      const fallback=JSON.parse(readFileSync(resolve(root,'app/original-rules.json'),'utf8')).buildingObjects[13]
      assert.equal(row.before.model,models[87+index]?87+index:models[87]?87:fallback)
      assert.ok(row.before.visible&&row.before.vertices>0&&row.before.projected>0)
      assert.equal(row.before.contextLost,false)
      await page.screenshot({path:resolve(output,`balloon-hut-${team}.png`)})
      row.after=await sample();assert.equal(row.after.turn,setup.turn);assert.equal(row.after.model,row.before.model)
      assert.deepEqual(receipt.errors,[]);save()
    }
    report.checkerAfter=hash(self);assert.equal(report.checkerAfter,before)
    report.status='passed';save();return report
  }catch(error){report.status='failed';report.error=String(error);save();throw error}
}
