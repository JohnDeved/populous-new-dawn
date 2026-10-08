import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, existsSync } from 'node:fs'
import { installMission1VaultWitness, readMission1VaultProgress } from './mission1-vault-witness.mjs'
import { installMission1VaultCheckpointState, readMission1VaultCheckpoint, installMission1VaultLoadWitness } from './mission1-vault-checkpoint.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { findMission1CampGround, installMission1CampConstruction } from './mission1-vault-construction.mjs'
import { waitForCheckpointReadback } from '../checkpoint-readback.mjs'
import { mission1BlastReady } from './mission1-vault-knowledge.mjs'

const source = file => readFileSync(new URL(file, import.meta.url), 'utf8')
const vector = () => ({ toArray: () => [0, 0, 0] })
const group = (frame = 1077, glow = 1417) => ({ name: 'knowledge', visible: true, position: vector(), children: [],
  userData: { frame, resourceFamily: 'hfx', glow: { visible: true, position: vector(), userData: { frame: glow } } } })
function fixture() {
  const world = { turn: 0, time: 0, paused: false, speed: 1, status: 'playing', unlockedCamp: false,
    shrines: [{ id: 91, kind: 'vault', mode: 4, reward: 'camp', x: -5, z: -3, active: true, remaining: 1,
      knowledgeGlow: { f1: 2, f2: 3, displayedFrame: 1 } }], outcome: { level: 1 }, gifts: [],
    stats: { bridges: 1 }, landVersion: 7, land: { heights: new Uint16Array([0, 2, 3]), landFlags: 0 },
    units: [{ id: 46, kind: 'shaman', team: 'blue', hp: 800, x: 0, z: 4, inside: null, path: [],
      native: { commands: [0], commandCursor: 0, immediateCommand: 0 } }], selected: [46],
    buildingOrders: { records: [null] }, lastOrderTurn: -1, mode: null, buildings: [] }
  const calls = [], scene = { world, scene: {}, camera: {}, shrineMeshes: new Map([[91, { g: { userData: { vaultKnowledgeMarker: group() } } }]]), fxMeshes: new Map(), pointerAck: { target: 0, until: 0 } }
  const before = function (...args) { calls.push(['before', this === scene.gameClock, args]); return 10 }
  const after = function (...args) { calls.push(['after', this === scene.gameClock, args]); return 11 }
  const render = function (...args) { calls.push(['render', this === scene.renderer, args]); return 12 }
  scene.gameClock = { beforeTurn: before, afterTurn: after, animationFrame: 100 }
  scene.renderer = { render, domElement: { width: 100, height: 100, toDataURL() {
    assert.equal(calls.at(-1)[0], 'render'); return 'data:image/png;base64,AAAA'
  } } }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  return { world, scene, calls, before, after, render,
    visit(mutate = () => {}) { scene.gameClock.beforeTurn('input'); world.turn++; mutate(); scene.gameClock.afterTurn('output') },
    draw() { return scene.renderer.render(scene.scene, scene.camera) } }
}
function birth(f, initialize = () => {}) {
  window.vaultEvidence.arm = 'birth'
  f.visit(() => {
    f.world.shrines[0].active = false
    const gift = { id: 200, reward: 'camp', frame: 1077,
      animation: { object: 1417, draw: 43, f1: 0 }, sprite: { sequence: 'vault-knowledge-glow', frame: 0 }, phase: 6, remaining: 82 }
    initialize(gift); f.world.gifts.push(gift)
    f.scene.shrineMeshes.get(91).g.userData.vaultKnowledgeMarker.visible = false
    f.scene.fxMeshes.set(200, group())
  })
}
function presentationVisits(f, count) {
  // Controlled presentation visits, independent of the real observer under test.
  const gift = f.world.gifts[0]
  for (let i = 0; i < count; i++) {
    gift.sprite.frame = gift.animation.f1 >>> 2
    gift.animation.f1 = (gift.animation.f1 + 4) % 56
    f.scene.gameClock.animationFrame++
  }
  f.scene.fxMeshes.get(200).userData.glow.userData.frame = 1417 + gift.sprite.frame
}

