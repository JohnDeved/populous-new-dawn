// Supplied event/clock/renderer boundaries only. These are not game/browser runs.
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { registerHooks } from 'node:module'
import { createWorld, command, select, tick } from '../../app/model.ts'
import { finishLevelStart } from '../../tests/level-start-fixture.mjs'
import { currentPersonOrder } from '../../app/person-orders.ts'
import { nativePosition } from '../../app/world-terrain-runtime.ts'
import { spellRange } from '../../app/spell-casting.ts'
import { createMission1VaultInput } from '../../scripts/local-render/mission1-vault-input.mjs'
import missionThreeSwarm, {
  cleanupMissionThreeSwarm,
  installMissionThreeMoveObservation,
  readMissionThreeMoveObservation,
  closeMissionThreeMoveObservation,
  missionThreeSwarmStagingPoint,
} from '../../scripts/local-render/mission3-swarm.mjs'
import {
  attachMissionThreeSwarmObservation,
  assertMissionThreeSwarmCast,
  assertMissionThreeSwarmEvidence,
  swarmCandidate,
  installMissionThreeSwarmObservation,
  finishMissionThreeSwarmObservation,
  inspectMissionThreeSwarmTarget,
} from '../../scripts/local-render/mission3-swarm-witness.mjs'

const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII='
function fixture() {
  const expected = {
    shamanId: 1,
    targetId: 2,
    impact: { x: 1, z: -1 },
    impactNative: { x: 2304, y: 63744 },
  }
  const target = {
    id: 2,
    kind: 'brave',
    team: 'yellow',
    hp: 50,
    x: 1,
    z: -1,
    inside: null,
    lift: 0,
    native: {
      id: 2,
      model: 2,
      tribe: 2,
      state: 17,
      previousState: 17,
      x: 2304,
      y: 63744,
      h: 100,
      flags2: 0,
      flags3: 0,
      flags4: 0,
      life: 1000,
      damageAttacker: 255,
      vehicle: 0,
    },
  }
  const shaman = { id: 1, kind: 'shaman', team: 'blue', hp: 100, x: 0, z: 0 }
  const world = {
    turn: 0,
    time: 0,
    paused: false,
    status: 'playing',
    speed: 1,
    inputMask: 0,
    levelFlags2: 0,
    stats: { cast: 0 },
    shots: { swarm: 1 },
    giftCounts: { swarm: 0 },
    mode: 'swarm',
    selected: [1],
    units: [shaman, target],
    effects: [],
    projectiles: [],
    sounds: [],
    soundSerial: 0,
    manaTribes: Array.from({ length: 4 }, () => ({ available: 0, mana: 100 })),
    manaWorld: {
      gameFlags: 0,
      spells: Array.from({ length: 4 }, (_, tribe) => ({
        stocks: Array.from({ length: 22 }, (_, model) => (tribe === 0 && model === 5 ? 1 : 0)),
      })),
    },
  }
  const listeners = { before: [], after: [] },
    calls = []
  const canvas = {
    isConnected: true,
    width: 1,
    height: 1,
    toDataURL: () => png,
    addEventListener(type, fn, capture) {
      assert.equal(type, 'pointerup')
      listeners[capture ? 'before' : 'after'].push(fn)
    },
    removeEventListener(_type, fn, capture) {
      const array = listeners[capture ? 'before' : 'after']
      array.splice(array.indexOf(fn), 1)
    },
  }
  const scene = {
    world,
    objects: {},
    ground: {},
    scene: {},
    camera: {},
    fxMeshes: new Map(),
    gameClock: {
      animationFrame: 0,
      beforeTurn(...args) {
        calls.push({ key: 'before', receiver: this, args })
        return 'before-result'
      },
      afterTurn(...args) {
        calls.push({ key: 'after', receiver: this, args })
        return 'after-result'
      },
    },
    renderer: {
      domElement: canvas,
      info: { render: { frame: 0 } },
      render(...args) {
        calls.push({ key: 'render', receiver: this, args })
        this.info.render.frame++
        return 'render-result'
      },
    },
  }
  let stored = world
  const store = { getWorld: () => stored },
    originals = {
      before: scene.gameClock.beforeTurn,
      after: scene.gameClock.afterTurn,
      render: scene.renderer.render,
    }
  let observer
  const install = () => (observer = attachMissionThreeSwarmObservation(scene, store, expected))
  const release = (trusted = true) => {
    const event = { isTrusted: trusted, button: 0, target: canvas }
    listeners.before.forEach(fn => fn(event))
    world.projectiles.push({
      id: 10,
      caster: 1,
      team: 'blue',
      spell: 'swarm',
      target: { x: 1, z: -1 },
      destination: { x: 2304, y: -1792, h: 100 },
      phase: 'windup',
      remaining: 6,
      turns: 0,
      visuals: [],
    })
    world.shots.swarm--
    world.manaWorld.spells[0].stocks[5]--
    world.stats.cast++
    world.mode = null
    listeners.after.forEach(fn => fn(event))
  }
  const step = change => {
    assert.equal(scene.gameClock.beforeTurn('before-argument'), 'before-result')
    world.turn++
    world.time = world.turn / 12
    scene.gameClock.animationFrame += 2
    change?.()
    assert.equal(scene.gameClock.afterTurn('after-argument'), 'after-result')
  }
  const arrival = (remaining = 200) =>
    step(() => {
      world.projectiles = world.projectiles.filter(p => p.id !== 10)
      world.effects.push({
        id: 20,
        kind: 'swarm',
        x: 1,
        z: -1,
        swarm: {
          tribe: 0,
          phase: 'initializing',
          remaining,
          insects: [],
          x: 2304,
          y: 63744,
          h: 200,
          origin: { ...expected.impactNative },
        },
      })
      world.sounds.push({ serial: ++world.soundSerial, cue: 0xa4, x: 1, z: -1 })
    })
  const respond = (supplyMeshes = true) =>
    step(() => {
      Object.assign(world.effects[0].swarm, {
        phase: 'wandering',
        remaining: 199,
        insects: Array.from({ length: 60 }, () => ({})),
      })
      target.hp = 45.2
      target.native.state = 26
      target.native.damageAttacker = 0
      if (supplyMeshes)
        scene.fxMeshes.set(20, {
          name: 'swarm-insects',
          visible: true,
          parent: scene.ground,
          children: Array.from({ length: 60 }, () => ({
            name: 'swarm-insect',
            visible: true,
            userData: { nativePrimitive: 0x11, nativeSize: 7 },
            position: { x: 0, y: 0, z: 0 },
            scale: { x: 14, y: 14 },
            material: {
              map: { image: { width: 32, height: 32, src: 'http://test/original/insect.png' } },
            },
          })),
        })
    })
  const render = () =>
    assert.equal(scene.renderer.render(scene.scene, scene.camera), 'render-result')
  const twoFrames = () => {
    render()
    step(() => world.effects[0].swarm.remaining--)
    render()
  }
  const delivered = () => ({
    before: { mode: 'swarm', turn: 0, stock: 1, gifts: 0, projectiles: [] },
    after: {
      mode: null,
      turn: 0,
      stock: 0,
      gifts: 0,
      projectiles: [
        {
          id: 10,
          caster: 1,
          spell: 'swarm',
          target: { x: 1, z: -1 },
          destination: { x: 2304, y: -1792, h: 100 },
          phase: 'windup',
          remaining: 6,
          turns: 0,
          visuals: [],
        },
      ],
    },
    pointer: {
      restored: true,
      errors: [],
      events: [
        {
          type: 'pointerup',
          trusted: true,
          canvasOwned: true,
          canvasTarget: true,
          args: { clientX: 20, clientY: 30 },
          picks: [
            {
              owner: 'scene',
              name: 'pick',
              receiverMatches: true,
              args: { clientX: 20, clientY: 30 },
              point: { x: 1.2, z: -1.3 },
            },
          ],
        },
      ],
    },
  })
  return {
    world,
    scene,
    store,
    target,
    expected,
    calls,
    listeners,
    originals,
    install,
    release,
    step,
    arrival,
    respond,
    render,
    twoFrames,
    delivered,
    replaceWorld: () => (stored = structuredClone(world)),
    get observer() {
      return observer
    },
  }
}

