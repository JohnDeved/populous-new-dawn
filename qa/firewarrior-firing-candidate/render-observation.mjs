// Read actual paused frame/layers and pure source selection. No renderer invocation.
export async function captureFiringRender(id) {
  const {default:art}=await import('/app/original-units.json')
  const {default:rules}=await import('/app/original-rules.json')
  const {unitAnimationSource}=await import('/app/model.ts')
  const {spriteLayers}=await import('/app/sprite-layers.ts')
  const s=window.testSceneRef.current,w=s.world,u=w.units.find(u=>u.id===id),p=u.native,g=s.unitMeshes.get(id)
  const directions=Object.values(art.animations[`${u.team}-firewarrior`]).find(rows=>rows[0].source===p.object)
  const camera=Math.round(s.cameraBearing*1024/Math.PI),heading=Math.round((Math.PI-u.heading)*1024/Math.PI)
  const direction=((((camera<<16)>>16)-((heading<<16)>>16)-0x380)&0x700)>>8
  const cycle=directions?.[direction],expectedFrame=cycle?.frames[p.f2%cycle.frames.length]??null
  const frame=art.frames[g.userData.frame],descriptor=rules.animationDescriptors[g.userData.draw]
  const flags=s.view.config.scaledSprites?0x100:0
  const draws=spriteLayers(frame.layers,art.pieces,{owner:g.userData.layerOwner??g.userData.owner,
    person:descriptor.person,variant:descriptor.variant,flags:(g.userData.drawFlags??0)|(g.userData.frameFlip?1:0),
    bucket:g.userData.spriteBucket,scale:!!flags,levelFlags:flags},s.view.config)
  const expectedLayers=draws.map(draw=>{
    const piece=art.pieces[draw.piece],flip=!!(draw.flags&1)
    if(Object.hasOwn(piece,'atlasX')!==Object.hasOwn(piece,'atlasY'))throw Error('Incomplete explicit atlas origin')
    const explicit=Object.hasOwn(piece,'atlasX')
    const x=explicit?piece.atlasX:(draw.piece%art.columns)*art.cell
    const y=explicit?piece.atlasY:Math.floor(draw.piece/art.columns)*art.cell
    if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+piece.w>art.width||y+piece.h>art.height)
      throw Error('Invalid atlas rectangle')
    return {visible:draw.w>0&&draw.h>0,piece:draw.piece,scale:[draw.w,draw.h,1],
      uv:[(flip?-piece.w:piece.w)/art.width,piece.h/art.height,
        (x+(flip?piece.w:0))/art.width,
        1-(y+piece.h)/art.height]}
  })
  const canvas=s.renderer.domElement,r=canvas.getBoundingClientRect(),screen=s.view.screen(g.position,s.camera)
  const client={x:r.left+(screen.x+1)*r.width/2,y:r.top+(1-screen.y)*r.height/2}
  const b=s.picking.personBounds(id,r)
  let crop=null
  if(b){
    const x=Math.max(0,Math.floor(r.left+b.x-24+scrollX)),y=Math.max(0,Math.floor(r.top+b.y-24+scrollY))
    crop={x,y,width:Math.min(Math.ceil(b.width+48),innerWidth-x),height:Math.min(Math.ceil(b.height+48),innerHeight-y)}
    if(crop.width<8||crop.height<8)crop=null
  }
  const gl=s.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info')
  return {atlas:{width:art.width,height:art.height,columns:art.columns,cell:art.cell},paused:w.paused,turn:w.turn,ownerMatches:unitAnimationSource(u)===p,
    source:p.object,draw:p.draw,f1:p.f1,f2:p.f2,flags2:p.flags2,flags3:p.flags3,flags4:p.flags4,
    nativeHeading:p.heading,nativeAngle:p.angle,unitHeading:u.heading,cameraHeading:camera,
    apparentOwner:g.userData.owner,direction,expectedFrame,actualFrame:g.userData.frame,actualVfra:frame.source,
    frameLayers:frame.layers,descriptor,flip:g.userData.frameFlip,client,screen:{x:screen.x,y:screen.y},crop,
    canvasOwned:document.elementFromPoint(client.x,client.y)===canvas,
    meshVisible:g.visible,objectsVisible:s.objects.visible,sceneVisible:s.scene.visible,
    layers:g.userData.layers.map(layer=>({visible:layer.visible,piece:layer.userData.piece,
      uv:layer.userData.atlasTransform?.toArray(),scale:layer.scale.toArray()})),expectedLayers,
    renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
    webglVersion:gl.getParameter(gl.VERSION),canvas:[gl.drawingBufferWidth,gl.drawingBufferHeight]}
}
