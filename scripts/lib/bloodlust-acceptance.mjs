// Test-only oracle/observation helpers. Never imported by production.
import assert from 'node:assert/strict'
import artwork from '../../app/original-bloodlust.json' with { type: 'json' }
import { spriteCoordinate } from '../../app/projection.ts'

export const prerequisiteHead = '3254efac4f1758234eacc5e6f512917b0c682c98'
export const originalFrames = artwork.frames.map(frame => frame.source)

// 004691ec..00469303, proved before PR130: test expectation, not runtime code.
export function expectedOverlay(input) {
  if (input.remaining <= 0 || (input.remaining < 128 && input.counter & 2)) return null
  const frame = artwork.frames[(input.animationFrame >>> 0) % 10]
  const size = value =>
    input.scaled ? spriteCoordinate(value, input.bucket, 0x100, input.view) : value
  const width = size(frame.w),
    height = size(frame.h)
  return {
    source: frame.source,
    x: 0 - Math.trunc(width / 2),
    y: 0 - Math.trunc((input.frameHeight * 40) / 36),
    width,
    height,
    uv: [
      frame.w / artwork.width,
      frame.h / artwork.height,
      frame.x / artwork.width,
      1 - (frame.y + frame.h) / artwork.height,
    ],
  }
}

// Self-contained so the same observation runs in Node's scene fixture or page.evaluate.
// It reads the existing Bloodlust child; it never draws or patches a live owner.
export function observeBloodlust(scene, unitId) {
  if (typeof scene === 'number') {
    unitId = scene
    scene = globalThis.testScene
  }
  const unit = scene.world.units.find(value => value.id === unitId)
  const group = scene.unitMeshes.get(unitId)
  const sprite = group?.getObjectByName('bloodlust-aura')
  const map = sprite?.material?.map
  const image = map?.image
  const person = unit?.native
  return {
    unitId,
    remaining: unit?.bloodlust ?? 0,
    counter: person?.counter ?? scene.world.turn,
    flags3: person?.flags3 ?? 0,
    animationFrame: scene.gameClock.animationFrame,
    frameHeight: group?.userData.frameHeight,
    bucket: group?.userData.spriteBucket,
    scaled: !!scene.view.config.scaledSprites,
    view: {
      scale: scene.view.config.scale,
      spriteScale: scene.view.config.spriteScale,
      shamanScale: scene.view.config.shamanScale,
    },
    groupVisible: group?.visible ?? false,
    exists: !!sprite,
    visible: sprite?.visible ?? false,
    isSprite: !!sprite?.isSprite,
    geometry: sprite?.geometry?.type ?? null,
    texture: image?.currentSrc || image?.src || '',
    scale: sprite ? [sprite.scale.x, sprite.scale.y] : null,
    center: sprite?.center ? [sprite.center.x, sprite.center.y] : null,
    uv: sprite?.userData.atlasTransform?.toArray() ?? null,
    opacity: sprite?.material?.opacity ?? null,
    transparent: sprite?.material?.transparent ?? false,
  }
}

export function assertOriginalOverlay(observed) {
  const expected = expectedOverlay(observed)
  if (!expected) {
    assert.equal(observed.visible, false, 'inactive or blinking Bloodlust must not draw')
    return null
  }
  assert.equal(observed.groupVisible, true, 'normal follower body must remain visible')
  assert.equal(
    observed.isSprite,
    true,
    'Bloodlust must use original HFX artwork, not TorusGeometry'
  )
  assert.match(
    observed.texture,
    /\/original\/bloodlust\.png(?:[?#].*)?$/,
    'isolated original atlas must be consumed'
  )
  assert.deepEqual(
    observed.uv,
    expected.uv,
    `HFX${expected.source} must match the presentation frame`
  )
  assert.deepEqual(observed.scale, [expected.width, expected.height], 'original scaled dimensions')
  if (expected.width > 0 && expected.height > 0) {
    assert.equal(observed.visible, true)
    assert.deepEqual(
      observed.center,
      [-expected.x / expected.width, 1 + expected.y / expected.height],
      'overlay anchors above already-scaled VFRA header height'
    )
  } else assert.equal(observed.visible, false)
  assert.equal(
    observed.opacity,
    1,
    'per-pixel original alpha must not receive a second arbitrary fade'
  )
  assert.equal(observed.transparent, true)
  return expected.source
}

// Explicit critical-state subset for human-readable receipts. Full-world equality
// is asserted separately around render-only calls and paired simulation histories.
export function criticalState(world = globalThis.testScene?.world) {
  return structuredClone({
    turn: world.turn,
    time: world.time,
    mana: world.mana,
    manaTribes: world.manaTribes,
    manaWorld: world.manaWorld,
    shots: world.shots,
    gifts: world.giftCounts,
    randomState: world.randomState,
    cosmeticRandom: world.cosmeticRandom,
    respawns: world.respawns,
    outcome: world.outcome,
    bloodlust: world.units.filter(unit => unit.bloodlust).map(unit => [unit.id, unit.bloodlust]),
    shrineUses: world.shrines.map(shrine => [shrine.id, shrine.uses]),
  })
}
