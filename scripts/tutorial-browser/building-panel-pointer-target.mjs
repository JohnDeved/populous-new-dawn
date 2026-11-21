// Serialized directly by page.evaluate. Immediate target/event observations,
// never scrolling, focus, paint, synthetic input, polling, or a hold receipt.
// The caller must exclusively serialize mouse input on this page. A trusted
// event alone cannot identify its Playwright command; no supplied flag proves it.
export function observeBuildingPanelPointerTarget() {
  const previous = window.buildingIdentity.pointerTargetBefore
  if (previous) throw Error('Pointer observation is already armed or awaiting consumption')
  const readTarget = () => {
    const h = window.buildingIdentity, p = h.panel
    const visible = element => {
      const style = getComputedStyle(element)
      return style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse' &&
        [...element.getClientRects()].some(rect => rect.width > 0 && rect.height > 0)
    }
    const panels = [...document.querySelectorAll('.tower-panel:not([hidden])')].filter(visible)
    if (!p.isConnected || p.hidden || h.scene.buildingPanels.get(h.building.id) !== p ||
        !visible(p) || panels.length !== 1 || panels[0] !== p ||
        h.building.team !== 'blue' || !h.scene.visible(h.building) || h.scene.navigationButtons() !== 0)
      throw Error('Pointer target requires the already-open current eligible panel')
    const { left, top, width, height } = p.getBoundingClientRect(),
      viewportWidth = window.innerWidth, viewportHeight = window.innerHeight,
      x = left + width / 2, y = top + height / 2
    if (![left, top, width, height, x, y, viewportWidth, viewportHeight].every(Number.isFinite) ||
        width <= 0 || height <= 0 || viewportWidth <= 0 || viewportHeight <= 0 ||
        x <= left || x >= left + width || y <= top || y >= top + height ||
        x <= 0 || y <= 0 || x >= viewportWidth || y >= viewportHeight)
      throw Error('Pointer target requires finite positive geometry and an in-viewport center')
    const hit = document.elementFromPoint(x, y)
    if (!hit || (hit !== p && !p.contains(hit)))
      throw Error('Pointer target is occluded or has no panel hit')
    return { identity: h, panel: p, building: h.building, buildingId: h.building.id, scene: h.scene,
      left, top, width, height, x, y, viewportWidth, viewportHeight }
  }
  const expected = readTarget(), keys = Object.keys(expected)
  const receipts = expected.identity.pointerTargetReceipts ??= []
  if (receipts.length >= 2) throw Error('Pointer receipt episode arm bound exceeded')
  const receipt = { schema: 'building-pointer-delivery-v1', ordinal: receipts.length + 1,
    buildingId: expected.buildingId,
    requested: Object.fromEntries(['x', 'y', 'left', 'top', 'width', 'height', 'viewportWidth', 'viewportHeight'].map(key => [key, expected[key]])),
    event: null, status: 'awaiting-event', error: null }
  receipts.push(receipt)
  expected.receipt = receipt
  const moved = event => {
    // A wrong first event remains fatal. Later hover or another move cannot
    // repair it, including a panel moving away at input and returning afterward.
    expected.received = false
    try {
      receipt.event = { clientX: Number.isFinite(event.clientX) ? event.clientX : null,
        clientY: Number.isFinite(event.clientY) ? event.clientY : null,
        finiteCoordinates: Number.isFinite(event.clientX) && Number.isFinite(event.clientY),
        isTrusted: event.isTrusted === true, pointerType: typeof event.pointerType === 'string' ? event.pointerType : null,
        targetWithinPanel: event.target === expected.panel || expected.panel.contains(event.target) }
      const current = readTarget()
      if (event.isTrusted !== true || event.pointerType !== 'mouse')
        throw Error('Pointer target received an untrusted or non-mouse event')
      if (event.clientX !== expected.x || event.clientY !== expected.y)
        throw Error('Pointer target received unexpected event coordinates')
      if (event.target !== expected.panel && !expected.panel.contains(event.target))
        throw Error('Pointer target received an event for another element')
      if (!keys.every(key => current[key] === expected[key]))
        throw Error('Pointer target changed at input delivery')
      expected.received = true
      receipt.status = 'accepted'
    } catch (error) {
      expected.eventError = String(error)
      receipt.status = 'rejected'; receipt.error = expected.eventError
    }
  }
  expected.stop = () => {
    document.removeEventListener('pointermove', moved, true)
    if (expected.identity.pointerTargetBefore === expected)
      delete expected.identity.pointerTargetBefore
  }
  document.addEventListener('pointermove', moved, { capture: true, once: true })
  expected.identity.pointerTargetBefore = expected
  return { x: expected.x, y: expected.y }
}
