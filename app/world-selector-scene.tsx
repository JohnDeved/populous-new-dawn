import { useEffect, useRef, useState } from 'react'
import { selectorWorlds } from './world-selector-data'
import { SelectorMotion, sceneStep } from './world-selector-motion'
import { SelectorRenderer } from './world-selector-renderer'
import styles from './world-selector.module.css'

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
        .load()
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
        <div className={styles.sceneFailure} role="status">
          <p>Star-system image unavailable. Mission controls still work.</p>
          <button onClick={() => setGeneration(value => value + 1)}>Retry scene</button>
        </div>
      )}
    </div>
  )
}
