import assert from 'node:assert/strict'

const attacks = new Set(['attack', 'strike', 'special'])
const integer = value => Number.isSafeInteger(value) && value >= 0
const advances = (before, after) => after.turn > before.turn &&
  after.f2 !== before.f2 && after.frame !== before.frame
const hasAdvance = samples => samples.some((after, index) =>
  samples.slice(0, index).some(before => advances(before, after)))

function validateMapping(mapping, key) {
  assert.ok(mapping && integer(mapping.object) && integer(mapping.draw), `${key}: original object/draw mapping required`)
  assert.ok(integer(mapping.step), `${key}: original descriptor step required`)
  assert.ok(Array.isArray(mapping.directions) && mapping.directions.length === 8,
    `${key}: eight original sprite directions required`)
  for (const direction of mapping.directions) {
    assert.ok(Array.isArray(direction?.frames) && direction.frames.length > 0 && direction.frames.every(integer),
      `${key}: original directional frame list required`)
    assert.equal(typeof direction.flip, 'boolean', `${key}: original direction flip required`)
  }
}

// Pure validation of post-render observations, not a browser runner or PNG reader.
// The caller owns original-table hashes, public M2 setup, spriteDirection, renderer
// submission observation, and capture/file verification. A true ownership marker
// plus matching displayed frames is evidence, not direct render-source identity;
// the real-caller Node test proves that separate boundary. No marker can excuse an
// idle object, incorrect selected frame, missing body submission, or absent crops.
export function validateMeleeAttackFrames(samples, originalMapping) {
  assert.ok(Array.isArray(samples) && samples.length > 0, 'Observed melee attack samples required')
  assert.ok(originalMapping && typeof originalMapping === 'object' && !Array.isArray(originalMapping),
    'Original melee mapping required')
  const sequences = new Map(), mappings = new Set(), cropFiles = new Set(), renderedPeople = new Set()
  let previous
  for (const sample of samples) {
    assert.ok(sample && typeof sample === 'object', 'Attack sample must be an object')
    const label = `${sample.kind}${sample.id}/${sample.action}`
    assert.ok((sample.id === 54 && sample.kind === 'shaman') || (sample.id === 13 && sample.kind === 'warrior'),
      `${label}: authored M2 Shaman54 or Warrior13 required`)
    assert.ok(attacks.has(sample.action), `${label}: attack, strike or special required; recoil is not attack evidence`)
    for (const key of ['turn', 'animationFrame', 'started', 'stamp', 'f1', 'f2', 'frame', 'direction'])
      assert.ok(integer(sample[key]), `${label}: nonnegative integer ${key} required`)
    assert.ok(sample.started <= sample.turn, `${label}: attack cannot start after observed turn`)
    const key = `${sample.kind}:${sample.action}`
    assert.ok(Object.hasOwn(originalMapping, key), `${key}: original mapping missing`)
    const mapping = originalMapping[key]
    if (!mappings.has(key)) { validateMapping(mapping, key); mappings.add(key) }
    // These independent expectations intentionally precede the ownership marker.
    assert.equal(sample.object, mapping.object, `${label}: expected original attack object ${mapping.object}`)
    assert.equal(sample.draw, mapping.draw, `${label}: expected original attack draw ${mapping.draw}`)
    assert.ok(sample.direction < mapping.directions.length, `${label}: direction outside original table`)
    assert.ok(sample.f2 <= 255, `${label}: native f2 must fit its byte`)
    assert.ok(sample.f1 <= Math.max(1, mapping.step), `${label}: f1 outside original descriptor countdown`)
    const direction = mapping.directions[sample.direction]
    assert.equal(sample.frame, direction.frames[sample.f2 % direction.frames.length],
      `${label}: displayed frame must match original direction and native f2`)
    assert.equal(sample.flip, direction.flip, `${label}: displayed flip must match original direction`)
    assert.equal(sample.nativeAttackAnimation, true, `${label}: native attack ownership marker required`)
    assert.equal(sample.canvasConnected, true, `${label}: connected game canvas required`)
    assert.equal(sample.sceneStoreMatch, true, `${label}: live scene/store identity required`)
    assert.equal(sample.paused, false, `${label}: unpaused gameplay required`)
    assert.equal(sample.visible, true, `${label}: visible attack body required`)
    assert.ok(integer(sample.submittedLayers) && sample.submittedLayers > 0,
      `${label}: visible body layers submitted on this renderer stamp required`)
    if (previous) {
      for (const key of ['stamp', 'turn', 'animationFrame'])
        assert.ok(sample[key] >= previous[key], `${label}: ${key} observations must be chronological`)
      if (sample.stamp === previous.stamp)
        assert.deepEqual([sample.turn, sample.animationFrame], [previous.turn, previous.animationFrame],
          `${label}: one renderer stamp cannot describe different clocks`)
    }
    const renderedPerson = `${sample.stamp}:${sample.id}`
    assert.ok(!renderedPeople.has(renderedPerson), `${label}: duplicate person observation on one renderer stamp`)
    renderedPeople.add(renderedPerson)
    const sequenceKey = JSON.stringify([sample.id, sample.kind, sample.action, sample.started])
    let sequence = sequences.get(sequenceKey)
    if (!sequence) {
      sequence = { id: sample.id, kind: sample.kind, action: sample.action, started: sample.started,
        samples: [], turns: new Map(), views: new Map(), heldPairs: 0, crops: [] }
      sequences.set(sequenceKey, sequence)
    }
    const sameTurn = sequence.turns.get(sample.turn)
    if (sameTurn)
      assert.deepEqual([sample.f1, sample.f2], [sameTurn.f1, sameTurn.f2],
        `${label}: same logical turn must retain native f1/f2`)
    sequence.turns.set(sample.turn, sample)
    const viewKey = `${sample.turn}:${sample.direction}`, sameView = sequence.views.get(viewKey)
    if (sameView) {
      assert.deepEqual([sample.f2, sample.frame, sample.flip], [sameView.f2, sameView.frame, sameView.flip],
        `${label}: same turn/direction must retain native frame`)
      sequence.heldPairs++
    }
    sequence.views.set(viewKey, sample)
    if (sample.cropFile !== undefined) {
      assert.ok(typeof sample.cropFile === 'string' && sample.cropFile.trim() && !/[\0\r\n]/.test(sample.cropFile),
        `${label}: native-frame crop filename required`)
      assert.ok(!cropFiles.has(sample.cropFile), `${label}: each native-frame crop must have its own file`)
      cropFiles.add(sample.cropFile)
      sequence.crops.push(sample)
    }
    sequence.samples.push(sample)
    previous = sample
  }
  assert.ok(cropFiles.size >= 2 && cropFiles.size <= 4, 'Two to four native-frame crop files required')
  const shamans = [...sequences.values()].filter(sequence => sequence.id === 54)
  assert.ok(shamans.length > 0, 'At least one authored Shaman54 attack sequence required')
  const held = shamans.filter(sequence => sequence.heldPairs > 0)
  assert.ok(held.length > 0, 'Shaman54 attack must show a same-turn/direction hold across rendered frames')
  const advancing = held.filter(sequence => hasAdvance(sequence.samples))
  assert.ok(advancing.length > 0, 'One held Shaman54 sequence must advance native f2 and artwork over logical turns')
  const sequence = advancing.find(sequence => hasAdvance(sequence.crops))
  assert.ok(sequence, 'One qualifying Shaman54 sequence needs crops of distinct native f2/artwork over advancing turns')
  return {
    sampleCount: samples.length, sequenceCount: sequences.size, cropFiles: [...cropFiles],
    shamanSequence: {
      id: sequence.id, kind: sequence.kind, action: sequence.action, started: sequence.started,
      sampleCount: sequence.samples.length, firstTurn: sequence.samples[0].turn,
      lastTurn: sequence.samples.at(-1).turn, heldPairs: sequence.heldPairs,
      distinctF2: [...new Set(sequence.samples.map(sample => sample.f2))],
      distinctFrames: [...new Set(sequence.samples.map(sample => sample.frame))],
      crops: sequence.crops.map(({ cropFile, stamp, turn, direction, f2, frame }) =>
        ({ cropFile, stamp, turn, direction, f2, frame })),
    },
  }
}
