import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import assets from './original-frontend.json'
import styles from './original-main-menu.module.css'
import {
  frontendBackground,
  frontendRowY,
  frontendScale,
  frontendTextWidth,
  type FrontendTextRow,
} from './frontend-composition.ts'

interface Props {
  hasCheckpoint: boolean
  onNewGame: () => void
  onTutorial: () => void
  onLoad: () => void
  options: (onBack: () => void, onTextRowsChange: (rows: FrontendTextRow[]) => void) => ReactNode
}

function MenuText({
  text,
  highlighted,
  ready,
}: {
  text: string
  highlighted: boolean
  ready: boolean
}) {
  if (!ready) return <span className={styles.fallback}>{text}</span>
  const bank = highlighted ? assets.banks.fehi33we : assets.banks.feft33we
  return (
    <span
      className={styles.text}
      aria-hidden="true"
      style={{ transform: `translateX(-${frontendTextWidth(text) >> 1}px)` }}
    >
      {Array.from(text, (letter, index) => {
        const glyph = bank.rects[letter.charCodeAt(0) - 32]
        return (
          <i
            key={index}
            style={{
              width: glyph.w,
              height: glyph.h,
              backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
              backgroundImage: `url('/original/frontend/${highlighted ? 'fehi33we' : 'feft33we'}.png')`,
            }}
          />
        )
      })}
    </span>
  )
}

