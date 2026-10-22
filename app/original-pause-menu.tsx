import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import font from './original-pause-font.json'
import type { IngameMenuAssets } from './frontend-assets'
import type { CheckpointReadStatus } from './game-store'
import { frontendScale } from './frontend-composition'
import { CheckpointScrollArea } from './checkpoint-scroll-area'
import { CHECKPOINT_COPY_WIDTH } from './checkpoint-scroll'
import shared from './original-main-menu.module.css'
import styles from './original-pause-menu.module.css'

const fontText = (text: string) => text.replaceAll('…', '...')
const textWidth = (text: string) =>
  [...fontText(text)].reduce(
    (width, letter) => width + (font.rects[letter.charCodeAt(0) - 32]?.w ?? 13),
    0
  )
function MenuText({
  text,
  highlighted,
  ready,
}: {
  text: string
  highlighted: boolean
  ready: boolean
}) {
  const display = fontText(text)
  if (!ready || [...display].some(letter => !font.rects[letter.charCodeAt(0) - 32]))
    return <span className={shared.fallback}>{text}</span>
  return (
    <span
      className={shared.text}
      aria-hidden="true"
      style={{
        transform: `translateX(-${textWidth(text) >> 1}px)`,
        opacity: highlighted ? 1 : 2 / 3,
      }}
    >
      {[...display].map((letter, index) => {
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

// These browser checkpoint messages are not original save-slot text. Keep the
// in-game font at its native size; only the bounded copy area may scroll.
// The centered copy reserves equal gutters for the original-art scrollbar.
function CheckpointText({
  text,
  ready,
  status = false,
}: {
  text: string
  ready: boolean
  status?: boolean
}) {
  const display = fontText(text).replace(/\s+/g, ' ').trim()
  const supported = [...display].every(letter => font.rects[letter.charCodeAt(0) - 32])
  const lines: string[] = []
  if (ready && supported) {
    let line = ''
    for (const word of display.split(' ')) {
      const next = line ? `${line} ${word}` : word
      if (textWidth(next) <= CHECKPOINT_COPY_WIDTH) line = next
      else {
        if (line) lines.push(line)
        line = ''
        // A long technical token still wraps without shrinking or clipping.
        for (const letter of word) {
          if (textWidth(line + letter) > CHECKPOINT_COPY_WIDTH) {
            lines.push(line)
            line = ''
          }
          line += letter
        }
      }
    }
    if (line) lines.push(line)
  }
  return (
    <p className={styles.checkpointText} role={status ? 'status' : undefined}>
      <span className={styles.visuallyHidden}>{text}</span>
      {ready && supported ? (
        lines.map((line, index) => (
          <span key={index} className={styles.warningLine} aria-hidden="true">
            <MenuText text={line} highlighted={false} ready={ready} />
          </span>
        ))
      ) : (
        <span className={shared.fallback} aria-hidden="true">
          {text}
        </span>
      )}
    </p>
  )
}

function MenuRow({
  label,
  y,
  action,
  disabled = false,
  unavailable,
  highlight,
  ready,
  setHighlight,
}: {
  label: string
  y: number
  action: () => void
  disabled?: boolean
  unavailable?: string
  highlight: string | null
  ready: boolean
  setHighlight: (label: string | null) => void
}) {
  return (
    <button
      aria-label={label}
      data-pause-action={label}
      disabled={disabled}
      title={disabled ? unavailable : undefined}
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
  checkpointReadStatus: CheckpointReadStatus
  onRetryCheckpoint: () => void
  renderOptions: (onBack: () => void) => ReactNode
  onContinue: () => void
  saveDisabledReason?: string
  onSave: () => Promise<boolean>
  onLoad: () => void
  onRestart: () => void
  onQuitLevel: () => void
  onQuitGame: () => void
}
function checkpointNotice(status: CheckpointReadStatus, hasCheckpoint: boolean) {
  switch (status) {
    case 'failed':
      return 'Could not read browser storage. Your saved checkpoint may still be available.'
    case 'incompatible':
      return 'This checkpoint is incompatible with the current development version. The stored save has not been changed.'
    case 'pending':
      return 'Checking browser storage…'
    case 'unavailable':
      return 'Browser storage is unavailable. You can still play and save for this session.'
    case 'idle':
      return 'Browser storage has not been checked yet.'
    case 'read':
      return hasCheckpoint
        ? 'A checkpoint is available in this session.'
        : 'No usable saved checkpoint was found in this browser.'
  }
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
  const rootFocus = useRef('Continue Game')
  const lookupAvailable = ['idle', 'pending', 'failed'].includes(props.checkpointReadStatus)
  const loadDisabled =
    !props.hasCheckpoint && !lookupAvailable && props.checkpointReadStatus !== 'incompatible'
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
    const target = dialog.current?.querySelector<HTMLButtonElement>(
      `button[aria-label="${label}"]:not(:disabled)`
    )
    if (target) target.focus()
    else
      dialog.current
        ?.querySelector<HTMLButtonElement>('button[aria-label="Continue Game"]')
        ?.focus()
  }, [panel])
  useEffect(() => {
    if (panel !== 'root' || !loadDisabled || rootFocus.current !== 'Load Game') return
    const active = document.activeElement
    if (
      active === document.body ||
      active === dialog.current ||
      active === dialog.current?.querySelector('button[aria-label="Load Game"]')
    )
      dialog.current
        ?.querySelector<HTMLButtonElement>('button[aria-label="Continue Game"]')
        ?.focus()
  }, [panel, loadDisabled])
  function retryCheckpoint() {
    if (props.checkpointReadStatus === 'pending') return
    // Back survives pending/settled lookup states. A late completion must never
    // move focus out of another panel or replace the active world.
    dialog.current?.querySelector<HTMLButtonElement>('button[aria-label="Back"]')?.focus()
    props.onRetryCheckpoint()
  }
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
  const quitWarning =
    panel === 'quit-level' || panel === 'quit-game'
      ? [
          panel === 'quit-level' ? 'Return to world selection.' : 'Return to the main menu.',
          'Unsaved progress will be lost.',
        ]
      : null
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
      aria-describedby={quitWarning ? 'pause-quit-warning' : undefined}
      data-original-pause-menu
      data-panel={panel}
      style={{ '--frontend-scale': scale } as CSSProperties}
      onFocusCapture={event => {
        const label = (event.target as HTMLElement).closest('button')?.getAttribute('aria-label')
        if (panel === 'root' && label) rootFocus.current = label
      }}
      onCancel={event => {
        event.preventDefault()
        back()
      }}
      onKeyDown={event => {
        // The first Escape keeps the browser's native cancel action. Its repeats
        // must not dismiss the newly revealed root menu and resume gameplay.
        if (event.repeat && event.key === 'Escape') {
          event.preventDefault()
          return
        }
        if (
          event.repeat &&
          ['Enter', ' '].includes(event.key) &&
          (event.target as HTMLElement).closest('button')
        ) {
          // Activation can move focus to Back. Holding the key must not then
          // activate the newly focused control and leave the current panel.
          event.preventDefault()
          return
        }
        if (
          panel === 'options' ||
          !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key) ||
          (event.target as HTMLElement).closest('input,select,textarea,[tabindex="0"]')
        )
          return
        const buttons = [
          ...(dialog.current?.querySelectorAll<HTMLButtonElement>('nav button:not(:disabled)') ??
            []),
        ]
        if (!buttons.length) return
        event.preventDefault()
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
        // Save/load panel controls are outside nav, not the row before its first item.
        let next =
          current < 0
            ? event.key === 'ArrowUp'
              ? buttons.length - 1
              : 0
            : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
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
            {quitWarning && (
              <p id="pause-quit-warning" className={styles.quitWarning}>
                <span className={styles.visuallyHidden}>{quitWarning.join(' ')}</span>
                {quitWarning.map(line => (
                  <span key={line} className={styles.warningLine} aria-hidden="true">
                    <MenuText text={line} highlighted={false} ready={ready} />
                  </span>
                ))}
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
              disabled={label === 'Load Game' && loadDisabled}
              unavailable={
                props.checkpointReadStatus === 'unavailable'
                  ? 'Browser storage is unavailable'
                  : 'No usable saved checkpoint'
              }
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
          <section
            className={`${styles.panel} ${shared.rows} ${styles.rows}`}
            aria-label={panelTitles[panel]}
          >
            <h2 className={styles.checkpointTitle} aria-label={panelTitles[panel]}>
              <MenuText text={panelTitles[panel]!} highlighted={false} ready={ready} />
            </h2>
            <div className={styles.checkpointBody} data-pause-checkpoint-body>
              <CheckpointScrollArea key={panel}>
                <CheckpointText
                  text="One browser checkpoint. No original multi-slot saves."
                  ready={ready}
                />
                {panel === 'save' ? (
                  <>
                    <CheckpointText
                      text={props.saveDisabledReason ?? 'Saving replaces the previous checkpoint.'}
                      ready={ready}
                    />
                    {notice && <CheckpointText text={notice} ready={ready} status />}
                  </>
                ) : (
                  <>
                    <CheckpointText
                      text={checkpointNotice(props.checkpointReadStatus, props.hasCheckpoint)}
                      ready={ready}
                      status
                    />
                    {props.hasCheckpoint && props.checkpointReadStatus !== 'read' && (
                      <CheckpointText text="Checkpoint available in this session." ready={ready} />
                    )}
                    <CheckpointText
                      text="Loading replaces the current world and discards unsaved progress."
                      ready={ready}
                    />
                  </>
                )}
              </CheckpointScrollArea>
            </div>
            {panel === 'save' ? (
              <MenuRow
                label={saving ? 'Saving…' : 'Save checkpoint'}
                y={399}
                disabled={saving || !!props.saveDisabledReason}
                action={() => void save()}
                highlight={highlight}
                ready={ready}
                setHighlight={setHighlight}
              />
            ) : (
              <>
                {lookupAvailable && (
                  <MenuRow
                    label="Retry checkpoint lookup"
                    y={369}
                    disabled={props.checkpointReadStatus === 'pending'}
                    action={retryCheckpoint}
                    highlight={highlight}
                    ready={ready}
                    setHighlight={setHighlight}
                  />
                )}
                <MenuRow
                  label="Load checkpoint"
                  y={399}
                  disabled={!props.hasCheckpoint}
                  action={() => once(props.onLoad)}
                  highlight={highlight}
                  ready={ready}
                  setHighlight={setHighlight}
                />
              </>
            )}
          </section>
        )}
      </div>
    </dialog>
  )
}
