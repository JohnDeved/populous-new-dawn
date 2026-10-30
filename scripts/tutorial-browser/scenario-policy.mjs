// Fixed read-only browser episode policy. No environment-selected cap overrides.
export const browserScenarios = Object.freeze(['tutorial', 'm2-pointer-f8', 'pause-checkpoint-recovery',
  'profile-recovery', 'mission10-profile', 'gameplay-frames', 'gameplay-resources', 'snapshot-protocol', 'compact-message-layout', 'frontend-held-escape'])
// This expands smoke from one shared 90s allowance to at most two 90s
// episodes (180s combined), still inside the unchanged six-minute hosted job.
export const snapshotSmokeBudget = Object.freeze({ version: 1, maxEpisodes: 2,
  episodeMs: 90000, totalBrowserMs: 180000, hostedJobMs: 360000 })
export function browserCapMs(scenario) {
  if (!browserScenarios.includes(scenario)) throw Error('Unknown browser scenario')
  // Finite Tutorial episodes exhausted 180s in two hosted runs. This is hang
  // headroom for the unchanged aggregate, not a per-episode or performance target.
  if (scenario === 'tutorial') return 240000
  if (scenario === 'gameplay-frames') return gameplayAggregateBudget.totalBrowserMs
  if (scenario === 'compact-message-layout') return compactAggregateBudget.totalBrowserMs
  return scenario === 'snapshot-protocol' ? 90000 : 180000
}

// Independent jobs, explicitly 360s combined instead of the former shared180s.
export const profileSplitBudget = Object.freeze({ version: 1, recoveryMs: 180000,
  mission10Ms: 180000, totalBrowserMs: 360000, buildMsPerJob: 120000, hostedJobMs: 900000 })

// Explicit admission for the three required independent gameplay episodes.
// +175s aggregate, not altered simulation speed, measured windows or performance.
export const gameplayAggregateBudget = Object.freeze({ version: 1, frameMs: 180000,
  meleeMs: 75000, corpseDeathMs: 75000, corpseLoadMs: 25000,
  totalBrowserMs: 180000 + 75000 + 75000 + 25000, buildMs: 120000, hostedJobMs: 900000 })

// NEW functional policy: +45s admission, not recovered history or performance.
// Compact preparation45 + all four layouts45; no per-case resets.
export const compactAggregateBudget = Object.freeze({ version: 1, preparationMs: 45000, layoutsMs: 45000,
  compactMs: 90000, pickingMs: 45000, hypnotiseMs: 75000, lifecycleMs: 15000,
  totalBrowserMs: 225000, buildMs: 120000, hostedJobMs: 900000 })

// NEW ordinary-M2-only admission: +45s, not optimization or recovered history.
// Setup and the complete functional workload have independent nontransferable
// maxima; acquisition/cleanup remain inside total and the unchanged host cap.
export const ordinaryM2Budget = Object.freeze({ version: 1, setupMs: 45000,
  functionalMs: 45000, totalMs: 90000 })

// Historical v1 receipt declaration only; current composition is separately versioned below.
// Additional independent job/build: explicit 360s combined, not a speed improvement.
// Original gameplay→melee→corpse remains within its unchanged 180s allowance.
export const gameplayResourceSplitBudget = Object.freeze({ version: 1, gameplayMs: 180000,
  resourcesMs: 180000, totalBrowserMs: 360000, buildMsPerJob: 120000, hostedJobMs: 900000 })

// New source composition, not a per-job cap increase or performance result.
// UI gameplay355 plus main resources180 declares535s across independent jobs:
// +175s versus historical main360. No transfer of unused time between jobs.
export const composedGameplayResourceBudgetPolicy = 'composed-gameplay-resources-v2'
export const composedGameplayResourceSplitBudget = Object.freeze({ version: 2,
  gameplayMs: 355000, resourcesMs: 180000, totalBrowserMs: 535000,
  buildMsPerJob: 120000, hostedJobMs: 900000 })
// Only a trusted expectation may select this dimension. Raw receipt versions
// never select policy; unknown/null values must fail rather than fall back.
export function usesComposedGameplayResourceBudget(value) {
  if (value === undefined) return false
  if (value !== composedGameplayResourceBudgetPolicy) throw Error('Unsupported gameplay resource budget policy')
  return true
}
