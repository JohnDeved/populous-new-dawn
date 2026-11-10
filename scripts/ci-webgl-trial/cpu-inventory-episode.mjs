import assert from 'node:assert/strict'
import {mkdirSync,writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {createHash} from 'node:crypto'

export async function runCpuInventoryEpisode({browser,sourceRoot,output,expectedCommit}) {
  assert.equal(expectedCommit,'1f76849ea332c1328553f13f4819d46f92f82ee7')
  const {bindGame}=await import(pathToFileURL(resolve(sourceRoot,'scripts/browser-game.mjs')))
  const {openCampaignFromMainMenu}=await import(pathToFileURL(resolve(sourceRoot,'scripts/browser-new-game.mjs')))
  mkdirSync(output,{recursive:false})
  const report={status:'running',expectedCommit,images:[],errors:[],warnings:[],cleanup:[]}
  const save=()=>writeFileSync(resolve(output,'receipt.json'),JSON.stringify(report,null,2)+'\n')
  let context
  try {
    context=await browser.newContext({viewport:{width:960,height:640},deviceScaleFactor:1,serviceWorkers:'block',acceptDownloads:false})
    await context.route('**/*',async route=>{if(new URL(route.request().url()).origin!=='http://127.0.0.1:5198'){report.errors.push('Unexpected external request');await route.abort();return}await route.continue()})
    const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(25000)
    page.on('pageerror',error=>report.errors.push(String(error)));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())})
    const button=name=>page.getByRole('button',{name,exact:true})
    const settle=()=>page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))))
    const response=await page.goto('http://127.0.0.1:5198/',{waitUntil:'domcontentloaded'});assert.equal(response.status(),200)
    await openCampaignFromMainMenu(page);await button('Start Mission 1').click();await bindGame(page)
    await page.waitForFunction(()=>window.testStore.getWorld().flyby.flags&1||!window.testStore.getWorld().inputMask)
    if(await page.evaluate(()=>!!window.testStore.getWorld().inputMask))await page.getByRole('button',{name:/Skip introduction/}).click()
    await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
    await button('Pause game').click();await page.waitForFunction(()=>window.testStore.getWorld().paused);await settle()
    const shot=async name=>{assert.ok(report.images.length<2);const bytes=await page.screenshot({type:'png',fullPage:false,timeout:15000});assert.ok(bytes.length<12*1024*1024);writeFileSync(resolve(output,name),bytes);report.images.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),renderer:'WebGL SwiftShader, not in-page CPU fallback'});save()}
    await shot('paused-game-gpu.png')
    await button('Game settings').click();await page.getByRole('dialog',{name:'Game menu',exact:true}).waitFor({state:'visible'});await settle()
    const inventory=()=>page.evaluate(()=>{
      const game=window.testSceneRef.current,world=window.testStore.getWorld(),scene=game.scene,camera=game.camera
      const gl=game.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info')
      const textures=new Map(),materials=new Map(),objects=[]
      const tex=t=>{if(!t?.isTexture)return;if(textures.has(t.uuid))return;const im=t.image;textures.set(t.uuid,{id:t.uuid,width:im?.width??null,height:im?.height??null,bytes:im?.data?.byteLength??null,type:t.type,format:t.format,colorSpace:t.colorSpace})}
      scene.traverseVisible(o=>{
        if(!o.layers.test(camera.layers))return
        if(objects.length>=5000)throw new Error('Inventory object bound exceeded')
        const mats=Array.isArray(o.material)?o.material:[o.material]
        for(const m of mats){if(!m||materials.has(m.uuid))continue;for(const v of Object.values(m))tex(v);for(const u of Object.values(m.uniforms??{}))tex(u.value);for(const u of Object.values(m.userData?.nativeUniforms??{}))tex(u.value)
          materials.set(m.uuid,{id:m.uuid,type:m.type,visible:m.visible,transparent:m.transparent,vertexColors:m.vertexColors,depthFunc:m.depthFunc,stencilWrite:m.stencilWrite,polygonOffset:m.polygonOffset,shaderHook:typeof m.onBeforeCompile==='function',map:m.map?.uuid??null,uniformKeys:Object.keys(m.uniforms??{}),localUniformKeys:Object.keys(m.userData?.nativeUniforms??{})})}
        objects.push({id:o.uuid,type:o.type,visible:o.visible,nativeIgnore:!!o.userData.nativeIgnore,materialIDs:mats.filter(Boolean).map(m=>m.uuid),instances:o.isInstancedMesh?o.count:1,positionCount:o.geometry?.attributes.position?.count??0,indexCount:o.geometry?.index?.count??0,drawRange:o.geometry?.drawRange?{start:o.geometry.drawRange.start,count:Number.isFinite(o.geometry.drawRange.count)?o.geometry.drawRange.count:null}:null,groups:o.geometry?.groups?.length??0})
      })
      for(const u of Object.values(game.view.uniforms))tex(u.value)
      return{turn:world.turn,paused:world.paused,modalSuspended:game.modalSuspended,selected:[...world.selected],camera:camera.matrixWorld.toArray(),projection:camera.projectionMatrix.toArray(),fog:scene.fog?(scene.fog.isFogExp2?'FogExp2':'Fog'):null,background:scene.background?.type??null,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),objects,materials:[...materials.values()],textures:[...textures.values()],globalUniformKeys:Object.keys(game.view.uniforms),heap:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize,limit:performance.memory.jsHeapSizeLimit}:null}
    })
    report.inventory=await inventory();assert.match(report.inventory.renderer,/SwiftShader/i);assert.equal(report.inventory.paused,true);assert.equal(report.inventory.modalSuspended,true)
    await settle();report.after=await inventory();assert.deepEqual({...report.after,heap:null},{...report.inventory,heap:null})
    await shot('suspended-game-gpu.png')
    const json=JSON.stringify(report.inventory,null,2);assert.ok(Buffer.byteLength(json)<2*1024*1024);writeFileSync(resolve(output,'scene-inventory.json'),json+'\n')
    assert.deepEqual(report.errors,[]);report.status='passed-awaiting-pixel-review'
  }finally{if(context){await context.close();report.cleanup.push('fresh context closed')}save()}
  return report
}
