// Synthetic event composition only: no browser, World simulation or gameplay pass.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createMission1VaultInput } from '../../scripts/local-render/mission1-vault-input.mjs'
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

function fixture(t, { personId = 38, rejection = null, throwInput = false } = {}) {
  const world = { turn: 799, paused: false, mode: 'blast', selected: [30], shots: { blast: 4 }, giftCounts: { blast: 0 },
    manaWorld: { gameFlags: 0 }, units: [{ id: 30, kind: 'shaman', team: 'blue', hp: 100 },
      { id: 38, kind: 'brave', team: 'red', hp: 50, x: -9, z: -3 }], buildings: [], shrines: [], trees: [], projectiles: [], effects: [] }
  const listeners = [], calls = [], point = { x: -8.95, z: -3.05 }, canvas = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 1000 }),
    addEventListener(type, fn, capture = false) { listeners.push({ type, fn, capture }) },
    removeEventListener(type, fn, capture = false) {
      const i = listeners.findIndex(l => l.type === type && l.fn === fn && l.capture === capture)
      assert.ok(i >= 0); listeners.splice(i, 1)
    },
  }
  const scene = { world, renderer: { domElement: canvas }, overviewActive: false, down: {},
    pointerAck: { target: 0, until: 0 },
    picking: { pickPerson() { calls.push('person'); return personId } },
    pickUnit: () => null, pickWorldObject: () => null,
    pick() { calls.push('ground'); return point },
  }
  const originals = { person: scene.picking.pickPerson, ground: scene.pick }
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
      if (throwInput) throw Error('synthetic input failed')
      for (const type of ['pointerdown', 'pointerup']) {
        const event = { type, clientX: x, clientY: y, button: 0, buttons: Number(type === 'pointerdown'),
          isTrusted: true, target: canvas, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false }
        for (const l of [...listeners].filter(l => l.type === type && l.capture)) l.fn(event)
        if (type === 'pointerup') {
          const target = currentHandlerTarget(blastPersonTargeting, scene, event)
          world.projectiles.push({ id: 900, caster: 30, spell: 'blast', target: { ...target.point },
            destination: { x: 1, y: 2, h: 3 }, blastTarget: target.personId === undefined ? undefined :
              { personId: target.personId, shotPersonId: null, destination: { x: 1, y: 2, h: 3 } } })
          world.shots.blast--; world.mode = null
          scene.pointerAck = { target: target.personId ?? 0, until: 1 }
        }
        for (const l of [...listeners].filter(l => l.type === type && !l.capture)) l.fn(event)
      }
    } },
  }
  const report = { actions: [] }
  const input = createMission1VaultInput({ page, signal: new AbortController().signal, report, save() {}, originalShamanId: 30 })
  const hit = { x: 800, y: 450, point }
  const restored = () => {
    assert.equal(scene.picking.pickPerson, originals.person); assert.equal(scene.pick, originals.ground)
    assert.equal(listeners.length, 0); assert.equal(window.mission1VaultCastInput, undefined)
  }
  return { world, scene, report, input, hit, calls, restored }
}

test('the maintained pointer observer retains current direct-person dispatch without a person-pixel search', async t => {
  const f = fixture(t), result = await f.input.castInput(f.hit, 'blast')
  const up = result.pointer.events.find(event => event.type === 'pointerup')
  assert.deepEqual(up.picks.map(pick => [pick.owner, pick.name, pick.id]), [['picking', 'pickPerson', 38]])
  assert.equal(result.after.projectiles[0].blastTarget.personId, 38)
  assert.equal(result.after.pointerAck.target, 38)
  assert.notDeepEqual(result.after.projectiles[0].target, f.hit.point, 'terrain preflight does not define a direct person target')
  assert.equal(result.after.stock, result.before.stock - 1)
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
