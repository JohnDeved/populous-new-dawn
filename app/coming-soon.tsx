import { useLayoutEffect, useRef, useState } from 'react'
import { createComingSoonSession, type TrailerPlayback } from './coming-soon-session'
import styles from './coming-soon.module.css'

export function ComingSoon({ onComplete }: { onComplete: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const playbackControl = useRef<HTMLButtonElement>(null)
  const session = useRef<ReturnType<typeof createComingSoonSession> | null>(null)
  const complete = useRef(onComplete)
  const [playback, setPlayback] = useState<TrailerPlayback>('playing')
  const [muted, setMuted] = useState(true)

  useLayoutEffect(() => {
    complete.current = onComplete
  }, [onComplete])

  useLayoutEffect(() => {
    const modal = dialog.current
    const media = video.current
    if (!modal || !media) return
    const playbackSession = createComingSoonSession(
      media,
      () => document.hidden,
      state => {
        // Keep key releases inside the modal before removing the focused control.
        if (state === 'failed' && document.activeElement === playbackControl.current)
          modal.focus()
        setPlayback(state)
      },
      () => complete.current()
    )
    session.current = playbackSession
    modal.showModal()
    modal.focus()
    media.src = '/original/coming-soon/trailer.webm'
    document.addEventListener('visibilitychange', playbackSession.visibilityChanged)
    window.addEventListener('blur', playbackSession.blur)
    playbackSession.play()
    return () => {
      session.current = null
      document.removeEventListener('visibilitychange', playbackSession.visibilityChanged)
      window.removeEventListener('blur', playbackSession.blur)
      playbackSession.dispose()
      modal.close()
    }
  }, [])

  let status = muted ? 'Coming Soon · sound off' : 'Coming Soon'
  let playbackAction = muted ? 'Enable trailer sound' : 'Mute trailer'
  if (playback === 'failed')
    status = 'The original trailer could not be played. You can return to the menu.'
  else if (playback === 'blocked') {
    status = 'Your browser paused the trailer.'
    playbackAction = 'Play trailer'
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-label="Coming Soon trailer"
      data-coming-soon
      data-playback={playback}
      tabIndex={-1}
      onCancel={event => {
        event.preventDefault()
        event.stopPropagation()
        session.current?.stop()
      }}
      onKeyDown={event => {
        event.stopPropagation()
        if (event.key === 'Tab') return
        if (event.repeat) {
          event.preventDefault()
          return
        }
        const control =
          (event.target as Element).closest('button') &&
          (event.key === 'Enter' || event.key === ' ')
        if (!control) event.preventDefault()
        session.current?.hold(`key:${event.code || event.key}`, !control)
      }}
      onKeyUp={event => {
        event.stopPropagation()
        if (session.current?.isExiting()) event.preventDefault()
        session.current?.release(`key:${event.code || event.key}`)
      }}
      onPointerDown={event => {
        event.stopPropagation()
        if (event.button < 0 || event.button > 3) return
        const control = (event.target as Element).closest('button')
        session.current?.hold(`pointer:${event.pointerId}`, !control)
        if (!control) {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
        }
      }}
      onPointerUp={event => {
        event.stopPropagation()
        if (session.current?.isExiting()) event.preventDefault()
        session.current?.release(`pointer:${event.pointerId}`)
      }}
      onPointerCancel={event => {
        event.stopPropagation()
        session.current?.release(`pointer:${event.pointerId}`)
      }}
      onLostPointerCapture={event => {
        event.stopPropagation()
        session.current?.release(`pointer:${event.pointerId}`)
      }}
      onClick={event => event.stopPropagation()}
      onPointerMove={event => event.stopPropagation()}
      onPointerLeave={event => event.stopPropagation()}
      onContextMenu={event => {
        event.preventDefault()
        event.stopPropagation()
      }}
    >
      <video
        ref={video}
        className={styles.video}
        muted={muted}
        playsInline
        preload="auto"
        aria-label="Original Populous Coming Soon trailer"
        onEnded={() => session.current?.stop()}
        onError={() => session.current?.fail()}
      />
      <div className={styles.controls}>
        <p role="status">{status}</p>
        {playback !== 'failed' && (
          <button
            ref={playbackControl}
            type="button"
            onClick={() => {
              if (playback === 'blocked') session.current?.play()
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
        <button type="button" onClick={() => session.current?.stop()}>
          Skip trailer
        </button>
      </div>
    </dialog>
  )
}
