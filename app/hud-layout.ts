export function hudScale(width: number, height: number, preference: string) {
  const fit = Math.min(width / 640, height / 480)
  const preferred =
    preference === 'auto' ? Math.min(2.5, Math.max(1, Math.floor(fit * 2) / 2)) : Number(preference)
  // Retain the established fit budget until panel and child coordinates are
  // verified together. Removing browser controls alone does not prove native 1x.
  return Math.min(preferred, fit, height / 500)
}
