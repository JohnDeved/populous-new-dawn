export type TrailerPlayback = 'playing' | 'blocked' | 'failed'

type TrailerMedia = Pick<HTMLVideoElement, 'play' | 'pause' | 'load' | 'removeAttribute' | 'error'>

// One modal owns one session. Browser input release protection is deliberately
// separate from the original player's current-clip stop-on-down behavior.
export function createComingSoonSession(
  media: TrailerMedia,
  hidden: () => boolean,
  onPlayback: (state: TrailerPlayback) => void,
  onComplete: () => void
) {
  const held = new Set<string>()
  let active = true
  let exiting = false
  let completed = false
  let failed = false
  let request = 0

  function pause() {
    request++
    media.pause()
  }

  function finish() {
    if (!active || completed || !exiting || held.size) return
    completed = true
    onComplete()
  }

  function stop() {
    if (!active || completed) return
    exiting = true
    pause()
    finish()
  }

  function fail() {
    if (!active || completed || exiting) return
    failed = true
    pause()
    onPlayback('failed')
  }

  function play() {
    if (!active || completed || exiting || failed || hidden()) return
    const current = ++request
    const currentRequest = () =>
      active && !completed && !exiting && !failed && !hidden() && current === request
    const refused = () => {
      if (!currentRequest()) return
      if (media.error) fail()
      else onPlayback('blocked')
    }
    try {
      void media.play().then(() => {
        if (currentRequest()) onPlayback('playing')
      }, refused)
    } catch {
      refused()
    }
  }

  return {
    play,
    stop,
    fail,
    hold(input: string, skip: boolean) {
      if (!active || completed) return
      held.add(input)
      if (skip) stop()
    },
    release(input: string) {
      const consume = exiting
      held.delete(input)
      finish()
      return consume
    },
    isExiting: () => exiting,
    visibilityChanged() {
      if (!active || completed) return
      if (hidden()) pause()
      else play()
    },
    blur() {
      // A browser/window focus interruption can lose matching up events. It
      // must not leave an already-stopped movie trapping the user indefinitely.
      held.clear()
      finish()
    },
    dispose() {
      if (!active) return
      active = false
      held.clear()
      pause()
      media.removeAttribute('src')
      media.load()
    },
  }
}
