import units from './original-units.json' with { type: 'json' }
import { readBrowserHelpFrame, sameBrowserHelpFrame, type BrowserHelpFrame } from './help-browser-frame.ts'
import { getBrowserModelSunlightShades } from './model-lighting.ts'
import { peekLoadedSceneTexture } from './scene-assets.ts'
import { helpPreview, type HelpPreviewDescriptor, type HelpPreviewContext } from './help-preview.ts'
import { paintHelpPersonPreview, type HelpPersonContext } from './help-preview-person.ts'
import { createHelpVehicleCanvas, type BrowserHelpPresentationPolicy, type HelpCleanupFailure } from './help-preview-vehicle-canvas.ts'
import type { HelpVehicleContext } from './help-preview-vehicle.ts'
import type { WorldEnvironment } from './world-environment.ts'
import type { World } from './world-types.ts'

/** Structural read/lifecycle surface provided by the actual GameScene. Its
 * isCurrent method checks the scene's existing presentation-generation token. */
interface SceneOwner {
  readonly world: Pick<World, 'manaWorld'>
  readonly environment: WorldEnvironment
  isCurrent(): boolean
  readonly disposeListeners: (() => void)[]
}
type Animation = Pick<HelpPreviewContext, 'counter' | 'phase'>
type Availability<T> = { readonly status: 'available'; readonly context: T } |
  { readonly status: 'unavailable'; readonly reason: string }

export interface BrowserHelpPreviewSnapshot {
  readonly frame: BrowserHelpFrame
  readonly policy: BrowserHelpPresentationPolicy
  readonly player: number
  readonly environment: WorldEnvironment
  readonly lighting: 'browser-current-static'
  readonly person: Availability<Readonly<HelpPersonContext>>
  readonly vehicle: Availability<Readonly<HelpVehicleContext>>
}

type Atlas = {
  readonly key: string
  readonly entry: NonNullable<ReturnType<typeof peekLoadedSceneTexture>>
  readonly texture: NonNullable<ReturnType<typeof peekLoadedSceneTexture>>['texture']
  readonly image: HTMLImageElement
  readonly src: string
  readonly currentSrc: string
}
type Leases = { person: Atlas | null; vehicle: Atlas | null }
const unavailable = (reason: string) => ({ status: 'unavailable' as const, reason })

function borrowAtlas(key: string, width: number, height: number, document: Document): Atlas | null {
  const entry = peekLoadedSceneTexture(key), image: unknown = entry?.texture.image
  const ImageType = document.defaultView?.HTMLImageElement
  if (!entry || !ImageType || !(image instanceof ImageType) || !image.complete ||
      image.naturalWidth !== width || image.naturalHeight !== height) return null
  const src = image.src, currentSrc = image.currentSrc
  const expected = new URL(`/original/${key}.png`, document.baseURI).href
  if (src !== expected || (currentSrc && currentSrc !== expected)) return null
  return Object.freeze({ key, entry, texture: entry.texture, image, src, currentSrc })
}

function sameAtlas(a: Atlas | null, b: Atlas | null) {
  return !!a && !!b && a.entry === b.entry && a.texture === b.texture && a.image === b.image &&
    a.src === b.src && a.currentSrc === b.currentSrc
}

function supportedEnvironment(environment: WorldEnvironment) {
  const { landscape, objects } = environment ?? {}
  if (!landscape || !objects) return false
  const landscapeBank = new Map([[12, 'c'], [28, 's'], [25, 'p']]).get(landscape.requested)
  return landscape.supported && objects.supported && landscape.bank === landscapeBank &&
    landscape.modelAtlas === (landscapeBank === 'c' ? 'atlas' : `atlas-${landscapeBank}`) &&
    [0, 2, 6].includes(objects.requested) && objects.bank === (objects.requested === 6 ? 6 : 2)
}

/** Inactive, exclusive per-article presentation owner. The current scene owns
 * player/environment/generation and loaded atlases; this owner borrows them.
 * Its successful dedicated renderer owns the named browser policy, NOT native
 * globals: mode0, +0/+0 full-article origin and the tested linear vehicle profile.
 * Host must use snapshot.frame for prepareHelpDocument and articleStyle, placing
 * both unattached canvases inside that article. Re-sample after any failure.
 * This bounded owner requires WebGL2 setup even for a person-only article.
 * No loading callbacks, new clocks, World/save/camera/input changes or activation.
 */
