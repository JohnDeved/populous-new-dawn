// Supplied DOM/render boundaries and CPU model visits, never browser evidence.
import assert from 'node:assert/strict'
import test from 'node:test'
import { registerHooks } from 'node:module'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createWorld, command, select, tick } from '../../app/model.ts'
import { currentPersonOrder } from '../../app/person-orders.ts'
import { buildingFootprintCells } from '../../app/building-shapes.ts'
import { finishLevelStart } from '../../tests/level-start-fixture.mjs'
import { installTempleRouteObservation, attachTempleVaultApproach } from '../../scripts/local-render/mission3-temple-witness.mjs'
import { createMission1VaultInput } from '../../scripts/local-render/mission1-vault-input.mjs'
import scenario, { assertVaultApproachEvidence, cleanupVaultApproach } from '../../scripts/local-render/mission3-vault-approach.mjs'

function fixture(t) {
  const hooks = registerHooks({ resolve(specifier, context, next) {
    return next(/^\/(app|qa|scripts)\//.test(specifier) ? new URL(`../..${specifier}`, import.meta.url).href : specifier, context)
  } })
  const oldWindow = globalThis.window, oldDocument = globalThis.document
  t.after(() => { hooks.deregister(); globalThis.window = oldWindow; globalThis.document = oldDocument })
  const world = finishLevelStart(createWorld(3))
  world.inputMask = 0 // Supplied CPU stand-in for public Skip, never used by the scenario.
  select(world, 'shaman')
  const shaman = world.units.find(u => u.id === world.selected[0]), vault = world.shrines.find(s => s.id === 92)
  const listeners = { pointerdown: [[], []], pointerup: [[], []] }
  const canvas = { isConnected: true, width: 1440, height: 1000,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 1000 }),
    addEventListener(type, fn, capture = false) { listeners[type][capture ? 0 : 1].push(fn) },
    removeEventListener(type, fn, capture = false) {
      const list = listeners[type][capture ? 0 : 1], index = list.indexOf(fn)
      if (index >= 0) list.splice(index, 1)
    }, toDataURL: () => 'data:image/png;base64,c3VwcGxpZWQtZnJhbWU=' }
  const objects = {}, root = {}, camera = {}
  const material = { map: { image: { src: 'supplied.png', width: 64, height: 64 } } }
  const child = model => ({ visible: true, material, userData: { nativeModel: model } })
  const actorGroup = { visible: true, parent: objects, position: { x: shaman.x, y: 0, z: shaman.z },
    userData: { layers: [child(0)] } }
  const vaultGroup = { visible: true, parent: objects, position: { x: vault.x, y: 0, z: vault.z },
    children: [child(154)], traverse(fn) { this.children.forEach(fn) } }
  const calls = []
  const clock = { animationFrame: 0,
    beforeTurn(...args) { calls.push(['before', this, args]); return 'before-result' },
    afterTurn(...args) { calls.push(['after', this, args]); return 'after-result' } }
  const renderer = { domElement: canvas, info: { render: { frame: 0 } },
    getContext: () => ({ isContextLost: () => false }),
    render(...args) { calls.push(['render', this, args]); this.info.render.frame++; return 'render-result' } }
  const scene = { world, started: true, scene: root, camera, objects, renderer, gameClock: clock,
    cameraPosition: { x: 1, y: 2, angle: 0 }, view: { projection: {} }, pointerAck: { target: 0, until: 0 },
    unitMeshes: new Map([[shaman.id, actorGroup]]), shrineMeshes: new Map([[vault.id, { g: vaultGroup }]]),
    pickUnit: () => null, pickWorldObject: () => vault, pick: () => vault,
    picking: { pickPerson: () => null, model: () => [] }, screen: () => ({ x: 0, y: 0 }) }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world }, devicePixelRatio: 1 }
  globalThis.document = { querySelector: () => null, elementFromPoint: () => canvas }
  let time = 0
  const page = { evaluate: (fn, arg) => fn(arg), waitForFunction: async fn => assert.ok(fn()),
    mouse: { async click(x, y) {
      for (const type of ['pointerdown', 'pointerup']) {
        const event = { type, target: canvas, isTrusted: true, clientX: x, clientY: y, button: 0,
          buttons: type === 'pointerdown' ? 1 : 0, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, pointerType: 'mouse' }
        for (const fn of [...listeners[type][0]]) fn(event)
        // Supplied DOM handler boundary invokes the normal model command. Real
        // pointer dispatch/trust and rendered geometry still require the browser.
        if (type === 'pointerup') {
          assert.equal(command(world, scene.pickWorldObject(event)), true)
          scene.pointerAck = { target: vault.id, until: scene.pointerAck.until + 1 }
        }
        for (const fn of [...listeners[type][1]]) fn(event)
      }
    } } }
  const input = createMission1VaultInput({ page, signal: new AbortController().signal,
    report: { actions: [] }, save() {}, originalShamanId: shaman.id })
  const originals = { before: clock.beforeTurn, after: clock.afterTurn, render: renderer.render }
  let api
  return { world, shaman, vault, scene, canvas, listeners, clock, renderer, calls, page, input, originals,
    async install() {
      api = await installTempleRouteObservation({ returnApi: true })
      attachTempleVaultApproach(api, { currentPersonOrder, buildingFootprintCells }, () => time)
      return api
    }, get api() { return api }, advanceTime: n => { time += n },
    step(render = true) {
      tick(world, 1 / 12, clock)
      clock.animationFrame += 2
      actorGroup.position = { x: shaman.x, y: 0, z: shaman.z }
      if (vaultGroup.children[0].userData.nativeModel !== vault.model) vaultGroup.children[0] = child(vault.model)
      if (render) renderer.render(root, camera)
    } }
}

