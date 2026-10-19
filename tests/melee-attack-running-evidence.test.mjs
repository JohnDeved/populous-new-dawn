import assert from 'node:assert/strict'
import test from 'node:test'
import { validateMeleeRunningFrames } from '../scripts/tutorial-browser/melee-attack-running-evidence.mjs'
import rules from '../app/original-rules.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }

// Supplied observations only: no browser receipt, screenshot or historical pass.
const mapping = Object.fromEntries(Object.entries({ attack: 10, strike: 8, special: 16 }).map(([action, row]) => {
  const [object, draw] = rules.animationObjects[rules.personAnimationObjects[row * 9 + 7]]
  const step = rules.animationDescriptors[draw].step, frameCount = units.frameCounts[object]
  return [`shaman:${action}`, { object, draw, step, frameCount, duration: (step + 1) * frameCount,
    directions: units.shamanSources[object] }]
}))
const validate = samples => validateMeleeRunningFrames(samples, mapping)
function sample(overrides = {}) {
  const s = { id: 54, kind: 'shaman', action: 'attack', started: 514, opponent: 1207,
    turn: 514, animationFrame: 1028, stamp: 360, f1: 0, direction: 2,
    fightGroup: 7, personId: 54, personState: 25, personSpeed: 0, motionIsNative: false,
    personClass: 1, personModel: 7, workFlags: 7, personFlags2: 0x1080, personFlags4: 0,
    personIdentityMatch: true, fightMotionSourceAdmitted: true, flight: false, participants: [54, 1207],
    phase: 'running', paused: false, visible: true, submittedLayers: 2,
    canvasConnected: true, sceneStoreMatch: true, nativeAttackAnimation: true,
    bodyCanvasOwned: true, bodyInCanvas: true, cropOverlayClear: true, cropPlanned: true,
    ...overrides }
  const m = mapping[`shaman:${s.action}`]
  s.logicalStamp ??= s.turn; s.animation ??= s.action
  s.f2 ??= s.turn - s.started; s.remaining ??= m.duration - 1 - (s.turn - s.started)
  const direction = m.directions[s.direction]
  return { object: m.object, draw: m.draw, renderedDraw: m.draw,
    frame: direction.frames[s.f2 % direction.frames.length], flip: direction.flip, ...s }
}
const evidence = () => [sample({ cropFile: 'first.png' }),
  sample({ turn: 515, animationFrame: 1030, stamp: 361, cropFile: 'second.png' })]

test('cropped same-sequence running advancement preserves inputs and claims only running artwork', () => {
  const samples = evidence(), before = structuredClone({ samples, mapping })
  const result = validate(samples)
  assert.equal(result.protocol, 'running-original-artwork')
  assert.equal(result.sampleCount, 2); assert.equal(result.sequenceCount, 1)
  assert.deepEqual(result.cropFiles, ['first.png', 'second.png'])
  assert.deepEqual([result.obligations.runningAdvancement.before.turn, result.obligations.runningAdvancement.after.turn], [514, 515])
  assert.equal(result.obligations.sourceOwnership.claim, 'source-contract-inference')
  for (const key of ['browserPauseHoldResume', 'runningSameTurnHold', 'nativeRecoilParity'])
    assert.equal(result.obligations[key].status, 'not-claimed')
  assert.deepEqual({ samples, mapping }, before)
})

test('all original actions and eight directions obey independently mapped native cadence and flip', () => {
  for (const action of ['attack', 'strike', 'special']) for (let direction = 0; direction < 8; direction++) {
    const s = [sample({ action, direction, cropFile: 'a.png' }),
      sample({ action, direction, turn: 516, animationFrame: 1032, stamp: 362, cropFile: 'b.png' })]
    assert.equal(validate(s).sampleCount, 2)
  }
})

