import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { preflightHelpAssets, type HelpDocument, type HelpImageAsset } from './help-document'
import {
  helpScrollbarAssets,
  helpScrollbarPlan,
  helpScrollbarHover,
  helpScrollStep,
  type HelpScrollController,
} from './help-controls'
import styles from './help-controls.module.css'

/** Inactive original moving-cap scrollbar. The caller owns session position and
 * the controller's AFTER-draw sampling; this component creates no clock, wheel
 * behavior, track-click action or inferred browser/native coordinate transform. */
export function HelpScrollbar({
  document,
  position,
  controller,
  nativeY,
  hoverPoint,
  onPosition,
  onFailure,
}: {
  document: HelpDocument
  position: number
  controller: HelpScrollController
  nativeY: (event: PointerEvent<HTMLElement>) => number
  hoverPoint: { x: number; y: number } | null
  onPosition: (position: number) => void
  onFailure: (error: unknown) => void
}) {
  const [ready, setReady] = useState(false)
  const [focus, setFocus] = useState<'up' | 'down' | null>(null)
  const pointer = useRef<{ id: number; element: HTMLElement } | null>(null)
  const release = useCallback(() => {
    const owned = pointer.current
    pointer.current = null
    controller.reset()
    if (owned?.element.hasPointerCapture(owned.id)) owned.element.releasePointerCapture(owned.id)
  }, [controller])
  const geometry = helpScrollbarPlan(
    document.panels.scrollbar,
    document.article.height,
    document.panels.inner.article.height,
    position,
    null
  )
  const plan = helpScrollbarPlan(
    document.panels.scrollbar,
    document.article.height,
    document.panels.inner.article.height,
    position,
    helpScrollbarHover(geometry, hoverPoint),
    focus
  )
  const visible = plan.thumb !== 0
  const assetKey = JSON.stringify(helpScrollbarAssets())
  useEffect(() => {
    if (!visible) {
      setReady(false)
      return
    }
    let active = true
    void preflightHelpAssets(JSON.parse(assetKey) as HelpImageAsset[]).then(
      () => {
        if (active) setReady(true)
      },
      error => {
        if (!active) return
        setReady(false)
        release()
        onFailure(error)
      }
    )
    return () => {
      active = false
    }
  }, [assetKey, onFailure, release, visible])
  // Scene disposal, retargeting and resize cannot leave captured browser input.
  useEffect(
    () => release,
    [release, document.topic, document.width, document.height, document.panels.scrollbar.x]
  )
  useEffect(() => {
    if (plan.thumb) return
    release()
    setFocus(null)
  }, [plan.thumb, release])
  if (!ready || !plan.up || !plan.down || !plan.body) return null
  const finish = (event: PointerEvent<HTMLElement>) => {
    if (pointer.current?.id !== event.pointerId) return
    event.preventDefault()
    event.stopPropagation()
    release()
  }
  return (
    <>
      {(['up', 'down'] as const).map(direction => {
        const cap = plan[direction]!
        const activate = () => onPosition(helpScrollStep(plan.position, plan.maximum, direction))
        return (
          <button
            key={direction}
            type="button"
            className={styles.navigation}
            style={{ left: cap.x, top: cap.y, width: cap.width, height: cap.height }}
            aria-label={`Scroll article ${direction}`}
            data-help-scroll={direction}
            data-help-cursor={direction === 'up' ? 4 : 5}
            onFocus={() => setFocus(direction)}
            onBlur={() => setFocus(null)}
            onPointerDown={event => {
              if (event.button !== 0) return
              event.preventDefault()
              event.stopPropagation()
              activate()
            }}
            onClick={event => {
              event.preventDefault()
              event.stopPropagation()
              if (event.detail === 0) activate() // Explicit browser keyboard adaptation.
            }}
          >
            <img
              src={cap.url}
              width={cap.width}
              height={cap.height}
              alt=""
              draggable={false}
              style={{ left: 0, top: 0 }}
            />
          </button>
        )
      })}
      {plan.body.height > 0 && (
        <div
          className={styles.scrollBody}
          style={{
            left: plan.body.x,
            top: plan.body.y,
            width: plan.body.width,
            height: plan.body.height,
            backgroundImage: `url(${plan.body.url})`,
          }}
          aria-hidden="true"
          data-help-scroll="drag"
          data-help-cursor={6}
          onPointerDown={event => {
            if (event.button !== 0 || pointer.current) return
            event.preventDefault()
            event.stopPropagation()
            try {
              controller.begin(nativeY(event))
              pointer.current = { id: event.pointerId, element: event.currentTarget }
              event.currentTarget.setPointerCapture(event.pointerId)
            } catch (error) {
              release()
              onFailure(error)
            }
          }}
          onPointerUp={finish}
          onPointerCancel={finish}
          onLostPointerCapture={finish}
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
          }}
        />
      )}
    </>
  )
}
