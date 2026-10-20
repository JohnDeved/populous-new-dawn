import assert from 'node:assert/strict'
import native from '../../tests/fixtures/shaman-casting-native.json' with { type: 'json' }
import units from '../../app/original-units.json' with { type: 'json' }

// Original-byte fixture owns expectations; the imported catalog supplies only
// the observed render-index -> original VFRA identity bridge. No live animation
// getter, cast initializer or person-row helper supplies expected frames.
export const castingArtworkReference = {
  provenance: native.provenance,
  object: native.objects[109][0], draw: native.objects[109][1],
  frameCount: native.cycles.find(c => c.team === 'blue' && c.direction === 0).frames.length,
  directions: native.cycles.filter(c => c.team === 'blue'),
  renderSources: Object.fromEntries(units.frames.flatMap((frame, index) =>
    native.cycles.some(c => c.team === 'blue' && c.frames.includes(frame.source)) ? [[index, frame.source]] : [])),
}

const equal = (actual, expected, label) => assert.deepEqual(actual, expected, label)
const integer = value => Number.isSafeInteger(value) && value >= 0
function grounded(state) {
  for (const key of ['turn', 'stock', 'storedStock', 'casts', 'nativeCasts', 'cooldown'])
    assert.ok(integer(state[key]), `Missing/invalid ${key}`)
  for (const key of ['id', 'state', 'object', 'draw', 'f1', 'f2', 'timer', 'counter', 'orderModel'])
    assert.ok(integer(state.person[key]), `Missing/invalid person ${key}`)
  assert.equal(state.level, 1)
  assert.equal(state.speed, 1)
  assert.equal(state.inputMask, 0)
  assert.ok(state.person.hp > 0)
  equal([state.person.vehicle, state.person.flight, state.person.lift], [0, false, 0])
  assert.equal(state.person.flags2 & (0x100000 | 0x80000), 0)
  assert.equal(state.person.flags4 & 0x400, 0)
  assert.equal(state.person.sameOwner, true)
  assert.equal(state.gameFlags & 32, 0)
  assert.equal(state.tribeFlags & 0x80000, 0, 'No unlimited-range eligibility bypass')
}

