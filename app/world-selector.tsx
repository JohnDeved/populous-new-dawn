import { useState, type KeyboardEvent } from 'react'
import {
  openingCampaignMissions,
  openingMissionAvailable,
  openingRecommendedMission,
  selectorWorlds,
} from './world-selector-data'
import styles from './world-selector.module.css'

type Props = {
  missions: readonly number[]
  completed: readonly number[]
  hasCheckpoint: boolean
  onStart: (mission: number) => void
  onTutorial: () => void
  onLoad: () => void
  onBack?: () => void
}

export function WorldSelector({
  missions,
  completed,
  hasCheckpoint,
  onStart,
  onTutorial,
  onLoad,
  onBack,
}: Props) {
  const [selected, setSelected] = useState(() => openingRecommendedMission(completed))
  const [allMissions, setAllMissions] = useState(false)
  const available = openingMissionAvailable(selected, completed)
  const isCompleted = completed.includes(selected)
  const body = selectorWorlds.find(world => world.mission === selected)!

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
          <p className={styles.eyebrow}>Populous: The Beginning</p>
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
          <div className={styles.campaign} onKeyDown={navigate}>
            <div className={styles.map} aria-label="Opening worlds orbit map">
              <svg
                viewBox="0 0 420 400"
                role="img"
                aria-label="Missions 1, 2 and 3 orbit the same parent world. Mission 1 is the outermost moon."
              >
                {[150, 110, 70, 35].map(radius => (
                  <circle key={radius} cx="190" cy="180" r={radius} className={styles.orbit} />
                ))}
                <circle cx="190" cy="180" r="10" className={styles.parentWorld} />
                <text x="210" y="183">
                  World 5
                </text>
                <circle cx="190" cy="215" r="8" className={styles.futureWorld} />
                <text x="210" y="220">
                  World 4
                </text>
                {openingCampaignMissions.map(mission => {
                  const world = selectorWorlds.find(value => value.mission === mission)!
                  const y = 180 + world.orbitRadius
                  return (
                    <g key={mission} className={mission === selected ? styles.selectedOrbit : ''}>
                      <circle cx="190" cy={y} r={mission === selected ? 15 : 8} />
                      <text x="220" y={y + 5}>
                        Mission {mission}
                        {completed.includes(mission) ? ' ✓' : ''}
                      </text>
                    </g>
                  )
                })}
              </svg>
              <p>Original orbit layout · opening worlds</p>
            </div>
            <section className={styles.details} aria-label="Selected world">
              <div
                className={styles.planet}
                style={{ backgroundImage: `url(/original/world-selector/mission-${selected}.png)` }}
                aria-hidden="true"
              />
              <p className={styles.eyebrow}>World {selected}</p>
              <h3>Mission {selected}</h3>
              <p role="status">
                {isCompleted
                  ? 'Completed · ready to replay'
                  : available
                    ? 'Available'
                    : `Complete Mission ${selected - 1} to continue.`}
              </p>
              <p className={styles.orbitDescription}>Moon of World 5 · orbit {body.orbitRadius}</p>
              <button
                className={styles.start}
                disabled={!available}
                onClick={() => onStart(selected)}
              >
                {isCompleted ? `Replay Mission ${selected}` : `Start Mission ${selected}`}
              </button>
            </section>
          </div>
          <div
            className={styles.worldChoices}
            aria-label="Choose campaign world"
            onKeyDown={navigate}
          >
            {openingCampaignMissions.map(mission => {
              const unlocked = openingMissionAvailable(mission, completed)
              return (
                <button
                  key={mission}
                  autoFocus={!hasCheckpoint && mission === selected}
                  aria-pressed={mission === selected}
                  aria-label={`Select Mission ${mission}`}
                  onClick={() => setSelected(mission)}
                >
                  <strong>Mission {mission}</strong>
                  <span>
                    {completed.includes(mission)
                      ? 'Completed ✓'
                      : unlocked
                        ? 'Available'
                        : 'Locked'}
                  </span>
                </button>
              )
            })}
          </div>
          <p className={styles.hint}>
            Select a world, then start. Left and right arrows cycle available worlds.
          </p>
          {completed.includes(3) && (
            <p className={styles.hint}>
              Opening worlds completed. Continue with the other playable worlds in All missions.
            </p>
          )}
        </>
      )}
      <footer className={styles.footer}>
        <button onClick={onTutorial}>Tutorial</button>
        {hasCheckpoint && (
          <button autoFocus onClick={onLoad}>
            Load Game
          </button>
        )}
        {onBack && (
          <p>Starting a mission replaces the current world. Save a checkpoint before switching.</p>
        )}
      </footer>
    </section>
  )
}
