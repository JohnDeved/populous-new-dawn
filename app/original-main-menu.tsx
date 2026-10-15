import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import assets from './original-frontend.json'
import styles from './original-main-menu.module.css'

interface Props {
  hasCheckpoint: boolean
  onNewGame: () => void
  onTutorial: () => void
  onLoad: () => void
  options: ReactNode
}

function MenuText({ text }: { text: string }) {
  const bank = assets.banks.fehi20we
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
  const returnFocus = useRef<HTMLButtonElement | null>(null)
  const [panel, setPanel] = useState<'main' | 'options' | 'quit'>('main')
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const resize = () => setScale(Math.min(window.innerWidth / 640, window.innerHeight / 480))
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
      <div className={styles.frame}>
        <h1 className={styles.title}>Populous: The Beginning</h1>
        {panel === 'main' ? (
          <nav aria-label="Main menu choices" className={styles.rows}>
            {rows.map((row, index) => (
              <button
                ref={index === 0 ? first : undefined}
                key={row.label}
                aria-label={row.label}
                aria-disabled={!!row.unavailable}
                title={row.unavailable}
                style={{ top: 140 + index * 30 }}
                onClick={event => {
                  if (row.unavailable) return
                  returnFocus.current = event.currentTarget
                  row.action?.()
                }}
              >
                <MenuText text={row.label} />
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