test('unpaused duplicate same-turn renders do not spend crops or change the advancing witness', () => {
  const samples = evidence(), duplicate = { ...samples[0], stamp: 361, cropPlanned: false }
  delete duplicate.cropFile; samples[1].stamp = 362
  const expected = validate(samples).obligations.runningAdvancement
  assert.deepEqual(validate([samples[0], duplicate, samples[1]]).obligations.runningAdvancement, expected)
})

test('strict shared checks reject corrupt native, mapped, visible, source and crop evidence', () => {
  const changes = { id: 13, kind: 'warrior', phase: 'public-paused-hold', paused: true,
    object: 424, draw: 13, renderedDraw: 13, f1: 1, f2: 0, frame: 1, flip: true,
    remaining: 9, animation: 'idle', nativeAttackAnimation: false, logicalStamp: 1,
    personId: 13, personState: 10, personModel: 1, personClass: 0, personSpeed: 1,
    workFlags: 8, personFlags2: 0x80000, personFlags4: 0x400, personIdentityMatch: false,
    flight: true, fightMotionSourceAdmitted: false, motionIsNative: null, participants: [54],
    canvasConnected: false, sceneStoreMatch: false, visible: false, submittedLayers: 0,
    bodyCanvasOwned: false, bodyInCanvas: false, cropOverlayClear: false, cropPlanned: false }
  for (const [key, value] of Object.entries(changes)) {
    const s = evidence(); s[1][key] = value
    assert.throws(() => validate(s), undefined, `must reject ${key}`)
  }
  for (const key of ['cropFile', 'remaining', 'nativeAttackAnimation', 'direction']) {
    const s = evidence(); delete s[1][key]; assert.throws(() => validate(s), undefined, `missing ${key}`)
  }
})

test('no cross-direction, cross-sequence or single-sample substitute can establish advancement', () => {
  assert.throws(() => validate([evidence()[0]]), /advancement required/)
  for (const override of [{ direction: 3 }, { started: 518, turn: 518 },
    { action: 'strike', started: 518, turn: 518 }]) {
    const s = [evidence()[0], sample({ turn: 515, animationFrame: 1030, stamp: 361,
      cropFile: 'second.png', ...override })]
    assert.throws(() => validate(s), /advancement required/)
  }
  for (const override of [{ opponent: 1208, participants: [54, 1208] }, { fightGroup: 8, workFlags: 8 }]) {
    const s = evidence(); Object.assign(s[1], override); assert.throws(() => validate(s), /retain the same/)
  }
})

// Supplied observations reproduce the failed hosted window, not a browser pass.
const retargetedEvidence = () => [
  ...[395, 396, 398].map((turn, index) => sample({ action: 'special', started: 395,
    turn, animationFrame: turn * 2, stamp: 345 + index, opponent: 13,
    fightGroup: 1252, workFlags: 1252, participants: [54, 1207, 19, 13],
    cropFile: `melee-attack-frame-${index}.png` })),
  ...[400, 402].map((turn, index) => sample({ started: 400, turn,
    animationFrame: turn * 2, stamp: 349 + index, opponent: 1207, direction: 6,
    fightGroup: 1252, workFlags: 1252, participants: [54, 1207, 19, 13],
    ...(index ? { cropPlanned: false } : { cropFile: 'melee-attack-frame-3.png' }) })),
]

test('a later post-expiry entry may retarget without dropping either entry or its crop obligations', () => {
  const samples = retargetedEvidence(), before = structuredClone(samples), result = validate(samples)
  assert.equal(result.sampleCount, 5); assert.equal(result.sequenceCount, 2)
  assert.equal(result.cropFiles.length, 4)
  const { before: first, after } = result.obligations.runningAdvancement
  assert.deepEqual([first.started, first.opponent, after.started, after.opponent], [395, 13, 395, 13])
  assert.deepEqual(samples, before)
  for (const change of [s => { delete s[3].cropFile }, s => { s[4].frame = 424 },
    s => { s[4].nativeAttackAnimation = false }, s => { s[4].personIdentityMatch = false },
    s => { s[4].participants = [54, 13] }]) {
    const invalid = retargetedEvidence(); change(invalid)
    assert.throws(() => validate(invalid), undefined, 'a successful earlier pair cannot hide invalid later coverage')
  }
})

