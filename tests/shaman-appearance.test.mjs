import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { inflateSync } from 'node:zlib'
import fixture from './fixtures/unit-sprites.json' with { type: 'json' }
import units from '../app/original-units.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { shamanAppearance, shamanNativeDirections, shamanReincarnationPose } from '../app/shaman-appearance.ts'
import { TRIBE_TEAMS, animationTeam } from '../app/world-types.ts'

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')

test('Shaman import preserves every prior frame, piece and animation entry', () => {
  assert.equal(hash(units.frames.slice(0, 4250)), 'fc7e3f7c87e8d066d05935efb5c9aa587c9390c5aa47229b40df23f0e384bccf')
  assert.equal(hash(units.pieces.slice(0, 3276)), '8a02f51aa443b0c583be35ec691ab1f811048055098d54e46e9adf7d41dffddd')
  assert.equal(hash(Object.fromEntries(Object.entries(units.animations).slice(0, 13))), 'a80bf4033d5ae38e84207bc6bfcb2615a5897861eaf2c931533940ce49f93575')
  assert.equal(units.frames.length, 4770)
  assert.equal(units.pieces.length, 3785)
  assert.equal(units.frameCounts.length, 792)
  assert.deepEqual([units.width, units.height, units.cell, units.columns], [2048, 7616, 64, 32])
})

test('actual tribe selects every native Shaman source and eight original directions', () => {
  const bases = new Set(Object.values(units.animations['blue-shaman']).map(d => d[0].source))
  rules.personAnimationObjects.forEach((object, i) => {
    if (i % 9 === 7 && object >= 0) bases.add(rules.animationObjects[object][0])
  })
  for (const [tribe, team] of TRIBE_TEAMS.entries()) {
    const identity = shamanAppearance(team)
    assert.equal(identity.signature, `${team}-shaman`)
    assert.equal(identity.sourceOffset, tribe * 8)
    assert.equal(shamanAppearance(team), identity, 'no per-frame identity allocation')
    for (const base of bases) {
      const directions = shamanNativeDirections(team, base)
      assert.equal(directions.length, 8)
      for (const [direction, cycle] of directions.entries()) {
        assert.equal(cycle.source, base + tribe * 8 + direction)
        assert.equal(cycle.frames.length, units.frameCounts[cycle.source])
        assert.ok(cycle.frames.every(frame => units.frames[frame]))
      }
    }
    for (const [state, blue] of Object.entries(units.animations['blue-shaman'])) {
      const current = units.animations[identity.signature][state]
      const native = shamanNativeDirections(team, blue[0].source)
      for (let direction = 0; direction < 8; direction++) {
        assert.equal(current[direction].flip, native[direction].flip)
        assert.deepEqual(current[direction].frames.map(i => units.frames[i].source), native[direction].frames.map(i => units.frames[i].source))
      }
    }
  }
  assert.throws(() => shamanAppearance('wild'), RangeError)
  assert.equal(animationTeam('yellow'), 'red', 'generic follower/Spy logic remains unchanged')
  assert.equal(animationTeam('green'), 'red')
})

test('Shaman idle artwork uses all four distinct original body pieces', () => {
  const expected = [6879, 6899, 6919, 6939]
  const dimensions = [[20, 32], [27, 30], [23, 35], [20, 34]]
  TRIBE_TEAMS.forEach((team, tribe) => {
    const frame = units.frames[shamanNativeDirections(team, 424)[0].frames[0]]
    const body = frame.layers.find(layer => layer.flags === 0)
    const piece = units.pieces[body.piece]
    assert.equal(piece.source, expected[tribe])
    assert.deepEqual([piece.w, piece.h], dimensions[tribe])
  })
})

test('reincarnation distinguishes tribe bodies from shared spirit sources and layer owners', () => {
  for (const [tribe, team] of TRIBE_TEAMS.entries()) {
    for (let phase = 0; phase < 6; phase++) {
      const pose = shamanReincarnationPose(team, phase)
      assert.equal(pose.source, phase === 0 ? 680 + tribe * 8 : phase === 1 ? 352 : 360)
      assert.equal(pose.layerOwner, phase === 0 ? -1 : tribe)
      assert.equal(pose.directions, units.shamanSources[pose.source])
      assert.equal(shamanReincarnationPose(team, phase), pose)
      if (phase === 0) assert.notEqual(units.frames[pose.directions[0].frames[0]].source, units.frames[680].source)
    }
  }
})

