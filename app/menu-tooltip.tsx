import { useEffect, useState, type RefObject } from 'react'
import provenance from '../public/original/world-selector/text/provenance.json'
import { menuTooltipPosition } from './menu-tooltip-layout'
import styles from './menu-tooltip.module.css'

interface TooltipState {
  target: HTMLElement
  value: string
  x: number
  y: number
  started: number
}

// Both menus use the selector's >500ms dwell and native placement. Target identity
// (not just its text) owns the dwell, so moving to another row restarts it.
export function useMenuTooltip(container: RefObject<HTMLElement | null>, attribute: string) {
  const [state, setState] = useState<TooltipState>()
  const [readyFor, setReadyFor] = useState<number>()
  useEffect(() => {
    const element = container.current
    if (!element) return
    const clear = () => setState(undefined)
    function show(target: EventTarget | null, x?: number, y?: number) {
      const owner = target instanceof Element ? target.closest<HTMLElement>(`[${attribute}]`) : null
      const value = owner?.getAttribute(attribute)
      if (!owner || !value || !element?.contains(owner)) return clear()
      const bounds = owner.getBoundingClientRect()
      setState(previous => ({
        target: owner,
        value,
        x: x ?? bounds.left + bounds.width / 2,
        y: y ?? bounds.top,
        started:
          previous?.target === owner && previous.value === value
            ? previous.started
            : performance.now(),
      }))
    }
    const move = (event: PointerEvent) => show(event.target, event.clientX, event.clientY)
    const focus = (event: FocusEvent) => show(event.target)
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') clear()
    }
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerleave', clear)
    element.addEventListener('pointerdown', clear)
    element.addEventListener('focusin', focus)
    element.addEventListener('focusout', clear)
    element.addEventListener('keydown', key)
    window.addEventListener('resize', clear)
    window.addEventListener('scroll', clear, true)
    window.addEventListener('blur', clear)
    document.addEventListener('visibilitychange', clear)
    return () => {
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerleave', clear)
      element.removeEventListener('pointerdown', clear)
      element.removeEventListener('focusin', focus)
      element.removeEventListener('focusout', clear)
      element.removeEventListener('keydown', key)
      window.removeEventListener('resize', clear)
      window.removeEventListener('scroll', clear, true)
      window.removeEventListener('blur', clear)
      document.removeEventListener('visibilitychange', clear)
    }
  }, [container, attribute])
  const started = state?.started
  useEffect(() => {
    if (started === undefined) return
    const timer = setTimeout(
      () => setReadyFor(started),
      Math.max(0, 501 - (performance.now() - started))
    )
    return () => clearTimeout(timer)
  }, [started])
  return state &&
    readyFor === started &&
    state.target.isConnected &&
    state.target.getAttribute(attribute) === state.value
    ? state
    : undefined
}

const glyphs = provenance.fonts.tooltip.glyphs
const atlas = '/original/world-selector/text/tooltip-font-c.png'

function MenuTooltipText({ text, ready }: { text: string; ready: boolean }) {
  // Freeze typography for this visible tooltip even if a caller replaces its
  // prepared snapshot. Never replace fallback text under the user's pointer.
  const [useArtwork] = useState(ready)
  if (!useArtwork) return <>{text}</>
  return (
    <>
      {Array.from(text, (letter, index) => {
        const glyph = glyphs[letter.charCodeAt(0) - 32] ?? glyphs[31]
        return (
          <i
            key={index}
            style={{
              width: glyph.width,
              height: glyph.height,
              backgroundImage: `url('${atlas}')`,
              backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
            }}
          />
        )
      })}
    </>
  )
}

export function MenuTooltip({
  container,
  ready = false,
}: {
  container: RefObject<HTMLElement | null>
  ready?: boolean
}) {
  // Loading belongs to Home's bounded preparation, shared by both menu skins.
  // Unprepared callers remain usable with a stable fallback, never hidden I/O.
  const state = useMenuTooltip(container, 'data-menu-tooltip')
  if (!state || !container.current) return null
  const letters = Array.from(state.value, letter => glyphs[letter.charCodeAt(0) - 32] ?? glyphs[31])
  const width = letters.reduce((sum, glyph) => sum + glyph.advance, 0)
  const height = Math.max(...letters.map(glyph => glyph.height))
  const bounds = container.current.getBoundingClientRect()
  const scale = bounds.width / 640
  if (!scale) return null
  const position = menuTooltipPosition(
    (state.x - bounds.left) / scale,
    (state.y - bounds.top) / scale,
    width,
    height
  )
  return (
    <span
      className={styles.tooltip}
      data-menu-tooltip-visible
      aria-hidden="true"
      style={{ ...position, width, height }}
    >
      <MenuTooltipText key={state.started} text={state.value} ready={ready} />
    </span>
  )
}
