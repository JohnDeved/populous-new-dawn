// Inward whole-CSS-pixel limits keep transformed panels off fractional edges.
// A narrow interval with no whole-pixel anchor retains the original clamp.
export function clampPanelAnchor(value: number, min: number, max: number) {
  const lower = Math.ceil(min), upper = Math.floor(max)
  return lower <= upper
    ? Math.max(lower, Math.min(upper, value))
    : Math.max(min, Math.min(max, value))
}
