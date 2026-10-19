import assert from 'node:assert/strict'

const attacks = new Set(['attack', 'strike', 'special'])
const phases = ['running-before-pause', 'public-paused-hold', 'running-after-resume']
const integer = value => Number.isSafeInteger(value) && value >= 0
const sequenceKey = sample => JSON.stringify([sample.action, sample.started])
const advances = (before, after) => after.turn > before.turn &&
  after.f2 !== before.f2 && after.frame !== before.frame
const observation = ({ phase, stamp, turn, animationFrame, action, started, opponent,
  fightGroup, remaining, animation, personId, personState, personSpeed, motionIsNative,
  logicalStamp, flight, object, draw, renderedDraw, f1, f2, direction, frame, flip, cropFile }) => ({
  phase, stamp, turn, animationFrame, action, started, opponent, fightGroup, remaining,
  animation, personId, personState, personSpeed, motionIsNative, logicalStamp, flight,
  object, draw, renderedDraw, f1, f2, direction, frame, flip, cropFile,
})

function validateMapping(mapping, key, attack = false) {
  assert.ok(mapping && integer(mapping.object) && integer(mapping.draw), `${key}: original object/draw mapping required`)
  assert.ok(integer(mapping.step), `${key}: original descriptor step required`)
  assert.ok(integer(mapping.frameCount) && mapping.frameCount > 0 && mapping.frameCount <= 256,
    `${key}: original native frameCount required`)
  assert.ok(Array.isArray(mapping.directions) && mapping.directions.length === 8,
    `${key}: eight original sprite directions required`)
  for (const direction of mapping.directions) {
    assert.ok(Array.isArray(direction?.frames) && direction.frames.length > 0 && direction.frames.every(integer),
      `${key}: original directional frame list required`)
    assert.equal(typeof direction.flip, 'boolean', `${key}: original direction flip required`)
  }
  if (attack) {
    assert.equal(mapping.step, 0, `${key}: source-qualified Shaman attack requires descriptor step0`)
    assert.ok(integer(mapping.duration) && mapping.duration > 1, `${key}: original attack duration required`)
    assert.equal(mapping.duration, (mapping.step + 1) * mapping.frameCount,
      `${key}: attack duration must equal original descriptor cadence times native frameCount`)
  }
}

function validateArtwork(sample, mapping, label) {
  assert.equal(sample.object, mapping.object, `${label}: expected original object ${mapping.object}`)
  assert.equal(sample.draw, mapping.draw, `${label}: expected original draw ${mapping.draw}`)
  assert.equal(sample.renderedDraw, sample.draw, `${label}: submitted renderer draw must match the physical original draw`)
  assert.ok(sample.direction < mapping.directions.length, `${label}: direction outside original table`)
  assert.ok(sample.f2 <= 255, `${label}: native f2 must fit its byte`)
  assert.ok(sample.f1 <= Math.max(1, mapping.step), `${label}: f1 outside original descriptor countdown`)
  const direction = mapping.directions[sample.direction]
  assert.equal(sample.frame, direction.frames[sample.f2 % direction.frames.length],
    `${label}: displayed frame must match original direction and native f2`)
  assert.equal(sample.flip, direction.flip, `${label}: displayed flip must match original direction`)
}

function validateAttackPhase(sample, mapping, label) {
  // The entry reset is f1=1/f2=0. Its ordinary logical animation visit consumes
  // f1, so the post-render entry observation is f1=0/f2=0, not a renderer tick.
  const elapsed = sample.turn - sample.started
  assert.deepEqual([sample.f1, sample.f2], [0, elapsed % mapping.frameCount],
    `${label}: native attack phase must match elapsed logical turns from entry`)
}

function validateAttack(sample, mapping, label) {
  validateArtwork(sample, mapping, label)
  const remaining = mapping.duration - 1 - (sample.turn - sample.started)
  assert.ok(remaining > 0, `${label}: attack cannot survive its native expiry turn`)
  assert.equal(sample.remaining, remaining, `${label}: remaining must equal exact original attack countdown`)
  assert.equal(sample.animation, sample.action, `${label}: attack animation must retain its action`)
  assert.equal(sample.personSpeed, 0, `${label}: attack physical person must be stopped`)
  assert.equal(sample.nativeAttackAnimation, true, `${label}: native attack ownership marker required`)
  validateAttackPhase(sample, mapping, label)
}

