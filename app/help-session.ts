import type { World } from './world-types.ts'
import { createHelpHistory, validateHelpTopic } from './help-history.ts'

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
  const history = createHelpHistory()
  let scrollPosition = 0
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
      return history.topic
    },
    get canBack() { return history.canBack },
    get canForward() { return history.canForward },
    get scrollPosition() { return scrollPosition },
    scroll(position: number) {
      if (!ownsWorld() || phase !== 'article') return false
      if (!Number.isFinite(position)) throw new RangeError('Invalid help scroll position')
      scrollPosition = Math.max(0, Math.trunc(position))
      return true
    },
    navigate(action: 'back' | 'forward' | 'home' | number) {
      if (!ownsWorld() || phase !== 'article') return false
      const prior = history.topic
      const next = typeof action === 'number' ? history.visit(action)
        : action === 'home' ? history.visit(984) : history[action]()
      if (next === null) return false
      // 0045dd22 resets scroll when a different article is laid out. Link/home
      // activation also explicitly resets it, even for the current topic.
      if (next !== prior || action === 'home' || typeof action === 'number') scrollPosition = 0
      return true
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
      if (contextTopic !== null) validateHelpTopic(contextTopic)
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
      if (contextTopic !== null) {
        history.visit(contextTopic)
        scrollPosition = 0
      }
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
