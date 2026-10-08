import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createBlastEpisode } from '../qa/blast-ordinary/contract.mjs'

// Synthetic evidence records test only the reducer, never gameplay or rendering.
const copy = value => structuredClone(value)
const options = { expectation: 'candidate', actorId: 1, targetId: 3, runId: 'test-run', sourceFingerprint: 'source', maxTurns: 48 }
const context = { level: 2, camera: { x: 2, y: 3 }, flags: 0 }
const position = turn => ({ x: 1000 + (turn - 1) * 10, y: 2000, h: 120 })
const browserPoint = p => ({ x: (p.x - 2048) / 256, z: -(p.y + 2048) / 256 })
const hover = expectation => ({ turn: 1, targetId: 3, mode: 'blast', canvasOwned: true, hitId: 3,
  visible: expectation === 'candidate', lines: expectation === 'candidate' ? 16 : 0, context: copy(context), position: position(1),
  previousTurn: 0, previousPosition: position(1), idle: true })
const release = expectation => ({ point: { x: 10, y: 20 },
  ...(expectation === 'baseline' ? { targetCheck: { range: { phase: 'before-handler', turn: 1, targetId: 3, sameOriginal: true, targetError: null },
    pixel: { phase: 'after-handler-diagnostic', turn: 1, personId: 3, point: { x: 10, y: 20 } } } } : {}), turn: 1, targetId: 3, mode: 'blast', trusted: true, canvasOwned: true, context: copy(context),
  handlerPersonId: expectation === 'candidate' ? 3 : null, handlerTerrain: expectation === 'baseline', stockBefore: 4, castCountBefore: 0 })
const proposed = () => {
  const value = hover('baseline')
  delete value.visible; delete value.lines
  return { ...value, kind: 'proposed-pixel', point: { x: 10, y: 20 } }
}
function sample(turn, expectation = 'candidate', { still = false } = {}) {
  const candidate = expectation === 'candidate', p = position(still ? 1 : turn), aim = position(still ? 1 : Math.max(1, turn - 1))
  const phase = turn < 7 ? 'windup' : turn < 9 ? 'flying' : 'arrived'
  return { turn, level: 2, playing: true, paused: false, speed: 1, flags: 0, sceneMatches: true,
    actor: { id: 1, same: true, hp: 100, team: 'blue', position: { x: 100, y: 200, h: 120 } },
    target: { id: 3, same: true, hp: 100, team: 'blue', kind: 'brave', inside: null, ownerValid: true, movementOrderSame: true, position: p },
    stock: 3, castCount: 1, mana: 10, random: 123,
    shot: turn < 10 ? { id: 44, caster: 1, phase, remaining: Math.max(0, 7 - turn), target: candidate ? browserPoint(aim) : { x: 11, z: 17 },
      destination: candidate && phase !== 'windup' ? aim : position(1),
      tracking: candidate ? { personId: 3, shotPersonId: phase === 'windup' ? null : 3, destination: aim } : null,
      visualIds: phase === 'windup' ? [] : [50] } : null,
    effects: turn < 10 ? [] : [{ id: 60, kind: 'blastWave', point: candidate ? browserPoint(aim) : { x: 11, z: 17 } }, { id: 61, kind: 'blast', point: candidate ? browserPoint(aim) : { x: 11, z: 17 } }] }
}
const movement = () => ({ turn: 1, mode: null, selected: [3], trusted: true, canvasOwned: true,
  point: { x: 50, y: 60 }, shotBefore: { id: 44, phase: 'windup', remaining: 6 },
  order: { model: 3, a: 2816, b: 63488 }, expected: { a: 2816, b: 63488, pixel: { x: 50, y: 60 } },
  handlerPoint: { x: 3, z: 0 }, handlerPersonId: null, afterMode: null, afterSelected: [3], ownerSame: true })
