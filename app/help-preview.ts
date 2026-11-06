import rules from './original-rules.json' with { type: 'json' }
import type { HelpRect } from './help-layout.ts'
import { helpPersonPreview, type HelpPersonContext, type HelpPersonPreview, type HelpPreviewPhase } from './help-preview-person.ts'

/** Matches topic.illustration without altering the imported Help manifest. */
export interface HelpPreviewDescriptor {
  readonly kind: number
  readonly args: readonly number[]
}

export interface HelpPreviewContext {
  readonly pane: HelpRect
  readonly counter: number
  readonly phase: HelpPreviewPhase
  readonly person?: HelpPersonContext
  /** Retained source random choice, supplied by the owner. Never Math.random(). */
  readonly treeVariant?: number
}

export interface HelpObjectPreview {
  readonly kind: 'object'
  readonly category: 'building' | 'vehicle' | 'scenery' | 'reincarnation'
  readonly objects: readonly {
    readonly model: number
    readonly x: number
    readonly y: number
    readonly angle: number
    /** Opaque native render parameter, NOT a CSS scale. */
    readonly renderParameter: number
    readonly fixedParameter: 1866
  }[]
}

export interface HelpSpellPreview {
  readonly kind: 'spell-control'
  readonly model: number
  readonly templateControl: 2
  readonly pane: HelpRect
}

export type HelpPreviewResult =
  | { status: 'native-empty'; nativeKind: number }
  | { status: 'ready'; request: HelpPersonPreview }
  | { status: 'unsupported'; reason: string; request?: HelpObjectPreview | HelpSpellPreview }

// Exact shipped vehicle descriptor rows used by the two Help entries.
const vehicleObjects: Readonly<Record<number, number>> = { 2: 143, 4: 144 }

function validPane(pane: HelpRect) {
  return pane && [pane.x, pane.y, pane.width, pane.height].every(Number.isInteger) &&
    pane.width > 0 && pane.height > 0 &&
    [pane.x, pane.y, pane.width, pane.height].every(n => n >= 0 && n <= 32767) &&
    pane.x + pane.width <= 32767 && pane.y + pane.height <= 32767
}

/** Exact kind dispatch; ready means person draw commands resolved, not that an
 * atlas loaded or the feature is integrated. All other renderer dependencies
 * remain explicitly unsupported. No normal UI imports this inactive module. */
export function helpPreview(descriptor: HelpPreviewDescriptor, context: HelpPreviewContext): HelpPreviewResult {
  const { kind, args } = descriptor
  if (!Number.isInteger(kind) || kind < 0 || kind > 255 || args.length !== 3 ||
      !args.every(n => Number.isInteger(n) && n >= 0 && n <= 0xffffffff))
    return { status: 'unsupported', reason: 'invalid-preview-descriptor' }
  // Command articles have arguments but their switch target is the same return.
  if (kind === 3 || kind > 6) return { status: 'native-empty', nativeKind: kind }
  if (!validPane(context.pane) || !Number.isInteger(context.counter))
    return { status: 'unsupported', reason: 'invalid-preview-context' }
  if (kind === 0) {
    if (!context.person) return { status: 'unsupported', reason: 'missing-person-render-context' }
    return helpPersonPreview(args[0], context.pane, context.counter, context.phase, context.person)
  }
  if (kind === 4) return {
    status: 'unsupported', reason: 'native-spell-control-renderer', request: {
      kind: 'spell-control', model: args[0] & 255, templateControl: 2, pane: { ...context.pane },
    },
  }
  const { pane } = context
  const centerX = pane.x + Math.trunc(pane.width / 2)
  const centerY = pane.y + Math.trunc(pane.height / 2)
  if (kind === 6) return {
    status: 'unsupported', reason: 'native-object-renderer', request: {
      kind: 'object', category: 'reincarnation', objects: Array.from({ length: 8 }, (_, i) => {
        const angle = i * 256
        return {
          model: 30,
          x: centerX + (Math.imul(Math.trunc(pane.width / 3), rules.sine[(angle + 512) & 2047]) >> 16),
          y: centerY + (Math.imul(Math.trunc(pane.height / 3), rules.sine[angle]) >> 16),
          angle: (angle + 512) & 2047, renderParameter: 24, fixedParameter: 1866 as const,
        }
      }),
    },
  }
  let model: number | undefined
  if (kind === 1) model = rules.buildingObjects[args[0]]
  else if (kind === 2) model = vehicleObjects[args[0]]
  else if (args[0] === 9) model = args[2] & 65535
  else if (args[0] === 1) {
    const variant = context.treeVariant
    if (variant === undefined || !Number.isInteger(variant) || variant < 0 || variant > 5)
      return { status: 'unsupported', reason: 'missing-retained-tree-variant' }
    model = rules.sceneryObjects[variant + 1]
  } else model = rules.sceneryObjects[args[0]]
  if (model === undefined) return { status: 'unsupported', reason: 'missing-object-model' }
  return {
    status: 'unsupported', reason: 'native-object-renderer', request: {
      kind: 'object', category: kind === 1 ? 'building' : kind === 2 ? 'vehicle' : 'scenery',
      objects: [{
        model, x: centerX, y: pane.y + Math.trunc(pane.height * 2 / 3),
        angle: (context.counter & 63) << 5, renderParameter: args[1], fixedParameter: 1866,
      }],
    },
  }
}
