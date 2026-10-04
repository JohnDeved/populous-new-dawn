export function hudScale(width: number, height: number, preference: string) {
  const fit = Math.min(width / 640, height / 480)
  const preferred =
    preference === 'auto' ? Math.min(2.5, Math.max(1, Math.floor(fit * 2) / 2)) : Number(preference)
  // The native dock ends at481. The modern14px footer starts at483
  // within a500px height budget; only fit changes, not the saved preference.
  return Math.min(preferred, fit, height / 500)
}