export function createBrowserHelpPreviewOwner(scene: SceneOwner, shell: HTMLElement, hud: HTMLElement) {
  if (typeof scene?.isCurrent !== 'function' || !scene.isCurrent() || !scene.world?.manaWorld ||
      !scene.environment || !Array.isArray(scene.disposeListeners))
    return unavailable('help-scene-owner-unavailable')
  const initialFrame = readBrowserHelpFrame(shell, hud)
  if (initialFrame.status === 'unavailable') return initialFrame
  const created = createHelpVehicleCanvas()
  if (created.status === 'unsupported') return unavailable(created.reason)
  const vehicle = created.renderer
  let personCanvas: HTMLCanvasElement, person: CanvasRenderingContext2D | null
  try {
    personCanvas = shell.ownerDocument.createElement('canvas')
    person = personCanvas.getContext('2d')
  } catch {
    vehicle.dispose()
    return unavailable('help-person-canvas-unavailable')
  }
  if (!person) { vehicle.dispose(); return unavailable('help-person-canvas-unavailable') }
  const personContext = person
  const policy = vehicle.presentationPolicy
  let source: { scene: SceneOwner; world: SceneOwner['world']; environment: WorldEnvironment;
    shell: HTMLElement; hud: HTMLElement } | null = { scene, world: scene.world, environment: scene.environment, shell, hud }
  let samples = new WeakMap<BrowserHelpPreviewSnapshot, Leases>()
  let listeners: (() => void)[] | null = scene.disposeListeners
  const disposalFailures: HelpCleanupFailure[] = []
  for (const canvas of [personCanvas, vehicle.canvas]) {
    canvas.width = 1; canvas.height = 1
    Object.assign(canvas.style, { position: 'absolute', left: '0px', top: '0px',
      pointerEvents: 'none', imageRendering: 'pixelated' })
  }
  function clear() {
    if (!source) return
    personContext.clearRect(0, 0, personCanvas.width, personCanvas.height)
    vehicle.clear()
  }
  function dispose() {
    if (!source) return
    // Become terminal before touching fallible DOM/GPU methods. Every owned
    // release gets an independent attempt; never throw through scene cleanup.
    source = null
    samples = new WeakMap()
    const attempt = (operation: string, release: () => void) => {
      try { release() } catch (error) {
        disposalFailures.push(Object.freeze({ operation,
          message: error instanceof Error ? error.message : 'Unknown cleanup failure' }))
      }
    }
    // Replacing rather than splicing is safe during GameScene's forEach cleanup.
    const callbacks = listeners
    listeners = null
    attempt('help-unsubscribe-scene', () => {
      const index = callbacks?.indexOf(dispose) ?? -1
      if (index >= 0 && callbacks) callbacks[index] = () => {}
    })
    attempt('help-clear-person', () => personContext.clearRect(0, 0, personCanvas.width, personCanvas.height))
    attempt('help-clear-vehicle', () => vehicle.clear())
    attempt('help-dispose-vehicle', () => vehicle.dispose())
    attempt('help-shrink-person-width', () => { personCanvas.width = 1 })
    attempt('help-shrink-person-height', () => { personCanvas.height = 1 })
    attempt('help-remove-person', () => personCanvas.remove())
    attempt('help-remove-vehicle', () => vehicle.canvas.remove())
  }
  listeners.push(dispose)

  function current() {
    return source && source.scene.isCurrent() && source.scene.world === source.world &&
      source.scene.environment === source.environment ? source : null
  }

  function sample(): { status: 'sampled'; snapshot: BrowserHelpPreviewSnapshot } | ReturnType<typeof unavailable> {
    const owner = current()
    if (!owner) { clear(); return unavailable('help-scene-owner-stale') }
    const measured = readBrowserHelpFrame(owner.shell, owner.hud)
    if (measured.status === 'unavailable') { clear(); return measured }
    const { environment } = owner.scene, player = owner.scene.world.manaWorld?.playerTribe
    if (!supportedEnvironment(environment)) { clear(); return unavailable('help-environment-unsupported') }
    if (!Number.isInteger(player) || player < 0 || player > 3) { clear(); return unavailable('help-player-unsupported') }
    const shadeTable = getBrowserModelSunlightShades()
    if (!Object.isFrozen(shadeTable) || shadeTable.length !== 1024) {
      clear(); return unavailable('help-current-lighting-unavailable')
    }
    const frame = measured.frame
    const leases = {
      person: borrowAtlas(units.atlas, units.width, units.height, owner.shell.ownerDocument),
      vehicle: borrowAtlas(environment.landscape.modelAtlas, 256, 1024, owner.shell.ownerDocument),
    }
    const snapshot: BrowserHelpPreviewSnapshot = Object.freeze({
      frame, policy, player, environment, lighting: 'browser-current-static',
      person: Object.freeze(leases.person ? { status: 'available', context: Object.freeze({
        player, spriteMode: policy.personSpriteMode, screenWidth: frame.width, screenHeight: frame.height,
      }) } : unavailable('help-person-atlas-unavailable')),
      vehicle: Object.freeze(leases.vehicle ? { status: 'available', context: Object.freeze({
        presentationPolicy: policy, profile: policy.profile, vertexShiftX: policy.vertexShiftX,
        vertexShiftY: policy.vertexShiftY, objectBank: environment.objects.bank, player,
        width: frame.width, height: frame.height, shadeTable,
      }) } : unavailable('help-vehicle-atlas-unavailable')),
    })
    samples.set(snapshot, leases)
    return { status: 'sampled', snapshot }
  }

  function validate(snapshot: BrowserHelpPreviewSnapshot, kind: keyof Leases) {
    const leases = samples.get(snapshot)
    if (!leases || snapshot.policy !== policy) return 'help-snapshot-owner-mismatch'
    const fresh = sample()
    if (fresh.status !== 'sampled') return fresh.reason
    const next = fresh.snapshot
    if (snapshot.player !== next.player || snapshot.environment !== next.environment ||
        !sameBrowserHelpFrame(snapshot.frame, next.frame)) return 'help-snapshot-stale'
    if (!sameAtlas(leases[kind], samples.get(next)![kind])) return `help-${kind}-atlas-stale`
    if (kind === 'vehicle' && (snapshot.vehicle.status !== 'available' || next.vehicle.status !== 'available' ||
        snapshot.vehicle.context.shadeTable !== next.vehicle.context.shadeTable)) return 'help-lighting-stale'
    return null
  }

  function place(snapshot: BrowserHelpPreviewSnapshot) {
    for (const canvas of [personCanvas, vehicle.canvas]) {
      canvas.style.width = `${snapshot.frame.width}px`
      canvas.style.height = `${snapshot.frame.height}px`
    }
  }

  function validAnimation(animation: Animation) {
    return !!animation?.phase && [animation.counter, animation.phase.counter, animation.phase.frame].every(Number.isInteger) &&
      animation.phase.frame >= 0
  }

  const owner = {
    policy, personCanvas, vehicleCanvas: vehicle.canvas, sample, clear, dispose,
    get disposalFailures() { return Object.freeze([...disposalFailures, ...vehicle.disposalFailures]) },
    drawPerson(snapshot: BrowserHelpPreviewSnapshot, descriptor: HelpPreviewDescriptor, animation: Animation) {
      clear()
      if (!validAnimation(animation)) return unavailable('help-animation-input-invalid')
      const invalid = validate(snapshot, 'person')
      if (invalid) return unavailable(invalid)
      if (descriptor.kind !== 0 || snapshot.person.status !== 'available') return unavailable('help-person-request-unsupported')
      const result = helpPreview(descriptor, { ...animation, pane: snapshot.frame.preview, person: snapshot.person.context })
      if (result.status !== 'ready') return result
      place(snapshot)
      personCanvas.width = snapshot.frame.width; personCanvas.height = snapshot.frame.height
      const painted = paintHelpPersonPreview(personContext, samples.get(snapshot)!.person!.image, result.request)
      return painted.status === 'drawn' ? { ...painted, phase: result.request.phase } : painted
    },
    drawVehicle(snapshot: BrowserHelpPreviewSnapshot, descriptor: HelpPreviewDescriptor, animation: Animation) {
      clear()
      if (!validAnimation(animation)) return unavailable('help-animation-input-invalid')
      const invalid = validate(snapshot, 'vehicle')
      if (invalid) return unavailable(invalid)
      if (descriptor.kind !== 2 || snapshot.vehicle.status !== 'available') return unavailable('help-vehicle-request-unsupported')
      const result = helpPreview(descriptor, { ...animation, pane: snapshot.frame.preview })
      if (result.status !== 'unsupported' || result.request?.kind !== 'object' || result.request.category !== 'vehicle')
        return unavailable('help-vehicle-request-unsupported')
      place(snapshot)
      return vehicle.draw(result.request, snapshot.vehicle.context, samples.get(snapshot)!.vehicle!.image)
    },
  }
  return { status: 'created' as const, owner: Object.freeze(owner) }
}
