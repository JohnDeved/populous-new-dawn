// This is one specific continuation of a genuinely acquired Spy, not a fixture.
export const SPY_RESTART = Object.freeze({
  profileId: '63037eff-3c34-4fd8-9be7-a089e1e49f6b',
  priorRunId: 'a12f88d1-1137-4cd7-b7a8-1c1c5bb47b11',
  source: '278b470489fb99681c788dbb57b5d6bc4fe3a228',
  checkpointSha256: 'c2f5aacc335c5e4b73f4d8e9edb40a79d073f5d7019a704a88e0f97ccfa9e5bb',
  actorId: 394, schoolId: 340, turn: 1973, origin: 'http://127.0.0.1:4493',
  candidates: Object.freeze([285, 286, 287]), maxRouteLength: 170,
})

export function requireSpyRestart(profile) {
  const saved = profile?.checkpointAtStart, prior = profile?.previousRun
  if (profile?.mode !== 'reused' || profile.id !== SPY_RESTART.profileId ||
    profile.origin !== SPY_RESTART.origin || prior?.runId !== SPY_RESTART.priorRunId ||
    prior.sourceCommit !== SPY_RESTART.source || !prior.cleanupVerified || !prior.continuationVerified ||
    profile.correspondence?.decision !== 'ACCEPT' || saved?.checkpointSha256 !== SPY_RESTART.checkpointSha256 ||
    saved.level !== 16 || saved.turn !== SPY_RESTART.turn || saved.version !== 1 ||
    prior.checkpointAtEnd?.checkpointSha256 !== saved.checkpointSha256)
    throw Error('Continuation requires the exact closed Spy02 profile and genuine trained-Spy checkpoint')
  return saved
}

const delta = (a, b) => ((b - a + 128) % 256 + 256) % 256 - 128
const distance = (a, b) => Math.hypot(delta(a.x, b.x), delta(a.z, b.z))
export function spyRouteLength(start, points) {
  if (!points.length || [start, ...points].some(p => !Number.isFinite(p.x) || !Number.isFinite(p.z)))
    throw Error('A nonempty finite actual route is required')
  return [start, ...points].slice(1).reduce((sum, p, i) => sum + distance(i ? points[i - 1] : start, p), 0)
}

// Navigation APIs and their synchronizers mutate input. Every goal gets its own
// complete structured clone; no clone is stepped or installed in the game.
export function probeSpyRoutes(world, candidates, plan) {
  const original = world.units.find(u => u.id === SPY_RESTART.actorId && u.hp > 0)
  if (!original?.native || world.objectCells.objects.get(original.id) !== original.native)
    throw Error('The genuine loaded Spy must own its native registry record')
  return SPY_RESTART.candidates.map(id => {
    const candidate = candidates.find(b => b.id === id), attempts = []
    if (!candidate || candidate.team !== 'yellow') return { id, attempts, rejected: 'Target is missing or ineligible' }
    for (const goal of candidate.goals) {
      const probe = structuredClone(world), actor = probe.units.find(u => u.id === original.id)
      const points = plan(probe, actor, structuredClone(goal))
      if (!points.length) { attempts.push({ goal, rejected: 'Maintained navigation returned no route' }); continue }
      const length = spyRouteLength(original, points)
      attempts.push({ goal, points, length })
      // Sample every <=2 world units for a bounded proximity report, never a
      // safety guarantee. Same-tribe disguise may later be revealed at sabotage.
      const samples = [{ x: original.x, z: original.z }]
      for (const point of points) {
        const from = samples.at(-1), dx = delta(from.x, point.x), dz = delta(from.z, point.z)
        const count = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 2))
        for (let n = 1; n <= count; n++) samples.push({ x: from.x + dx * n / count, z: from.z + dz * n / count })
      }
      const defenders = world.units.filter(u => u.hp > 0 && u.inside === null && !['blue', 'wild'].includes(u.team))
        .map(u => ({ id: u.id, team: u.team, kind: u.kind,
          nearestSampleDistance: Math.min(...samples.map(p => distance(u, p))) }))
        .sort((a, b) => a.nearestSampleDistance - b.nearestSampleDistance).slice(0, 8)
      return { ...candidate, attempts, route: points, goal, length, defenders,
        eligible: length <= SPY_RESTART.maxRouteLength }
    }
    return { ...candidate, attempts, rejected: 'No special or outside route' }
  })
}
