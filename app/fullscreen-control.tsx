'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { createFullscreenSession, placeFullscreenHost, type FullscreenState } from './fullscreen-session'
import styles from './fullscreen-control.module.css'

export function FullscreenControl() {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const [state, setState] = useState<FullscreenState>({ active: false, available: false, pending: false, error: '' })
  const session = useRef<ReturnType<typeof createFullscreenSession> | null>(null)
  useEffect(() => {
    const node = document.createElement('div')
    node.dataset.fullscreenControl = ''
    node.className = styles.control
    placeFullscreenHost(document, node)
    setHost(node)
    const observer = new MutationObserver(() => placeFullscreenHost(document, node))
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] })
    session.current = createFullscreenSession(document, window, setState)
    return () => {
      observer.disconnect()
      session.current?.dispose()
      session.current = null
      node.remove()
    }
  }, [])
  if (!host) return null
  const label = state.active ? 'Exit fullscreen' : 'Fullscreen'
  return createPortal(
    <div onKeyDown={event => {
      // Enter/Space activate this button, never gameplay shortcuts or held repeats.
      if (event.key === 'Enter' || event.key === ' ') {
        event.stopPropagation()
        if (event.repeat) event.preventDefault()
      }
    }} onKeyUp={event => {
      if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
    }}>
      <button type="button" aria-label={label} aria-pressed={state.active}
        aria-describedby={state.error ? 'fullscreen-status' : undefined}
        disabled={state.pending} title={state.available || state.active ? label : 'Fullscreen availability'}
        onClick={() => { void session.current?.toggle() }}>
        <span aria-hidden="true">{state.active ? '↙' : '⛶'}</span> {label}
      </button>
      {state.error && <p id="fullscreen-status" role="status">{state.error}</p>}
    </div>, host
  )
}
