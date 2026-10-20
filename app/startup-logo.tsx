import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './startup-logo.module.css'

const source = '/original/startup/blogo.webm'

// Only the boot logo. New Game's language-selected intro is a separate native
// caller; neither it nor the mission camera introduction belongs in this stage.
export function StartupLogo({ onComplete }: { onComplete: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const completed = useRef(false)
  const pointer = useRef<number | null>(null)
  const [playback, setPlayback] = useState<'playing' | 'blocked' | 'failed'>('playing')
  const [muted, setMuted] = useState(true)
  const complete = useCallback(() => {
    if (completed.current) return
    completed.current = true
    video.current?.pause()
    onComplete()
  }, [onComplete])

  useEffect(() => {
    const modal = dialog.current
    const media = video.current
    if (!modal || !media) return
    let active = true
    completed.current = false
    pointer.current = null
    modal.showModal()
    modal.focus()
    media.src = source
    const play = () => {
      if (document.hidden || completed.current || pointer.current !== null) return
      void media.play().then(
        () => {
          if (active && !completed.current) setPlayback('playing')
        },
        () => {
          if (active && !completed.current && !document.hidden && pointer.current === null)
            setPlayback(media.error ? 'failed' : 'blocked')
        }
      )
    }
    const visibility = () => {
      if (document.hidden) media.pause()
      else play()
    }
    document.addEventListener('visibilitychange', visibility)
    play()
    return () => {
      active = false
      completed.current = true
      document.removeEventListener('visibilitychange', visibility)
      media.pause()
      media.removeAttribute('src')
      media.load()
      modal.close()
    }
  }, [])

  function playFromControl() {
    const media = video.current
    if (!media || completed.current) return
    // This explicit browser control supplies user activation when autoplay was
    // refused. It does not restart the clip or change the game's saved volume.
    setPlayback('playing')
    void media.play().catch(() => {
      if (!completed.current) setPlayback(media.error ? 'failed' : 'blocked')
    })
  }

  let status = muted ? 'Opening logo · sound off' : 'Opening logo'
  let playbackAction = muted ? 'Enable logo sound' : 'Mute logo'
  if (playback === 'failed')
    status = 'The opening logo could not be played. You can continue to the menu.'
  else if (playback === 'blocked') {
    status = 'Your browser paused the opening logo.'
    playbackAction = 'Play logo'
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Opening logo"
      data-startup-logo
      tabIndex={-1}
      onCancel={event => {
        event.preventDefault()
        complete()
      }}
      onKeyDown={event => {
        // Keep the two browser compatibility controls keyboard-accessible.
        if (event.key === 'Tab') return
        event.preventDefault()
        event.stopPropagation()
        // DirectInput reports state changes, not browser character repeats.
        if (!event.repeat) complete()
      }}
      onPointerDown={event => {
        if (event.button < 0 || event.button > 3) return
        event.preventDefault()
        video.current?.pause()
        pointer.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerUp={event => {
        if (event.pointerId !== pointer.current) return
        event.preventDefault()
        // Stop on down, then absorb its release before revealing clickable menu
        // rows. This click-through protection is a browser adaptation.
        complete()
      }}
      onPointerCancel={event => {
        if (event.pointerId === pointer.current) complete()
      }}
      onContextMenu={event => event.preventDefault()}
    >
      <div className={styles.frame}>
        <video
          ref={video}
          className={styles.video}
          muted={muted}
          playsInline
          preload="auto"
          aria-label="Original Bullfrog opening logo"
          onEnded={complete}
          onError={() => {
            if (!completed.current) setPlayback('failed')
          }}
        />
      </div>
      <div className={styles.controls}>
        <p role="status">{status}</p>
        {playback !== 'failed' && (
          <button
            onPointerDown={event => event.stopPropagation()}
            onPointerUp={event => event.stopPropagation()}
            onKeyDown={event => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.stopPropagation()
              if (event.repeat) event.preventDefault()
            }}
            onClick={() => {
              if (playback === 'blocked') playFromControl()
              else {
                const next = !muted
                if (video.current) video.current.muted = next
                setMuted(next)
              }
            }}
          >
            {playbackAction}
          </button>
        )}
        <button onClick={complete}>Skip logo</button>
      </div>
    </dialog>
  )
}