test('observer copies state, preserves receiver/arguments/results and reads pixels only after actual render', () => {
  const f = fixture(), initial = structuredClone(f.world)
  installMission1VaultWitness(); assert.deepEqual(f.world, initial)
  assert.equal(f.scene.gameClock.beforeTurn('input'), 10)
  f.world.turn++; const afterTurn = structuredClone(f.world)
  assert.equal(f.scene.gameClock.afterTurn('output'), 11)
  assert.equal(window.vaultEvidence.stages.preflight.postRender, undefined)
  assert.equal(f.draw(), 12); assert.deepEqual(f.world, afterTurn)
  assert.deepEqual(f.calls.map(c => [c[0], c[1]]), [['before', true], ['after', true], ['render', true]])
  assert.deepEqual(f.calls[0][2], ['input']); assert.deepEqual(f.calls[1][2], ['output'])
  assert.equal(window.vaultRenderedPixels.preflight, 'data:image/png;base64,AAAA')
  assert.equal(window.restoreVaultWitness().restored, true)
  assert.equal(f.scene.gameClock.beforeTurn, f.before); assert.equal(f.scene.gameClock.afterTurn, f.after); assert.equal(f.scene.renderer.render, f.render)
})

test('mode4 birth has no recipient or PersonOrder requirement and preserves six/82 visit boundaries', () => {
  const f = fixture(); installMission1VaultWitness(); birth(f); f.draw()
  assert.equal(Object.hasOwn(f.world.gifts[0], 'recipient'), false)
  assert.equal(window.vaultEvidence.giftId, 200)
  assert.equal(window.vaultEvidence.stages.birth.postRender.gift.glow.frame, 1417)
  for (let i = 1; i <= 82; i++) {
    f.visit(() => {
      const g = f.world.gifts[0]; g.remaining--; g.phase = Math.max(0, g.phase - 1)
      if (!g.phase) f.scene.fxMeshes.get(200).visible = false
      if (!g.remaining) { f.world.gifts.length = 0; f.world.unlockedCamp = true }
    })
    f.draw()
  }
  const e = window.restoreVaultWitness()
  assert.deepEqual(e.errors, []); assert.equal(e.stages.retirement.afterTurn.turn - e.stages.birth.afterTurn.turn, 6)
  assert.equal(e.stages.retirement.postRender.gift.visible, false)
  assert.equal(e.stages.payout.afterTurn.turn - e.stages.birth.afterTurn.turn, 82)
  assert.equal(e.stages.payout.beforeTurn.camp, false); assert.equal(e.stages.payout.afterTurn.camp, true)
})

test('several turns before a render fail closed when visible birth was missed', () => {
  const f = fixture(); installMission1VaultWitness(); birth(f)
  for (let i = 0; i < 6; i++) f.visit(() => { f.world.gifts[0].phase--; f.world.gifts[0].remaining-- })
  f.scene.fxMeshes.get(200).visible = false; f.draw()
  const e = window.restoreVaultWitness()
  assert.match(e.errors[0], /Missed visible birth/)
  assert.equal(e.stages.birth.postRender.state.gift.phase, 0)
  assert.equal(window.vaultRenderedPixels.birth, 'data:image/png;base64,AAAA')
  assert.equal(e.stages.birth.missedRender.state.gift.phase, 0)
  assert.equal(e.stages.birth.afterTurn.gift.phase, 6)
  assert.equal(e.stages.retirement.afterTurn.gift.phase, 0)
  assert.equal(f.world.paused, false); assert.equal(f.scene.renderer.render, f.render)
})

test('two presentation visits replay the retained continuation07 cursor8 latch1 HFX1418 boundary', () => {
  // Controlled endpoint replay, not an actual browser replay or approval of that failed run.
  const f = fixture(); installMission1VaultWitness(); birth(f); presentationVisits(f, 2); f.draw()
  assert.deepEqual(window.restoreVaultWitness().errors, [])
})

