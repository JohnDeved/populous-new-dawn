import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import assets from './original-frontend.json'
import { frontendBadges, frontendBadgeBounds, frontendBadgePixels } from './frontend-badges'
import { MenuTooltip } from './menu-tooltip'
import type { FrontendAssets } from './frontend-assets'
import styles from './original-main-menu.module.css'
import type { CheckpointReadStatus } from './game-store.ts'
import {
  answerTutorialRecommendation,
  hasAnsweredTutorialRecommendation,
  tutorialChoiceRows,
  tutorialParagraphRows,
  tutorialRecommendationRows,
  tutorialRecommendationText,
  wrapTutorialRecommendation,
} from './tutorial-recommendation.ts'
import {
  frontendBackground,
  frontendQuitRows,
  frontendRows,
  frontendRowY,
  frontendScale,
  frontendTextWidth,
  type FrontendTextRow,
} from './frontend-composition.ts'

interface Props {
  prepared: FrontendAssets
  hasCheckpoint: boolean
  checkpointReadStatus: CheckpointReadStatus
  onRetryCheckpoint: () => void
  onNewGame: () => void
  onTutorial: () => void
  onLoad: () => void
  renderOptions: (
    onBack: () => void,
    onTextRowsChange: (rows: FrontendTextRow[]) => void
  ) => ReactNode
}

const failedBadgeVectors = new WeakSet<HTMLImageElement>()

