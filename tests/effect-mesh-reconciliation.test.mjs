import { normalizeHistoricalFixture } from './helpers/historical-checkpoint.ts'
// Actual primary effect factories/frame/transforms/resources in a Node Scene.
// Controlled producer populations/transitions; no browser/native allocator claim.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'
import { makeEffectScene } from './support/effect-scene.mjs'

const nativeEffects = JSON.parse(
  readFileSync(new URL('../app/original-effects.json', import.meta.url))
)

async function worldWithEffects(count) {
  const api = await loadSceneFixture(),
    world = api.createWorld(1)
  world.effects = []
  world.projectiles = []
  for (let i = 0; i < count; i++) api.effect(world, 'hit', { x: i % 16, z: 0 })
  return { api, world }
}

function assertFrame(fixture, world) {
  const before = structuredClone(world)
  fixture.render()
  assert.deepEqual(world, before, 'effect rendering preserves the full World and both RNG owners')
}

function assertSprite(sprite, frame) {
  assert.deepEqual(sprite.scale.toArray(), [frame.w, frame.h, 1])
  assert.deepEqual(sprite.userData.atlasTransform.toArray(), [
    frame.w / nativeEffects.width,
    frame.h / nativeEffects.height,
    ((frame.index % 8) * 256) / nativeEffects.width,
    1 - (Math.floor(frame.index / 8) * 256 + frame.h) / nativeEffects.height,
  ])
}

test('effect cleanup preserves ordered owned-resource release, survivors, spawning and shared atlas ownership', async () => {
  const { api, world } = await worldWithEffects(4),
    [a, b, c, d] = world.effects,
    fixture = await makeEffectScene(world)
  let atlas, onAtlasDispose
  try {
    assertFrame(fixture, world)
    const groups = new Map(fixture.scene.fxMeshes),
      events = [],
      disposals = [],
      release = fixture.scene.releaseGroup,
      drop = fixture.scene.fxMeshes.delete.bind(fixture.scene.fxMeshes)
    atlas = groups.get(a.id).userData.sprite.material.map
    let atlasDisposals = 0
    onAtlasDispose = () => atlasDisposals++
    atlas.addEventListener('dispose', onAtlasDispose)
    // Diagnostic private-map ownership on an actual factory Sprite. The other
    // stale group retains the production shared effects atlas.
    const privateMap = atlas.clone()
    groups.get(b.id).userData.sprite.material.map = privateMap
    privateMap.addEventListener('dispose', () => disposals.push(`${b.id}:map`))
    for (const f of [b, d]) {
      const group = groups.get(f.id),
        remove = group.removeFromParent.bind(group)
      group.removeFromParent = () => {
        events.push(['remove', f.id])
        return remove()
      }
      group.userData.sprite.material.addEventListener('dispose', () =>
        disposals.push(`${f.id}:material`)
      )
    }
    fixture.scene.releaseGroup = group => {
      const id = [...groups].find(([, candidate]) => candidate === group)?.[0]
      events.push(['release', id])
      release(group)
    }
    fixture.scene.fxMeshes.delete = id => {
      events.push(['delete', id])
      return drop(id)
    }
    const spawned = api.effect(world, 'hit', { x: 3, z: -2 })
    world.effects = [c, a, spawned]
    assertFrame(fixture, world)
    assert.deepEqual(
      events,
      [b, d].flatMap(f => [
        ['remove', f.id],
        ['release', f.id],
        ['delete', f.id],
      ])
    )
    assert.deepEqual(disposals, [`${b.id}:map`, `${b.id}:material`, `${d.id}:material`])
    assert.equal(atlasDisposals, 0)
    assert.equal(fixture.scene.fxMeshes.get(a.id), groups.get(a.id))
    assert.equal(fixture.scene.fxMeshes.get(c.id), groups.get(c.id))
    assert.deepEqual([...fixture.scene.fxMeshes.keys()], [a.id, c.id, spawned.id])
    for (const f of [b, d]) assert.equal(groups.get(f.id).parent, null)
    assert.equal(fixture.scene.fxMeshes.get(spawned.id).parent, fixture.scene.ground)
    assert.deepEqual(fixture.scene.ground.children, [
      groups.get(a.id),
      groups.get(c.id),
      fixture.scene.fxMeshes.get(spawned.id),
    ])
    events.length = 0
    assertFrame(fixture, world)
    assert.deepEqual(events, [])
    assert.equal(disposals.length, 3)
    assert.equal(atlasDisposals, 0)
  } finally {
    if (onAtlasDispose) atlas.removeEventListener('dispose', onAtlasDispose)
    fixture.close()
  }
})

