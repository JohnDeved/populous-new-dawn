'use client'
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
  type SyntheticEvent,
} from 'react'
import {
  BUILDINGS,
  SPELLS,
  HOME,
  select,
  cancelInteraction,
  tell,
  guardShaman,
  disguiseSelectedSpies,
  rotateBuildingPlan,
  maxHp,
  population,
  populationLimit,
  isShaman,
  ROUTE_FAILURE_TEXT,
  type UnitKind,
} from './model'
import { createGameStore } from './game-store'
import type { GameScene } from './scene'
import { Soundscape } from './audio'
import {
  DEFAULT_AUDIO_PREFERENCES,
  readAudioPreferences,
  saveAudioPreferences,
  type AudioPreferences,
} from './audio-preferences'
import { messageIcon, messageText, messageViewPoint, removeMessage } from './messages'
import {
  HudSprite,
  FollowerNumber,
  FollowerIcon,
  PopulationMeter,
  SpellButtonArt,
  ShamanHealth,
  ManaMeter,
} from './hud'
import { spellOrder } from './spell-button'
import { spellHudButton, spellHudRoster, spellHudVisibility } from './spell-visibility'
import { nativeUnitModel } from './unit-kinds'
import {
  missionComputerTribes,
  missionNumbers,
  tutorialLevel,
} from './mission-data'
import { teamForTribe, type TribeTeam } from './world-types'
const timeLabel = (time: number) =>
  `${Math.floor(time / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(time % 60)
    .toString()
    .padStart(2, '0')}`

const messageScreenX = (value: number, width: number) => {
    const product = Math.imul(width, value)
    return (product + ((product >> 31) & 0xffff)) >> 16
  },
  messageScreenY = (value: number, height: number) => {
    const product = (Math.imul(height, value) + Math.trunc(height / 2)) | 0
    return (product + ((product >> 31) & 0xffff)) >> 16
  }

type LoadRequest =
  | { kind: 'mission'; mission: number }
  | { kind: 'checkpoint' }
  | { kind: 'restart' }
  | { kind: 'continue'; mission: number }

