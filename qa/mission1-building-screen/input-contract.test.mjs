// Synthetic event composition only: no browser, World simulation or gameplay pass.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createMission1VaultInput, assertMission1BlastTarget } from '../../scripts/local-render/mission1-vault-input.mjs'
import { installMission1VaultCheckpointState } from '../../scripts/local-render/mission1-vault-checkpoint.mjs'

const source = path => readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
const pointerSource = source('qa/erosion-ordinary/input.mjs')
const pointerModule = await import('data:text/javascript;base64,' + Buffer.from(
  pointerSource.slice(pointerSource.indexOf('export const isOrdinaryMoveContext'))).toString('base64'))
const inputSource = source('app/scene-input-runtime.ts')
const begin = inputSource.indexOf('  const directBlast =', inputSource.indexOf('if (event.button !== 0) return'))
const end = inputSource.indexOf('  if (!p) return', begin)
assert.ok(begin > 0 && end > begin)
const targetingSource = source('app/blast-targeting.ts')
const targeting = targetingSource.slice(targetingSource.indexOf('export const blastPersonTargeting'), targetingSource.indexOf('// Follow'))
const blastPersonTargeting = Function(targeting.replace('export ', '').replace(': string | null', '').replace(': number', '') + '; return blastPersonTargeting')()
const currentHandlerTarget = Function('blastPersonTargeting', 'scene', 'event',
  inputSource.slice(begin, end) + '\nreturn { point: p, personId: directBlast ? picked?.id : undefined }')

function fixture(t, { personId = 38, rejection = null, throwInput = false, failSaves = [],
  nested = false, throwPicker = false, replacePerson = false, replacePicker = false, spell = 'blast', gameFlags = 0 } = {}) {
  const world = { turn: 799, paused: false, mode: spell, selected: [30], shots: { blast: 4, bridge: 4 }, giftCounts: { blast: 0, bridge: 0 },
    manaWorld: { gameFlags }, units: [{ id: 30, kind: 'shaman', team: 'blue', hp: 100 },
      { id: 38, kind: 'brave', team: 'red', hp: 50, x: -9, z: -3 }], buildings: [], shrines: [], trees: [], projectiles: [], effects: [] }
  const listeners = [], calls = [], point = { x: -8.95, z: -3.05 }, canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 1000 }),
    addEventListener(type, fn, capture = false) { listeners.push({ type, fn, capture }) },
    removeEventListener(type, fn, capture = false) {
      const i = listeners.findIndex(l => l.type === type && l.fn === fn && l.capture === capture)
      assert.ok(i >= 0); listeners.splice(i, 1)
    },
  }
  const inputFailure = Error('synthetic input failed'), pickerFailure = Error('synthetic original picker failed')
  let dispatching = false
  const scene = { world, renderer: { domElement: canvas }, overviewActive: false, down: {},
    pointerAck: { target: 0, until: 0 },
    picking: {
      pick(event) { assert.equal(this, scene.picking); calls.push('nested'); return personId },
      pickPerson(event) {
        assert.equal(this, scene.picking); calls.push('person')
        if (nested) this.pick(event)
        if (dispatching && throwPicker) throw pickerFailure
        return personId
      },
    },
    pickUnit: () => null, pickWorldObject: () => null,
    pick(event) { assert.equal(this, scene); calls.push('ground'); if (nested) scene.picking.pick(event); return point },
  }
  const originals = { person: scene.picking.pickPerson, nested: scene.picking.pick, ground: scene.pick }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  globalThis.document = { elementFromPoint: () => canvas }
  t.after(() => { delete globalThis.window; delete globalThis.document })
  const modules = {
    '/qa/erosion-ordinary/input.mjs': pointerModule,
    '/app/live-command.ts': { spellTargetError(clone) { assert.notEqual(clone, world); return rejection } },
  }
  const page = {
    async evaluate(fn, args) {
      return Function('imports', `return (${fn.toString().replaceAll('import(', 'imports(')})`)(async path => {
        assert.ok(modules[path], path); return modules[path]
      })(args)
    },
    mouse: { async click(x, y) {
      if (throwInput) throw inputFailure
      dispatching = true
      for (const type of ['pointerdown', 'pointerup']) {
        const event = { type, clientX: x, clientY: y, button: 0, buttons: Number(type === 'pointerdown'),
          isTrusted: true, target: canvas, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }
        for (const l of [...listeners].filter(l => l.type === type && l.capture)) l.fn(event)
        if (type === 'pointerup') {
          const target = currentHandlerTarget(blastPersonTargeting, scene, event)
          const aim = target.personId === undefined
            ? { x: Math.floor(target.point.x / 2) * 2 + 1, z: -Math.floor(-target.point.z / 2) * 2 - 1 }
            : { x: target.point.x, z: target.point.z }
          const destination = { x: Math.round((aim.x + 8) * 256), y: Math.round((-aim.z - 8) * 256), h: 3 }
          world.projectiles.push({ id: 900, caster: 30, spell, target: aim, destination,
            phase: 'windup', remaining: 6, turns: 0, visuals: [],
            blastTarget: target.personId === undefined ? undefined :
              { personId: target.personId, shotPersonId: null, destination: { ...destination } } })
          world.shots[spell]--; world.mode = null
          scene.pointerAck = { target: target.personId ?? 0, until: 1 }
          if (replacePerson) world.units = world.units.map(unit => unit.id === personId ? { ...unit } : unit)
          if (replacePicker) scene.picking.pickPerson = () => null
        }
        for (const l of [...listeners].filter(l => l.type === type && !l.capture)) l.fn(event)
      }
    } },
  }
  const report = { actions: [] }, saveFailure = Error('synthetic report save failed')
  let saves = 0
  const input = createMission1VaultInput({ page, signal: new AbortController().signal, report,
    save() { if (failSaves.includes(++saves)) throw saveFailure }, originalShamanId: 30 })
  const hit = { x: 800, y: 450, point }
  const restored = () => {
    assert.equal(scene.picking.pickPerson, originals.person); assert.equal(scene.picking.pick, originals.nested); assert.equal(scene.pick, originals.ground)
    assert.equal(listeners.length, 0); assert.equal(window.mission1VaultCastInput, undefined)
  }
  return { world, scene, report, input, hit, calls, restored, saveFailure, inputFailure, pickerFailure }
}

