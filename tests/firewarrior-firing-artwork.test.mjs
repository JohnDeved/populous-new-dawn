import assert from 'node:assert/strict'
import test from 'node:test'
import units from '../app/original-units.json' with { type: 'json' }
import rules from '../app/original-rules.json' with { type: 'json' }
import { spriteAtlasOrigin } from '../app/sprite-layers.ts'

const firstFrames = [90, 95, 100, 105, 110, 105, 100, 95]
test('Firewarrior row15 has its own eight-direction five-frame firing family', () => {
  assert.equal(rules.personAnimationObjects[15 * 9 + 6], 94)
  assert.deepEqual(rules.animationObjects[94], [56, 13])
  for (const team of ['blue', 'red']) {
    const animations = units.animations[`${team}-firewarrior`]
    assert.ok(animations.firing, `${team} firing source56 must resolve without fallback`)
    assert.equal(animations.firing.length, 8)
    assert.equal(animations.attack[0].source, 120, 'existing melee attack remains intact')
    assert.equal(animations.restingGesture[0].source, 720)
    assert.equal(animations.idleGesture[0].source, 728)
    for (const [direction, cycle] of animations.firing.entries()) {
      assert.equal(cycle.source, 56 + direction)
      assert.equal(cycle.flip, direction >= 5)
      assert.equal(units.frameCounts[cycle.source], 5)
      assert.deepEqual(cycle.frames.map(index => units.frames[index].source),
        Array.from({ length: 5 }, (_, frame) => firstFrames[direction] + frame))
    }
  }
  assert.deepEqual(units.animations['blue-firewarrior'].firing,
    units.animations['red-firewarrior'].firing, 'the descriptor and tribe select overlays')
})


test('firing pieces use disjoint 32px subslots while every old atlas origin stays fixed', () => {
  assert.deepEqual([units.width, units.height, units.columns, units.cell], [2048, 8128, 32, 64])
  for (const [index, piece] of units.pieces.slice(0, 4042).entries()) {
    assert.equal(piece.atlasX, undefined)
    assert.equal(piece.atlasY, undefined)
    assert.deepEqual(spriteAtlasOrigin(piece, index, units),
      { x: index % 32 * 64, y: Math.floor(index / 32) * 64 })
  }
  const appended = units.pieces.slice(4042), occupied = new Set()
  assert.equal(appended.length, 80)
  for (const [offset, piece] of appended.entries()) {
    const { x, y } = spriteAtlasOrigin(piece, 4042 + offset, units)
    assert.ok(Number.isInteger(piece.atlasX) && Number.isInteger(piece.atlasY))
    assert.ok(piece.w <= 32 && piece.h <= 32)
    assert.ok(x >= 0 && x + 32 <= units.width && y >= 0 && y + 32 <= units.height)
    assert.ok(Math.floor(y / 64) * 32 + Math.floor(x / 64) >= 4042,
      'no prior piece cell or its padding is touched')
    for (let row = y; row < y + 32; row++) {
      for (let column = x; column < x + 32; column++) {
        const pixel = row * units.width + column
        assert.equal(occupied.has(pixel), false, 'new reserved subslots cannot overlap')
        occupied.add(pixel)
      }
    }
  }
})
