import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import frontend from './original-frontend.json'
import ingame from './original-pause-font.json'
import type { FrontendTextRow } from './frontend-composition'
import type { FrontendAssets, IngameMenuAssets } from './frontend-assets'
import type { GamePreferences } from './game-preferences'
import styles from './original-options.module.css'
import { MenuTooltip } from './menu-tooltip'

interface BrowserCompatibility {
  speed: number
  onSpeed: () => void
  onSelectLevel: () => void
  performance: boolean
  onPerformance: () => void
  hudSize: string
  onHudSize: (value: string) => void
  sound: boolean
  soundPending: boolean
  onSound: () => void
  audioStartNotice: string
}

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
  compatibility?: BrowserCompatibility
  onTextRowsChange?: (rows: FrontendTextRow[]) => void
}
const hudSizes = ['auto', '1', '1.5', '2', '2.5', '3', '4'] as const
const browserFallback = 'HUD size, audio and game speed are available from the battlefield menu.'
const browserTitle = 'Browser compatibility and help'
// Only browser-added copy is abbreviated. Native positions, glyphs and scale
// remain unchanged; the complete storage announcement stays accessible.
const ingameStorageCopy: Record<string, string> = {
  'Game settings apply for this session; browser storage is unavailable.':
    'Session-only game settings; browser storage unavailable.',
  'Volume changes apply for this session; browser storage is unavailable.':
    'Session-only volume changes; browser storage unavailable.',
}