test('the maintained pointer observer retains current direct-person dispatch without a person-pixel search', async t => {
  const f = fixture(t), result = await f.input.castInput(f.hit, 'blast')
  const up = result.pointer.events.find(event => event.type === 'pointerup')
  assert.deepEqual(up.picks.map(pick => [pick.owner, pick.name, pick.id]), [['picking', 'pickPerson', 38]])
  assert.equal(result.after.projectiles[0].blastTarget.personId, 38)
  assert.equal(result.after.pointerAck.target, 38)
  assert.notDeepEqual(result.after.projectiles[0].target, f.hit.point, 'terrain preflight does not define a direct person target')
  assert.equal(result.after.stock, result.before.stock - 1)
  assert.deepEqual(result.target, { kind: 'person', personId: 38, projectileId: 900 })
  f.restored()
})

test('ground fallback is evidenced by the actual null person pick followed by the terrain pick', async t => {
  const f = fixture(t, { personId: null }), result = await f.input.castInput(f.hit, 'blast')
  const up = result.pointer.events.find(event => event.type === 'pointerup')
  assert.deepEqual(up.picks.map(pick => [pick.owner, pick.name, pick.id]),
    [['picking', 'pickPerson', null], ['scene', 'pick', null]])
  assert.deepEqual(up.picks[1].point, f.hit.point)
  assert.equal(result.after.projectiles[0].blastTarget, undefined)
  assert.equal(result.after.pointerAck.target, 0)
  assert.deepEqual(result.target, { kind: 'ground', personId: null, projectileId: 900, point: f.hit.point })
  f.restored()
})

test('rejected preflight and failed input restore without payment or stray picker ownership', async t => {
  for (const options of [{ rejection: 'beyond reach' }, { throwInput: true }]) {
    const f = fixture(t, options)
    await assert.rejects(f.input.castInput(f.hit, 'blast'))
    assert.equal(f.world.shots.blast, 4); assert.deepEqual(f.world.projectiles, [])
    f.restored()
  }
})

