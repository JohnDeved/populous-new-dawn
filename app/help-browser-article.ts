import { createBrowserHelpPreviewOwner, type BrowserHelpPreviewSnapshot } from './help-browser-preview.ts'
import { sameBrowserHelpFrame } from './help-browser-frame.ts'
import { helpPreview, type HelpPreviewContext } from './help-preview.ts'
import { prepareHelpDocument, preflightHelpAssets, helpArticleAssets, type HelpDocument } from './help-document.ts'
import { createHelpScrollController, helpNavigationAssets, helpScrollbarAssets,
  helpScrollbarPlan, helpScrollbarHover, helpNavigationFrame,
  type HelpControlDrawState, type HelpScrollSample } from './help-controls.ts'
import type { HelpDiscovery } from './help-discovery.ts'
import type { HelpCleanupFailure } from './help-preview-vehicle-canvas.ts'

type SceneOwner = Parameters<typeof createBrowserHelpPreviewOwner>[0]
type Animation = Pick<HelpPreviewContext, 'counter' | 'phase'>

/** Supplied by an eventual knowledge owner, NOT built from partial current
 * readers. Hut1/GuardPost17 and unowned players remain integration blockers.
 * The historical HelpDiscovery.levelFlags field means native gameFlags. */
export type BrowserHelpDiscovery =
  | { status: 'provided'; value: HelpDiscovery }
  | { status: 'unavailable'; reason: string }

export interface BrowserHelpArticleInput {
  topic: number
  discovery: BrowserHelpDiscovery
  scrollPosition: number
  controls: HelpControlDrawState
  animation: Animation
  hoverPoint: { x: number; y: number } | null
  /** Explicit opt-in to the accepted browser renderer, not shared dispatch readiness. */
  vehiclePreview: 'disabled' | 'browser-owned-linear'
}

export interface BrowserHelpArticlePresentation {
  readonly status: 'presented'
  readonly snapshot: BrowserHelpPreviewSnapshot
  readonly document: HelpDocument
  readonly discovery: HelpDiscovery
  readonly position: number
  readonly offset: number
  readonly maximum: number
  readonly controls: HelpControlDrawState
  readonly hoverPoint: { x: number; y: number } | null
  /** Caller may retain the returned person phase. This owner never advances a clock. */
  readonly preview: { status: 'native-empty'; nativeKind: number } |
    { status: 'drawn'; kind: 'person'; phase: Animation['phase'] } |
    { status: 'drawn'; kind: 'vehicle' }
}
export type BrowserHelpArticleState = BrowserHelpArticlePresentation |
  { readonly status: 'unavailable'; readonly reason: string }
const unavailable = (reason: string) => Object.freeze({ status: 'unavailable' as const, reason })

/** Inactive full-article composition, deliberately not a GameScene/Home caller.
 * Owns presentation only. No session, pause, input listener, timer, World/save
 * writes, native-global stand-ins or preview asset loads. present() accepts the
 * caller's separate control/preview samples; afterDraw() is explicitly separate.
 * Native runtime cadence and complete CURRENT discovery are unresolved gates.
 */
