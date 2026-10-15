import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import assets from './original-frontend.json'
import styles from './original-main-menu.module.css'
import { frontendBackground, frontendRowY, frontendScale } from './frontend-composition.ts'

interface Props {
  hasCheckpoint: boolean
  onNewGame: () => void
  onTutorial: () => void
  onLoad: () => void
  options: ReactNode
}

function MenuText({ text, highlighted }: { text: string; highlighted: boolean }) {
  const bank = highlighted ? assets.banks.fehi33we : assets.banks.feft33we
  return (
    <span className={styles.text} aria-hidden="true">
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
  const [hovered, setHovered] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const returnFocus = useRef<HTMLButtonElement | null>(null)
  const [panel, setPanel] = useState<'main' | 'options' | 'quit'>('main')
  const [scale, setScale] = useState(1)
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
    const draw = () => {
      const context = canvas.current?.getContext('2d')
      if (context && pixels.current)
        context.putImageData(
          new ImageData(
            frontendBackground(pixels.current, pointer.current, panel === 'main'),
            640,
            480
          ),
          0,
          0
        )
    }
    const controller = new AbortController()
    void fetch('/original/frontend/composition.bin', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw Error('Frontend artwork unavailable')
        return response.arrayBuffer()
      })
      .then(data => {
        if (active) {
          pixels.current = new Uint8Array(data)
          draw()
        }
      })
      .catch(() => {
        /* Static background and readable labels remain available. */
      })
    return () => {
      active = false
      controller.abort()
      cancelAnimationFrame(animation.current)
    }
  }, [panel])
  useEffect(() => {
    if (panel === 'main') (returnFocus.current ?? first.current)?.focus()
    else dialog.current?.querySelector<HTMLButtonElement>('[data-panel-back]')?.focus()
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
          pointer.current = { x, y }
          cancelAnimationFrame(animation.current)
          animation.current = requestAnimationFrame(() => {
            const context = canvas.current?.getContext('2d')
            if (context && pixels.current)
              context.putImageData(
                new ImageData(
                  frontendBackground(pixels.current, pointer.current, panel === 'main'),
                  640,
                  480
                ),
                0,
                0
              )
          })
        }}
        onPointerLeave={() => setHovered(null)}
      >
        <canvas
          ref={canvas}
          className={styles.background}
          width={640}
          height={480}
          aria-hidden="true"
        />
        <h1 className={styles.title} aria-label="Populous: The Beginning">
          <span className={styles.logo} />
        </h1>
        {panel === 'main' ? (
          <nav aria-label="Main menu choices" className={styles.rows}>
            {rows.map((row, index) => (
              <button
                ref={index === 0 ? first : undefined}
                key={row.label}
                aria-label={row.label}
                aria-disabled={!!row.unavailable}
                onPointerEnter={() => setHovered(row.label)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setFocused(row.label)}
                onBlur={() => setFocused(null)}
                title={row.unavailable}
                style={{ top: frontendRowY(index) }}
                onClick={event => {
                  if (row.unavailable) return
                  returnFocus.current = event.currentTarget
                  row.action?.()
                }}
              >
                <MenuText
                  text={row.label}
                  highlighted={!row.unavailable && (hovered === row.label || focused === row.label)}
                />
                {row.unavailable && <span className={styles.reason}>{row.unavailable}</span>}
              </button>
            ))}
          </nav>
        ) : (
          <section
            className={styles.panel}
            aria-label={panel === 'options' ? 'Options' : 'Quit game'}
          >
            <h2>{panel === 'options' ? 'Options' : 'Quit Game'}</h2>
            {panel === 'options' ? (
              options
            ) : (
              <p>
                You can close this browser tab to quit. Your saved checkpoint will remain available
                in this browser.
              </p>
            )}
            <button data-panel-back onClick={back}>
              Back
            </button>
          </section>
        )}
      </div>
    </dialog>
  )
}
