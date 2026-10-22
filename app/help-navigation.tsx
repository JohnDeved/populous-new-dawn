import { useEffect, useState } from 'react'
import type { HelpDocument } from './help-document'
import {
  helpNavigationPlan,
  helpNavigationTiles,
  type HelpControlDrawState,
  type HelpNavigationAction,
} from './help-controls'
import styles from './help-controls.module.css'

/** Inactive native navigation renderer. The caller supplies sampled native draw
 * inputs; this component does not invent a counter cadence or a paused clock. */
export function HelpNavigation({
  document,
  draw,
  onNavigate,
  onFailure,
}: {
  document: HelpDocument
  draw: HelpControlDrawState
  onNavigate: (action: HelpNavigationAction) => void
  onFailure: () => void
}) {
  const [hover, setHover] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const plans = document.panels.navigation.map((rect, index) =>
    helpNavigationPlan(
      rect,
      index,
      index === hover || index === focus,
      // Keyboard focus uses the original hover frame continuously as a browser
      // accessibility adaptation. Pointer hover follows the actual counter bit.
      index === focus && index !== hover
        ? { counter: draw.counter + (draw.counter & 4 ? 0 : 4), leftDown: false, leftUp: false }
        : draw
    )
  )
  const assetKey = [...new Set(plans.flatMap(plan => [plan.frameUrl, plan.icon.url]))]
    .sort()
    .join('\n')
  useEffect(() => {
    let active = true
    void Promise.all(
      assetKey.split('\n').map(async src => {
        const image = new Image()
        image.src = src
        await image.decode()
      })
    ).catch(() => {
      if (active) onFailure()
    })
    return () => {
      active = false
    }
  }, [assetKey, onFailure])
  return (
    <>
      {plans.map((plan, index) => (
        <button
          key={plan.action}
          type="button"
          className={styles.navigation}
          data-help-navigation={plan.action}
          aria-label={['Back', 'Forward', 'Home', 'Close Encyclopaedia'][index]}
          style={{
            left: plan.rect.x,
            top: plan.rect.y,
            width: plan.rect.width,
            height: plan.rect.height,
          }}
          onPointerEnter={() => setHover(index)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setFocus(index)}
          onBlur={() => setFocus(null)}
          onPointerDown={event => {
            if (event.button !== 0) return
            event.preventDefault()
            event.stopPropagation()
            onNavigate(plan.action)
          }}
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            if (event.detail === 0) onNavigate(plan.action)
          }}
        >
          <span aria-hidden="true">
            {helpNavigationTiles().map((tile, i) => (
              <i
                key={i}
                style={{
                  left: tile.x,
                  top: tile.y,
                  width: tile.width,
                  height: tile.height,
                  backgroundImage: `url('${plan.frameUrl}')`,
                  backgroundPosition: `-${tile.sourceX}px -${tile.sourceY}px`,
                }}
              />
            ))}
            <img
              src={plan.icon.url}
              width={plan.icon.width}
              height={plan.icon.height}
              alt=""
              style={{ left: plan.iconX, top: plan.iconY }}
            />
          </span>
        </button>
      ))}
    </>
  )
}