test('actual input helper and authored Vault caller compose through outside work, open entry, gift, unlock and departure', async t => {
  const f = fixture(t), api = await f.install()
  const delivery = await f.input.clickEntity('shrines', 92, 33, false, [46])
  const e = api.vaultApproach.evidence
  assert.equal(delivery.after.units[0].orderOwner.phase, 0)
  assert.equal(e.input.after.p.commandPhase, 0)
  assert.equal(e.rows.length, 0)
  for (let n = 0; n < 4000 && !api.vaultApproach.status().complete; n++) f.step()
  const finished = api.close()
  const result = assertVaultApproachEvidence(finished)
  assert.ok(result.unlockTurn > result.rewardTurn)
  assert.equal(e.giftVisits, 82)
  assert.deepEqual(e.frames.map(frame => frame.label), ['approach', 'prayer', 'entry'])
  assert.equal(f.clock.beforeTurn, f.originals.before)
  assert.equal(f.clock.afterTurn, f.originals.after)
  assert.equal(f.renderer.render, f.originals.render)
  assert.deepEqual(f.listeners, { pointerdown: [[], []], pointerup: [[], []] })
  for (const mutate of [
    copy => { copy.rows[copy.prayer.index].after.vault.work = copy.rows[copy.prayer.index].before.vault.work },
    copy => { copy.rows[copy.prayer.index].after.occupied = true },
    copy => { copy.rows[copy.phases[9]].after.p.goalY = 30464 },
    copy => { copy.giftVisits = 81 }, copy => { copy.frames[2].state.p.commandPhase = 5 },
  ]) {
    const copy = structuredClone(e)
    mutate(copy)
    assert.throws(() => assertVaultApproachEvidence(copy))
  }
})

test('multiple turns per render keep phase labels exact and retain missing phase4 as a gap', async t => {
  const f = fixture(t), api = await f.install()
  await f.input.clickEntity('shrines', 92, 33, false, [46])
  for (let n = 0; n < 4000 && !api.vaultApproach.status().complete; n++) {
    f.step(false)
    if (f.shaman.native.commandPhase !== 4) f.renderer.render(f.scene.scene, f.scene.camera)
  }
  const e = api.close()
  assertVaultApproachEvidence(e, { requireFrames: false })
  assert.ok(!e.frames.some(frame => frame.label === 'entry'))
  assert.equal(e.frames.find(frame => frame.label === 'entry-gap-phase5').state.p.commandPhase, 5)
  assert.throws(() => assertVaultApproachEvidence(e), /Missing natural entry pixels/)
})