test('the first post-arm report save failure restores the real composed picker owner', async t => {
  const f = fixture(t, { failSaves: [1] })
  await assert.rejects(f.input.castInput(f.hit, 'blast'), error => error === f.saveFailure)
  assert.equal(f.world.shots.blast, 4); assert.deepEqual(f.world.projectiles, [])
  f.restored()
})

test('nested real picker wrappers preserve the source-consumed person and ground chains', async t => {
  for (const personId of [38, null]) {
    const f = fixture(t, { personId, nested: true }), result = await f.input.castInput(f.hit, 'blast')
    const release = result.pointer.events.find(event => event.type === 'pointerup')
    assert.equal(release.picks[0].owner, 'picking'); assert.equal(release.picks[0].name, 'pick')
    assert.ok(release.picks.every(pick => pick.receiverMatches))
    assert.ok(release.picks.every(pick => JSON.stringify(pick.args) === JSON.stringify(release.args)))
    assert.equal(result.target.kind, personId === null ? 'ground' : 'person')
    f.restored()
  }
})

test('a thrown original picker stays primary when final evidence saving also fails', async t => {
  const f = fixture(t, { nested: true, throwPicker: true, failSaves: [3] })
  await assert.rejects(f.input.castInput(f.hit, 'blast'), error => error === f.pickerFailure)
  const delivery = f.report.actions.find(action => action.label === 'actual-cast-stock').delivered
  const release = delivery.pointer.events.find(event => event.type === 'pointerup')
  assert.match(release.picks.find(pick => pick.name === 'pickPerson').error, /original picker failed/)
  assert.equal(release.picks.find(pick => pick.name === 'pickPerson').threw, true)
  const failures = f.report.actions.find(action => action.label === 'actual-cast-cleanup-errors')
  assert.match(failures.primary, /original picker failed/); assert.match(failures.errors[0], /report save failed/)
  assert.equal(f.world.shots.blast, 4); f.restored()
})

test('unexpected picker replacement is retained as failed restoration evidence', async t => {
  const f = fixture(t, { replacePicker: true })
  await assert.rejects(f.input.castInput(f.hit, 'blast'))
  const delivered = f.report.actions.find(action => action.label === 'actual-cast-stock').delivered
  assert.equal(delivered.pointer.restored, false)
  assert.ok(delivered.pointer.errors.includes('Unexpected replacement of pickPerson'))
  assert.equal(window.mission1VaultCastInput, undefined)
})

test('the Blast validator rejects mismatched chain, identity, spawn, ack and gate evidence', async t => {
  const f = fixture(t), result = await f.input.castInput(f.hit, 'blast')
  const changes = [
    value => { value.before.overviewActive = true },
    value => { value.before.gameFlags = 32 },
    value => { value.pointer.events[1].trusted = false },
    value => { value.pointer.events[1].picks[0].receiverMatches = false },
    value => { value.pointer.events[1].picks[0].args.clientX++ },
    value => { value.resolvedPerson.sameObject = false },
    value => { value.after.projectiles[0].caster = 44 },
    value => { value.after.projectiles[0].spell = 'bridge' },
    value => { value.after.projectiles[0].phase = 'flying' },
    value => { value.after.projectiles[0].remaining = 5 },
    value => { value.after.projectiles[0].turns = 1 },
    value => { value.after.projectiles[0].visuals = [1] },
    value => { value.after.projectiles[0].blastTarget.personId = 39 },
    value => { value.after.projectiles[0].blastTarget.shotPersonId = 38 },
    value => { value.after.projectiles[0].blastTarget.destination.x++ },
    value => { value.after.projectiles[0].target.x++ },
    value => { value.after.pointerAck.target = 0 },
    value => { value.after.pointerAck.until = value.before.pointerAck.until },
    value => { value.before.projectiles = structuredClone(value.after.projectiles) },
    value => { value.after.projectiles.push({ ...value.after.projectiles[0], id: 901 }) },
  ]
  for (const change of changes) {
    const invalid = structuredClone(result); change(invalid)
    assert.throws(() => assertMission1BlastTarget(invalid, 30), assert.AssertionError)
  }
  f.restored()
  const ground = fixture(t, { personId: null }), fallback = await ground.input.castInput(ground.hit, 'blast')
  for (const change of [
    value => { value.pointer.events[1].picks[0].id = 99 },
    value => { value.pointer.events[1].picks.pop() },
    value => { value.after.projectiles[0].target = { ...ground.hit.point } },
    value => { value.after.projectiles[0].blastTarget = { personId: 99 } },
    value => { value.after.pointerAck.target = 99 },
  ]) {
    const invalid = structuredClone(fallback); change(invalid)
    assert.throws(() => assertMission1BlastTarget(invalid, 30), assert.AssertionError)
  }
  ground.restored()
})

