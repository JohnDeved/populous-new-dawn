'use client'

import { FullscreenControl } from './fullscreen-control'
import { OriginalPauseStatus } from './original-pause-status'
import { OriginalOptions } from './original-options'
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
import {
  acknowledgeMessage,
  messageHasDelete,
  messageIcon,
  messageText,
  messageViewPoint,
} from './messages'
import { OriginalCampaignPopup } from './original-campaign-popup'
import { captureCampaignPopupKeys, showCampaignPopup } from './campaign-popup-session'
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
      engine.current?.keys.clear()
      showCampaignPopup(details, messageDetails.current.values())
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
  // Native 00458060 captures prior pause; only the same world may restore it.
  const menuSession = useRef<{ world: typeof world; paused: boolean } | null>(null)
  const openMenu = useCallback(() => {
    cancelNearbyInput()
    if (engine.current) engine.current.nearbyFollowersHudActive = false
    if (!menuSession.current) {
      const current = store.getWorld()
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
      }
    }
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
    return captureCampaignPopupKeys(document, () =>
      ready && !menu && !cheatsOpen && !selectorOpen
        ? Array.from(messageDetails.current.values()).find(details => details.open)
        : undefined
    )
  }, [ready, menu, cheatsOpen, selectorOpen])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        !ready ||
        menu ||
        cheatsOpen ||
        Array.from(messageDetails.current.values()).some(details => details.open) ||
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
  const nextMission = missionNumbers.find(mission => mission === world.outcome.level + 1)
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
            '[data-fullscreen-control],.top-actions,.wordmark,.game-dialog,[data-original-pause-menu],[data-spell-test-menu],.campaign-messages,.loading-world,.end-screen,[data-world-selector],[data-original-main-menu],[data-startup-logo]'
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
      <div className="world-viewport" ref={viewport} tabIndex={-1} />
      <div className="world-vignette" />
      <aside
        className="campaign-messages"
        aria-label="Campaign messages"
        style={{ visibility: menu ? 'hidden' : undefined }}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.stopPropagation()
            if (event.repeat) event.preventDefault()
          }
        }}
        onKeyUp={event => {
          if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
        }}
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
                style={
                  {
                    '--message-height': `${height}px`,
                    '--message-top': `${top}px`,
                    top: `${top}px`,
                  } as CSSProperties
                }
              >
                <summary
                  aria-label="Read campaign message"
                  onClick={event => {
                    const target = messageViewPoint(message!),
                      details = event.currentTarget.parentElement as HTMLDetailsElement
                    event.preventDefault()
                    if (details.open) details.open = false
                    else {
                      engine.current?.keys.clear()
                      if (target) engine.current?.focus(target, { animate: true })
                      showCampaignPopup(details, messageDetails.current.values())
                    }
                  }}
                >
                  <img src={messageIcon(message!)} alt="" />
                </summary>
                <OriginalCampaignPopup
                  text={messageText(message!.stringId)}
                  onAcknowledge={() => {
                    const details = messageDetails.current.get(message!.serial)
                    if (details) details.open = false
                    acknowledgeMessage(world.messages, slot)
                    update()
                    if (world.messages.slots[slot]) details?.querySelector('summary')?.focus()
                    else viewport.current?.focus({ preventScroll: true })
                  }}
                  onDelete={
                    messageHasDelete(message!)
                      ? () => {
                          acknowledgeMessage(world.messages, slot, true)
                          update()
                          viewport.current?.focus({ preventScroll: true })
                        }
                      : undefined
                  }
                />
              </details>
            )
          })}
      </aside>
      <p className="game-a11y-status" role="status" aria-atomic="true" data-route-announcement>
        {ready && world.routeNotice && (
          <span key={world.routeNotice.serial}>{ROUTE_FAILURE_TEXT}</span>
        )}
      </p>
      <div className="game-status">
        {ready && !world.routeNotice && world.messageUntil > world.time && (
          <p className="game-a11y-status" role="status">
            {world.message}
          </p>
        )}
      </div>
      {ready && world.paused && !menu && world.status === 'playing' && <OriginalPauseStatus />}

      {world.mode && (
        <p className="game-a11y-status" role="status">
          Choose where to {SPELLS.some(s => s.id === world.mode) ? 'cast' : 'build'} {modeName}.
          {Object.hasOwn(world.buildingDirections, world.mode) && ' Space rotates the building.'}
          {' Escape cancels.'}
        </p>
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
          <button aria-label="Game settings" title="Game settings" onClick={openMenu}>
            ☰
          </button>
        </div>
      </aside>
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
              compatibility={{
                onSelectLevel: () => {
                  setMenu(false)
                  openSelector()
                },
                speed: world.speed,
                onSpeed: () => {
                  store.change(w => {
                    w.speed = w.speed === 1 ? 2 : 1
                  })
                },
                performance: !!engine.current?.fpsGraph,
                onPerformance: () => {
                  engine.current?.togglePerformance()
                  update()
                },
                hudSize,
                onHudSize: value => {
                  setHudSize(value)
                  try {
                    localStorage.setItem('hud-size', value)
                  } catch {
                    // Keep the session preference when storage is unavailable.
                  }
                },
                sound,
                soundPending,
                onSound: toggleSound,
                audioStartNotice,
              }}
            />
          )}
        />
      )}
    </main>
  )
}
