import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

const api = await loadSceneFixture()
const { createStartedWorld, retainFixtureUnits } = await import('./level-start-fixture.mjs')
const { createLivePerson, registerLivePerson } = await import('../app/live-people.ts')
const { requestSpyDiscovery, processSpyDiscovery } = await import('../app/live-spy-discovery.ts')
const { pointerDown, pointerUp, pickUnit } = await import('../app/scene-input-runtime.ts')
const { spyDisguisedFrom } = await import('../app/computer-selection.ts')
const { combatPerson } = await import('../app/live-combat.ts')
const { createGameStore } = await import('../app/game-store.ts')

const seed = createStartedWorld(1, 'scalable')
retainFixtureUnits(seed, unit => unit.team === 'blue' && unit.kind === 'shaman')

function fixture() {
  const world = structuredClone(seed)
  world.paused = false
  world.inputMask = 0
  world.mode = null
  world.selected = []
  world.manaWorld.gameFlags = 2 // Suppress unrelated AI work, not the input gate.
  // Supplied dry terrain keeps this isolated input fixture out of drowning.
  world.terrain.fill(3)
  world.terrainVersion++
  const unit = api.addUnit(world, 'red', 'spy', { x: 10, z: 30 })
  const person = (unit.native = createLivePerson(world, unit))
  person.disguise = 0
  registerLivePerson(world, person)
  return { world, unit, person }
}

test('manual discovery stages one command and mutates only the existing disguise at consumption', () => {
  const { world, unit, person } = fixture()
  const before = structuredClone(person)
  const random = world.randomState
  assert.equal(requestSpyDiscovery(world, unit.id), true)
  assert.deepEqual(person, before)
  assert.equal(requestSpyDiscovery(world, unit.id), false)
  assert.equal(processSpyDiscovery(world), true)
  assert.deepEqual(person, { ...before, disguise: 64 })
  assert.equal(world.randomState, random)
  assert.equal(world.objectCells.objects.get(unit.id), person)
  assert.equal(processSpyDiscovery(world), false)
  assert.equal(spyDisguisedFrom(person, 0), false)
})

test('completed viewer-colour disguise and land admission agree with the native 576-case matrix', () => {
  const { world, unit, person } = fixture()
  let cases = 0
  for (let player = 0; player < 4; player++)
    for (let real = 0; real < 4; real++) {
      if (player === real) continue
      for (let target = 0; target < 4; target++)
        for (const countdown of [0, 1, 63])
          for (const occupied of [false, true])
            for (const land of [0, 0x800]) {
              world.manaWorld.playerTribe = player
              person.tribe = real
              person.disguise = player << 6
              world.land.landFlags &= ~0x800
              if (occupied) assert.equal(requestSpyDiscovery(world, unit.id), true)
              person.disguise = (target << 6) | countdown
              world.land.landFlags = (world.land.landFlags & ~0x800) | land
              const expected = !occupied && !land && !countdown && target === player
              assert.equal(requestSpyDiscovery(world, unit.id), expected)
              processSpyDiscovery(world)
              cases++
            }
    }
  assert.equal(cases, 576)
})

for (const [name, change] of [
  ['own Spy', ({ person }) => { person.tribe = 0 }],
  ['already exposed Spy', ({ person }) => { person.disguise = 64 }],
  ['other-colour Spy', ({ person }) => { person.disguise = 128 }],
  ['changing disguise', ({ person }) => { person.disguise = 1 }],
  ['ordinary Brave', ({ unit }) => { unit.kind = 'brave' }],
  ['dead person', ({ unit }) => { unit.hp = 0 }],
  ['removed native person', ({ person }) => { person.flags2 |= 1 }],
  ['inside person', ({ unit }) => { unit.inside = 42 }],
  ['vehicle passenger', ({ person }) => { person.vehicle = 42 }],
  ['invisible enemy', ({ unit }) => { unit.invisibility = 100 }],
  ['selection', ({ world, unit }) => { world.selected = [unit.id] }],
  ['armed spell', ({ world }) => { world.mode = 'blast' }],
  ['input mask', ({ world }) => { world.inputMask = 1 }],
  ['native command lock', ({ world }) => { world.land.landFlags |= 0x800 }],
  ['native level gate', ({ world }) => { world.manaWorld.gameFlags |= 0x20 }],
  ['finished level', ({ world }) => { world.status = 'won' }],
]) test(`discovery rejects ${name} without changing the person`, () => {
  const f = fixture()
  change(f)
  const before = structuredClone(f.person)
  assert.equal(requestSpyDiscovery(f.world, f.unit.id), false)
  assert.equal(processSpyDiscovery(f.world), false)
  assert.deepEqual(f.person, before)
})

