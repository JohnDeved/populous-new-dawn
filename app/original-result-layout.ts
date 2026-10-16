// Source composition is fixed; this fit leaves the real browser controls reachable.
export function resultScale(width: number, height: number, preferred: number, controls: number) {
  return Math.max(
    0.1,
    Math.min(preferred, (width - 24) / 384, (height - 2 * (controls + 16)) / 368)
  )
}

export function resultTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '--:--:--'
  const elapsed = Math.max(0, Math.floor(seconds))
  return [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60]
    .map(value => String(value).padStart(2, '0'))
    .join(':')
}
