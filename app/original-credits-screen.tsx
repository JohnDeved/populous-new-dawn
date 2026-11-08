import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { OriginalCreditsFrame, createOriginalCreditsFrame } from './original-credits-frame'
import { startCreditsPlayback } from './original-credits-session'

export interface CreditsBrowserPresentation {
  /** Deliberately opt in to an adapter, never assert inherited native state. */
  mode: 'browser-adapter'
  background: readonly [number, number, number]
}

interface Props {
  screen: { width: number; height: number }
  presentation: CreditsBrowserPresentation
  onReturn: () => void
}

/** Mounted screen candidate; no production caller enables this yet. */
export function OriginalCreditsScreen({ screen, presentation, onReturn }: Props) {
  const { width, height } = screen
  const root = useRef<HTMLElement>(null)
  const backButton = useRef<HTMLButtonElement>(null)
  const current = useRef({ screen, onReturn })
  const playback = useRef<ReturnType<typeof startCreditsPlayback> | null>(null)
  const returnToMenu = useRef<(() => void) | null>(null)
  const [frame, setFrame] = useState(() => createOriginalCreditsFrame(screen, 0))
  const [fontStatus, setFontStatus] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [failed, setFailed] = useState(false)
  useLayoutEffect(() => {
    current.current = { screen, onReturn }
  }, [screen, onReturn])
  useEffect(() => {
    let alive = true
    let returned = false
    const back = () => {
      if (!alive || returned) return
      returned = true
      owner.dispose()
      current.current.onReturn()
    }
    const owner = startCreditsPlayback({
      now: () => Math.floor(performance.now()),
      schedule: callback => requestAnimationFrame(callback),
      cancel: cancelAnimationFrame,
      render: origin => {
        const next = createOriginalCreditsFrame(current.current.screen, origin)
        setFrame(next)
        return next.origin
      },
      onReturn: back,
      onFailure: () => setFailed(true),
    })
    playback.current = owner
    returnToMenu.current = back
    const heldKeys = new Set<string>()
    let paused = false
    const setPaused = (value: boolean) => {
      if (paused !== value) heldKeys.clear()
      paused = value
      owner.setPaused(value)
    }
    const visibility = () => setPaused(document.hidden || !document.hasFocus())
    const blur = () => setPaused(true)
    window.addEventListener('blur', blur)
    window.addEventListener('focus', visibility)
    document.addEventListener('visibilitychange', visibility)
    visibility()
    const host = root.current
    const insideBack = (event: Event) => backButton.current?.contains(event.target as Node)
    const keyDown = (event: KeyboardEvent) => {
      if (insideBack(event) && event.code !== 'Escape') return
      event.stopPropagation()
      if (event.code === 'Space' || event.code === 'Escape') event.preventDefault()
      if (!event.repeat && !paused) {
        heldKeys.add(event.code)
        owner.enqueue({ device: 'keyboard', code: event.code, down: true })
      }
    }
    const keyUp = (event: KeyboardEvent) => {
      // A key pressed on Credits still belongs to it after focus moves to Back.
      const held = heldKeys.delete(event.code)
      if (insideBack(event) && event.code !== 'Escape' && !held) return
      event.stopPropagation()
      owner.enqueue({ device: 'keyboard', code: event.code, down: false })
    }
    const pointerDown = (event: PointerEvent) => {
      if (insideBack(event)) return
      event.stopPropagation()
      if (event.button < 0 || event.button > 2) return
      host?.setPointerCapture(event.pointerId)
      owner.enqueue({ device: 'mouse', code: event.button as 0 | 1 | 2, down: true })
    }
    const pointerUp = (event: PointerEvent) => {
      if (insideBack(event)) return
      event.stopPropagation()
      if (event.button < 0 || event.button > 2) return
      owner.enqueue({ device: 'mouse', code: event.button as 0 | 1 | 2, down: false })
    }
    const pointerCancel = () => {
      setPaused(true)
      setPaused(document.hidden || !document.hasFocus())
    }
    const contextMenu = (event: Event) => event.preventDefault()
    host?.addEventListener('keydown', keyDown)
    host?.addEventListener('keyup', keyUp)
    host?.addEventListener('pointerdown', pointerDown)
    host?.addEventListener('pointerup', pointerUp)
    host?.addEventListener('pointercancel', pointerCancel)
    host?.addEventListener('contextmenu', contextMenu)
    const images = ['/original/pause-font.png', '/original/result-font.png'].map(url => {
      const image = new Image()
      image.src = url
      return image
    })
    Promise.all(images.map(image => image.decode())).then(
      () => {
        if (!alive || returned) return
        setFontStatus('ready')
        owner.setReady(true)
      },
      () => {
        if (!alive || returned) return
        setFontStatus('failed')
        owner.setReady(false)
      }
    )
    return () => {
      host?.removeEventListener('keydown', keyDown)
      host?.removeEventListener('keyup', keyUp)
      host?.removeEventListener('pointerdown', pointerDown)
      host?.removeEventListener('pointerup', pointerUp)
      host?.removeEventListener('pointercancel', pointerCancel)
      host?.removeEventListener('contextmenu', contextMenu)
      alive = false
      owner.dispose()
      if (playback.current === owner) playback.current = null
      if (returnToMenu.current === back) returnToMenu.current = null
      window.removeEventListener('blur', blur)
      window.removeEventListener('focus', visibility)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  if (presentation.mode !== 'browser-adapter')
    throw new TypeError('Credits presentation must be explicit')
  const displayedFrame =
    frame.width === width && frame.height === height
      ? frame
      : createOriginalCreditsFrame({ width, height }, frame.origin)
  return (
    <section
      ref={root}
      aria-label="Credits"
      data-original-credits-screen
      data-credits-presentation={presentation.mode}
      data-panel-back
      tabIndex={-1}
      style={{ position: 'relative', width: screen.width, height: screen.height }}
    >
      <OriginalCreditsFrame
        frame={displayedFrame}
        background={presentation.background}
        fontStatus={fontStatus}
      />
      {failed && (
        <p
          role="alert"
          style={{ position: 'absolute', left: 16, top: 16, color: '#fff', background: '#000' }}
        >
          Credits playback stopped. Return to the main menu to try again.
        </p>
      )}
      <button
        ref={backButton}
        type="button"
        aria-label="Back to main menu"
        style={{ position: 'absolute', right: 12, bottom: 12 }}
        onPointerDown={event => event.stopPropagation()}
        onPointerUp={event => event.stopPropagation()}
        onKeyDown={event => {
          if (event.code !== 'Escape') event.stopPropagation()
        }}
        onKeyUp={event => {
          if (event.code !== 'Escape') event.stopPropagation()
        }}
        onClick={() => returnToMenu.current?.()}
      >
        Back
      </button>
    </section>
  )
}
