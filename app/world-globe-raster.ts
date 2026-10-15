import { createGlobeMesh, type GlobeVertex } from './world-globe-mesh.ts'

// A fixed reference radius decouples native subdivision from physical display
// pixels. In particular, a large/high-DPI preview never hits the native R>=256 exit.
const mesh = createGlobeMesh(128)
const textureSize = 128

export function globeBackingSize(cssSize: number, pixelRatio: number) {
  if (!Number.isFinite(cssSize) || cssSize <= 0) return 0
  const ratio = Number.isFinite(pixelRatio) && pixelRatio > 0 ? pixelRatio : 1
  return Math.max(1, Math.min(2048, Math.round(cssSize * ratio)))
}

// Modern sampler adaptation: repeat addressing and bilinear RGB8 filtering in
// encoded byte space. UVs remain unwrapped until sampling, including seam edges.
function sample(texture: Uint8ClampedArray, u: number, v: number, channel: number) {
  const x = (u - Math.floor(u)) * textureSize - 0.5
  const y = (v - Math.floor(v)) * textureSize - 0.5
  const left = Math.floor(x)
  const top = Math.floor(y)
  const fx = x - left
  const fy = y - top
  const a =
    (((top + textureSize) % textureSize) * textureSize + ((left + textureSize) % textureSize)) * 4 +
    channel
  const b =
    (((top + textureSize) % textureSize) * textureSize + ((left + 1) % textureSize)) * 4 + channel
  const c =
    (((top + 1) % textureSize) * textureSize + ((left + textureSize) % textureSize)) * 4 + channel
  const d = (((top + 1) % textureSize) * textureSize + ((left + 1) % textureSize)) * 4 + channel
  return (
    (texture[a] * (1 - fx) + texture[b] * fx) * (1 - fy) +
    (texture[c] * (1 - fx) + texture[d] * fx) * fy
  )
}

function edge(a: GlobeVertex, b: GlobeVertex, x: number, y: number) {
  return (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x)
}

export function rasterGlobe(texture: Uint8ClampedArray, size: number) {
  if (texture.length !== textureSize * textureSize * 4)
    throw new RangeError('Expected a 128-square RGBA globe texture')
  if (!Number.isInteger(size) || size < 1 || size > 2048)
    throw new RangeError('Invalid globe backing size')
  const pixels = new Uint8ClampedArray(size * size * 4)
  const scale = size / 2
  const vertices = mesh.vertices.map(vertex => ({
    ...vertex,
    x: (vertex.x + 1) * scale,
    y: (vertex.y + 1) * scale,
  }))
  for (let index = 0; index < mesh.triangles.length; index += 3) {
    const a = vertices[mesh.triangles[index]]
    const b = vertices[mesh.triangles[index + 1]]
    const c = vertices[mesh.triangles[index + 2]]
    const area = edge(a, b, c.x, c.y)
    if (Math.abs(area) < 1e-12) continue
    const left = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)))
    const right = Math.min(size - 1, Math.ceil(Math.max(a.x, b.x, c.x)))
    const top = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)))
    const bottom = Math.min(size - 1, Math.ceil(Math.max(a.y, b.y, c.y)))
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        const wa = edge(b, c, x + 0.5, y + 0.5) / area
        const wb = edge(c, a, x + 0.5, y + 0.5) / area
        const wc = 1 - wa - wb
        if (wa < -1e-9 || wb < -1e-9 || wc < -1e-9) continue
        const u = wa * a.u + wb * b.u + wc * c.u
        const v = wa * a.v + wb * b.v + wc * c.v
        const diffuse = (wa * a.diffuse + wb * b.diffuse + wc * c.diffuse) / 255
        const specular = wa * a.specular + wb * b.specular + wc * c.specular
        const offset = (y * size + x) * 4
        for (let channel = 0; channel < 3; channel++) {
          pixels[offset + channel] = sample(texture, u, v, channel) * diffuse + specular
        }
        pixels[offset + 3] = 255
      }
    }
  }
  return pixels
}
