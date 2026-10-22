import { useEffect, useState, type ReactNode } from 'react'
import frames from './original-campaign-popup.json'
import { popupPanelTile } from './campaign-popup-layout'
import { helpGlyph, helpLink, type HelpDocument, type HelpFont } from './help-document'
import type { HelpDiscovery } from './help-discovery'
import type { HelpRect, HelpTextRow } from './help-layout'
import styles from './help-article.module.css'

function Frame({ rect }: { rect: HelpRect }) {
  const columns = rect.width / 16, rows = rect.height / 16
  return (
    <div className={styles.frame} aria-hidden="true" style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}>
      {Array.from({ length: columns * rows }, (_, index) => {
        const x = index % columns, y = Math.trunc(index / columns)
        const id = popupPanelTile(x, y, columns, rows)
        const tile = frames.rects[String(id) as keyof typeof frames.rects]
        return <i key={index} style={{ left: x * 16, top: y * 16, backgroundPosition: `-${tile.x}px -${tile.y}px` }} />
      })}
    </div>
  )
}

function Glyphs({ text, font }: { text: string; font: HelpFont }) {
  let x = 0
  return <>{[...text].map((character, index) => {
    const glyph = helpGlyph(character, font), left = x
    x += glyph.w
    return <i aria-hidden="true" key={index} style={{ left, width: glyph.w, height: glyph.h, backgroundImage: `url('${glyph.url}')`, backgroundPosition: `-${glyph.x}px -${glyph.y}px` }} />
  })}</>
}

function TextPane({ rows, rect, offset = 0, discovery, onNavigate }: {
  rows: HelpTextRow[]; rect: HelpRect; offset?: number; discovery: HelpDiscovery; onNavigate: (topic: number) => void
}) {
  const [hover, setHover] = useState<string | null>(null)
  return <div className={styles.text} style={{ left: rect.x, top: rect.y, width: rect.width + 16, height: rect.height }}>
    {rows.flatMap((row, r) => row.nodes.filter(node => node.width > 0).map((node, n) => {
      const key = `${r}:${n}`, box = { left: node.x, top: row.y - offset, width: node.width, height: row.height }
      if (node.image) return <span key={key} className={styles.run} style={box}><img
        src={node.image.url} width={node.image.width} height={node.image.height} alt="Original article illustration" /></span>
      if (node.link < 0) return <span key={key} className={styles.run} style={box}><span className={styles.hidden}>{node.text}</span><Glyphs text={node.text} font={node.font} /></span>
      const link = helpLink(node.link, discovery)
      const font = hover === key ? 11 : link.available ? 10 : node.font
      return <button key={key} type="button" className={styles.link} style={box} aria-label={node.text}
        data-help-link={node.link} data-help-available={link.available}
        onPointerEnter={() => setHover(key)} onPointerLeave={() => setHover(null)}
        onFocus={() => setHover(key)} onBlur={() => setHover(null)}
        onPointerDown={event => {
          if (event.button !== 0) return
          event.preventDefault(); event.stopPropagation(); onNavigate(link.target)
        }}
        onClick={event => {
          // Keyboard activation is a browser accessibility adaptation. Pointer
          // activation already occurred on down, as in 00426ae0.
          event.preventDefault(); event.stopPropagation()
          if (event.detail === 0) onNavigate(link.target)
        }}><Glyphs text={node.text} font={font} /></button>
    }))}
  </div>
}

/** Inactive composition surface: original three panels and bitmap article.
 * Controls/preview must come from their own verified renderer, not placeholders.
 * The owner must preflight those renderers and close safely on onFailure. */
export function HelpArticleSurface({ document, discovery, offset, controls, preview, onNavigate, onFailure }: {
  document: HelpDocument; discovery: HelpDiscovery; offset: number
  controls: ReactNode; preview: ReactNode
  onNavigate: (topic: number) => void; onFailure: () => void
}) {
  const assetKey = [...new Set([frames.panelUrl, '/original/result-font.png', '/original/hud.png',
    '/original/help/font-10.png', '/original/help/font-11.png',
    ...[document.contents, document.article].flatMap(pane => pane.rows.flatMap(row => row.nodes.flatMap(node => node.image ? [node.image.url] : [])))])].sort().join('\n')
  useEffect(() => {
    let active = true
    void Promise.all(assetKey.split('\n').map(async src => {
      const image = new Image(); image.src = src; await image.decode()
    })).catch(() => { if (active) onFailure() })
    return () => { active = false }
  }, [assetKey, onFailure])
  const { panels } = document
  return <section className={styles.surface} aria-label="Encyclopaedia" data-native-help-article={document.topic}
    style={{ width: document.width, height: document.height }}>
    {Object.entries(panels.outer).map(([name, rect]) => <Frame key={name} rect={rect} />)}
    <TextPane key="contents" rows={document.contents.rows} rect={panels.inner.contents} discovery={discovery} onNavigate={onNavigate} />
    <TextPane key={document.topic} rows={document.article.rows} rect={panels.inner.article} offset={offset} discovery={discovery} onNavigate={onNavigate} />
    {preview}
    {controls}
  </section>
}
