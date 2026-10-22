import rules from './original-rules.json' with { type: 'json' }
import units from './original-units.json' with { type: 'json' }
import { spriteAtlasOrigin, spriteLayers } from './sprite-layers.ts'
import type { HelpRect } from './help-layout.ts'

export interface HelpPreviewPhase {
  readonly counter: number
  readonly frame: number
}

/** These are native rendering inputs, not a live Unit or a guessed portrait. */
export interface HelpPersonContext {
  readonly player: number
  readonly spriteMode: number
  readonly screenWidth: number
  readonly screenHeight: number
}

export interface HelpPersonPreview {
  readonly kind: 'person'
  readonly animationObject: number
  readonly animation: number
  readonly descriptor: number
  readonly frame: number
  readonly sourceFrame: number
  readonly phase: HelpPreviewPhase
  readonly layers: readonly {
    readonly piece: number
    readonly source: { x: number; y: number; width: number; height: number }
    readonly target: { x: number; y: number; width: number; height: number }
    readonly mirror: boolean
  }[]
}

type PersonResult =
  | { status: 'ready'; request: HelpPersonPreview }
  | { status: 'unsupported'; reason: string }

type Cycle = { frames: number[]; flip: boolean; source: number }
const followerSources: Readonly<Record<string, readonly Cycle[]>> = units.followerSources
const shamanSources: Readonly<Record<string, readonly Cycle[]>> = units.shamanSources
const unscaledView = { scale: 1, spriteScale: 1, shamanScale: 1 }

/** Source advances once when the native counter differs, not once per paint and
 * not by the numerical counter delta. The caller retains this shared phase.
 * Call at native update cadence if painting is throttled; do not feed RAF time. */
export function helpPreviewPhase(previous: HelpPreviewPhase, counter: number, length: number): HelpPreviewPhase {
  if (![previous.counter, previous.frame, counter, length].every(Number.isInteger) ||
      previous.frame < 0 || length < 1) throw new RangeError('Invalid help preview phase')
  if (previous.counter === counter) return previous
  const next = previous.frame + 1
  return { counter, frame: next >= length ? 0 : next }
}

/** Native person preview dispatch and unscaled/screen-scaled layer path.
 * See tests/help-preview-source.json for addressed source and data identities.
 * Projection-scaled mode needs its original depth input and is not approximated. */
export function helpPersonPreview(
  animationObject: number,
  pane: HelpRect,
  counter: number,
  previous: HelpPreviewPhase,
  context: HelpPersonContext,
): PersonResult {
  if (!Number.isInteger(animationObject) || animationObject < 0)
    return { status: 'unsupported', reason: 'invalid-person-animation-object' }
  const pair = rules.animationObjects[animationObject]
  if (!pair) return { status: 'unsupported', reason: 'missing-person-animation-object' }
  const [animation, descriptor] = pair
  const definition = rules.animationDescriptors[descriptor]
  const cycle = (followerSources[animation] ?? shamanSources[animation])?.find(c => c.source === animation)
  if (!definition || !cycle?.frames.length)
    return { status: 'unsupported', reason: 'missing-person-animation-data' }
  if (!Number.isInteger(context.player) || context.player < 0 || context.player > 3 ||
      !Number.isInteger(context.spriteMode) || context.spriteMode < 0 || context.spriteMode > 255 ||
      ![context.screenWidth, context.screenHeight].every(n => Number.isInteger(n) && n > 0 && n <= 32767))
    return { status: 'unsupported', reason: 'invalid-person-render-context' }
  if (context.spriteMode === 1)
    return { status: 'unsupported', reason: 'person-projection-scaling' }
  const phase = helpPreviewPhase(previous, counter, cycle.frames.length)
  // Source only wraps on a changed counter. A same-counter topic switch can
  // expose an out-of-range retained phase; never invent a frame or read past it.
  const frame = cycle.frames[phase.frame]
  const sprite = units.frames[frame]
  if (!sprite) return { status: 'unsupported', reason: 'person-phase-out-of-range' }
  const screenScaled = context.spriteMode === 2 && context.screenWidth > 640
  const scaleX = screenScaled ? Math.trunc(Math.trunc(context.screenWidth * 256 / 640) * 30 / 32) : 256
  const scaleY = screenScaled ? Math.trunc(Math.trunc(context.screenHeight * 256 / 480) * 30 / 32) : 256
  const x = pane.x + Math.trunc(pane.width / 2)
  const y = pane.y + Math.trunc(pane.height / 2)
  const draws = spriteLayers(sprite.layers, units.pieces, {
    owner: context.player, person: definition.person, variant: definition.variant,
    flags: 2 | Number(cycle.flip),
  }, unscaledView)
  if (draws.some(draw => draw.flags & ~1))
    return { status: 'unsupported', reason: 'person-layer-draw-flags' }
  const layers = draws.map(draw => {
    const piece = units.pieces[draw.piece]
    const origin = spriteAtlasOrigin(piece, draw.piece, units)
    return {
      piece: draw.piece,
      source: { x: origin.x, y: origin.y, width: piece.w, height: piece.h },
      target: {
        x: x + Math.trunc(draw.x * scaleX / 256),
        y: y + Math.trunc(draw.y * scaleY / 256),
        width: Math.trunc(draw.w * scaleX / 256),
        height: Math.trunc(draw.h * scaleY / 256),
      },
      mirror: !!(draw.flags & 1),
    }
  })
  return { status: 'ready', request: {
    kind: 'person', animationObject, animation, descriptor, frame,
    sourceFrame: sprite.source, phase, layers,
  } }
}

/** Paint into the caller's overlay, with absolute native coordinates. No pane
 * clipping, invented backdrop, animation clock, asset loader or World mutation.
 * The context/image are borrowed; the caller owns clearing and disposal. */
export function paintHelpPersonPreview(
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement,
  preview: HelpPersonPreview,
) {
  if (!atlas.complete || atlas.naturalWidth !== units.width || atlas.naturalHeight !== units.height)
    return { status: 'unsupported' as const, reason: 'person-atlas-not-ready' }
  context.save()
  try {
    context.imageSmoothingEnabled = false
    for (const { source, target, mirror } of preview.layers) {
      if (target.width <= 0 || target.height <= 0) continue
      context.save()
      try {
        context.translate(target.x + (mirror ? target.width : 0), target.y)
        context.scale(mirror ? -1 : 1, 1)
        context.drawImage(atlas, source.x, source.y, source.width, source.height,
          0, 0, target.width, target.height)
      } finally { context.restore() }
    }
  } finally { context.restore() }
  return { status: 'drawn' as const }
}