test('cached effect frame retains pose, HFX UV/visibility/opacity and original factory sequence on in-place changes', async () => {
  const { api, world } = await worldWithEffects(1),
    hit = world.effects[0],
    birth = api.effect(world, 'birth', { x: 2, z: -4 }),
    fixture = await makeEffectScene(world)
  try {
    assertFrame(fixture, world)
    const group = fixture.scene.fxMeshes.get(hit.id),
      sprite = group.userData.sprite,
      birthGroup = fixture.scene.fxMeshes.get(birth.id),
      birthSprite = birthGroup.userData.sprite
    assertSprite(sprite, nativeEffects.animations.hit[0])
    assertSprite(birthSprite, nativeEffects.animations.birth[0])
    hit.x = -3
    hit.z = 5
    hit.height = 2
    hit.age = 2 / 12
    birth.animation.f1 = 8
    group.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
    group.userData.nativeHeading = 512
    assertFrame(fixture, world)
    assert.equal(fixture.scene.fxMeshes.get(hit.id), group)
    assert.equal(fixture.scene.fxMeshes.get(birth.id), birthGroup)
    assert.deepEqual(group.position.toArray(), [-3, 90 / 128, 5])
    assert.deepEqual(group.quaternion.toArray(), [0, 0, 0, 1])
    assert.equal(group.userData.nativeHeading, 0)
    assertSprite(sprite, nativeEffects.animations.hit[2])
    assertSprite(birthSprite, nativeEffects.animations.birth[2])
    assert.equal(sprite.material.opacity, 1)
    assert.equal(birthSprite.material.opacity, 1)
    birth.animation.renderFlags |= 16
    assertFrame(fixture, world)
    assert.equal(birthSprite.visible, false)
    birth.animation.renderFlags &= ~16
    birth.animation.object = 0x650
    assertFrame(fixture, world)
    assert.equal(birthSprite.visible, false)
    birth.animation.object = nativeEffects.animations.birth[0].source
    hit.age = 0.45
    assertFrame(fixture, world)
    assert.equal(birthSprite.visible, true)
    assertSprite(sprite, nativeEffects.animations.hit[5])
    assert.ok(Math.abs(sprite.material.opacity - 0.25) < 1e-12)
    hit.kind = 'death'
    assertFrame(fixture, world)
    assert.equal(fixture.scene.fxMeshes.get(hit.id), group)
    assert.equal(group.userData.sequence, 'hit', 'surviving IDs keep the original factory sequence')
    assert.equal(group.userData.sprite, sprite)
  } finally {
    fixture.close()
  }
})