export default function Home() {
  const [store] = useState(createGameStore)
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  const world = store.getWorld(),
    update = store.update
  const completedMissions = store.getCompletedMissions(),
    recommendedMission = missionNumbers.find(mission => !completedMissions.includes(mission))
  const spellRoster = spellHudRoster(world)
  const { routeNotice } = world
  const [tab, setTab] = useState<'spells' | 'buildings' | 'followers'>('spells')
  const [sound, setSound] = useState(false)
  const [audioPreferences, setAudioPreferences] =
    useState<AudioPreferences>(DEFAULT_AUDIO_PREFERENCES)
  const [audioStorageNotice, setAudioStorageNotice] = useState('')
  const { volume, musicVolume } = audioPreferences
  const [soundPending, setSoundPending] = useState(false)
  const [hudSize, setHudSize] = useState('auto')
  const [messageViewportHeight, setMessageViewportHeight] = useState(480)
  const [checkpointNotice, setCheckpointNotice] = useState('')
  const [startup, setStartup] = useState<'loading' | 'choice' | 'playing'>('loading')
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hud-size')
      // oxlint-disable-next-line react/set-state-in-effect -- Restore browser storage after hydration.
      if (saved && ['auto', '1', '1.5', '2', '2.5', '3', '4'].includes(saved)) setHudSize(saved)
    } catch {
      // Storage can be disabled; the size control still works for this session.
    }
  }, [])
  const [menu, setMenu] = useState(false)
  const [ready, setReady] = useState(false)
  const [desktopNotice, setDesktopNotice] = useState(true)
  const [error, setError] = useState('')
  const shell = useRef<HTMLElement>(null)
  const followerPress = useRef<EventTarget | null>(null)
  const loadRequest = useRef<LoadRequest | null>(null)
  const messageDetails = useRef(new Map<number, HTMLDetailsElement>())
  useEffect(() => {
    const resize = () => {
      // Scale artwork uniformly; extra screen height extends only the panel background.
      const fit = Math.min(window.innerWidth / 640, window.innerHeight / 480)
      const preferred =
        hudSize === 'auto' ? Math.min(2.5, Math.max(1, Math.floor(fit * 2) / 2)) : Number(hudSize)
      shell.current?.style.setProperty('--hud-scale', String(Math.min(preferred, fit)))

      // 0x4314c0 + 0x44a1f0: campaign notifications use independent screen
      // parameterization, not the user's uniformly scaled HUD artwork size.
      let normalizedMessageWidth = 0x0ccc
      if (messageScreenX(normalizedMessageWidth, window.innerWidth) & 1)
        normalizedMessageWidth += 0x66
      shell.current?.style.setProperty(
        '--message-width',
        `${messageScreenX(normalizedMessageWidth, window.innerWidth)}px`
      )
      setMessageViewportHeight(window.innerHeight)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [hudSize])
  useEffect(() => {
    const opened: number[] = []
    for (const message of world.messages.slots) {
      if (!message || !(message.flags & 2)) continue
      const details = messageDetails.current.get(message.serial)
      if (!details) continue
      details.open = true
      opened.push(message.serial)
    }
    if (!opened.length) return
    const serials = new Set(opened)
    store.change(w => {
      for (const message of w.messages.slots)
        if (message && serials.has(message.serial)) message.flags &= ~2
    })
  })
  const [hover, setHover] = useState<string | null>(null)
  const viewport = useRef<HTMLDivElement>(null),
    minimap = useRef<HTMLCanvasElement>(null),
    portrait = useRef<HTMLCanvasElement>(null),
    startupDialog = useRef<HTMLDialogElement>(null),
    dialog = useRef<HTMLDialogElement>(null)
  const engine = useRef<GameScene | null>(null),
    audio = useRef<Soundscape | null>(null)
  useEffect(() => {
    if (engine.current)
      engine.current.hoveredSpell =
        tab === 'spells' ? (SPELLS.find(s => s.id === hover)?.model ?? 0) : 0
  }, [hover, tab, ready])
  function changeAudioPreferences(next: AudioPreferences) {
    setAudioPreferences(next)
    audio.current?.setVolume(next.volume)
    audio.current?.setMusicVolume(next.musicVolume)
    setAudioStorageNotice(
      saveAudioPreferences(next)
        ? ''
        : 'Volume changes apply for this session; browser storage is unavailable.'
    )
  }
  useEffect(() => {
    audio.current = new Soundscape()
    return () => {
      audio.current?.dispose()
      audio.current = null
    }
  }, [])
  useEffect(() => {
    let active = true
    void store.restoreCheckpoint().then(() => {
      if (!active) return
      const preferences = readAudioPreferences()
      setAudioPreferences(preferences)
      audio.current?.setVolume(preferences.volume)
      audio.current?.setMusicVolume(preferences.musicVolume)
      setStartup('choice')
    })
    return () => {
      active = false
    }
  }, [store])
  useEffect(() => {
    if (startup !== 'playing') return
    let disposed = false,
      scene: GameScene | null = null
    if (window.innerWidth < 900)
      store.change(w => {
        w.paused = true
      })
    import('./scene')
      .then(({ GameScene }) => {
        if (disposed || !viewport.current || !minimap.current || !portrait.current) return
        const created = new GameScene(
          viewport.current,
          minimap.current,
          portrait.current,
          world,
          update,
          (cue, attenuation, pan, finished) => audio.current?.cue(cue, attenuation, pan, finished)
        )
        scene = created
        engine.current = created
        if (world.drawMode === 2) created.overview()
        return created.ready.then(() => {
          if (!disposed && engine.current === created && created.start()) setReady(true)
        })
      })
      .catch(e => {
        if (disposed || scene?.terrainLoad.signal.aborted) return
        scene?.dispose()
        if (engine.current === scene) engine.current = null
        setError(e instanceof Error ? e.message : 'Unable to finish loading the 3D world.')
      })
    return () => {
      disposed = true
      scene?.dispose()
      if (engine.current === scene) engine.current = null
    }
  }, [world, update, store, startup])
  useEffect(() => {
    const modal = startupDialog.current
    if (startup === 'choice' && modal && !modal.open) modal.showModal()
    return () => {
      if (modal?.open) modal.close()
    }
  }, [startup])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        !ready ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        (e.target as HTMLElement).closest('input,dialog')
      )
        return
      if (world.inputMask) {
        if ((e.code === 'Space' || e.key === 'Escape') && world.flyby.flags & 1) {
          e.preventDefault()
          engine.current?.skipIntroduction()
        }
        return
      }
      const s =
        !e.code.startsWith('Numpad') &&
        SPELLS.find(s => s.key === e.key && spellHudVisibility(world, s) === 'visible')
      if (s) {
        store.change(w => {
          w.mode = w.mode === s.id ? null : s.id
        })
        setTab('spells')
      }
      if (e.key === 'Enter' && !(e.target as HTMLElement).closest('button'))
        engine.current?.overview()
      if (e.key === 'Escape') {
        if (store.getWorld().outcome.level === tutorialLevel) {
          e.preventDefault()
          setMenu(true)
          return
        }
        store.change(cancelInteraction)
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
  }, [world, update, store, ready])
  useEffect(() => {
    if (menu) {
      store.change(w => {
        w.paused = true
      })
      dialog.current?.showModal()
    } else if (dialog.current?.open) dialog.current.close()
  }, [menu, world, store])
  useEffect(() => {
    void audio.current?.setPaused(world.paused || document.hidden).catch(() => {
      audio.current?.mute()
      setSound(false)
    })
  }, [world.paused])
  useEffect(() => {
    const refresh = () => {
      if (audio.current?.enabled && engine.current)
        audio.current.environment = engine.current.soundEnvironment()
    }
    refresh()
    const timer = setInterval(refresh, 250)
    return () => clearInterval(timer)
  }, [])
  async function toggleSound() {
    if (sound) {
      audio.current?.mute()
      setSound(false)
    } else {
      setSoundPending(true)
      try {
        if (engine.current && audio.current)
          audio.current.environment = engine.current.soundEnvironment()
        setSound(!!(await audio.current?.enable()))
      } catch {
        audio.current?.mute()
        tell(world, 'Audio could not start. Try the sound button again.')
        update()
      } finally {
        setSoundPending(false)
      }
    }
  }
  function followerControl(kind: UnitKind | 'all') {
    const choose = (event: MouseEvent<HTMLButtonElement>, focus = false) =>
      engine.current?.chooseFollowers(kind === 'all' ? 0 : nativeUnitModel(kind), event, focus)
    return {
      onPointerDown: (event: MouseEvent<HTMLButtonElement>) => {
        followerPress.current = event.button === 0 ? event.currentTarget : null
      },
      onPointerCancel: () => {
        followerPress.current = null
      },
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        if (!event.ctrlKey || !event.detail) choose(event)
      },
      // macOS emits contextmenu instead of click for Ctrl + primary button.
      // Handle its release once; retain native button activation for keyboard users.
      onPointerUp: (event: MouseEvent<HTMLButtonElement>) => {
        if (event.button === 0 && event.ctrlKey && followerPress.current === event.currentTarget) {
          choose(event)
          event.currentTarget.blur()
        }
        followerPress.current = null
      },
      onContextMenu: (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        if (!(event.button === 0 && event.ctrlKey)) choose(event, true)
      },
    }
  }
  function beginLoad(request: LoadRequest) {
    audio.current?.reset()
    setMenu(false)
    setReady(false)
    setError('')
    if (request.kind === 'checkpoint') {
      if (!store.loadCheckpoint()) return
      store.change(w => {
        w.paused = false
      })
    } else if (request.kind === 'restart') store.restart()
    else store.startMission(request.mission)
    loadRequest.current = request
    setTab('spells')
    setStartup('playing')
  }
  function restart() {
    beginLoad({ kind: 'restart' })
  }
  function continueCampaign() {
    beginLoad({ kind: 'continue', mission: world.outcome.level + 1 })
  }
  function startMission(mission: number) {
    beginLoad({ kind: 'mission', mission })
  }
  function exitTutorial() {
    audio.current?.reset()
    setMenu(false)
    setReady(false)
    setError('')
    loadRequest.current = null
    setStartup('choice')
  }
  function loadCheckpoint() {
    beginLoad({ kind: 'checkpoint' })
  }
  function retryLoad() {
    if (loadRequest.current) beginLoad(loadRequest.current)
  }
  async function saveCheckpoint() {
    setCheckpointNotice(
      (await store.saveCheckpoint())
        ? ''
        : 'Checkpoint saved for this session only; browser storage is unavailable.'
    )
  }
  const blue = world.units.filter(u => u.team === 'blue'),
    enemyTribes = missionComputerTribes(world.outcome.level).filter(
      tribe => world.outcome.level !== 6 || tribe !== 1
    ),
    enemies = enemyTribes.map(tribe => {
      const name = ['', 'Dakini', 'Chumara', 'Matak'][tribe]
      return {
        tribe,
        name,
        team: teamForTribe(tribe) as TribeTeam,
        units: world.units.filter(u => u.team === teamForTribe(tribe)),
      }
    })
  const shaman = blue.find(isShaman),
    selected = blue.filter(u => world.selected.includes(u.id))
  const focused =
    SPELLS.find(s => s.id === (hover ?? world.mode)) ??
    BUILDINGS.find(b => b.id === (hover ?? world.mode))
  const modeName =
    SPELLS.find(s => s.id === world.mode)?.name ?? BUILDINGS.find(b => b.id === world.mode)?.name
  function blockLoadingInteraction(event: SyntheticEvent) {
    if (ready || (event.target as Element).closest('.loading-world')) return false
    event.preventDefault()
    event.stopPropagation()
    return true
  }
  const nextMission = missionNumbers.find(mission => mission === world.outcome.level + 1),
    enemyName = enemies.map(enemy => enemy.name).join(' and '),
    objectives =
      world.outcome.level === 1
        ? [
            { text: 'Bridge to the central island', done: world.stats.bridges > 0 },
            { text: 'Discover warrior training', done: world.unlockedCamp },
            { text: 'Defeat the Dakini tribe', done: world.status === 'won' },
          ]
        : world.outcome.level === 2
          ? [
              {
                text: 'Open the way with the Totem Pole',
                done: world.effects.some(effect => !!effect.bridge),
              },
              { text: 'Claim Tornado from the stone head', done: world.giftCounts.tornado > 0 },
              { text: 'Defeat the Matak tribe', done: world.status === 'won' },
            ]
          : world.outcome.level === 3
            ? [
                { text: 'Reach the Chumara Vault', done: world.unlockedTemple },
                {
                  text: 'Build a Temple and train a Preacher',
                  done: blue.some(unit => unit.kind === 'preacher'),
                },
                { text: 'Defeat the Chumara tribe', done: world.status === 'won' },
              ]
            : world.outcome.level === 4
              ? [
                  { text: 'Convert the Wildmen', done: blue.length > 3 },
                  { text: 'Discover the Guard Tower', done: world.unlockedTower },
                  { text: 'Defeat the Matak tribe', done: world.status === 'won' },
                ]
              : world.outcome.level === 5
                ? [
                    {
                      text: 'Claim the Boat from the stone head',
                      done: world.vehicles.some(vehicle => vehicle.active),
                    },
                    {
                      text: 'Board followers onto the Boat',
                      done: world.vehicles.some(vehicle => vehicle.passengers.length > 0),
                    },
                    { text: 'Defeat the Dakini tribe', done: world.status === 'won' },
                  ]
                : world.outcome.level === 6
                  ? [
                      {
                        text: 'Defeat the Chumara tribe',
                        done: !!world.manaTribes[2].defeatTimer,
                      },
                      {
                        text: 'Defeat the Matak tribe',
                        done: !!world.manaTribes[3].defeatTimer,
                      },
                    ]
                  : world.outcome.level === 7
                    ? [
                        { text: 'Convert the Wildmen', done: blue.length > 1 },
                        {
                          text: 'Claim Invisibility from the stone head',
                          done: world.giftCounts.invisibility > 0,
                        },
                        {
                          text: 'Conceal followers with Invisibility',
                          done: blue.some(unit => !!unit.invisibility),
                        },
                      ]
                    : world.outcome.level === 8
                      ? [
                          {
                            text: 'Discover Firewarrior training',
                            done: world.unlockedFirewarriorHut,
                          },
                          {
                            text: 'Train a Firewarrior',
                            done: blue.some(unit => unit.kind === 'firewarrior'),
                          },
                          { text: 'Defeat the Dakini tribe', done: world.status === 'won' },
                        ]
                      : world.outcome.level === 9
                        ? [
                            {
                              text: 'Discover the Boat House',
                              done: world.unlockedBoatHouse,
                            },
                            {
                              text: 'Build the Boat House',
                              done: world.buildings.some(
                                building => building.kind === 'boatHouse' && building.progress === 1
                              ),
                            },
                            {
                              text: 'Send a Brave inside to launch and board a Boat',
                              done: world.vehicles.some(
                                vehicle => vehicle.active && vehicle.passengers.length
                              ),
                            },
                          ]
                        : world.outcome.level === 10
                          ? [
                              {
                                text: 'Board two followers onto the provided Boat',
                                done: world.vehicles.some(
                                  vehicle => vehicle.passengers.length >= 2
                                ),
                              },
                              {
                                text: 'Worship the Totem Pole across the water',
                                done: world.shrines.some(
                                  shrine => shrine.kind === 'linkedEffects' && shrine.uses > 0
                                ),
                              },
                              {
                                text: 'Reach the Totem Pole in the Matak settlement',
                                done: world.shrines.some(
                                  shrine => shrine.name === 'Erosion Totem Pole' && shrine.uses > 0
                                ),
                              },
                            ]
                          : world.outcome.level === 14
                            ? [
                                {
                                  text: 'Claim Angel of Death from the stone head',
                                  done: world.giftCounts.angel > 0,
                                },
                                {
                                  text: 'Claim Earthquake and Land Bridge together',
                                  done:
                                    world.giftCounts.earthquake > 0 && world.giftCounts.bridge > 0,
                                },
                                {
                                  text: 'Cast Angel of Death',
                                  done: world.effects.some(effect => !!effect.angel),
                                },
                              ]
                            : world.outcome.level === 20
                              ? [
                                  {
                                    text: 'Claim Land Bridge and reveal the next stone head',
                                    done: world.giftCounts.bridge > 0,
                                  },
                                  {
                                    text: 'Claim Flatten and Firestorm along the linked path',
                                    done:
                                      world.giftCounts.flatten > 0 &&
                                      world.giftCounts.firestorm > 0,
                                  },
                                  {
                                    text: 'Reach the final stone head and claim Volcano',
                                    done: world.giftCounts.volcano > 0,
                                  },
                                ]
                              : world.outcome.level === 21
                                ? [
                                    {
                                      text: 'Convert Wildmen and send three followers to seal the first fault',
                                      done:
                                        world.campaignAIs[1]?.variables[22] === 2 &&
                                        world.campaignAIs[1]?.variables[28] === 1,
                                    },
                                  ]
                                : world.outcome.level === 22
                                  ? [
                                      {
                                        text: 'Use Land Bridge to claim the southern mana gift',
                                        done: world.shrines.some(
                                          shrine =>
                                            shrine.kind === 'mana' &&
                                            shrine.rewardMana === 600_000 &&
                                            shrine.uses > 0
                                        ),
                                      },
                                      {
                                        text: 'Steal the enemy Boat and Balloon',
                                        done: [1, 3].every(model =>
                                          world.vehicles.some(
                                            vehicle =>
                                              vehicle.model === model && vehicle.team === 'blue'
                                          )
                                        ),
                                      },
                                      {
                                        text: 'Fly north and claim the final mana gift',
                                        done: world.shrines.some(
                                          shrine =>
                                            shrine.kind === 'mana' &&
                                            shrine.rewardMana === 1_000_000 &&
                                            shrine.uses > 0
                                        ),
                                      },
                                    ]
                                  : []
  return (
    <main
      ref={shell}
      className="game-shell"
      onPointerDownCapture={blockLoadingInteraction}
      onPointerUpCapture={blockLoadingInteraction}
      onContextMenuCapture={blockLoadingInteraction}
      onClickCapture={e => {
        if (blockLoadingInteraction(e)) return
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
      {ready && routeNotice && (
        <div
          key={routeNotice.serial}
          className="world-message route-notice"
          role="status"
          onAnimationEnd={() =>
            store.change(w => {
              if (w.routeNotice?.serial === routeNotice.serial) w.routeNotice = null
            })
          }
        >
          <span>✧</span>
          {ROUTE_FAILURE_TEXT}
        </div>
      )}
      {ready && !routeNotice && world.messageUntil > world.time && (
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
          .map(({ message, slot }) => {
            const top = messageScreenY(message!.position, messageViewportHeight),
              height = messageScreenY(message!.height, messageViewportHeight)
            return (
              <details
                key={message!.serial}
                data-message-serial={message!.serial}
                ref={element => {
                  if (element) messageDetails.current.set(message!.serial, element)
                  else messageDetails.current.delete(message!.serial)
                }}
                data-lower={top > Math.trunc(messageViewportHeight / 2) || undefined}
                style={
                  {
                    '--message-height': `${height}px`,
                    top: `${top}px`,
                  } as CSSProperties
                }
              >
                <summary
                  aria-label="Read campaign message"
                  onClick={event => {
                    const target = messageViewPoint(message!),
                      details = event.currentTarget.parentElement as HTMLDetailsElement
                    if (!details.open && target) engine.current?.focus(target, { animate: true })
                  }}
                >
                  <img src={messageIcon(message!)} alt="" />
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
            )
          })}
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
            width={100}
            height={96}
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
              select(world, 'shaman')
              audio.current?.cue(0x18)
              update()
              engine.current?.focus(shaman ?? HOME, { animate: true })
            }}
          >
            <canvas ref={portrait} width={100} height={480} aria-hidden="true" />
          </button>
          <button
            className="help-button"
            aria-label="Menu"
            title="Help and game menu"
            onClick={() => setMenu(true)}
          >
            ?
          </button>
          <ShamanHealth health={shaman?.hp ?? 0} maximum={maxHp('shaman')} />
          {enemies.map(enemy => (
            <button
              key={enemy.tribe}
              className={`tribe-flag ${enemy.name.toLowerCase()}`}
              title={`${enemy.name}: ${enemy.units.filter(u => !u.ghost).length} followers`}
              aria-label={`Focus ${enemy.name} tribe`}
              onClick={() => {
                const u = enemy.units.find(isShaman) ?? enemy.units[0]
                if (u) engine.current?.focus(u, { animate: true })
              }}
            />
          ))}
        </div>
        <section className="tribe-classes" aria-label="Followers">
          <button
            className="population-button"
            aria-label="Select follower"
            title="Select follower · Shift: all · Ctrl: five · Right-click: focus next"
            {...followerControl('all')}
          >
            <PopulationMeter
              population={population(world, 'blue')}
              capacity={populationLimit(world, 'blue')}
            />
            <FollowerNumber count={population(world, 'blue') - 1} total />
          </button>
          {(
            [
              { kind: 'brave', label: 'Braves', sprite: 666 },
              { kind: 'warrior', label: 'Warriors', sprite: 668 },
              { kind: 'preacher', label: 'Preachers', sprite: 670 },
              { kind: 'firewarrior', label: 'Firewarriors', sprite: 672 },
              { kind: 'spy', label: 'Spies', sprite: 674 },
            ] as const
          ).map(u => (
            <button
              key={u.kind}
              aria-label={`Select ${u.kind}`}
              title={`${u.label} · Shift: all · Ctrl: five · Right-click: focus next`}
              aria-pressed={selected.length > 0 && selected.every(s => s.kind === u.kind)}
              {...followerControl(u.kind)}
            >
              <FollowerIcon sprite={u.sprite} />
              <FollowerNumber
                count={blue.filter(b => b.hp > 0 && !b.ghost && b.kind === u.kind).length}
              />
            </button>
          ))}
        </section>
        <ManaMeter tribe={world.manaTribes[0]} world={world.manaWorld} />
        <section className="command-dock" aria-label="Command panel">
          {tab === 'spells' && (
            <div className="spell-list">
              {spellRoster
                .toSorted(
                  (a, b) =>
                    spellOrder.indexOf(a.spell.model) - spellOrder.indexOf(b.spell.model)
                )
                .map(({ spell: s, visibility }) => {
                  const player = world.manaWorld.playerTribe,
                    owner = world.manaTribes[player]?.spellOwner ?? player,
                    permanent = !!(
                      world.manaWorld.spells[owner]?.available &
                      (1 << s.model)
                    ),
                    undiscovered = visibility === 'undiscovered',
                    interactive = visibility === 'visible',
                    view = spellHudButton(visibility, {
                      model: s.model,
                      permanent,
                      charging:
                        permanent &&
                        !(world.manaWorld.spells[player].disabled & (1 << (s.model - 1))),
                      hovered: !undiscovered && hover === s.id,
                      selected: interactive && world.mode === s.id,
                      stock: world.shots[s.id],
                      gifts: world.giftCounts[s.id],
                      progress: world.manaTribes[player].spellProgress[s.model],
                    })
                  return (
                    <button
                      key={s.id}
                      className="spell-card"
                      style={{
                        borderImageSource: `url('/original/hud-${view.frame}.png')`,
                        cursor: undiscovered ? 'default' : undefined,
                      }}
                      aria-label={
                        undiscovered ? 'Undiscovered spell' : `${s.name}, ${world.shots[s.id]} shots`
                      }
                      aria-disabled={visibility !== 'visible'}
                      aria-pressed={interactive && world.mode === s.id}
                      title={
                        undiscovered
                          ? 'Undiscovered spell'
                          : `${s.name}${permanent ? ' · Right-click to pause or resume charging' : ''}`
                      }
                      onClick={() => {
                        if (!interactive) return
                        store.change(w => {
                          w.mode = w.mode === s.id ? null : s.id
                        })
                      }}
                      onContextMenu={e => {
                        e.preventDefault()
                        if (undiscovered) return
                        if (permanent)
                          store.change(w => {
                            const bit = 1 << (s.model - 1)
                            w.manaWorld.spells[player].disabled ^= bit
                            if (s.id === 'blast')
                              w.charging = !(w.manaWorld.spells[player].disabled & bit)
                          })
                      }}
                      onMouseEnter={() => {
                        if (!undiscovered) setHover(s.id)
                      }}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => {
                        if (!undiscovered) setHover(s.id)
                      }}
                      onBlur={() => setHover(null)}
                    >
                      <SpellButtonArt view={view} />
                    </button>
                  )
                })}
            </div>
          )}
          {tab === 'buildings' && (
            <div className="building-list">
              {BUILDINGS.map(b => (
                <button
                  key={b.id}
                  disabled={
                    (b.id === 'camp' && !world.unlockedCamp) ||
                    (b.id === 'tower' && !world.unlockedTower) ||
                    (b.id === 'temple' && !world.unlockedTemple) ||
                    (b.id === 'spyHut' && !world.unlockedSpyHut) ||
                    (b.id === 'firewarriorHut' && !world.unlockedFirewarriorHut) ||
                    (b.id === 'boatHouse' && !world.unlockedBoatHouse) ||
                    (b.id === 'balloonHut' && !world.unlockedBalloonHut)
                  }
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
                  <HudSprite
                    id={b.id === 'hut' ? 1028 : b.id === 'tower' || b.id === 'temple' ? 1029 : 1030}
                  />
                </button>
              ))}
            </div>
          )}
          {tab === 'followers' && selected.some(u => u.kind === 'spy') && (
            <div className="follower-list">
              {enemies.map(enemy => (
                <button
                  key={`disguise-${enemy.tribe}`}
                  aria-label={`Disguise selected spies as ${enemy.name}`}
                  title={`Disguise selected spies as ${enemy.name}`}
                  onClick={() =>
                    store.change(w => {
                      disguiseSelectedSpies(w, enemy.tribe)
                    })
                  }
                >
                  {enemy.name}
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
            disabled={soundPending}
            aria-busy={soundPending}
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

      {startup === 'choice' && (
        <dialog ref={startupDialog} className="loading-world" aria-label="Start game">
          <span className="loading-rune">⟡</span>
          <p className="eyebrow">Populous: The Beginning</p>
          <h2>Select Level</h2>
          <p>Choose a mission{store.hasCheckpoint() ? ' or return to your saved world.' : '.'}</p>
          {!!completedMissions.length && recommendedMission && (
            <p role="status">Mission {recommendedMission} is recommended next.</p>
          )}
          <button
            className="secondary-button"
            aria-label="Tutorial"
            onClick={() => startMission(tutorialLevel)}
          >
            Tutorial
          </button>
          <div className="menu-actions" aria-label="Choose mission">
            {store.hasCheckpoint() && (
              <button
                autoFocus
                className="primary-button"
                aria-label="Load Game"
                onClick={loadCheckpoint}
              >
                Load Game <span>↗</span>
              </button>
            )}
            {missionNumbers.map(mission => (
              <button
                key={mission}
                autoFocus={!store.hasCheckpoint() && mission === missionNumbers[0]}
                className="secondary-button"
                aria-label={`Mission ${mission}${completedMissions.includes(mission) ? ', completed' : ''}`}
                onClick={() => startMission(mission)}
              >
                Mission {mission}
                {completedMissions.includes(mission) && <span aria-hidden="true"> ✓</span>}
              </button>
            ))}
          </div>
        </dialog>
      )}
      {startup === 'loading' && (
        <div className="loading-world" role="status">
          <span className="loading-rune">⟡</span>
          <h2>Loading...</h2>
          <p>Looking for your last saved world.</p>
        </div>
      )}
      {startup === 'playing' && (!ready || error) && (
        <div className={error ? 'loading-world' : 'loading-world loading-world-original'} role="status">
          {error ? (
            <>
              <span className="loading-rune">⟡</span>
              <h2>Loading failed</h2>
              <p>The battlefield did not finish loading. Retry the same request when you are ready.</p>
              <details>
                <summary>Technical details</summary>
                {error}
              </details>
              <button className="primary-button" onClick={retryLoad}>
                Try again
              </button>
            </>
          ) : (
            <div className="loading-original-art">
              <span className="loading-original-label">Loading...</span>
              <img src="/original/loading-mask.png" width={130} height={161} alt="" />
            </div>
          )}
        </div>
      )}
      {world.status !== 'playing' && !world.outcome.cameraPlaying && (
        <div className="end-screen">
          <span className="end-rune">{world.status === 'won' ? '✺' : '◈'}</span>
          <p className="eyebrow">
            {world.status === 'won' ? 'Level Complete' : 'Level Failed'}
          </p>
          <h2>{world.status === 'won' ? 'Level Won' : 'Level Lost'}</h2>
          <p>
            {world.status === 'won'
              ? `The ${enemyName} are defeated.`
              : 'You have failed to conquer this world.'}
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
          <button
            className="primary-button"
            onClick={world.status === 'won' && nextMission ? continueCampaign : restart}
          >
            {world.status === 'won' && nextMission
              ? `Continue to Mission ${nextMission}`
              : 'Restart Level'}{' '}
            <span>↗</span>
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
        <span className="eyebrow">Populous: The Beginning</span>
        <h2>Game settings</h2>
        <p>
          {world.outcome.level === tutorialLevel
            ? 'Leave the World View with Return, then learn to move and rotate the camera.'
            : world.outcome.level === 1
              ? 'Worship for Land Bridge, discover warrior training, then defeat every Dakini follower.'
              : world.outcome.level === 2
                ? 'Open the way with the Totem Pole, claim Tornado, then defeat every Matak follower.'
                : world.outcome.level === 3
                  ? 'Use Swarm against the Chumara, steal Temple knowledge, then train preachers to turn their followers.'
                  : world.outcome.level === 4
                    ? 'Convert Wildmen, discover the Guard Tower, claim Lightning, then defeat the Matak.'
                    : world.outcome.level === 5
                      ? 'Claim the Boat from the stone head, board your followers, cross the water, then defeat the Dakini.'
                      : world.outcome.level === 6
                        ? 'Establish your settlement, then defeat both the Chumara and Matak tribes.'
                        : world.outcome.level === 7
                          ? 'Convert Wildmen, claim Invisibility from the stone head, then conceal followers before engaging the Chumara.'
                          : world.outcome.level === 8
                            ? 'Claim Firewarrior training from the Vault, build the school, then train ranged defenders against the Dakini.'
                            : world.outcome.level === 9
                              ? 'Claim Boat House knowledge from the Vault, build at the shore, then send a Brave inside to build and board a Boat.'
                              : world.outcome.level === 10
                                ? 'Board two followers onto the provided Boat, cross the water, and worship the Totem Pole before the island sinks.'
                                : world.outcome.level === 11
                                  ? 'Explore the Hypnotise, Swamp, and Flatten knowledge sites before facing the Chumara and Matak tribes.'
                                  : world.outcome.level === 12
                                    ? 'Prepare for all three Enemy tribes and seek Tornado, Spy Training, and Erosion knowledge.'
                                    : world.outcome.level === 13
                                      ? 'Seek Balloon Hut, Firestorm, Shield, Volcano, and Earthquake knowledge before facing the Chumara and Matak tribes.'
                                      : world.outcome.level === 14
                                        ? 'Worship the stone heads to claim Angel of Death, Earthquake, and Land Bridge before facing all three Enemy tribes.'
                                        : world.outcome.level === 15
                                          ? 'Free your imprisoned Shaman before the Dakini timer expires.'
                                          : world.outcome.level === 16
                                            ? 'Claim Bloodlust, cast it on your followers, and use their fighting frenzy against every enemy tribe.'
                                            : world.outcome.level === 17
                                              ? 'Claim Armageddon and survive the final arena battle against every tribe.'
                                              : world.outcome.level === 20
                                                ? 'Create new land for war by following the linked stone heads through Land Bridge, Flatten, Firestorm, and Volcano.'
                                                : world.outcome.level === 21
                                                  ? 'Focus mana on Convert Wild, then send three followers to the fault’s Flatten totem before it erupts.'
                                                  : world.outcome.level === 22
                                                    ? 'Restore your magic at the southern stone head, cross the water alone, and steal enemy transport to reach the other tribes.'
                                                    : "Prepare for the enemy tribes' powerful magic and seek Armageddon."}
        </p>
        <div className="menu-actions">
          <button className="primary-button" onClick={() => setMenu(false)}>
            Continue Game <span>↗</span>
          </button>
          {world.outcome.level === tutorialLevel ? (
            <button className="secondary-button" onClick={exitTutorial}>
              Quit to Main Menu
            </button>
          ) : (
            <>
              <button className="secondary-button" onClick={() => void saveCheckpoint()}>
                Save checkpoint
              </button>
              <button
                className="secondary-button"
                disabled={!store.hasCheckpoint()}
                onClick={loadCheckpoint}
              >
                Load checkpoint
              </button>
            </>
          )}
          <button className="secondary-button" onClick={restart}>
            Restart world
          </button>
        </div>
        {checkpointNotice && <p role="status">{checkpointNotice}</p>}
        {objectives.length > 0 && (
          <details className="menu-objectives">
            <summary>
              Objectives · {objectives.filter(o => o.done).length} / {objectives.length}
            </summary>
            <ul>
              {objectives.map(o => (
                <li key={o.text}>
                  {o.done ? '✓ ' : ''}
                  {o.text}
                </li>
              ))}
            </ul>
          </details>
        )}
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
          <button onClick={() => engine.current?.zoom(true)}>Zoom in</button>
          <button onClick={() => engine.current?.zoom(false)}>Zoom out</button>
          <button onClick={() => engine.current?.focus(shaman ?? HOME, { animate: true })}>
            Focus settlement
          </button>
        </div>
        <label className="hud-settings">
          HUD size
          <select
            aria-label="HUD size"
            value={hudSize}
            onChange={e => {
              setHudSize(e.target.value)
              try {
                localStorage.setItem('hud-size', e.target.value)
              } catch {
                // Keep the session preference when storage is unavailable.
              }
            }}
          >
            <option value="auto">Automatic</option>
            {[1, 1.5, 2, 2.5, 3, 4].map(size => (
              <option key={size} value={size}>
                {size * 100}%
              </option>
            ))}
          </select>
          <span>Fits your window without stretching.</span>
        </label>
        <h3>Your powers, at a glance</h3>
        <div className="help-grid">
          <span>Click</span>
          <strong>Select a follower or give a move / attack order</strong>
          <span>Right-click / Escape</span>
          <strong>Cancel targeting, then deselect followers · Orders keep running</strong>
          <span>Drag on land</span>
          <strong>Select a group · Ctrl adds to selection</strong>
          <span>Shift Z / X / C / V · Z / X / C / V</span>
          <strong>Set camera bookmarks · Recall them</strong>
          <span>Ctrl-click / Shift-click</span>
          <strong>Toggle a follower / Give an order through friendly followers</strong>
          <span>HUD follower buttons</span>
          <strong>
            Click adds one · Ctrl adds five · Shift adds all · Right-click focuses next
          </strong>
          <span>Right / middle drag</span>
          <strong>Right drag turns the view · middle drag moves it</strong>
          <span>Scroll · = / −</span>
          <strong>Switch view · WASD to move · Q / E to turn</strong>
          <span>↑ / ↓ · ← / →</span>
          <strong>Move forward / back · Rotate left / right</strong>
          <span>Ctrl + ← / → · Shift</span>
          <strong>Pan sideways · Hold Shift for fast panning</strong>
          <span>Screen edges</span>
          <strong>Move the pointer to an outer edge to scroll</strong>
          <span>1–3 / B</span>
          <strong>Choose a spell / open buildings</strong>
          <span>Space with a building plan</span>
          <strong>Rotate the entrance before placing</strong>
          <span>H / F / G / Space / Esc</span>
          <strong>Shaman / focus / guard shaman / pause / cancel</strong>
        </div>
        <p className="help-tip">
          Each spell shows its own casting range. Right-click a rechargeable spell to pause or
          resume it and focus mana elsewhere. Worship the southern head for Land Bridge (four held
          at once), and the central head for four Lightning gifts. Only your shaman can learn at the
          vault. Select braves and click a friendly hut to house them, or a completed training hut
          to train them. Builders carry logs from trees. Followers drown in water; Blast can knock
          them off a shore.
        </p>
        <div className="audio-settings">
          <button
            className="secondary-button"
            onClick={toggleSound}
            disabled={soundPending}
            aria-busy={soundPending}
          >
            {sound ? '♪ Sound on' : '♫ Enable sound'}
          </button>
          <label>
            Master volume{' '}
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={volume}
              onChange={e =>
                changeAudioPreferences({ ...audioPreferences, volume: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Music volume{' '}
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={musicVolume}
              onChange={e =>
                changeAudioPreferences({ ...audioPreferences, musicVolume: Number(e.target.value) })
              }
            />
          </label>
        </div>
        {audioStorageNotice && <p role="status">{audioStorageNotice}</p>}
        <details className="reference-details">
          <summary>About this recreation & references</summary>
          <p>
            Level 1: The Journey Begins. Terrain, starting objects and shrine timings were read from
            the supplied original level file. Building and tree meshes, texture coordinates, layered
            unit animations, HUD artwork and landscape bank c were decoded from the supplied game
            archive. The browser renderer approximates the original lighting, terrain displacement
            and water animation. Selection voices, spell cues and combat sounds use the original
            recordings. Original music and percussion now play alongside environmental sounds; exact
            world mixing, activity ownership and the complete native sound scheduler are still being
            reconstructed. Village growth and mana use rules traced from the executable. Combat
            state selection, pathfinding and defensive AI still differ from the original.
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