test('candidate observation is read-only and rejects relevant response complications', () => {
  const f = fixture(),
    original = structuredClone(f.world)
  assert.equal(swarmCandidate(f.world, f.target).eligible, true)
  assert.deepEqual(f.world, original)
  for (const mutate of [
    u => (u.inside = 4),
    u => (u.hp = 0),
    u => (u.native.state = 23),
    u => (u.native.state = 26),
    u => (u.native.flags2 = 0x800000),
    u => (u.native.flags2 = 0x100000),
    u => (u.native.flags3 = 0x8000),
    u => (u.native.flags3 = 0x80000),
    u => (u.native.flags4 = 0x800),
    u => (u.native = null),
    u => (u.native.vehicle = 6),
  ]) {
    const target = structuredClone(f.target)
    mutate(target)
    assert.equal(swarmCandidate(f.world, target).eligible, false)
  }
})

test('composed input, natural callback and evidence contracts retain200→199, net-health response and real frame boundaries', () => {
  const f = fixture()
  f.install()
  f.release()
  assert.equal(
    assertMissionThreeSwarmCast(f.delivered(), f.observer.evidence, f.expected).projectileId,
    10
  )
  f.arrival()
  f.respond()
  f.twoFrames()
  const e = f.observer.finish(),
    proof = assertMissionThreeSwarmEvidence(e)
  assert.equal(e.arrival.swarm.remaining, 200)
  assert.equal(e.arrival.swarm.insects, 0)
  assert.equal(e.firstVisit.after.swarm.remaining, 199)
  assert.equal(e.firstVisit.after.swarm.insects, 60)
  assert.equal(
    e.response.after.target.hp,
    45.2,
    'Healing-offset net response is allowed without a leaf−5 claim'
  )
  assert.match(proof.visiblePixels, /Pending independent inspection/)
  assert.equal(f.scene.gameClock.beforeTurn, f.originals.before)
  assert.equal(f.scene.gameClock.afterTurn, f.originals.after)
  assert.equal(f.scene.renderer.render, f.originals.render)
  assert.deepEqual(f.listeners, { before: [], after: [] })
  for (const call of f.calls)
    assert.equal(call.receiver, call.key === 'render' ? f.scene.renderer : f.scene.gameClock)
  assert.deepEqual(f.calls.find(c => c.key === 'render').args, [f.scene.scene, f.scene.camera])
})

