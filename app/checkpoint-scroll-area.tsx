import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  checkpointDragPosition,
  checkpointScrollAssets,
  checkpointScrollGeometry,
} from './checkpoint-scroll'
import styles from './checkpoint-scroll-area.module.css'

/** Browser-owned scrolling with verified original Help artwork, not native Help
 * timing/input behavior. The browser keeps wheel, touch, keyboard and scrollTop. */
export function CheckpointScrollArea({ children, purpose = 'checkpoint' }: {
  children: ReactNode
  purpose?: 'checkpoint' | 'loading'
}) {
  const loading = purpose === 'loading'
  const label = loading ? 'Loading recovery details' : 'Checkpoint details'
  const id = useId()
  const viewport = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const scrollbar = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: number; element: HTMLElement; y: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [metrics, setMetrics] = useState({ visible: 0, content: 0, position: 0 })
  const [hover, setHover] = useState<'up' | 'down' | null>(null)
  const [focus, setFocus] = useState<'up' | 'down' | null>(null)
  const plan = checkpointScrollGeometry(metrics.visible, metrics.content, metrics.position)

  const release = useCallback(() => {
    const owned = drag.current
    drag.current = null
    if (!owned) return
    try {
      owned.element.releasePointerCapture(owned.id)
    } catch {
      // A detached/cancelled pointer can reject release. Local ownership is
      // already cleared; this must not interrupt observer/listener cleanup.
    }
  }, [])
  const measure = useCallback(() => {
    const node = viewport.current
    if (!node) return
    setMetrics(previous => {
      const next = {
        visible: node.clientHeight,
        content: node.scrollHeight,
        position: node.scrollTop,
      }
      return next.visible === previous.visible &&
        next.content === previous.content &&
        next.position === previous.position
        ? previous
        : next
    })
  }, [])
  useEffect(() => {
    let active = true
    void Promise.all(
      checkpointScrollAssets.map(async asset => {
        const image = new Image()
        image.src = asset.url
        await image.decode()
        if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height)
          throw new Error('Unexpected checkpoint scrollbar asset dimensions')
      })
    ).then(
      () => {
        if (active) setReady(true)
      },
      () => {}
    )
    return () => {
      active = false
    }
  }, [])
  useEffect(() => {
    const resized = () => {
      release()
      measure()
    }
    const observer = new ResizeObserver(resized)
    observer.observe(viewport.current!)
    observer.observe(content.current!)
    measure()
    window.addEventListener('resize', resized)
    window.addEventListener('blur', release)
    document.addEventListener('visibilitychange', release)
    return () => {
      release()
      observer.disconnect()
      window.removeEventListener('resize', resized)
      window.removeEventListener('blur', release)
      document.removeEventListener('visibilitychange', release)
    }
  }, [measure, release])
  useEffect(() => {
    if (!plan.maximum) release()
    const node = scrollbar.current
    if (!node) return
    // React's delegated wheel listeners are passive. Own only this sibling's
    // wheel target, not the viewport or the application input/session listeners.
    const wheel = (event: WheelEvent) => {
      const target = viewport.current
      if (!target) return
      event.preventDefault()
      event.stopPropagation()
      target.scrollTop +=
        event.deltaY *
        (event.deltaMode === 1 ? 30 : event.deltaMode === 2 ? target.clientHeight : 1)
    }
    node.addEventListener('wheel', wheel, { passive: false })
    return () => node.removeEventListener('wheel', wheel)
  }, [ready, plan.maximum, release])

  return (
    <div className={styles.area} data-scroll-art={ready && plan.maximum > 0} data-loading-scroll-area={loading || undefined}>
      <div
        id={id}
        ref={viewport}
        className={styles.viewport}
        tabIndex={loading && !plan.maximum ? -1 : 0}
        role="region"
        data-pause-checkpoint-scroll={!loading || undefined}
        data-loading-recovery-scroll={loading || undefined}
        aria-label={label}
        onScroll={measure}
      >
        <div ref={content} className={loading ? styles.loadingContent : styles.content}>
          {children}
        </div>
      </div>
      {ready && plan.maximum > 0 && (
        <div ref={scrollbar} className={styles.scrollbar} data-loading-scrollbar={loading || undefined}>
          <div className={styles.thumb} style={{ top: plan.offset, height: plan.thumb }}>
            {(['up', 'down'] as const).map(direction => {
              const asset =
                checkpointScrollAssets[
                  (direction === 'up' ? 0 : 1) +
                    (hover === direction || focus === direction ? 2 : 0)
                ]
              return (
                <button
                  key={direction}
                  type="button"
                  className={styles.cap}
                  tabIndex={0}
                  data-pause-checkpoint-cap={loading ? undefined : direction}
                  data-loading-scroll-cap={loading ? direction : undefined}
                  style={{ top: direction === 'up' ? 0 : plan.thumb - 12, height: asset.height }}
                  aria-label={`Scroll ${label.toLowerCase()} ${direction}`}
                  aria-controls={id}
                  onPointerEnter={() => setHover(direction)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setFocus(direction)}
                  onBlur={() => setFocus(null)}
                  onClick={() => {
                    if (viewport.current)
                      viewport.current.scrollTop += direction === 'up' ? -30 : 30
                  }}
                >
                  <img
                    src={asset.url}
                    width={asset.width}
                    height={asset.height}
                    alt=""
                    draggable={false}
                  />
                </button>
              )
            })}
            <div
              className={styles.drag}
              aria-hidden="true"
              style={{
                height: plan.thumb - 22,
                backgroundImage: `url(${checkpointScrollAssets[4].url})`,
              }}
              onPointerDown={event => {
                if (event.button !== 0 || drag.current) return
                event.preventDefault()
                event.stopPropagation()
                viewport.current?.focus({ preventScroll: true })
                event.currentTarget.setPointerCapture(event.pointerId)
                drag.current = {
                  id: event.pointerId,
                  element: event.currentTarget,
                  y: event.clientY,
                }
              }}
              onPointerMove={event => {
                const owned = drag.current,
                  node = viewport.current
                if (!owned || owned.id !== event.pointerId || !node) return
                event.preventDefault()
                event.stopPropagation()
                node.scrollTop = checkpointDragPosition(
                  node.scrollTop,
                  event.clientY - owned.y,
                  node.getBoundingClientRect().height,
                  node.clientHeight,
                  node.scrollHeight
                )
                owned.y = event.clientY
              }}
              onPointerUp={event => {
                if (drag.current?.id === event.pointerId) release()
              }}
              onPointerCancel={event => {
                if (drag.current?.id === event.pointerId) release()
              }}
              onLostPointerCapture={event => {
                if (drag.current?.id === event.pointerId) release()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
