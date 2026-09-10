export interface SelectionVertex {
  x: number
  y: number
  z: number
  flags: number
}
export interface SelectionDraw {
  kind: 'fill' | 'edge' | 'corner'
  points: SelectionVertex[]
  bucket: number
  direction: number
  visible: boolean
}
// 0x423900: selection uses a maximum-vertex bucket, not terrain's mean depth.
// Keep references: a corner is consumed once across triangles sharing its vertex.
export function selectionDraws(
  triangles: SelectionVertex[][],
  width: number,
  height: number,
  borders: boolean
) {
  const draws: SelectionDraw[] = []
  for (const points of triangles) {
    const [a, b, c] = points
    if (
      (a.x < 0 && b.x < 0 && c.x < 0) ||
      (a.x >= width && b.x >= width && c.x > width) ||
      points.every(p => p.y >= height)
    )
      continue
    const distance = Math.max(...points.map(p => p.z)) + 28672 - 352
    let bucket = distance < 64 ? 0 : Math.min(3584, Math.trunc(distance / 16))
    if (points.some(p => p.flags & 128)) bucket = Math.max(0, bucket - 13)
    const front = (c.y - b.y) * (b.x - a.x) - (c.x - b.x) * (b.y - a.y) > 0
    draws.push({ kind: 'fill', points, bucket, direction: 0, visible: front })
    if (!borders || (!front && bucket > 2240)) continue
    for (let direction = 0; direction < 4; direction++) {
      const mask = 0x100 << direction
      const pair = [
        [a, b],
        [a, c],
        [b, c],
      ].find(vertices => vertices.every(p => p.flags & mask))
      if (pair) draws.push({ kind: 'edge', points: pair, bucket, direction, visible: true })
    }
    for (const p of points)
      for (let direction = 0; direction < 4; direction++) {
        const mask = 0x1000 << direction
        if (!(p.flags & mask)) continue
        p.flags &= ~mask
        draws.push({
          kind: 'corner',
          points: [p],
          bucket: Math.max(0, bucket - 8),
          direction,
          visible: true,
        })
      }
  }
  return draws
}