function start(expectation = 'candidate', change = () => {}) {
  const episode = createBlastEpisode({ ...options, expectation }), h = expectation === 'baseline' ? proposed() : hover(expectation), r = release(expectation), first = sample(1, expectation)
  change({ h, r, first })
  if (expectation === 'baseline') episode.propose(h)
  else episode.hover(h)
  if (expectation === 'candidate') episode.frame({ kind: 'hover', turn: 1, targetId: 3, visible: true, lines: 16, pixels: 80, effectId: null })
  episode.trigger(1)
  episode.release(r, first)
  episode.move(movement(), first)
  if (expectation === 'candidate') episode.frame({ kind: 'ack', turn: 1, targetId: 3, visible: true, lines: 32, pixels: 160, effectId: null })
  return { episode, first }
}
function finish({ expectation = 'candidate', omitFrame, mutate = () => {}, still = false } = {}) {
  const { episode } = start(expectation)
  for (let turn = 1; turn < 10; turn++) {
    const before = sample(turn, expectation, { still }), after = sample(turn + 1, expectation, { still })
    mutate({ before, after, turn })
    episode.before(before); episode.after(after)
    if (turn === 8 && omitFrame !== 'arrival') episode.frame({ kind: 'arrival', turn: 9, targetId: 3, visible: true, lines: 16, pixels: 100, effectId: 50 })
    if (turn === 9 && omitFrame !== 'impact') episode.frame({ kind: 'impact', turn: 10, targetId: 3, visible: true, lines: 16, pixels: 100, effectId: 61 })
  }
  return episode
}
test('candidate requires actual event, both motion intervals, arrival, impact and all rendered phases', () => {
  const result = finish().report()
  assert.equal(result.complete, true); assert.equal(result.rows.length, 10)
  assert.equal(result.windupMotion, true); assert.equal(result.flightMotion, true)
})
test('baseline fixed-point phenotype is explicit and separate from candidate acceptance', () => {
  assert.equal(finish({ expectation: 'baseline' }).report().complete, true)
  assert.throws(() => start('candidate', ({ first }) => { first.shot.tracking = null }), /identity/)
  assert.throws(() => start('baseline', ({ first }) => { first.shot.tracking = { personId: 3 } }), /identity/)
})
test('stopped target and repeated motion samples cannot complete', () => {
  assert.equal(finish({ still: true }).report().complete, false)
  assert.throws(() => start('candidate', ({ h }) => { h.previousTurn = h.turn }), /stationary sample repeated/)
  assert.throws(() => start('candidate', ({ h }) => { h.previousPosition.x-- }), /Idle target moved/)
})
test('changed, removed or invalid target fails before impact', () => {
  for (const damage of [target => { target.id = 4 }, target => { target.same = false }, target => { target.ownerValid = false }, target => { target.team = 'green' }])
    assert.throws(() => finish({ mutate: ({ before, turn }) => { if (turn === 4) damage(before.target) } }), /target changed|disappeared/)
})
test('setup requires life, but a retained nondeleted class1 owner is not invalidated by HP alone', () => {
  assert.throws(() => start('candidate', ({ first }) => { first.target.hp = 0 }), /living response/)
  assert.equal(finish({ mutate: ({ before, after, turn }) => { if (turn >= 4) { before.target.hp = 0; after.target.hp = 0 } } }).report().complete, true)
})
test('stale pointer, changed context, wrong handler and synthetic events are rejected', () => {
  for (const damage of [r => { r.turn = 3 }, r => { r.context.camera.x++ }, r => { r.handlerPersonId = 4 }, r => { r.trusted = false }, r => { r.canvasOwned = false }])
    assert.throws(() => start('candidate', ({ r }) => damage(r)), /Stale|handler|trusted/)
})
test('missing visible hover, arrival, impact or acknowledgement cannot pass', () => {
  assert.throws(() => start('candidate', ({ h }) => { h.visible = false }), /feedback/)
  for (const omitFrame of ['arrival', 'impact']) assert.equal(finish({ omitFrame }).report().complete, false)
  const { episode } = start()
  assert.throws(() => episode.frame({ kind: 'arrival', turn: 1, targetId: 3, visible: false, lines: 16, pixels: 0, effectId: 50 }), /pixels/)
  const withoutAck = createBlastEpisode(options)
  withoutAck.hover(hover('candidate'))
  withoutAck.frame({ kind: 'hover', turn: 1, targetId: 3, visible: true, lines: 16, pixels: 80, effectId: null })
  withoutAck.trigger(1); withoutAck.release(release('candidate'), sample(1))
  for (let turn = 1; turn < 10; turn++) { withoutAck.before(sample(turn)); withoutAck.after(sample(turn + 1)) }
  assert.equal(withoutAck.report().complete, false)
})
test('missing arrival transition or actual impact allocations fail', () => {
  assert.throws(() => finish({ mutate: ({ before, after, turn }) => { if (turn === 8) { before.shot.phase = 'flying'; after.shot = null } } }), /arrival/)
  assert.throws(() => finish({ mutate: ({ after, turn }) => { if (turn === 9) after.effects = [] } }), /impact effect/)
  assert.throws(() => finish({ mutate: ({ after, turn }) => { if (turn === 9) after.effects[0].point.x++ } }), /parent destination/)
})
test('repeated before samples and missing adjacent turns are rejected', () => {
  const { episode } = start(); episode.before(sample(1))
  assert.throws(() => episode.before(sample(1)), /Repeated before/)
  assert.equal(episode.report().complete, false)
  const other = start().episode; other.before(sample(1))
  assert.throws(() => other.after(sample(3)), /non-adjacent/)
})
test('seeded success fields and mutations of returned reports cannot establish evidence', () => {
  assert.throws(() => createBlastEpisode({ ...options, complete: true }), /seeded/)
  const { episode } = start(), seeded = episode.report()
  Object.assign(seeded, { complete: true, windupMotion: true, flightMotion: true, impact: { turn: 1 } })
  assert.equal(episode.report().complete, false)
  assert.throws(() => episode.report(seeded), /seed/)
  const before = sample(1); before.complete = true
  assert.throws(() => episode.before(before), /seeded/)
})
test('driver source excludes game mutations and diagnostic clock/render shortcuts', () => {
  const driver = readFileSync(new URL('../qa/blast-ordinary/scenario.mjs', import.meta.url), 'utf8')
  const observer = readFileSync(new URL('../qa/blast-ordinary/observer.mjs', import.meta.url), 'utf8')
  for (const source of [driver, observer]) {
    assert.doesNotMatch(source, /\b(?:tick|advanceGame|addUnit|beginCast|setSelection|placeBuilding)\s*\(/)
    assert.doesNotMatch(source, /cancelAnimationFrame|\.animate\s*\(|\.focus\s*\(|\.renderer\.render\s*\(/)
    assert.doesNotMatch(source, /\b(?:world|w)\.(?:speed|paused|units|shots|manaWorld|mode|turn|randomState|terrain)\s*(?:=(?!=)|\+\+|--)/)
  }
  assert.match(driver, /receipt\.profile\?\.mode, 'created'/)
  assert.match(driver, /spellTargetError\(probe,/)
  assert.match(driver, /remainingAcceptance/)
})

test('a moving target cannot satisfy the declared idle preparation', () => {
  assert.throws(() => start('candidate', ({ h }) => { h.idle = false }), /idle person/)
})

test('actual delivered release outside four trigger turns fails', () => {
  assert.throws(() => start('baseline', ({ r, first }) => { r.turn = 6; first.turn = 6 }), /release window/)
})

test('candidate admission requires a prospective natural frame, not visible feedback alone', () => {
  const episode = createBlastEpisode(options)
  episode.hover(hover('candidate'))
  assert.throws(() => episode.trigger(1), /validated hover frame/)
  assert.equal(episode.report().triggerTurn, undefined)
  assert.equal(episode.report().complete, false)
})

test('a pre-registration, stale or future hover frame cannot authorize the trigger', () => {
  const frame = { kind: 'hover', turn: 1, targetId: 3, visible: true, lines: 16, pixels: 80, effectId: null }
  const unregistered = createBlastEpisode(options)
  assert.throws(() => unregistered.frame(frame), /Stale bracket/)
  const stale = createBlastEpisode(options)
  stale.hover(hover('candidate')); stale.frame(frame)
  assert.throws(() => stale.trigger(3), /hover expired/)
  const future = createBlastEpisode(options)
  future.hover(hover('candidate')); future.frame({ ...frame, turn: 2 })
  assert.throws(() => future.trigger(1), /validated hover frame/)
})

test('validated prospective hover admits one fresh trigger and retains release freshness', () => {
  const episode = createBlastEpisode(options)
  episode.hover(hover('candidate'))
  episode.frame({ kind: 'hover', turn: 1, targetId: 3, visible: true, lines: 16, pixels: 80, effectId: null })
  episode.trigger(2)
  assert.throws(() => episode.release({ ...release('candidate'), turn: 3 }, sample(3)), /Stale pointer/)
  const valid = start().episode
  assert.equal(valid.report().triggerTurn, 1)
  assert.throws(() => valid.trigger(2), /One actual response trigger/)
  assert.throws(() => valid.hover(hover('candidate')), /only once/)
})


test('baseline proposal is distinct from actual hover and actual delivered release', () => {
  const result = start('baseline').episode.report()
  assert.equal(result.hover, undefined)
  assert.equal(result.proposal.kind, 'proposed-pixel')
  assert.deepEqual(result.release.point, result.proposal.point)
  assert.equal(result.complete, false)
  assert.throws(() => start('baseline', ({ r }) => { r.point.x++ }), /differs from proposed/)
  assert.throws(() => start('baseline', ({ r }) => { r.turn = 3 }), /event-time sample/)
})

test('proposed pixel records cannot be relabelled as candidate hover evidence', () => {
  const candidate = createBlastEpisode(options)
  assert.throws(() => candidate.propose(proposed()), /Only baseline/)
  const other = createBlastEpisode(options)
  assert.throws(() => other.hover(proposed()), /Unrecognized|seeded/)
  const noFrame = createBlastEpisode(options)
  const relabeled = proposed(); delete relabeled.kind; delete relabeled.point
  assert.throws(() => noFrame.hover(relabeled), /visible hover/)
})


test('a once-correct proposal cannot mask movement, occlusion, replacement or range loss at actual release', () => {
  for (const personId of [null, 4])
    assert.throws(() => start('baseline', ({ r }) => { r.targetCheck.pixel.personId = personId }), /no longer owns/)
  assert.throws(() => start('baseline', ({ r }) => { r.targetCheck.range.targetError = { code: -2 } }), /actual source range/)
  assert.throws(() => start('baseline', ({ r }) => { r.targetCheck.range.sameOriginal = false }), /actual source range/)
  assert.throws(() => start('baseline', ({ r }) => { delete r.targetCheck }), /actual source range/)
  assert.throws(() => start('baseline', ({ r }) => { r.targetCheck.pixel.phase = 'handler' }), /no longer owns/)
})

test('friendly episode keeps the original Shaman stationary and rejects enemy, non-Brave or nonidle substitution', () => {
  assert.throws(() => finish({ mutate: ({ before, turn }) => { if (turn === 4) before.actor.position.x++ } }), /Shaman moved/)
  for (const key of ['team', 'kind'])
    assert.throws(() => start('candidate', ({ first }) => { first.target[key] = key === 'team' ? 'green' : 'warrior' }), /target changed/)
  assert.throws(() => start('candidate', ({ h }) => { h.idle = false }), /idle person/)
})

test('post-cast movement requires accepted release, cleared mode, same selection and live windup', () => {
  const empty = createBlastEpisode(options)
  assert.throws(() => empty.move(movement(), sample(1)), /accepted cast/)
  for (const change of [m => { m.mode = 'blast' }, m => { m.afterMode = 'blast' }, m => { m.selected = [1] },
    m => { m.afterSelected = [1] }, m => { m.trusted = false }, m => { m.shotBefore.remaining = 0 },
    m => { m.shotBefore.phase = 'flying' }, m => { m.shotBefore.id++ }]) {
    const episode = createBlastEpisode(options), m = movement()
    episode.hover(hover('candidate')); episode.frame({ kind: 'hover', turn: 1, targetId: 3, visible: true, lines: 16, pixels: 80, effectId: null })
    episode.trigger(1); episode.release(release('candidate'), sample(1)); change(m)
    assert.throws(() => episode.move(m, sample(1)), /Ground movement|late|another cast/)
  }
})
test('movement proves the original owner, actual ground pixel and exact command payload without another cast', () => {
  for (const change of [m => { m.ownerSame = false }, m => { m.order.model = 19 }, m => { m.order.a++ },
    m => { m.handlerPersonId = 5 }, m => { m.handlerPoint.x++ }, m => { m.point.x++ }]) {
    const episode = createBlastEpisode(options), m = movement()
    episode.hover(hover('candidate')); episode.frame({ kind: 'hover', turn: 1, targetId: 3, visible: true, lines: 16, pixels: 80, effectId: null })
    episode.trigger(1); episode.release(release('candidate'), sample(1)); change(m)
    assert.throws(() => episode.move(m, sample(1)), /ordinary ground move/)
  }
  assert.throws(() => finish({ mutate: ({ before, turn }) => { if (turn === 4) before.target.movementOrderSame = false } }), /movement order changed/)
  const { episode } = start()
  assert.throws(() => episode.move(movement(), sample(1)), /One public movement/)
})

function baselineEventTime(change = () => {}) {
  const episode = createBlastEpisode({ ...options, expectation: 'baseline' }), p = proposed(), r = release('baseline'), actual = sample(3, 'baseline')
  r.turn = 3; r.targetCheck.range.turn = 3; r.targetCheck.pixel.turn = 3
  actual.target.position = copy(p.position); actual.shot.remaining = 6
  change({ p, r, actual })
  episode.propose(p); episode.trigger(1); episode.release(r, actual)
  return episode
}
test('baseline proposal age is diagnostic when exact current event identity, XYZ, context, pixel and range agree', () => {
  const report = baselineEventTime().report()
  assert.equal(report.proposal.turn, 1); assert.equal(report.release.turn, 3)
  assert.equal(report.entry.turn, 3); assert.equal(report.complete, false)
})
test('baseline event-time replacement rejects changed pose, stale sample, ownership, pixel, context, range and late trigger', () => {
  for (const coordinate of ['x', 'y', 'h'])
    assert.throws(() => baselineEventTime(({ actual }) => { actual.target.position[coordinate]++ }), /Actual release pose/)
  for (const turn of [2, 4])
    assert.throws(() => baselineEventTime(({ actual }) => { actual.turn = turn }), /event-time sample/)
  for (const change of [({ actual }) => { actual.target.id++ }, ({ actual }) => { actual.target.same = false },
    ({ actual }) => { actual.target.ownerValid = false }, ({ r }) => { r.point.x++ }, ({ r }) => { r.context.camera.x++ },
    ({ r }) => { r.targetCheck.pixel.personId++ }, ({ r }) => { r.targetCheck.range.targetError = { code: -2 } },
    ({ r }) => { r.targetCheck.range.sameOriginal = false }, ({ r }) => { r.trusted = false },
    ({ r }) => { r.canvasOwned = false }, ({ r }) => { r.turn = 6 }])
    assert.throws(() => baselineEventTime(change), /target changed|differs|pixel|source range|trusted|release window/)
})