test('wall and pair bounds stop retention while original callbacks still run', async t => {
  const f = fixture(t), api = await f.install()
  await f.input.clickEntity('shrines', 92, 33, false, [46])
  f.step()
  f.advanceTime(420000)
  const count = api.vaultApproach.evidence.rows.length
  f.step(); f.step()
  assert.equal(api.vaultApproach.evidence.rows.length, count)
  assert.match(api.vaultApproach.evidence.errors.join('\n'), /collection stopped/)
  assert.ok(f.calls.filter(c => c[0] === 'after').length >= 3)
  api.close()
  const second = fixture(t), other = await second.install()
  await second.input.clickEntity('shrines', 92, 33, false, [46])
  other.vaultApproach.evidence.rows.length = 4000 // Supplied boundary, not a turn trace.
  second.step()
  assert.equal(other.vaultApproach.evidence.rows.length, 4000)
  assert.equal(other.vaultApproach.evidence.bound.pairs, 4000)
  other.close()
})

test('callback receivers, arguments, returns and falsy throws survive passive observer failure', async t => {
  const f = fixture(t), api = await f.install()
  assert.equal(f.clock.beforeTurn(7), 'before-result')
  assert.equal(f.calls.at(-1)[1], f.clock)
  assert.deepEqual(f.calls.at(-1)[2], [7])
  window.testSceneRef.current = { ...f.scene }
  assert.equal(f.clock.afterTurn(8), 'after-result')
  assert.throws(() => api.vaultApproach.status(), /ownership changed/)
  api.close()
  for (const thrown of [null, undefined, false, 0, '']) {
    const g = fixture(t)
    g.clock.afterTurn = () => { throw thrown }
    const owner = await g.install()
    let actual = Symbol('missing')
    try { g.clock.afterTurn() } catch (error) { actual = error }
    assert.equal(actual, thrown)
    owner.close()
  }
})

test('partial installation rolls back and foreign callback/API replacements survive owned cleanup', async t => {
  const f = fixture(t)
  f.clock.afterTurn = null
  await assert.rejects(f.install(), /Missing Vault callback/)
  assert.equal(f.clock.beforeTurn, f.originals.before)
  window.m3TempleRoute.close()
  const g = fixture(t), api = await g.install(), foreign = { close() { assert.fail('foreign close') } }
  const foreignRender = () => 'foreign'
  g.renderer.render = foreignRender
  window.m3TempleRoute = foreign
  const e = api.close()
  assert.equal(e.restored, false)
  assert.equal(window.m3TempleRoute, foreign)
  assert.equal(g.renderer.render, foreignRender)
  assert.equal(g.clock.beforeTurn, g.originals.before)
  assert.deepEqual(g.listeners.pointerup, [[], []])
  assert.equal(api.vaultApproach.finish(), e)
})

test('production host cleanup preserves primary failure and attempts pause, close, write and disposal independently', async t => {
  const f = fixture(t), api = await f.install(), outcome = { failed: true, failure: false }
  const report = { cleanupErrors: [] }
  let disposed = false
  await cleanupVaultApproach({ input: { async pause() { throw new Error('pause failed') } },
    routeHandle: { evaluate: fn => fn(api), async dispose() { disposed = true; throw new Error('dispose failed') } },
    report, output: '/missing-output' }, outcome)
  assert.deepEqual(outcome, { failed: true, failure: false })
  assert.equal(disposed, true)
  assert.equal(report.evidence.restored, true)
  assert.match(report.cleanupErrors.join('\n'), /pause failed/)
  assert.match(report.cleanupErrors.join('\n'), /dispose failed/)
})

test('real host retains falsy startup failures and real named CLI import reaches the no-browser guard', async t => {
  const output = mkdtempSync(join(tmpdir(), 'vault-observer-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  for (const error of [null, undefined, false, 0, '']) {
    let caught = Symbol('missing')
    try { await scenario({ page: {}, output, signal: new AbortController().signal,
      receipt: { profile: { mode: 'created', checkpointAtStart: null } },
      openMission: async () => { throw error } }) } catch (actual) { caught = actual }
    assert.equal(caught, error)
    assert.equal(JSON.parse(readFileSync(join(output, 'mission3-vault-approach.json'))).status, 'failed')
  }
  const root = fileURLToPath(new URL('../../', import.meta.url))
  const result = spawnSync(process.execPath, ['scripts/local-render/harness.mjs', '--game-root', root,
    '--scenario', resolve(root, 'scripts/local-render/mission3-vault-approach.mjs'),
    '--output', join(output, 'cli'), '--browser', join(output, 'nonexistent-browser')],
  { cwd: root, encoding: 'utf8', timeout: 10000 })
  assert.equal(result.error, undefined)
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Browser binary does not exist/)
  assert.doesNotMatch(result.stderr, /unsettled top-level await/)
})
