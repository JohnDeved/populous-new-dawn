import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import frontend from './original-frontend.json'
import ingame from './original-pause-font.json'
import type { FrontendTextRow } from './frontend-composition'
import type { FrontendAssets, IngameMenuAssets } from './frontend-assets'
import type { GamePreferences } from './game-preferences'
import styles from './original-options.module.css'
import { MenuTooltip } from './menu-tooltip'

interface OriginalOptionsProps {
  preparedFrontend?: FrontendAssets
  preparedIngame?: IngameMenuAssets
  skin: 'frontend' | 'ingame'
  onBack: () => void
  volume: number
  musicVolume: number
  onVolume: (value: number) => void
  onMusicVolume: (value: number) => void
  storageNotice: string
  gamePreferences: GamePreferences
  onGamePreferences: (preferences: GamePreferences) => void
  gameStorageNotice: string
  compatibility?: ReactNode
  onTextRowsChange?: (rows: FrontendTextRow[]) => void
}
const categories = ['Game', 'Sound', 'Graphics'] as const
type Category = (typeof categories)[number] | 'Direct3D'
type TextState = 'normal' | 'highlight' | 'low'
const fontBanks = { normal: 'feft33we', highlight: 'fehi33we', low: 'felo33we' } as const
// Native no-gamma row layout. These have no proven browser settings adapters.
const unavailableRows: Partial<Record<Category, FrontendTextRow[]>> = {
  Graphics: [
    { text: 'Screen Resolution : <Unavailable>', x: 320, y: 139 },
    { text: 'Sky : <Unavailable>', x: 320, y: 169 },
    { text: 'Footsteps : <Unavailable>', x: 320, y: 199 },
    { text: 'Landscape Detail : <Unavailable>', x: 320, y: 229 },
    { text: 'Quick Defaults : <Unavailable>', x: 320, y: 259 },
  ],
  Direct3D: [
    { text: 'Device Selection : <Unavailable>', x: 320, y: 139 },
    { text: 'Filtering : <Unavailable>', x: 320, y: 169 },
  ],
}

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
  preparedFrontend,
  preparedIngame,
  skin,
  onBack,
  volume,
  musicVolume,
  onVolume,
  onMusicVolume,
  storageNotice,
  gamePreferences,
  onGamePreferences,
  gameStorageNotice,
  compatibility,
  onTextRowsChange,
}: OriginalOptionsProps) {
  const [category, setCategory] = useState<Category>('Game')
  const [browser, setBrowser] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [textSkin, setTextSkin] = useState<OriginalOptionsProps['skin'] | null>(null)
  const [sliderSkin, setSliderSkin] = useState<OriginalOptionsProps['skin'] | null>(null)
  const prepared = skin === 'frontend' ? preparedFrontend : preparedIngame
  const textReady = prepared
    ? prepared.fonts && (skin !== 'frontend' || preparedFrontend!.lowFont)
    : textSkin === skin
  const slidersReady = prepared ? prepared.sliders : sliderSkin === skin
  const root = useRef<HTMLElement>(null)
  const audioHelp =
    skin === 'frontend'
      ? 'Enable audio from the battlefield menu.'
      : 'Enable audio in Browser compatibility and help.'
  const masterText = `Master volume : <${Math.round(volume * 100)}%>`
  const musicText = `Music volume : <${Math.round(musicVolume * 100)}%>`
  const gameRows = useMemo(
    () => [
      { id: 'tooltips', text: 'Tooltips : <Unavailable>', x: 320, y: 139 },
      {
        id: 'rotation',
        text: `Rotation : <${gamePreferences.rotation === 'cursor' ? 'Cursor' : 'Control Cursor'}>`,
        x: 320,
        y: 169,
      },
      {
        id: 'flipRotation',
        text: `Flip Rotation : <${gamePreferences.flipRotation ? 'Yes' : 'No'}>`,
        x: 320,
        y: 199,
      },
      { id: 'staySelected', text: 'Stay Selected : <Unavailable>', x: 320, y: 229 },
      { id: 'autocastSpell', text: 'Autocast Spell : <Unavailable>', x: 320, y: 259 },
    ],
    [gamePreferences.rotation, gamePreferences.flipRotation]
  )
  const rows = useMemo<FrontendTextRow[]>(
    () =>
      browser
        ? []
        : [
            ...categories.map((text, index) => ({ text, x: 170 + 150 * index, y: 420 })),
            { text: 'Back', x: 320, y: 454 },
            ...(category === 'Graphics' || category === 'Direct3D'
              ? [{ text: 'Direct3D Options', x: 320, y: 390 }]
              : []),
            ...(category === 'Game' ? gameRows : []),
            ...(unavailableRows[category] ?? []),
            ...(category === 'Sound'
              ? [
                  { text: masterText, x: 320, y: 139 },
                  { text: musicText, x: 320, y: 199 },
                  { text: 'Sound quality : <Unavailable>', x: 320, y: 259 },
                ]
              : []),
          ],
    [browser, category, masterText, musicText, gameRows]
  )
  useLayoutEffect(() => {
    onTextRowsChange?.(textReady ? rows : [])
  }, [rows, onTextRowsChange, textReady])
  useEffect(() => {
    if (prepared) return
    let active = true
    const fonts =
      skin === 'frontend'
        ? ['frontend/feft33we', 'frontend/fehi33we', 'frontend/felo33we']
        : ['pause-font']
    const load = (paths: string[]) =>
      Promise.all(
        paths.map(path => {
          const image = new Image()
          image.src = `/original/${path}.png`
          return image.decode()
        })
      )
    void load(fonts)
      .then(() => {
        if (active) setTextSkin(skin)
      })
      .catch(() => {})
    void load([0, 1, 2].map(frame => `options/${skin}-${frame}`))
      .then(() => {
        if (active) setSliderSkin(skin)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [skin, prepared])
  useEffect(() => {
    root.current
      ?.querySelector<HTMLElement>(`[aria-current="page"][data-option-key="${category}"]`)
      ?.focus()
  }, [category])
  useEffect(() => {
    if (browser) root.current?.querySelector<HTMLButtonElement>('[data-return-options]')?.focus()
  }, [browser])
  useEffect(() => {
    if (!browser) return
    const element = root.current
    function keydown(event: KeyboardEvent) {
      if (browser && event.key === 'Escape' && element?.closest('dialog')?.open) {
        event.preventDefault()
        event.stopPropagation()
        setBrowser(false)
        requestAnimationFrame(() =>
          element?.querySelector<HTMLButtonElement>('[data-compatibility]')?.focus()
        )
      }
    }
    // Async disabled controls can leave focus on body rather than inside this panel.
    document.addEventListener('keydown', keydown, true)
    return () => document.removeEventListener('keydown', keydown, true)
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
  function label(text: string, low = false, id = text) {
    let state: TextState = 'normal'
    if (low) state = 'low'
    else if (highlight === id) state = 'highlight'
    return <Text text={text} skin={skin} state={state} ready={textReady} />
  }
  function choice(
    text: string,
    x: number,
    y: number,
    action: () => void,
    selected = false,
    options: { id?: string; wide?: boolean; help?: string } = {}
  ) {
    const position = { left: x, top: y }
    const id = options.id ?? text
    return selected ? (
      <span
        key={id}
        className={styles.choice}
        aria-label={text}
        data-option-key={id}
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
        key={id}
        className={`${styles.choice}${options.wide ? ` ${styles.gameChoice}` : ''}`}
        style={position}
        aria-label={text}
        data-option-key={id}
        data-panel-back={text === 'Back' || undefined}
        data-menu-tooltip={options.help}
        aria-description={options.help}
        onPointerEnter={() => setHighlight(id)}
        onPointerLeave={() => setHighlight(null)}
        onFocus={() => setHighlight(id)}
        onBlur={() => setHighlight(null)}
        onClick={action}
      >
        {label(text, false, id)}
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
      data-art-ready={slidersReady}
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
          {category === 'Game' && (
            <>
              {gameRows.map(row =>
                row.id === 'rotation' || row.id === 'flipRotation' ? (
                  choice(
                    row.text,
                    row.x,
                    row.y,
                    () =>
                      onGamePreferences(
                        row.id === 'rotation'
                          ? {
                              ...gamePreferences,
                              rotation:
                                gamePreferences.rotation === 'cursor' ? 'control-cursor' : 'cursor',
                            }
                          : { ...gamePreferences, flipRotation: !gamePreferences.flipRotation }
                      ),
                    false,
                    {
                      id: row.id,
                      wide: true,
                      help:
                        row.id === 'rotation'
                          ? 'Choose arrow-key rotation with or without Control.'
                          : 'Reverse keyboard rotation direction.',
                    }
                  )
                ) : (
                  <div
                    key={row.id}
                    className={styles.soundLabel}
                    style={{ top: row.y }}
                    role="note"
                    tabIndex={0}
                    data-menu-tooltip="This setting is not available in the browser version."
                    aria-description="This setting is not available in the browser version."
                    aria-label={row.text}
                  >
                    {label(row.text)}
                  </div>
                )
              )}
              {gameStorageNotice && (
                <p className={styles.storage} role="status">
                  {gameStorageNotice}
                </p>
              )}
            </>
          )}
          {category === 'Sound' && (
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
                data-menu-tooltip={`Master volume also affects music. ${audioHelp}`}
                aria-description={`Master volume also affects music. ${audioHelp}`}
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
                data-menu-tooltip={audioHelp}
                aria-description={audioHelp}
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
                role="note"
                tabIndex={0}
                data-menu-tooltip="Sound quality selection is not available in the browser version."
                aria-description="Sound quality selection is not available in the browser version."
                aria-label="Sound quality unavailable"
              >
                {label('Sound quality : <Unavailable>')}
              </div>
              {storageNotice && (
                <p className={styles.storage} role="status">
                  {storageNotice}
                </p>
              )}
            </>
          )}
          {unavailableRows[category] && (
            <>
              {unavailableRows[category].map(row => (
                <div
                  key={row.text}
                  className={styles.soundLabel}
                  style={{ top: row.y }}
                  role="note"
                  tabIndex={0}
                  data-menu-tooltip="This graphics setting is not available in the browser version."
                  aria-description="This graphics setting is not available in the browser version."
                  aria-label={row.text}
                >
                  {label(row.text)}
                </div>
              ))}
            </>
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
              choice(
                'Direct3D Options',
                320,
                390,
                () => select('Direct3D'),
                category === 'Direct3D',
                {
                  id: 'Direct3D',
                }
              )}
          </nav>
          {choice('Back', 320, 454, onBack)}
          <MenuTooltip key={category} container={root} />
        </>
      )}
    </section>
  )
}
