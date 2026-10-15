import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import frontend from './original-frontend.json'
import ingame from './original-pause-font.json'
import type { FrontendTextRow } from './frontend-composition'
import styles from './original-options.module.css'

interface OriginalOptionsProps {
  skin: 'frontend' | 'ingame'
  onBack: () => void
  volume: number
  musicVolume: number
  onVolume: (value: number) => void
  onMusicVolume: (value: number) => void
  storageNotice: string
  compatibility?: ReactNode
  onTextRowsChange?: (rows: FrontendTextRow[]) => void
}
const categories = ['Game', 'Sound', 'Graphics'] as const
type Category = (typeof categories)[number] | 'Direct3D'
type TextState = 'normal' | 'highlight' | 'low'
const fontBanks = { normal: 'feft33we', highlight: 'fehi33we', low: 'felo33we' } as const

function Text({
  text,
  skin,
  state,
  ready,
}: {
  text: string
  skin: OriginalOptionsProps['skin']
  state: TextState
  ready: boolean
}) {
  if (!ready) return <span className={styles.fallback}>{text}</span>
  const name = fontBanks[state]
  const bank = skin === 'frontend' ? frontend.banks[name] : ingame
  const width = [...text].reduce(
    (total, letter) => total + bank.rects[letter.charCodeAt(0) - 32].w,
    0
  )
  return (
    <span
      aria-hidden="true"
      className={styles.text}
      style={{
        transform: `translateX(-${width >> 1}px)`,
        opacity: skin === 'ingame' && state === 'normal' ? 2 / 3 : 1,
      }}
    >
      {[...text].map((letter, index) => {
        const glyph = bank.rects[letter.charCodeAt(0) - 32]
        return (
          <i
            key={index}
            style={{
              width: glyph.w,
              height: glyph.h,
              backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
              backgroundImage: `url('/original/${skin === 'frontend' ? `frontend/${name}` : 'pause-font'}.png')`,
            }}
          />
        )
      })}
    </span>
  )
}