export function createBrowserHelpArticleOwner(scene: SceneOwner, shell: HTMLElement, hud: HTMLElement) {
  const created = createBrowserHelpPreviewOwner(scene, shell, hud)
  if (created.status !== 'created') return created
  const preview = created.owner
  const scrollController = createHelpScrollController()
  let source: { scene: SceneOwner; world: SceneOwner['world']; environment: SceneOwner['environment'] } | null =
    { scene, world: scene.world, environment: scene.environment }
  let callbacks: (() => void)[] | null = scene.disposeListeners
  const subscribers = new Set<() => void>()
  const failures: HelpCleanupFailure[] = []
  let state: BrowserHelpArticleState = unavailable('help-article-not-presented')
  let revision = 0
  let readyAssets: string | null = null
  let mounted = false
  let mountRevision = 0
  const attempt = (operation: string, action: () => void) => {
    try { action() } catch (error) {
      failures.push(Object.freeze({ operation, message: error instanceof Error ? error.message : 'Unknown Help failure' }))
    }
  }
  function publish(next: BrowserHelpArticleState) {
    state = next
    for (const notify of [...subscribers]) attempt('help-article-notify', notify)
  }
  function invalidate(reason: string) {
    if (!source) return state
    ++revision
    attempt('help-article-clear-preview', preview.clear)
    scrollController.reset()
    publish(unavailable(reason))
    return state
  }
  function current() {
    return !!source && source.scene.isCurrent() && source.scene.world === source.world &&
      source.scene.environment === source.environment
  }
  function matches(snapshot: BrowserHelpPreviewSnapshot) {
    if (!current()) return false
    const sampled = preview.sample()
    return sampled.status === 'sampled' && sampled.snapshot.player === snapshot.player &&
      sampled.snapshot.environment === snapshot.environment &&
      sameBrowserHelpFrame(sampled.snapshot.frame, snapshot.frame)
  }
  function isCurrent(presentation: BrowserHelpArticleState): presentation is BrowserHelpArticlePresentation {
    if (presentation !== state || presentation.status !== 'presented') return false
    try { if (matches(presentation.snapshot)) return true } catch { /* Fail closed below. */ }
    invalidate('help-article-presentation-stale')
    return false
  }
  function dispose() {
    if (!source) return
    source = null
    ++revision
    readyAssets = null
    const listeners = callbacks
    callbacks = null
    attempt('help-article-unsubscribe-scene', () => {
      const index = listeners?.indexOf(dispose) ?? -1
      if (listeners && index >= 0) listeners[index] = () => {}
    })
    scrollController.reset()
    attempt('help-article-dispose-preview', preview.dispose)
    publish(unavailable('help-article-disposed'))
    subscribers.clear()
  }
  callbacks.push(dispose)

  async function present(input: BrowserHelpArticleInput): Promise<BrowserHelpArticleState> {
    if (!source) return state
    const pending = ++revision
    const reject = (reason: string) => pending === revision ? invalidate(reason) : state
    try {
      if (!current()) return reject('help-scene-owner-stale')
      if (input.discovery.status !== 'provided') return reject(input.discovery.reason)
      helpNavigationFrame(false, false, input.controls.counter)
      if (typeof input.controls.leftDown !== 'boolean' || typeof input.controls.leftUp !== 'boolean' ||
          !Number.isSafeInteger(input.scrollPosition) || input.scrollPosition < 0 ||
          !input.animation?.phase || ![input.animation.counter, input.animation.phase.counter,
            input.animation.phase.frame].every(Number.isInteger) || input.animation.phase.frame < 0 ||
          !['disabled', 'browser-owned-linear'].includes(input.vehiclePreview))
        return reject('help-article-input-invalid')
      const sampled = preview.sample()
      if (sampled.status !== 'sampled') return reject(sampled.reason)
      const snapshot = sampled.snapshot, { width, height, hudWidth } = snapshot.frame
      const document = prepareHelpDocument(input.topic, width, height, hudWidth)
      if (document.status !== 'ready') return reject(document.reason)
      const scroll = helpScrollbarPlan(document.panels.scrollbar, document.article.height,
        document.panels.inner.article.height, input.scrollPosition, null)
      helpScrollbarHover(scroll, input.hoverPoint)
      const controls = Object.freeze({ ...input.controls })
      const hoverPoint = input.hoverPoint && Object.freeze({ ...input.hoverPoint })
      const animation = { counter: input.animation.counter, phase: Object.freeze({ ...input.animation.phase }) }
      const discovery = Object.freeze({ ...input.discovery.value,
        stock: Object.freeze([...input.discovery.value.stock]),
        spellDefinitionByte: Object.freeze([...input.discovery.value.spellDefinitionByte]) })
      const descriptor = document.source.illustration
      const dispatch = helpPreview(descriptor, { ...animation, pane: snapshot.frame.preview,
        person: snapshot.person.status === 'available' ? snapshot.person.context : undefined })
      const vehicle = descriptor.kind === 2 && input.vehiclePreview === 'browser-owned-linear'
      if (dispatch.status === 'unsupported' && !vehicle) return reject(dispatch.reason)
      const assets = [...helpArticleAssets(document), ...helpNavigationAssets(),
        ...(scroll.thumb ? helpScrollbarAssets() : [])]
      const assetKey = JSON.stringify(assets)
      const continuing = state.status === 'presented' && state.document.topic === document.topic &&
        state.snapshot.player === snapshot.player && state.snapshot.environment === snapshot.environment &&
        sameBrowserHelpFrame(state.snapshot.frame, snapshot.frame)
      if (!continuing || readyAssets !== assetKey) {
        attempt('help-article-clear-preview', preview.clear)
        scrollController.reset()
        publish(unavailable('help-article-preparing'))
      }
      if (readyAssets !== assetKey) {
        await preflightHelpAssets(assets)
        if (pending !== revision || !source) return state
        readyAssets = assetKey
      }
      if (pending !== revision || !source) return state
      if (!matches(snapshot)) return reject('help-article-presentation-stale')
      let painted: BrowserHelpArticlePresentation['preview']
      if (dispatch.status === 'native-empty') { preview.clear(); painted = dispatch }
      else if (vehicle) {
        const result = preview.drawVehicle(snapshot, descriptor, animation)
        if (result.status !== 'drawn') return reject(result.reason)
        painted = { status: 'drawn', kind: 'vehicle' }
      } else {
        const result = preview.drawPerson(snapshot, descriptor, animation)
        if (result.status !== 'drawn') return reject('reason' in result ? result.reason : 'help-person-preview-unavailable')
        painted = { status: 'drawn', kind: 'person', phase: result.phase }
      }
      for (const canvas of [preview.personCanvas, preview.vehicleCanvas]) {
        canvas.style.width = `${snapshot.frame.width}px`
        canvas.style.height = `${snapshot.frame.height}px`
      }
      publish(Object.freeze({ status: 'presented', snapshot, document, discovery,
        position: scroll.position, offset: scroll.pixels, maximum: scroll.maximum,
        controls, hoverPoint, preview: Object.freeze(painted) }))
      return state
    } catch (error) {
      return reject(error instanceof Error ? error.message : 'help-article-presentation-failed')
    }
  }
  return { status: 'created' as const, owner: Object.freeze({
    personCanvas: preview.personCanvas, vehicleCanvas: preview.vehicleCanvas,
    scrollController, present, isCurrent, invalidate, dispose,
    /** React StrictMode replays layout-effect setup/cleanup in one turn. Defer
     * only unmount disposal to its microtask checkpoint, not animation or input.
     * Scene disposal remains immediate and a terminal owner can never revive. */
    mount() {
      if (!source || mounted) throw new Error('Help article owner is disposed or already mounted')
      mounted = true
      const lease = ++mountRevision
      let active = true
      return () => {
        if (!active || mountRevision !== lease) return
        active = false
        mounted = false
        const detached = ++mountRevision
        queueMicrotask(() => { if (!mounted && detached === mountRevision) dispose() })
      }
    },
    /** The root must be a full-shell child, not mounted in the battlefield or
     * a preview pane. Check actual CSS placement before attaching either canvas;
     * this also rejects accidental extra scale/DPR transforms. */
    attach(presentation: BrowserHelpArticleState, surface: HTMLElement, slot: HTMLElement) {
      if (!isCurrent(presentation)) return false
      const frame = presentation.snapshot.frame
      const sameRect = (element: HTMLElement, expected: { x: number; y: number; width: number; height: number }) => {
        const measured = element.getBoundingClientRect()
        return (['x', 'y', 'width', 'height'] as const).every(key =>
          Number.isFinite(measured[key]) && Math.abs(measured[key] - expected[key]) <= 1 / 64)
      }
      try {
        if (!surface.isConnected || !slot.isConnected || surface.parentElement !== shell ||
            surface.ownerDocument !== shell.ownerDocument ||
            slot.ownerDocument !== shell.ownerDocument || !surface.contains(slot) ||
            !sameRect(surface, frame.shell) || !sameRect(slot, { x: frame.shell.x, y: frame.shell.y,
              width: frame.width * frame.scale, height: frame.height * frame.scale })) {
          invalidate('help-article-placement-mismatch')
          return false
        }
        slot.append(preview.personCanvas, preview.vehicleCanvas)
        return true
      } catch (error) {
        invalidate(error instanceof Error ? error.message : 'help-article-attachment-failed')
        return false
      }
    },
    getSnapshot: () => state,
    subscribe(notify: () => void) {
      if (source) subscribers.add(notify)
      return () => { subscribers.delete(notify) }
    },
    /** Call only AFTER the caller's actual draw. Returns a proposal for the next
     * draw; never writes session position or infers input from browser events. */
    afterDraw(presentation: BrowserHelpArticleState, input: HelpScrollSample) {
      if (!isCurrent(presentation)) return null
      return scrollController.sample(presentation.position, presentation.maximum, input)
    },
    get disposalFailures() { return Object.freeze([...failures, ...preview.disposalFailures]) },
  }) }
}
export type BrowserHelpArticleOwner = Extract<ReturnType<typeof createBrowserHelpArticleOwner>,
  { status: 'created' }>['owner']
