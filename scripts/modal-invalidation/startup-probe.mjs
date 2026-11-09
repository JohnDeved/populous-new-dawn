// Serialized into the page. This probe only reads bound owners and listens to
// the existing public button; it never dispatches input or alters gameplay.
export function observeStartup(owners) {
  if (owners.startupProbe) throw Error('Startup observation already installed')
  const control = document.querySelector('button.skip-introduction')
  const report = { timeOrigin: performance.timeOrigin, clicks: [], extraClicks: 0, samples: 0, errors: [], closed: false, listeners: 0 }
  const number = value => Number.isFinite(value) ? value : null
  const state = () => {
    const store = window.testStore, world = store.getWorld(), scene = window.testSceneRef.current, skip = document.querySelector('button.skip-introduction'), flyby = world.flyby
    return { pageNowMs: performance.now(), ownerUnchanged: store === owners.store && world === owners.world && scene === owners.scene && scene.world === world,
      inputMask: world.inputMask, level: world.outcome.level, cheats: store.hasUsedCheats(), paused: world.paused,
      skipVisible: !!skip && skip.getClientRects().length > 0 && getComputedStyle(skip).visibility !== 'hidden' && !skip.disabled,
      controlUnchanged: skip === control, controlPresent: !!skip, boundControlConnected: control?.isConnected === true, documentVisibility: document.visibilityState, modalSuspended: scene.modalSuspended,
      flyby: flyby ? { flags: number(flyby.flags), warmup: number(flyby.warmup), frameRate: number(flyby.frameRate),
        frame: number(flyby.frame), cursor: number(flyby.cursor), eventCount: flyby.events?.length ?? null,
        tracks: [1, 2, 3].map(index => { const track = flyby.tracks?.[index]; return track ?
          { index, active: track.active === true, frame: number(track.frame), duration: number(track.duration) } : { index, unavailable: true } }) } : null }
  }
  const sample = phase => {
    try {
      const value = state(); report.samples++; report.latest = { phase, ...value }
      if (phase === 'unlock-poll') report.lastPoll = report.latest
      return value
    }
    catch (error) { if (report.errors.length < 4) report.errors.push(String(error).slice(0, 256)); return null }
  }
  const events = new WeakMap()
  const capture = event => {
    if (report.closed) return
    if (report.clicks.length >= 4) { report.extraClicks++; return }
    const click = { sequence: report.clicks.length + 1, targetMatched: !!control && event.target?.closest?.('button.skip-introduction') === control, trusted: event.isTrusted === true, eventTimeStampMs: number(event.timeStamp),
      button: number(event.button), detail: number(event.detail), clientX: number(event.clientX), clientY: number(event.clientY),
      capture: sample('click-capture'), bubble: null }
    report.clicks.push(click); events.set(event, click)
  }
  const bubble = event => {
    const click = events.get(event)
    if (!report.closed && click && !click.bubble) click.bubble = sample('click-window-bubble')
  }
  owners.startupProbe = { report, sample, close() {
    if (!report.closed) {
      window.removeEventListener('click', capture, true); window.removeEventListener('click', bubble, false)
      report.listeners = 0; report.final = sample('final-diagnostic'); report.closed = true
    }
    return report
  } }
  window.addEventListener('click', capture, { capture: true, passive: true }); report.listeners++
  window.addEventListener('click', bubble, { capture: false, passive: true }); report.listeners++
  const initial = sample('initial'); report.initial = initial
  if (initial?.inputMask) {
    const rect = control?.getBoundingClientRect(), x = (rect?.left + rect?.right) / 2, y = (rect?.top + rect?.bottom) / 2
    const inViewport = Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x < innerWidth && y < innerHeight
    const hit = inViewport ? document.elementFromPoint(x, y) : null
    initial.publicClickTarget = { x: number(x), y: number(y), inViewport,
      positiveArea: !!rect && rect.width > 0 && rect.height > 0,
      finiteGeometry: !!rect && [rect.left, rect.right, rect.top, rect.bottom, rect.width, rect.height].every(Number.isFinite),
      notInert: !!control && !control.closest('[inert]'),
      unique: document.querySelectorAll('button.skip-introduction').length === 1,
      connected: control?.isConnected === true, hitMatchesControl: !!control && hit?.closest?.('button.skip-introduction') === control }
  }
  if (!initial) throw Error('Initial bound startup observation unavailable')
  return initial
}

export function closeStartupProbe(owners) {
  return owners.startupProbe?.close() ?? { status: 'not-installed', closed: true, listeners: 0 }
}
