import type { GameScene } from './scene.ts'
import type { Unit } from './world-types.ts'
import { unitAnimationSource } from './unit-animation-source.ts'

export const NEUTRAL_CURSOR_URL = '/original/cursor-point14.png'
export const NEUTRAL_CURSOR_CSS = `url("${NEUTRAL_CURSOR_URL}") 0 0, auto`
export const CURSOR_ASSET_TIMEOUT_MS = 10_000

// POINT14 is source-bound artwork, but these conservative browser gates are not
// a reconstruction of every native input flag. Keep contextual states unchanged.
export function neutralCanvasState(scene: GameScene) {
  const w = scene.world
  return (
    scene.started &&
    scene.isCurrent() &&
    w.status === 'playing' &&
    !w.paused &&
    !w.inputMask &&
    w.mode === null &&
    w.selected.length === 0 &&
    !(w.manaWorld.gameFlags & 32) &&
    !scene.modalSuspended &&
    !scene.overviewActive &&
    !scene.overviewStage &&
    !scene.wasFlying &&
    !(w.flyby.flags & 1) &&
    !scene.cameraMotion.active &&
    !scene.resultCamera.active &&
    !scene.pointerButtons &&
    !scene.pointerGesture &&
    !scene.drag &&
    !scene.dragActive.value &&
    !scene.globeMotion.dragging &&
    scene.keys.size === 0 &&
    !scene.neutralCursorRosterSelected &&
    !scene.cursorFrameBlocked
  )
}

// Accumulated by the existing unit-ID traversal, not by pointer events or a
// second per-frame roster scan. Include all retained sources conservatively.
export function cursorRosterSelected(u: Unit) {
  if (u.team !== 'blue' || u.hp <= 0) return false
  const source = unitAnimationSource(u)
  return !!(
    ((source?.selectionFlags ?? 0) |
      (u.native?.selectionFlags ?? 0) |
      (u.entry?.person.selectionFlags ?? 0) |
      (u.builder?.person?.selectionFlags ?? 0)) &
    128
  )
}

// One owner per scene. Preparation settles before GameScene.ready; failure is a
// stable fallback for that scene, never a late first-hover artwork replacement.
export class NeutralCanvasCursor {
  readonly ready: Promise<void>
  private image: HTMLImageElement | null = null
  private prepared = false
  private disposed = false
  private point: { x: number; y: number } | null = null
  private modifiers = false
  private owned = false
  private prior = ''
  private priorPriority = ''
  private timer: ReturnType<typeof setTimeout> | undefined
  private finish: (loaded: boolean) => void = () => {}
  private stops: (() => void)[] = []

  private canvas: HTMLCanvasElement
  private eligible: () => boolean

  constructor(canvas: HTMLCanvasElement, eligible: () => boolean) {
    this.canvas = canvas
    this.eligible = eligible
    const doc = canvas.ownerDocument
    const win = doc.defaultView!
    const listen = (target: EventTarget, name: string, callback: EventListener) => {
      target.addEventListener(name, callback, true)
      this.stops.push(() => target.removeEventListener(name, callback, true))
    }
    const pointer = ((event: PointerEvent) => {
      this.modifiers = event.altKey || event.ctrlKey || event.shiftKey || event.metaKey
      this.point =
        event.target === canvas && event.pointerType === 'mouse' && !event.buttons
          ? { x: event.clientX, y: event.clientY }
          : null
      // Events may clear ownership, but only the scene frame may install after
      // its roster aggregate and current state have been refreshed.
      if (!this.point || this.modifiers || !this.eligible()) this.restore()
    }) as EventListener
    for (const name of ['pointerover', 'pointermove', 'pointerdown', 'pointerup'])
      listen(doc, name, pointer)
    for (const name of ['pointerleave', 'pointercancel', 'lostpointercapture'])
      listen(canvas, name, () => this.reset())
    listen(win, 'blur', () => this.reset())
    listen(doc, 'focusin', event => {
      if (event.target !== canvas) this.reset()
    })
    listen(doc, 'visibilitychange', () => this.reset())
    listen(doc, 'keydown', () => this.reset())
    // A fresh pointer event is required after keyboard navigation/focus loss.
    this.ready = new Promise(resolve => {
      let settled = false
      this.finish = loaded => {
        if (settled) return
        settled = true
        clearTimeout(this.timer)
        this.prepared = loaded && !this.disposed
        if (!this.prepared) {
          this.image?.removeAttribute('src')
          this.image = null
        }
        resolve()
      }
      this.timer = setTimeout(() => this.finish(false), CURSOR_ASSET_TIMEOUT_MS)
      try {
        const image = new Image()
        this.image = image
        image.src = NEUTRAL_CURSOR_URL
        image.decode().then(
          () => this.finish(image.naturalWidth === 17 && image.naturalHeight === 17),
          () => this.finish(false)
        )
      } catch {
        this.finish(false)
      }
    })
  }

  update() {
    const doc = this.canvas.ownerDocument
    if (
      this.disposed ||
      !this.prepared ||
      !this.point ||
      this.modifiers ||
      doc.hidden ||
      !doc.hasFocus() ||
      !this.eligible() ||
      doc.elementFromPoint(this.point.x, this.point.y) !== this.canvas
    ) {
      this.restore()
      return
    }
    if (!this.owned) {
      this.prior = this.canvas.style.getPropertyValue('cursor')
      this.priorPriority = this.canvas.style.getPropertyPriority('cursor')
      this.canvas.style.setProperty('cursor', NEUTRAL_CURSOR_CSS)
      this.owned = true
    }
  }

  reset() {
    this.point = null
    this.modifiers = false
    this.restore()
  }

  private restore() {
    if (!this.owned) return
    if (this.prior) this.canvas.style.setProperty('cursor', this.prior, this.priorPriority)
    else this.canvas.style.removeProperty('cursor')
    this.owned = false
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.reset()
    this.finish(false)
    this.image?.removeAttribute('src')
    this.image = null
    this.stops.forEach(stop => stop())
    this.stops = []
  }
}
