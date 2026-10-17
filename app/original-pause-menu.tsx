import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import font from './original-pause-font.json'
import type { IngameMenuAssets } from './frontend-assets'
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

function MenuRow({
  label,
  y,
  action,
  disabled = false,
  highlight,
  ready,
  setHighlight,
}: {
  label: string
  y: number
  action: () => void
  disabled?: boolean
  highlight: string | null
  ready: boolean
  setHighlight: (label: string | null) => void
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      title={disabled ? 'No saved checkpoint in this browser' : undefined}
      style={{
        top: y,
        width: Math.max(200, textWidth(label) + 16),
        height: label === 'Back' ? 26 : 29,
      }}
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

type Panel = 'root' | 'options' | 'save' | 'load' | 'restart' | 'quit-level' | 'quit-game'
interface Props {
  prepared?: IngameMenuAssets
  tutorial: boolean
  hasCheckpoint: boolean
  renderOptions: (onBack: () => void) => ReactNode
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
  const [decoded, setDecoded] = useState(false)
  const ready = props.prepared ? props.prepared.fonts : decoded
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
    if (!props.prepared) {
      const image = new Image()
      image.src = '/original/pause-font.png'
      void image
        .decode()
        .then(() => {
          if (active) setDecoded(true)
        })
        .catch(() => {})
    }
    return () => {
      active = false
      window.removeEventListener('resize', resize)
      modal?.close()
    }
  }, [props.prepared])
  useEffect(() => {
    let label = 'Back'
    if (panel === 'root') label = returnFocus.current
    else if (['restart', 'quit-level', 'quit-game'].includes(panel)) label = 'No'
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
    'Continue Game',
    ...(props.tutorial ? [] : ['Load Game', 'Save Game']),
    'Options',
    ...(props.tutorial ? [] : ['Restart Level', 'Quit Level']),
    'Quit Game',
  ]
  const confirmations: Partial<Record<Panel, { question: string; action: () => void }>> = {
    restart: { question: 'Restart Level?', action: props.onRestart },
    'quit-level': { question: 'Quit Level?', action: props.onQuitLevel },
    'quit-game': { question: 'Quit Game?', action: props.onQuitGame },
  }
  const confirmation = confirmations[panel]
  const panelTitles: Partial<Record<Panel, string>> = {
    save: 'Save Game',
    load: 'Load Game',
  }
  let rows = panel === 'root' ? root : []
  if (confirmation) rows = ['Yes', 'No']
  function activate(label: string) {
    const targets: Record<string, Panel> = {
      'Load Game': 'load',
      'Save Game': 'save',
      Options: 'options',
      'Restart Level': 'restart',
      'Quit Level': 'quit-level',
      'Quit Game': 'quit-game',
    }
    if (label === 'Continue Game') props.onContinue()
    else if (label === 'Yes' && confirmation) once(confirmation.action)
    else if (label === 'No') setPanel('root')
    else if (targets[label]) open(targets[label], label)
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
        let next =
          (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
        if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = buttons.length - 1
        buttons[next]?.focus()
      }}
    >
      <div className={styles.frame}>
        {confirmation && (
          <>
            <h2 className={styles.question} aria-label={confirmation.question}>
              <MenuText text={confirmation.question} highlighted={false} ready={ready} />
            </h2>
            {panel !== 'restart' && (
              <p className={styles.adaptation}>
                {panel === 'quit-level'
                  ? 'Return to world selection. Unsaved progress will be lost.'
                  : 'Return to the main menu. Unsaved progress will be lost. Close the browser tab to leave the game.'}
              </p>
            )}
          </>
        )}
        <nav className={`${shared.rows} ${styles.rows}`} aria-label="Game menu choices">
          {rows.map((label, index) => (
            <MenuRow
              key={label}
              label={label}
              y={159 + (index + Number(!!confirmation)) * 30}
              action={() => activate(label)}
              disabled={label === 'Load Game' && !props.hasCheckpoint}
              highlight={highlight}
              ready={ready}
              setHighlight={setHighlight}
            />
          ))}
          {panel !== 'options' && (
            <MenuRow
              label="Back"
              y={454}
              action={back}
              highlight={highlight}
              ready={ready}
              setHighlight={setHighlight}
            />
          )}
        </nav>
        {panel === 'options' && props.renderOptions(back)}
        {!confirmation && panel !== 'root' && panel !== 'options' && (
          <section className={styles.panel} aria-label={panelTitles[panel]}>
            <h2>{panelTitles[panel]}</h2>
            <p>
              This browser version stores one checkpoint. Original multi-slot save files are not yet
              supported.
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
            {panel === 'save' && notice && <p role="status">{notice}</p>}
          </section>
        )}
      </div>
    </dialog>
  )
}