test('a second target cannot replace the pending discovery', () => {
  const { world, unit, person } = fixture()
  const other = api.addUnit(world, 'red', 'spy', { x: 11, z: 30 })
  const second = (other.native = createLivePerson(world, other))
  second.disguise = 0
  assert.equal(requestSpyDiscovery(world, unit.id), true)
  assert.equal(requestSpyDiscovery(world, other.id), false)
  assert.equal(processSpyDiscovery(world), true)
  assert.equal(person.disguise, 64)
  assert.equal(second.disguise, 0)
})

for (const [name, change] of [
  ['removed unit', f => { f.world.units = f.world.units.filter(unit => unit !== f.unit) }],
  ['reused ID', f => { f.world.units[f.world.units.indexOf(f.unit)] = { ...f.unit } }],
  ['replaced person', f => { f.unit.native = structuredClone(f.person) }],
  ['dead unit', f => { f.unit.hp = 0 }],
  ['removed person', f => { f.person.flags2 |= 1 }],
  ['changed unit kind', f => { f.unit.kind = 'brave' }],
  ['changed person class', f => { f.person.class = 2 }],
  ['changed person model', f => { f.person.model = 1 }],
]) test(`queued discovery drops a ${name} and releases its slot`, () => {
  const f = fixture()
  assert.equal(requestSpyDiscovery(f.world, f.unit.id), true)
  change(f)
  assert.equal(processSpyDiscovery(f.world), false)
  assert.equal(f.person.disguise, 0)
  assert.equal(processSpyDiscovery(f.world), false, 'discarded command cannot reappear')
  const next = api.addUnit(f.world, 'red', 'spy', { x: 11, z: 30 })
  const nextPerson = (next.native = createLivePerson(f.world, next))
  nextPerson.disguise = 0
  registerLivePerson(f.world, nextPerson)
  assert.equal(requestSpyDiscovery(f.world, next.id), true, 'stale command releases the slot')
  assert.equal(nextPerson.disguise, 0, 'follow-up remains delayed until consumption')
  assert.equal(processSpyDiscovery(f.world), true)
  assert.equal(nextPerson.disguise, 64)
  assert.equal(f.person.disguise, 0, 'discarded target stays unchanged')
  assert.equal(processSpyDiscovery(f.world), false, 'follow-up consumes exactly once')
})

test('consumer does not repeat the apparent-tribe gate after an admitted input', () => {
  const { world, unit, person } = fixture()
  assert.equal(requestSpyDiscovery(world, unit.id), true)
  person.disguise = 128
  assert.equal(processSpyDiscovery(world), true)
  assert.equal(person.disguise, 64)
})

test('actual logical tick consumes discovery before tribe/object work and preserves checkpoint disguise', () => {
  const { world, unit, person } = fixture()
  assert.equal(requestSpyDiscovery(world, unit.id), true)
  api.tick(world, 0)
  assert.equal(person.disguise, 0)
  api.tick(world, 1 / 12)
  assert.equal(person.disguise, 64)
  assert.ok(world.units.includes(unit) && unit.hp > 0)
  const restored = api.migrateCheckpoint(structuredClone(world))
  const copy = restored.units.find(candidate => candidate.id === unit.id)
  assert.equal(copy.native.disguise, 64)
  assert.equal(processSpyDiscovery(restored), false)
  api.tick(world, 1 / 12)
  api.tick(restored, 1 / 12)
  assert.deepEqual(copy.native, unit.native)
  assert.equal(restored.randomState, world.randomState)
})

test('paused simulation retains its input, but cloning/replacing a World does not inherit frontend events', () => {
  const { world, unit, person } = fixture()
  world.paused = true
  assert.equal(requestSpyDiscovery(world, unit.id), true)
  api.tick(world, 1 / 12)
  assert.equal(person.disguise, 0)
  const replacement = api.migrateCheckpoint(structuredClone(world))
  replacement.paused = false
  api.tick(replacement, 1 / 12)
  assert.equal(replacement.units.find(candidate => candidate.id === unit.id).native.disguise, 0)
  world.paused = false
  api.tick(world, 1 / 12)
  assert.equal(person.disguise, 64)
})