// Browser-only notices retain the menu glyphs and 30-pixel line interval.
function noticeLines(text: string, maxWidth = 600) {
  const lines: string[] = []
  for (const word of text.split(' ')) {
    const previous = lines.at(-1)
    const candidate = previous ? `${previous} ${word}` : word
    const width = [...candidate].reduce(
      (total, letter) => total + ingame.rects[letter.charCodeAt(0) - 32].w,
      0
    )
    if (previous && width <= maxWidth) lines[lines.length - 1] = candidate
    else lines.push(word)
  }
  return lines
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
  if (!ready)
    return (
      <span className={styles.fallback} data-options-text={text} data-options-font="fallback">
        {text}
      </span>
    )
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
      data-options-text={text}
      data-options-font="glyphs"
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
  const browserLabel = skin === 'ingame' ? 'Browser controls and help' : browserTitle
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
      { id: 'compatibility', text: browserLabel, x: 320, y: 289 },
    ],
    [gamePreferences.rotation, gamePreferences.flipRotation, browserLabel]
  )
  const activeStorageNotice =
    (category === 'Game' && gameStorageNotice) || (category === 'Sound' && storageNotice) || ''
  const storageRows = useMemo<FrontendTextRow[]>(
    () =>
      activeStorageNotice
        ? noticeLines(
            skin === 'ingame'
              ? (ingameStorageCopy[activeStorageNotice] ?? activeStorageNotice)
              : activeStorageNotice,
            skin === 'ingame' ? 432 : 600
          ).map((text, index) => ({
            text,
            x: 320,
            y: 338 + index * 30,
          }))
        : [],
    [activeStorageNotice, skin]
  )
  const rows = useMemo<FrontendTextRow[]>(
    () =>
      browser
        ? [
            { text: browserLabel, x: 320, y: skin === 'frontend' ? 139 : 79 },
            { text: 'Back', x: 320, y: 454 },
            ...(compatibility
              ? []
              : noticeLines(browserFallback).map((text, index) => ({
                  text,
                  x: 320,
                  y: (skin === 'frontend' ? 199 : 139) + index * 30,
                }))),
          ]
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
            ...storageRows,
          ],
    [browser, category, masterText, musicText, gameRows, compatibility, skin, storageRows, browserLabel]
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
    // Keep entry focus before the controls, including after an audio retry.
    if (browser)
      root.current?.querySelector<HTMLHeadingElement>('[data-browser-help-heading]')?.focus()
  }, [browser])
  useEffect(() => {
    if (!browser) return
    const element = root.current
    function keydown(event: KeyboardEvent) {
      const owner = element?.closest('dialog')
      if (browser && event.key === 'Escape' && !event.defaultPrevented && owner?.open) {
        const origin = event.target instanceof Element ? event.target.closest('dialog') : null
        // An open underlying dialog is not the current keyboard owner. Keep
        // another dialog's Escape intact, without guessing top-layer DOM order.
        if (origin && origin !== owner) return
        // Disabled controls can leave focus on body. Retain that fallback only
        // when no other open dialog makes ownership ambiguous.
        if (
          !origin &&
          [...document.querySelectorAll('dialog[open]')].some(dialog => dialog !== owner)
        )
          return
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
  function label(text: string, low = false, id = text, disabled = false) {
    let state: TextState = 'normal'
    if (low) state = 'low'
    else if (!disabled && highlight === id) state = 'highlight'
    return <Text text={text} skin={skin} state={state} ready={textReady} />
  }
  function choice(
    text: string,
    x: number,
    y: number,
    action: () => void,
    selected = false,
    options: {
      id?: string
      wide?: boolean
      help?: string
      accessibleLabel?: string
      disabled?: boolean
      busy?: boolean
      pressed?: boolean
      hudSize?: string
    } = {}
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
        aria-label={options.accessibleLabel ?? text}
        disabled={options.disabled}
        aria-busy={options.busy}
        aria-pressed={options.pressed}
        data-hud-size={options.hudSize}
        data-option-key={id}
        data-compatibility={id === 'compatibility' || undefined}
        data-options-browser-copy={id === 'compatibility' ? 'help' : undefined}
        data-panel-back={text === 'Back' || undefined}
        data-menu-tooltip={options.help}
        aria-description={options.help}
        onPointerEnter={() => setHighlight(id)}
        onPointerLeave={() => setHighlight(null)}
        onFocus={() => setHighlight(id)}
        onBlur={() => setHighlight(null)}
        onClick={action}
      >
        {label(text, false, id, options.disabled)}
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
        <section className={styles.compatibility} aria-label={browserTitle}>
          <h2
            className={styles.soundLabel}
            style={{ top: skin === 'frontend' ? 139 : 79 }}
            tabIndex={-1}
            data-browser-help-heading
            data-options-browser-copy="heading"
            aria-label={browserTitle}
          >
            {label(browserLabel)}
          </h2>
          {compatibility ? (
            <>
              {choice('Select Level', 320, 139, compatibility.onSelectLevel, false, { wide: true })}
              {choice(
                `${compatibility.speed}× game speed`,
                320,
                169,
                compatibility.onSpeed,
                false,
                {
                  id: 'speed',
                  wide: true,
                }
              )}
              {choice(
                'Toggle performance overlay · F8',
                320,
                199,
                compatibility.onPerformance,
                false,
                {
                  id: 'performance',
                  wide: true,
                  pressed: compatibility.performance,
                }
              )}
              {choice(
                `HUD size : <${compatibility.hudSize === 'auto' ? 'Automatic' : `${Number(compatibility.hudSize) * 100}%`}>`,
                320,
                229,
                () =>
                  compatibility.onHudSize(
                    hudSizes[
                      (hudSizes.indexOf(compatibility.hudSize as (typeof hudSizes)[number]) + 1) %
                        hudSizes.length
                    ]
                  ),
                false,
                { id: 'hud-size', wide: true, hudSize: compatibility.hudSize }
              )}
              <div className="audio-settings">
                {choice(
                  compatibility.sound ? 'Sound on' : 'Enable sound',
                  320,
                  259,
                  compatibility.onSound,
                  false,
                  {
                    id: 'audio',
                    wide: true,
                    accessibleLabel: compatibility.sound ? '♪ Sound on' : '♫ Enable sound',
                    disabled: compatibility.soundPending,
                    busy: compatibility.soundPending,
                  }
                )}
              </div>
              {(storageNotice || compatibility.audioStartNotice) && (
                <div className={styles.browserNotices}>
                  {[storageNotice, compatibility.audioStartNotice].filter(Boolean).map(notice => (
                    <p key={notice} role="status" aria-label={notice}>
                      <span className="game-a11y-status">{notice}</span>
                      {noticeLines(notice).map((line, index) => (
                        <span key={index} className={styles.noticeLine} aria-hidden="true">
                          {label(line)}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p
              className={styles.browserFallback}
              style={{ top: skin === 'frontend' ? 199 : 139 }}
              aria-label={browserFallback}
            >
              <span className="game-a11y-status">{browserFallback}</span>
              {noticeLines(browserFallback).map((line, index) => (
                <span key={index} className={styles.noticeLine} aria-hidden="true">
                  {label(line)}
                </span>
              ))}
            </p>
          )}
          <button
            className={styles.choice}
            style={{ left: 320, top: 454 }}
            aria-label="Back to Options"
            data-return-options
            onPointerEnter={() => setHighlight('browser-back')}
            onPointerLeave={() => setHighlight(null)}
            onFocus={() => setHighlight('browser-back')}
            onBlur={() => setHighlight(null)}
            onClick={returnFromBrowser}
          >
            {label('Back', false, 'browser-back')}
          </button>
        </section>
      ) : (
        <>
          {category === 'Game' && (
            <>
              {gameRows.map(row => {
                if (row.id === 'compatibility') {
                  return choice(row.text, row.x, row.y, () => setBrowser(true), false, {
                    id: row.id,
                    wide: true,
                    accessibleLabel: browserTitle,
                  })
                }
                if (row.id === 'rotation' || row.id === 'flipRotation') {
                  return choice(
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
                }
                return (
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
              })}
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
          {activeStorageNotice && (
            <p
              className={styles.storage}
              role="status"
              aria-label={activeStorageNotice}
              data-options-browser-copy="storage"
            >
              <span className="game-a11y-status">{activeStorageNotice}</span>
              {storageRows.map((row, index) => (
                <span key={index} className={styles.noticeLine} aria-hidden="true">
                  {label(row.text)}
                </span>
              ))}
            </p>
          )}
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
          <MenuTooltip key={category} container={root} ready={prepared?.tooltip ?? false} />
        </>
      )}
    </section>
  )
}
