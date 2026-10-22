import type { World } from './world-types.ts'
import { createHelpSession } from './help-session.ts'
import { helpContextTopic, type HelpContext } from './help-topic.ts'

type InputWorld = Pick<World, 'mode' | 'paused' | 'status' | 'inputMask'>
type PointerRegion = 'world' | 'hud' | 'article' | 'foreign'
type Key = Pick<
  KeyboardEvent,
  | 'key'
  | 'repeat'
  | 'ctrlKey'
  | 'altKey'
  | 'metaKey'
  | 'shiftKey'
  | 'defaultPrevented'
  | 'target'
  | 'preventDefault'
  | 'stopImmediatePropagation'
>
type Pointer = Pick<
  PointerEvent,
  | 'button'
  | 'pointerId'
  | 'clientX'
  | 'clientY'
  | 'defaultPrevented'
  | 'target'
  | 'preventDefault'
  | 'stopImmediatePropagation'
>
type Click = Pick<MouseEvent, 'button' | 'detail' | 'preventDefault' | 'stopImmediatePropagation'>

/** Inactive until the full renderer/collector is accepted. Required callbacks
 * deliberately have no inferred live-HUD, object, discovery or renderer defaults.
 * commit must synchronously publish through the current world's store; release
 * must run BEFORE another modal takes its own pause/input ownership. */
export function createHelpInputOwner<W extends InputWorld, S extends { world: W }>(binding: {
  world: W
  scene: S
  currentWorld: () => W
  currentScene: () => S | null
  blocked: () => boolean
  foreignKey: (event: Key) => boolean
  keyException: (event: Key) => boolean
  region: (event: Pointer) => PointerRegion
  context: (event?: Pointer) => HelpContext
  canCancelAt: (region: PointerRegion) => boolean
  prepare: (topic: number) => boolean
  unavailable: () => void
  clearGameplayGesture: () => void
  commit: (mutation: () => void) => void
}) {
  const { world, scene } = binding
  let disposed = false
  let unavailable = false
  const current = () =>
    !disposed &&
    binding.currentWorld() === world &&
    binding.currentScene() === scene &&
    scene.world === world
  const session = createHelpSession(world, current)
  const allowed = () =>
    !unavailable &&
    current() &&
    world.status === 'playing' &&
    !world.inputMask &&
    !binding.blocked()
  const pointers = new Map<number, number>()
  let swallowClick = false
  const consume = (event: { preventDefault(): void; stopImmediatePropagation(): void }) => {
    event.preventDefault()
    event.stopImmediatePropagation()
    return true
  }
  const change = (mutation: () => boolean) => {
    let changed = false
    binding.commit(() => {
      if (current()) changed = mutation()
    })
    return changed
  }
  const release = () => {
    if (disposed) return
    binding.commit(() => session.dispose())
    pointers.clear()
    swallowClick = false
    disposed = true
  }
  const open = (context: HelpContext) => {
    const topic = helpContextTopic(context)
    if (!binding.prepare(topic ?? session.topic)) {
      // No fabricated partial article. Recovery must release our ownership
      // before the caller can open its existing browser-recovery Menu.
      binding.commit(() => session.dispose())
      unavailable = true
      binding.unavailable()
      return false
    }
    return change(() => {
      binding.clearGameplayGesture()
      return session.openArticle(topic)
    })
  }
  return {
    session,
    armQuery() {
      if (!allowed()) return false
      return change(() => {
        if (session.phase !== 'inactive') return false
        binding.clearGameplayGesture()
        return session.armQuery()
      })
    },
    keyDown(event: Key) {
      if (
        !allowed() ||
        event.defaultPrevented ||
        event.key === 'F8' ||
        binding.keyException(event) ||
        binding.foreignKey(event)
      )
        return false
      if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return false
      if (event.key !== 'F1' && (event.key !== 'Escape' || session.phase === 'inactive'))
        return false
      consume(event)
      if (event.repeat) return true
      if (event.key === 'Escape' || session.phase === 'article') change(() => session.cancel())
      else open(binding.context())
      return true
    },
    pointerDown(event: Pointer) {
      swallowClick = false
      if (!allowed() || event.defaultPrevented || session.phase === 'inactive') return false
      const region = binding.region(event)
      if (region === 'foreign') return false
      if (event.button === 2) {
        pointers.set(event.pointerId, 2)
        return consume(event) // Native cancellation belongs to UP, never DOWN.
      }
      if (event.button !== 0 || region === 'article') return false
      pointers.set(event.pointerId, 0)
      consume(event)
      open(binding.context(event))
      return true
    },
    pointerUp(event: Pointer) {
      if (!current()) {
        pointers.clear()
        swallowClick = false
        return false
      }
      const owned = pointers.get(event.pointerId)
      pointers.delete(event.pointerId)
      if (owned === 0 && event.button === 0) swallowClick = true
      if (
        allowed() &&
        !event.defaultPrevented &&
        session.phase !== 'inactive' &&
        event.button === 2 &&
        binding.canCancelAt(binding.region(event))
      ) {
        change(() => session.cancel())
        return consume(event)
      }
      return owned !== undefined ? consume(event) : false
    },
    click(event: Click) {
      if (!current() || !swallowClick || event.button !== 0 || event.detail === 0) return false
      swallowClick = false
      return consume(event) // Do not leak the intercepted HUD press into React onClick.
    },
    resetGesture() {
      pointers.clear()
      swallowClick = false
    },
    release,
  }
}