test('a cast receipt cannot accept wrong terrain, owner, phase, payment or pointer evidence', () => {
  const f = fixture()
  f.install()
  f.release()
  for (const mutate of [
    d => (d.after.stock = 1),
    d => (d.after.gifts = 1),
    d => d.after.turn++,
    d => (d.after.projectiles[0].caster = 7),
    d => (d.after.projectiles[0].remaining = 5),
    d => d.after.projectiles[0].destination.x++,
    d => (d.after.projectiles[0].target.x += 2),
    d => (d.pointer.events[0].trusted = false),
    d => (d.pointer.events[0].picks[0].receiverMatches = false),
    d => (d.pointer.events[0].picks[0].point.x += 2),
    d => (d.pointer.events[0].picks = []),
    d => (d.pointer.restored = false),
  ]) {
    const receipt = f.delivered()
    mutate(receipt)
    assert.throws(() => assertMissionThreeSwarmCast(receipt, f.observer.evidence, f.expected))
  }
  f.observer.evidence.cast.after.mana[1].available--
  assert.throws(
    () => assertMissionThreeSwarmCast(f.delivered(), f.observer.evidence, f.expected),
    /mana/
  )
  f.observer.finish()
})

test('competing response leaves attribution unmet despite matching panic and health', () => {
  const f = fixture()
  f.install()
  f.release()
  f.arrival()
  f.world.projectiles.push({ id: 99, spell: 'blast' })
  f.respond()
  f.twoFrames()
  const e = f.observer.finish()
  assert.equal(e.scans[0].expectedEligible, true)
  assert.equal(e.scans[0].uncontested, false)
  assert.equal(e.response, null)
  assert.throws(() => assertMissionThreeSwarmEvidence(e), /incomplete/)
})

test('untrusted release and missed initial controller are retained failures', () => {
  const untrusted = fixture()
  untrusted.install()
  untrusted.release(false)
  assert.match(untrusted.observer.finish().errors.join('\n'), /Invalid cast boundary/)
  const missed = fixture()
  missed.install()
  missed.release()
  missed.arrival(199)
  assert.match(missed.observer.finish().errors.join('\n'), /Missed or mismatched/)
})

test('passive observation errors never prevent the original callback or mask its throw', () => {
  const f = fixture()
  f.install()
  f.release()
  f.target.native.model = 999
  assert.equal(f.scene.gameClock.beforeTurn('still-runs'), 'before-result')
  assert.equal(f.calls.at(-1).args[0], 'still-runs')
  assert.ok(f.observer.evidence.errors.length)
  f.observer.finish()
  const thrown = fixture(),
    error = new Error('original callback error')
  thrown.scene.gameClock.beforeTurn = () => {
    throw error
  }
  thrown.install()
  assert.throws(
    () => thrown.scene.gameClock.beforeTurn(),
    actual => actual === error
  )
  assert.match(thrown.observer.finish().errors.join('\n'), /original callback error/)
})

test('stale renderer frame and wrong texture cannot become natural insect frames', () => {
  const stale = fixture()
  stale.scene.renderer.render = () => 'render-result'
  stale.install()
  stale.release()
  stale.arrival()
  stale.respond()
  stale.render()
  assert.match(stale.observer.finish().errors.join('\n'), /No fresh natural GPU/)
  const wrong = fixture()
  wrong.install()
  wrong.release()
  wrong.arrival()
  wrong.respond()
  wrong.scene.fxMeshes.get(20).children[0].material.map.image.src = 'http://test/original/smoke.png'
  wrong.render()
  const e = wrong.observer.finish()
  assert.match(e.errors.join('\n'), /Wrong natural/)
  assert.equal(e.frames.length, 0)
})

