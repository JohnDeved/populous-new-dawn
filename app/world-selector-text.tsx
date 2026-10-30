import { useState, type RefObject } from 'react'
import { useMenuTooltip } from './menu-tooltip'
import { menuTooltipPosition } from './menu-tooltip-layout'
import { selectorTitle, selectorTooltip } from './world-selector-art'
import styles from './world-selector.module.css'

export function SelectorTitle({ mission }: { mission: number }) {
  const [failed, setFailed] = useState<number[]>([])
  const title = selectorTitle(mission)
  return (
    <h3 aria-label={title.text}>
      {failed.includes(mission) ? (
        title.text
      ) : (
        <img
          src={title.src}
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
export function SelectorTooltip({
  mission,
  container,
}: {
  mission: number
  container: RefObject<HTMLElement | null>
}) {
  const state = useMenuTooltip(container, 'data-selector-tooltip')
  const [failed, setFailed] = useState<string[]>([])
  if (!state || !container.current || !['978', '979', '980'].includes(state.value)) return null
  const record = selectorTooltip(mission, state.value as '978' | '979' | '980')
  if (failed.includes(record.file)) return null
  const bounds = container.current.getBoundingClientRect(),
    scale = Math.min(bounds.width / 640, bounds.height / 480)
  const frameLeft = (bounds.width - 640 * scale) / 2,
    frameTop = bounds.height - 480 * scale
  const mouseX = (state.x - bounds.left - frameLeft) / scale,
    mouseY = (state.y - bounds.top - frameTop) / scale
  const position = menuTooltipPosition(mouseX, mouseY, record.width, record.height)
  return (
    <img
      className={styles.nativeTooltip}
      data-native-tooltip={state.value}
      src={record.file}
      alt=""
      aria-hidden="true"
      style={{
        left: frameLeft + position.left * scale,
        top: frameTop + position.top * scale,
        width: record.width * scale,
        height: record.height * scale,
      }}
      onError={() => setFailed(previous => [...previous, record.file])}
    />
  )
}
