// Shared native selector tooltip padding, pointer offset and frame clamping.
export function menuTooltipPosition(x: number, y: number, width: number, height: number) {
  const paddedWidth = 4 * (Math.floor(width / 4) + 3)
  const paddedHeight = 4 * (Math.floor(height / 4) + 2)
  const left = Math.max(0, Math.min(640 - paddedWidth, x - Math.floor(paddedWidth / 2)))
  const top = Math.max(0, Math.min(480 - paddedHeight, y - 30))
  return {
    left: left + Math.floor(paddedWidth / 2) - Math.floor(width / 2),
    top: top + Math.floor(paddedHeight / 2) - Math.floor(height / 2),
  }
}