test('world replacement, changed callback owner and partial installation retain cleanup boundaries', () => {
  const f = fixture()
  f.install()
  f.replaceWorld()
  assert.equal(f.scene.gameClock.afterTurn(), 'after-result')
  const e = f.observer.finish()
  assert.match(e.errors.join('\n'), /ownership changed/)
  assert.equal(f.scene.renderer.render, f.originals.render)
  const replaced = fixture()
  replaced.install()
  const replacement = () => {}
  replaced.scene.renderer.render = replacement
  assert.equal(replaced.observer.finish().restored, false)
  assert.equal(
    replaced.scene.renderer.render,
    replacement,
    'Do not overwrite a later callback owner'
  )
  const partial = fixture()
  delete partial.scene.gameClock.afterTurn
  assert.throws(() => partial.install(), /Missing Swarm callback/)
  assert.equal(partial.scene.gameClock.beforeTurn, partial.originals.before)
  assert.deepEqual(partial.listeners, { before: [], after: [] })
})

test('installed API is retained before first read, detects current Scene replacement and preserves foreign global cleanup owner', t => {
  const f = fixture(),
    prior = globalThis.window
  globalThis.window = { testSceneRef: { current: f.scene }, testStore: f.store }
  t.after(() => {
    if (prior === undefined) delete globalThis.window
    else globalThis.window = prior
  })
  const api = installMissionThreeSwarmObservation(f.expected)
  assert.equal(window.m3Swarm, api)
  window.testSceneRef.current = { ...f.scene }
  assert.throws(() => api.status(), /ownership changed/)
  const foreign = {
    finish() {
      assert.fail('Must not invoke the foreign observer')
    },
  }
  window.m3Swarm = foreign
  const evidence = finishMissionThreeSwarmObservation(api)
  assert.equal(window.m3Swarm, foreign)
  assert.match(evidence.cleanupErrors.join('\n'), /foreign API preserved/)
  assert.equal(f.scene.gameClock.beforeTurn, f.originals.before)
  assert.equal(f.scene.renderer.render, f.originals.render)
  assert.deepEqual(f.listeners, { before: [], after: [] })
})

test('actual scenario retains falsy primary throws across successful and failed evidence writes', async t => {
  const output = mkdtempSync(join(tmpdir(), 'm3-swarm-host-'))
  t.after(() => rmSync(output, { recursive: true, force: true }))
  for (const error of [null, undefined, false, 0, '']) {
    for (const destination of [output, join(output, 'missing-directory')]) {
      let caught = Symbol('not-thrown'),
        starts = 0
      try {
        await missionThreeSwarm({
          page: {},
          output: destination,
          signal: new AbortController().signal,
          receipt: {
            source: 'supplied-host-boundary',
            profile: { mode: 'created', checkpointAtStart: null },
          },
          openMission: async () => {
            starts++
            throw error
          },
        })
      } catch (actual) {
        caught = actual
      }
      assert.equal(caught, error)
      assert.equal(starts, 1, 'Never repeat the uncertain initial action')
    }
    assert.equal(
      JSON.parse(readFileSync(join(output, 'mission3-swarm.json'), 'utf8')).status,
      'failed'
    )
  }
})

test('actual post-install cleanup uses both captured APIs, preserves replacements and retains a falsy primary failure', async t => {
  const prior = globalThis.window,
    output = mkdtempSync(join(tmpdir(), 'm3-swarm-cleanup-'))
  t.after(() => {
    if (prior === undefined) delete globalThis.window
    else globalThis.window = prior
    rmSync(output, { recursive: true, force: true })
  })
  for (const replace of [false, true]) {
    const f = fixture(),
      api = f.install(),
      disposed = [],
      report = { cleanupErrors: [] }
    let routeClosed = 0,
      paused = 0
    const route = {
      close() {
        routeClosed++
        delete window.m3TempleRoute
      },
    }
    const foreign = {
      close() {
        assert.fail('Foreign close must not run')
      },
      finish() {
        assert.fail('Foreign finish must not run')
      },
    }
    globalThis.window = {
      m3Swarm: replace ? foreign : api,
      m3TempleRoute: replace ? foreign : route,
    }
    const handle = (value, name) => ({
      evaluate: async fn => fn(value),
      dispose: async () => disposed.push(name),
    })
    const outcome = { failed: true, failure: false }
    await cleanupMissionThreeSwarm(
      {
        input: {
          pause: async () => {
            paused++
            throw new Error('pause cleanup failure')
          },
        },
        swarmHandle: handle(api, 'swarm'),
        routeHandle: handle(route, 'route'),
        report,
        output,
      },
      outcome
    )
    assert.deepEqual(outcome, { failed: true, failure: false })
    assert.equal(paused, 1)
    assert.deepEqual(disposed, ['swarm', 'route'])
    assert.equal(routeClosed, replace ? 0 : 1)
    assert.equal(f.scene.gameClock.beforeTurn, f.originals.before)
    assert.equal(f.scene.renderer.render, f.originals.render)
    assert.match(report.cleanupErrors.join('\n'), /pause cleanup failure/)
    if (replace) {
      assert.equal(window.m3Swarm, foreign)
      assert.equal(window.m3TempleRoute, foreign)
      assert.match(report.cleanupErrors.join('\n'), /Temple route API ownership changed/)
      assert.match(report.evidence.cleanupErrors.join('\n'), /Swarm global API ownership changed/)
    } else assert.equal(Object.keys(window).length, 0)
  }
})

