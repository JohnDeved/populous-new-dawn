import assert from 'node:assert/strict'
import test from 'node:test'
import { validateMeleeTransitionFrames } from '../scripts/tutorial-browser/melee-attack-transition-evidence.mjs'
import rules from '../app/original-rules.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }

// Synthetic supplied observations only. This is not a browser acceptance receipt,
// public-input trace, screenshot, or a retrofit of either historical failed run.
const attacks = new Set(['attack', 'strike', 'special'])
function rowMapping(row) {
  const animationId = rules.personAnimationObjects[row * 9 + 7]
  const [object, draw] = rules.animationObjects[animationId]
  const step = rules.animationDescriptors[draw].step, frameCount = units.frameCounts[object]
  return { row, animationId, object, draw, step, frameCount, duration: (step + 1) * frameCount,
    directions: units.shamanSources[object] }
}
const mapping = Object.fromEntries(Object.entries({ attack: 10, strike: 8, special: 16 })
  .map(([action, row]) => [`shaman:${action}`, rowMapping(row)]))
const successors = Object.fromEntries(Object.entries({ idle: 0, walk: 1, recoil: 9 })
  .map(([action, row]) => [action, rowMapping(row)]))
const validate = samples => validateMeleeTransitionFrames(samples, mapping, successors)

function sample(overrides = {}) {
  const result = { id: 54, kind: 'shaman', action: 'attack', started: 514, opponent: 20,
    turn: 514, animationFrame: 1028, stamp: 360, f1: 0, direction: 2,
    fightGroup: 7, personId: 54, personState: 25, personSpeed: 0, motionIsNative: false,
    personClass: 1, personModel: 7, workFlags: 7, personFlags2: 0x1080, personFlags4: 0,
    personIdentityMatch: true, fightMotionSourceAdmitted: true, flight: false, participants: [54, 20],
    phase: 'running-before-pause', paused: false, visible: true, submittedLayers: 2,
    canvasConnected: true, sceneStoreMatch: true, nativeAttackAnimation: true,
    bodyCanvasOwned: true, bodyInCanvas: true, cropOverlayClear: true, ...overrides }
  result.logicalStamp ??= result.turn
  result.animation ??= attacks.has(result.action) ? result.action : result.action === 'recoil' ? 'idle' : 'walk'
  const original = attacks.has(result.action) ? mapping[`shaman:${result.action}`]
    : result.action === 'recoil' ? successors.recoil
      : attacks.has(result.animation) ? mapping[`shaman:${result.animation}`] : successors[result.animation]
  result.remaining ??= attacks.has(result.action) ? original.duration - 1 - (result.turn - result.started) : null
  result.f2 ??= attacks.has(result.action) || attacks.has(result.animation) ? (result.turn - result.started) % original.frameCount : 2
  const direction = original.directions[result.direction] ?? original.directions[0]
  return { object: original.object, draw: original.draw, renderedDraw: original.draw,
    frame: direction.frames[result.f2 % direction.frames.length], flip: direction.flip, ...result }
}

function evidence(outcome = 'same-attack') {
  const after = { phase: 'running-after-resume', stamp: 364, turn: 516, animationFrame: 1032,
    cropFile: 'resumed-first.png' }
  if (outcome === 'expiry') Object.assign(after, { turn: 517, animationFrame: 1034, action: 'approach', animation: 'attack' })
  if (['walk', 'idle', 'ready'].includes(outcome)) Object.assign(after, { turn: 518, animationFrame: 1036,
    action: outcome === 'ready' ? 'ready' : 'approach', animation: outcome === 'walk' ? 'walk' : 'idle',
    personSpeed: outcome === 'walk' ? 200 : 0 })
  if (outcome === 'recoil') Object.assign(after, { turn: 518, started: 518, animationFrame: 1036,
    action: 'recoil', animation: 'idle', nativeAttackAnimation: false,
    opponentFight: { id: 20, kind: 'shaman', group: 7, opponent: 54, action: 'attack', started: 518,
      remaining: 3, object: mapping['shaman:attack'].object, draw: mapping['shaman:attack'].draw } })
  return [
    sample({ cropFile: 'running-first.png' }),
    sample({ turn: 515, animationFrame: 1030, stamp: 361 }),
    sample({ phase: 'public-paused-hold', paused: true, turn: 515, animationFrame: 1030,
      stamp: 362, cropFile: 'paused-first.png' }),
    sample({ phase: 'public-paused-hold', paused: true, turn: 515, animationFrame: 1030,
      stamp: 363, cropFile: 'paused-second.png' }),
    sample(after),
  ]
}

