import { useState, type KeyboardEvent } from 'react'
import {
  openingCampaignMissions,
  openingMissionAvailable,
  openingRecommendedMission,
} from './world-selector-data'
import styles from './world-selector.module.css'
import { WorldSelectorScene } from './world-selector-scene'

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
  const [selected, setSelected] = useState(() => openingRecommendedMission(completed))
  const [allMissions, setAllMissions] = useState(false)
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
    <section className={styles.selector} aria-label="World selection">
      <header className={styles.header}>
        <div>
          <h2>Select Level</h2>
        </div>
        {onBack && <button onClick={onBack}>Back</button>}
      </header>
      <div className={styles.tabs}>
        <button aria-pressed={!allMissions} onClick={() => setAllMissions(false)}>
          Campaign worlds
        </button>
        <button aria-pressed={allMissions} onClick={() => setAllMissions(true)}>
          All missions
        </button>
      </div>
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
          <div className={styles.worldChoices} aria-label="Choose campaign world">
            {openingCampaignMissions.map(mission => {
              const unlocked = openingMissionAvailable(mission, completed)
              let label = 'Locked'
              if (completed.includes(mission)) label = 'Completed ✓'
              else if (unlocked) label = 'Available'
              return (
                <button
                  key={mission}
                  autoFocus={!hasCheckpoint && mission === selected}
                  aria-pressed={mission === selected}
                  aria-label={`Select Mission ${mission}`}
                  onKeyDown={navigate}
                  onClick={() => setSelected(mission)}
                >
                  <strong>Mission {mission}</strong>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>
          <div className={styles.selectedTitle}>
            <p role="status">{status}</p>
            <h3>Mission {selected}</h3>
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
                  title={`Mission ${mission}`}
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
              aria-label={isCompleted ? `Replay Mission ${selected}` : `Start Mission ${selected}`}
              onKeyDown={navigate}
              onClick={() => onStart(selected)}
            >
              {!artFailed && <img src={`${panelArt}10.png`} alt="" onError={failArt} />}
              <span>{artFailed ? 'Start' : 'Launch'}</span>
            </button>
          </div>
        </>
      )}
      <footer className={styles.footer}>
        <button onClick={onTutorial}>Tutorial</button>
        {hasCheckpoint && (
          <button autoFocus onClick={onLoad}>
            Load Game
          </button>
        )}
        {replacingWorld && <p>Starting a mission replaces the current world.</p>}
      </footer>
    </section>
  )
}
