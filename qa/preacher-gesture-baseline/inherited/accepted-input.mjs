const wrapped = v => ((v + 128) % 256 + 256) % 256 - 128
const near = (a, b, radius) => Math.hypot(wrapped(a.x - b.x), wrapped(a.z - b.z)) <= radius
const short = n => n << 16 >> 16
const markerCell = point => ({
  // Read-only equivalent of nativePosition → commandMarkerPoint → browserPosition.
  x: short(((Math.round((point.x + 8) * 256) & 0xfe00) + 256) - 2048) / 256,
  z: -short(((Math.round((-point.z - 8) * 256) & 0xfe00) + 256) + 2048) / 256,
})
export function acceptedOrderEvidence(before, after, hit) {
  if (!(after.lastOrderTurn > before.lastOrderTurn && after.lastOrderTurn >= before.turn &&
    after.pointerAck.until > before.pointerAck.until && after.pointerAck.target === (hit.id ?? 0)))
    throw Error('Missing fresh command dispatch and pointer acknowledgement')
  const intended = u => {
    // Model19 stores a packed landscape cell, never a building identity. Only the
    // shipped read-only lookup can tie that cell to the actual clicked building.
    if (u.order?.model === 19) return hit.collection === 'buildings' &&
      !(u.order.flags & 1) && u.attackBuildingId === hit.id
    return hit.id ? u.work === hit.id || u.target === hit.id || u.order?.a === hit.id :
      [3, 17, 31, 32].includes(u.order?.model) && near({
        x: short(u.order.a - 2048) / 256, z: -short(u.order.b + 2048) / 256,
      }, hit.point, 3)
  }
  const recipients = after.units.filter(u => before.selected.includes(u.id) && intended(u))
  if (!recipients.length) throw Error('No selected recipient carries the requested target')
  let marker = null
  if (!hit.id) {
    const cell = markerCell(hit.point)
    marker = after.effects.find(e => e.kind === 'orderMarker' &&
      !before.effects.some(old => old.id === e.id) && near(e, cell, 1 / 256))
    if (!marker && before.observation?.name === after.observation?.name)
      marker = after.observation?.orderMarkers.find(e =>
        e.cursor > before.observation.orderMarkerCursor &&
        e.commandTurn === after.lastOrderTurn && e.observedTurn >= e.commandTurn &&
        e.observedTurn <= after.turn && !before.effects.some(old => old.id === e.id) &&
        near(e, cell, 1 / 256))
    if (!marker) throw Error('No fresh ground marker at the requested cell')
  }
  const unchanged = recipients.every(u => {
    const old = before.units.find(old => old.id === u.id)
    return old && intended(old) && JSON.stringify([old.work, old.target, old.order, old.attackBuildingId]) ===
      JSON.stringify([u.work, u.target, u.order, u.attackBuildingId])
  })
  return { kind: unchanged ? 'fresh-input-existing-order' : 'fresh-input-new-order',
    recipientIds: recipients.map(u => u.id), marker }
}

