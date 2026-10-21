import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type CSSProperties,
} from 'react'
import {
  openingCampaignMissions,
  openingMissionAvailable,
  openingRecommendedMission,
} from './world-selector-data'
import styles from './world-selector.module.css'
import { WorldSelectorScene } from './world-selector-scene'
import { SelectorTitle, SelectorTooltip } from './world-selector-text'
import {
  nativeSelectorMissions,
  selectorArt,
  selectorWorld,
  type NativeSelectorSelection,
} from './world-selector-art'

interface Props {
  missions: readonly number[]
  completed: readonly number[]
  hasCheckpoint: boolean
  onStart: (mission: number) => void
  onTutorial: () => void
  onLoad: () => void
  onBack?: () => void
  replacingWorld?: boolean
  nativeSelection?: NativeSelectorSelection
}

export function WorldSelector({
  missions,
  completed,
  hasCheckpoint,
  onStart,
  onTutorial,
  onLoad,
  onBack,
  replacingWorld = false,
  nativeSelection,
}: Props) {
  const container = useRef<HTMLElement>(null)
  const launchTaken = useRef(false)
  const directHeading = useRef<HTMLHeadingElement>(null)
  const focusDirectHeading = useRef(false)
  const descriptionId = useId()
  const [openingSelected, setOpeningSelected] = useState<number>(() =>
    openingRecommendedMission(completed)
  )
  const selected = nativeSelection
    ? selectorWorld(nativeSelection.selected).mission
    : openingSelected
  const setSelected = nativeSelection?.onSelect ?? setOpeningSelected
  const campaignMissions = nativeSelection ? nativeSelectorMissions : openingCampaignMissions
  const missionAvailable = (mission: number) =>
    nativeSelection
      ? nativeSelection.available.includes(mission)
      : openingMissionAvailable(mission, completed)
  function missionDescription(mission: number) {
    if (completed.includes(mission)) {
      return nativeSelection && !missionAvailable(mission)
        ? 'Completed, unavailable'
        : 'Completed, ready to replay'
    }
    if (missionAvailable(mission)) return 'Available'
    return nativeSelection ? 'Locked' : `Locked, complete Mission ${mission - 1} to continue`
  }
  const [allMissions, setAllMissions] = useState(false)
  const [compatibility, setCompatibility] = useState(false)
  const [failedArt, setFailedArt] = useState<string[]>([])
  useLayoutEffect(() => {
    if (!focusDirectHeading.current || compatibility || !allMissions) return
    focusDirectHeading.current = false
    // The activated switch disappears. Focus a non-action heading so a held
    // Enter/Space cannot follow it into a mission launch; Tab reaches the grid.
    directHeading.current?.focus({ preventScroll: true })
  }, [allMissions, compatibility])
  const selectedArt = selectorArt(selected)
  const panelArt = selectedArt.panel
  const artKey = String(selected)
  const artFailed = failedArt.includes(artKey)
  const failArt = () =>
    setFailedArt(previous => (previous.includes(artKey) ? previous : [...previous, artKey]))
  const available = missionAvailable(selected)
  // Rendering all native records never makes an unimplemented mission launchable.
  const canStart = available && (!nativeSelection || missions.includes(selected))
  const isCompleted = completed.includes(selected)
  let status = 'Available'
  if (isCompleted)
    status =
      nativeSelection && !available ? 'Completed · unavailable' : 'Completed · ready to replay'
  else if (!available)
    status = nativeSelection ? 'Locked' : `Complete Mission ${selected - 1} to continue.`
  if (nativeSelection && available && !canStart) status = 'Not playable in this version'

  function start() {
    if (!canStart || launchTaken.current) return
    launchTaken.current = true
    onStart(selected)
  }
  function navigate(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const availableMissions = campaignMissions.filter(missionAvailable)
    if (availableMissions.length === 0) return
    // Locked worlds can still be inspected through the panel. Search from that
    // mission's position rather than treating it as a missing available index.
    const next =
      event.key === 'ArrowLeft'
        ? (availableMissions.findLast(mission => mission < selected) ??
          availableMissions[availableMissions.length - 1])
        : (availableMissions.find(mission => mission > selected) ?? availableMissions[0])
    setSelected(next)
    // Keep panel activation tied to the world just selected by the arrow key.
    // Arrows on Start retain its focus so Enter still launches that world.
    if (event.currentTarget.hasAttribute('data-selector-mission')) {
      container.current
        ?.querySelector<HTMLButtonElement>(`[data-selector-mission="${next}"]`)
        ?.focus()
    }
  }

  return (
    <section
      ref={container}
      className={`${styles.selector} ${nativeSelection ? styles.nativeSelector : ''} ${!allMissions ? styles.nativePointer : ''}`}
      aria-label="World selection"
      onKeyDownCapture={event => {
        // Browser recovery controls retain their own Enter/Space activation.
        if (
          !nativeSelection ||
          event.ctrlKey ||
          event.altKey ||
          event.metaKey ||
          event.shiftKey ||
          (event.target as Element | null)?.closest('button[data-selector-recovery]')
        )
          return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.stopPropagation()
          if (event.key === 'Enter' && !event.repeat) start()
        }
      }}
      onKeyUpCapture={event => {
        if (
          nativeSelection &&
          !(event.target as Element | null)?.closest('button[data-selector-recovery]') &&
          (event.key === 'Enter' || event.key === ' ')
        )
          event.preventDefault()
      }}
      style={
        {
          '--selector-cursor': `url("${selectedArt.cursor}") 0 0`,
        } as CSSProperties
      }
    >
      <h2 className={styles.visuallyHidden}>Select Level</h2>
      {!nativeSelection && (
        <button
          className={styles.compatibilityToggle}
          aria-expanded={compatibility}
          aria-controls="selector-browser-controls"
          onClick={() => setCompatibility(value => !value)}
        >
          Browser controls
        </button>
      )}
      {compatibility && (
        <section
          id="selector-browser-controls"
          className={styles.compatibility}
          aria-label="Browser compatibility controls"
        >
          <p>Browser compatibility controls</p>
          <div className={styles.tabs}>
            <button
              aria-pressed={!allMissions}
              onClick={() => {
                setAllMissions(false)
                setCompatibility(false)
              }}
            >
              Campaign worlds
            </button>
            <button
              aria-pressed={allMissions}
              onClick={() => {
                focusDirectHeading.current = true
                setAllMissions(true)
                setCompatibility(false)
              }}
            >
              All missions
            </button>
          </div>
          <label>
            Inspect campaign world
            <select
              aria-label="Inspect campaign world"
              value={selected}
              onChange={event => {
                const mission = campaignMissions.find(value => value === Number(event.target.value))
                if (mission) setSelected(mission)
                setAllMissions(false)
              }}
            >
              {campaignMissions.map(mission => (
                <option key={mission} value={mission}>
                  Mission {mission} ·{' '}
                  {completed.includes(mission)
                    ? 'Completed'
                    : missionAvailable(mission)
                      ? 'Available'
                      : 'Locked'}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.compatibilityActions}>
            <button onClick={onTutorial}>Tutorial</button>
            {hasCheckpoint && <button onClick={onLoad}>Load Game</button>}
            {onBack && <button onClick={onBack}>Back</button>}
          </div>
          <p role="status">{status}</p>
          {replacingWorld && <p>Starting a mission replaces the current world.</p>}
        </section>
      )}
      {allMissions ? (
        <section className={styles.direct} aria-label="All missions">
          <h3 ref={directHeading} tabIndex={-1}>
            Choose any playable mission
          </h3>
          <p>Direct access is available here, independently of campaign progress.</p>
          <div className={styles.missions}>
            {missions.map(mission => (
              <button
                key={mission}
                aria-label={`Mission ${mission}${completed.includes(mission) ? ', completed' : ''}`}
                onClick={() => onStart(mission)}
              >
                Mission {mission}
                <span>{completed.includes(mission) ? 'Completed ✓' : 'Play'}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <WorldSelectorScene
            mission={selected}
            progressionMission={
              nativeSelection
                ? selectorWorld(nativeSelection.progressionMission).mission
                : openingRecommendedMission(completed)
            }
          />
          <div className={styles.selectedTitle}>
            <p role="status" className={available ? styles.visuallyHidden : styles.lockedStatus}>
              {status}
            </p>
            <SelectorTitle mission={selected} />
          </div>
          <div
            className={`${styles.panel} ${nativeSelection ? styles.nativePanel : ''} ${artFailed ? styles.artFallback : ''}`}
            aria-label="Campaign status panel"
          >
            {!artFailed && (
              <img className={styles.panelArt} src={panelArt[0]} alt="" onError={failArt} />
            )}
            <div className={styles.panelGlyphs}>
              {campaignMissions.map(mission => {
                const socket = selectorWorld(mission).panel
                const glyphFrame = completed.includes(mission)
                  ? socket.completedFrame
                  : socket.availableFrame
                return (
                  <button
                    key={mission}
                    className={`${styles.panelGlyph} ${nativeSelection ? styles.nativeGlyph : ''}`}
                    aria-label={`Panel Mission ${mission}${completed.includes(mission) ? ', completed' : ''}`}
                    aria-pressed={mission === selected}
                    aria-disabled={nativeSelection && !missionAvailable(mission) ? true : undefined}
                    data-selector-mission={mission}
                    autoFocus={mission === selected}
                    aria-describedby={`${descriptionId}-${mission}`}
                    data-selector-tooltip={
                      missionAvailable(mission)
                        ? completed.includes(mission)
                          ? 980
                          : 979
                        : undefined
                    }
                    onKeyDown={navigate}
                    onClick={() => {
                      if (!nativeSelection || missionAvailable(mission)) setSelected(mission)
                    }}
                    style={
                      nativeSelection
                        ? {
                            left: `calc(var(--panel-width) * ${socket.localXY[0]} / 640)`,
                            top: `calc(var(--panel-width) * ${socket.localXY[1]} / 640)`,
                            width: `calc(var(--panel-width) * ${socket.width} / 640)`,
                            height: `calc(var(--panel-width) * ${socket.height} / 640)`,
                          }
                        : { left: `calc(var(--panel-width) * ${28 + (mission - 1) * 20} / 640)` }
                    }
                  >
                    <span id={`${descriptionId}-${mission}`} className={styles.visuallyHidden}>
                      {missionDescription(mission)}
                    </span>
                    {artFailed && <span>{mission}</span>}
                    {!artFailed &&
                      (missionAvailable(mission) ||
                        (nativeSelection && completed.includes(mission))) && (
                        <img
                          src={panelArt[String(glyphFrame) as keyof typeof panelArt]}
                          alt=""
                          onError={failArt}
                        />
                      )}
                  </button>
                )
              })}
            </div>
            <button
              className={styles.start}
              disabled={!canStart}
              data-selector-tooltip={canStart ? 978 : undefined}
              aria-label={isCompleted ? `Replay Mission ${selected}` : `Start Mission ${selected}`}
              onKeyDown={navigate}
              onClick={start}
            >
              {!artFailed && <img src={panelArt[10]} alt="" onError={failArt} />}
              <span className={artFailed ? undefined : styles.visuallyHidden}>Start</span>
            </button>
          </div>
          <SelectorTooltip key={selected} mission={selected} container={container} />
        </>
      )}
    </section>
  )
}
