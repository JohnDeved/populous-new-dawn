import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import art from './original-result-ui.json'
import { resultLayout, resultTime, resultGlyph, resultTextWidth } from './original-result-layout'
import { popupPanelTile, type PopupFont } from './campaign-popup-layout'
import { resultBlink } from './result-session'
import styles from './original-result-screen.module.css'

function ResultText({ text, ready, font }: { text: string; ready: boolean; font: PopupFont }) {
  if (!ready) return <span className={styles.fallback}>{text}</span>
  return (
    <span className={styles.text} aria-hidden="true">
      {[...text].map((character, index) => {
        const glyph = resultGlyph(character, font)
        return (
          <i
            key={index}
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

interface Props {
  status: 'won' | 'lost'
  level: number
  player: number
  time: number
  stage: 'terminal-overlay' | 'statistics'
  inputCycles: number
}

export function OriginalResultScreen({ status, level, player, time, stage, inputCycles }: Props) {
  const screen = useRef<HTMLDivElement>(null)
  const description = useId()
  const [viewport, setViewport] = useState({ width: 640, height: 480, preferred: 1 })
  const [fontReady, setFontReady] = useState(false)
  const [panelFailed, setPanelFailed] = useState(false)
  useEffect(() => {
    const element = screen.current
    if (!element) return
    const resize = () => {
      const box = element.getBoundingClientRect()
      setViewport({
        width: box.width,
        height: box.height,
        preferred:
          Number.parseFloat(getComputedStyle(element).getPropertyValue('--hud-scale')) || 1,
      })
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    let active = true
    void Promise.all(
      ['/original/result-font.png', '/original/hud.png'].map(async src => {
        const image = new Image()
        image.src = src
        await image.decode()
      })
    )
      .then(() => {
        if (active) setFontReady(true)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  const layout = resultLayout(viewport.width, viewport.height, viewport.preferred)
  const blink = resultBlink(inputCycles)
  const title =
    art.titles[String(level) as keyof typeof art.titles] ??
    (level === 79 ? 'Tutorial' : `Mission ${level}`)
  const outcome = `${art.labels.status}: ${status === 'won' ? art.labels.completed : art.labels.failed}`
  const playerLabel = `${art.labels.player} ${player}.`
  const prompt = 'Press Space Bar'
  function line(
    text: string,
    x: number,
    y: number,
    label = text,
    visible = true,
    font: PopupFont = layout.font,
    fallbackCenter?: number,
    centeringText = text
  ) {
    return (
      <span
        className={styles.line}
        style={{
          left: !fontReady && fallbackCenter !== undefined ? fallbackCenter : x,
          top: y,
          transform: !fontReady && fallbackCenter !== undefined ? 'translateX(-50%)' : undefined,
        }}
        role="img"
        aria-label={label}
      >
        <span style={{ visibility: visible ? undefined : 'hidden' }}>
          {!fontReady && centeringText !== text ? (
            <span style={{ position: 'relative' }}>
              <span style={{ visibility: 'hidden' }} aria-hidden="true">
                <ResultText text={centeringText} ready={false} font={font} />
              </span>
              <span style={{ position: 'absolute', left: 0, top: 0 }}>
                <ResultText text={text} ready={false} font={font} />
              </span>
            </span>
          ) : (
            <ResultText text={text} ready={fontReady} font={font} />
          )}
        </span>
      </span>
    )
  }
  function centered(text: string, y: number, label = text, visible = true, centeringText = text) {
    return line(
      text,
      layout.contentInset[0] +
        Math.floor((layout.contentWidth - resultTextWidth(centeringText, layout.font)) / 2),
      y,
      label,
      visible,
      layout.font,
      layout.contentInset[0] + layout.contentWidth / 2,
      centeringText
    )
  }
  const terminal = status === 'won' ? 'Level Complete' : 'Level Failed'
  const columns = layout.panelWidth / 16,
    rows = layout.panelHeight / 16
  return (
    <div
      ref={screen}
      className={`end-screen ${styles.screen}`}
      data-original-result
      data-result-stage={stage}
      data-font-ready={fontReady}
      data-panel-failed={panelFailed}
      style={{ '--result-scale': layout.scale } as CSSProperties}
    >
      {stage === 'terminal-overlay' ? (
        <div className={styles.overlay} aria-label={terminal}>
          {line(
            terminal,
            Math.floor((viewport.width - resultTextWidth(terminal, 3)) / 2),
            Math.trunc((7 * (viewport.height - resultGlyph('A', 3).h)) / 8),
            terminal,
            blink.status,
            3,
            viewport.width / 2
          )}
          {line(
            prompt,
            Math.floor((viewport.width - resultTextWidth(prompt, 3)) / 2),
            Math.trunc((7 * (viewport.height - resultGlyph('A', 3).h)) / 8) + resultGlyph('A', 3).h,
            prompt,
            blink.status,
            3,
            viewport.width / 2
          )}
        </div>
      ) : (
        <section
          className={styles.panel}
          aria-label="Level statistics"
          aria-describedby={description}
          data-result-font={layout.font}
          style={{ width: layout.panelWidth, height: layout.panelHeight }}
        >
          {!panelFailed &&
            (layout.panelHeight === art.layout640.panelHeight ? (
              <img
                className={styles.panelArt}
                src="/original/result-panel.png"
                width={layout.panelWidth}
                height={layout.panelHeight}
                alt=""
                onError={() => setPanelFailed(true)}
              />
            ) : (
              <div className={styles.panelArt} aria-hidden="true">
                {Array.from({ length: columns * rows }, (_, index) => {
                  const x = index % columns,
                    y = Math.floor(index / columns),
                    tile = popupPanelTile(x, y, columns, rows)
                  return (
                    <i
                      key={index}
                      className={styles.tile}
                      style={{
                        left: x * 16,
                        top: y * 16,
                        backgroundPosition: `-${(tile - 1450) * 16}px 0`,
                      }}
                    />
                  )
                })}
                <img
                  className={styles.hidden}
                  src="/original/campaign-popup-tiles.png"
                  alt=""
                  onError={() => setPanelFailed(true)}
                />
              </div>
            ))}
          <h2 className={styles.hidden}>{status === 'won' ? 'Level Won' : 'Level Lost'}</h2>
          {centered(title, layout.headingY)}
          {centered(playerLabel, layout.playerY)}
          {centered(
            blink.status ? `${art.labels.status}:` : outcome,
            layout.statusY,
            outcome,
            true,
            outcome
          )}
          {line(art.labels.time, layout.labelX, layout.timeY)}
          {line(`:  ${resultTime(time)}`, layout.valueColonX, layout.timeY, resultTime(time))}
          {layout.rows.map(row => (
            <div key={row.counterIndex} role="group" aria-label={`${row.label}: unavailable`}>
              {line(row.label, layout.labelX, row.y)}
              {line(':', layout.valueColonX, row.y)}
              {line(
                '-',
                layout.counterValueStartX +
                  Math.floor((layout.counterReserveWidth - resultTextWidth('-', layout.font)) / 2),
                row.y,
                'Unavailable'
              )}
            </div>
          ))}
          {centered(prompt, layout.promptY, prompt, blink.prompt)}
          <p id={description} className={styles.hidden}>
            - = statistics not yet recorded
          </p>
        </section>
      )}
    </div>
  )
}