test('multiple presentation visits before one actual render use independent clock delta and retain the first frame', () => {
  // Counts14/15 cover descriptor wrap arithmetic only, not ordinary six-turn scheduling.
  for (const count of [0, 1, 2, 14, 15]) {
    const f = fixture(); installMission1VaultWitness(); birth(f); presentationVisits(f, count)
    const before = structuredClone(f.world)
    f.draw()
    const e = window.restoreVaultWitness(), stage = e.stages.birth
    assert.deepEqual(e.errors, []); assert.deepEqual(f.world, before)
    assert.equal(stage.presentation.birthClock.animationFrame, 100)
    assert.equal(stage.presentation.firstRenderClock.animationFrame, 100 + count)
    assert.equal(stage.presentation.birthClock.sameOwner, true)
    assert.equal(stage.presentation.firstRenderClock.sameOwner, true)
    assert.equal(stage.presentation.visits, count)
    assert.equal(stage.postRender.state.gift.animation.f1, (count % 14) * 4)
    assert.equal(stage.postRender.gift.glow.frame, 1417 + (count ? (count - 1) % 14 : 0))
    assert.equal(window.vaultRenderedPixels.birth, 'data:image/png;base64,AAAA')
    assert.equal(f.calls.filter(c => c[0] === 'render').length, 1)
  }
})

test('wrong first body, cursor, latch or HFX fails with actual frame metadata and pixels retained', () => {
  for (const mutate of [f => { f.scene.fxMeshes.get(200).userData.frame = 1079 },
    f => { f.world.gifts[0].animation.f1 = 12 }, f => { f.world.gifts[0].sprite.frame = 2 },
    f => { f.scene.fxMeshes.get(200).userData.glow.userData.frame = 1419 },
    f => { f.scene.gameClock.animationFrame = 103 }]) {
    const f = fixture(); installMission1VaultWitness(); birth(f)
    let retainedAtRejection = false
    const errors = window.vaultEvidence.errors, push = errors.push
    errors.push = function (...messages) {
      assert.ok(window.vaultEvidence.stages.birth.postRender)
      assert.equal(window.vaultRenderedPixels.birth, 'data:image/png;base64,AAAA')
      retainedAtRejection = true
      return push.apply(this, messages)
    }
    presentationVisits(f, 2); mutate(f); f.draw()
    const e = window.restoreVaultWitness()
    delete errors.push
    assert.equal(retainedAtRejection, true)
    assert.match(e.errors[0], /owned HFX1077|independent presentation visits/)
    assert.deepEqual(e.stages.birth.postRender, e.stages.birth.missedRender)
    assert.equal(window.vaultRenderedPixels.birth, 'data:image/png;base64,AAAA')
    const first = structuredClone(e.stages.birth.postRender)
    f.scene.fxMeshes.set(200, group()); f.draw()
    assert.deepEqual(e.stages.birth.postRender, first)
  }
})

test('birth initialization and clock identity fail independently of plausible final cursor', () => {
  for (const mutate of [g => { g.animation.f1 = 4 }, g => { g.sprite.frame = 1 }]) {
    const f = fixture(); installMission1VaultWitness(); birth(f, mutate); f.draw()
    assert.match(window.restoreVaultWitness().errors[0], /Birth must initialize/)
    assert.equal(window.vaultRenderedPixels.birth, 'data:image/png;base64,AAAA')
  }
  for (const mutate of [f => { f.scene.gameClock = { ...f.scene.gameClock } },
    f => { f.scene.gameClock.animationFrame-- }, f => { f.scene.gameClock.animationFrame = NaN }]) {
    const f = fixture(); installMission1VaultWitness(); birth(f); mutate(f); f.draw()
    const e = window.restoreVaultWitness()
    assert.match(e.errors[0], /clock identity\/counter changed/)
    assert.ok(e.stages.birth.postRender); assert.equal(window.vaultRenderedPixels.birth, 'data:image/png;base64,AAAA')
  }
})

