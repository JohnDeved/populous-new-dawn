// Reviewed portions of 0x485b00 (level settings) and 0x4fb270 (worship triggers).
// Follower eligibility, world scheduling and reward objects are supplied by the engine.
export type WorshipState = {
  work: number
  target: number
  required: number
  remaining: number
  growth: number
  grown: boolean
  enabled: boolean
  reset: boolean
  cooldown: number
  active: boolean
}

export function createWorship(settings: number[]): WorshipState {
  if (settings.length !== 32) throw new Error('Invalid worship settings')
  const short = (i: number) => ((settings[i] | (settings[i + 1] << 8)) << 16) >> 16
  return {
    work: 0,
    target: short(26),
    required: short(4),
    remaining: (settings[3] << 24) >> 24,
    growth: short(30) || 768,
    grown: false,
    enabled: settings[28] === 0,
    reset: true,
    cooldown: 0,
    active: true,
  }
}

export function finishWorship(s: WorshipState) {
  s.work = 0
  if (s.remaining > 0 && --s.remaining === 0) {
    s.active = false
    return
  }
  if (!s.grown) {
    s.grown = true
    s.target = (s.target + Math.trunc(s.growth / 4)) | 0
  }
  s.enabled = false
  s.cooldown = s.remaining < 0 ? 0 : 1
  if (s.remaining < 0) s.active = false
}

// Shared reset/refill prefix of 0x4fb270, before its trigger-type switch.
export function beginWorshipTurn(s: WorshipState): boolean {
  if (!s.active) return false
  if (s.reset) {
    s.work = 0
    s.reset = false
  }
  if (!s.enabled) {
    if (s.cooldown !== 0 && --s.cooldown === 0) {
      s.enabled = true
      s.reset = true
    }
    return false
  }
  return true
}

// Type-0 spell heads sample on every fourth object turn. Work is integer, not elapsed seconds.
export function stepWorship(
  s: WorshipState,
  phase: number,
  followers: number,
  forced = false
): boolean {
  if (s.reset) forced = false
  if (!beginWorshipTurn(s)) return false
  let ready = false
  if (!(phase & 3)) {
    const square = Math.imul(s.required, s.required)
    if (followers === 0) {
      s.work = Math.max(0, (s.work - square) | 0)
    } else {
      const missing = s.required - Math.min(s.required, followers) + 1
      s.work = (s.work + Math.trunc(square / Math.imul(missing, missing))) | 0
      ready = s.work >= Math.imul(s.target, square)
    }
  }
  if (!ready && !forced) return false
  finishWorship(s)
  return true
}

export function worshipProgress(s: WorshipState) {
  return s.target > 0 && s.required > 0 ? s.work / (s.target * s.required * s.required) : 0
}
