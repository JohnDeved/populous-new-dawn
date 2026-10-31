import assert from 'node:assert/strict'

export function assertOriginalSpellIconPixels(actual, expected) {
  assert.deepEqual(actual.map(frame => frame.id), expected.frames.map(frame => frame.id),
    'Exact original spell icon pixel inventory')
  for (const [index, frame] of expected.frames.entries())
    assert.deepEqual(actual[index], frame, `Canonical original RGBA for HFX${frame.id}`)
}

// Self-contained for Playwright serialization. Decode the served atlas, not a
// supplied screenshot/reference. Hash each crop's RGBA bytes before checking the
// rendered CSS sprite against its canvas reference at the same background/scale.
export async function readOriginalSpellIconPixels(frames) {
  const image = new Image()
  image.src = '/original/hud.png'
  await image.decode()
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const result = []
  for (const { id, width, height, rect } of frames) {
    if (rect.w !== width || rect.h !== height) throw Error(`Wrong original dimensions: HFX${id}`)
    canvas.width = width
    canvas.height = height
    context.drawImage(image, rect.x, rect.y, width, height, 0, 0, width, height)
    const rgba = context.getImageData(0, 0, width, height).data
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', rgba))
    result.push({ id, width, height, rgbaSHA256: [...digest].map(n => n.toString(16).padStart(2, '0')).join('') })
  }
  return result
}
