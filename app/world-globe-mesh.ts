// Source-derived ordinary globe rings, UVs and vertex light. See
// decomp/research/world-selector-globes.md for source and adaptation boundaries.
const float = Math.fround
const pi = float(Math.PI)
const subdivisions = [0.2, 1 / 6, 1 / 7, 0.1, 1 / 12, 1 / 14, 1 / 15, 1 / 16, 1 / 17].map(factor =>
  float(pi * float(factor))
)

export interface GlobeVertex {
  x: number
  y: number
  u: number
  v: number
  diffuse: number
  specular: number
}

export function globeShade(x: number, y: number) {
  const q = x * x + y * y
  const light = float(float(0.8) * Math.sqrt(1.05 - q) - float(0.4) * y + float(0.4) * x)
  const highlight = float(float(light ** 4) * float(0.2))
  const diffuse = Math.max(float(-0.2), float(float(0.4) * light))
  const rim = Math.max(0, float(4 * (q - float(0.9))))
  return Math.max(56, Math.min(170, Math.trunc(170 * (highlight + diffuse + rim + float(0.4)))))
}

export function createGlobeMesh(radius = 128, offsetU = 0, offsetV = 0) {
  if (!Number.isFinite(radius) || radius < 1 || radius >= 256) {
    throw new RangeError('Globe reference radius must be in [1, 256)')
  }
  const size = Math.trunc(radius)
  const level = Math.floor(Math.log2(size))
  const fraction = (size - 2 ** level) / 2 ** level
  const angle = subdivisions[level] + (subdivisions[level + 1] - subdivisions[level]) * fraction
  const rings = Math.min(32, Math.trunc((float(1.2) / (2 * pi)) * float((2 * pi) / angle)))
  const step = float((pi * 0.5) / rings)
  const vertices: GlobeVertex[] = []
  const triangles: number[] = []
  const ringCounts = [1]
  function vertex(rho: number, sine: number, cosine: number, theta: number) {
    const x = float(rho * cosine) / radius
    const y = float(-rho * sine) / radius
    const shade = globeShade(x, y)
    vertices.push({
      x,
      y,
      u: float(offsetU - 0.25 * theta * cosine),
      v: float(offsetV - 0.25 * theta * sine),
      diffuse: Math.min(255, 2 * shade),
      specular: Math.max(0, 2 * shade - 256),
    })
  }
  vertex(0, 0, 1, 0)
  let previousRadius = 0
  let previousStart = 0
  let previousAngles = [0]
  let theta = step
  for (let ring = 1; ring < rings; ring++, theta = float(theta + step)) {
    const rho = float(radius * Math.sin(theta))
    const count = Math.min(128, Math.trunc((rho / (rho - previousRadius)) * pi * 2))
    const delta = float((pi / count) * 2)
    const cosineStep = float(Math.cos(delta))
    const sineStep = float(Math.sin(delta))
    const start = vertices.length
    const angles = [0]
    let sine = 0
    let cosine = 1
    let phi = delta
    vertex(rho, sine, cosine, theta)
    for (let index = 1; index < count; index++, phi = float(phi + delta)) {
      const nextCosine = float(cosineStep * cosine - sineStep * sine)
      sine = float(cosineStep * sine + sineStep * cosine)
      cosine = nextCosine
      angles.push(phi)
      vertex(rho, sine, cosine, theta)
    }
    let previous = 0
    let current = 0
    // Compare the next polar angles; ties advance the current ring. Preserve
    // the two closing triangles, including the centre's degenerate seam.
    while (previous < previousAngles.length - 1 || current < count - 1) {
      let old: number
      if (
        (previous < previousAngles.length - 1 &&
          previousAngles[previous + 1] < angles[current + 1]) ||
        current === count - 1
      ) {
        old = previousStart + previous++
      } else {
        old = start + current++
      }
      triangles.push(previousStart + previous, start + current, old)
    }
    triangles.push(previousStart + previous, start + current, previousStart)
    triangles.push(start + current, previousStart, start)
    ringCounts.push(count)
    previousRadius = rho
    previousStart = start
    previousAngles = angles
  }
  return { vertices, triangles, ringCounts, fullSegments: Math.trunc((2 * pi) / angle) }
}