test('shipped live and effect renderers consume the Shaman selector without changing generic mechanics', () => {
  const entities = readFileSync(new URL('../app/scene-entities.ts', import.meta.url), 'utf8')
  const effects = readFileSync(new URL('../app/scene-effects.ts', import.meta.url), 'utf8')
  assert.ok(entities.includes('shamanAppearance(u.team).signature'))
  assert.ok(entities.includes('shamanNativeDirections(u.team, source)'))
  assert.ok(effects.includes('shamanAppearance(f.unit.team).signature'))
  assert.ok(effects.includes('shamanReincarnationPose(f.reincarnation.team, f.reincarnation.phase)'))
  assert.ok(entities.includes('g.userData.layerOwner ?? (shaman ? -1 : g.userData.owner)'))
})

// The stdlib importer emits noninterlaced RGBA8 PNG with filter zero. Decode
// its actual occupied rectangles independently from the importer/palette logic.
test('all 3276 previous occupied sprite rectangles retain their reviewed RGBA', () => {
  const png = readFileSync(new URL('../public/original/unit-layers.png', import.meta.url))
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  const blocks = []
  let width, height
  for (let at = 8; at < png.length;) {
    const length = png.readUInt32BE(at), kind = png.toString('ascii', at + 4, at + 8)
    const data = png.subarray(at + 8, at + 8 + length)
    if (kind === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4)
      assert.deepEqual([...data.subarray(8)], [8, 6, 0, 0, 0])
    }
    if (kind === 'IDAT') blocks.push(data)
    at += length + 12
  }
  assert.equal(width, units.width); assert.equal(height, units.height)
  const pixels = inflateSync(Buffer.concat(blocks)), stride = width * 4 + 1
  assert.equal(pixels.length, stride * height)
  for (let row = 0; row < height; row++) assert.equal(pixels[row * stride], 0)
  const hashes = units.pieces.slice(0, 3276).map((piece, index) => {
    const sha = createHash('sha256'), x = index % units.columns * units.cell, y = Math.floor(index / units.columns) * units.cell
    for (let row = 0; row < piece.h; row++) {
      const at = (y + row) * stride + 1 + x * 4
      sha.update(pixels.subarray(at, at + piece.w * 4))
    }
    return sha.digest('hex')
  })
  assert.deepEqual(hashes.slice(0, 3216), fixture.pieceHashes)
  assert.equal(hash(hashes), '209bd0ef6ec3866ab3ec283474d1ef97ff332d76a08e3f92e344b12e2dcba809')
})

test('real Mission 23 Shaman identity and death heading survive checkpoint reconstruction', async () => {
  const { createWorld } = await import('../app/world-initialization.ts')
  const { migrateCheckpoint } = await import('../app/game-store.ts')
  const { tick } = await import('../app/model.ts')
  const world = createWorld(23)
  const shamans = TRIBE_TEAMS.map(team => world.units.find(u => u.team === team && u.kind === 'shaman'))
  assert.ok(shamans.every(Boolean), 'four original campaign Shamans, not test-created entities')
  const identity = shamans.map(u => ({ id: u.id, team: u.team, kind: u.kind, appearance: shamanAppearance(u.team) }))
  const restored = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(identity, TRIBE_TEAMS.map(team => {
    const u = restored.units.find(u => u.team === team && u.kind === 'shaman')
    return { id: u.id, team: u.team, kind: u.kind, appearance: shamanAppearance(u.team) }
  }))
  // Fixture-controlled deaths exercise the normal world-turn effect producer.
  // Mission 23 already has followers and enabled reincarnation for every tribe.
  shamans.forEach((u, tribe) => {
    if (tribe) assert.equal(world.campaignAIs[tribe].reincarnation, true)
    u.heading = tribe * Math.PI / 4
    u.hp = 0
  })
  tick(world, 1 / 12)
  const effects = TRIBE_TEAMS.map(team => world.effects.find(f => f.reincarnation?.team === team))
  assert.ok(effects.every(Boolean))
  effects.forEach((effect, tribe) => {
    assert.deepEqual(effect.unit, { team: TRIBE_TEAMS[tribe], kind: 'shaman', heading: shamans[tribe].heading })
    assert.equal(shamanReincarnationPose(effect.unit.team, effect.reincarnation.phase).source, 680 + tribe * 8)
  })
  const checkpoint = migrateCheckpoint(structuredClone(world))
  assert.deepEqual(checkpoint.effects.filter(f => f.reincarnation), world.effects.filter(f => f.reincarnation))
  assert.deepEqual(checkpoint.respawns, world.respawns)
  assert.equal(checkpoint.randomState, world.randomState)
  assert.equal(checkpoint.nextId, world.nextId)
  const old = structuredClone(world)
  old.effects.filter(f => f.reincarnation).forEach(f => { delete f.unit })
  const compatible = migrateCheckpoint(old)
  compatible.effects.filter(f => f.reincarnation).forEach(effect => {
    assert.ok(shamanReincarnationPose(effect.reincarnation.team, effect.reincarnation.phase))
    assert.equal(effect.unit?.heading ?? 0, 0, 'old checkpoints retain safe heading fallback')
  })
})