test('source pins independent presentation counter after draw43 visit and renderer after elapsed-time loop', () => {
  const clock = source('../../app/game-clock.ts'), scene = source('../../app/scene.ts'), people = source('../../app/live-people.ts')
  const descriptor = JSON.parse(source('../../app/original-rules.json')).animationDescriptors[43]
  assert.deepEqual([descriptor.mode, descriptor.step, descriptor.hold], [1, 4, 14])
  assert.equal([...clock.matchAll(/clock\.animationFrame\+\+/g)].length, 1)
  assert.match(clock, /animateLiveObjects\(w\)[\s\S]*?clock.animationFrame\+\+/)
  assert.match(people, /knowledgeGlow.frame = \(f.animation.f1 & 65535\) >>> 2[\s\S]*?stepObjectAnimation\(/)
  assert.match(scene, /advanceGame\(this.world, this.gameClock, dt\)[\s\S]*?this.updateEffectsFrame\(\)[\s\S]*?this.renderSceneFrame\(/)
  const driver = source('./mission1-vault-knowledge.mjs')
  assert.match(driver, /writeFileSync\(resolve\(output, file\), bytes\)[\s\S]*?report.witnesses\[epoch\] = witness; save\(\)[\s\S]*?assert.deepEqual\(witness.errors, \[\]\)/)
})

test('original errors propagate once; diagnostic failure never suppresses original render', () => {
  let f = fixture(), calls = 0; const failure = Error('production renderer error')
  f.scene.renderer.render = () => { calls++; throw failure }; installMission1VaultWitness()
  assert.throws(() => f.draw(), e => e === failure); assert.equal(calls, 1); assert.deepEqual(window.vaultEvidence.errors, [])
  window.restoreVaultWitness()
  f = fixture(); f.scene.renderer.domElement.toDataURL = () => { throw Error('capture failure') }
  installMission1VaultWitness(); f.visit(); assert.equal(f.draw(), 12)
  assert.match(window.vaultEvidence.errors[0], /capture failure/)
  assert.ok(window.vaultEvidence.stages.preflight.postRender)
  assert.equal(window.restoreVaultWitness().restored, false); assert.equal(f.scene.renderer.render, f.render)
})

test('observer rejects wrong source, preserves inherited callbacks and does not overwrite another owner', () => {
  for (const change of [w => { w.outcome.level = 3 }, w => { w.shrines[0].reward = 'temple' }, w => { w.shrines[0].x = 0 }, w => { w.shrines[0].mode = 0 }]) {
    const f = fixture(); change(f.world)
    assert.throws(installMission1VaultWitness, /authored|Authored/); assert.equal(f.scene.renderer.render, f.render)
  }
  const f = fixture(), prototype = { ...f.scene.gameClock }
  f.scene.gameClock = Object.create(prototype); installMission1VaultWitness()
  const other = () => 4; f.scene.renderer.render = other
  const e = window.restoreVaultWitness()
  assert.equal(Object.hasOwn(f.scene.gameClock, 'beforeTurn'), false)
  assert.equal(f.scene.renderer.render, other); assert.match(e.errors[0], /ownership changed/)
})

test('read-only progress includes mode4 work/VaultTask without fabricating PersonOrder or recipient', () => {
  const f = fixture(); f.world.units[0].work = 91; f.world.units[0].vault = { head: 91, phase: 1 }
  installMission1VaultWitness(); const before = structuredClone(f.world), sample = readMission1VaultProgress(46)
  assert.deepEqual(f.world, before); assert.equal(sample.shaman.work, 91); assert.equal(sample.shaman.vaultTask.head, 91)
  assert.equal(sample.shaman.order, undefined); window.restoreVaultWitness()
})

test('checkpoint snapshot is exact camp/nonzero cursor plus earned crossing and original actor', () => {
  const f = fixture(); installMission1VaultCheckpointState()
  const snapshot = window.mission1VaultCheckpointState(f.world)
  assert.equal(snapshot.camp, false); assert.equal(snapshot.glow.f1, 2); assert.equal(snapshot.bridges, 1)
  assert.deepEqual(snapshot.heights, [0, 2, 3]); assert.equal(snapshot.shaman[0].id, 46)
  f.world.shrines[0].knowledgeGlow.f1++; f.world.land.heights[1]++
  assert.equal(snapshot.glow.f1, 2); assert.deepEqual(snapshot.heights, [0, 2, 3])
  f.world.shrines[0].reward = 'temple'; assert.throws(() => window.mission1VaultCheckpointState(f.world), /Exact authored/)
})

test('Save readback waits for committed readonly transaction, closes DB, and never creates missing storage', async () => {
  const f = fixture(); installMission1VaultCheckpointState()
  let tx, request, closed = 0, opened = 0
  const db = { transaction(name, mode) { assert.equal(name, 'checkpoints'); assert.equal(mode, 'readonly');
    tx = { objectStore(name) { assert.equal(name, 'checkpoints'); return { get(key) { assert.equal(key, 'latest'); request = {}; return request } } } }; return tx }, close() { closed++ } }
  globalThis.indexedDB = { databases: async () => [{ name: 'populous-new-dawn' }], open(name) {
    assert.equal(name, 'populous-new-dawn'); opened++; const r = { result: db }; queueMicrotask(() => r.onsuccess()); return r
  } }
  let settled = false; const pending = readMission1VaultCheckpoint().then(value => { settled = true; return value })
  await new Promise(resolve => setImmediate(resolve))
  request.result = { version: 1, world: f.world }; request.onsuccess?.()
  await Promise.resolve(); assert.equal(settled, false, 'request success is not transaction commit')
  tx.oncomplete(); const saved = await pending
  assert.equal(saved.glow.f1, 2); assert.equal(closed, 1)
  indexedDB.databases = async () => []
  assert.equal(await readMission1VaultCheckpoint(), null); assert.equal(opened, 1)
  let reads = 0, pauses = 0
  assert.equal(await waitForCheckpointReadback(async () => { await Promise.resolve(); return ++reads === 3 }, { pause: async () => { pauses++ } }), true)
  assert.equal(reads, 3); assert.equal(pauses, 2)
})

test('Load store replacement is captured synchronously before auto-resume and unsubscribes once', () => {
  const f = fixture(); installMission1VaultCheckpointState()
  let current = f.world, subscriber, unsubscribed = 0
  const store = { getWorld: () => current, subscribe(fn) { subscriber = fn; return () => { unsubscribed++ } } }
  const main = { __reactFiberTest: { memoizedState: { memoizedState: store }, return: null } }
  globalThis.document = { querySelector: selector => { assert.equal(selector, 'main'); return main } }
  installMission1VaultLoadWitness(); subscriber(); assert.equal(window.vaultLoadedBoundary, null)
  current = structuredClone(f.world); current.paused = true
  const expected = window.mission1VaultCheckpointState(current)
  subscriber(); current.paused = false; current.turn++; current.shrines[0].knowledgeGlow.f1++
  assert.deepEqual(window.vaultLoadedBoundary, expected); assert.equal(window.vaultLoadedError, null)
  assert.equal(unsubscribed, 1); assert.equal(window.restoreVaultLoadWitness, undefined)
})

// Execute the same serialized browser helper with imports replaced only at its
// module boundary. Fake modules expose resource lifetimes and reject live writes.
const browserFunction = (fn, imports) => Function('imports', `return (${fn.toString().replaceAll('import(', 'imports(')})`)(imports)

test('detached placement uses actual selected Braves, owns canvas hits, and releases every route query', async () => {
  const f = fixture(); f.world.units = [1, 2].map(id => ({ id, team: 'blue', kind: 'brave', hp: 100, x: id, z: 30 }))
  f.world.selected = [1, 2]; f.world.motionRoutes = { active: 0 }
  f.scene.renderer.domElement.getBoundingClientRect = () => ({ x: 0, y: 0, width: 100, height: 100 })
  f.scene.screen = () => ({ x: 0, y: 0 }); f.scene.pick = () => ({ x: 0, z: 30 })
  let planned = 0, released = 0, validated = 0
  const modules = {
    '/app/model.ts': { placementError(w, kind) { assert.notEqual(w, f.world); assert.equal(kind, 'camp'); validated++; return null } },
    '/qa/erosion-ordinary/input.mjs': { createMoveContextProbe: () => () => ({ enabled: true, model: 3 }), inspectEntityPoint: () => ({ canvasOwned: true, hitId: null }) },
    '/app/world-terrain-runtime.ts': { syncNativeTerrain(w) { assert.notEqual(w, f.world); w.synchronized = true }, syncLandscapeObjects() {} },
    '/app/live-pathfinding.ts': { planLivePath(w, u) { assert.notEqual(w, f.world); assert.equal(w.motionRoutes.active, 0); w.motionRoutes.active++; planned++; return { id: u.id } } },
    '/app/person-routes.ts': { releasePersonRoute(pool) { assert.equal(pool.active, 1); pool.active--; released++ } },
  }
  const run = browserFunction(findMission1CampGround, async path => { assert.ok(modules[path], path); return modules[path] })
  const before = structuredClone(f.world), hit = await run({ point: { x: 0, z: 30 }, radius: 1, ids: [1, 2] })
  assert.deepEqual(hit.reachable, [1, 2]); assert.deepEqual(hit.selected, [1, 2])
  assert.equal(planned, 2); assert.equal(released, 2); assert.equal(validated, 1); assert.deepEqual(f.world, before)
  f.world.units[0].kind = 'warrior'
  await assert.rejects(() => run({ point: { x: 0, z: 30 }, ids: [1] }), /actual living selected Braves/)
})

test('command33 accepts exact queued native ownership; command27 requires delivered ordinary PersonOrder', async () => {
  for (const command of [27, 33]) {
    const f = fixture(), listeners = new Map(), hit = { id: 91, collection: 'shrines', x: 50, y: 50 }
    globalThis.document = {}
    const person = f.world.units[0].native
    Object.assign(person, { commandPhase: 0, workTarget: 0, flags2: 0x40000000, timer: 0 })
    f.world.objectCells = { objects: new Map([[46, person]]) }
    f.scene.renderer.domElement.addEventListener = (type, fn) => listeners.set(type, fn)
    f.scene.renderer.domElement.removeEventListener = type => listeners.delete(type)
    const modules = {
      '/app/person-orders.ts': { currentPersonOrder: () => person.commands[0]
        ? { model: command, a: 91, b: 0, flags: 0, references: 1 } : undefined },
      '/qa/erosion-ordinary/input.mjs': { createMoveContextProbe: () => () => ({ enabled: true, model: command }), inspectEntityPoint: () => ({ canvasOwned: true, hitId: 91 }),
        findEntityInput: () => hit, entityInputState: () => ({}), observeEntityPointer: () => ({ finish: () => ({ errors: [], restored: true,
          events: ['pointerdown', 'pointerup'].map(type => ({ type, button: 0, trusted: true, canvasOwned: true, canvasTarget: true, args: {} })) }) }) },
    }
    const page = { waitForFunction: async (fn, args) => { assert.ok(fn(args)) },
      evaluate: (fn, args) => browserFunction(fn, async path => {
        if (['/app/live-command.ts', '/app/spell-casting.ts', '/app/world-terrain-runtime.ts', '/app/native-math.ts'].includes(path)) return {}
        assert.ok(modules[path], path); return modules[path]
      })(args), mouse: { async click() {
      f.world.lastOrderTurn = 0; f.scene.pointerAck = { target: 91, until: 2 }; person.commands[0] = 1
      if (command === 33) { f.world.units[0].work = 91; f.world.units[0].vault = { head: 91, phase: 0, entering: true, remaining: 0 } }
      listeners.get('pointerup')()
    } } }
    const input = createMission1VaultInput({ page, signal: new AbortController().signal, report: { actions: [] }, save() {}, originalShamanId: 46 })
    const result = await input.dispatch(hit, command, [46])
    assert.equal(result.context.model, command)
    assert.equal(result.after.units[0].order?.model, command)
    if (command === 33) assert.equal(result.after.units[0].vaultTask.head, 91)
    assert.equal(listeners.size, 0)
  }
})

test('construction observer records real cargo transfer/work and restores one-call hook', () => {
  const f = fixture(); f.world.buildings = [{ id: 300, logs: 0, progress: 0, hp: 1 }]
  f.world.units.push({ id: 47, team: 'blue', kind: 'brave', hp: 100, work: 300, cargo: 1 })
  installMission1CampConstruction(300); f.visit()
  f.visit(() => { f.world.units[1].cargo = 0; f.world.buildings[0].logs = 1; f.world.buildings[0].progress = 0.125 })
  f.visit(() => { f.world.buildings[0].logs = 8; f.world.buildings[0].progress = 1 })
  const result = window.restoreMission1CampConstruction()
  assert.equal(result.carried.length, 1); assert.equal(result.delivered.length, 1)
  assert.equal(result.completed.progress, 1); assert.equal(result.restored, true); assert.deepEqual(result.errors, [])
  assert.equal(f.calls.filter(c => c[0] === 'after').length, 3); assert.equal(f.scene.gameClock.afterTurn, f.after)
})

test('driver binds shipped labels, readiness, authored records and maintained source paths', () => {
  const driver = source('./mission1-vault-knowledge.mjs'), input = source('./mission1-vault-input.mjs')
  const page = source('../../app/page.tsx'), selector = source('../../app/world-selector.tsx'), rules = source('../../app/world-rules.ts')
  assert.match(driver, /await openMission\(1\)[\s\S]*await waitForShamanReadiness\(page/)
  assert.match(driver, /from '\.\.\/browser-game\.mjs'/)
  assert.match(driver, /await bindGame\(page\); await waitForShamanReadiness\(page\)/)
  for (const label of ['Select and focus shaman', 'Pause game', 'Resume game', 'Game settings', 'Save checkpoint']) assert.ok(page.includes(label), label)
  assert.ok(page.includes('Start game') && selector.includes('Load Game'))
  assert.ok(page.includes('aria-label={`${t} ${t === \'spells\' ? \'1–3\' : t === \'buildings\' ? \'B\''))
  assert.ok(page.includes('aria-label={`${b.name}, ${b.cost} wood`}'))
  assert.ok(page.includes('aria-label={`Select ${u.kind}`}'))
  assert.match(rules, /id: 'camp',\s+name: 'Warrior Training Hut',\s+cost: 8/)
  assert.match(rules, /id: 'blast',[\s\S]*?key: '1'/); assert.match(rules, /id: 'bridge',[\s\S]*?key: '2'/)
  assert.match(driver, /keyboard.press\('2'\); assert.equal\(\(await read\(\)\).mode, 'bridge'\)/)
  assert.match(driver, /keyboard.press\('1'\); assert.equal\(\(await read\(\)\).mode, 'blast'\)/)
  const level = JSON.parse(source('../../app/level-one.ts').split('export default ')[1].replace(/;\s*$/, ''))
  const objects = level.objects
  assert.ok(objects.find(o => o.index === 43 && o.type === 1 && o.model === 2 && o.owner === 1 && o.x === -9 && o.z === -3))
  assert.ok(objects.find(o => o.index === 30 && o.x === -5 && o.z === 25))
  assert.ok(objects.find(o => o.index === 1 && o.x === -5 && o.z === -3))
  for (const path of new Set([...driver.matchAll(/import\('(\/(?:app|qa)\/[^']+)'\)/g), ...input.matchAll(/import\('(\/(?:app|qa)\/[^']+)'\)/g)].map(m => m[1])))
    assert.ok(existsSync(new URL('../..' + path, import.meta.url)), path)
  assert.match(input, /after.stock, before.stock - 1/)
  assert.match(driver, /w.stats.bridges > bridges && !w.effects.some/)
  assert.match(driver, /assert.deepEqual\(boundary.loaded, saved\)/)
  assert.match(driver, /await waitForCheckpointReadback\(async/)
  assert.match(driver, /stages.birth.postRender.gift.glow.frame, stages.birth.presentation.expectedHfx/)
  assert.match(driver, /Warrior Training Hut, 8 wood/)
  assert.doesNotMatch(driver + input, /training-entry|requestAnimationFrame\s*=|\.tick\(|\.animate\(|\.render\(|indexedDB.*readwrite/)
})


test('Blast readiness waits for the actual tribe casting cooldown and original living Shaman', () => {
  const f = fixture(), u = f.world.units[0]
  Object.assign(u, { cooldown: 0, lift: 0, casting: null })
  f.world.shots = { blast: 1 }
  f.world.castingTribes = [{ flags: 0, cooldown: 12, aiCooldown: 0 }]
  f.world.manaTribes = [{ playerType: 0 }]
  assert.equal(mission1BlastReady(46), false, 'combat cooldown zero does not clear spell cooldown')
  f.world.castingTribes[0].cooldown = 0
  u.cooldown = 99
  assert.equal(mission1BlastReady(46), true, 'combat timer does not own spell readiness')
  f.world.manaTribes[0].playerType = 1; f.world.castingTribes[0].aiCooldown = 3
  assert.equal(mission1BlastReady(46), false)
  f.world.castingTribes[0].flags = 0x80000
  assert.equal(mission1BlastReady(46), true, 'retain native unlimited-range cast gate')
  u.lift = 1; assert.equal(mission1BlastReady(46), false)
  u.lift = 0; u.casting = { spell: 'blast' }; assert.equal(mission1BlastReady(46), false)
  u.casting = null; f.world.shots.blast = 0; assert.equal(mission1BlastReady(46), false)
  f.world.shots.blast = 1; u.hp = 0; assert.throws(() => mission1BlastReady(46), /Original Shaman/)
  assert.match(source('../../app/live-command.ts'), /canShamanCast\(w\.castingTribes\[0\], w\.manaTribes\[0\]\.playerType/)
  assert.match(source('../../app/spell-casting.ts'), /!t\.cooldown/)
  assert.match(source('./mission1-vault-knowledge.mjs'), /await wait\(mission1BlastReady, originalShamanId, 120000\)/)
})