// Real QA callers and source validators, supplied DOM only. These model fixture
// assignments and fixed turns never stand in for ordinary browser evidence.
function groundFixture(t) {
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      const resolved = nextResolve(
        /^\/(app|qa|scripts)\//.test(specifier)
          ? new URL(`../..${specifier}`, import.meta.url).href
          : specifier,
        context
      )
      return specifier === '/app/original-rules.json'
        ? { ...resolved, importAttributes: { type: 'json' } }
        : resolved
    },
  })
  const priorWindow = globalThis.window,
    priorDocument = globalThis.document
  t.after(() => {
    hooks.deregister()
    if (priorWindow === undefined) delete globalThis.window
    else globalThis.window = priorWindow
    if (priorDocument === undefined) delete globalThis.document
    else globalThis.document = priorDocument
  })
  const world = finishLevelStart(createWorld(3))
  world.inputMask = 0
  select(world, 'shaman')
  const actor = world.units.find(unit => unit.id === world.selected[0])
  const canvas = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1440, height: 1000 }) }
  const scene = {
    world,
    renderer: { domElement: canvas },
    screen: () => ({ x: 0, y: 0 }),
    pickUnit: () => null,
    pickWorldObject: () => null,
    picking: { pickPerson: () => null },
    gameClock: { beforeTurn() {}, afterTurn() {} },
  }
  globalThis.window = { testSceneRef: { current: scene }, testStore: { getWorld: () => world } }
  globalThis.document = { elementFromPoint: () => canvas }
  const input = createMission1VaultInput({
    page: { evaluate: (fn, arg) => fn(arg) },
    signal: new AbortController().signal,
    report: { actions: [] },
    save() {},
    originalShamanId: actor.id,
  })
  return { world, actor, scene, input }
}

test('actual fixedGround model lookup composes with the Swarm inspector and fails closed', async t => {
  const { world, actor, scene, input } = groundFixture(t)
  const point = { x: 35, z: 77 },
    target = world.units.find(unit => unit.team === 'yellow' && unit.kind === 'brave')
  Object.assign(target, point, { inside: null })
  Object.assign(target.native, nativePosition(world, target))
  world.shots.swarm = 1
  world.mode = 'swarm'
  scene.pick = () => ({ ...point })
  const before = structuredClone(world)
  for (const [spell, model] of [
    ['blast', 2],
    ['bridge', 12],
    ['swarm', 5],
  ]) {
    const hit = await input.fixedGround(point, spell)
    assert.equal(hit.rejection, null, JSON.stringify(hit))
    assert.equal(hit.caster.model, model)
    assert.equal(
      hit.caster.range,
      spellRange(structuredClone(world), structuredClone(actor), model) * 256
    )
    if (spell === 'swarm') {
      assert.equal(hit.spellPreflight, undefined, 'Exercise the actual ground helper shape')
      const expected = await inspectMissionThreeSwarmTarget({
        hit,
        targetId: target.id,
        shamanId: actor.id,
      })
      assert.deepEqual(expected.errors, [])
      assert.deepEqual(expected.point, point)
      assert.deepEqual(expected.caster.native, actor.native)
      assert.equal(expected.caster.x, actor.x)
      assert.equal(expected.caster.z, actor.z)
      const changed = { ...hit, point: { x: point.x + 2, z: point.z } }
      assert.match(
        (
          await inspectMissionThreeSwarmTarget({
            hit: changed,
            targetId: target.id,
            shamanId: actor.id,
          })
        ).errors.join('\n'),
        /Terrain target changed/
      )
      const oldShape = { ...hit, point: undefined, spellPreflight: { point } }
      assert.deepEqual(
        (
          await inspectMissionThreeSwarmTarget({
            hit: oldShape,
            targetId: target.id,
            shamanId: actor.id,
          })
        ).errors,
        []
      )
    }
  }
  await assert.rejects(input.fixedGround(point, 'unsupported'), /Unsupported ground spell/)
  await assert.rejects(input.fixedGround(point, ''), /Unsupported ground spell/)
  scene.pick = () => ({ x: point.x + 2, z: point.z })
  const wrongCell = await input.fixedGround(point, 'swarm')
  assert.notEqual(wrongCell.rejection, null)
  assert.ok(wrongCell.rejectionCounts.wrongCell > 0)
  assert.deepEqual(world, before, 'Source validators may only synchronize detached Worlds')
})

