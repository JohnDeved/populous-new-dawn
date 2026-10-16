import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import assets from './original-frontend.json'
import styles from './original-main-menu.module.css'
import {
  answerTutorialRecommendation,
  hasAnsweredTutorialRecommendation,
  tutorialChoiceRows,
  tutorialParagraphRows,
  tutorialRecommendationRows,
  tutorialRecommendationText,
} from './tutorial-recommendation.ts'
import {
  frontendBackground,
  frontendQuitRows,
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
  renderOptions: (
    onBack: () => void,
    onTextRowsChange: (rows: FrontendTextRow[]) => void
  ) => ReactNode
}

function MenuText({
  text,
  highlighted,
  ready,
  low = false,
}: {
  text: string
  highlighted: boolean
  ready: boolean
  low?: boolean
}) {
  if (!ready) return <span className={styles.fallback}>{text}</span>
  let name: 'feft33we' | 'fehi33we' | 'felo33we' = 'feft33we'
  if (low) name = 'felo33we'
  else if (highlighted) name = 'fehi33we'
  const bank = assets.banks[name]
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
              backgroundImage: `url('/original/frontend/${name}.png')`,
            }}
          />
        )
      })}
    </span>
  )
}

export function OriginalMainMenu({
  hasCheckpoint,
  onNewGame,
  onTutorial,
  onLoad,
  renderOptions,
}: Props) {
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
  const recommendationCommitted = useRef(false)
  const [panel, setPanel] = useState<'main' | 'options' | 'quit' | 'tutorial-recommendation'>('main')
  const [optionRows, setOptionRows] = useState<FrontendTextRow[]>([])
  const [{ scale, canvasWidth }, setViewport] = useState({ scale: 1, canvasWidth: 640 })
  const [artReady, setArtReady] = useState(false)
  const [questionReady, setQuestionReady] = useState(false)
  const [sourceReady, setSourceReady] = useState(false)
  useEffect(() => {
    const resize = () => {
      const scale = frontendScale(window.innerWidth, window.innerHeight)
      // Even logical pixels keep native masks aligned with the centered menu frame.
      const canvasWidth = Math.max(640, 2 * Math.ceil(window.innerWidth / (2 * scale)))
      setViewport({ scale, canvasWidth })
    }
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
    // The low-font question can fall back without hiding the other menu artwork.
    const questionImage = new Image()
    questionImage.src = '/original/frontend/felo33we.png'
    void questionImage.decode().then(
      () => {
        if (active) setQuestionReady(true)
      },
      () => {
        /* Keep a visible HTML question if the low font is unavailable. */
      }
    )
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
            panel === 'options'
              ? optionRows
              : panel === 'tutorial-recommendation'
                ? tutorialRecommendationRows.filter(row =>
                    tutorialParagraphRows.includes(row) ? questionReady : artReady
                  )
                : frontendQuitRows.filter((_, index) => index === 0 ? questionReady : artReady),
            canvasWidth,
            artReady,
            artReady
          ),
          canvasWidth,
          480
        ),
        0,
        0
      )
  }, [panel, optionRows, canvasWidth, questionReady, artReady])
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
    {
      label: 'New Game',
      action: () => {
        if (hasAnsweredTutorialRecommendation()) onNewGame()
        else {
          recommendationCommitted.current = false
          setPanel('tutorial-recommendation')
        }
      },
    },
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
    {
      label: 'Options',
      action: () => {
        setOptionRows([])
        setPanel('options')
      },
    },
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
        // Keep the fullscreen frontend open across repeated native close requests.
        if (event.key === 'Escape') {
          event.preventDefault()
          back()
          return
        }
        if (
          (panel !== 'main' && panel !== 'tutorial-recommendation') ||
          !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
        ) return
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
          width={canvasWidth}
          height={480}
          style={{ width: canvasWidth, left: (640 - canvasWidth) / 2 }}
          aria-hidden="true"
        />
        <h1 className={styles.title} aria-label="Populous: The Beginning">
          {artReady ? (
            <span className={styles.logo} />
          ) : (
            <span className={styles.fallbackTitle}>Populous: The Beginning</span>
          )}
        </h1>
        {panel === 'main' && (
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
        )}
        {panel === 'options' && renderOptions(back, setOptionRows)}
        {panel === 'tutorial-recommendation' && (
          <section
            className={styles.quit}
            aria-labelledby="frontend-tutorial-question"
            data-original-tutorial-recommendation
          >
            <h2 id="frontend-tutorial-question" aria-label={tutorialRecommendationText}>
              {tutorialParagraphRows.map(row => (
                <span key={row.y} className={styles.question} style={{ top: row.y }}>
                  <MenuText text={row.text} highlighted={false} low ready={questionReady} />
                </span>
              ))}
            </h2>
            <nav aria-label="Tutorial recommendation choices" className={styles.rows}>
              {tutorialChoiceRows.map(row => (
                <button
                  key={row.text}
                  aria-label={row.text}
                  data-panel-back={row.text === 'Back' ? '' : undefined}
                  style={{ top: row.y }}
                  onPointerEnter={() => setHovered(row.text)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setFocused(row.text)}
                  onBlur={() => setFocused(null)}
                  onClick={() => {
                    if (recommendationCommitted.current) return
                    recommendationCommitted.current = true
                    back()
                    if (row.text === 'Back') return
                    answerTutorialRecommendation()
                    if (row.text === 'Yes') onTutorial()
                    else onNewGame()
                  }}
                >
                  <MenuText
                    text={row.text}
                    ready={artReady}
                    highlighted={hovered === row.text || focused === row.text}
                  />
                </button>
              ))}
            </nav>
          </section>
        )}
        {panel === 'quit' && (
          <section
            className={styles.quit}
            aria-labelledby="frontend-quit-question"
            data-original-quit-menu
          >
            <h2
              id="frontend-quit-question"
              aria-label={frontendQuitRows[0].text}
              className={styles.question}
              style={{ top: frontendQuitRows[0].y }}
            >
              <MenuText
                text={frontendQuitRows[0].text}
                highlighted={false}
                low
                ready={questionReady}
              />
            </h2>
            <nav aria-label="Quit choices" className={styles.rows}>
              {frontendQuitRows.slice(1).map(row => (
                <button
                  key={row.text}
                  aria-label={row.text}
                  disabled={row.text === 'Yes'}
                  aria-disabled={row.text === 'Yes'}
                  aria-describedby={row.text === 'Yes' ? 'frontend-quit-guidance' : undefined}
                  data-panel-back={row.text === 'Back' ? '' : undefined}
                  style={{ top: row.y }}
                  onPointerEnter={() => setHovered(row.text)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setFocused(row.text)}
                  onBlur={() => setFocused(null)}
                  onClick={row.text === 'Yes' ? undefined : back}
                >
                  <MenuText
                    text={row.text}
                    ready={artReady}
                    highlighted={
                      row.text !== 'Yes' && (hovered === row.text || focused === row.text)
                    }
                  />
                </button>
              ))}
            </nav>
            <p id="frontend-quit-guidance" className={styles.quitGuidance}>
              Yes is unavailable in this browser. Close this browser tab to quit. Only checkpoints
              successfully saved to browser storage will remain after closing it.
            </p>
          </section>
        )}
      </div>
    </dialog>
  )
}
