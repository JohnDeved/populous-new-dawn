import { useCallback, useLayoutEffect, useRef, useSyncExternalStore, type PointerEvent } from 'react'
import { HelpArticleSurface } from './help-article'
import { HelpNavigation } from './help-navigation'
import { HelpScrollbar } from './help-scrollbar'
import type { HelpNavigationAction } from './help-controls'
import type { BrowserHelpArticleOwner } from './help-browser-article'

/** Unused by Home/Scene. Caller owns navigation/session, native pointer mapping,
 * complete knowledge and draw cadence. Mount one surface for one owner; unmount
 * disposes it. A replacement scene needs a fresh owner, never a revived instance. */
export function BrowserHelpArticleSurface({ owner, nativeY, onNavigate, onPosition, onFailure }: {
  owner: BrowserHelpArticleOwner
  nativeY: (event: PointerEvent<HTMLElement>) => number
  onNavigate: (action: HelpNavigationAction | number) => void
  onPosition: (position: number) => void
  onFailure: (error: unknown) => void
}) {
  const state = useSyncExternalStore(owner.subscribe, owner.getSnapshot, owner.getSnapshot)
  const surface = useRef<HTMLDivElement>(null)
  const previewSlot = useRef<HTMLDivElement>(null)
  const failure = useCallback((error: unknown) => {
    owner.invalidate('help-article-asset-failed')
    onFailure(error)
  }, [owner, onFailure])
  useLayoutEffect(() => owner.mount(), [owner])
  useLayoutEffect(() => {
    const slot = previewSlot.current
    if (!slot || !surface.current || state.status !== 'presented') return
    owner.attach(state, surface.current, slot)
  }, [owner, state])
  if (state.status !== 'presented') return null
  const navigate = (action: HelpNavigationAction | number) => {
    if (owner.isCurrent(state)) onNavigate(action)
  }
  const position = (next: number) => {
    if (owner.isCurrent(state)) onPosition(next)
  }
  return (
    <div ref={surface} data-browser-help-host="inactive-composition"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={state.snapshot.frame.articleStyle}>
        <HelpArticleSurface document={state.document} discovery={state.discovery}
          offset={state.offset} onNavigate={navigate} onFailure={failure}
          preview={<div ref={previewSlot} aria-hidden="true" data-help-full-frame-preview=""
            style={{ position: 'absolute', left: 0, top: 0, width: state.snapshot.frame.width,
              height: state.snapshot.frame.height, pointerEvents: 'none' }} />}
          controls={<>
            <HelpNavigation document={state.document} draw={state.controls}
              onNavigate={navigate} onFailure={failure} />
            <HelpScrollbar document={state.document} position={state.position}
              controller={owner.scrollController} nativeY={event => {
                if (!owner.isCurrent(state)) throw new Error('Stale Help pointer mapping')
                return nativeY(event)
              }} hoverPoint={state.hoverPoint} onPosition={position} onFailure={failure} />
          </>} />
      </div>
    </div>
  )
}
