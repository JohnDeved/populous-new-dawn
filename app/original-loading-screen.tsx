import { useEffect, useRef, useState } from 'react'

interface Props {
  phase: 'restore' | 'loading' | 'failed'
  error: string
  onRetry: () => void
}

// Loading identity comes from loadlog2 and the Western frontend slot-1 font.
// Browser checkpoint lookup and failure/retry are browser adaptations, not native dialogs.
export function OriginalLoadingScreen({ phase, error, onRetry }: Props) {
  const screen = useRef<HTMLDivElement>(null)
  const retry = useRef<HTMLButtonElement>(null)
  const retried = useRef(false)
  const [maskFailed, setMaskFailed] = useState(false)
  const [labelReady, setLabelReady] = useState(false)
  useEffect(() => {
    if (phase === 'failed') retry.current?.focus()
    else screen.current?.focus()
  }, [phase])
  return (
    <div
      ref={screen}
      className="loading-world loading-world-original"
      data-loading-phase={phase}
      data-mask-failed={maskFailed}
      data-label-ready={labelReady}
      role={phase === 'failed' ? 'dialog' : 'status'}
      aria-label={phase === 'failed' ? 'Browser loading recovery' : undefined}
      aria-modal={phase === 'failed' ? true : undefined}
      tabIndex={-1}
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        event.preventDefault()
        if (phase !== 'failed') return
        const controls = [
          ...(screen.current?.querySelectorAll<HTMLElement>('summary,button') ?? []),
        ]
        const current = controls.indexOf(document.activeElement as HTMLElement)
        const next = (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length
        controls[next]?.focus()
      }}
    >
      <div className="loading-original-art">
        {!maskFailed && (
          <img
            src="/original/loading-mask.png"
            width={130}
            height={161}
            alt=""
            onError={() => setMaskFailed(true)}
          />
        )}
        {phase !== 'failed' && (
          <span className="loading-original-label">
            <span className={labelReady ? 'loading-text-hidden' : undefined}>Loading...</span>
            <img
              src="/original/loading-label.png"
              width={82}
              height={20}
              alt=""
              hidden={!labelReady}
              onLoad={() => setLabelReady(true)}
              onError={() => setLabelReady(false)}
            />
          </span>
        )}
      </div>
      {phase === 'restore' && (
        <p className="loading-browser-note">Checking for a saved checkpoint in this browser.</p>
      )}
      {phase === 'failed' && (
        <section className="loading-recovery">
          <h2>Loading failed</h2>
          <p>The battlefield did not finish loading. Try again to retry the same request.</p>
          <details>
            <summary>Technical details</summary>
            <p>{error}</p>
          </details>
          <button
            ref={retry}
            onClick={() => {
              if (retried.current) return
              retried.current = true
              onRetry()
            }}
          >
            Try again
          </button>
          <p className="loading-recovery-note">Browser recovery</p>
        </section>
      )}
    </div>
  )
}
