// Call only immediately after the game's own render, before buffer discard.
export function captureRenderedCanvas(scene) {
  const canvas = scene.renderer.domElement, gl = scene.renderer.getContext()
  if (gl.isContextLost()) throw Error('Rendering context lost')
  const bytes = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
  gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, bytes)
  let pixels = 0
  for (let i = 3; i < bytes.length; i += 4) if (bytes[i]) pixels++
  return { png: canvas.toDataURL('image/png'), pixels, width: gl.drawingBufferWidth, height: gl.drawingBufferHeight }
}
