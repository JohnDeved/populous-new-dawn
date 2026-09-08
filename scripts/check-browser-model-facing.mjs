// Compare native captured winding decisions with the real game model materials.
import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {openGame} from './browser-game.mjs'
import fixture from '../tests/fixtures/model-facing.json' with {type:'json'}
import manifest from '../decomp/exports.json' with {type:'json'}
assert.equal(fixture.executableSha256,manifest.executableSha256)
assert.equal(fixture.cases.length,40)
const browser=await chromium.launch({headless:true})
try {
  const {page,errors}=await openGame(browser)
  await page.evaluate(()=>{const s=window.testScene;s.world.speed=0;cancelAnimationFrame(s.frame)})
  const village=[]
  for(const angle of [0,512,1024,1536]) {
    const changed=await page.evaluate(angle=>{
      const s=window.testScene;s.cameraPosition.angle=angle;s.cameraBearing=angle*Math.PI/1024
      s.animate(s.previous);cancelAnimationFrame(s.frame)
      const meshes=[];s.scene.traverse(o=>{if(o.userData.nativeModel!==undefined&&o.userData.stage===4)meshes.push(o)})
      const gl=s.renderer.getContext(),size=gl.drawingBufferWidth*gl.drawingBufferHeight*4
      const read=()=>{s.renderer.render(s.scene,s.camera);const p=new Uint8Array(size);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,p);return p}
      const before=read(),sides=meshes.map(m=>m.material.side)
      meshes.forEach(m=>{m.material.side=2;m.material.needsUpdate=true})
      const after=read();meshes.forEach((m,i)=>{m.material.side=sides[i];m.material.needsUpdate=true});read()
      let changed=0;for(let i=0;i<size;i+=4)if(before[i]!==after[i]||before[i+1]!==after[i+1]||before[i+2]!==after[i+2])changed++
      return changed
    },angle)
    village.push(changed)
    if(angle===0)await page.screenshot({path:'/private/tmp/populous-model-facing-v116.png'})
  }
  assert.ok(village.some(n=>n>0),'Native culling should affect visible model pixels')
  const counts=[]
  for(let stage=0;stage<=4;stage++) {
    const cases=fixture.cases.filter(c=>c.stage===stage)
    const pixels=await page.evaluate(({stage,cases})=>{
      const s=window.testScene,b=s.world.buildings.find(b=>b.team==='blue'&&b.kind==='hut')
      b.progress=stage===4?1:stage/4+.1
      s.animate(s.previous);cancelAnimationFrame(s.frame)
      const group=s.buildingMeshes.get(b.id),mesh=group.children[0]
      if(mesh.userData.stage!==stage)throw new Error('Live stage did not rebuild')
      const visible=[];s.scene.traverse(o=>{if(o.isMesh||o.isSprite||o.isLine){visible.push([o,o.visible]);o.visible=o===mesh}})
      const background=s.scene.background;s.scene.background=null;s.renderer.setClearColor(0x000000)
      const oldGeometry=mesh.geometry,geometry=new oldGeometry.constructor(),Attribute=oldGeometry.getAttribute('position').constructor
      geometry.setAttribute('faceShade',new Attribute(new Float32Array([32,32,32]),1))
      geometry.setAttribute('faceAnchor',new Attribute(new Float32Array(9),3))
      mesh.geometry=geometry;mesh.userData.nativeSize=256;mesh.userData.highlight.value=255
      group.position.set(-8,0,-8);group.rotation.set(0,0,0);group.userData.nativeHeading=0
      const map=mesh.material.map;mesh.material.map=null;mesh.material.color.setHex(0xffffff);mesh.material.toneMapped=false;mesh.material.needsUpdate=true
      const u=s.view.uniforms
      u.nativeBasis.value.set([16384,0,0,0,16384,0,0,0,16384]);u.nativeSettings.value.set([0,4096,12,65536])
      u.nativeCenter.value.set([0,0]);u.nativeRawCenter.value.set([0,0]);u.nativeScreen.value.set([1240,1000,620,500]);u.nativeMode.value=0
      const gl=s.renderer.getContext(),out=[]
      for(const c of cases) {
        const p=c.raw.flatMap(v=>v.map((n,i)=>n*(i===2?-1:1)/(mesh.userData.nativeScale*3)))
        geometry.setAttribute('position',new Attribute(new Float32Array(p),3))
        s.renderer.render(s.scene,s.camera)
        const pixels=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4)
        gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,pixels)
        let count=0
        for(let i=0;i<pixels.length;i+=4)if(pixels[i]>200&&pixels[i+1]>200&&pixels[i+2]>200)count++
        out.push(count)
      }
      mesh.geometry=oldGeometry;geometry.dispose();mesh.material.map=map;mesh.material.needsUpdate=true
      visible.forEach(([o,value])=>{o.visible=value});s.scene.background=background
      return out
    },{stage,cases})
    pixels.forEach((pixels,i)=>{
      assert.equal(pixels>0,!!cases[i].submitted,JSON.stringify({case:cases[i],pixels}))
      if(cases[i].submitted)assert.ok(pixels>10000,pixels)
    })
    counts.push(...pixels)
  }
  console.log(`Village views: ${village.join(', ')} pixels differ from the previous two-sided renderer`)
  assert.deepEqual(errors,[])
  console.log(`PASS: ${counts.length} native/browser triangle submissions through live completed and all construction-stage materials; front/rear and sloping triangles (up to ${Math.max(...counts)} GPU pixels per triangle); no browser errors`)
} finally {await browser.close()}
