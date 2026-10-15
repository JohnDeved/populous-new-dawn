import { useRef, useState, type KeyboardEvent, type CSSProperties } from 'react'
import {
  openingCampaignMissions,
  openingMissionAvailable,
  openingRecommendedMission,
} from './world-selector-data'
import styles from './world-selector.module.css'
import { WorldSelectorScene } from './world-selector-scene'
import { SelectorTitle, SelectorTooltip } from './world-selector-text'

interface Props {
  missions: readonly number[]
  completed: readonly number[]
  hasCheckpoint: boolean
  onStart: (mission: number) => void
  onTutorial: () => void
  onLoad: () => void
  onBack?: () => void
  replacingWorld?: boolean
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
}: Props) {
  const container = useRef<HTMLElement>(null)
  const [selected, setSelected] = useState(() => openingRecommendedMission(completed))
  const [allMissions, setAllMissions] = useState(false)
  const [compatibility, setCompatibility] = useState(false)
  const [failedArt, setFailedArt] = useState<string[]>([])
  const panelArt = `/original/world-selector/panel/${selected}-`
  const artFailed = failedArt.includes(panelArt)
  const failArt = () =>
    setFailedArt(previous => (previous.includes(panelArt) ? previous : [...previous, panelArt]))
  const available = openingMissionAvailable(selected, completed)
  const isCompleted = completed.includes(selected)
  let status = 'Available'
  if (isCompleted) status = 'Completed · ready to replay'
  else if (!available) status = `Complete Mission ${selected - 1} to continue.`

  function navigate(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const availableMissions = openingCampaignMissions.filter(mission =>
      openingMissionAvailable(mission, completed)
    )
    const direction = event.key === 'ArrowLeft' ? -1 : 1
    const current = availableMissions.indexOf(selected as 1 | 2 | 3)
    setSelected(
      availableMissions[(current + direction + availableMissions.length) % availableMissions.length]
    )
  }

  return (
    <section
      ref={container}
      className={`${styles.selector} ${!allMissions ? styles.nativePointer : ''}`}
      aria-label="World selection"
      style={
        {
          '--selector-cursor': `url("/original/world-selector/text/cursor-${selected}.png") 0 0`,
        } as CSSProperties
      }
    >
      <h2 className={styles.visuallyHidden}>Select Level</h2>
      <button
        className={styles.compatibilityToggle}
        aria-expanded={compatibility}
        aria-controls="selector-browser-controls"
        onClick={() => setCompatibility(value => !value)}
      >
        Browser controls
      </button>
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
                setSelected(Number(event.target.value))
                setAllMissions(false)
              }}
            >
              {openingCampaignMissions.map(mission => (
                <option key={mission} value={mission}>
                  Mission {mission} ·{' '}
                  {completed.includes(mission)
                    ? 'Completed'
                    : openingMissionAvailable(mission, completed)
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
          <h3>Choose any playable mission</h3>
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
            progressionMission={openingRecommendedMission(completed)}
          />
          <div className={styles.selectedTitle}>
            <p role="status" className={available ? styles.visuallyHidden : styles.lockedStatus}>
              {status}
            </p>
            <SelectorTitle mission={selected} />
          </div>
          <div
            className={`${styles.panel} ${artFailed ? styles.artFallback : ''}`}
            aria-label="Campaign status panel"
          >
            {!artFailed && (
              <img className={styles.panelArt} src={`${panelArt}0.png`} alt="" onError={failArt} />
            )}
            <div className={styles.panelGlyphs}>
              {openingCampaignMissions.map(mission => (
                <button
                  key={mission}
                  className={styles.panelGlyph}
                  aria-label={`Panel Mission ${mission}${completed.includes(mission) ? ', completed' : ''}`}
                  aria-pressed={mission === selected}
                  autoFocus={mission === selected}
                  aria-description={
                    completed.includes(mission)
                      ? 'Completed, ready to replay'
                      : openingMissionAvailable(mission, completed)
                        ? 'Available'
                        : `Locked, complete Mission ${mission - 1} to continue`
                  }
                  data-selector-tooltip={
                    openingMissionAvailable(mission, completed)
                      ? completed.includes(mission)
                        ? 980
                        : 979
                      : undefined
                  }
                  onKeyDown={navigate}
                  onClick={() => setSelected(mission)}
                  style={{ left: `calc(var(--panel-width) * ${28 + (mission - 1) * 20} / 640)` }}
                >
                  {!artFailed && openingMissionAvailable(mission, completed) && (
                    <img
                      src={`${panelArt}${completed.includes(mission) ? 6 : 5}.png`}
                      alt=""
                      onError={failArt}
                    />
                  )}
                </button>
              ))}
            </div>
            <button
              className={styles.start}
              disabled={!available}
              data-selector-tooltip={available ? 978 : undefined}
              aria-label={isCompleted ? `Replay Mission ${selected}` : `Start Mission ${selected}`}
              onKeyDown={navigate}
              onClick={() => onStart(selected)}
            >
              {!artFailed && <img src={`${panelArt}10.png`} alt="" onError={failArt} />}
              <span className={artFailed ? undefined : styles.visuallyHidden}>Start</span>
            </button>
          </div>
          <SelectorTooltip mission={selected} container={container} />
        </>
      )}
    </section>
  )
}