test('synthetic same-attack evidence proves pre-pause advancement, strict paused hold and first resumed outcome separately', () => {
  const samples = evidence(), unchanged = structuredClone({ samples, mapping, successors })
  const result = validate(samples), obligations = result.obligations
  assert.equal(result.protocol, 'layered-public-melee-transition')
  assert.equal(result.sampleCount, 5); assert.equal(result.sequenceCount, 1)
  assert.deepEqual(result.cropFiles, ['running-first.png', 'paused-first.png', 'paused-second.png', 'resumed-first.png'])
  assert.deepEqual(result.shamanSequence, { id: 54, kind: 'shaman', action: 'attack', started: 514, opponent: 20, fightGroup: 7 })
  assert.deepEqual([obligations.runningAdvancement.before.stamp, obligations.runningAdvancement.after.stamp], [360, 361])
  assert.deepEqual(obligations.pausedHold.stamps, [362, 363])
  assert.equal(obligations.pausedHold.anchor.remaining, 2)
  assert.equal(obligations.pausedHold.anchor.personId, 54)
  assert.equal(obligations.resumedOutcome.outcome, 'same-attack')
  assert.equal(obligations.resumedOutcome.after.stamp, 364)
  assert.equal(obligations.sourceOwnership.claim, 'source-contract-inference')
  assert.equal(obligations.runningSameTurnHold.status, 'not-claimed')
  assert.equal(obligations.nativeRecoilParity.status, 'not-claimed')
  assert.deepEqual({ samples, mapping, successors }, unchanged)
})

test('baseline idle424 and missing native ownership cannot satisfy original attack456 even through a fallback source', () => {
  for (const marker of [undefined, false, true]) {
    const samples = evidence()
    Object.assign(samples[0], { object: 424, nativeAttackAnimation: marker, motionIsNative: true })
    assert.throws(() => validate(samples), /expected original object 456/)
  }
  for (const marker of [undefined, false]) {
    const samples = evidence()
    Object.assign(samples[0], { nativeAttackAnimation: marker, motionIsNative: true })
    assert.throws(() => validate(samples), /native attack ownership marker required/)
  }
})

test('all three original attack rows and mirrored directions retain exact native timers and phase', () => {
  for (const action of attacks) {
    const samples = evidence().map(fields => {
      const { object, draw, frame, flip, ...rest } = fields
      assert.ok(object && draw && frame && typeof flip === 'boolean')
      return sample({ ...rest, action, animation: action, direction: 7,
        remaining: mapping[`shaman:${action}`].duration - 1 - (fields.turn - fields.started) })
    })
    assert.equal(validate(samples).obligations.pausedHold.anchor.flip, true)
  }
})

test('exact expiry retains the attack pose and later approach/ready use independently mapped movement or idle', () => {
  for (const [outcome, source] of [['expiry', 'expired-attack-carry'], ['walk', 'walk'], ['idle', 'idle'], ['ready', 'idle']]) {
    const result = validate(evidence(outcome)).obligations.resumedOutcome
    assert.equal(result.outcome, 'legal-successor'); assert.equal(result.source, source)
    assert.equal(result.expiryTurn, 517); assert.equal(result.claim, 'unchanged-renderer-consistency')
  }
  const expiry = evidence('expiry').at(-1)
  assert.equal(expiry.f2, 3); assert.equal(expiry.remaining, null)
  assert.equal(expiry.object, 456); assert.equal(expiry.draw, 14)
  assert.equal(evidence('walk').at(-1).object, 616)
  assert.equal(evidence('ready').at(-1).object, 424)
})

test('narrow immediate recoil producer evidence is consistency only and never new recoil-entry parity', () => {
  const samples = evidence('recoil'), result = validate(samples)
  assert.equal(samples.at(-1).f2, 2, 'Existing idle phase is not reset to a fictional recoil entry frame')
  assert.equal(result.obligations.resumedOutcome.source, 'recoil')
  assert.equal(result.obligations.resumedOutcome.claim, 'unchanged-renderer-consistency')
  assert.equal(result.obligations.nativeRecoilParity.status, 'not-claimed')
  assert.equal(successors.recoil.animationId, successors.idle.animationId)
})

