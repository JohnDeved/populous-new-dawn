import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import art from './original-result-ui.json'
import { resultScale, resultTime } from './original-result-layout'
import styles from './original-result-screen.module.css'

const textWidth = (text: string) =>
  [...text].reduce((width, character) => {
    const glyph = art.font.rects[character.charCodeAt(0) - 32]
    return width + (glyph?.advance ?? 8)
  }, 0)

function ResultText({ text, ready }: { text: string; ready: boolean }) {
  if (!ready || [...text].some(character => !art.font.rects[character.charCodeAt(0) - 32]))
    return <span className={styles.fallback}>{text}</span>
  return (
    <span className={styles.text} aria-hidden="true">
      {[...text].map((character, index) => {
        const glyph = art.font.rects[character.charCodeAt(0) - 32]
        return (
          <i
            key={index}
            className={styles.glyph}
            style={{
              width: glyph.advance,
              height: glyph.h,
              backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
            }}
          />
        )
      })}
    </span>
  )
}

interface Props {
  status: 'won' | 'lost'
  level: number
  player: number
  time: number
  primaryLabel: string
  onPrimary: () => void
  onSelectLevel: () => void
}

export function OriginalResultScreen({
  status,
  level,
  player,
  time,
  primaryLabel,
  onPrimary,
  onSelectLevel,
}: Props) {
  const screen = useRef<HTMLDivElement>(null)
  const controls = useRef<HTMLDivElement>(null)
  const description = useId()
  const [scale, setScale] = useState(1)
  const [fontReady, setFontReady] = useState(false)
  const [panelFailed, setPanelFailed] = useState(false)
  const actionTaken = useRef(false)
  useEffect(() => {
    const element = screen.current,
      actions = controls.current
    if (!element || !actions) return
    const resize = () => {
      const box = element.getBoundingClientRect()
      const preferred =
        Number.parseFloat(getComputedStyle(element).getPropertyValue('--hud-scale')) || 1
      setScale(
        resultScale(box.width, box.height, preferred, actions.getBoundingClientRect().height)
      )
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    observer.observe(actions)
    resize()
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    let active = true
    const font = new Image()
    font.src = '/original/result-font.png'
    void font
      .decode()
      .then(() => {
        if (active) setFontReady(true)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  const layout = art.layout640
  const title =
    art.titles[String(level) as keyof typeof art.titles] ??
    (level === 79 ? 'Tutorial' : `Mission ${level}`)
  const outcome = `${art.labels.status}: ${status === 'won' ? art.labels.completed : art.labels.failed}`
  const playerLabel = `${art.labels.player} ${player}.`
  function line(text: string, x: number, y: number, label = text) {
    return (
      <span className={styles.line} style={{ left: x, top: y }} role="img" aria-label={label}>
        <ResultText text={text} ready={fontReady} />
      </span>
    )
  }
  function centered(text: string, y: number) {
    return line(
      text,
      layout.contentInset[0] + Math.floor((layout.contentWidth - textWidth(text)) / 2),
      y
    )
  }
  function primary() {
    if (actionTaken.current) return
    actionTaken.current = true
    onPrimary()
  }
  return (
    <div
      ref={screen}
      className={`end-screen ${styles.screen}`}
      data-original-result
      data-font-ready={fontReady}
      data-panel-failed={panelFailed}
      style={{ '--result-scale': scale } as CSSProperties}
    >
      <section
        className={styles.panel}
        aria-label="Level statistics"
        aria-describedby={description}
      >
        {!panelFailed && (
          <img
            className={styles.panelArt}
            src="/original/result-panel.png"
            width={layout.panelWidth}
            height={layout.panelHeight}
            alt=""
            onError={() => setPanelFailed(true)}
          />
        )}
        <h2 className={styles.hidden}>{status === 'won' ? 'Level Won' : 'Level Lost'}</h2>
        {centered(title, layout.headingY)}
        {centered(playerLabel, layout.playerY)}
        {centered(outcome, layout.statusY)}
        {line(art.labels.time, layout.labelX, layout.timeY)}
        {line(`:  ${resultTime(time)}`, layout.valueColonX, layout.timeY, resultTime(time))}
        {art.nativeRows.map(row => (
          <div key={row.counterIndex} role="group" aria-label={`${row.label}: unavailable`}>
            {line(row.label, layout.labelX, row.y)}
            {line(':', layout.valueColonX, row.y)}
            {line(
              '-',
              layout.counterValueStartX +
                Math.floor((layout.counterReserveWidth - textWidth('-')) / 2),
              row.y,
              'Unavailable'
            )}
          </div>
        ))}
      </section>
      <div
        ref={controls}
        className={styles.controls}
        role="group"
        aria-label="Browser result controls"
      >
        <button onClick={primary}>{primaryLabel}</button>
        <button
          onClick={() => {
            if (!actionTaken.current) onSelectLevel()
          }}
        >
          Select Level
        </button>
        <p id={description}>- = statistics not yet recorded</p>
      </div>
    </div>
  )
}
