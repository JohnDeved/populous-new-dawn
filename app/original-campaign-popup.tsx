import { useEffect, useRef, useState, type CSSProperties } from 'react'
import art from './original-campaign-popup.json'
import {
  fitCampaignPopup,
  popupGlyph,
  popupPanelTile,
  popupButtonTiles,
  type PopupFont,
} from './campaign-popup-layout'
import styles from './original-campaign-popup.module.css'

function PopupText({ text, font }: { text: string; font: PopupFont }) {
  return (
    <span className={styles.line} aria-hidden="true">
      {[...text].map((character, index) => {
        const glyph = popupGlyph(character, font)
        return (
          <i
            key={index}
            data-popup-glyph
            className={styles.glyph}
            style={{
              width: glyph.w,
              height: glyph.h,
              backgroundImage: `url('/original/${font === 3 ? 'result-font' : 'hud'}.png')`,
              backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
            }}
          />
        )
      })}
    </span>
  )
}

export function OriginalCampaignPopup({
  text,
  onAcknowledge,
  onDelete,
}: {
  text: string
  onAcknowledge: () => void
  onDelete?: () => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({
    width: 544,
    height: 480,
    screenWidth: 640,
    preferred: 1,
  })
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const element = host.current
    if (!element) return
    const measure = () => {
      const box = element.getBoundingClientRect()
      if (!box.width || !box.height) return
      setViewport({
        width: box.width,
        height: box.height,
        screenWidth: window.innerWidth,
        preferred:
          Number.parseFloat(getComputedStyle(element).getPropertyValue('--hud-scale')) || 1,
      })
    }
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    measure()
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    let active = true
    void Promise.all(
      [
        art.panelUrl,
        '/original/result-font.png',
        '/original/hud.png',
        ...Object.values(art.buttonUrls),
      ].map(async src => {
        const image = new Image()
        image.src = src
        await image.decode()
      })
    ).catch(() => {
      if (active) setFailed(true)
    })
    return () => {
      active = false
    }
  }, [])
  const layout = fitCampaignPopup(
      text,
      viewport.width,
      viewport.height,
      viewport.screenWidth,
      viewport.preferred,
      onDelete ? [art.labels['227'], art.labels['323']] : [art.labels['227']]
    ),
    columns = layout.panelWidth / 16,
    rows = layout.panelHeight / 16
  useEffect(() => {
    const element = host.current
    if (!element?.closest('details')?.open) return
    // F8 is a browser-only adaptation. Bound its available scrolling region by
    // the actual native panel, without moving/scaling native artwork for it.
    element
      .closest<HTMLElement>('.game-shell')
      ?.style.setProperty(
        '--campaign-popup-bottom',
        `${Math.ceil(layout.y + layout.panelHeight * layout.scale)}px`
      )
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- A reopened details viewport remeasures even when this body's geometry is unchanged; another body may have published different bounds.
  }, [layout.y, layout.panelHeight, layout.scale, viewport])
  return (
    <div ref={host} className={styles.viewport} data-native-campaign-popup>
      <section
        className={styles.panel}
        data-native-campaign-panel
        data-font={layout.font}
        data-art-failed={failed || undefined}
        aria-label="Campaign message"
        style={
          {
            left: layout.x,
            top: layout.y,
            width: layout.panelWidth,
            height: layout.panelHeight,
            transform: `scale(${layout.scale})`,
            '--popup-normal': `url('${art.buttonUrls.normal}')`,
            '--popup-hover': `url('${art.buttonUrls.hover}')`,
            '--popup-pressed': `url('${art.buttonUrls.pressed}')`,
          } as CSSProperties
        }
      >
        <div className={styles.tiles} aria-hidden="true">
          {Array.from({ length: rows * columns }, (_, index) => {
            const column = index % columns,
              row = Math.floor(index / columns),
              tile = popupPanelTile(column, row, columns, rows),
              rect = art.rects[String(tile) as keyof typeof art.rects]
            return (
              <i
                key={index}
                style={{ left: column * 16, top: row * 16, backgroundPosition: `-${rect.x}px 0` }}
              />
            )
          })}
        </div>
        <p
          className={failed ? styles.fallback : styles.text}
          data-campaign-text
          aria-label={text}
          style={{
            left: layout.textX,
            top: layout.textY,
            width: failed ? layout.wrapWidth : layout.textWidth,
            lineHeight: `${layout.lineHeight}px`,
          }}
        >
          {failed ? (
            text
          ) : (
            <>
              <span className={styles.hidden}>{text}</span>
              {layout.lines.map((line, index) => (
                <span key={index} className={styles.textLine} style={{ height: layout.lineHeight }}>
                  <PopupText text={line} font={layout.font} />
                </span>
              ))}
            </>
          )}
        </p>
        {layout.buttons.map((button, index) => (
          <button
            key={button.label}
            type="button"
            data-popup-acknowledge={index === 0 || undefined}
            className={styles.ok}
            aria-label={index === 0 ? 'Acknowledge campaign message' : 'Delete campaign message'}
            onClick={index === 0 ? onAcknowledge : onDelete}
            style={{ left: button.x, top: button.y, width: button.width, height: button.height }}
          >
            <span className={styles.buttonArt} aria-hidden="true">
              {popupButtonTiles(button.width, button.height).map((tile, tileIndex) => (
                <i
                  key={tileIndex}
                  style={{
                    left: tile.x,
                    top: tile.y,
                    width: tile.w,
                    height: tile.h,
                    backgroundPosition: `-${tile.sx}px -${tile.sy}px`,
                  }}
                />
              ))}
            </span>
            <span className={styles.label} style={{ left: button.labelX, top: button.labelY }}>
              {failed ? button.label : <PopupText text={button.label} font={layout.font} />}
            </span>
          </button>
        ))}
      </section>
    </div>
  )
}