export function OriginalOptions({
  skin,
  onBack,
  volume,
  musicVolume,
  onVolume,
  onMusicVolume,
  storageNotice,
  compatibility,
  onTextRowsChange,
}: OriginalOptionsProps) {
  const [category, setCategory] = useState<Category>('Game')
  const [browser, setBrowser] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const root = useRef<HTMLElement>(null)
  const masterText = `Master volume : <${Math.round(volume * 100)}%>`
  const musicText = `Music volume : <${Math.round(musicVolume * 100)}%>`
  const rows = useMemo<FrontendTextRow[]>(
    () =>
      browser
        ? []
        : [
            ...categories.map((text, index) => ({ text, x: 170 + 150 * index, y: 420 })),
            { text: 'Back', x: 320, y: 454 },
            ...(category === 'Graphics' || category === 'Direct3D'
              ? [{ text: 'Direct3D', x: 320, y: 390 }]
              : []),
            ...(category === 'Sound'
              ? [
                  { text: masterText, x: 320, y: 139 },
                  { text: musicText, x: 320, y: 199 },
                  { text: 'Sound quality : <Unavailable>', x: 320, y: 259 },
                ]
              : []),
          ],
    [browser, category, masterText, musicText]
  )
  useEffect(() => {
    onTextRowsChange?.(rows)
  }, [rows, onTextRowsChange])
  useEffect(() => {
    let active = true
    const paths = [
      ...(skin === 'frontend'
        ? ['frontend/feft33we', 'frontend/fehi33we', 'frontend/felo33we']
        : ['pause-font']),
      ...[0, 1, 2].map(frame => `options/${skin}-${frame}`),
    ]
    void Promise.all(
      paths.map(path => {
        const image = new Image()
        image.src = `/original/${path}.png`
        return image.decode()
      })
    )
      .then(() => {
        if (active) setReady(true)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [skin])
  useEffect(() => {
    root.current
      ?.querySelector<HTMLElement>(`[aria-current="page"][aria-label="${category}"]`)
      ?.focus()
  }, [category])
  useEffect(() => {
    if (browser) root.current?.querySelector<HTMLButtonElement>('[data-return-options]')?.focus()
  }, [browser])
  useEffect(() => {
    const element = root.current
    function keydown(event: KeyboardEvent) {
      if (browser && event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        setBrowser(false)
        requestAnimationFrame(() =>
          element?.querySelector<HTMLButtonElement>('[data-compatibility]')?.focus()
        )
      }
    }
    element?.addEventListener('keydown', keydown)
    return () => element?.removeEventListener('keydown', keydown)
  }, [browser])
  function returnFromBrowser() {
    setBrowser(false)
    requestAnimationFrame(() =>
      root.current?.querySelector<HTMLButtonElement>('[data-compatibility]')?.focus()
    )
  }
  function select(next: Category) {
    setCategory(next)
    setHighlight(null)
  }
  function label(text: string, low = false) {
    let state: TextState = 'normal'
    if (low) state = 'low'
    else if (highlight === text) state = 'highlight'
    return <Text text={text} skin={skin} state={state} ready={ready} />
  }
  function choice(text: string, x: number, y: number, action: () => void, selected = false) {
    const position = { left: x, top: y }
    return selected ? (
      <span
        key={text}
        className={styles.choice}
        aria-label={text}
        role="heading"
        aria-level={2}
        aria-current="page"
        tabIndex={-1}
        style={position}
      >
        {label(text, true)}
      </span>
    ) : (
      <button
        key={text}
        className={styles.choice}
        style={position}
        aria-label={text}
        data-panel-back={text === 'Back' || undefined}
        onPointerEnter={() => setHighlight(text)}
        onPointerLeave={() => setHighlight(null)}
        onFocus={() => setHighlight(text)}
        onBlur={() => setHighlight(null)}
        onClick={action}
      >
        {label(text)}
      </button>
    )
  }
  return (
    <section
      ref={root}
      aria-label="Options"
      data-original-options
      data-category={category}
      data-skin={skin}
      data-art-ready={ready}
      className={styles.options}
    >
      {browser ? (
        <section className={styles.compatibility} aria-label="Browser compatibility and help">
          <h2>Browser compatibility and help</h2>
          {compatibility ?? (
            <p>
              In-game HUD size, camera controls and help are available from the battlefield menu.
            </p>
          )}
          <button onClick={returnFromBrowser} data-return-options>
            Back to Options
          </button>
        </section>
      ) : (
        <>
          {category === 'Sound' ? (
            <>
              <label
                className={styles.soundLabel}
                style={{ top: 139 }}
                htmlFor={`${skin}-master`}
                aria-label="Master volume"
              >
                {label(masterText)}
              </label>
              <input
                className={styles.slider}
                style={{ top: 169 }}
                id={`${skin}-master`}
                aria-label="Master volume"
                type="range"
                min="0"
                max="1"
                step=".05"
                value={volume}
                onChange={event => onVolume(Number(event.target.value))}
              />
              <label
                className={styles.soundLabel}
                style={{ top: 199 }}
                htmlFor={`${skin}-music`}
                aria-label="Music volume"
              >
                {label(musicText)}
              </label>
              <input
                className={styles.slider}
                style={{ top: 229 }}
                id={`${skin}-music`}
                aria-label="Music volume"
                type="range"
                min="0"
                max="1"
                step=".05"
                value={musicVolume}
                onChange={event => onMusicVolume(Number(event.target.value))}
              />
              <div
                className={styles.soundLabel}
                style={{ top: 259 }}
                aria-label="Sound quality unavailable"
              >
                {label('Sound quality : <Unavailable>')}
              </div>
              <p className={styles.notice}>
                Browser volume controls. Master also affects music. Audio starts when enabled
                in-game.
              </p>
              {storageNotice && (
                <p className={styles.storage} role="status">
                  {storageNotice}
                </p>
              )}
            </>
          ) : (
            <p className={styles.unavailable}>
              Original {category} settings are not yet available.
            </p>
          )}
          <button
            className={styles.browserLink}
            data-compatibility
            onClick={() => setBrowser(true)}
          >
            Browser compatibility and help
          </button>
          <nav aria-label="Options categories">
            {categories.map((text, index) =>
              choice(text, 170 + index * 150, 420, () => select(text), category === text)
            )}
            {(category === 'Graphics' || category === 'Direct3D') &&
              choice('Direct3D', 320, 390, () => select('Direct3D'), category === 'Direct3D')}
          </nav>
          {choice('Back', 320, 454, onBack)}
        </>
      )}
    </section>
  )
}