// Reuse the decoded image object itself, not a second <img src> request on each
// menu mount. This isolated host has no React children; cleanup never touches
// another owner. SVG rasterization remains browser/display-resolution managed.
function BadgeVector({
  image,
  index,
  onError,
}: {
  image: HTMLImageElement
  index: number
  onError: (index: number) => void
}) {
  const host = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    const container = host.current
    if (!container) return
    image.alt = ''
    image.setAttribute('aria-hidden', 'true')
    image.style.cssText =
      'display:block;width:100%;height:100%;object-fit:contain;image-rendering:auto'
    const failed = () => onError(index)
    image.addEventListener('error', failed)
    container.appendChild(image)
    return () => {
      image.removeEventListener('error', failed)
      if (image.parentNode === container) container.removeChild(image)
    }
  }, [image, index, onError])
  const badge = frontendBadges[index]
  return (
    <span
      ref={host}
      className={styles.badgeVector}
      data-frontend-badge-vector={index === 0 ? 'bullfrog' : 'qsound'}
      aria-hidden="true"
      style={{
        left: badge.x,
        top: badge.y,
        width: badge.width,
        height: badge.height,
        background: index === 0 ? '#fff' : '#000',
      }}
    />
  )
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
  prepared,
  hasCheckpoint,
  checkpointReadStatus,
  onRetryCheckpoint,
  onNewGame,
  onTutorial,
  onLoad,
  renderOptions,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const first = useRef<HTMLButtonElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const badges = useRef<(HTMLCanvasElement | null)[]>([])
  const pointer = useRef({ x: 320, y: 240 })
  const animation = useRef(0)
  const pointerMode = useRef(true)
  const glowFrame = useRef(0)
  const [hovered, setHovered] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const returnFocus = useRef<string | null>(null)
  const recommendationCommitted = useRef(false)
  const [panel, setPanel] = useState<'main' | 'options' | 'quit' | 'tutorial-recommendation'>(
    'main'
  )
  const [optionRows, setOptionRows] = useState<FrontendTextRow[]>([])
  const [{ scale, canvasWidth }, setViewport] = useState({ scale: 1, canvasWidth: 640 })
  const [vectorFailures, setVectorFailures] = useState(
    prepared.badgeVectors?.map(image => (image ? failedBadgeVectors.has(image) : false)) ?? [
      false,
      false,
    ]
  )
  const failVector = useCallback(
    (index: number) => {
      const image = prepared.badgeVectors?.[index]
      if (image) failedBadgeVectors.add(image)
      setVectorFailures(previous => previous.map((failed, at) => at === index || failed))
    },
    [prepared]
  )
  const artReady = prepared.fonts
  const questionReady = prepared.lowFont
  const logoReady = prepared.logo
  const checkpointRecoveryNotices = {
    idle: '',
    read: '',
    failed: 'Could not read browser storage. Your saved checkpoint may still be available.',
    incompatible:
      'This checkpoint is incompatible with the current development version. The stored save has not been changed.',
    pending: 'Checking browser storage…',
    unavailable: 'Browser storage is unavailable. You can still play and save for this session.',
  }
  const checkpointRecovery = useMemo(() => {
    // Browser-only recovery needs a visible disclosure, not a new card. Keep the
    // original menu rows fixed and reuse its measured wrap and 30px pitch in
    // the two free rows below Quit. Copy also fits between the original badges;
    // Retry always owns a separate second row. The lookup never writes the save.
    const paragraphs = {
      idle: [],
      read: [],
      failed: ['Lookup failed; save unchanged.'],
      incompatible: ['Incompatible with this build.', 'Stored save unchanged.'],
      pending: ['Checking browser storage...'],
      unavailable: ['Browser storage is unavailable.', 'Play and save this session only.'],
    }
    const noticeRows = paragraphs[checkpointReadStatus]
      .flatMap(wrapTutorialRecommendation)
      .map((text, index) => ({ text, x: 320, y: 414 + index * 30 }))
    const retry = checkpointReadStatus === 'failed' || checkpointReadStatus === 'pending'
    const retryRow = { text: 'Retry checkpoint lookup', x: 320, y: 444 }
    const retryReady = checkpointReadStatus === 'pending' ? questionReady : artReady
    return {
      noticeRows,
      retry,
      retryRow,
      retryReady,
      shadowRows: [
        ...(artReady
          ? frontendRows.map((text, index) => ({ text, x: 320, y: frontendRowY(index) }))
          : []),
        ...(questionReady ? noticeRows : []),
        ...(retry && retryReady ? [retryRow] : []),
      ],
    }
  }, [checkpointReadStatus, questionReady, artReady])
  useLayoutEffect(() => {
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
  const draw = useCallback(() => {
    const context = canvas.current?.getContext('2d')
    if (context && prepared.composition) {
      const panelRows =
        panel === 'options'
          ? optionRows
          : panel === 'tutorial-recommendation'
            ? tutorialRecommendationRows.filter(row =>
                tutorialParagraphRows.includes(row) ? questionReady : artReady
              )
            : frontendQuitRows.filter((_, index) => (index === 0 ? questionReady : artReady))
      const rgba = frontendBackground(
        prepared.composition,
        pointer.current,
        panel === 'main' && !checkpointRecovery.noticeRows.length,
        pointerMode.current ? glowFrame.current : null,
        panel === 'main' ? checkpointRecovery.shadowRows : panelRows,
        canvasWidth,
        logoReady,
        artReady
      )
      context.putImageData(new ImageData(rgba, canvasWidth, 480), 0, 0)
      for (const [index, canvas] of badges.current.entries()) {
        const badgeContext = canvas?.getContext('2d')
        if (!badgeContext) continue
        const { pixels, width, height } = frontendBadgePixels(
          rgba,
          canvasWidth,
          index,
          prepared.badgeVectors?.[index] && !vectorFailures[index]
            ? {
                source: prepared.composition,
                pointer: pointer.current,
                frame: pointerMode.current ? glowFrame.current : null,
              }
            : undefined
        )
        badgeContext.putImageData(new ImageData(pixels, width, height), 0, 0)
      }
    }
  }, [
    panel,
    optionRows,
    canvasWidth,
    questionReady,
    artReady,
    logoReady,
    prepared,
    vectorFailures,
    checkpointRecovery,
  ])
  useLayoutEffect(() => {
    draw()
  }, [draw])
  useEffect(() => {
    const timer = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? undefined
      : window.setInterval(() => {
          if (!pointerMode.current || document.hidden) return
          glowFrame.current = (glowFrame.current + 1) % 8
          draw()
        }, 101)
    return () => {
      if (timer !== undefined) window.clearInterval(timer)
      cancelAnimationFrame(animation.current)
    }
  }, [draw])
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
  function retryCheckpoint() {
    if (checkpointReadStatus === 'pending') return
    // This row survives every lookup result, unlike the recovery button. Keep
    // keyboard focus inside the menu before the lookup disables/removes Retry.
    dialog.current?.querySelector<HTMLButtonElement>('nav button[aria-label="Load Game"]')?.focus()
    onRetryCheckpoint()
  }
  const checkpointDescriptions = {
    idle: 'Checking browser storage',
    pending: 'Checking browser storage',
    failed: 'Saved checkpoint could not be read',
    unavailable: 'Browser storage is unavailable',
    incompatible: 'Checkpoint is incompatible with this development version',
    read: 'No usable saved checkpoint',
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
      unavailable: hasCheckpoint ? undefined : checkpointDescriptions[checkpointReadStatus],
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
      data-background-ready={prepared.background}
      data-cursor-ready={prepared.cursor}
      onPointerMove={event => {
        const bounds = frame.current?.getBoundingClientRect()
        if (!bounds) return
        // The dialog receives side-area motion; keep native coordinates relative
        // to the centered artwork, including negative x and x beyond 640.
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
        cancelAnimationFrame(animation.current)
        draw()
      }}
      onKeyDown={event => {
        pointerMode.current = false
        draw()
        // A held activation key must not follow Retry focus into Load Game.
        if (
          event.repeat &&
          (event.key === 'Enter' || event.key === ' ') &&
          (event.target as Element).closest('button')
        ) {
          event.preventDefault()
          return
        }
        // Help consumes the first Escape before revealing Options. Its held-key
        // repeats must not cross that newly revealed panel into the main menu.
        if (event.key === 'Escape') {
          event.preventDefault()
          if (!event.repeat) back()
          return
        }
        if (
          (panel !== 'main' && panel !== 'tutorial-recommendation') ||
          !['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)
        )
          return
        event.preventDefault()
        const buttons = [
          ...(dialog.current?.querySelectorAll<HTMLButtonElement>('nav button') ?? []),
        ]
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
        // Recovery controls sit outside nav. Enter the row list at its nearest end.
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
      onCancel={event => {
        event.preventDefault()
        back()
      }}
      style={{ '--frontend-scale': scale } as CSSProperties}
    >
      <div ref={frame} className={styles.frame}>
        <canvas
          ref={canvas}
          className={styles.background}
          width={canvasWidth}
          height={480}
          style={{ width: canvasWidth, left: (640 - canvasWidth) / 2 }}
          aria-hidden="true"
        />
        {prepared.composition &&
          frontendBadges.map((badge, index) => {
            const image = prepared.badgeVectors?.[index]
            return image && !vectorFailures[index] ? (
              <BadgeVector key={badge.x} image={image} index={index} onError={failVector} />
            ) : null
          })}
        {prepared.composition &&
          frontendBadgeBounds.map((badge, index) => (
            <canvas
              key={badge.x}
              ref={element => {
                badges.current[index] = element
              }}
              className={styles.badge}
              data-frontend-badge={index === 0 ? 'bullfrog' : 'qsound'}
              width={badge.width}
              height={badge.height}
              style={{ left: badge.x, top: badge.y }}
              aria-hidden="true"
            />
          ))}
        <h1 className={styles.title} aria-label="Populous: The Beginning">
          {logoReady ? (
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
                data-menu-tooltip={row.unavailable}
                aria-description={row.unavailable}
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
              </button>
            ))}
          </nav>
        )}
        {panel === 'main' && (
          <MenuTooltip
            key={`${hasCheckpoint}:${checkpointReadStatus}`}
            container={frame}
            ready={prepared.tooltip}
          />
        )}
        {panel === 'options' && renderOptions(back, setOptionRows)}
        {panel === 'main' && checkpointReadStatus !== 'read' && checkpointReadStatus !== 'idle' && (
          <section
            className={`${styles.checkpointRecovery} ${styles.rows}`}
            aria-label="Browser checkpoint recovery"
          >
            <p role="status">
              <span className={styles.visuallyHidden}>
                {checkpointRecoveryNotices[checkpointReadStatus]}
              </span>
              {checkpointRecovery.noticeRows.map(row => (
                <span
                  key={row.y}
                  className={styles.question}
                  style={{ top: row.y }}
                  aria-hidden="true"
                  data-checkpoint-notice-line={row.text}
                >
                  <MenuText text={row.text} highlighted={false} low ready={questionReady} />
                </span>
              ))}
            </p>
            {checkpointRecovery.retry && (
              <button
                type="button"
                aria-label={checkpointRecovery.retryRow.text}
                style={{
                  top: checkpointRecovery.retryRow.y,
                  width: Math.max(200, frontendTextWidth(checkpointRecovery.retryRow.text) + 16),
                }}
                disabled={checkpointReadStatus === 'pending'}
                onPointerEnter={() => setHovered(checkpointRecovery.retryRow.text)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setFocused(checkpointRecovery.retryRow.text)}
                onBlur={() => setFocused(null)}
                onClick={retryCheckpoint}
              >
                <MenuText
                  text={checkpointRecovery.retryRow.text}
                  ready={checkpointRecovery.retryReady}
                  low={checkpointReadStatus === 'pending'}
                  highlighted={
                    hovered === checkpointRecovery.retryRow.text ||
                    focused === checkpointRecovery.retryRow.text
                  }
                />
              </button>
            )}
          </section>
        )}
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
            aria-describedby="frontend-quit-guidance"
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
              <span className={styles.visuallyHidden}>
                Yes is unavailable in this browser. Close this browser tab to quit. Unsaved progress
                will be lost. Only checkpoints successfully saved to browser storage will remain
                after closing it.
              </span>
              {['Close this browser tab to quit.', 'Unsaved progress will be lost.'].map(line => (
                <span key={line} className={styles.warningLine} aria-hidden="true">
                  <MenuText text={line} highlighted={false} low ready={questionReady} />
                </span>
              ))}
            </p>
          </section>
        )}
      </div>
    </dialog>
  )
}