test('new entries with the same action can retarget but cannot supply a cross-entry advancing pair', () => {
  const later = sample({ started: 518, turn: 518, animationFrame: 1036, stamp: 362,
    opponent: 1208, participants: [54, 1207, 1208], cropFile: 'third.png' })
  assert.equal(validate([...evidence(), later]).sequenceCount, 2)
  assert.throws(() => validate([evidence()[0], later]), /advancement required/)
})

test('entry identity locks action and opponent even when a changed key would create a new sequence', () => {
  for (const override of [{ opponent: 1208, participants: [54, 1207, 1208] }, { action: 'strike' }]) {
    const s = [evidence()[0], sample({ turn: 515, animationFrame: 1030, stamp: 361,
      cropFile: 'second.png', ...override })]
    assert.throws(() => validate(s), /same (opponent|action)/)
  }
})

test('changed entry stamps cannot reset an active attack, regress, or start on its expiry turn', () => {
  for (const started of [513, 515, 516, 517]) {
    const later = sample({ started, turn: Math.max(515, started), animationFrame: 1036, stamp: 362,
      opponent: 1208, participants: [54, 1207, 1208], cropFile: 'third.png' })
    assert.throws(() => validate([...evidence(), later]), /entry.*(chronological|expiry)/)
  }
  const s = retargetedEvidence()
  s.push(sample({ started: 400, turn: 403, animationFrame: 806, stamp: 351,
    fightGroup: 1252, workFlags: 1252, direction: 6, cropPlanned: false }))
  assert.throws(() => validate(s), /cannot survive its native expiry/)
})

test('invalid later samples fail even after a complete valid witness and after the four-crop budget', () => {
  const s = evidence()
  s.push(sample({ turn: 516, animationFrame: 1032, stamp: 362, cropFile: 'third.png' }),
    sample({ started: 518, turn: 518, animationFrame: 1036, stamp: 363, cropFile: 'fourth.png' }),
    sample({ started: 518, turn: 519, animationFrame: 1038, stamp: 364, cropPlanned: false }))
  assert.equal(validate(s).sampleCount, 5)
  s[4].frame = 424; assert.throws(() => validate(s), /displayed frame/)
})

test('first four pose slots are compulsory, duplicates and late replacements cannot hide failures', () => {
  const s = evidence(); delete s[0].cropFile
  assert.throws(() => validate(s), /every planned crop required/)
  const dup = { ...evidence()[0], stamp: 361, cropFile: 'duplicate.png' }
  assert.throws(() => validate([evidence()[0], dup]), /first four distinct poses/)
  const sameFile = evidence(); sameFile[1].cropFile = sameFile[0].cropFile
  assert.throws(() => validate(sameFile), /own file/)
})

test('fixed window and exact attack expiry cannot be extended for a nicer witness', () => {
  const s = evidence()
  s.push(sample({ started: 524, turn: 524, animationFrame: 1048, stamp: 370, cropFile: 'late.png' }))
  assert.throws(() => validate(s), /fixed first-attack ten-turn window/)
  const expired = evidence(); expired[1] = sample({ turn: 517, animationFrame: 1034, stamp: 365, cropFile: 'expiry.png' })
  assert.throws(() => validate(expired), /cannot survive its native expiry/)
})

test('independent mapping corruption and backwards renderer/logical clocks fail closed', () => {
  for (const key of ['object', 'draw', 'step', 'frameCount', 'duration']) {
    const broken = structuredClone(mapping); broken['shaman:attack'][key]++
    assert.throws(() => validateMeleeRunningFrames(evidence(), broken))
  }
  for (const change of [{ stamp: 360 }, { turn: 513 }, { animationFrame: 1027 }]) {
    const s = evidence(); Object.assign(s[1], change); assert.throws(() => validate(s))
  }
})