test('captured movement observation closes real native arrival once before Swarm and preserves foreign cleanup', async t => {
  const { world, actor, scene } = groundFixture(t),
    beforeTurn = scene.gameClock.beforeTurn,
    afterTurn = scene.gameClock.afterTurn,
    point = { x: 35, z: 70 }
  assert.equal(command(world, point), true)
  const owner = await installMissionThreeMoveObservation({
    id: actor.id,
    point,
    orderId: actor.native.immediateCommand || actor.native.commands[actor.native.commandCursor],
    order: { ...currentPersonOrder(world.buildingOrders, actor.native) },
    acknowledgedTurn: world.lastOrderTurn,
  })
  for (let turns = 0; !readMissionThreeMoveObservation(owner) && turns < 240; turns++) {
    scene.gameClock.beforeTurn()
    tick(world, 1 / 12)
    scene.gameClock.afterTurn()
  }
  assert.equal(readMissionThreeMoveObservation(owner), true)
  const evidence = closeMissionThreeMoveObservation(owner)
  assert.equal(evidence.restored, true)
  assert.equal(evidence.callbacksRestored, true)
  assert.equal(scene.gameClock.beforeTurn, beforeTurn)
  assert.equal(scene.gameClock.afterTurn, afterTurn)
  assert.throws(() => closeMissionThreeMoveObservation(owner), /ownership changed/)
  let foreignCalls = 0
  window.restoreMission1MoveWitness = () => {
    foreignCalls++
  }
  const report = { cleanupErrors: [], staging: {} },
    outcome = { failed: true, failure: null }
  let disposed = 0
  await cleanupMissionThreeSwarm(
    {
      moveHandle: {
        evaluate: fn => fn(owner),
        dispose: async () => {
          disposed++
        },
      },
      report,
    },
    outcome
  )
  assert.equal(foreignCalls, 0)
  assert.equal(disposed, 1)
  assert.equal(report.staging.observation, undefined, 'Disposal is not restored evidence')
  assert.match(report.cleanupErrors.join('\n'), /foreign API preserved/)
  assert.deepEqual(outcome, { failed: true, failure: null })
})

test('absolute input admission expiry after awaited preparation prevents the next stage', async t => {
  const { actor } = groundFixture(t)
  let now = 100,
    inputs = 0
  t.mock.method(Date, 'now', () => now)
  const input = createMission1VaultInput({
    page: {
      evaluate: async (fn, arg) => {
        const result = await fn(arg)
        now = 200
        return result
      },
      waitForFunction: () => assert.fail('Expired preparation must not reach the next wait'),
      mouse: {
        click: () => {
          inputs++
        },
      },
    },
    signal: new AbortController().signal,
    report: { actions: [] },
    save() {},
    originalShamanId: actor.id,
    deadlineAt: 200,
  })
  await assert.rejects(input.moveGround({ x: 35, z: 70 }), /admission deadline/)
  assert.equal(inputs, 0)
})

test('pixel deadline returns partial diagnostics without resetting the absolute budget', async t => {
  const { actor, scene } = groundFixture(t)
  let now = 100,
    picks = 0
  t.mock.method(Date, 'now', () => now)
  scene.pick = () => {
    if (++picks === 2) now = 200
    return { x: 38, z: 70 }
  }
  const input = createMission1VaultInput({
    page: { evaluate: (fn, arg) => fn(arg) },
    signal: new AbortController().signal,
    report: { actions: [] },
    save() {},
    originalShamanId: actor.id,
    deadlineAt: 200,
  })
  const hit = await input.fixedGround({ x: 35, z: 70 })
  assert.match(hit.rejection, /admission deadline/)
  assert.equal(picks, 2)
  assert.equal(hit.search.deadlineAt, 200)
  assert.equal(hit.search.stopReason, 'deadline')
  assert.equal(hit.search.inspected, 2)
  assert.equal(hit.search.maxCandidates, 8281)
  assert.equal(hit.rejectionCounts.aimPrecision, 1)
  assert.deepEqual(hit.nearestRejectedPoint.point, { x: 38, z: 70 })
  const expired = await input.fixedGround({ x: 35, z: 70 })
  assert.equal(expired.search.inspected, 0)
  assert.equal(expired.search.deadlineAt, 200)
  assert.equal(picks, 2, 'A subsequent probe never receives a renewed budget')
})

test('expiry after the actual dispatch preflight restores its observer without starting input', async t => {
  const { actor, scene } = groundFixture(t),
    report = { actions: [] },
    listeners = new Set()
  let now = 100,
    inputs = 0
  t.mock.method(Date, 'now', () => now)
  scene.pick = () => ({ x: 35, z: 70 })
  scene.renderer.domElement.addEventListener = (_type, listener) => listeners.add(listener)
  scene.renderer.domElement.removeEventListener = (_type, listener) => listeners.delete(listener)
  const input = createMission1VaultInput({
    page: {
      evaluate: async (fn, arg) => {
        const result = await fn(arg)
        if (result?.rejection === null && Number.isInteger(result.turn)) now = 200
        return result
      },
      waitForFunction: async () => {},
      mouse: {
        click: () => {
          inputs++
          throw new Error('Expired input was attempted')
        },
      },
    },
    signal: new AbortController().signal,
    report,
    save() {},
    originalShamanId: actor.id,
    deadlineAt: 200,
  })
  await assert.rejects(
    input.dispatch({ x: 720, y: 500, point: { x: 35, z: 70 } }, 3, [actor.id]),
    /admission deadline/
  )
  assert.equal(inputs, 0)
  assert.equal(listeners.size, 0)
  assert.equal(window.mission1VaultDispatch, undefined)
  assert.equal(
    report.actions.find(action => action.label === 'final-dispatch-preflight').inputAttempted,
    false
  )
  assert.equal(report.actions.filter(action => action.label === 'actual-dispatch').length, 1)
})

