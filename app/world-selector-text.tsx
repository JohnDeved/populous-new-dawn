import { useEffect, useState, type RefObject } from 'react'
import art from '../public/original/world-selector/text/runtime.json'
import styles from './world-selector.module.css'

export function SelectorTitle({ mission }: { mission: number }) {
  const [failed, setFailed] = useState<number[]>([])
  const title = art.banks[String(mission) as keyof typeof art.banks].title
  return (
    <h3 aria-label={title.text}>
      {failed.includes(mission) ? (
        title.text
      ) : (
        <img
          src={art.baseUrl + title.file}
          alt=""
          style={{
            width: `calc(var(--panel-width) * ${title.width} / 640)`,
            height: `calc(var(--panel-width) * ${title.height} / 640)`,
          }}
          onError={() =>
            setFailed(previous => (previous.includes(mission) ? previous : [...previous, mission]))
          }
        />
      )}
    </h3>
  )
}
interface TooltipState {
  id: 978 | 979 | 980
  x: number
  y: number
  started: number
}
export function SelectorTooltip({
  mission,
  container,
}: {
  mission: number
  container: RefObject<HTMLElement | null>
}) {
  const [state, setState] = useState<TooltipState>()
  const [readyFor, setReadyFor] = useState<number>()
  const [failed, setFailed] = useState<string[]>([])
  useEffect(() => {
    const element = container.current
    if (!element) return
    function move(event: PointerEvent) {
      const target =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('[data-selector-tooltip]')
          : null
      const id = Number(target?.dataset.selectorTooltip)
      if (id !== 978 && id !== 979 && id !== 980) {
        setState(undefined)
        return
      }
      setState(previous => ({
        id,
        x: event.clientX,
        y: event.clientY,
        started: previous?.id === id ? previous.started : performance.now(),
      }))
    }
    const clear = () => setState(undefined)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerleave', clear)
    element.addEventListener('pointerdown', clear)
    window.addEventListener('resize', clear)
    window.addEventListener('scroll', clear, true)
    return () => {
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerleave', clear)
      element.removeEventListener('pointerdown', clear)
      window.removeEventListener('resize', clear)
      window.removeEventListener('scroll', clear, true)
    }
  }, [container])
  const started = state?.started
  useEffect(() => {
    if (started === undefined) return
    const timer = setTimeout(
      () => setReadyFor(started),
      Math.max(0, 501 - (performance.now() - started))
    )
    return () => clearTimeout(timer)
  }, [started])
  if (!state || readyFor !== started || !container.current) return null
  const record =
    art.banks[String(mission) as keyof typeof art.banks].tooltips[
      String(state.id) as '978' | '979' | '980'
    ]
  if (failed.includes(record.file)) return null
  const bounds = container.current.getBoundingClientRect(),
    scale = Math.min(bounds.width / 640, bounds.height / 480)
  const frameLeft = (bounds.width - 640 * scale) / 2,
    frameTop = bounds.height - 480 * scale
  const mouseX = (state.x - bounds.left - frameLeft) / scale,
    mouseY = (state.y - bounds.top - frameTop) / scale
  const width = 4 * (Math.floor(record.width / 4) + 3),
    height = 4 * (Math.floor(record.height / 4) + 2)
  const left = Math.max(0, Math.min(640 - width, mouseX - Math.floor(width / 2)))
  const top = Math.max(0, Math.min(480 - height, mouseY - 30))
  return (
    <img
      className={styles.nativeTooltip}
      data-native-tooltip={state.id}
      src={art.baseUrl + record.file}
      alt=""
      aria-hidden="true"
      style={{
        left: frameLeft + (left + Math.floor(width / 2) - Math.floor(record.width / 2)) * scale,
        top: frameTop + (top + Math.floor(height / 2) - Math.floor(record.height / 2)) * scale,
        width: record.width * scale,
        height: record.height * scale,
      }}
      onError={() => setFailed(previous => [...previous, record.file])}
    />
  )
}
