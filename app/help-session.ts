import type { World } from './world-types.ts'

export type HelpPhase = 'inactive' | 'query' | 'article'
type HelpWorld = Pick<World, 'mode' | 'paused' | 'status'>

/** Transient, scene-owned help input state. It never becomes checkpoint data.
 * Native Query and article entry have separate return modes. Prior-pause and
 * same-scene restoration are deliberate safer browser lifecycle adaptations. */
export function createHelpSession(world: HelpWorld, isCurrent: () => boolean) {
  let phase: HelpPhase = 'inactive'
  let queryMode: HelpWorld['mode'] = null
  let articleMode: HelpWorld['mode'] = null
  let articleReturn: 'inactive' | 'query' = 'inactive'
  let articlePaused = false
  let topic = 984
  let disposed = false
  const ownsWorld = () => !disposed && isCurrent() && world.status === 'playing'
  const closeArticle = () => {
    if (!ownsWorld() || phase !== 'article') return false
    world.paused = articlePaused
    world.mode = articleReturn === 'query' ? null : articleMode
    phase = articleReturn
    return true
  }
  return {
    get phase(): HelpPhase {
      return ownsWorld() ? phase : 'inactive'
    },
    get topic() {
      return topic
    },
    armQuery() {
      if (!ownsWorld() || phase !== 'inactive') return false
      queryMode = world.mode
      world.mode = null
      phase = 'query'
      return true
    },
    openArticle(contextTopic: number | null = null) {
      if (!ownsWorld()) return false
      if (contextTopic !== null && (!Number.isInteger(contextTopic) || contextTopic < 983 || contextTopic > 1070))
        throw new RangeError('Unimported Encyclopaedia topic')
      if (phase !== 'article') {
        articleReturn = phase
        articleMode = world.mode
        articlePaused = world.paused
        world.mode = null
        world.paused = true
        phase = 'article'
      }
      // Retargeting retains the original browser pause/return owner. Unlike the
      // original's repeated panel-open path, it cannot overwrite that owner.
      if (contextTopic !== null) topic = contextTopic
      return true
    },
    closeArticle,
    cancel() {
      if (!ownsWorld() || phase === 'inactive') return false
      if (phase === 'article') return closeArticle()
      world.mode = queryMode
      phase = 'inactive'
      return true
    },
    dispose() {
      if (disposed) return
      if (ownsWorld()) {
        if (phase === 'article') closeArticle()
        if (phase === 'query') world.mode = queryMode
      }
      phase = 'inactive'
      disposed = true
    },
  }
}

export type HelpSession = ReturnType<typeof createHelpSession>