test('actual frame uses maintained ProjectileMotion snapshots and respects explicit placement without simulation writes', async () => {
  const { world } = await worldWithEffects(2),
    [moving, other] = world.effects,
    fixture = await makeEffectScene(world)
  try {
    moving.x = 0
    moving.z = 0
    moving.height = 2
    // Controlled attached-shot snapshots, not a cast/impact/browser witness.
    world.projectiles = [{ visuals: [moving] }]
    fixture.scene.projectileMotion.beforeTurn(world)
    moving.x = 4
    moving.z = -2
    moving.height = 4
    fixture.scene.projectileMotion.afterTurn(world)
    world.pendingTime = 1 / 24
    assertFrame(fixture, world)
    const group = fixture.scene.fxMeshes.get(moving.id),
      unrelated = fixture.scene.fxMeshes.get(other.id)
    assert.deepEqual(group.position.toArray(), [2, 135 / 128, -1])
    assert.deepEqual(unrelated.position.toArray(), [
      other.x,
      Math.round(fixture.scene.y(other) * 45) / 128,
      other.z,
    ])
    world.paused = true
    assertFrame(fixture, world)
    assert.deepEqual(group.position.toArray(), [2, 135 / 128, -1])
    moving.x = 12
    assertFrame(fixture, world)
    assert.deepEqual(group.position.toArray(), [12, 180 / 128, -2])
    world.projectiles = []
    const replacement = structuredClone(moving)
    world.effects = [replacement, other]
    assertFrame(fixture, world)
    assert.equal(fixture.scene.fxMeshes.get(moving.id), group)
    assert.deepEqual(group.position.toArray(), [12, 180 / 128, -2])
  } finally {
    fixture.close()
  }
})

test('same-array edits, current/legacy checkpoint replacement, empty worlds and separate Scenes rebuild current effect membership', async () => {
  const { api, world } = await worldWithEffects(3),
    [a, b, c] = world.effects,
    fixture = await makeEffectScene(world)
  let other
  try {
    assertFrame(fixture, world)
    const groups = new Map(fixture.scene.fxMeshes),
      array = world.effects
    world.effects.splice(1, 1)
    assert.equal(world.effects, array)
    assertFrame(fixture, world)
    assert.equal(groups.get(b.id).parent, null)
    world.effects.push(b)
    assertFrame(fixture, world)
    assert.notEqual(fixture.scene.fxMeshes.get(b.id), groups.get(b.id))
    const current = api.migrateCheckpoint(structuredClone(world)),
      survivor = fixture.scene.fxMeshes.get(a.id)
    fixture.scene.world = current
    assertFrame(fixture, current)
    assert.equal(fixture.scene.fxMeshes.get(a.id), survivor)
    const legacy = structuredClone(current)
    delete legacy.secondaryEffects
    delete legacy.campaignAIs
    delete legacy.levelStart
    const restored = normalizeHistoricalFixture(legacy)
    fixture.scene.world = restored
    assertFrame(fixture, restored)
    assertFrame(fixture, restored)
    assert.equal(fixture.scene.fxMeshes.get(a.id), survivor)
    other = await makeEffectScene(restored)
    assertFrame(other, restored)
    const independent = other.scene.fxMeshes.get(a.id)
    assert.notEqual(independent, survivor)
    fixture.scene.world = { ...restored, effects: [] }
    assertFrame(fixture, fixture.scene.world)
    assert.equal(fixture.scene.fxMeshes.size, 0)
    assert.equal(fixture.scene.ground.children.length, 0)
    assertFrame(other, restored)
    assert.equal(other.scene.fxMeshes.get(a.id), independent)
    fixture.scene.world = restored
    assertFrame(fixture, restored)
    assert.notEqual(fixture.scene.fxMeshes.get(a.id), survivor)
    restored.effects = [c, a]
    const oldId = c.id
    c.id = restored.nextId++
    assertFrame(fixture, restored)
    assert.equal(fixture.scene.fxMeshes.has(oldId), false)
    assert.ok(fixture.scene.fxMeshes.has(c.id))
    restored.effects.length = 0
    assertFrame(fixture, restored)
    assert.equal(fixture.scene.fxMeshes.size, 0)
  } finally {
    other?.close()
    fixture.close()
  }
})

