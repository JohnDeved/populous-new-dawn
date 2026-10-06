import { withHidden } from '../preacher-gesture-baseline/pixels.mjs'
import { capturePreacherRender } from './render-observation.mjs'

export function compareBodyPixels(before, hidden, width) {
  if (before.length !== hidden.length || !Number.isInteger(width) || width < 1 ||
    before.length % (width * 4)) throw Error('Invalid paired RGBA crop')
  let changedPixels = 0
  for (let i = 0; i < before.length; i += 4)
    if (before[i] !== hidden[i] || before[i + 1] !== hidden[i + 1] || before[i + 2] !== hidden[i + 2]) changedPixels++
  return changedPixels
}

export async function capturePausedGesture(id) {
  const render = await capturePreacherRender(id)
  if (!render.paused || ![176, 184].includes(render.source) || render.draw !== 14 ||
    !render.ownerMatches || !render.meshVisible || !render.objectsVisible || !render.sceneVisible ||
    !render.canvasOwned || render.actualFrame !== render.expectedFrame || !render.crop)
    throw Error('Actual paused gesture renderer owner is not visible')
  if (render.atlas.width !== 2048 || render.atlas.height !== 8192) throw Error('Unexpected candidate atlas')
  for (const [i, expected] of render.expectedLayers.entries()) {
    const actual = render.layers[i]
    if (!actual || actual.visible !== expected.visible || actual.piece !== expected.piece || expected.visible &&
      (JSON.stringify(actual.uv) !== JSON.stringify(expected.uv) || JSON.stringify(actual.scale) !== JSON.stringify(expected.scale)))
      throw Error('Actual paused sprite layers do not match owned metadata')
  }
  if (render.layers.slice(render.expectedLayers.length).some(layer => layer.visible))
    throw Error('Unexpected trailing sprite layer remains visible')
  const s = window.testSceneRef.current, w = s.world, u = w.units.find(u => u.id === id), p = u.native
  const g = s.unitMeshes.get(id), gl = s.renderer.getContext(), r = s.renderer.domElement.getBoundingClientRect()
  const tuple = () => [w.turn, p.object, p.draw, p.f1, p.f2, p.counter, p.timer, p.stamp, w.paused]
  const frozen = tuple(), scaleX = gl.drawingBufferWidth / r.width, scaleY = gl.drawingBufferHeight / r.height
  const x = Math.max(0, Math.floor((render.crop.x - r.left - scrollX) * scaleX))
  const top = Math.max(0, Math.floor((render.crop.y - r.top - scrollY) * scaleY))
  const width = Math.min(gl.drawingBufferWidth - x, Math.ceil(render.crop.width * scaleX))
  const height = Math.min(gl.drawingBufferHeight - top, Math.ceil(render.crop.height * scaleY))
  if (width < 1 || height < 1 || width > 256 || height > 256 || gl.isContextLost()) throw Error('RGBA crop exceeds finite bounds')
  const y = gl.drawingBufferHeight - top - height
  const read = () => {
    s.renderer.render(s.scene, s.camera)
    const pixels = new Uint8Array(width * height * 4)
    gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    return pixels
  }
  const layers = g.userData.layers.filter(layer => layer.visible && layer.userData.piece !== 0)
  if (!layers.length) throw Error('No visible Preacher body layers')
  const materialImages = layers.map(layer => ({ piece: layer.userData.piece,
    width: layer.material.map?.image?.width, height: layer.material.map?.image?.height,
    textureUUID: layer.material.map?.uuid }))
  if (gl.getParameter(gl.MAX_TEXTURE_SIZE) < 8192 || materialImages.some(image => image.width !== 2048 || image.height !== 8192))
    throw Error('The actual body material is not using the supported candidate atlas image')
  const before = read()
  let hidden
  try { hidden = withHidden(layers, read) }
  finally { s.renderer.render(s.scene, s.camera) }
  const changedPixels = compareBodyPixels(before, hidden, width)
  if (!changedPixels || gl.getError() !== gl.NO_ERROR || JSON.stringify(tuple()) !== JSON.stringify(frozen))
    throw Error('Paused owner changed or failed actual body readback')
  const encode = bytes => {
    let text = ''
    for (let i = 0; i < bytes.length; i += 8192) text += String.fromCharCode(...bytes.subarray(i, i + 8192))
    return btoa(text)
  }
  return { render, frozen, changedPixels, materialImages, restored: layers.every(layer => layer.visible),
    rgba: { format: 'RGBA8', rowOrder: 'bottom-to-top', x, y, width, height,
      before: encode(before), hidden: encode(hidden) },
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    method: 'Actual paused owner; same-turn body-layer visibility differential; bounded raw RGBA pair retained for independent recount. No synthetic pose or compositor.' }
}
