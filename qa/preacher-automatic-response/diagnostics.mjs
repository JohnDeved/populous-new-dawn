// Scalar reads only. Do not turn an empty filtered list into absent geometry.
const models = { brave: 2, preacher: 4, shaman: 7 }
const tribes = { blue: 0, red: 1, yellow: 2, green: 3, wild: -1 }
const delta = (a, b) => (((a - b + 64) & 127) - 64)
const cell = p => [((p.x ?? 0) & 65535) >>> 9, ((p.y ?? 0) & 65535) >>> 9]
const position = u => ({ x: Math.round((u.x + 8) * 256) & 65535, y: Math.round((-u.z - 8) * 256) & 65535 })
const raw = p => p ? Object.fromEntries(('id class model tribe life state substate counter workFlags flags2 flags3 flags4 vehicle disguise x y h speed commandStatus immediateCommand commandCursor workTarget cellNext cellPrevious').split(' ').map(k => [k, p[k] ?? null])) : null

export function responseCandidateReasons(source, item) {
  const p = item.native, reasons = { nativeReverse: [], ownership: [], oldQaPrefilter: [] }
  const native = reasons.nativeReverse, owned = reasons.ownership, qa = reasons.oldQaPrefilter
  if (!(source.life > 0)) native.push('source-life-not-positive')
  if (source.flags2 & 0x10000) native.push('source-flags2-10000')
  if (source.flags4 & 0x1000) native.push('source-invisible')
  if (!p) { native.push('selected-record-missing'); owned.push('selected-record-missing') }
  else {
    if (p.class !== 1) native.push('candidate-class-not1')
    if (p.model === 4 || p.model === 7) native.push('candidate-model4-or7')
    if (!(p.tribe >= 0) || !(source.tribe >= 0) || p.tribe === source.tribe) native.push('not-different-nonwild-tribes')
    if (item.reverseAlliance & (1 << source.tribe)) native.push('candidate-allies-with-source')
    if (p.workFlags !== 0) native.push('actual-workFlags-not0')
    if (p.state === 23) native.push('candidate-is-listener')
    // This diagnostic admits the ordinary Brave domain only. Model5/6/8 need
    // their directed/disguise predicates; never default them to eligible.
    if (p.model !== 2) native.push('outside-diagnostic-Brave-domain')
    if (p.id !== item.id || p.class !== 1 || p.model !== models[item.kind] || p.tribe !== tribes[item.team])
      owned.push('selected-record-identity-kind-tribe-mismatch')
    if (!item.registered || !(p.flags2 & 0x20000) || !item.cellLinked) owned.push('registration-or-cell-membership-missing')
    if (!item.positionCoherent) owned.push('native-world-position-mismatch')
    if (p.life !== Math.round(item.hp * 20)) owned.push('native-world-life-mismatch')
  }
  if (item.kind !== 'brave') qa.push('not-Brave')
  if (!(item.hp > 0) || item.inside !== null) qa.push('dead-or-inside')
  if (!item.nativeOnly) qa.push('not-native-only-owner')
  if (p?.state !== 17) qa.push('not-idle17')
  if (item.pathLength) qa.push('has-path')
  if (!item.withinSecondary) qa.push('outside-secondary3x3')
  if (p && (p.flags2 & 0x810000 || p.flags4 & 0x1000 || p.vehicle || !(p.life > 0))) qa.push('old-health-flags-vehicle-filter')
  qa.push(...native.filter(x => x !== 'outside-diagnostic-Brave-domain'), ...owned)
  return reasons
}

export function readResponsePeople(world, source, { all = false, limit = all ? 256 : 64, identity: ownedIdentity } = {}) {
  if (!source || source.class !== 1 || source.model !== 4) throw Error('Actual source Preacher record required')
  const sourceCell = cell(source), rows = [], identities = new Map(); let ordinal = 0
  const identity = ownedIdentity ?? (p => { if (!p) return null; if (!identities.has(p)) identities.set(p, ++ordinal); return identities.get(p) })
  const linked = p => {
    if (!p) return false
    const [x, y] = cell(p), seen = new Set(); let id = world.objectCells.heads[y * 128 + x]
    while (id) {
      if (seen.has(id)) throw Error('Cyclic diagnostic cell chain')
      seen.add(id); const item = world.objectCells.objects.get(id)
      if (!item) throw Error('Missing diagnostic cell member')
      if (item === p) return true
      id = item.cellNext
    }
    return false
  }
  for (const u of world.units) {
    if (u.id === source.id || !Object.hasOwn(models, u.kind)) continue
    if (u.kind === 'brave' && (u.team === 'blue' || u.team === 'wild')) continue
    const point = position(u), worldCell = cell(point), slots = [
      ['builder.person', u.builder?.person], ['flight', u.flight], ['fight.motion', u.fight?.motion],
      ['native', u.native], ['entry.person', u.entry?.person]], owner = slots.find(([, p]) => p)
    const p = owner?.[1], nativeCell = p ? cell(p) : null
    const near = c => Math.abs(delta(c[0], sourceCell[0])) <= 2 && Math.abs(delta(c[1], sourceCell[1])) <= 2
    if (!all && !near(worldCell) && !(nativeCell && near(nativeCell))) continue
    if (rows.length === limit) throw Error('Candidate diagnostic record cap exceeded; do not truncate')
    const item = { id: u.id, kind: u.kind, team: u.team, hp: u.hp, inside: u.inside,
      world: { x: u.x, z: u.z }, worldNative: point, worldCell, nativeCell,
      ownerSlot: owner?.[0] ?? null, ownerIdentity: identity(p),
      slots: slots.filter(([, p]) => p).map(([slot, p]) => ({ slot, identity: identity(p), native: raw(p) })),
      native: raw(p), nativeOnly: !!p && p === u.native && !u.builder && !u.flight && !u.fight && !u.entry,
      registered: !!p && world.objectCells.objects.get(u.id) === p, cellLinked: linked(p),
      positionCoherent: !!p && p.x === point.x && p.y === point.y,
      reverseAlliance: p && p.tribe >= 0 ? world.outcome.alliances[p.tribe] : null,
      pathLength: u.path.length, work: u.work, target: u.target,
      withinSecondary: !!nativeCell && Math.abs(delta(nativeCell[0], sourceCell[0])) <= 1 && Math.abs(delta(nativeCell[1], sourceCell[1])) <= 1 }
    item.predicates = responseCandidateReasons(source, item)
    rows.push(item)
  }
  const unmatchedPrimary = []
  for (const p of world.objectCells.objects.values()) {
    if (p.id === source.id || p.class !== 1 || ![4, 7].includes(p.model) || world.units.some(u => u.id === p.id)) continue
    const c = cell(p)
    if (!all && (Math.abs(delta(c[0], sourceCell[0])) > 2 || Math.abs(delta(c[1], sourceCell[1])) > 2)) continue
    if (rows.length + unmatchedPrimary.length === limit) throw Error('Candidate diagnostic record cap exceeded; do not truncate')
    unmatchedPrimary.push({ id: p.id, ownerIdentity: identity(p), native: raw(p), nativeCell: c,
      cellLinked: linked(p), failedPredicates: ['native-primary-has-no-live-Unit'] })
  }
  return { source: raw(source), sourceCell, scope: all ? 'all-present-Braves-and-specialists' : 'nearby5x5-cells-before-filter',
    identityScope: ownedIdentity ? 'observer-lifetime' : 'within-this-read', limit, rows, unmatchedPrimary }
}
