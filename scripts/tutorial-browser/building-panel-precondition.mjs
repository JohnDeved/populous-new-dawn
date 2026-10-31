import assert from 'node:assert/strict'

// Serialized directly by page.evaluate: immediate observation, no polling or repair.
export function readCurrentBuildingPanel() {
  const h = window.buildingIdentity, panel = h.panel
  const visible = element => {
    const style = getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse' &&
      [...element.getClientRects()].some(rect => rect.width > 0 && rect.height > 0)
  }
  const visiblePanels = [...document.querySelectorAll('.tower-panel:not([hidden])')].filter(visible)
  return {
    connected: panel.isConnected,
    hidden: panel.hidden,
    current: h.scene.buildingPanels.get(h.building.id) === panel,
    visible: visible(panel),
    uniqueVisibleCurrent: visiblePanels.length === 1 && visiblePanels[0] === panel,
  }
}

export function assertCurrentBuildingPanel(state) {
  assert.deepEqual(state, { connected: true, hidden: false, current: true,
    visible: true, uniqueVisibleCurrent: true }, 'Held case requires the already-open current panel; no reopening repair')
}
