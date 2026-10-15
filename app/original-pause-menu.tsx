import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import font from './original-pause-font.json'
import { frontendScale } from './frontend-composition'
import shared from './original-main-menu.module.css'
import styles from './original-pause-menu.module.css'

const textWidth = (text: string) =>
  [...text].reduce((width, letter) => width + font.rects[letter.charCodeAt(0) - 32].w, 0)
function MenuText({
  text,
  highlighted,
  ready,
}: {
  text: string
  highlighted: boolean
  ready: boolean
}) {
  if (!ready) return <span className={shared.fallback}>{text}</span>
  return (
    <span
      className={shared.text}
      aria-hidden="true"
      style={{
        transform: `translateX(-${textWidth(text) >> 1}px)`,
        opacity: highlighted ? 1 : 2 / 3,
      }}
    >
      {[...text].map((letter, index) => {
        const glyph = font.rects[letter.charCodeAt(0) - 32]
        return (
          <i
            key={index}
            style={{
              width: glyph.w,
              height: glyph.h,
              backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
              backgroundImage: "url('/original/pause-font.png')",
            }}
          />
        )
      })}
    </span>
  )
}

type Panel = 'root' | 'options' | 'save' | 'load' | 'restart' | 'quit-level' | 'quit-game'
interface Props {
  tutorial: boolean
  hasCheckpoint: boolean
  options: ReactNode
  onContinue: () => void
  onSave: () => Promise<boolean>
  onLoad: () => void
  onRestart: () => void
  onQuitLevel: () => void
  onQuitGame: () => void
}
export function OriginalPauseMenu(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [panel, setPanel] = useState<Panel>('root')
  const [scale, setScale] = useState(1)
  const [ready, setReady] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const actionTaken = useRef(false)
  const returnFocus = useRef('Continue Game')
  useEffect(() => {
    const resize = () => setScale(frontendScale(window.innerWidth, window.innerHeight))
    resize()
    window.addEventListener('resize', resize)
    const modal = dialog.current
    modal?.showModal()
    let active = true
    const image = new Image()
    image.src = '/original/pause-font.png'
    void image
      .decode()
      .then(() => {
        if (active) setReady(true)
      })
      .catch(() => {})
    return () => {
      active = false
      window.removeEventListener('resize', resize)
      modal?.close()
    }
  }, [])
  useEffect(() => {
    const label =
      panel === 'root'
        ? returnFocus.current
        : ['restart', 'quit-level', 'quit-game'].includes(panel)
          ? 'No'
          : 'Back'
    dialog.current?.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)?.focus()
  }, [panel])
  function back() {
    if (panel === 'root') props.onContinue()
    else setPanel('root')
  }
  function open(next: Panel, label: string) {
    returnFocus.current = label
    setNotice('')
    setPanel(next)
  }
  async function save() {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    try {
      const persisted = await props.onSave()
      setNotice(
        persisted
          ? 'Checkpoint saved in this browser.'
          : 'Checkpoint saved for this session only; browser storage is unavailable.'
      )
    } catch {
      setNotice('The checkpoint could not be saved. Your current world is still open.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }
  function once(action: () => void) {
    if (actionTaken.current) return
    actionTaken.current = true
    action()
  }
  const root = [
    { label: 'Continue Game', action: props.onContinue },
    ...(!props.tutorial
      ? [
          {
            label: 'Load Game',
            action: () => open('load', 'Load Game'),
            disabled: !props.hasCheckpoint,
          },
          { label: 'Save Game', action: () => open('save', 'Save Game') },
        ]
      : []),
    { label: 'Options', action: () => open('options', 'Options') },
    ...(!props.tutorial
      ? [
          { label: 'Restart Level', action: () => open('restart', 'Restart Level') },
          { label: 'Quit Level', action: () => open('quit-level', 'Quit Level') },
        ]
      : []),
    { label: 'Quit Game', action: () => open('quit-game', 'Quit Game') },
  ]
  const question =
    panel === 'restart' ? 'Restart Level?' : panel === 'quit-level' ? 'Quit Level?' : 'Quit Game?'
  const confirm = panel === 'restart' || panel === 'quit-level' || panel === 'quit-game'
  const rows =
    panel === 'root'
      ? root
      : confirm
        ? [
            {
              label: 'Yes',
              action: () =>
                once(
                  panel === 'restart'
                    ? props.onRestart
                    : panel === 'quit-level'
                      ? props.onQuitLevel
                      : props.onQuitGame
                ),
            },
            { label: 'No', action: () => setPanel('root') },
          ]
        : []
  function row(label: string, y: number, action: () => void, disabled = false) {
    return (
      <button
        key={label}
        aria-label={label}
        disabled={disabled}
        style={{ top: y, width: Math.max(200, textWidth(label) + 16) }}
        onClick={action}
        onPointerEnter={() => setHighlight(label)}
        onPointerLeave={() => setHighlight(null)}
        onFocus={() => setHighlight(label)}
        onBlur={() => setHighlight(null)}
      >
        <MenuText text={label} highlighted={!disabled && highlight === label} ready={ready} />
      </button>
    )
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Game menu"
      data-original-pause-menu
      data-panel={panel}
      style={{ '--frontend-scale': scale } as CSSProperties}
      onCancel={event => {
        event.preventDefault()
        back()
      }}
      onKeyDown={event => {
        if (
          !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) ||
          (event.target as HTMLElement).closest('input,select,textarea')
        )
          return
        const buttons = [
          ...(dialog.current?.querySelectorAll<HTMLButtonElement>('nav button:not(:disabled)') ??
            []),
        ]
        if (!buttons.length) return
        event.preventDefault()
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
        buttons[
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? buttons.length - 1
              : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
        ]?.focus()
      }}
    >
      <div className={styles.frame}>
        {confirm && (
          <>
            <h2 className={styles.question} aria-label={question}>
              <MenuText text={question} highlighted={false} ready={ready} />
            </h2>
            {panel !== 'restart' && (
              <p className={styles.adaptation}>
                {panel === 'quit-level'
                  ? 'Return to world selection. Unsaved progress will be lost.'
                  : 'Return to the main menu. Close the browser tab to leave the game.'}
              </p>
            )}
          </>
        )}
        <nav className={`${shared.rows} ${styles.rows}`} aria-label="Game menu choices">
          {rows.map((item, index) =>
            row(
              item.label,
              159 + (index + (confirm ? 1 : 0)) * 30,
              item.action,
              'disabled' in item && !!item.disabled
            )
          )}
          {row('Back', 454, back)}
        </nav>
        {!confirm && panel !== 'root' && (
          <section
            className={styles.panel}
            aria-label={
              panel === 'options'
                ? 'Browser options and help'
                : panel === 'save'
                  ? 'Save Game'
                  : 'Load Game'
            }
          >
            <h2>
              {panel === 'options'
                ? 'Browser options and help'
                : panel === 'save'
                  ? 'Save Game'
                  : 'Load Game'}
            </h2>
            {panel === 'options' ? (
              props.options
            ) : (
              <>
                <p>
                  This browser version stores one checkpoint. Original multi-slot save files are not
                  yet supported.
                </p>
                {panel === 'save' ? (
                  <>
                    <p>Saving replaces the previous checkpoint.</p>
                    <button disabled={saving} onClick={() => void save()}>
                      {saving ? 'Saving…' : 'Save checkpoint'}
                    </button>
                  </>
                ) : (
                  <>
                    <p>Loading replaces the current world and discards unsaved progress.</p>
                    <button disabled={!props.hasCheckpoint} onClick={() => once(props.onLoad)}>
                      Load checkpoint
                    </button>
                  </>
                )}
                {notice && <p role="status">{notice}</p>}
              </>
            )}
          </section>
        )}
      </div>
    </dialog>
  )
}