function validateSuccessor(sample, anchor, attackMapping, originalMapping, successorMapping) {
  const expiryTurn = anchor.started + attackMapping.duration - 1
  assert.ok(sample.turn >= expiryTurn, 'Legal successor cannot replace the attack before native expiry')
  assert.ok(['approach', 'ready', 'recoil'].includes(sample.action),
    'Only approach, ready or source-qualified recoil may succeed the expired attack; never a future attack')
  assert.equal(sample.remaining, null, 'Legal successor must have absent remaining, recorded as null')
  let source, mapping
  if (sample.action === 'recoil') {
    assert.ok(sample.turn > expiryTurn, 'Recoil must follow the expired attack and a later ready visit')
    // A new shortest Shaman attack can start at E+1, expire at E+4, and
    // receive recoil at E+5. At that point endpoints cannot exclude it.
    assert.ok(sample.turn < expiryTurn + 5, 'Recoil timing must exclude an unobserved future actor attack')
    assert.equal(sample.started, sample.turn, 'Recoil must be the immediate same-turn opponent-produced successor')
    assert.equal(sample.animation, 'idle', 'Only uninitialized recoil using the existing idle source is admitted')
    assert.equal(sample.nativeAttackAnimation, false, 'Recoil must not borrow the expired attack ownership marker')
    assert.equal(sample.personSpeed, 0, 'Recoil physical person must be stopped')
    const opponent = sample.opponentFight
    assert.ok(opponent && opponent.kind === 'shaman' && opponent.id === anchor.opponent && opponent.group === anchor.fightGroup &&
      opponent.opponent === 54 && attacks.has(opponent.action) && opponent.started === sample.turn,
    'Recoil needs the retained opponent same-turn attack producer in the same fight group')
    const opponentKey = `${opponent.kind}:${opponent.action}`
    assert.ok(Object.hasOwn(originalMapping, opponentKey), 'Recoil opponent needs independent original attack mapping')
    validateMapping(originalMapping[opponentKey], opponentKey, true)
    assert.deepEqual([opponent.object, opponent.draw],
      [originalMapping[opponentKey].object, originalMapping[opponentKey].draw],
      'Recoil producer must use its independently mapped original attack object/draw')
    assert.equal(opponent.remaining, originalMapping[opponentKey].duration - 1,
      'Recoil opponent must retain its exact original entry countdown')
    assert.ok(sample.participants.indexOf(54) < sample.participants.indexOf(anchor.opponent),
      'Recoil producer must follow the actor in the observed fight processing order')
    source = 'recoil'
  } else {
    assert.equal(sample.started, anchor.started, 'Approach/ready must retain the expired attack start, not a future sequence')
    assert.equal(sample.nativeAttackAnimation, true, 'Approach/ready must retain the original attack ownership marker')
    if (sample.turn === expiryTurn) {
      assert.equal(sample.action, 'approach', 'Exact expiry changes attack to approach only')
      assert.equal(sample.animation, anchor.action, 'Exact expiry must retain the original attack animation')
      assert.equal(sample.personSpeed, 0, 'Exact expiry must retain the stopped attack physical person')
      validateArtwork(sample, attackMapping, 'Exact-expiry approach')
      validateAttackPhase(sample, attackMapping, 'Exact-expiry approach')
      return { expiryTurn, source: 'expired-attack-carry', claim: 'unchanged-renderer-consistency' }
    }
    source = sample.personSpeed > 0 ? 'walk' : 'idle'
    assert.equal(sample.animation, source, 'Later approach/ready animation must match physical movement or idle')
    if (sample.action === 'ready') assert.equal(source, 'idle', 'Ready successor must be stopped and idle')
  }
  assert.ok(Object.hasOwn(successorMapping, source), `Original ${source} successor mapping missing`)
  mapping = successorMapping[source]
  validateMapping(mapping, source)
  assert.equal(mapping.row, { idle: 0, walk: 1, recoil: 9 }[source], `${source}: exact original successor row required`)
  assert.ok(integer(mapping.animationId), `${source}: original animationId required`)
  validateArtwork(sample, mapping, `${sample.action}/${source}`)
  return { expiryTurn, source, claim: 'unchanged-renderer-consistency' }
}

