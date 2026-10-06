// SOURCE-ONLY DRAFT, NOT EXECUTED. Supporting admission/scene caller comparison.
// Proposed later command: node capture-live-ignition-draft.mjs NATIVE_RESULT_JSON
// Uses the accepted controlled fullHutScene fixture. Its world/cohort are supplied;
// command8 admission is real. Calling the Lightning ignition consumer directly
// supplies the spell boundary. This is not ordinary worship/cast/browser proof.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fullHutScene } from '../../../tests/support/hut-smoke-scene.mjs'

const native = JSON.parse(readFileSync(process.argv[2], 'utf8'))
assert.equal(native.status, 'passed')
assert.equal(native.case, 'full-root-existing-child-fire-allocation-failure')
assert.equal(native.executableSha256,
  '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
assert.equal(native.afterIgnition.rootHandle, 0)
assert.equal(native.afterIgnition.rootClass, 0)
assert.equal(native.afterIgnition.count, 1)
assert.equal(native.releaseRequests.length, 1)
assert.deepEqual(native.actualSecondaryUnlinks, native.releaseRequests)

const fixture = await fullHutScene()
const { scene, api, hut, render, close } = fixture
const world = scene.world
const { igniteLightningScenery } = await import('../../../app/spell-effects-runtime.ts')
const { nativePosition } = await import('../../../app/world-terrain-runtime.ts')
const entries = kind => world.secondaryEffects.order
  .map(slot => world.secondaryEffects.slots[slot])
  .filter(entry => entry?.kind === kind)
const residents = () => world.units
  .filter(unit => unit.inside === hut.id && unit.hp > 0)
  .map(unit => unit.id)
const sample = label => ({
  label, turn: world.turn, progress: hut.progress, hp: hut.hp,
  state: hut.damageState?.state ?? null, timer: hut.burn?.remaining ?? null,
  residents: residents(), admissionSlots: [...hut.admission.occupants],
  retainedRoot: structuredClone(world.secondaryEffects.roots[hut.id]),
  roots: structuredClone(entries('hutRoot').filter(root => root.building === hut.id)),
  children: structuredClone(entries('hutPuff')),
  renderedRootVisible: !!scene.buildingMeshes.get(hut.id)?.userData.hutOccupancySmoke?.group.visible,
  animationFrame: world.secondaryEffects.animationFrame,
  effectCounter: world.effectCounter,
  cosmetic: world.cosmeticRandom.randomState, gameplay: world.randomState,
})
const samples = []
try {
  // Obtain an emitted child from the actual shared owner; never inject smoke,
  // its phase, RNG, occupancy, child lifetime or building state.
  for (let turn = 0; turn < 512 && !entries('hutPuff').length; turn++) {
    api.advanceGame(world, scene.gameClock, 1 / 12)
    render()
  }
  assert.ok(entries('hutPuff').length, 'Supporting fixture did not emit a child')
  const before = sample('before-ignition')
  samples.push(before)
  assert.equal(before.residents.length, 3)
  assert.equal(before.roots.length, 1)
  assert.equal(before.retainedRoot.state.root.mode, 'full')
  const target = nativePosition(world, hut)
  assert.equal(world.land.buildingIds[((target.y & 65535) >> 9) * 128 +
    ((target.x & 65535) >> 9)] & 1023, hut.id)

  // Real live consumer includes successful fire creation. Native case supplies
  // failed fire allocations, so do not assert cross-case fire/RNG equality.
  igniteLightningScenery(world, target, 0)
  render()
  samples.push(sample('immediate-ignition-return'))
  for (let visit = 1; visit <= 16; visit++) {
    const turn = world.turn
    api.advanceGame(world, scene.gameClock, 1 / 12)
    render()
    assert.equal(world.turn, turn + 1)
    samples.push(sample(`secondary-visit-${visit}`))
  }
  console.log(JSON.stringify({
    nativeCase: native.case,
    nativeReleaseCount: native.releaseRequests.length,
    samples,
    limits: 'Controlled world/cohort; actual command8 admission and direct live Lightning '
      + 'ignition consumer; texture/projection supplied; no ordinary reward/HUD/GPU proof.',
  }, null, 2))

  const immediate = samples[1]
  assert.equal(immediate.state, native.afterIgnition.state)
  assert.equal(immediate.timer, native.afterIgnition.timer)
  assert.deepEqual(immediate.residents, before.residents)
  assert.deepEqual(immediate.admissionSlots, before.admissionSlots)
  assert.equal(immediate.progress, before.progress)
  assert.equal(immediate.hp, before.hp)
  assert.deepEqual(immediate.children, before.children)
  assert.equal(immediate.roots.length, 0, 'Native state entry already deleted the retained root')
  assert.equal(immediate.retainedRoot?.state.root ?? null, null)
  assert.equal(immediate.renderedRootVisible, false)

  const oldChildren = new Map(before.children.map(child => [child.serial, child]))
  for (const [index, result] of samples.slice(2).entries()) {
    const visits = index + 1
    assert.equal(result.roots.length, 0, 'Retired root cannot re-enter the secondary owner')
    assert.equal(result.renderedRootVisible, false)
    for (const child of result.children) {
      const old = oldChildren.get(child.serial)
      assert.ok(old, 'Retired root cannot emit another child')
      assert.equal(child.lifetime, old.lifetime - visits)
      assert.equal(child.frameStart, old.frameStart)
      assert.deepEqual(child.position, old.position)
    }
    for (const old of before.children)
      assert.equal(result.children.some(child => child.serial === old.serial), old.lifetime > visits)
    if (result.timer > 119) {
      assert.deepEqual(result.residents, before.residents)
      assert.deepEqual(result.admissionSlots, before.admissionSlots)
    } else {
      assert.deepEqual(result.residents, [])
      assert.ok(result.admissionSlots.every(id => !id))
    }
  }
} finally {
  for (const group of scene.hutSmokePuffs.values()) scene.releaseGroup(group)
  close()
}
