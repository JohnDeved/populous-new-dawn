/** Browser-only compatibility control; never enters fullscreen without activation. */
export type FullscreenState = { active: boolean; available: boolean; pending: boolean; error: string }

export function createFullscreenSession(
  doc: Document,
  win: Window,
  update: (state: FullscreenState) => void,
  now: () => number = () => performance.now()
) {
  let alive = true
  let pending = false
  let error = ''
  let wasActive = Boolean(doc.fullscreenElement)
  let exitUntil = -Infinity
  let escapeHeld = false
  const active = () => Boolean(doc.fullscreenElement)
  const available = () => Boolean(doc.fullscreenEnabled && doc.documentElement.requestFullscreen)
  const publish = () => {
    if (alive) update({ active: active(), available: available(), pending, error })
  }
  const changed = () => {
    if (!wasActive && active()) promoteFullscreenDialogs(doc)
    if (wasActive && !active()) exitUntil = now() + 250
    wasActive = active()
    error = ''
    publish()
  }
  const failed = () => {
    error = 'Fullscreen was blocked by the browser. You can try again or use its View menu.'
    publish()
  }
  const escape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    if (active() || now() < exitUntil || escapeHeld) {
      // Do not preventDefault: the browser must still handle its native exit key.
      // Stop only application handlers, including document-capture modal handlers.
      event.stopImmediatePropagation()
      escapeHeld = event.type === 'keydown'
    }
  }
  const cancel = (event: Event) => {
    if (active() || now() < exitUntil || escapeHeld) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }
  const blur = () => { escapeHeld = false }
  doc.addEventListener('fullscreenchange', changed)
  doc.addEventListener('fullscreenerror', failed)
  win.addEventListener('keydown', escape, { capture: true })
  win.addEventListener('keyup', escape, { capture: true })
  win.addEventListener('cancel', cancel, { capture: true })
  win.addEventListener('blur', blur)
  publish()
  return {
    async toggle() {
      if (!alive || pending) return
      error = ''
      if (!active() && !available()) {
        error = 'Fullscreen is unavailable here. Try your browser’s View menu.'
        publish()
        return
      }
      pending = true
      publish()
      try {
        // Invoke synchronously within the button's trusted click, before awaiting.
        if (active()) await doc.exitFullscreen()
        else await doc.documentElement.requestFullscreen()
      } catch {
        failed()
      } finally {
        pending = false
        publish()
      }
    },
    dispose() {
      alive = false
      doc.removeEventListener('fullscreenchange', changed)
      doc.removeEventListener('fullscreenerror', failed)
      win.removeEventListener('keydown', escape, { capture: true })
      win.removeEventListener('keyup', escape, { capture: true })
      win.removeEventListener('cancel', cancel, { capture: true })
      win.removeEventListener('blur', blur)
    },
  }
}

/** Keep browser controls in existing menus/loading, never over the battlefield.
 * Detach the portal, not the session: browser Escape and pending state still work. */
export function placeFullscreenHost(doc: Document, host: HTMLElement) {
  const dialogs = doc.querySelectorAll<HTMLDialogElement>('dialog[open]')
  const target = dialogs[dialogs.length - 1] ??
    (doc.querySelector('.loading-world') ? doc.body : null)
  if (host.parentElement === target) return
  const focused = host.contains(doc.activeElement) ? doc.activeElement as HTMLElement : null
  if (!target) {
    host.remove()
    // Closing a dialog normally restores its own trigger. Only transfer focus
    // when the removed portal still owns it; never steal a newer owner's focus.
    if (focused) doc.querySelector<HTMLElement>('.world-viewport')?.focus({ preventScroll: true })
    return
  }
  target.appendChild(host)
  focused?.focus({ preventScroll: true })
}

/** Fullscreen promotes html above existing top-layer entries. Re-promote only
 * actual modals, retaining their panel DOM and focus; the app has no close handlers.
 * Newly opened dialogs already enter above html and need no intervention. */
export function promoteFullscreenDialogs(doc: Document) {
  const dialogs = [...doc.querySelectorAll<HTMLDialogElement>('dialog:modal')]
  const focused = doc.activeElement as HTMLElement | null
  const scroll = dialogs.flatMap(dialog => [dialog, ...dialog.querySelectorAll<HTMLElement>('*')])
    .filter(element => element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth)
    .map(element => ({ element, top: element.scrollTop, left: element.scrollLeft }))
  for (const dialog of dialogs) {
    dialog.close()
    dialog.showModal()
  }
  if (dialogs.some(dialog => dialog.contains(focused))) focused?.focus({ preventScroll: true })
  for (const { element, top, left } of scroll) {
    element.scrollTop = top
    element.scrollLeft = left
  }
}

/** Dialogs in the shipped app are direct children of the shell. Ignore ordinary
 * HUD text/list updates; only modal/loading changes or removal of our host need a scan. */
export function fullscreenHostNeedsPlacement(records: MutationRecord[], host: HTMLElement) {
  return records.some(record =>
    record.type === 'attributes'
      ? record.target.nodeName === 'DIALOG'
      : [...record.addedNodes, ...record.removedNodes].some(node =>
          node.nodeName === 'DIALOG' || node.contains(host) ||
          (node.nodeType === 1 && (node as Element).matches('.loading-world'))
        )
  )
}