test('expired readiness admission leaves the separate ordinary cleanup Pause available', async t => {
  const { actor, world } = groundFixture(t),
    report = { actions: [], cleanupErrors: [] }
  t.mock.method(Date, 'now', () => 200)
  let paused = 0
  const page = {
    evaluate: (fn, arg) => fn(arg),
    waitForFunction: fn => assert.equal(fn(), true),
    getByRole: (_role, { name }) => ({
      click: async () => {
        assert.equal(name, 'Pause game')
        paused++
        world.paused = true
      },
    }),
  }
  const options = {
    page,
    signal: new AbortController().signal,
    report,
    save() {},
    originalShamanId: actor.id,
  }
  const readiness = createMission1VaultInput({ ...options, deadlineAt: 200 })
  await assert.rejects(readiness.button('Select and focus shaman'), /admission deadline/)
  assert.equal(paused, 0)
  const outcome = { failed: true, failure: false }
  await cleanupMissionThreeSwarm({ input: createMission1VaultInput(options), report }, outcome)
  assert.equal(paused, 1)
  assert.deepEqual(report.cleanupErrors, [])
  assert.deepEqual(outcome, { failed: true, failure: false })
})

test('moveGround retains its exhausted partial probe before rejecting without a delivered retry', async t => {
  const { actor, scene } = groundFixture(t),
    report = { actions: [] }
  let now = 100,
    picks = 0,
    inputs = 0
  t.mock.method(Date, 'now', () => now)
  scene.pick = () => {
    if (++picks === 2) now = 200
    return { x: 38, z: 70 }
  }
  const input = createMission1VaultInput({
    page: {
      evaluate: (fn, arg) => fn(arg),
      waitForFunction: async () => {},
      mouse: {
        click: () => {
          inputs++
        },
      },
    },
    signal: new AbortController().signal,
    report,
    save() {},
    originalShamanId: actor.id,
    deadlineAt: 200,
  })
  await assert.rejects(input.moveGround({ x: 35, z: 70 }), /Ground probe admission deadline/)
  const probes = report.actions.filter(action => action.label === 'ordinary-ground-probe')
  assert.equal(probes.length, 1)
  assert.equal(probes[0].hit.search.inspected, 2)
  assert.equal(probes[0].hit.rejectionCounts.aimPrecision, 1)
  assert.equal(probes[0].hit.diagnostics.currentWorldMatches, true)
  assert.equal(inputs, 0)
  assert.equal(
    report.actions.some(action => action.label === 'actual-dispatch'),
    false
  )
})

test('the predeclared ordinary02 point keeps exact movement precision and never adopts a new nearest miss', async t => {
  // Exact retained ordinary02 report SHA bcb3535fa1b1f2fa13d49d2c69795b76970d3dd795f14e29b3336408e147d3f3.
  assert.deepEqual(missionThreeSwarmStagingPoint, {
    x: -31.685820678042944,
    z: -115.69012077842177,
  })
  assert.equal(Object.isFrozen(missionThreeSwarmStagingPoint), true)
  const { actor, scene } = groundFixture(t),
    report = { actions: [] }
  const nearest = { x: missionThreeSwarmStagingPoint.x + 0.5, z: missionThreeSwarmStagingPoint.z }
  scene.pick = () => ({ ...nearest })
  let inputs = 0
  const input = createMission1VaultInput({
    page: {
      evaluate: (fn, arg) => fn(arg),
      waitForFunction: async () => {},
      mouse: {
        click: () => {
          inputs++
        },
      },
    },
    signal: new AbortController().signal,
    report,
    save() {},
    originalShamanId: actor.id,
  })
  await assert.rejects(
    input.moveGround(missionThreeSwarmStagingPoint),
    /No owned empty ground pick/
  )
  const probes = report.actions.filter(action => action.label === 'ordinary-ground-probe')
  assert.equal(probes.length, 1)
  assert.deepEqual(probes[0].hit.target, missionThreeSwarmStagingPoint)
  assert.deepEqual(probes[0].hit.nearestRejectedPoint.point, nearest)
  assert.equal(probes[0].hit.search.stopReason, 'exhausted')
  assert.equal(probes[0].hit.search.inspected, 8281)
  assert.equal(probes[0].hit.rejectionCounts.aimPrecision, 8281)
  assert.equal(inputs, 0)
})

