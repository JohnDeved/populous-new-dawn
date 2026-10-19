import assert from 'node:assert/strict'

export const vaultLowWorkLimit = target => {
  assert(Number.isInteger(target) && target >= 4)
  // Actual work advances once per four fixed turns. Reserve at least three
  // quarters of this authored goal, and verify at the actual pointer boundary.
  return Math.floor(target / 4)
}
export function assertVaultPrayerHealth(s, shamanId) {
  assert(s.current && s.level === 3 && s.status === 'playing' && s.speed === 1)
  assert.equal(s.paused, false)
  assert.equal(s.inputMask, 0)
  assert(s.shaman?.id === shamanId && s.shaman.kind === 'shaman' && s.shaman.team === 'blue' && s.shaman.hp > 0)
  assert.equal(s.trained, 0)
  assert.equal(s.cast, 0)
}
export function assertVaultVisible(s) {
  assert(s.record?.automatic && s.record.phase === 1 && s.latch)
  assert(s.head.followers > 0 && s.head.work > 0 && s.head.work < s.head.target)
  assert(s.dom.present && s.dom.connected && !s.dom.hidden && s.dom.width > 0 && s.dom.height > 0)
  assert(s.offTarget && !s.dom.hovered && !s.dom.focused && s.inspected !== s.head.id)
  assert.equal(s.dom.visibleButtons, 0, 'Vault slots remain display-only')
  assert.match(s.dom.label, /shaman learning; \d+% complete/)
}
export const vaultReleased = s => !s.record && !s.latch && !s.dom.present && s.reservations === 0

export function assertVaultPanelAnchor(sample) {
  assert(sample.dom?.connected && !sample.dom.hidden && !sample.camera.overview)
  assert.deepEqual(sample.socket, { x: 58112, y: 32000, heightOffset: 480 })
  assert(sample.width > 0 && sample.height > 0 && sample.scale > 0)
  const close = (a, b) => {
    for (const axis of ['x', 'y'])
      assert(Number.isFinite(a[axis]) && Number.isFinite(b[axis]) && Math.abs(a[axis] - b[axis]) <= 1 / 16,
        `Vault DOM ${axis} must match source socket0 within a CSS layout subpixel`)
  }
  const source = sample.expected.socket0
  for (const point of Object.values(sample.expected)) close(point.raw, point.clamped)
  close(sample.dom.inline, source.raw)
  close(sample.dom.tail, source.raw)
  for (const name of ['legacy', 'reward'])
    assert(Math.hypot(source.raw.x - sample.expected[name].raw.x,
      source.raw.y - sample.expected[name].raw.y) > 1, `${name} must be distinguishable from socket0`)
}

export function assertVaultPanelAnchorBracket(before, after) {
  assertVaultPanelAnchor(before)
  assertVaultPanelAnchor(after)
  for (const key of ['head', 'socket', 'ground', 'renderer', 'container', 'scale', 'width', 'height', 'camera', 'expected', 'dom'])
    assert.deepEqual(after[key], before[key], `Vault screenshot ${key} drifted`)
  assert(after.turn >= before.turn && after.animationFrame >= before.animationFrame)
}

export function assertVaultUninspectedCommand(row, targetId) {
  assert(row?.kind === 'input' && row.trusted && row.button === 0)
  assert.equal(row.after.shaman.order?.model, 33)
  for (const s of [row.before, row.after]) {
    assert(vaultReleased(s), 'Command33 must not create or reuse a manually opened Vault panel')
    assert(s.inspected !== targetId && !s.dom.focused && !s.dom.hovered)
  }
}

export function assertVaultPrayerEpisode(evidence, targetId, shamanId) {
  assert(evidence.closed && !evidence.overflow && !evidence.disposed)
  assert.deepEqual(evidence.errors, [])
  const rows = evidence.records, requests = rows.filter(row => row.kind === 'request')
  assert(requests.length > 0)
  for (const row of requests) {
    assert(row.receiverMatches && !row.threw)
    assert.equal(row.after.turn, row.before.turn)
    assert.deepEqual(row.after.head, row.before.head, 'Request precedes the cached-count/work write')
    assert.deepEqual(row.after.shaman, row.before.shaman)
    assert.equal(row.before.head.id, targetId)
    assert.equal(row.before.inspected === targetId, false)
    if (row.result === 'automatic:created') {
      assert.equal(row.before.record, null)
      assert.equal(row.before.latch, false)
      assert(row.before.head.followers > 0)
      assert(row.after.record?.automatic && row.after.latch)
      assert.equal(row.after.record.phase, -1)
      assert.equal(row.after.record.hold, 16)
    }
  }
  const creations = requests.filter(row => row.result === 'automatic:created')
  assert.equal(creations.length, 2, 'Fresh successful creation after the first lifetime ended')
  const firstPositive = rows.find(row => row.kind === 'turn' && row.after.head.followers > 0)
  assert(firstPositive)
  const priorZero = requests.find(row => row.before.turn === firstPositive.after.turn && row.before.head.followers === 0)
  assert(priorZero && priorZero.result === 'automatic:rejected' && !priorZero.after.record)
  assert(creations[0].before.turn > priorZero.before.turn)
  const inputs = rows.filter(row => row.kind === 'input')
  assert.equal(inputs.length, 3)
  for (const row of inputs) {
    assert(row.trusted && row.button === 0)
    assert.deepEqual(row.modifiers, [false, false, false, false])
    assert.equal(row.after.turn, row.before.turn)
    assert.deepEqual(row.before.selected, [shamanId])
    assert.deepEqual(row.after.selected, [shamanId])
  }
  assert.deepEqual(inputs.map(row => row.after.shaman.order?.model), [33, 3, 33])
  assertVaultUninspectedCommand(inputs[0], targetId)
  assertVaultUninspectedCommand(inputs[2], targetId)
  const interrupted = inputs[1]
  assert(interrupted.before.head.work > 0 && interrupted.before.head.work <= vaultLowWorkLimit(interrupted.before.head.target))
  const expired = rows.find(row => row.ordinal > interrupted.ordinal && row.ordinal < inputs[2].ordinal &&
    row.kind === 'update' && row.after.head.followers === 0 && vaultReleased(row.after))
  assert(expired, 'Cached zero must lead to natural expiry before reissue')
  assert(creations[1].ordinal > expired.ordinal)
  // Creation/lifetime boundaries are authoritative; allocator numeric IDs may be reused.
  for (const row of creations) assert((evidence.held[row.after.record.identity] ?? 0) >= 4)
  for (const row of rows.filter(row => row.kind === 'open')) assert(row.automatic && !row.immediate)
  assert(evidence.final.unlocked && evidence.final.head.uses === 1 && !evidence.final.head.active)
  assert.equal(evidence.final.shaman.vault, null)
  assert.notEqual(evidence.final.shaman.order?.model, 33)
  assert(vaultReleased(evidence.final))
  return { creationTurns: creations.map(row => row.before.turn), interruptionTurn: interrupted.before.turn,
    interruptionWork: interrupted.before.head.work, expiryTurn: expired.after.turn, departureTurn: evidence.final.turn }
}