export function OriginalMainMenu({ hasCheckpoint, onNewGame, onTutorial, onLoad, options }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const first = useRef<HTMLButtonElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const pixels = useRef<Uint8Array | null>(null)
  const pointer = useRef({ x: 320, y: 240 })
  const animation = useRef(0)
  const pointerMode = useRef(true)
  const glowFrame = useRef(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const returnFocus = useRef<string | null>(null)
  const [panel, setPanel] = useState<'main' | 'options' | 'quit'>('main')
  const [optionRows, setOptionRows] = useState<FrontendTextRow[]>([])
  const [scale, setScale] = useState(1)
  const [artReady, setArtReady] = useState(false)
  const [sourceReady, setSourceReady] = useState(false)
  useEffect(() => {
    const resize = () => setScale(frontendScale(window.innerWidth, window.innerHeight))
    resize()
    window.addEventListener('resize', resize)
    const modal = dialog.current
    modal?.showModal()
    return () => {
      window.removeEventListener('resize', resize)
      modal?.close()
    }
  }, [])
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    void fetch('/original/frontend/composition.bin', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Frontend artwork unavailable')
        return response.arrayBuffer()
      })
      .then(data => {
        if (data.byteLength !== assets.binaryBytes) throw new Error('Invalid frontend artwork')
        if (active) {
          pixels.current = new Uint8Array(data)
          setSourceReady(true)
        }
      })
      .catch(() => {
        /* Static background remains available if the effect data fails. */
      })
    void Promise.all(
      ['feft33we', 'fehi33we', 'felgspen'].map(name => {
        const image = new Image()
        image.src = `/original/frontend/${name}.png`
        return image.decode()
      })
    )
      .then(() => {
        if (active) setArtReady(true)
      })
      .catch(() => {
        /* Keep visible HTML labels. */
      })
    return () => {
      active = false
      controller.abort()
      cancelAnimationFrame(animation.current)
    }
  }, [])
  const draw = useCallback(() => {
    const context = canvas.current?.getContext('2d')
    if (context && pixels.current)
      context.putImageData(
        new ImageData(
          frontendBackground(
            pixels.current,
            pointer.current,
            panel === 'main',
            pointerMode.current ? glowFrame.current : null,
            panel === 'options' ? optionRows : []
          ),
          640,
          480
        ),
        0,
        0
      )
  }, [panel, optionRows])
  useEffect(() => {
    draw()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      if (!pointerMode.current || document.hidden) return
      glowFrame.current = (glowFrame.current + 1) % 8
      draw()
    }, 101)
    return () => {
      window.clearInterval(timer)
      cancelAnimationFrame(animation.current)
    }
  }, [draw, sourceReady])
  useEffect(() => {
    if (panel === 'main') {
      const previous = [
        ...(dialog.current?.querySelectorAll<HTMLButtonElement>('nav button') ?? []),
      ].find(button => button.getAttribute('aria-label') === returnFocus.current)
      ;(previous ?? first.current)?.focus()
    } else dialog.current?.querySelector<HTMLButtonElement>('[data-panel-back]')?.focus()
  }, [panel])
  function back() {
    setPanel('main')
  }
  const rows = [
    { label: 'New Game', action: onNewGame },
    { label: 'Tutorial', action: onTutorial },
    {
      label: 'Load Game',
      action: onLoad,
      unavailable: !hasCheckpoint ? 'No saved checkpoint' : undefined,
    },
    {
      label: 'Multiplayer',
      unavailable: 'Multiplayer is not available in this single-player remake',
    },
    { label: 'Options', action: () => setPanel('options') },
    { label: 'Rolling Demo', unavailable: 'Original demo playback is not yet available' },
    { label: 'Credits', unavailable: 'Original credits are not yet restored' },
    { label: 'Coming Soon', unavailable: 'Original preview is not yet restored' },
    { label: 'Quit', action: () => setPanel('quit') },
  ]
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Main menu"
      data-original-main-menu
      onKeyDown={event => {
        pointerMode.current = false
        draw()
        if (panel !== 'main' || !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        const buttons = [
          ...(dialog.current?.querySelectorAll<HTMLButtonElement>('nav button') ?? []),
        ]
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
        buttons[next]?.focus()
      }}
      onCancel={event => {
        event.preventDefault()
        back()
      }}
      style={{ '--frontend-scale': scale } as CSSProperties}
    >
      <div
        className={styles.frame}
        onPointerMove={event => {
          const bounds = event.currentTarget.getBoundingClientRect()
          const x = Math.floor((event.clientX - bounds.left) / scale)
          const y = Math.floor((event.clientY - bounds.top) / scale)
          if (x !== pointer.current.x || y !== pointer.current.y) pointerMode.current = true
          pointer.current = { x, y }
          cancelAnimationFrame(animation.current)
          animation.current = requestAnimationFrame(draw)
        }}
        onPointerLeave={() => {
          setHovered(null)
          pointerMode.current = false
          draw()
        }}
      >
        <canvas
          ref={canvas}
          className={styles.background}
          width={640}
          height={480}
          aria-hidden="true"
        />
        <h1 className={styles.title} aria-label="Populous: The Beginning">
          {artReady ? (
            <span className={styles.logo} />
          ) : (
            <span className={styles.fallbackTitle}>Populous: The Beginning</span>
          )}
        </h1>
        {panel === 'main' ? (
          <nav aria-label="Main menu choices" className={styles.rows}>
            {rows.map((row, index) => (
              <button
                ref={index === (hasCheckpoint ? 2 : 0) ? first : undefined}
                key={row.label}
                aria-label={row.label}
                aria-disabled={!!row.unavailable}
                onPointerEnter={() => setHovered(row.label)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setFocused(row.label)}
                onBlur={() => setFocused(null)}
                title={row.unavailable}
                style={{
                  top: frontendRowY(index),
                  width: Math.max(200, 2 * Math.ceil((frontendTextWidth(row.label) + 16) / 2)),
                }}
                onClick={() => {
                  if (row.unavailable) return
                  returnFocus.current = row.label
                  row.action?.()
                }}
              >
                <MenuText
                  ready={artReady}
                  text={row.label}
                  highlighted={!row.unavailable && (hovered === row.label || focused === row.label)}
                />
                {row.unavailable && <span className={styles.reason}>{row.unavailable}</span>}
              </button>
            ))}
          </nav>
        ) : panel === 'options' ? (
          options(back, setOptionRows)
        ) : (
          <section className={styles.panel} aria-label="Quit game">
            <h2>Quit Game</h2>
            <p>
              You can close this browser tab to quit. Your saved checkpoint will remain available in
              this browser.
            </p>
            <button data-panel-back onClick={back}>
              Back
            </button>
          </section>
        )}
      </div>
    </dialog>
  )
}
