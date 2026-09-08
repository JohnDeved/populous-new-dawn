'use client'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  BUILDINGS,
  SPELLS,
  HOME,
  select,
  tell,
  guardShaman,
  rotateBuildingPlan,
  type UnitKind,
} from './model'
import { createGameStore } from './game-store'
import type { GameScene } from './scene'
import { Soundscape } from './audio'
import { messageText, removeMessage } from './messages'
import { HudSprite, NativeText } from './hud'
const timeLabel = (time: number) =>
  `${Math.floor(time / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(time % 60)
    .toString()
    .padStart(2, '0')}`

export default function Home() {
  const [store] = useState(createGameStore)
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const world = store.getWorld(),
    update = store.update
  const [tab, setTab] = useState<'spells' | 'buildings' | 'followers'>('spells')
  const [sound, setSound] = useState(false)
  const [volume, setVolume] = useState(0.35)
  const [menu, setMenu] = useState(false)
  const [ready, setReady] = useState(false)
  const [desktopNotice, setDesktopNotice] = useState(true)
  const [error, setError] = useState('')
  const shell = useRef<HTMLElement>(null)
  useEffect(() => {
    const resize = () => {
      const scale = Math.min(2, window.innerHeight / 480)
      shell.current?.style.setProperty('--hud-scale', String(scale))
      shell.current?.style.setProperty('--hud-height', `${window.innerHeight / scale}px`)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  const [hover, setHover] = useState<string | null>(null)
  const viewport = useRef<HTMLDivElement>(null),
    minimap = useRef<HTMLCanvasElement>(null),
    dialog = useRef<HTMLDialogElement>(null)
  const engine = useRef<GameScene | null>(null),
    audio = useRef<Soundscape | null>(null)
  useEffect(() => {
    if (engine.current)
      engine.current.hoveredSpell =
        tab === 'spells' ? (SPELLS.find(s => s.id === hover)?.model ?? 0) : 0
  }, [hover, tab, ready])
  useEffect(() => {
    audio.current = new Soundscape()
    return () => {
      audio.current?.dispose()
      audio.current = null
    }
  }, [])
  useEffect(() => {
    let disposed = false
    if (window.innerWidth < 900)
      store.change(w => {
        w.paused = true
      })
    import('./scene')
      .then(({ GameScene }) => {
        if (disposed || !viewport.current || !minimap.current) return
        try {
          engine.current = new GameScene(
            viewport.current,
            minimap.current,
            world,
            update,
            (cue, attenuation, pan, finished) => audio.current?.cue(cue, attenuation, pan, finished)
          )
          setReady(true)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Unable to start the 3D world.')
        }
      })
      .catch(e => setError(String(e)))
    return () => {
      disposed = true
      engine.current?.dispose()
      engine.current = null
    }
  }, [world, update, store])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement).closest('input,dialog'))
        return
      if (world.inputMask) {
        if ((e.code === 'Space' || e.key === 'Escape') && world.flyby.flags & 1) {
          e.preventDefault()
          engine.current?.skipIntroduction()
        }
        return
      }
      const s = SPELLS.find(s => s.key === e.key)
      if (s) {
        store.change(w => {
          w.mode = w.mode === s.id ? null : s.id
        })
        setTab('spells')
      }
      if (e.key === 'Enter' && !(e.target as HTMLElement).closest('button'))
        engine.current?.overview()
      if (e.key === 'Escape') {
        store.change(w => {
          w.mode = null
        })
      }
      if (e.key.toLowerCase() === 'g') guardShaman(world)
      if (e.key.toLowerCase() === 'h') select(world, 'shaman')
      if (e.key.toLowerCase() === 'f') {
        const u = world.units.find(u => world.selected.includes(u.id))
        engine.current?.focus(u ?? HOME, { animate: true })
      }
      if (e.key.toLowerCase() === 'b') {
        setTab('buildings')
        store.change(w => {
          w.mode = null
        })
      }
      if (e.code === 'Space' && !(e.target as HTMLElement).closest('button')) {
        e.preventDefault()
        if (!e.repeat) {
          store.change(w => {
            if (rotateBuildingPlan(w)) audio.current?.cue(0x26)
            else w.paused = !w.paused
          })
        }
      }
      update()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [world, update, store])
  useEffect(() => {
    if (menu) {
      store.change(w => {
        w.paused = true
      })
      dialog.current?.showModal()
    } else if (dialog.current?.open) dialog.current.close()
  }, [menu, world, store])
  async function toggleSound() {
    if (sound) {
      audio.current?.mute()
      setSound(false)
    } else
      try {
        await audio.current?.enable()
        setSound(true)
      } catch {
        tell(world, 'Audio could not start. Try the sound button again.')
        update()
      }
  }
  function choose(kind: UnitKind | 'all') {
    select(world, kind)
    audio.current?.cue(kind === 'shaman' ? 0x18 : kind === 'warrior' ? 0x43 : 0x58)
    update()
  }
  function restart() {
    audio.current?.reset()
    setMenu(false)
    setReady(false)
    setError('')
    store.restart()
    setTab('spells')
  }
  const blue = world.units.filter(u => u.team === 'blue'),
    red = world.units.filter(u => u.team === 'red')
  const shaman = blue.find(u => u.kind === 'shaman'),
    selected = blue.filter(u => world.selected.includes(u.id))
  const focused =
    SPELLS.find(s => s.id === (hover ?? world.mode)) ??
    BUILDINGS.find(b => b.id === (hover ?? world.mode))
  const modeName =
    SPELLS.find(s => s.id === world.mode)?.name ?? BUILDINGS.find(b => b.id === world.mode)?.name
  const objectives = [
    { text: 'Bridge to the central island', done: world.stats.bridges > 0 },
    { text: 'Discover warrior training', done: world.unlockedCamp },
    { text: 'Defeat the Dakini tribe', done: world.status === 'won' },
  ]
  return (
    <main
      ref={shell}
      className="game-shell"
      onClickCapture={e => {
        if (
          world.inputMask &&
          !(e.target as Element).closest(
            '.top-actions,.wordmark,.game-dialog,.campaign-messages,.skip-introduction,.paused-badge,.desktop-recommendation,.loading-world,.end-screen'
          )
        ) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        if (e.detail > 0 && (e.target as Element).closest('.native-hud'))
          (e.target as Element).closest('button')?.blur()
      }}
    >
      <div className="world-viewport" ref={viewport} />
      <div className="world-vignette" />
      {desktopNotice && (
        <aside className="desktop-recommendation">
          <span className="brand-rune">⟡</span>
          <h2>A world worth a bigger screen.</h2>
          <p>For the best experience, play on a desktop monitor with a keyboard and mouse.</p>
          <button
            className="primary-button"
            onClick={() => {
              setDesktopNotice(false)
              store.change(w => {
                w.paused = false
              })
            }}
          >
            Continue anyway <span>↗</span>
          </button>
        </aside>
      )}
      {ready && world.messageUntil > world.time && (
        <div className="world-message" role="status">
          <span>✧</span>
          {world.message}
        </div>
      )}
      <aside className="campaign-messages" aria-label="Campaign messages">
        {world.messages.slots
          .map((message, slot) => ({ message, slot }))
          .filter(entry => entry.message)
          .sort((a, b) => b.message!.age - a.message!.age)
          .map(({ message, slot }) => (
            <details key={message!.serial} open={message!.flags & 0x20000 ? true : undefined}>
              <summary aria-label="Read campaign message">
                <img src="/original/message.png" alt="" />
              </summary>
              <div>
                <p>{messageText(message!.stringId)}</p>
                <button
                  onClick={() => {
                    removeMessage(world.messages, slot)
                    update()
                  }}
                  aria-label="Dismiss campaign message"
                >
                  ×
                </button>
              </div>
            </details>
          ))}
      </aside>
      {ready && !!(world.flyby.flags & 1) && (
        <button className="skip-introduction" onClick={() => engine.current?.skipIntroduction()}>
          Skip introduction <kbd>ESC</kbd>
        </button>
      )}
      {ready && world.paused && !menu && world.status === 'playing' && (
        <button
          className="paused-badge"
          onClick={() => {
            store.change(w => {
              w.paused = false
            })
          }}
        >
          Ⅱ <span>WORLD PAUSED</span>
          <small>Click to resume</small>
        </button>
      )}
      {world.mode && (
        <div className="target-prompt">
          <span>◎</span> Choose where to {SPELLS.some(s => s.id === world.mode) ? 'cast' : 'build'}{' '}
          <strong>{modeName}</strong>
          {Object.hasOwn(world.buildingDirections, world.mode) && (
            <span>
              Rotate <kbd>SPACE</kbd>
            </span>
          )}
          <button
            onClick={() => {
              store.change(w => {
                w.mode = null
              })
            }}
          >
            Cancel <kbd>ESC</kbd>
          </button>
        </div>
      )}

      <aside className="native-hud" aria-label="Tribe controls">
        <div className="minimap-wrap">
          <canvas
            ref={minimap}
            width={220}
            height={220}
            aria-label="Minimap. Click to move the camera."
          />
          <img className="map-frame" src="/original/hud-map-frame.png" alt="" />
        </div>
        <nav className="dock-tabs" aria-label="Command categories">
          {(['buildings', 'spells', 'followers'] as const).map((t, i) => (
            <button
              key={t}
              aria-label={`${t} ${t === 'spells' ? '1–3' : t === 'buildings' ? 'B' : ''}`}
              title={t}
              aria-pressed={tab === t}
              className={tab === t ? 'active' : ''}
              onClick={() => {
                setTab(t)
                store.change(w => {
                  w.mode = null
                })
                setHover(null)
              }}
            >
              <HudSprite id={676 + i * 2 + Number(tab === t)} />
            </button>
          ))}
        </nav>
        <div className="shaman-controls">
          <button
            className="globe-button"
            aria-label="Planet overview"
            title="Planet overview · Enter"
            onClick={() => engine.current?.overview()}
          >
            <HudSprite id={875} />
          </button>
          <button
            className="portrait"
            aria-label="Select and focus shaman"
            title="Shaman · H"
            onClick={() => {
              choose('shaman')
              engine.current?.focus(shaman ?? HOME, { animate: true })
            }}
          >
            <img src="/original/portrait.png" alt="" />
          </button>
          <button
            className="help-button"
            aria-label="Menu"
            title="Help and game menu"
            onClick={() => setMenu(true)}
          >
            ?
          </button>
          <div
            className="health-bar"
            role="meter"
            aria-label="Shaman health"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.ceil(shaman?.hp ?? 0)}
          >
            <i style={{ height: `${shaman?.hp ?? 0}%` }} />
          </div>
          <button
            className="tribe-flag dakini"
            title={`Dakini: ${red.length} followers`}
            aria-label="Focus Dakini tribe"
            onClick={() => {
              const u = red.find(u => u.kind === 'shaman') ?? red[0]
              if (u) engine.current?.focus(u, { animate: true })
            }}
          />
          <span className="tribe-flag chumara" />
          <span className="tribe-flag matak" />
        </div>
        <section className="tribe-classes" aria-label="Followers">
          <button
            className="population-button"
            aria-label="Select all followers"
            title="Select all followers"
            onClick={() => choose('all')}
          >
            <i />
            <NativeText text={String(blue.length)} font={2} />
          </button>
          {(
            [
              { kind: 'brave', label: 'Braves', sprite: 666 },
              { kind: 'warrior', label: 'Warriors', sprite: 668 },
            ] as const
          ).map(u => (
            <button
              key={u.kind}
              aria-label={`Select all ${u.label.toLowerCase()}`}
              title={u.label}
              onClick={() => choose(u.kind)}
            >
              <HudSprite
                id={
                  u.sprite + Number(selected.length > 0 && selected.every(s => s.kind === u.kind))
                }
              />
              <NativeText text={String(blue.filter(b => b.kind === u.kind).length)} font={2} />
            </button>
          ))}
          {[
            { name: 'Firewarriors', sprite: 670 },
            { name: 'Preachers', sprite: 672 },
            { name: 'Spies', sprite: 674 },
          ].map(u => (
            <button key={u.name} disabled aria-label={u.name} title={u.name}>
              <HudSprite id={u.sprite} />
              <NativeText text="0" font={2} />
            </button>
          ))}
        </section>
        <div
          className="tiny-mana"
          role="meter"
          aria-label="Blast charge progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(world.mana * 10)}
        >
          <i style={{ width: `${world.mana * 10}%` }} />
        </div>
        <section className="command-dock" aria-label="Command panel">
          {tab === 'spells' && (
            <div className="spell-list">
              {[...SPELLS]
                .sort((a, b) => a.model - b.model)
                .map(s => (
                  <button
                    key={s.id}
                    className={`spell-card ${world.mode === s.id ? 'active' : ''} ${s.id !== 'blast' ? 'gift' : ''}`}
                    aria-label={`${s.name}, ${world.shots[s.id]} shots`}
                    aria-pressed={world.mode === s.id}
                    title={s.name}
                    onClick={() =>
                      store.change(w => {
                        w.mode = w.mode === s.id ? null : s.id
                      })
                    }
                    onContextMenu={e => {
                      e.preventDefault()
                      if (s.id === 'blast')
                        store.change(w => {
                          w.charging = !w.charging
                        })
                    }}
                    onMouseEnter={() => setHover(s.id)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(s.id)}
                    onBlur={() => setHover(null)}
                  >
                    <span className="shot-markers">
                      {Array.from({ length: 4 }, (_, i) => (
                        <HudSprite
                          key={i}
                          id={
                            i < world.shots[s.id]
                              ? i < world.giftCounts[s.id]
                                ? 65
                                : 54
                              : s.id === 'blast'
                                ? 55
                                : 66
                          }
                        />
                      ))}
                    </span>
                    <HudSprite
                      id={
                        353 +
                        s.model +
                        Number(world.shots[s.id] === 0 && !(s.id === 'blast' && world.charging)) *
                          18
                      }
                    />
                    {s.id === 'blast' && world.charging && (
                      <i className="charge-track">
                        <i style={{ width: `${world.mana * 10}%` }} />
                      </i>
                    )}
                  </button>
                ))}
            </div>
          )}
          {tab === 'buildings' && (
            <div className="building-list">
              {BUILDINGS.map(b => (
                <button
                  key={b.id}
                  disabled={b.id === 'camp' && !world.unlockedCamp}
                  className={`building-card ${world.mode === b.id ? 'active' : ''}`}
                  aria-label={`${b.name}, ${b.cost} wood`}
                  aria-pressed={world.mode === b.id}
                  title={`${b.name} · Space rotates the plan`}
                  onClick={() =>
                    store.change(w => {
                      w.mode = w.mode === b.id ? null : b.id
                    })
                  }
                  onMouseEnter={() => setHover(b.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(b.id)}
                  onBlur={() => setHover(null)}
                >
                  <HudSprite id={b.id === 'hut' ? 1028 : 1030} />
                </button>
              ))}
            </div>
          )}
          {tab === 'followers' && (
            <div className="follower-list">
              {(
                [
                  { id: 'shaman', label: 'Shaman', sprite: 664 },
                  { id: 'brave', label: 'Braves', sprite: 666 },
                  { id: 'warrior', label: 'Warriors', sprite: 668 },
                  { id: 'all', label: 'Everyone', sprite: 680 },
                ] as const
              ).map(u => (
                <button
                  key={u.id}
                  title={u.label}
                  aria-label={`Select ${u.label.toLowerCase()}`}
                  onClick={() => choose(u.id)}
                >
                  <HudSprite id={u.sprite} />
                </button>
              ))}
            </div>
          )}
        </section>
        <div className="top-actions">
          <button
            aria-label={sound ? 'Mute sound' : 'Enable sound'}
            title={sound ? 'Mute sound' : 'Enable sound'}
            onClick={toggleSound}
          >
            {sound ? '♪' : '♫'}
          </button>
          <button
            aria-label={world.paused ? 'Resume game' : 'Pause game'}
            title="Pause / resume · Space"
            onClick={() =>
              store.change(w => {
                w.paused = !w.paused
              })
            }
          >
            {world.paused ? '▷' : 'Ⅱ'}
          </button>
          <button aria-label="Game settings" title="Game settings" onClick={() => setMenu(true)}>
            ☰
          </button>
        </div>
      </aside>
      {focused && (
        <div className="hud-description" role="tooltip">
          <strong>{focused.name}</strong>
          <p>{focused.description}</p>
        </div>
      )}

      {(!ready || error) && (
        <div className="loading-world" role="status">
          <span className="loading-rune">⟡</span>
          <h2>{error ? 'The world could not awaken' : 'A world is awakening'}</h2>
          <p>
            {error
              ? 'This game needs WebGL 2. Try a current browser with hardware acceleration enabled.'
              : 'Raising the earth. Gathering your people.'}
          </p>
          {error && (
            <>
              <details>
                <summary>Technical details</summary>
                {error}
              </details>
              <button className="primary-button" onClick={restart}>
                Try again
              </button>
            </>
          )}
        </div>
      )}
      {world.status !== 'playing' && !world.outcome.cameraPlaying && (
        <div className="end-screen">
          <span className="end-rune">{world.status === 'won' ? '✺' : '◈'}</span>
          <p className="eyebrow">
            {world.status === 'won' ? 'THE FIRST STEP TO GODHOOD' : 'THE CIRCLE IS BROKEN'}
          </p>
          <h2>{world.status === 'won' ? 'A world united.' : 'Even gods can fall.'}</h2>
          <p>
            {world.status === 'won'
              ? 'The Dakini are defeated. Your people will remember this dawn.'
              : 'Your tribe has fallen, but every beginning is another chance.'}
          </p>
          <div className="end-stats">
            <span>
              {timeLabel(world.time)}
              <small>TIME</small>
            </span>
            <span>
              {world.stats.cast}
              <small>SPELLS CAST</small>
            </span>
            <span>
              {world.stats.built}
              <small>BUILDINGS RAISED</small>
            </span>
          </div>
          <button className="primary-button" onClick={restart}>
            Begin again <span>↗</span>
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        className="game-dialog"
        onClose={() => {
          setMenu(false)
          store.change(w => {
            w.paused = false
          })
        }}
      >
        <button className="dialog-close" onClick={() => setMenu(false)} aria-label="Close menu">
          ×
        </button>
        <span className="eyebrow">POPULOUS · THE FIRST DAWN</span>
        <h2>The world can wait.</h2>
        <p>
          Worship for Land Bridge, discover warrior training, then defeat every Dakini follower.
        </p>
        <div className="menu-actions">
          <button className="primary-button" onClick={() => setMenu(false)}>
            Return to the world <span>↗</span>
          </button>
          <button className="secondary-button" onClick={restart}>
            Restart world
          </button>
        </div>
        <details className="menu-objectives">
          <summary>Objectives · {objectives.filter(o => o.done).length} / 3</summary>
          <ul>
            {objectives.map(o => (
              <li key={o.text}>
                {o.done ? '✓ ' : ''}
                {o.text}
              </li>
            ))}
          </ul>
        </details>
        <div className="menu-utilities">
          <span>{timeLabel(world.time)}</span>
          <button
            onClick={() => {
              store.change(w => {
                w.speed = w.speed === 1 ? 2 : 1
              })
            }}
          >
            {world.speed}× game speed
          </button>
          <button onClick={() => engine.current?.zoom(0.82)}>Zoom in</button>
          <button onClick={() => engine.current?.zoom(1.22)}>Zoom out</button>
          <button onClick={() => engine.current?.focus(HOME, { animate: true })}>
            Focus settlement
          </button>
        </div>
        <h3>Your powers, at a glance</h3>
        <div className="help-grid">
          <span>Click</span>
          <strong>Select a follower or give a move / attack order</strong>
          <span>Drag on land</span>
          <strong>Select a group · Shift adds to selection</strong>
          <span>Right / middle drag</span>
          <strong>Right drag turns the view · middle drag moves it</strong>
          <span>Scroll</span>
          <strong>Zoom · WASD to move · Q / E to turn</strong>
          <span>1–3 / B</span>
          <strong>Choose a spell / open buildings</strong>
          <span>Space with a building plan</span>
          <strong>Rotate the entrance before placing</strong>
          <span>H / F / G / Space / Esc</span>
          <strong>Shaman / focus / guard shaman / pause / cancel</strong>
        </div>
        <p className="help-tip">
          Each spell shows its own casting range. Blast recharges; right-click its card to pause
          charging and direct more mana to training. Worship the southern head for Land Bridge (four
          held at once), and the central head for four Lightning gifts. Only your shaman can learn
          at the vault. Select braves and click a friendly hut to house them, or a completed
          training hut to train them. Builders carry logs from trees. Followers drown in water;
          Blast can knock them off a shore.
        </p>
        <div className="audio-settings">
          <button className="secondary-button" onClick={toggleSound}>
            {sound ? '♪ Sound on' : '♫ Enable sound'}
          </button>
          <label>
            Volume{' '}
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={volume}
              onChange={e => {
                const v = Number(e.target.value)
                setVolume(v)
                audio.current?.setVolume(v)
              }}
            />
          </label>
        </div>
        <details className="reference-details">
          <summary>About this recreation & references</summary>
          <p>
            Level 1: The Journey Begins. Terrain, starting objects and shrine timings were read from
            the supplied original level file. Building and tree meshes, texture coordinates, layered
            unit animations, HUD artwork and landscape bank c were decoded from the supplied game
            archive. The browser renderer approximates the original lighting, terrain displacement
            and water animation. Selection voices, spell cues and combat sounds use the original
            recordings. Adaptive music, ambience and the complete native sound scheduler are still
            being reconstructed. Village growth and mana use rules traced from the executable.
            Combat state selection, pathfinding and defensive AI still differ from the original.
          </p>
          <div>
            <a
              href="https://store.steampowered.com/app/2616430/Populous_The_Beginning/"
              target="_blank"
              rel="noreferrer"
            >
              Original game & visual references ↗
            </a>
            <a
              href="https://wiki.popre.net/Populous%3A_The_Beginning"
              target="_blank"
              rel="noreferrer"
            >
              Gameplay reference ↗
            </a>
            <a href="https://www.youtube.com/watch?v=kIY_4F47R6Q" target="_blank" rel="noreferrer">
              Mark Knight’s original soundtrack ↗
            </a>
            <a
              href="https://sounds.spriters-resource.com/pc_computer/populousbegin/asset/393974/"
              target="_blank"
              rel="noreferrer"
            >
              Shaman voice reference ↗
            </a>
          </div>
        </details>
      </dialog>
    </main>
  )
}
