'use client'

import { BuildingIcon } from './building-icon'

import { FullscreenControl } from './fullscreen-control'
import { OriginalOptions } from './original-options'
import { BrowserHelpTips } from './browser-help-tips'
import { prepareFrontendAssets, type FrontendAssets } from './frontend-assets'
import { OriginalLoadingScreen } from './original-loading-screen'
import { StartupLogo } from './startup-logo'

import { hudScale } from './hud-layout.ts'
import { OriginalResultScreen } from './original-result-screen'
import { flushSync } from 'react-dom'
import type { WorshipAcquisitionGeometry, WorshipTargetModel } from './worship-acquisition.ts'
import type { WorshipHudGeometry } from './worship-acquisition-layout.ts'

import { MinimapFrame } from './minimap-frame-view'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
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
} from './model'
import { createGameStore } from './game-store'
import { WorldSelector } from './world-selector'
import { OriginalMainMenu } from './original-main-menu'
import { OriginalPauseMenu } from './original-pause-menu'
import { SpellTestMenu } from './spell-test-menu'
import { CHEAT_SAVE_NOTICE, spellTestShortcut } from './spell-test-cheats'
import worldSelectorStyles from './world-selector.module.css'
import type { GameScene } from './scene'
import { Soundscape } from './audio'
import {
  DEFAULT_AUDIO_PREFERENCES,
  readAudioPreferences,
  saveAudioPreferences,
  type AudioPreferences,
} from './audio-preferences'
import {
  DEFAULT_GAME_PREFERENCES,
  readGamePreferences,
  saveGamePreferences,
  type GamePreferences,
} from './game-preferences'
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
import { followerClassControls } from './hud-population'
import { FollowerTasks } from './follower-tasks-view'
import { hudTaskPeople } from './follower-tasks-runtime'
import { followerTaskCounts, type FollowerTask } from './hud-tasks'
import type { TransportKind } from './hud-transports'
import { hudTransports } from './follower-transports-runtime'
import { createTooltipSession } from './tooltip-controller'
import {
  spellHudButton,
  spellHudRoster,
  spellHudVisibility,
  spellHudCanCharge,
  spellHudPermanent,
} from './spell-visibility'
import { nativeUnitModel } from './unit-kinds'
import { missionComputerTribes, missionNumbers, tutorialLevel } from './mission-data'
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
  const completedMissions = store.getCompletedMissions()
  const spellRoster = spellHudRoster(world)
  const { routeNotice } = world
  const [tab, setTab] = useState<'spells' | 'buildings' | 'followers'>('spells')
  const [sound, setSound] = useState(false)
  const [audioPreferences, setAudioPreferences] =
    useState<AudioPreferences>(DEFAULT_AUDIO_PREFERENCES)
  const [audioStorageNotice, setAudioStorageNotice] = useState('')
  const [audioStartNotice, setAudioStartNotice] = useState('')
  const { volume, musicVolume } = audioPreferences
  const [gamePreferences, setGamePreferences] = useState<GamePreferences>(DEFAULT_GAME_PREFERENCES)
  const gamePreferencesRef = useRef(gamePreferences)
  const [gameStorageNotice, setGameStorageNotice] = useState('')
  const [soundPending, setSoundPending] = useState(false)
  const [hudSize, setHudSize] = useState('auto')
  const [hudCamera, setHudCamera] = useState({ x: 0, y: 0 })
  const [nearbyPressed, setNearbyPressed] = useState(false)
  const [messageViewportHeight, setMessageViewportHeight] = useState(480)
  const frontendPreparation = useRef<Promise<FrontendAssets> | null>(null)
  const [frontendAssets, setFrontendAssets] = useState<FrontendAssets | null>(null)
  const [startup, setStartup] = useState<'loading' | 'choice' | 'playing'>('loading')
  const [startupLogoDone, setStartupLogoDone] = useState(false)
  const finishStartupLogo = useCallback(() => setStartupLogoDone(true), [])
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
  const [cheatsOpen, setCheatsOpen] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [startupCampaign, setStartupCampaign] = useState(false)
  const [ready, setReady] = useState(false)
  const [desktopNotice, setDesktopNotice] = useState(true)
  const [error, setError] = useState('')
  const shell = useRef<HTMLElement>(null)
  const hudPanel = useRef<HTMLElement>(null)
  const spellButtons = useRef(new Map<number, HTMLButtonElement>())
  const campButton = useRef<HTMLButtonElement>(null),
    templeButton = useRef<HTMLButtonElement>(null)
  const buildingButtonRefs = new Map([
    ['camp', campButton],
    ['temple', templeButton],
  ])
  const followerPress = useRef<EventTarget | null>(null)
  const nearbyPress = useRef<{
    scene: GameScene
    pointer?: number
    key?: string
  } | null>(null)
  const loadRequest = useRef<LoadRequest | null>(null)
  const messageDetails = useRef(new Map<number, HTMLDetailsElement>())
  useEffect(() => {
    const resize = () => {
      // Scale artwork uniformly; extra screen height extends only the panel background.
      shell.current?.style.setProperty(
        '--hud-scale',
        String(hudScale(window.innerWidth, window.innerHeight, hudSize))
      )

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
    startupDialog = useRef<HTMLDialogElement>(null)
  const tooltipSession = useRef(createTooltipSession())
  const engine = useRef<GameScene | null>(null),
    audio = useRef<Soundscape | null>(null)
  const clearNearbyPress = useCallback(() => {
    nearbyPress.current = null
    setNearbyPressed(false)
  }, [])
  const cancelNearbyInput = useCallback(() => {
    clearNearbyPress()
    engine.current?.cancelNearbyFollowers()
  }, [clearNearbyPress])
  const pendingMenuCamera = useRef<((scene: GameScene) => void)[]>([])
  // Native 00458060 captures prior pause; only the same world may restore it.
  const menuSession = useRef<{ world: typeof world; paused: boolean } | null>(null)
  const openMenu = useCallback(() => {
    cancelNearbyInput()
    if (engine.current) engine.current.nearbyFollowersHudActive = false
    if (!menuSession.current) {
      const current = store.getWorld()
      pendingMenuCamera.current = []
      menuSession.current = { world: current, paused: current.paused }
      engine.current?.setModalSuspended(true)
      store.change(w => {
        w.paused = true
      })
    }
    setMenu(true)
  }, [cancelNearbyInput, store, setMenu])
  function closeMenu() {
    const session = menuSession.current
    menuSession.current = null
    setMenu(false)
    if (session?.world === store.getWorld()) {
      store.change(w => {
        w.paused = session.paused
      })
      if (engine.current?.world === session.world) {
        engine.current.setModalSuspended(false)
        for (const action of pendingMenuCamera.current) action(engine.current)
      }
    }
    pendingMenuCamera.current = []
  }
  function openSelector() {
    cancelNearbyInput()
    if (engine.current) engine.current.nearbyFollowersHudActive = false
    setSelectorOpen(true)
  }
  useEffect(() => {
    const scene = engine.current
    if (!scene) return
    scene.onNearbyFollowersCancel = () => {
      if (nearbyPress.current && nearbyPress.current.scene !== scene) return
      nearbyPress.current = null
      setNearbyPressed(false)
    }
    scene.nearbyFollowersHudActive =
      ready &&
      startup === 'playing' &&
      !menu &&
      !cheatsOpen &&
      !selectorOpen &&
      scene.world === world
    if (!scene.nearbyFollowersHudActive) scene.cancelNearbyFollowers()
    return () => {
      scene.nearbyFollowersHudActive = false
      scene.cancelNearbyFollowers()
      scene.onNearbyFollowersCancel = undefined
    }
  }, [world, ready, startup, menu, cheatsOpen, selectorOpen])
  useEffect(() => {
    const cancel = () => {
      nearbyPress.current = null
      setNearbyPressed(false)
      engine.current?.cancelNearbyFollowers()
    }
    const hidden = () => {
      if (document.hidden) cancel()
    }
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      nearbyPress.current = null
      setNearbyPressed(false)
    }
    globalThis.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', hidden)
    globalThis.addEventListener('keydown', escape)
    return () => {
      globalThis.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', hidden)
      globalThis.removeEventListener('keydown', escape)
      cancel()
    }
  }, [])
  const measureWorshipHud = useCallback(
    (
      model: WorshipTargetModel,
      fallback?: WorshipAcquisitionGeometry
    ): WorshipHudGeometry | null => {
      let button: HTMLButtonElement | null | undefined = spellButtons.current.get(model)
      if (model === 7) button = campButton.current
      else if (model === 5) button = templeButton.current
      const root = shell.current,
        panel = hudPanel.current,
        view = viewport.current
      if (!root?.isConnected || !panel?.isConnected || !view?.isConnected) return null
      const shellRect = root.getBoundingClientRect(),
        panelRect = panel.getBoundingClientRect(),
        viewRect = view.getBoundingClientRect(),
        scale = panelRect.width / panel.offsetWidth,
        rectangle = button?.isConnected ? button.getBoundingClientRect() : null,
        targetHud =
          rectangle?.width && rectangle.height
            ? {
                x: (rectangle.x + rectangle.width / 2 - panelRect.x) / scale,
                y: (rectangle.y + rectangle.height / 2 - panelRect.y) / scale,
              }
            : fallback?.targetHud
      if (
        !targetHud ||
        !Number.isFinite(scale) ||
        scale <= 0 ||
        viewRect.width / scale < 16 ||
        viewRect.height <= 0
      )
        return null
      const targetRect =
          rectangle?.width && rectangle.height
            ? {
                x: rectangle.x - shellRect.x,
                y: rectangle.y - shellRect.y,
                width: rectangle.width,
                height: rectangle.height,
              }
            : {
                x:
                  panelRect.x -
                  shellRect.x +
                  (targetHud.x - fallback!.targetRect.width / 2) * scale,
                y:
                  panelRect.y -
                  shellRect.y +
                  (targetHud.y - fallback!.targetRect.height / 2) * scale,
                width: fallback!.targetRect.width * scale,
                height: fallback!.targetRect.height * scale,
              },
        geometry = {
          shell: { x: 0, y: 0, width: shellRect.width, height: shellRect.height },
          viewport: {
            x: viewRect.x - shellRect.x,
            y: viewRect.y - shellRect.y,
            width: viewRect.width,
            height: viewRect.height,
          },
          targetRect,
          targetHud,
          hudScale: scale,
        }
      return [
        ...Object.values(geometry.viewport),
        ...Object.values(targetRect),
        targetHud.x,
        targetHud.y,
      ].every(Number.isFinite)
        ? geometry
        : null
    },
    []
  )
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
  function changeGamePreferences(next: GamePreferences) {
    gamePreferencesRef.current = next
    setGamePreferences(next)
    if (engine.current) engine.current.gamePreferences = next
    setGameStorageNotice(
      saveGamePreferences(next)
        ? ''
        : 'Game settings apply for this session; browser storage is unavailable.'
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
    const initialWorld = store.getWorld()
    frontendPreparation.current ??= prepareFrontendAssets()
    void Promise.all([store.restoreCheckpoint(), frontendPreparation.current]).then(
      ([, assets]) => {
        if (!active || store.getWorld() !== initialWorld) return
        const preferences = readAudioPreferences()
        setAudioPreferences(preferences)
        audio.current?.setVolume(preferences.volume)
        audio.current?.setMusicVolume(preferences.musicVolume)
        const game = readGamePreferences()
        gamePreferencesRef.current = game
        setGamePreferences(game)
        setFrontendAssets(assets)
        setStartup('choice')
      }
    )
    return () => {
      active = false
    }
  }, [store])
  useEffect(() => {
    if (startup !== 'playing') return
    let disposed = false,
      scene: GameScene | null = null
    const selectAcquisitionPanel = (model: WorshipTargetModel) => {
      if (disposed || store.getWorld() !== world) return null
      // The scene task owns this synchronous commit; React does not call it
      // during render. Automatic native selection preserves spell/build mode.
      flushSync(() => {
        setTab(model === 7 || model === 5 ? 'buildings' : 'spells')
        setHover(null)
        update()
      })
      return measureWorshipHud(model)
    }
    if (window.innerWidth < 900)
      store.change(w => {
        w.paused = true
      })
    import('./scene')
      .then(({ GameScene }) => {
        if (
          disposed ||
          store.getWorld() !== world ||
          !viewport.current ||
          !minimap.current ||
          !portrait.current
        )
          return
        const created = new GameScene(
          viewport.current,
          minimap.current,
          portrait.current,
          world,
          () => {
            if (disposed) return
            if (scene) {
              const { x, y } = scene.cameraPosition
              setHudCamera(previous => (previous.x === x && previous.y === y ? previous : { x, y }))
            }
            update()
          },
          (cue, attenuation, pan, finished) => audio.current?.cue(cue, attenuation, pan, finished),
          { select: selectAcquisitionPanel, measure: measureWorshipHud },
          store.bindPresentation(world),
          tooltipSession.current
        )
        // Import and terrain startup can outlive a setting change. Use the
        // latest page-owned choices without recreating the scene on each toggle.
        created.gamePreferences = gamePreferencesRef.current
        scene = created
        engine.current = created
        setHudCamera({ x: created.cameraPosition.x, y: created.cameraPosition.y })
        if (world.drawMode === 2) created.overview()
        return created.ready.then(() => {
          if (
            !disposed &&
            store.getWorld() === world &&
            engine.current === created &&
            created.start()
          )
            setReady(true)
        })
      })
      .catch(e => {
        if (disposed || store.getWorld() !== world || scene?.terrainLoad.signal.aborted) return
        scene?.dispose()
        if (engine.current === scene) engine.current = null
        setError(e instanceof Error ? e.message : 'Unable to finish loading the 3D world.')
      })
    return () => {
      disposed = true
      scene?.dispose()
      if (engine.current === scene) engine.current = null
    }
  }, [world, update, store, startup, measureWorshipHud])
  useEffect(() => {
    const modal = startupDialog.current
    if (((startup === 'choice' && startupCampaign) || selectorOpen) && modal && !modal.open) {
      if (selectorOpen)
        store.change(w => {
          w.paused = true
        })
      modal.showModal()
    }
    return () => {
      if (modal?.open) modal.close()
    }
  }, [startup, startupCampaign, selectorOpen, store])
  useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if (!ready || startup !== 'playing' || menu || selectorOpen || world.status !== 'playing')
        return
      if (!spellTestShortcut(event, cheatsOpen)) return
      event.preventDefault()
      event.stopImmediatePropagation()
      if (!cheatsOpen) cancelNearbyInput()
      setCheatsOpen(open => !open)
    }
    globalThis.addEventListener('keydown', toggle, true)
    return () => globalThis.removeEventListener('keydown', toggle, true)
  }, [ready, startup, menu, selectorOpen, world, cheatsOpen, cancelNearbyInput])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        !ready ||
        menu ||
        cheatsOpen ||
        (e.key === 'Escape' && e.repeat) ||
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
      if (s && !e.repeat) {
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
          openMenu()
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
  }, [world, update, store, ready, openMenu, menu, cheatsOpen])
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
    setAudioStartNotice('')
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
        setAudioStartNotice('Audio could not start. Try the sound button again.')
        tell(world, 'Audio could not start. Try the sound button again.')
        update()
      } finally {
        setSoundPending(false)
      }
    }
  }
  function followerControl(model: number, category?: FollowerTask, vehicle?: TransportKind) {
    const choose = (event: MouseEvent<HTMLButtonElement>, focus = false) => {
      if (event.currentTarget.disabled) return
      if (vehicle) engine.current?.chooseTransport(vehicle, model, event, focus)
      else engine.current?.chooseFollowers(model, event, focus, category)
    }
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
  function currentNearbyScene() {
    const scene = engine.current
    return ready &&
      startup === 'playing' &&
      !menu &&
      !selectorOpen &&
      scene?.world === world &&
      scene.canRequestNearbyFollowers()
      ? scene
      : null
  }
  function releaseNearbyPress(scene: GameScene | undefined) {
    clearNearbyPress()
    if (scene && scene === currentNearbyScene()) scene.requestNearbyFollowers()
  }
  const nearbyControl = {
    disabled:
      !ready ||
      startup !== 'playing' ||
      menu ||
      selectorOpen ||
      !!world.inputMask ||
      !!(world.manaWorld.gameFlags & 32),
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      const scene = currentNearbyScene()
      if (event.button !== 0 || !scene || event.currentTarget.disabled) return
      nearbyPress.current = { scene, pointer: event.pointerId }
      setNearbyPressed(true)
    },
    onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
      const press = nearbyPress.current
      if (event.button !== 0 || press?.pointer !== event.pointerId) return
      const bounds = event.currentTarget.getBoundingClientRect(),
        inside =
          event.clientX >= bounds.left &&
          event.clientX < bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY < bounds.bottom
      releaseNearbyPress(inside ? press.scene : undefined)
    },
    onPointerLeave: clearNearbyPress,
    onPointerCancel: clearNearbyPress,
    onBlur: clearNearbyPress,
    onContextMenu: (event: MouseEvent<HTMLButtonElement>) => event.preventDefault(),
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      // Keyboard handling below suppresses browser key-generated clicks. A
      // detail-zero click remains the accessibility/assistive activation path.
      if (!event.detail && !nearbyPress.current) currentNearbyScene()?.requestNearbyFollowers()
    },
    onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      if (event.repeat) return
      const scene = currentNearbyScene()
      if (!scene || event.currentTarget.disabled) return
      nearbyPress.current = { scene, key: event.key }
      setNearbyPressed(true)
    },
    onKeyUp: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      const press = nearbyPress.current
      if (press?.key === event.key) releaseNearbyPress(press.scene)
    },
  }
  function beginLoad(request: LoadRequest) {
    setCheatsOpen(false)
    if (request.kind === 'checkpoint' && !store.hasCheckpoint()) return
    menuSession.current = null
    pendingMenuCamera.current = []
    cancelNearbyInput()
    if (engine.current) engine.current.nearbyFollowersHudActive = false
    setSelectorOpen(false)
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
    setCheatsOpen(false)
    menuSession.current = null
    pendingMenuCamera.current = []
    cancelNearbyInput()
    if (engine.current) engine.current.nearbyFollowersHudActive = false
    audio.current?.reset()
    setMenu(false)
    setReady(false)
    setError('')
    loadRequest.current = null
    setStartupCampaign(false)
    setStartup('choice')
  }
  function loadCheckpoint() {
    beginLoad({ kind: 'checkpoint' })
  }
  function retryLoad() {
    if (loadRequest.current) beginLoad(loadRequest.current)
  }
  async function saveCheckpoint() {
    const session = menuSession.current
    return store.saveCheckpoint(session?.world === store.getWorld() ? session.paused : undefined)
  }
  function quitLevel() {
    setCheatsOpen(false)
    menuSession.current = null
    pendingMenuCamera.current = []
    cancelNearbyInput()
    audio.current?.reset()
    setMenu(false)
    setReady(false)
    setSelectorOpen(false)
    setError('')
    loadRequest.current = null
    setStartupCampaign(true)
    setStartup('choice')
  }
  const nearby = !!(world.castingTribes[0].flags & 128),
    followerPeople = hudTaskPeople(world),
    followerCounts = followerTaskCounts(followerPeople, hudCamera, nearby),
    blue = world.units.filter(u => u.team === 'blue'),
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
    if (
      ready ||
      (event.target as Element).closest(
        '.loading-world,[data-world-selector],[data-original-main-menu],[data-startup-logo],[data-fullscreen-control]'
      )
    )
      return false
    event.preventDefault()
    event.stopPropagation()
    return true
  }
  const nextMission = missionNumbers.find(mission => mission === world.outcome.level + 1),
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
  const pendingLoadingPhase = startup === 'loading' ? 'restore' : 'loading'
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
            '[data-fullscreen-control],.top-actions,.wordmark,.game-dialog,[data-original-pause-menu],[data-spell-test-menu],.campaign-messages,.skip-introduction,.paused-badge,.desktop-recommendation,.loading-world,.end-screen,[data-world-selector],[data-original-main-menu],[data-startup-logo]'
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
      <FullscreenControl />
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
      <aside
        className="campaign-messages"
        aria-label="Campaign messages"
        style={{ visibility: menu ? 'hidden' : undefined }}
      >
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
      <div className="game-status">
        {ready && routeNotice && (
          <div
            key={routeNotice.serial}
            className="world-message route-notice"
            style={{
              visibility: menu ? 'hidden' : undefined,
              animationPlayState: menu || selectorOpen || cheatsOpen ? 'paused' : undefined,
            }}
            role="status"
            onAnimationEnd={() =>
              store.change(w => {
                if (w === world && w.routeNotice === routeNotice) w.routeNotice = null
              })
            }
          >
            <span>✧</span>
            {ROUTE_FAILURE_TEXT}
          </div>
        )}
        {ready && !routeNotice && world.messageUntil > world.time && (
          <div
            className="world-message"
            role="status"
            style={{ visibility: menu ? 'hidden' : undefined }}
          >
            <span>✧</span>
            {world.message}
          </div>
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
      </div>
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

      <aside ref={hudPanel} className="native-hud" aria-label="Tribe controls">
        <div className="minimap-wrap">
          <canvas
            ref={minimap}
            width={100}
            height={96}
            aria-label="Minimap. Click to move the camera."
          />
          <MinimapFrame key={hudSize} />
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
            className="nearby-followers-button"
            aria-label="Nearby followers"
            aria-pressed={nearby}
            title="Nearby followers · Limit counts and selection to the camera area"
            {...nearbyControl}
          >
            <HudSprite id={875 + Number(nearby) * 2 + Number(nearbyPressed)} />
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
            onClick={openMenu}
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
            {...followerControl(0)}
          >
            <PopulationMeter
              population={population(world, 'blue')}
              capacity={populationLimit(world, 'blue')}
            />
            <FollowerNumber count={followerCounts.displayTotals[0]} total alternate={nearby} />
          </button>
          {followerClassControls(blue, followerCounts).map(u => (
            <button
              key={u.kind}
              aria-label={`Select ${u.kind}`}
              title={`${u.label} · Shift: all · Ctrl: five · Right-click: focus next`}
              disabled={!u.enabled}
              aria-pressed={selected.length > 0 && selected.every(s => s.kind === u.kind)}
              {...followerControl(nativeUnitModel(u.kind))}
            >
              {u.enabled && (
                <>
                  <FollowerIcon sprite={u.sprite} />
                  <FollowerNumber count={u.count} alternate={nearby} />
                </>
              )}
            </button>
          ))}
        </section>
        <ManaMeter tribe={world.manaTribes[0]} world={world.manaWorld} />
        <section
          className={`command-dock${tab === 'followers' ? ' followers-dock' : ''}`}
          aria-label="Command panel"
        >
          {tab === 'followers' && (
            <FollowerTasks
              counts={followerCounts}
              vehicles={hudTransports(world)}
              transportPeople={hudTaskPeople(world, false)}
              transportControl={(model, kind) => followerControl(model, undefined, kind)}
              center={hudCamera}
              nearby={nearby}
              control={followerControl}
            />
          )}
          {tab === 'spells' && (
            <div className="spell-list">
              {spellRoster
                .toSorted(
                  (a, b) => spellOrder.indexOf(a.spell.model) - spellOrder.indexOf(b.spell.model)
                )
                .map(({ spell: s, visibility }) => {
                  const player = world.manaWorld.playerTribe,
                    permanent = spellHudPermanent(world, s),
                    canCharge = permanent && spellHudCanCharge(world, s),
                    undiscovered = visibility === 'undiscovered',
                    interactive = visibility === 'visible',
                    view = spellHudButton(visibility, {
                      model: s.model,
                      permanent,
                      charging:
                        canCharge &&
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
                      ref={element => {
                        if (element) spellButtons.current.set(s.model, element)
                        else spellButtons.current.delete(s.model)
                      }}
                      className="spell-card"
                      style={{
                        borderImageSource: `url('/original/hud-${view.frame}.png')`,
                        cursor: undiscovered ? 'default' : undefined,
                      }}
                      aria-label={
                        undiscovered
                          ? 'Undiscovered spell'
                          : `${s.name}, ${world.shots[s.id]} shots`
                      }
                      aria-disabled={visibility !== 'visible'}
                      aria-pressed={interactive && world.mode === s.id}
                      title={
                        undiscovered
                          ? 'Undiscovered spell'
                          : `${s.name}${canCharge ? ' · Right-click to pause or resume charging' : ''}`
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
                        if (canCharge)
                          store.change(w => {
                            const bit = 1 << (s.model - 1)
                            w.manaWorld.spells[player].disabled ^= bit
                            if (s.id === 'blast')
                              w.charging = !(w.manaWorld.spells[player].disabled & bit)
                          })
                      }}
                      data-tooltip-hud={s.id === 'blast' && !undiscovered ? 'blast' : undefined}
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
                  ref={buildingButtonRefs.get(b.id)}
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
                  <BuildingIcon kind={b.id} />
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
          <button aria-label="Game settings" title="Game settings" onClick={openMenu}>
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

      {startup === 'choice' && !startupLogoDone && <StartupLogo onComplete={finishStartupLogo} />}
      {startup === 'choice' && startupLogoDone && !startupCampaign && frontendAssets && (
        <OriginalMainMenu
          prepared={frontendAssets}
          hasCheckpoint={store.hasCheckpoint()}
          checkpointReadStatus={store.getCheckpointReadStatus()}
          onRetryCheckpoint={() => {
            void store.restoreCheckpoint()
          }}
          onNewGame={() => setStartupCampaign(true)}
          onTutorial={() => startMission(tutorialLevel)}
          onLoad={loadCheckpoint}
          renderOptions={(onBack, onTextRowsChange) => (
            <OriginalOptions
              skin="frontend"
              preparedFrontend={frontendAssets}
              onBack={onBack}
              onTextRowsChange={onTextRowsChange}
              volume={volume}
              musicVolume={musicVolume}
              storageNotice={audioStorageNotice}
              gamePreferences={gamePreferences}
              onGamePreferences={changeGamePreferences}
              gameStorageNotice={gameStorageNotice}
              onVolume={nextVolume =>
                changeAudioPreferences({ ...audioPreferences, volume: nextVolume })
              }
              onMusicVolume={nextVolume =>
                changeAudioPreferences({ ...audioPreferences, musicVolume: nextVolume })
              }
            />
          )}
        />
      )}
      {((startup === 'choice' && startupCampaign) || selectorOpen) && (
        <dialog
          ref={startupDialog}
          className={worldSelectorStyles.dialog}
          data-world-selector
          aria-label="Start game"
          onCancel={event => {
            event.preventDefault()
            if (selectorOpen) {
              setSelectorOpen(false)
              if (world.status === 'playing') openMenu()
            } else setStartupCampaign(false)
          }}
        >
          <WorldSelector
            missions={missionNumbers}
            replacingWorld={selectorOpen}
            completed={completedMissions}
            hasCheckpoint={store.hasCheckpoint()}
            onStart={startMission}
            onTutorial={() => startMission(tutorialLevel)}
            onLoad={loadCheckpoint}
            onBack={
              selectorOpen
                ? () => {
                    setSelectorOpen(false)
                    if (world.status === 'playing') openMenu()
                  }
                : () => setStartupCampaign(false)
            }
          />
        </dialog>
      )}
      {(startup === 'loading' || (startup === 'playing' && (!ready || error))) && (
        <OriginalLoadingScreen
          key={error ? 'failed' : startup}
          phase={error ? 'failed' : pendingLoadingPhase}
          error={error}
          onRetry={retryLoad}
        />
      )}
      {world.status !== 'playing' && !world.outcome.cameraPlaying && (
        <OriginalResultScreen
          status={world.status}
          level={world.outcome.level}
          player={world.manaWorld.playerTribe + 1}
          time={world.time}
          primaryLabel={
            world.status === 'won' && nextMission
              ? `Continue to Mission ${nextMission}`
              : 'Restart Level'
          }
          onPrimary={world.status === 'won' && nextMission ? continueCampaign : restart}
          onSelectLevel={openSelector}
        />
      )}
      {cheatsOpen && (
        <SpellTestMenu
          store={store}
          sceneRef={engine}
          onClose={() => setCheatsOpen(false)}
          onSelect={spell => {
            store.change(w => {
              w.mode = spell
            })
            setTab('spells')
            setCheatsOpen(false)
          }}
        />
      )}
      {menu && (
        <OriginalPauseMenu
          prepared={frontendAssets?.ingame}
          tutorial={world.outcome.level === tutorialLevel}
          hasCheckpoint={store.hasCheckpoint()}
          checkpointReadStatus={store.getCheckpointReadStatus()}
          onRetryCheckpoint={() => {
            void store.restoreCheckpoint()
          }}
          onContinue={closeMenu}
          onSave={saveCheckpoint}
          saveDisabledReason={store.hasUsedCheats() ? CHEAT_SAVE_NOTICE : undefined}
          onLoad={loadCheckpoint}
          onRestart={restart}
          onQuitLevel={quitLevel}
          onQuitGame={exitTutorial}
          renderOptions={onBack => (
            <OriginalOptions
              skin="ingame"
              preparedIngame={frontendAssets?.ingame}
              onBack={onBack}
              volume={volume}
              musicVolume={musicVolume}
              storageNotice={audioStorageNotice}
              gamePreferences={gamePreferences}
              onGamePreferences={changeGamePreferences}
              gameStorageNotice={gameStorageNotice}
              onVolume={nextVolume =>
                changeAudioPreferences({ ...audioPreferences, volume: nextVolume })
              }
              onMusicVolume={nextVolume =>
                changeAudioPreferences({ ...audioPreferences, musicVolume: nextVolume })
              }
              compatibility={
                <>
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
                                                              : world.outcome.level === 18 ||
                                                                  world.outcome.level === 23
                                                                ? "Prepare for the enemy tribes' powerful magic and seek Armageddon."
                                                                : null}
                  </p>
                  <div className="menu-actions">
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setMenu(false)
                        openSelector()
                      }}
                    >
                      Select Level
                    </button>
                  </div>
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
                    <button
                      onClick={() => pendingMenuCamera.current.push(scene => scene.zoom(true))}
                    >
                      Zoom in
                    </button>
                    <button
                      onClick={() => pendingMenuCamera.current.push(scene => scene.zoom(false))}
                    >
                      Zoom out
                    </button>
                    <button
                      onClick={() =>
                        pendingMenuCamera.current.push(scene =>
                          scene.focus(shaman ?? HOME, { animate: true })
                        )
                      }
                    >
                      Focus settlement
                    </button>
                  </div>
                  <p>Camera changes apply when you continue.</p>
                  <button
                    className="secondary-button"
                    aria-pressed={!!engine.current?.fpsGraph}
                    onClick={() => {
                      engine.current?.togglePerformance()
                      update()
                    }}
                  >
                    Toggle performance overlay · F8
                  </button>
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
                  <h3>Controls</h3>
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
                    <strong>
                      Move forward / back ·{' '}
                      {gamePreferences.rotation === 'cursor' ? 'Rotate' : 'Pan'} left / right
                    </strong>
                    <span>Ctrl + ← / → · Shift</span>
                    <strong>
                      {gamePreferences.rotation === 'cursor' ? 'Pan sideways' : 'Rotate'} · Hold
                      Shift for fast panning
                    </strong>
                    <span>Delete / Page Down</span>
                    <strong>
                      {gamePreferences.rotation === 'cursor' ? 'Pan sideways' : 'Rotate'} · Ctrl
                      swaps pan and turn
                    </strong>
                    <span>Flip Rotation</span>
                    <strong>
                      Keyboard turn direction is{' '}
                      {gamePreferences.flipRotation ? 'reversed' : 'normal'} · Mouse drag and
                      sideways pan are unchanged
                    </strong>
                    <span>Screen edges</span>
                    <strong>Move the pointer to an outer edge to scroll</strong>
                    <span>1–3 / B</span>
                    <strong>Choose a spell / open buildings</strong>
                    <span>Space with a building plan</span>
                    <strong>Rotate the entrance before placing</strong>
                    <span>F8</span>
                    <strong>Toggle live FPS, frame times and CPU/render diagnostics</strong>
                    <span>H / F / G / Space / Esc</span>
                    <strong>Shaman / focus / guard shaman / pause / cancel</strong>
                  </div>
                  <BrowserHelpTips level={world.outcome.level} />
                  <div className="audio-settings">
                    <button
                      className="secondary-button"
                      onClick={toggleSound}
                      disabled={soundPending}
                      aria-busy={soundPending}
                    >
                      {sound ? '♪ Sound on' : '♫ Enable sound'}
                    </button>
                  </div>
                  {audioStorageNotice && <p role="status">{audioStorageNotice}</p>}
                  {audioStartNotice && <p role="status">{audioStartNotice}</p>}
                  <details className="reference-details">
                    <summary>About this recreation & references</summary>
                    <p>
                      Mission 1 reference: The Journey Begins. Terrain, starting objects and shrine
                      timings were read from the supplied original level file. Building and tree
                      meshes, texture coordinates, layered unit animations, HUD artwork and
                      landscape bank c were decoded from the supplied game archive. The browser
                      renderer approximates the original lighting, terrain displacement and water
                      animation. Selection voices, spell cues and combat sounds use the original
                      recordings. Original music and percussion now play alongside environmental
                      sounds; exact world mixing, activity ownership and the complete native sound
                      scheduler are still being reconstructed. Village growth and mana use rules
                      traced from the executable. Combat state selection, pathfinding and defensive
                      AI still differ from the original.
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
                      <a
                        href="https://www.youtube.com/watch?v=kIY_4F47R6Q"
                        target="_blank"
                        rel="noreferrer"
                      >
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
                </>
              }
            />
          )}
        />
      )}
    </main>
  )
}
