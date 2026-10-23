import { useEffect, useRef, useState } from 'react'
import { selectorWorlds } from './world-selector-data'
import { SelectorMotion, sceneStep } from './world-selector-motion'
import { SelectorRenderer } from './world-selector-renderer'
import frontend from './original-frontend.json'
import styles from './world-selector.module.css'

// Browser recovery is not a native menu. Use the original gold label bank on the
// black failure clear, then the original pale highlight for the Retry action.
// Keep readable text if art fails; this does not change native menu state mapping.
function SceneRecoveryText({
  text,
  ready,
  low = false,
}: {
  text: string
  ready: boolean
  low?: boolean
}) {
  if (!ready)
    return (
      <span className={styles.sceneRecoveryFallback} aria-hidden="true">
        {text}
      </span>
    )
  const bank = frontend.banks.felo33we
  const scaled = (pixels: number) => `calc(var(--panel-width) * ${pixels} / 640)`
  return (
    <span className={styles.sceneRecoveryText} aria-hidden="true">
      {[...text].map((letter, index) => {
        const glyph = bank.rects[letter.charCodeAt(0) - 32]
        return (
          <i
            key={index}
            style={{
              width: scaled(glyph.w),
              height: scaled(glyph.h),
              backgroundPosition: `${scaled(-glyph.x)} ${scaled(-glyph.y)}`,
              backgroundSize: `${scaled(bank.width)} ${scaled(bank.height)}`,
              backgroundImage: low
                ? "url('/original/frontend/felo33we.png')"
                : 'var(--selector-recovery-font)',
            }}
          />
        )
      })}
    </span>
  )
}

export function WorldSelectorScene({
  mission,
  progressionMission,
}: {
  mission: number
  progressionMission: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const selection = useRef({ mission, progressionMission })
  const [failed, setFailed] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [recoveryFonts, setRecoveryFonts] = useState<string[]>([])
  useEffect(() => {
    selection.current = { mission, progressionMission }
  }, [mission, progressionMission])
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let disposed = false,
      frame = 0,
      lastTime: number | undefined
    let renderer: SelectorRenderer | undefined
    let loaded = false,
      broken = false
    const motion = new SelectorMotion()
    setFailed(false)
    delete canvas.dataset.ready
    canvas.dataset.generation = String(generation)
    function fail() {
      if (disposed) return
      broken = true
      cancelAnimationFrame(frame)
      renderer?.dispose()
      setFailed(true)
      delete canvas!.dataset.ready
    }
    function draw(timestamp: number) {
      if (disposed || broken || !renderer) return
      try {
        const delta = lastTime === undefined ? 0 : (timestamp - lastTime) / 1000
        lastTime = timestamp
        const selected = selectorWorlds.find(
          body => body.mission === selection.current.mission
        )!.index
        const anchor = selectorWorlds.find(
          body => body.mission === selection.current.progressionMission
        )!.index
        const state = motion.advance(delta, selected, (positions, camera) =>
          renderer!.advanceSun(positions, camera, sceneStep)
        )
        renderer.render(state.positions, state.camera, state.elapsed, anchor)
        canvas!.dataset.ready = 'true'
        canvas!.dataset.selectedBody = String(selected)
        canvas!.dataset.progressionBody = String(anchor)
        canvas!.dataset.elapsed = state.elapsed.toFixed(3)
        frame = requestAnimationFrame(draw)
      } catch {
        fail()
      }
    }
    function visibility() {
      cancelAnimationFrame(frame)
      lastTime = undefined
      if (!document.hidden && renderer && loaded && !broken) frame = requestAnimationFrame(draw)
    }
    function lost(event: Event) {
      event.preventDefault()
      fail()
    }
    function restored() {
      if (!disposed) setGeneration(value => value + 1)
    }
    canvas.addEventListener('webglcontextlost', lost)
    canvas.addEventListener('webglcontextrestored', restored)
    document.addEventListener('visibilitychange', visibility)
    try {
      renderer = new SelectorRenderer(canvas)
      renderer
        .load(generation > 0)
        .then(() => {
          loaded = true
          if (!disposed && !broken && !document.hidden) frame = requestAnimationFrame(draw)
        })
        .catch(fail)
    } catch {
      fail()
    }
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.removeEventListener('webglcontextrestored', restored)
      document.removeEventListener('visibilitychange', visibility)
      renderer?.dispose()
    }
  }, [generation])
  return (
    <div className={styles.scene} aria-label="Original star-system scene">
      <canvas
        ref={canvasRef}
        data-world-scene="true"
        aria-hidden="true"
        style={{ visibility: failed ? 'hidden' : 'visible' }}
      />
      {failed && (
        <div className={styles.sceneFailure}>
          {['fehi33we', 'felo33we'].map(name => (
            <img
              key={name}
              src={`/original/frontend/${name}.png`}
              alt=""
              hidden
              onLoad={() =>
                setRecoveryFonts(previous =>
                  previous.includes(name) ? previous : [...previous, name]
                )
              }
              onError={() => setRecoveryFonts(previous => previous.filter(font => font !== name))}
            />
          ))}
          <p role="status">
            <span className={styles.visuallyHidden}>
              Star-system image unavailable. Mission controls still work.
            </span>
            {['Star-system image unavailable.', 'Mission controls still work.'].map(text => (
              <span key={text} className={styles.sceneRecoveryLine}>
                <SceneRecoveryText text={text} low ready={recoveryFonts.includes('felo33we')} />
              </span>
            ))}
          </p>
          <button
            type="button"
            className={styles.sceneRetry}
            aria-label="Retry scene"
            data-selector-recovery="true"
            onClick={() => setGeneration(value => value + 1)}
          >
            <SceneRecoveryText
              text="Retry scene"
              ready={recoveryFonts.includes('felo33we') && recoveryFonts.includes('fehi33we')}
            />
          </button>
        </div>
      )}
    </div>
  )
}
