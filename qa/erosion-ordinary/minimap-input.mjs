// Reviewed pure minimap inverse-picking helper; no game or renderer writes.
export function minimapInput({ width, height, rect, center, heading, target, maxDistance = 2048 }, pick, ownsPoint) {
  const wrap = v => ((v + 32768) % 65536 + 65536) % 65536 - 32768
  let best = null
  for (let y = 2; y < height - 2; y++) for (let x = 2; x < width - 2; x++) {
    const native = pick(width, height, center, heading, { x, y })
    const distance = Math.hypot(wrap(native.x - target.x), wrap(native.y - target.y))
    const point = { x: rect.x + x / width * rect.width, y: rect.y + y / height * rect.height }
    if ((!best || distance < best.distance) && ownsPoint(point)) best = { distance, ...point, native }
  }
  return best && best.distance <= maxDistance ? best : null
}