test('actual production FX producer composes with the observer and rejects the wrong parent', async t => {
  // CPU-only supplied World/texture/renderer boundaries. Real Three and the
  // existing TS loader execute unchanged makeFx/animateFx/updateEffectsFrame
  // and renderSceneFrame. This does not establish GPU pixels or ordinary play.
  const { loadSceneFixture } = await import('../../tests/support/bloodlust-scene.mjs')
  const api = await loadSceneFixture()
  const THREE = await import('three')
  const { makeFx, animateFx, updateEffectsFrame } = await import('../../app/scene-effects.ts')
  const originalLoad = THREE.TextureLoader.prototype.load
  const requested = []
  THREE.TextureLoader.prototype.load = function (url, onLoad) {
    requested.push(url)
    const loaded = new THREE.Texture({ src: `http://test${url}`, width: 32, height: 32 })
    queueMicrotask(() => onLoad?.(loaded))
    return loaded
  }
  const f = fixture()
  Object.assign(f.scene, {
    scene: new THREE.Scene(),
    ground: new THREE.Group(),
    objects: new THREE.Group(),
    camera: new THREE.PerspectiveCamera(),
    locate: (group, point, height = 0) => group.position.set(point.x, height, point.z),
    projectileMotion: { position() {} },
    releaseGroup: group => group.traverse(object => object.material?.dispose()),
    view: {
      painter: {},
      prepare(root) {
        assert.equal(root, f.scene.scene)
      },
    },
    worshipPresentation: { rememberBodies() {} },
  })
  f.world.land = { flags: 0 }
  f.scene.scene.add(f.scene.ground)
  f.scene.ground.add(f.scene.objects)
  f.scene.makeFx = effect => makeFx(f.scene, effect)
  f.scene.animateFx = (group, effect) => animateFx(f.scene, group, effect)
  t.after(() => {
    f.observer?.finish()
    for (const group of f.scene.fxMeshes.values()) f.scene.releaseGroup(group)
    THREE.TextureLoader.prototype.load = originalLoad
  })
  f.install()
  f.release()
  f.arrival()
  f.respond(false)
  const effect = f.world.effects[0]
  effect.swarm.insects = Array.from({ length: 60 }, (_, index) => ({
    x: effect.swarm.x + index,
    y: effect.swarm.y,
    h: effect.swarm.h + 1,
  }))
  updateEffectsFrame(f.scene)
  const group = f.scene.fxMeshes.get(effect.id)
  assert.equal(group.parent, f.scene.ground)
  assert.notEqual(group.parent, f.scene.objects)
  assert.equal(group.children.length, 60)
  assert.ok(group.children.every(sprite => sprite instanceof THREE.Sprite))
  assert.deepEqual(requested, ['/original/insect.png'])
  const render = () => api.renderSceneFrame(f.scene, null, undefined)
  // Wrong-parent negative uses the real producer's group, not a handcrafted mesh.
  f.scene.objects.add(group)
  render()
  assert.equal(f.observer.evidence.frames.length, 0)
  f.scene.ground.add(group)
  render()
  f.step(() => effect.swarm.remaining--)
  updateEffectsFrame(f.scene)
  render()
  const evidence = f.observer.finish()
  assert.equal(evidence.frames.length, 2)
  assert.equal(evidence.renderObservation.rejections['wrong-parent'].count, 1)
  assert.equal(evidence.renderObservation.rejections['wrong-parent'].first.parent, 'objects')
  assert.ok(evidence.frames.every(frame => frame.visibleInsects === 60))
  assert.ok(
    f.calls
      .filter(call => call.key === 'render')
      .every(call => call.args[0] === f.scene.scene && call.args[1] === f.scene.camera)
  )
  assert.deepEqual(evidence.errors, [])
  assertMissionThreeSwarmEvidence(evidence)
})

test('render rejections keep one detached sample per reason and preserve original render calls', () => {
  const f = fixture()
  f.install()
  f.release()
  f.arrival()
  f.respond()
  const group = f.scene.fxMeshes.get(20)
  group.parent = f.scene.objects
  for (let count = 0; count < 8; count++) f.render()
  const rejected = f.observer.evidence.renderObservation.rejections['wrong-parent']
  assert.equal(rejected.count, 8)
  assert.equal(rejected.first.parent, 'objects')
  assert.equal(Object.keys(rejected).length, 2)
  group.parent = f.scene.ground
  assert.equal(rejected.first.parent, 'objects', 'Retained diagnostics are detached scalar data')
  group.children[0].material.map.image.width = 0
  f.render()
  assert.equal(f.observer.evidence.renderObservation.rejections['texture-not-ready'].count, 1)
  group.children[0].material.map.image.width = 32
  assert.equal(f.scene.renderer.render(f.scene.scene, {}), 'render-result')
  const evidence = f.observer.finish()
  assert.equal(evidence.frames.length, 0)
  assert.match(evidence.errors.join('\n'), /render scene\/camera changed/)
  assert.equal(evidence.renderObservation.rejections['render-owner'].count, 1)
  assert.equal(f.calls.filter(call => call.key === 'render').length, 10)
})
