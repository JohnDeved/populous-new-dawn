import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createBlastEpisode } from '../qa/blast-ordinary/contract.mjs'

// Synthetic evidence records test only the reducer, never gameplay or rendering.
const copy = value => structuredClone(value)
const options = { expectation: 'candidate', actorId: 1, targetId: 3, runId: 'test-run', sourceFingerprint: 'source', maxTurns: 48, triggerTurn: 1 }
const context = { level: 2, camera: { x: 2, y: 3 }, flags: 0 }
const position = turn => ({ x: 1000 + (turn - 1) * 10, y: 2000, h: 120 })
const browserPoint = p => ({ x: (p.x - 2048) / 256, z: -(p.y + 2048) / 256 })
const hover = expectation => ({ turn: 1, targetId: 3, mode: 'blast', canvasOwned: true, hitId: 3,
  visible: expectation === 'candidate', lines: expectation === 'candidate' ? 16 : 0, context: copy(context), position: position(1),
  previousTurn: 0, previousPosition: position(0), orderModel: 19 })
const release = expectation => ({ turn: 1, targetId: 3, mode: 'blast', trusted: true, canvasOwned: true, context: copy(context),
  handlerPersonId: expectation === 'candidate' ? 3 : null, handlerTerrain: expectation === 'baseline', stockBefore: 4, castCountBefore: 0 })
function sample(turn, expectation = 'candidate', { still = false } = {}) {
  const candidate = expectation === 'candidate', p = position(still ? 1 : turn), aim = position(still ? 1 : Math.max(1, turn - 1))
  const phase = turn < 7 ? 'windup' : turn < 9 ? 'flying' : 'arrived'
  return { turn, level: 2, playing: true, paused: false, speed: 1, flags: 0, sceneMatches: true,
    actor: { id: 1, same: true, hp: 100, team: 'blue' },
    target: { id: 3, same: true, hp: 100, team: 'green', kind: 'warrior', inside: null, ownerValid: true, position: p },
    stock: 3, castCount: 1, mana: 10, random: 123,
    shot: turn < 10 ? { id: 44, caster: 1, phase, remaining: Math.max(0, 7 - turn), target: candidate ? browserPoint(aim) : { x: 11, z: 17 },
      destination: candidate && phase !== 'windup' ? aim : position(1),
      tracking: candidate ? { personId: 3, shotPersonId: phase === 'windup' ? null : 3, destination: aim } : null,
      visualIds: phase === 'windup' ? [] : [50] } : null,
    effects: turn < 10 ? [] : [{ id: 60, kind: 'blastWave', point: candidate ? browserPoint(aim) : { x: 11, z: 17 } }, { id: 61, kind: 'blast', point: candidate ? browserPoint(aim) : { x: 11, z: 17 } }] }
}
function start(expectation = 'candidate', change = () => {}) {
  const episode = createBlastEpisode({ ...options, expectation }), h = hover(expectation), r = release(expectation), first = sample(1, expectation)
  change({ h, r, first })
  episode.hover(h)
  if (expectation === 'candidate') episode.frame({ kind: 'hover', turn: 1, targetId: 3, visible: true, lines: 16, pixels: 80, effectId: null })
  episode.release(r, first)
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
  assert.throws(() => start('candidate', ({ h }) => { h.previousTurn = h.turn }), /stopped|repeated/)
  assert.throws(() => start('candidate', ({ h }) => { h.previousPosition = h.position }), /stopped|repeated/)
})
test('changed, removed or invalid target fails before impact', () => {
  for (const damage of [target => { target.id = 4 }, target => { target.same = false }, target => { target.ownerValid = false }, target => { target.team = 'blue' }])
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
  withoutAck.hover(hover('candidate')); withoutAck.release(release('candidate'), sample(1))
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

test('an unrelated patrol model cannot satisfy the declared response episode', () => {
  assert.throws(() => start('candidate', ({ h }) => { h.orderModel = 25 }), /response person/)
})

test('actual delivered release outside four trigger turns fails even with a fresh hover', () => {
  assert.throws(() => start('baseline', ({ h, r, first }) => { h.turn = 5; r.turn = 6; first.turn = 6 }), /release window/)
})
