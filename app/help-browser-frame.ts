import { helpPanelLayout } from './help-layout.ts'

export interface HelpMeasuredRect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** Browser-owned mapping, not a native resolution/device-state getter. */
export interface BrowserHelpFrame {
  readonly mapping: 'browser-help-shell-round-v1'
  readonly width: number
  readonly height: number
  readonly hudWidth: number
  readonly scale: number
  readonly shell: HelpMeasuredRect
  readonly hud: HelpMeasuredRect
  readonly preview: Readonly<HelpMeasuredRect>
  /** Apply once to the full article host. Both preview canvases are its children
   * at logical (0,0); never scale them separately or multiply by devicePixelRatio. */
  readonly articleStyle: Readonly<{
    position: 'absolute'; left: 0; top: 0; width: number; height: number
    transformOrigin: 'top left'; transform: string
  }>
}

export type BrowserHelpFrameResult =
  | { status: 'ready'; frame: BrowserHelpFrame }
  | { status: 'unavailable'; reason: string }

const rect = (value: DOMRect): HelpMeasuredRect => Object.freeze({
  x: value.x, y: value.y, width: value.width, height: value.height,
})

/** Read the actual full shell, including HUD, never the battlefield/canvas.
 * Divide all measured edges by the same current HUD scale, then round once to
 * nearest logical integers. Article preparation and preview MUST share this
 * snapshot. Uniform CSS scaling preserves art proportions; the full-shell host
 * clips any outer rounding excess (at most half a logical pixel per far edge).
 * Measured rectangles are retained so even a sub-integer resize invalidates a
 * prior sample. Only the current axis-aligned, borderless shell/HUD is supported.
 */
export function readBrowserHelpFrame(shell: HTMLElement, hud: HTMLElement): BrowserHelpFrameResult {
  const unavailable = (reason: string): BrowserHelpFrameResult => ({ status: 'unavailable', reason })
  if (!shell?.isConnected || !hud?.isConnected || !shell.contains(hud) ||
      shell.ownerDocument !== hud.ownerDocument)
    return unavailable('help-host-unavailable')
  const view = shell.ownerDocument.defaultView
  if (!view) return unavailable('help-host-window-unavailable')
  const style = view.getComputedStyle(shell)
  const hudStyle = view.getComputedStyle(hud)
  const scale = Number(style.getPropertyValue('--hud-scale').trim())
  if (!Number.isFinite(scale) || scale <= 0 || scale > 8 ||
      style.transform !== 'none' ||
      [style.borderLeftWidth, style.borderTopWidth, style.borderRightWidth,
        style.borderBottomWidth, style.paddingLeft, style.paddingTop,
        style.paddingRight, style.paddingBottom].some(value => parseFloat(value) !== 0))
    return unavailable('unsupported-help-shell-mapping')
  const matrix = /^matrix\(([^)]+)\)$/.exec(hudStyle.transform)?.[1].split(',').map(Number)
  // Computed matrix serialization can round a repeating scale (5/3 ->1.66667).
  // Require its shape here; measured HUD geometry below checks the actual scale.
  if (!matrix || matrix.length !== 6 || !matrix.every(Number.isFinite) ||
      matrix[0] <= 0 || matrix[0] !== matrix[3] || [1, 2, 4, 5].some(index => matrix[index] !== 0) ||
      hudStyle.transformOrigin !== '0px 0px')
    return unavailable('unsupported-help-hud-transform')
  const shellRect = rect(shell.getBoundingClientRect()), hudRect = rect(hud.getBoundingClientRect())
  if (![shellRect, hudRect].every(r => Object.values(r).every(Number.isFinite) && r.width > 0 && r.height > 0) ||
      Math.abs(hudRect.x - shellRect.x) > 1 / 64 || Math.abs(hudRect.y - shellRect.y) > 1 / 64 ||
      Math.abs(hudRect.height - shellRect.height) > 1 / 64 ||
      Math.abs(hudRect.width / scale - 100) > 1 / 64)
    return unavailable('unsupported-help-hud-mapping')
  const width = Math.round(shellRect.width / scale), height = Math.round(shellRect.height / scale)
  const hudWidth = Math.round((hudRect.x + hudRect.width - shellRect.x) / scale)
  if (width <= hudWidth || height <= 0 || width > 4096 || height > 4096 || width * height > 4194304)
    return unavailable('help-frame-resource-bound')
  const panels = helpPanelLayout(width, height, hudWidth)
  if (Object.values(panels.inner).some(pane => pane.width <= 0 || pane.height <= 0))
    return unavailable('help-frame-panes-do-not-fit')
  return { status: 'ready', frame: Object.freeze({
    mapping: 'browser-help-shell-round-v1', width, height, hudWidth, scale,
    shell: shellRect, hud: hudRect, preview: Object.freeze(panels.inner.preview),
    articleStyle: Object.freeze({ position: 'absolute', left: 0, top: 0, width, height,
      transformOrigin: 'top left', transform: `scale(${scale})` }),
  }) }
}

export function sameBrowserHelpFrame(a: BrowserHelpFrame, b: BrowserHelpFrame): boolean {
  return a.mapping === b.mapping && a.width === b.width && a.height === b.height &&
    a.hudWidth === b.hudWidth && a.scale === b.scale &&
    (['x', 'y', 'width', 'height'] as const).every(key => a.shell[key] === b.shell[key] && a.hud[key] === b.hud[key])
}