test('natural interception and extra held visits remain valid without a running same-turn claim', () => {
  const samples = evidence('walk').map(fields => ({ ...fields, opponent: 13, participants: [54, 13] }))
  samples.at(-1).stamp += 2
  samples.splice(4, 0, { ...samples[3], stamp: 364, cropFile: undefined },
    { ...samples[3], stamp: 365, cropFile: undefined, phase: 'running-after-resume', paused: false, animationFrame: 1031 })
  const result = validate(samples)
  assert.equal(result.shamanSequence.opponent, 13)
  assert.deepEqual(result.obligations.pausedHold.stamps, [362, 363, 364])
  assert.equal(result.obligations.resumedOutcome.after.stamp, 366)
  assert.equal(result.obligations.runningSameTurnHold.status, 'not-claimed')
})

test('missing pre-pause advancement cannot borrow resumed progress, paused stamps or another attack sequence', () => {
  for (const replacement of [sample({ stamp: 361, animationFrame: 1029 }),
    sample({ stamp: 361, turn: 515, started: 515, animationFrame: 1030, action: 'special' })]) {
    const samples = evidence(); samples[1] = replacement
    assert.throws(() => validate(samples), /advancement entirely before Pause/)
  }
  const missing = evidence(); missing.splice(1, 1)
  assert.throws(() => validate(missing), /two unpaused running-before-pause/)
})

test('attack duration, remaining and exact logical native phase cannot be fabricated', () => {
  for (const [change, error] of [[{ remaining: 3 }, /exact original attack countdown/],
    [{ remaining: null }, /exact original attack countdown/], [{ f1: 1 }, /native attack phase/],
    [{ f2: 2, frame: 1008 }, /native attack phase/], [{ animation: 'idle' }, /attack animation/],
    [{ personSpeed: 1 }, /must be stopped/]]) {
    const samples = evidence(); Object.assign(samples[2], change)
    assert.throws(() => validate(samples), error)
  }
  const expired = evidence(); expired[4] = sample({ phase: 'running-after-resume', stamp: 364,
    turn: 517, animationFrame: 1034, cropFile: 'resumed-first.png' })
  assert.throws(() => validate(expired), /cannot survive its native expiry/)
})

test('future attack, early expiry, wrong expiry pose and later substituted samples all fail closed', () => {
  const future = evidence(); future[4] = sample({ phase: 'running-after-resume', stamp: 364,
    turn: 518, started: 518, animationFrame: 1036, cropFile: 'resumed-first.png' })
  assert.throws(() => validate(future), /future attack cannot substitute/)
  for (const [change, error] of [[{ turn: 516, logicalStamp: 516 }, /before native expiry/],
    [{ started: 515 }, /retain the expired attack start/], [{ animation: 'idle' }, /retain the original attack animation/],
    [{ remaining: 0 }, /absent remaining/], [{ personSpeed: 1 }, /stopped attack/],
    [{ f2: 0, frame: 1006 }, /native attack phase/], [{ action: 'ready', motionIsNative: true }, /changes attack to approach only/]]) {
    const samples = evidence('expiry'); Object.assign(samples[4], change)
    assert.throws(() => validate(samples), error)
  }
  const later = evidence(); later.push({ ...later[4], stamp: 365, cropFile: undefined })
  assert.throws(() => validate(later), /Exactly one first logical-clock-advanced/)
  const noAdvance = evidence(); noAdvance[4] = { ...noAdvance[3], stamp: 364, phase: 'running-after-resume',
    paused: false, cropFile: 'resumed-first.png' }
  assert.throws(() => validate(noAdvance), /Exactly one first logical-clock-advanced/)
})

test('later movement, idle and ready successor predicates are not interchangeable', () => {
  for (const [outcome, change, error] of [['walk', { personSpeed: 0 }, /must match physical movement/],
    ['ready', { animation: 'walk', personSpeed: 200 }, /Ready successor must be stopped/],
    ['idle', { nativeAttackAnimation: false }, /retain the original attack ownership/],
    ['idle', { started: 516 }, /retain the expired attack start/],
    ['walk', { action: 'push' }, /Only approach, ready or source-qualified recoil/],
    ['idle', { object: 456 }, /expected original object/]]) {
    const samples = evidence(outcome); Object.assign(samples[4], change)
    assert.throws(() => validate(samples), error)
  }
})