test('accepted migrated NaN IDs retain repeated strict cleanup while zero, infinity and duplicate IDs retain cached groups', async () => {
  const { api, world } = await worldWithEffects(4)
  world.effects[0].id = NaN
  world.effects[1].id = 0
  world.effects[2].id = Infinity
  world.effects[3].id = -Infinity
  const restored = api.migrateCheckpoint(structuredClone(world))
  assert.ok(Number.isNaN(restored.effects[0].id))
  const fixture = await makeEffectScene(restored)
  try {
    assertFrame(fixture, restored)
    let previous = fixture.scene.fxMeshes.get(NaN)
    const stable = new Map([0, Infinity, -Infinity].map(id => [id, fixture.scene.fxMeshes.get(id)]))
    for (let frame = 0; frame < 3; frame++) {
      let disposals = 0
      previous.userData.sprite.material.addEventListener('dispose', () => disposals++)
      assertFrame(fixture, restored)
      const replacement = fixture.scene.fxMeshes.get(NaN)
      assert.notEqual(replacement, previous)
      assert.equal(previous.parent, null)
      assert.equal(disposals, 1)
      for (const [id, group] of stable) assert.equal(fixture.scene.fxMeshes.get(id), group)
      previous = replacement
    }
    restored.effects = restored.effects.slice(1)
    restored.effects[0].id = -0
    restored.effects.push({ ...restored.effects[0], id: 0, x: 6 })
    assertFrame(fixture, restored)
    assert.equal(fixture.scene.fxMeshes.get(0), stable.get(0))
    assert.equal(
      fixture.scene.fxMeshes.get(0).position.x,
      6,
      'duplicate IDs retain last draw placement'
    )
    assert.equal(fixture.scene.fxMeshes.size, 3)
  } finally {
    fixture.close()
  }
})

test('quiet hit-only full effect caller reads IDs linearly with equally many stale groups', async () => {
  const counts = []
  for (const count of [64, 256, 1024]) {
    const { world } = await worldWithEffects(count),
      fixture = await makeEffectScene(world)
    try {
      assertFrame(fixture, world)
      assert.ok(
        world.effects.every(f => f.kind === 'hit' && !f.unit && !f.fire && !f.reincarnation)
      )
      let reads = 0
      for (const f of world.effects) {
        const id = f.id
        Object.defineProperty(f, 'id', {
          enumerable: true,
          configurable: true,
          get: () => {
            reads++
            return id
          },
        })
      }
      const ids = [...fixture.scene.fxMeshes.keys()],
        frozenCleanup = meshIds => {
          for (const id of meshIds) world.effects.some(f => f.id === id)
        }
      frozenCleanup(ids)
      const oldSurvivors = reads
      reads = 0
      fixture.render()
      const currentSurvivors = reads
      assert.ok(
        currentSurvivors <= count * 3,
        `quiet hit-only full caller read ${currentSurvivors} IDs for ${count} effects`
      )
      const staleIds = Array.from({ length: count }, (_, index) => world.nextId + index + 1)
      reads = 0
      frozenCleanup([...ids, ...staleIds])
      const oldMixed = reads
      for (const id of staleIds) {
        const group = new THREE.Group()
        fixture.scene.fxMeshes.set(id, group)
        fixture.scene.ground.add(group)
      }
      reads = 0
      fixture.render()
      const currentMixed = reads
      assert.ok(
        currentMixed <= count * 3,
        `mixed quiet hit-only full caller read ${currentMixed} IDs for ${count} effects`
      )
      assert.equal(fixture.scene.fxMeshes.size, count)
      counts.push({ effects: count, oldSurvivors, currentSurvivors, oldMixed, currentMixed })
    } finally {
      fixture.close()
    }
  }
  for (let i = 1; i < counts.length; i++) {
    assert.equal(counts[i].currentSurvivors, counts[i - 1].currentSurvivors * 4)
    assert.equal(counts[i].currentMixed, counts[i - 1].currentMixed * 4)
  }
  console.log(
    'Quiet hit-only ID-read diagnostic (frozen old cleanup vs actual full caller):',
    JSON.stringify(counts)
  )
})
