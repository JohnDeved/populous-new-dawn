import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckpointScrollArea } from './checkpoint-scroll-area'
import { captureLoadingFocus } from './loading-focus'
import art from './original-loading-art.json' with { type: 'json' }
import frontend from './original-frontend.json'

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

// Recovery is browser-only. Use the original gold label bank on the black clear,
// at its own glyph dimensions; arbitrary diagnostic text stays outside the atlas.
function RecoveryText({ text, ready }: { text: string; ready: boolean }) {
  const bank = frontend.banks.felo33we
  const supported = [...text].every(letter => bank.rects[letter.codePointAt(0)! - 32])
  const bitmap = ready && supported
  return (
    <>
      <span className={bitmap ? 'loading-text-hidden' : 'loading-recovery-fallback'}>{text}</span>
      {bitmap && (
        <span className="loading-recovery-text" aria-hidden="true">
          {text.split(' ').map((word, wordIndex, words) => (
            <span className="loading-recovery-word" key={wordIndex}>
              {[...(word + (wordIndex < words.length - 1 ? ' ' : ''))].map((letter, index) => {
                const glyph = bank.rects[letter.codePointAt(0)! - 32]
                return (
                  <i
                    key={index}
                    style={{
                      width: glyph.w,
                      height: glyph.h,
                      backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
                    }}
                  />
                )
              })}
            </span>
          ))}
        </span>
      )}
    </>
  )
}

// Pending/restore keep their exact wrapper-free first paint. Only failed recovery
// mounts the existing decoded-art scroll controller; retry ownership is unchanged.
function RecoveryFrame({ failed, children }: { failed: boolean; children: ReactNode }) {
  return failed ? <CheckpointScrollArea purpose="loading">{children}</CheckpointScrollArea> : <>{children}</>
}

// Loading identity comes from loadlog2 and the Western frontend slot-1 font.
// Browser checkpoint lookup and failure/retry are browser adaptations, not native dialogs.
export function OriginalLoadingScreen({ phase, error, onRetry }: Props) {
  const screen = useRef<HTMLDivElement>(null)
  const retry = useRef<HTMLButtonElement>(null)
  const retried = useRef(false)
  const retrySpacePressed = useRef(false)
  const [maskFailed, setMaskFailed] = useState(false)
  const [labelReady, setLabelReady] = useState(false)
  const [labelFailed, setLabelFailed] = useState(false)
  const [recoveryFontsReady, setRecoveryFontsReady] = useState(false)
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
  useEffect(() => {
    if (phase !== 'failed') return
    let active = true
    void Promise.all(
      ['felo33we', 'fehi33we'].map(async name => {
        const image = new Image()
        image.src = `/original/frontend/${name}.png`
        await image.decode()
      })
    )
      .then(() => {
        if (active) setRecoveryFontsReady(true)
      })
      .catch(() => {}) // Readable recovery must survive unavailable font artwork.
    return () => {
      active = false
    }
  }, [phase])
  useEffect(() => {
    const root = screen.current
    if (root) return captureLoadingFocus(document, root)
  }, [])
  function requestRetry() {
    if (retried.current) return
    retried.current = true
    onRetry()
  }
  const content = (
    <>
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
          <h2>
            <RecoveryText text="Loading failed" ready={recoveryFontsReady} />
          </h2>
          <p>
            <RecoveryText
              text="The battlefield did not finish loading. Try again to retry the same request."
              ready={recoveryFontsReady}
            />
          </p>
          <details>
            <summary>
              <RecoveryText text="Technical details" ready={recoveryFontsReady} />
            </summary>
            <p className="loading-recovery-error">{error}</p>
          </details>
          <button
            ref={retry}
            onKeyDown={event => {
              if (event.key === 'Enter' && event.repeat) event.preventDefault()
              if (event.key !== ' ') return
              // Space activates on release, but only a fresh press on this
              // presentation owns that release. Loading may replace the button.
              event.preventDefault()
              if (!event.repeat) retrySpacePressed.current = true
            }}
            onKeyUp={event => {
              if (event.key !== ' ') return
              event.preventDefault()
              const pressed = retrySpacePressed.current
              retrySpacePressed.current = false
              if (pressed) requestRetry()
            }}
            onBlur={() => {
              retrySpacePressed.current = false
            }}
            onClick={requestRetry}
          >
            <RecoveryText text="Try again" ready={recoveryFontsReady} />
          </button>
          <p className="loading-recovery-note">
            <RecoveryText text="Browser recovery" ready={recoveryFontsReady} />
          </p>
        </section>
      )}
    </>
  )
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
    >
      <style>{loadingStyle}</style>
      <RecoveryFrame failed={phase === 'failed'}>{content}</RecoveryFrame>
    </div>
  )
}