test('recoil rejects initialized legacy animation, absent or wrong producer and ambiguous future-attack timing', () => {
  for (const [change, error] of [[{ animation: 'recoil', motionIsNative: true }, /Only uninitialized recoil/],
    [{ nativeAttackAnimation: true }, /must not borrow/], [{ started: 517 }, /immediate same-turn/],
    [{ remaining: 6 }, /absent remaining/], [{ opponentFight: undefined }, /same-turn attack producer/],
    [{ participants: [20, 54] }, /observed fight processing order/], [{ personSpeed: 1 }, /must be stopped/]]) {
    const samples = evidence('recoil'); Object.assign(samples[4], change)
    assert.throws(() => validate(samples), error)
  }
  for (const [key, value] of [['id', 13], ['kind', 'warrior'], ['group', 8], ['opponent', 13],
    ['started', 517], ['action', 'ready'], ['remaining', 2], ['object', 424], ['draw', 13]]) {
    const samples = evidence('recoil'); samples[4].opponentFight[key] = value
    assert.throws(() => validate(samples), /attack producer|entry countdown|original attack object\/draw/)
  }
  const ambiguous = evidence('recoil')
  Object.assign(ambiguous[4], { turn: 522, logicalStamp: 522, started: 522, animationFrame: 1044 })
  ambiguous[4].opponentFight.started = 522
  assert.throws(() => validate(ambiguous), /exclude an unobserved future actor attack/)
})

test('same actor, physical identity, source inference, fight group, opponent and no-flight gates are mandatory', () => {
  for (const [change, error] of [[{ id: 20 }, /authored M2 Shaman54/], [{ kind: 'warrior' }, /authored M2 Shaman54/],
    [{ personId: 20 }, /physical person54/], [{ personState: 10 }, /fight state25/],
    [{ personModel: 2 }, /Shaman model7/], [{ personClass: 2 }, /person class1/],
    [{ workFlags: 8 }, /belong to the fight group/], [{ personIdentityMatch: false }, /physical-person identity/],
    [{ flight: true }, /flight override/], [{ personFlags2: 0x80000 }, /airborne/],
    [{ personFlags4: 0x400 }, /airborne physics/], [{ logicalStamp: 517 }, /animation stamp/],
    [{ fightMotionSourceAdmitted: false }, /source-contract inference/],
    [{ motionIsNative: undefined }, /source identity observation/],
    [{ fightGroup: 8, workFlags: 8 }, /same fightGroup/], [{ opponent: 13, participants: [54, 13] }, /same opponent/],
    [{ participants: [54] }, /fight roster/], [{ participants: [54, 20, 20] }, /fight roster/]]) {
    const samples = evidence('ready'); Object.assign(samples[4], change)
    assert.throws(() => validate(samples), error)
  }
})

test('source marker cannot excuse wrong original object, draw, native artwork, flip or submission', () => {
  for (const outcome of ['same-attack', 'expiry', 'walk', 'ready', 'recoil']) {
    for (const [change, error] of [[{ object: 0 }, /expected original object/], [{ draw: 0 }, /expected original draw/],
      [{ renderedDraw: 0 }, /submitted renderer draw/], [{ frame: 1 }, /displayed frame must match/],
      [{ flip: true }, /displayed flip must match/], [{ f2: 256 }, /f2 must fit its byte/],
      [{ f1: 2 }, /descriptor countdown/], [{ direction: 8 }, /direction outside original table/],
      [{ visible: false }, /visible body/], [{ submittedLayers: 0 }, /submitted on this renderer stamp/],
      [{ canvasConnected: false }, /connected game canvas/], [{ sceneStoreMatch: false }, /scene\/store identity/]]) {
      const samples = evidence(outcome); Object.assign(samples[4], change)
      assert.throws(() => validate(samples), error)
    }
  }
})

test('every observation phase requires actual submitted visible bodies and live canvas ownership', () => {
  for (const index of [0, 1, 2, 3, 4])
    for (const change of [{ submittedLayers: undefined }, { submittedLayers: [] }, { submittedLayers: 0 },
      { visible: false }, { sceneStoreMatch: false }, { canvasConnected: false }]) {
      const samples = evidence(); Object.assign(samples[index], change)
      assert.throws(() => validate(samples), /submitted on this renderer stamp|visible body|scene\/store identity|connected game canvas/)
    }
})

