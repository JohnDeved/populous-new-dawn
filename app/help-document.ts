import art from './original-help.json' with { type: 'json' }
import { popupGlyph } from './campaign-popup-layout.ts'
import { layoutHelpText, helpPanelLayout } from './help-layout.ts'
import { helpLinkAvailable, helpLinkTarget, type HelpDiscovery } from './help-discovery.ts'
import { validateHelpTopic } from './help-history.ts'

export type HelpFont = 3 | 4 | 10 | 11

export function helpGlyph(character: string, font: HelpFont) {
  if (font === 3 || font === 4) return {
    ...popupGlyph(character, font),
    url: `/original/${font === 3 ? 'result-font' : 'hud'}.png`,
  }
  const code = character.charCodeAt(0)
  const bank = art.fonts[font]
  return { ...bank.rects[Math.max(0, Math.min(223, code - 32))], url: bank.url }
}

export function helpLink(relative: number, discovery: HelpDiscovery) {
  const topic = helpLinkTarget(relative, true)
  const rule = art.topics[String(topic) as keyof typeof art.topics].discovery
  const available = helpLinkAvailable(rule.predicate, rule.argument, discovery)
  return { available, target: helpLinkTarget(relative, available) }
}

/** Preflight before taking input/pause ownership. Unsupported native markup or
 * dimensions are explicit blockers, never stripped text or a blank success.
 * A ready text document is NOT evidence that its separate preview is ready. */
export function prepareHelpDocument(topic: number, width: number, height: number, hudWidth: number) {
  validateHelpTopic(topic)
  const source = art.topics[String(topic) as keyof typeof art.topics]
  if (![width, height, hudWidth].every(Number.isInteger) || hudWidth < 0 || width <= hudWidth || height <= 0)
    return { status: 'unsupported', reason: 'Invalid native help viewport' } as const
  const panels = helpPanelLayout(width, height, hudWidth)
  if (Object.values(panels.inner).some(r => r.width <= 0 || r.height <= 0))
    return { status: 'unsupported', reason: 'Native help panes do not fit this viewport' } as const
  try {
    const titleFont = width * height >= 640 * 480 ? 3 : 4
    const contents = layoutHelpText(art.topics['983'].text, panels.inner.contents.width, titleFont)
    const article = layoutHelpText(source.text, panels.inner.article.width, titleFont)
    return { status: 'ready', topic, source, width, height, panels, contents, article } as const
  } catch (error) {
    if (!(error instanceof Error)) throw error
    return { status: 'unsupported', reason: error.message } as const
  }
}

export type HelpDocument = Extract<ReturnType<typeof prepareHelpDocument>, { status: 'ready' }>