// Pure synthetic/post-render observation validation, not browser acceptance.
// The caller owns table provenance, actual public input receipts, continuous
// first-post-resume observation, and synchronous PNG capture/file verification.
// fightMotionSourceAdmitted is a reviewed-source inference plus independent
// artwork checks, NOT direct observation of the private renderer source getter.
// Successors prove existing renderer consistency, never new native recoil parity.
export function validateMeleeTransitionFrames(samples, originalMapping, successorMapping) {
  assert.ok(Array.isArray(samples) && samples.length > 0, 'Observed melee transition samples required')
  for (const [name, mapping] of [['Original melee', originalMapping], ['Original successor', successorMapping]])
    assert.ok(mapping && typeof mapping === 'object' && !Array.isArray(mapping), `${name} mapping required`)
  const groups = phases.map(() => []), cropFiles = new Set(), sequences = new Map()
  let previous, previousPhase = 0
  for (const sample of samples) {
    assert.ok(sample && typeof sample === 'object', 'Melee transition sample must be an object')
    const label = `${sample.kind}${sample.id}/${sample.action}`, phase = phases.indexOf(sample.phase)
    assert.ok(sample.id === 54 && sample.kind === 'shaman', `${label}: authored M2 Shaman54 required`)
    assert.ok(phase >= 0, `${label}: explicit transition observation phase required`)
    assert.ok(phase >= previousPhase, `${label}: phases must be ordered running-before, paused-hold, running-after`)
    assert.equal(sample.paused, phase === 1, `${label}: paused boolean must match observation phase`)
    for (const key of ['turn', 'animationFrame', 'started', 'stamp', 'f1', 'f2', 'frame', 'direction',
      'opponent', 'fightGroup', 'personSpeed', 'personFlags2', 'personFlags4', 'logicalStamp'])
      assert.ok(integer(sample[key]), `${label}: nonnegative integer ${key} required`)
    assert.equal(sample.logicalStamp, sample.turn, `${label}: physical animation stamp must match the observed logical turn`)
    assert.ok(sample.started <= sample.turn, `${label}: action cannot start after observed turn`)
    assert.ok(sample.fightGroup > 0, `${label}: nonzero fight group required`)
    assert.equal(sample.personId, 54, `${label}: original physical person54 required`)
    assert.equal(sample.personState, 25, `${label}: physical person must remain in fight state25`)
    assert.equal(sample.personModel, 7, `${label}: original Shaman model7 required`)
    assert.equal(sample.personClass, 1, `${label}: original person class1 required`)
    assert.equal(sample.workFlags, sample.fightGroup, `${label}: physical person must belong to the fight group`)
    assert.equal(sample.flight, false, `${label}: flight override is not admitted`)
    assert.equal(sample.personFlags2 & 0x80000, 0, `${label}: airborne physical person is not admitted`)
    assert.equal(sample.personFlags4 & 0x400, 0, `${label}: airborne physics override is not admitted`)
    assert.equal(sample.personIdentityMatch, true, `${label}: retained original physical-person identity required`)
    assert.equal(typeof sample.motionIsNative, 'boolean', `${label}: physical/native source identity observation required`)
    const sourceAdmitted = (sample.nativeAttackAnimation === true && (attacks.has(sample.action) || sample.action === 'approach')) ||
      ['walk', 'idle'].includes(sample.animation) || sample.motionIsNative
    assert.ok(sourceAdmitted && sample.fightMotionSourceAdmitted === true,
      `${label}: fight-motion source-contract inference required`)
    assert.ok(Array.isArray(sample.participants) && sample.participants.every(integer) &&
      new Set(sample.participants).size === sample.participants.length &&
      sample.participants.includes(54) && sample.participants.includes(sample.opponent) && sample.opponent !== 54,
    `${label}: actor and retained opponent must be present in the fight roster`)
    for (const [key, error] of [['canvasConnected', 'connected game canvas'],
      ['sceneStoreMatch', 'live scene/store identity'], ['visible', 'visible body']])
      assert.equal(sample[key], true, `${label}: ${error} required`)
    assert.ok(integer(sample.submittedLayers) && sample.submittedLayers > 0,
      `${label}: visible body layers submitted on this renderer stamp required`)
    if (previous) {
      assert.ok(sample.stamp > previous.stamp, `${label}: distinct chronological renderer stamps required`)
      for (const key of ['turn', 'animationFrame'])
        assert.ok(sample[key] >= previous[key], `${label}: ${key} observations must be chronological`)
      for (const key of ['fightGroup', 'opponent'])
        assert.equal(sample[key], previous[key], `${label}: observations must retain the same ${key}`)
    }
    if (phase < 2 || attacks.has(sample.action)) {
      assert.ok(attacks.has(sample.action), `${label}: pre-resume observations must be attack, strike or special`)
      const key = `${sample.kind}:${sample.action}`
      assert.ok(Object.hasOwn(originalMapping, key), `${key}: original mapping missing`)
      validateMapping(originalMapping[key], key, true)
      validateAttack(sample, originalMapping[key], label)
    }
    const key = sequenceKey(sample), sequence = sequences.get(key) ?? []
    const sameTurn = sequence.find(earlier => earlier.turn === sample.turn)
    if (sameTurn) assert.deepEqual([sample.f1, sample.f2], [sameTurn.f1, sameTurn.f2],
      `${label}: same logical turn must retain native f1/f2`)
    sequence.push(sample); sequences.set(key, sequence)
    if (sample.cropFile !== undefined) {
      assert.ok(typeof sample.cropFile === 'string' && sample.cropFile.trim() && !/[\0\r\n]/.test(sample.cropFile),
        `${label}: native-frame crop filename required`)
      assert.ok(!cropFiles.has(sample.cropFile), `${label}: each native-frame crop must have its own file`)
      for (const [key, error] of [['bodyCanvasOwned', 'canvas-owned'], ['bodyInCanvas', 'completely inside the canvas'],
        ['cropOverlayClear', 'overlay-clear']])
        assert.equal(sample[key], true, `${label}: native-frame crop body must be ${error}`)
      cropFiles.add(sample.cropFile)
    }
    groups[phase].push(sample)
    previous = sample; previousPhase = phase
  }

  const [before, paused, after] = groups
  assert.ok(before.length >= 2, 'At least two unpaused running-before-pause samples required')
  assert.ok(paused.length >= 2, 'At least two distinct public-paused-hold renderer visits required')
  assert.ok(after.length > 0, 'At least one unpaused running-after-resume sample required')
  const anchor = paused[0], anchorKey = sequenceKey(anchor)
  const heldKeys = ['turn', 'animationFrame', 'action', 'started', 'object', 'draw', 'f1', 'f2',
    'direction', 'frame', 'flip', 'opponent', 'fightGroup', 'remaining', 'animation', 'personSpeed',
    'nativeAttackAnimation', 'personFlags2', 'personFlags4', 'motionIsNative']
  for (const sample of paused.slice(1))
    for (const key of heldKeys)
      assert.equal(sample[key], anchor[key], `Paused hold must retain ${key} across distinct renderer stamps`)
  for (const sample of paused.slice(1))
    assert.deepEqual(sample.participants, anchor.participants, 'Paused hold must retain the fight roster and processing order')
  const running = before.filter(sample => sequenceKey(sample) === anchorKey)
  const runningAfter = running.find((later, index) => running.slice(0, index).some(earlier => advances(earlier, later)))
  assert.ok(runningAfter, 'Paused anchor needs same-sequence native phase and artwork advancement entirely before Pause')
  const runningBefore = running.find(earlier => advances(earlier, runningAfter))
  const advanced = after.filter(sample => sample.turn > anchor.turn)
  assert.equal(advanced.length, 1, 'Exactly one first logical-clock-advanced post-resume observation required')
  const resumed = advanced[0]
  assert.equal(after.at(-1), resumed, 'Observation must stop at the first logical-clock-advanced post-resume frame')
  for (const sample of after.slice(0, -1))
    for (const key of heldKeys.filter(key => key !== 'animationFrame'))
      assert.equal(sample[key], anchor[key], `Pre-advance resumed observation must retain ${key}`)
  let resumedOutcome
  if (attacks.has(resumed.action)) {
    assert.equal(sequenceKey(resumed), anchorKey, 'Resumed attack must retain paused action/start; a future attack cannot substitute')
    assert.ok(advances(anchor, resumed), 'Same resumed attack must advance native phase and artwork from the paused pose')
    resumedOutcome = { outcome: 'same-attack', claim: 'same-sequence-native-advancement' }
  } else {
    resumedOutcome = { outcome: 'legal-successor', ...validateSuccessor(resumed, anchor,
      originalMapping[`shaman:${anchor.action}`], originalMapping, successorMapping) }
  }
  const plannedCrops = [before[0], paused[0], paused[1], resumed]
  assert.equal(cropFiles.size, 4, 'Exactly four unique native-frame crop files required')
  for (const sample of plannedCrops)
    assert.ok(sample.cropFile !== undefined, 'Planned crops must cover first running, first two paused visits and first advanced resumed observation')
  assert.ok(samples.every(sample => sample.cropFile === undefined || plannedCrops.includes(sample)),
    'Only the four planned observation roles may have crops')
  return {
    protocol: 'layered-public-melee-transition', sampleCount: samples.length, sequenceCount: sequences.size,
    cropFiles: [...cropFiles],
    shamanSequence: { id: 54, kind: 'shaman', action: anchor.action, started: anchor.started,
      opponent: anchor.opponent, fightGroup: anchor.fightGroup },
    obligations: {
      originalMappedArtwork: { status: 'passed', sampleCount: samples.length },
      sourceOwnership: { status: 'passed', claim: 'source-contract-inference',
        reason: 'Reviewed source predicates and independent mapped artwork, not direct renderer-source identity observation.' },
      runningAdvancement: { status: 'passed', before: observation(runningBefore), after: observation(runningAfter) },
      pausedHold: { status: 'passed', sampleCount: paused.length, anchor: observation(anchor), stamps: paused.map(sample => sample.stamp) },
      resumedOutcome: { status: 'passed', ...resumedOutcome, before: observation(anchor), after: observation(resumed) },
      runningSameTurnHold: { status: 'not-claimed',
        reason: 'Paused renderer visits are not running same-turn evidence; CPU cadence and real-caller checks remain separate.' },
      nativeRecoilParity: { status: 'not-claimed', reason: 'A mapped successor proves unchanged renderer consistency, not native recoil entry or cadence.' },
    },
  }
}