test('phase ordering, chronological clocks and complete paused hold are mandatory', () => {
  for (const [index, change, error] of [[2, { phase: 'paused' }, /explicit transition observation phase/],
    [3, { phase: 'running-before-pause', paused: false }, /phases must be ordered/],
    [2, { paused: false }, /paused boolean must match/], [3, { stamp: 362 }, /distinct chronological renderer stamps/],
    [4, { turn: 514, logicalStamp: 514 }, /turn observations must be chronological/],
    [4, { animationFrame: 1029 }, /animationFrame observations must be chronological/],
    [3, { animationFrame: 1031 }, /Paused hold must retain/],
    [3, { direction: 7, frame: 1003, flip: true }, /Paused hold must retain/],
    [3, { personFlags4: 1 }, /Paused hold must retain/], [3, { motionIsNative: true }, /Paused hold must retain/],
    [3, { participants: [20, 54] }, /Paused hold must retain/]]) {
    const samples = evidence(); Object.assign(samples[index], change)
    assert.throws(() => validate(samples), error)
  }
  for (const change of [{ action: 'special', animation: 'special', started: 515 }, { turn: 516, animationFrame: 1032 }]) {
    const samples = evidence()
    samples[3] = sample({ phase: 'public-paused-hold', paused: true, turn: 515, animationFrame: 1030,
      stamp: 363, cropFile: 'paused-second.png', ...change })
    assert.throws(() => validate(samples), /Paused hold must retain/)
  }
  for (const indexes of [[2, 3], [3], [4]])
    assert.throws(() => validate(evidence().filter((_, index) => !indexes.includes(index))), /paused-hold renderer visits|running-after-resume sample/)
})

test('all four planned crops are unique, same-observation, complete canvas-owned and overlay-clear', () => {
  for (const index of [0, 2, 3, 4]) {
    for (const field of ['bodyCanvasOwned', 'bodyInCanvas', 'cropOverlayClear'])
      for (const value of [false, undefined, 1]) {
        const samples = evidence(); samples[index][field] = value
        assert.throws(() => validate(samples), /native-frame crop body/)
      }
    const missing = evidence(); delete missing[index].cropFile
    assert.throws(() => validate(missing), /Exactly four unique/)
  }
  for (const value of ['', ' ', null, 1, 'bad\n.png', 'bad\r.png', 'bad\0.png']) {
    const samples = evidence(); samples[0].cropFile = value
    assert.throws(() => validate(samples), /crop filename required/)
  }
  const duplicate = evidence(); duplicate[3].cropFile = duplicate[2].cropFile
  assert.throws(() => validate(duplicate), /each native-frame crop must have its own file/)
  for (const index of [0, 2, 3, 4]) {
    const moved = evidence(); moved[1].cropFile = moved[index].cropFile; delete moved[index].cropFile
    assert.throws(() => validate(moved), /Planned crops must cover/)
  }
  const extra = evidence(); extra[1].cropFile = 'extra.png'
  assert.throws(() => validate(extra), /Exactly four unique/)
})

test('malformed observations and independently supplied original mappings fail closed', () => {
  for (const samples of [null, undefined, {}, []]) assert.throws(() => validate(samples), /samples required/)
  const malformed = evidence(); malformed[0] = null
  assert.throws(() => validate(malformed), /must be an object/)
  for (const key of ['turn', 'animationFrame', 'stamp', 'started', 'f1', 'f2', 'frame', 'direction',
    'opponent', 'fightGroup', 'personSpeed', 'personFlags2', 'personFlags4', 'logicalStamp']) {
    for (const value of [-1, 0.5, NaN, undefined, Number.MAX_SAFE_INTEGER + 1]) {
      const samples = evidence(); samples[0][key] = value
      assert.throws(() => validate(samples), /nonnegative integer/)
    }
  }
  const future = evidence(); future[0].started = future[0].turn + 1
  assert.throws(() => validate(future), /cannot start after observed turn/)
  const missingMapping = { ...mapping }; delete missingMapping['shaman:attack']
  assert.throws(() => validateMeleeTransitionFrames(evidence(), missingMapping, successors), /original mapping missing/)
  for (const change of [{ object: undefined }, { draw: undefined }, { step: undefined }, { frameCount: 0 }, { step: 1 }, { duration: 5 }, { directions: [] },
    { directions: Array(8).fill({ frames: [], flip: false }) },
    { directions: Array(8).fill({ frames: [1006], flip: 0 }) }]) {
    const changed = { ...mapping, 'shaman:attack': { ...mapping['shaman:attack'], ...change } }
    assert.throws(() => validateMeleeTransitionFrames(evidence(), changed, successors),
      /mapping|descriptor|frameCount|step0|duration|directions|frame list|flip/)
  }
  for (const value of [null, [], undefined]) {
    assert.throws(() => validateMeleeTransitionFrames(evidence(), value, successors), /mapping required/)
    assert.throws(() => validateMeleeTransitionFrames(evidence(), mapping, value), /mapping required/)
  }
  for (const change of [{ row: 9 }, { animationId: undefined }])
    assert.throws(() => validateMeleeTransitionFrames(evidence('ready'), mapping,
      { ...successors, idle: { ...successors.idle, ...change } }), /successor row|animationId/)
})
