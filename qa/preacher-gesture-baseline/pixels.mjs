export function withHidden(objects, read) {
  const before = objects.map(object => object.visible)
  try { objects.forEach(object => { object.visible = false }); return read() }
  finally { objects.forEach((object, i) => { object.visible = before[i] }) }
}

export async function capturePreacherPixels(id) {
  const { default: sprites } = await import('/app/original-units.json')
  const { unitAnimationSource } = await import('/app/model.ts')
  const { spriteDirection } = await import('/app/projection.ts')
  const { spriteAtlasOrigin } = await import('/app/sprite-layers.ts')
  const s = window.testSceneRef.current, u = s.world.units.find(u => u.id === id)
  const p = u && unitAnimationSource(u), mesh = s.unitMeshes.get(id), gl = s.renderer.getContext()
  if (!p || p !== u.native || p.object !== 168 || p.commandStatus !== 17 ||
    !mesh?.visible || !s.objects.visible || !s.scene.visible || gl.isContextLost())
    throw Error('Real visible command17/source168 Preacher is absent')
  const direction = spriteDirection(Math.round(s.cameraBearing * 1024 / Math.PI),
    Math.round((Math.PI - u.heading) * 1024 / Math.PI))
  const directions = Object.values(sprites.animations['blue-preacher']).find(d => d[0].source === 168)
  const cycle = directions[direction], frameIndex = cycle.frames[p.f2 % cycle.frames.length]
  if (frameIndex !== mesh.userData.frame) throw Error('Rendered frame does not match actual source168 owner')
  const frame = sprites.frames[frameIndex], layers = mesh.userData.layers.filter(l => l.visible && l.userData.piece !== 0)
  if (!layers.length) throw Error('Preacher has no visible body layers')
  const read = () => {
    s.renderer.render(s.scene, s.camera)
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    return pixels
  }
  const before = read()
  let after
  try { after = withHidden(layers, read) }
  finally { s.renderer.render(s.scene, s.camera) }
  let changedPixels = 0, minX = Infinity, minY = Infinity, maxX = -1, maxY = -1
  for (let i = 0; i < before.length; i += 4) if (before[i] !== after[i] || before[i + 1] !== after[i + 1] || before[i + 2] !== after[i + 2]) {
    const x = i / 4 % gl.drawingBufferWidth, y = gl.drawingBufferHeight - 1 - Math.floor(i / 4 / gl.drawingBufferWidth)
    changedPixels++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
  }
  if (!changedPixels || gl.getError() !== gl.NO_ERROR) throw Error('No positive error-free pixels from the real Preacher body layers')
  const debug = gl.getExtension('WEBGL_debug_renderer_info')
  return { id, turn: s.world.turn, source: p.object, draw: p.draw, f1: p.f1, f2: p.f2,
    counter: p.counter, stamp: p.stamp, direction, frameIndex, nativeVFRA: frame.source,
    frame, flip: cycle.flip, changedPixels, changedBounds: { minX, minY, maxX, maxY },
    layers: layers.map(l => ({ piece: l.userData.piece, uv: l.userData.atlasTransform.toArray(),
      atlas: spriteAtlasOrigin(sprites.pieces[l.userData.piece], l.userData.piece, sprites),
      metadata: sprites.pieces[l.userData.piece] })),
    atlas: { width: sprites.width, height: sprites.height, file: sprites.atlas },
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
    canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight], maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    renderer: gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
    restored: layers.every(l => l.visible),
    method: 'Synchronous ordinary rendered buffer minus the same buffer with only this Preacher’s visible body sprite layers hidden; all visibility restored in finally. No world, animation, camera, or clock writes.' }
}
