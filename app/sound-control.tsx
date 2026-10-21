import { useEffect, useState } from 'react'
import { popupButtonTiles } from './campaign-popup-layout'
import { hudGlyph } from './hud-font'
import hud from './original-hud.json'
import art from './original-campaign-popup.json'
import styles from './sound-control.module.css'

const labels = { on: 'Sound On', off: 'Sound Off', pending: 'Wait' }
const glyphs = (text: string) =>
  [...text].map(letter => hud.rects[hudGlyph(letter.charCodeAt(0)) as keyof typeof hud.rects])
const textWidth = (text: string) => glyphs(text).reduce((width, glyph) => width + glyph.w, 0)
const width = Math.max(...Object.values(labels).map(textWidth)) + 8
const height = 14
const frame = popupButtonTiles(width, height)

// Browser activation is necessary, not an original-game control. Use original
// FONT0 pixels and HFX frame crops, never a replacement musical-note icon.
export function SoundControl({
  sound,
  pending,
  onToggle,
}: {
  sound: boolean
  pending: boolean
  onToggle: () => void
}) {
  const [artReady, setArtReady] = useState(false)
  useEffect(() => {
    let mounted = true
    void Promise.all(
      ['/original/hud.png', ...Object.values(art.buttonUrls)].map(src => {
        const image = new Image()
        image.src = src
        return image.decode()
      })
    )
      .then(() => {
        if (mounted) setArtReady(true)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])
  const label = sound ? 'Mute sound' : 'Enable sound'
  let text = sound ? labels.on : labels.off
  if (pending) text = labels.pending
  return (
    <button
      type="button"
      className={styles.control}
      data-sound-control
      data-sound-enabled={sound}
      data-art-ready={artReady}
      style={{ width, height }}
      aria-label={label}
      title={label}
      onClick={onToggle}
      disabled={pending}
      aria-busy={pending}
    >
      {artReady ? (
        <>
          {/* 004a1f50 draws strips first, then full TL/TR/BL/BR corners.
              At 14px high they overlap by 2px, as in the fullscreen footer. */}
          <span className={styles.frame} aria-hidden="true">
            {frame.map((tile, index) => (
              <i
                key={index}
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
          <span
            className={styles.label}
            aria-hidden="true"
            style={{ left: Math.trunc((width - textWidth(text)) / 2), top: 2 }}
          >
            {glyphs(text).map((glyph, index) => (
              <i
                key={index}
                style={{
                  width: glyph.w,
                  height: glyph.h,
                  backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
                }}
              />
            ))}
          </span>
        </>
      ) : (
        <span className={styles.fallback} aria-hidden="true">
          {text}
        </span>
      )}
    </button>
  )
}
