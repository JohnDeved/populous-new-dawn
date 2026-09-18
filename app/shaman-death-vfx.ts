import units from './original-units.json' with { type: 'json' }

// 005029d0, model 12: phase 3 freezes source 360's final frame; phase 4
// hides the death-site spirit while the existing reincarnation timer continues.
// Earlier poses retain the current renderer clock; this helper owns no simulation.
export function shamanDeathVfx(phase: number) {
  return {
    visible: phase < 4,
    frame: phase >= 3 ? units.frameCounts[360] - 1 : 0,
  }
}