function pointerFixture(t) {
  const f = fixture()
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'document')
  globalThis.document = { hidden: false, querySelector: () => null }
  t.after(() => previous
    ? Object.defineProperty(globalThis, 'document', previous)
    : delete globalThis.document)
  let hit = f.unit.id
  const calls = []
  const scene = {
    world: f.world,
    renderer: { domElement: { setPointerCapture() {} } },
    picking: { pickPerson: () => hit, pick: () => hit },
    pickWorldObject: () => null,
    pick: () => null,
    dragActive: { value: false },
    globeMotion: { dragging: false },
    objectPanels: { open: id => calls.push(['panel', id]), releaseBuildingInspection() {} },
    onSound: cue => calls.push(['sound', cue]),
    onChange: () => calls.push(['change']),
  }
  scene.pickUnit = event => pickUnit(scene, event)
  const event = {
    currentTarget: scene.renderer.domElement, pointerId: 41,
    button: 2, buttons: 2, clientX: 100, clientY: 100,
    shiftKey: false, ctrlKey: false, altKey: false, metaKey: false,
  }
  return { ...f, scene, event, calls, setHit: value => { hit = value } }
}

test('actual right press stages discovery through the visible-person picker; release keeps normal cancellation', t => {
  const { world, unit, person, scene, event, calls } = pointerFixture(t)
  assert.equal(scene.pickUnit(event), undefined, 'normal orderable-person picker excludes the enemy')
  pointerDown(scene, event)
  assert.equal(person.disguise, 0)
  assert.deepEqual(calls, [], 'discovery itself does not add sound or a panel')
  pointerUp(scene, { ...event, buttons: 0 })
  assert.deepEqual(calls, [['change']])
  api.tick(world, 1 / 12)
  assert.equal(person.disguise, 64)
  assert.equal(unit.native, person)
  assert.ok(world.units.includes(unit) && unit.hp > 0)
  assert.deepEqual(world.selected, [])
})

for (const key of ['shiftKey', 'ctrlKey', 'altKey', 'metaKey'])
  test(`actual right press with ${key} does not stage discovery`, t => {
    const { world, person, scene, event } = pointerFixture(t)
    pointerDown(scene, { ...event, [key]: true })
    api.tick(world, 1 / 12)
    assert.equal(person.disguise, 0)
  })

test('a missing/occluded picker hit and a noncanvas event cannot discover the target', t => {
  const { world, person, scene, event, setHit } = pointerFixture(t)
  setHit(null)
  pointerDown(scene, event)
  assert.equal(processSpyDiscovery(world), false)
  setHit(person.id)
  pointerDown(scene, { ...event, currentTarget: {} })
  assert.equal(processSpyDiscovery(world), false)
  assert.equal(person.disguise, 0)
})

for (const owner of ['flight', 'entry', 'fight'])
  test(`discovery follows the existing ${owner} person without creating a native owner`, () => {
    const { world, unit, person } = fixture()
    unit.native = null
    if (owner === 'flight') unit.flight = person
    if (owner === 'entry') unit.entry = { person }
    if (owner === 'fight') unit.fight = { action: 'encounter', motion: person }
    assert.equal(requestSpyDiscovery(world, unit.id), true)
    assert.equal(processSpyDiscovery(world), true)
    assert.equal(person.disguise, 64)
    assert.equal(unit.native, null)
    assert.equal(combatPerson(unit).disguise, 64)
    assert.equal(world.objectCells.objects.get(unit.id), person)
  })

test('the current Save/Load store preserves consumed disguise and subsequent turns', async () => {
  const { world, unit } = fixture()
  const store = createGameStore()
  Object.assign(store.getWorld(), world)
  const current = store.getWorld()
  assert.equal(requestSpyDiscovery(current, unit.id), true)
  assert.equal(processSpyDiscovery(current), true)
  await store.saveCheckpoint()
  assert.equal(store.loadCheckpoint(), true)
  const restored = store.getWorld()
  assert.notEqual(restored, current)
  assert.equal(restored.units.find(candidate => candidate.id === unit.id).native.disguise, 64)
  assert.equal(processSpyDiscovery(restored), false)
  restored.paused = current.paused = false
  api.tick(current, 1 / 12)
  api.tick(restored, 1 / 12)
  assert.deepEqual(restored.units, current.units)
  assert.equal(restored.randomState, current.randomState)
})

for (const owner of ['flight', 'entry'])
  test(`pending discovery survives a ${owner} handoff of the same person`, () => {
    const { world, unit, person } = fixture()
    assert.equal(requestSpyDiscovery(world, unit.id), true)
    unit.native = null
    if (owner === 'flight') unit.flight = person
    else unit.entry = { person }
    assert.equal(processSpyDiscovery(world), true)
    assert.equal(person.disguise, 64)
    assert.equal(world.objectCells.objects.get(unit.id), person)
  })