test('replacement identity fails the real composition while non-Blast input remains unchanged', async t => {
  const changed = fixture(t, { replacePerson: true })
  await assert.rejects(changed.input.castInput(changed.hit, 'blast'), /unsupported QA prerequisite/)
  changed.restored()
  const bridge = fixture(t, { spell: 'bridge' }), result = await bridge.input.castInput(bridge.hit, 'bridge')
  assert.equal(result.target, undefined); assert.equal(result.after.stock, 3)
  assert.equal(result.after.projectiles[0].spell, 'bridge'); bridge.restored()
})

test('a competing dispatch observer blocks arming a cast observer', async t => {
  const f = fixture(t)
  window.mission1VaultDispatch = { owner: 'existing' }
  await assert.rejects(f.input.castInput(f.hit, 'blast'), /input observer is already armed/)
  assert.equal(window.mission1VaultDispatch.owner, 'existing')
  assert.equal(f.world.shots.blast, 4); f.restored()
})

test('the recovered checkpoint observer rejects M3 and does not mutate its M1 source', t => {
  t.after(() => delete globalThis.window)
  globalThis.window = {}
  installMission1VaultCheckpointState()
  const w = { outcome: { level: 1 }, turn: 4, time: 1 / 3, unlockedCamp: false,
    shrines: [{ kind: 'vault', mode: 4, reward: 'camp', x: -5, z: -3, active: true,
      knowledgeGlow: { f1: 12, displayedFrame: 2 } }], gifts: [], stats: { bridges: 1 },
    landVersion: 1, land: { heights: [1, 2] }, units: [{ id: 30, kind: 'shaman', team: 'blue', hp: 100 }] }
  const before = structuredClone(w), saved = window.mission1VaultCheckpointState(w)
  assert.deepEqual(w, before); assert.deepEqual(saved.glow, w.shrines[0].knowledgeGlow)
  assert.notEqual(saved.glow, w.shrines[0].knowledgeGlow)
  assert.throws(() => window.mission1VaultCheckpointState({ ...w, outcome: { level: 3 } }), /authored Mission 1/)
})

test('current source correspondence binds helper imports and preserves launch-disabled M1 scope', () => {
  const correspondence = JSON.parse(source('qa/mission1-building-screen/source-correspondence.json'))
  const hash = value => createHash('sha256').update(value).digest('hex')
  for (const row of correspondence.recoveredModules)
    assert.equal(hash(source(row.path)), row.candidateSha256, row.path)
  for (const row of correspondence.retainedCurrentSources)
    assert.equal(hash(source(row.path)), row.sha256, row.path)
  const helper = source('scripts/local-render/mission1-vault-input.mjs')
  for (const [, path] of helper.matchAll(/import\('(\/(?:app|qa)\/[^']+)'\)/g))
    assert.ok(correspondence.retainedCurrentSources.some(row => row.path === path.slice(1)), path)
  for (const name of ['createMission1VaultInput', 'clickEntity', 'fixedGround', 'moveGround', 'castInput'])
    assert.ok(helper.includes(name), name)
  const page = source('app/page.tsx'), rules = source('app/world-rules.ts')
  for (const label of ['Select and focus shaman', 'Pause game', 'Resume game', 'Game settings', 'Save checkpoint', 'Load checkpoint', 'Restart world'])
    assert.ok(page.includes(label), label)
  assert.ok(page.includes("t === 'buildings' ? 'B'"))
  assert.ok(page.includes('aria-label={`${b.name}, ${b.cost} wood`}'))
  assert.match(rules, /id: 'camp',\s+name: 'Warrior Training Hut',\s+cost: 8/)
  assert.equal(correspondence.launch.enabled, false)
  assert.deepEqual(correspondence.launch.newHarnessArguments, [])
  for (const key of ['scenario', 'profile', 'browser', 'port']) assert.equal(correspondence.launch[key], null)
})
