import type { World } from './world-types.ts'
import { TURNS_PER_SECOND } from './world-rules.ts'

// One transient HUD command, outside checkpoints. The elapsed 12 Hz opportunity
// is a port policy; the original shared command ring and cadence are not modeled.
export class FollowerNearbyMode {
  private anchor: number | null = null
  private previous: number | null = null
  private visits = 0
  private pending: { world: World; nearby: boolean; arrived: number } | null = null

  request(world: World, now: number, cue: (id: number) => void) {
    if (!Number.isFinite(now)) return false
    const nearby = !(world.castingTribes[0].flags & 128)
    cue(nearby ? 0x6e : 0x6f)
    if (this.pending) return false
    this.pending = { world, nearby, arrived: now }
    return true
  }

  advance(world: World, now: number) {
    if (!Number.isFinite(now) || (this.previous !== null && now <= this.previous)) return false
    this.previous = now
    if (this.anchor === null) {
      this.anchor = now
      return false
    }
    const reached = Math.floor(((now - this.anchor) * TURNS_PER_SECOND) / 1000 + 1e-9),
      previousVisit = this.visits
    this.visits = reached
    const request = this.pending
    if (!request || reached <= previousVisit) return false
    if (request.world !== world) {
      this.cancel()
      return false
    }
    const arrivalVisit = Math.ceil(
      ((request.arrived - this.anchor) * TURNS_PER_SECOND) / 1000 - 1e-9
    )
    if (Math.max(previousVisit + 1, arrivalVisit) > reached) return false
    this.pending = null
    const [tribe] = world.castingTribes
    tribe.flags = (tribe.flags & ~128) | (request.nearby ? 128 : 0)
    return true
  }

  cancel() {
    this.pending = null
  }

  reset() {
    this.cancel()
    this.anchor = null
    this.previous = null
    this.visits = 0
  }
}
