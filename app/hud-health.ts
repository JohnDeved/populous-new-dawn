// 0x4a0050: the fixed HUD frame has an 18-pixel interior; division truncates.
export function healthBarPixels(health: number, maximum: number) {
  return maximum > 0 ? Math.min(18, Math.trunc((18 * health) / maximum)) : 0
}
