// 0x468e1c / 0x525450: damaged friendly followers, anchored to the scaled pose.
export function unitHealthGauge(p: {
  enabled: boolean
  owner: number
  player: number
  type: number
  flags3: number
  flags4: number
  health: number
  maximum: number
  frameHeight: number
}) {
  if (
    !p.enabled ||
    p.type !== 1 ||
    p.owner !== p.player ||
    p.flags3 & 0x1000 ||
    p.flags4 & 0x800 ||
    p.health >= p.maximum
  )
    return null
  return {
    x: -3,
    y: -26 - Math.trunc((p.frameHeight * 24) / 32),
    width: 6,
    height: 26,
    fill: Math.trunc((p.health * 24) / (p.maximum || 1)),
  }
}
