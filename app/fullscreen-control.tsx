'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  createFullscreenSession,
  placeFullscreenHost,
  fullscreenHostNeedsPlacement,
  type FullscreenState,
} from './fullscreen-session'
import hud from './original-hud.json'
import styles from './fullscreen-control.module.css'

// Original FONT0 glyph advances and pixels, never a system-font approximation.
function BitmapText({ text }: { text: string }) {
  // FONT0 has the straight apostrophe; accessible/status text stays untouched.
  const glyphText = text.replaceAll('’', "'")
  if (
    [...glyphText].some(
      letter => !hud.rects[`font0-${letter.charCodeAt(0) - 32}` as keyof typeof hud.rects]
    )
  )
    return (
      <span className={styles.fallback} aria-hidden="true">
        {text}
      </span>
    )
  return (
    <span className={styles.bitmap} aria-hidden="true">
      {glyphText.split(' ').map((word, wordIndex, words) => (
        <span className={styles.word} key={wordIndex}>
          {[...(word + (wordIndex < words.length - 1 ? ' ' : ''))].map((letter, index) => {
            const glyph = hud.rects[`font0-${letter.charCodeAt(0) - 32}` as keyof typeof hud.rects]
            return (
              <i
                key={index}
                style={{
                  width: glyph.w,
                  height: glyph.h,
                  backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
                }}
              />
            )
          })}
        </span>
      ))}
    </span>
  )
}

export function FullscreenControl() {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const [state, setState] = useState<FullscreenState>({
    active: false,
    available: false,
    pending: false,
    error: '',
  })
  const [bitmapReady, setBitmapReady] = useState(false)
  const session = useRef<ReturnType<typeof createFullscreenSession> | null>(null)
  useEffect(() => {
    const node = document.createElement('div')
    node.dataset.fullscreenControl = ''
    node.className = styles.control
    placeFullscreenHost(document, node)
    setHost(node)
    const observer = new MutationObserver(records => {
      if (fullscreenHostNeedsPlacement(records, node)) placeFullscreenHost(document, node)
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open'],
    })
    session.current = createFullscreenSession(document, window, setState)
    return () => {
      observer.disconnect()
      session.current?.dispose()
      session.current = null
      node.remove()
    }
  }, [])
  useEffect(() => {
    let mounted = true
    const image = new Image()
    image.src = '/original/hud.png'
    void image
      .decode()
      .then(() => {
        if (mounted) setBitmapReady(true)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])
  if (!host) return null
  const label = state.active ? 'Exit fullscreen' : 'Fullscreen'
  return createPortal(
    <div
      onKeyDown={event => {
        // Enter/Space activate this button, never gameplay shortcuts or held repeats.
        if (event.key === 'Enter' || event.key === ' ') {
          event.stopPropagation()
          if (event.repeat) event.preventDefault()
        }
      }}
      onKeyUp={event => {
        if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-pressed={state.active}
        aria-describedby={state.error ? 'fullscreen-status' : undefined}
        aria-disabled={state.pending}
        title={state.available || state.active ? label : 'Fullscreen availability'}
        onClick={() => void session.current?.toggle()}
      >
        {/* Native compact frame: top/bottom strips, then TL/TR/BL/BR. The full
            8px corners overlap vertically, with the lower tiles painted last. */}
        <span className={styles.compactFrame} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        {/* New browser-only symbol, not an original-game sprite. Integer pixel
            geometry fits the 17×14 menu/loading control without resizing artwork. */}
        <svg
          className={styles.icon}
          width="11"
          height="10"
          viewBox="0 0 11 10"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d={
              state.active
                ? 'M3 0h1v4H0V3h3zM7 0h1v3h3v1H7zM0 6h4v4H3V7H0zM7 6h4v1H8v3H7z'
                : 'M0 0h4v1H1v3H0zM7 0h4v4h-1V1H7zM0 6h1v3h3v1H0zM10 6h1v4H7V9h3z'
            }
          />
        </svg>
        <span className={styles.label} aria-hidden="true">
          {bitmapReady ? (
            <BitmapText text={label} />
          ) : (
            <span className={styles.fallback}>{label}</span>
          )}
        </span>
      </button>
      {state.error && (
        <p id="fullscreen-status" role="status">
          <span className={bitmapReady ? styles.visuallyHidden : styles.fallback}>
            {state.error}
          </span>
          {bitmapReady && <BitmapText text={state.error} />}
        </p>
      )}
    </div>,
    host
  )
}
