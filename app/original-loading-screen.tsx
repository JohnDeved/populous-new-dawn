import { useEffect, useRef, useState } from 'react'
import art from './original-loading-art.json' with { type: 'json' }

// Critical splash geometry travels with the document, not a later stylesheet.
const loadingStyle = `.loading-world{position:fixed;inset:0;background:#000;color:#fff;z-index:31;text-align:center;outline:none}
.loading-original-art{position:absolute;left:round(down,calc((100% - 130px)/2),1px);top:round(down,calc((100% - 161px)/2),1px);width:130px;height:161px;flex:none}
.loading-original-art>img{display:block;width:130px;height:161px;max-width:none;image-rendering:pixelated}
.loading-original-label{position:absolute;left:calc(round(down,calc((100vw - 81px)/2),1px) - round(down,calc((100vw - 130px)/2),1px));top:-26px;width:82px;height:20px;white-space:nowrap;font:14px/20px Arial,sans-serif}
.loading-original-label img{position:absolute;inset:0;width:82px;height:20px;max-width:none;image-rendering:pixelated}
.loading-text-hidden{position:absolute;width:1px;height:1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`

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
  const [labelFailed, setLabelFailed] = useState(false)
  const maskImage = useRef<HTMLImageElement>(null)
  const labelImage = useRef<HTMLImageElement>(null)
  useEffect(() => {
    // Image events can precede hydration. Recover their actual state, not a timer.
    if (maskImage.current?.complete && !maskImage.current.naturalWidth) setMaskFailed(true)
    if (labelImage.current?.complete) {
      setLabelReady(labelImage.current.naturalWidth > 0)
      setLabelFailed(!labelImage.current.naturalWidth)
    }
  }, [])
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
      <style>{loadingStyle}</style>
      <div className="loading-original-art">
        {!maskFailed && (
          <img
            ref={maskImage}
            src={art.mask.src}
            width={130}
            height={161}
            alt=""
            loading="eager"
            fetchPriority="high"
            onError={() => setMaskFailed(true)}
          />
        )}
        {phase !== 'failed' && (
          <span className="loading-original-label">
            <span className={labelFailed ? undefined : 'loading-text-hidden'}>Loading...</span>
            <img
              ref={labelImage}
              src={art.label.src}
              width={82}
              height={20}
              alt=""
              loading="eager"
              fetchPriority="high"
              hidden={labelFailed}
              onLoad={() => setLabelReady(true)}
              onError={() => {
                setLabelReady(false)
                setLabelFailed(true)
              }}
            />
          </span>
        )}
      </div>
      {phase === 'restore' && (
        <p className="loading-text-hidden">Checking for a saved checkpoint in this browser.</p>
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
