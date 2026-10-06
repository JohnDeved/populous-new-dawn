// Adapted accepted actual-frame reader: preload dependencies, preserve its
// geometry/layer calculation, and read only after a real main renderer call.
export function renderedOwnerMatches(row, render) {
  return row.phase === 'render-after-updater' && row.sameActor && row.sameWorld && row.registeredOwner &&
    render.turn === row.turn && render.source === row.person.object && render.draw === row.person.draw &&
    render.f1 === row.person.f1 && render.f2 === row.person.f2 && row.person.stamp === row.turn &&
    render.ownerMatches && render.meshVisible && render.objectsVisible && render.sceneVisible && render.canvasOwned &&
    render.actualDraw === render.draw && render.actualFrame === render.expectedFrame && render.expectedFrame !== null &&
    render.layers.every((layer, i) => {
      const expected = render.expectedLayers[i]
      return expected ? layer.visible === expected.visible && layer.piece === expected.piece &&
        (!expected.visible || JSON.stringify(layer.uv) === JSON.stringify(expected.uv) &&
          JSON.stringify(layer.scale) === JSON.stringify(expected.scale)) : !layer.visible
    }) && render.layers.length >= render.expectedLayers.length
}

function actualRender(scene, id, { art, rules, spriteLayers, unitAnimationSource }) {
  const s=scene,w=s.world,u=w.units.find(u=>u.id===id),p=u.native,g=s.unitMeshes.get(id)
  const directions=Object.values(art.animations[`${u.team}-preacher`]).find(rows=>rows[0].source===p.object)
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
    apparentOwner:g.userData.owner,direction,expectedFrame,actualFrame:g.userData.frame,actualDraw:g.userData.draw,actualVfra:frame.source,
    frameLayers:frame.layers,descriptor,flip:g.userData.frameFlip,client,screen:{x:screen.x,y:screen.y},crop,
    canvasOwned:document.elementFromPoint(client.x,client.y)===canvas,
    meshVisible:g.visible,objectsVisible:s.objects.visible,sceneVisible:s.scene.visible,
    materialImages:g.userData.layers.filter(layer=>layer.visible&&layer.userData.piece!==0).map(layer=>({piece:layer.userData.piece,width:layer.material.map?.image?.width,height:layer.material.map?.image?.height})),
    layers:g.userData.layers.map(layer=>({visible:layer.visible,piece:layer.userData.piece,
      uv:layer.userData.atlasTransform?.toArray(),scale:layer.scale.toArray()})),expectedLayers,
    renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
    webglVersion:gl.getParameter(gl.VERSION),canvas:[gl.drawingBufferWidth,gl.drawingBufferHeight]}
}

export function createPassiveRenderRead(dependencies, scene, id) {
  const captures = [], seen = new Map()
  return {
    read(kind, row) {
      if (seen.has(kind)) return { ...seen.get(kind), bytes: undefined }
      if (captures.length >= 3) throw Error('Three natural crop ceiling')
      const started = performance.now(), render = actualRender(scene, id, dependencies)
      const result = { kind, turn: row.turn, source: row.person.object, draw: row.person.draw,
        f1: row.person.f1, f2: row.person.f2, stamp: row.person.stamp,
        started, render, outcome: 'render-state-only', pixels: null }
      seen.set(kind, result); captures.push(result)
      if (!renderedOwnerMatches(row, render)) result.reason = 'Actual rendered owner/frame/layers do not match current native phase'
      else {
        const gl = scene.renderer.getContext(), r = scene.renderer.domElement.getBoundingClientRect(), crop = render.crop
        const sx = gl.drawingBufferWidth / r.width, sy = gl.drawingBufferHeight / r.height
        const x = crop ? Math.max(0, Math.floor((crop.x - r.left - scrollX) * sx)) : 0
        const top = crop ? Math.max(0, Math.floor((crop.y - r.top - scrollY) * sy)) : 0
        const width = crop ? Math.min(gl.drawingBufferWidth - x, Math.ceil(crop.width * sx)) : 0
        const height = crop ? Math.min(gl.drawingBufferHeight - top, Math.ceil(crop.height * sy)) : 0
        if (scene.renderer.getRenderTarget() !== null || gl.isContextLost() ||
          width < 1 || height < 1 || width > 128 || height > 128) result.reason = 'Default framebuffer/crop unavailable within128x128 bound'
        else {
          const y = gl.drawingBufferHeight - top - height, bytes = new Uint8Array(width * height * 4)
          const priorError = gl.getError()
          gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, bytes)
          const error = gl.getError()
          if (priorError !== gl.NO_ERROR || error !== gl.NO_ERROR) result.reason = `Readback GL error before=${priorError} after=${error}`
          else {
            result.outcome = 'actual-framebuffer-crop'; result.bytes = bytes
            result.pixels = { format: 'RGBA8', rowOrder: 'bottom-to-top', x, y, width, height,
              byteLength: bytes.length, source: 'Existing default framebuffer immediately after original main render; no render, layer mutation or synthetic pixels' }
          }
        }
      }
      result.finished = performance.now(); result.observationMs = result.finished - started
      return { ...result, bytes: undefined }
    },
    take() {
      return captures.splice(0).map(({ bytes, ...capture }) => {
        let text = ''
        if (bytes) for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192))
        return { ...capture, base64: bytes ? btoa(text) : null }
      })
    },
  }
}
