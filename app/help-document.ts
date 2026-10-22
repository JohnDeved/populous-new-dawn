import art from './original-help.json' with { type: 'json' }
import articleArt from './original-help-article.json' with { type: 'json' }
import frames from './original-campaign-popup.json' with { type: 'json' }
import hud from './original-hud.json' with { type: 'json' }
import result from './original-result-ui.json' with { type: 'json' }
import { popupGlyph } from './campaign-popup-layout.ts'
import { layoutHelpText, helpPanelLayout } from './help-layout.ts'
import { helpLinkAvailable, helpLinkTarget, type HelpDiscovery } from './help-discovery.ts'
import { validateHelpTopic } from './help-history.ts'

export type HelpFont = 3 | 4 | 10 | 11

export function helpGlyph(character: string, font: HelpFont) {
  if (font === 3 || font === 4)
    return {
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

export function helpLinkFont(
  font: HelpFont,
  available: boolean,
  hovered: boolean,
  focused: boolean
): HelpFont {
  return hovered || focused ? 11 : available ? 10 : font
}

export function helpInlineImage(index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= articleArt.inline.length)
    throw new RangeError('Unimported original help inline image')
  const id = articleArt.inline[index]
  return { id, ...articleArt.icons[String(id) as keyof typeof articleArt.icons] }
}

/** Preflight before taking input/pause ownership. Unsupported native markup or
 * dimensions are explicit blockers, never stripped text or a blank success.
 * A ready text document is NOT evidence that its separate preview is ready. */
export function prepareHelpDocument(
  topic: number,
  width: number,
  height: number,
  hudWidth: number
) {
  validateHelpTopic(topic)
  const source = art.topics[String(topic) as keyof typeof art.topics]
  if (
    ![width, height, hudWidth].every(Number.isInteger) ||
    hudWidth < 0 ||
    width <= hudWidth ||
    height <= 0
  )
    return { status: 'unsupported', reason: 'Invalid native help viewport' } as const
  const panels = helpPanelLayout(width, height, hudWidth)
  if (Object.values(panels.inner).some(r => r.width <= 0 || r.height <= 0))
    return { status: 'unsupported', reason: 'Native help panes do not fit this viewport' } as const
  try {
    const titleFont = width * height >= 640 * 480 ? 3 : 4
    const contents = layoutHelpText(
      art.topics['983'].text,
      panels.inner.contents.width,
      titleFont,
      helpInlineImage
    )
    const article = layoutHelpText(
      source.text,
      panels.inner.article.width,
      titleFont,
      helpInlineImage
    )
    if (
      [contents, article].some(pane =>
        pane.rows.some(row => row.nodes.some(node => node.image && node.link >= 0))
      )
    )
      return {
        status: 'unsupported',
        reason: 'Linked inline image outline is not implemented',
      } as const
    return { status: 'ready', topic, source, width, height, panels, contents, article } as const
  } catch (error) {
    if (!(error instanceof Error)) throw error
    return { status: 'unsupported', reason: error.message } as const
  }
}

export type HelpDocument = Extract<ReturnType<typeof prepareHelpDocument>, { status: 'ready' }>

export interface HelpImageAsset {
  url: string
  width: number
  height: number
}

type HelpDecodedImage = Pick<HTMLImageElement, 'src' | 'decode' | 'naturalWidth' | 'naturalHeight'>

/** Decoding alone also accepts a substituted 1×1 image. Require the source-bound
 * dimensions before the owning surface can regard any original asset as ready. */
export async function preflightHelpAssets(
  assets: readonly HelpImageAsset[],
  createImage: () => HelpDecodedImage = () => new Image()
) {
  await Promise.all(
    assets.map(async asset => {
      const image = createImage()
      image.src = asset.url
      await image.decode()
      if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height)
        throw new Error(`Original Help image dimensions differ: ${asset.url}`)
    })
  )
}

export function helpArticleAssets(document: HelpDocument): HelpImageAsset[] {
  const tiles = Object.values(frames.rects)
  return [
    {
      url: frames.panelUrl,
      width: Math.max(...tiles.map(tile => tile.x + tile.w)),
      height: Math.max(...tiles.map(tile => tile.y + tile.h)),
    },
    { url: result.fontUrl, width: result.font.width, height: result.font.height },
    { url: '/original/hud.png', width: hud.width, height: hud.height },
    art.fonts[10],
    art.fonts[11],
    ...[document.contents, document.article].flatMap(pane =>
      pane.rows.flatMap(row => row.nodes.flatMap(node => (node.image ? [node.image] : [])))
    ),
  ].map(({ url, width, height }) => ({ url, width, height }))
}