export function validateShamanCastingEvidence(result, reference = castingArtworkReference) {
  assert.equal(result?.closed, true)
  assert.equal(result.restored, true)
  equal(result.errors, [])
  equal(result.casts.map(c => c.label), ['ordinary', 'subsequent'])
  equal([reference.object, reference.draw, reference.frameCount], [520, 14, 12])
  const accepted = []
  for (const [index, record] of result.casts.entries()) {
    const { before, after, logical, frames, crops } = record, entry = after.person
    assert.equal(record.trusted, true)
    assert.equal(record.button, 0)
    for (const state of [before, after]) {
      grounded(state)
      equal([state.paused, state.suspended], [false, false])
    }
    assert.equal(before.cheatsUsed, !!index, 'First charge must predate any testing grant')
    assert.equal(after.cheatsUsed, before.cheatsUsed)
    assert.equal(before.mode, 'blast'); assert.equal(after.mode, null)
    assert.ok(before.stock > 0, 'Naturally available initial Blast stock required')
    equal([after.turn, after.stock, after.storedStock, after.mana, after.casts, after.nativeCasts],
      [before.turn, before.stock - 1, before.stock - 1, before.mana, before.casts + 1,
        (before.nativeCasts + 1) & 255], 'Synchronous normal one-charge allocation')
    assert.equal(before.cooldown, 0)
    assert.equal(after.cooldown, 12)
    assert.equal(before.person.state, 10, 'Ordinary resting entry, not combat/seated/opening cast')
    assert.notEqual(before.person.orderModel, 18, 'Opening-order compatibility guard is not the witness')
    equal([entry.state, entry.object, entry.draw, entry.f1, entry.timer, entry.casting],
      [22, reference.object, reference.draw, 0, 10, true])
    assert.equal(entry.f2, before.person.f2 < 12 ? before.person.f2 : 0, 'Retain valid entry phase')
    const prior = new Set(before.projectiles.map(shot => shot.id)),
      allocated = after.projectiles.filter(shot => !prior.has(shot.id))
    equal(allocated, [{ id: record.shot, caster: entry.id, phase: 'windup', remaining: 6 }])
    assert.equal(record.done, true)
    assert.ok(integer(record.shot))
    equal(record.terminal, { turn: after.turn + 12, reason: 'twelve-natural-visits' })
    assert.equal(logical.length, 12)
    const waves = new Set()
    for (const [offset, state] of logical.entries()) {
      const visit = offset + 1, p = state.person, shot = state.projectiles.find(shot => shot.id === record.shot)
      grounded(state)
      equal([state.turn, state.paused, state.suspended, state.casts, state.cooldown],
        [after.turn + visit, false, false, after.casts, 12 - visit])
      assert.equal(p.id, entry.id)
      if (visit < 10) {
        equal([p.state, p.object, p.draw, p.timer, p.f1, p.f2],
          [22, 520, 14, 10 - visit, 0, (entry.f2 + visit - 1) % 12],
          'afterTurn observes controller result before this visit’s logical animation')
        assert.equal(p.counter, (entry.counter + visit) & 255)
      } else assert.notEqual(p.state, 22, 'Cast pose expires on person visit ten')
      assert.equal(p.casting, visit < 6)
      if (visit < 6) equal([shot?.phase, shot?.remaining], ['windup', 6 - visit])
      if (visit === 6) assert.equal(shot?.phase, 'flying', 'Projectile launches at visit six')
      for (const id of state.waves) if (!before.waves.includes(id)) waves.add(id)
    }
    assert.equal(waves.size, 1, 'One effect dispatch across the entire natural cast window')
    assert.ok(frames.length > 1)
    let previousStamp = -1
    for (const frame of frames) {
      grounded(frame)
      assert.ok(integer(frame.stamp) && frame.stamp > previousStamp)
      previousStamp = frame.stamp
      if (frame.person.state !== 22) continue
      const elapsed = frame.turn - after.turn, p = frame.person
      assert.ok(integer(elapsed) && elapsed < 10)
      equal([p.object, p.draw, frame.renderedDraw, p.f1, p.f2, p.timer],
        [520, 14, 14, 0, (entry.f2 + elapsed) % 12, 10 - elapsed],
        'Rendered phase advances only on logical visits, not render or presentation callbacks')
      assert.ok(integer(frame.direction) && frame.direction < 8)
      const direction = reference.directions.find(c => c.direction === frame.direction)
      equal([reference.renderSources[frame.frame], frame.flip],
        [direction.frames[p.f2 % direction.frames.length], direction.flip], 'Original VFRA frame/flip')
      assert.equal(frame.visible, true); assert.ok(frame.submittedLayers > 0)
    }
    equal(crops.length, 2)
    const cropped = frames.filter(frame => frame.cropPlanned)
    equal(cropped.length, 2)
    for (const [i, frame] of cropped.entries()) {
      const crop = crops[i]
      equal([frame.paused, frame.suspended, frame.bodyCanvasOwned, frame.bodyInCanvas, frame.cropOverlayClear],
        [false, false, true, true, true])
      equal([crop.file, crop.turn, crop.stamp, crop.f2, crop.frame],
        [frame.cropFile, frame.turn, frame.stamp, frame.person.f2, frame.frame])
      assert.ok(crop.opaqueColors > 1)
      assert.equal(crop.error, undefined)
      assert.match(crop.file, new RegExp(`^shaman-casting-${record.label}-[01]\\.png$`))
    }
    assert.equal(cropped[0].direction, cropped[1].direction)
    assert.ok(cropped[1].turn > cropped[0].turn)
    assert.notEqual(cropped[0].person.f2, cropped[1].person.f2)
    assert.notEqual(cropped[0].frame, cropped[1].frame)
    accepted.push({ label: record.label, entryTurn: after.turn, shot: record.shot,
      nativeSource: 520, projectileVisits: 6, personVisits: 10, cooldownVisits: 12,
      crops: crops.map(crop => crop.file) })
  }
  assert.equal(result.casts[1].before.person.id, result.casts[0].after.person.id)
  assert.ok(result.casts[1].before.turn >= result.casts[0].terminal.turn)
  assert.equal(result.casts[1].before.casts, result.casts[0].after.casts)
  return { casts: accepted, limits: [
    'Original static tables plus actual browser rendering, not original executable execution or pixel-perfect composition.',
    'Logical callbacks observe before logical animation; completed-render samples observe after it. Neither is a driven clock.',
    'Second cast uses public F9-refilled stock; only the first proves pre-grant ordinary stock. Both use normal payment/cooldown.',
    'Two blue grounded casts in one Mission 1 Scene; other tribes, directions, movement/combat entry and interruptions have separate CPU coverage.',
    'Canvas copies and observer callbacks perturb timing; no performance or hardware-smoothness claim.',
  ] }
}
