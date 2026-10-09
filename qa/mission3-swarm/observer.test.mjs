// Supplied event/clock/renderer boundaries only. These are not game/browser runs.
import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import missionThreeSwarm from '../../scripts/local-render/mission3-swarm.mjs'
import {
  attachMissionThreeSwarmObservation, assertMissionThreeSwarmCast,
  assertMissionThreeSwarmEvidence, swarmCandidate, installMissionThreeSwarmObservation,
  finishMissionThreeSwarmObservation,
} from '../../scripts/local-render/mission3-swarm-witness.mjs'

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII='
function fixture() {
  const expected = { shamanId: 1, targetId: 2, impact: { x: 1, z: -1 }, impactNative: { x: 2304, y: 63744 } }
  const target = { id: 2, kind: 'brave', team: 'yellow', hp: 50, x: 1, z: -1, inside: null, lift: 0,
    native: { id: 2, model: 2, tribe: 2, state: 17, previousState: 17, x: 2304, y: 63744,
      h: 100, flags2: 0, flags3: 0, flags4: 0, life: 1000, damageAttacker: 255, vehicle: 0 } }
  const shaman = { id: 1, kind: 'shaman', team: 'blue', hp: 100, x: 0, z: 0 }
  const world = { turn: 0, time: 0, paused: false, status: 'playing', speed: 1, inputMask: 0,
    levelFlags2: 0, stats: { cast: 0 }, shots: { swarm: 1 }, giftCounts: { swarm: 0 }, mode: 'swarm',
    selected: [1], units: [shaman, target], effects: [], projectiles: [], sounds: [], soundSerial: 0,
    manaTribes: Array.from({ length: 4 }, () => ({ available: 0, mana: 100 })),
    manaWorld: { gameFlags: 0, spells: Array.from({ length: 4 }, (_, tribe) => ({
      stocks: Array.from({ length: 22 }, (_, model) => tribe === 0 && model === 5 ? 1 : 0),
    })) } }
  const listeners = { before: [], after: [] }, calls = []
  const canvas = { isConnected: true, width: 1, height: 1, toDataURL: () => png,
    addEventListener(type, fn, capture) { assert.equal(type, 'pointerup'); listeners[capture ? 'before' : 'after'].push(fn) },
    removeEventListener(_type, fn, capture) {
      const array = listeners[capture ? 'before' : 'after']; array.splice(array.indexOf(fn), 1)
    } }
  const scene = { world, objects: {}, fxMeshes: new Map(), gameClock: { animationFrame: 0,
    beforeTurn(...args) { calls.push({ key: 'before', receiver: this, args }); return 'before-result' },
    afterTurn(...args) { calls.push({ key: 'after', receiver: this, args }); return 'after-result' } },
    renderer: { domElement: canvas, info: { render: { frame: 0 } },
      render(...args) { calls.push({ key: 'render', receiver: this, args }); this.info.render.frame++; return 'render-result' } } }
  let stored = world
  const store = { getWorld: () => stored }, originals = { before: scene.gameClock.beforeTurn,
    after: scene.gameClock.afterTurn, render: scene.renderer.render }
  let observer
  const install = () => observer = attachMissionThreeSwarmObservation(scene, store, expected)
  const release = (trusted = true) => {
    const event = { isTrusted: trusted, button: 0, target: canvas }
    listeners.before.forEach(fn => fn(event))
    world.projectiles.push({ id: 10, caster: 1, team: 'blue', spell: 'swarm', target: { x: 1, z: -1 },
      destination: { x: 2304, y: -1792, h: 100 }, phase: 'windup', remaining: 6, turns: 0, visuals: [] })
    world.shots.swarm--; world.manaWorld.spells[0].stocks[5]--; world.stats.cast++; world.mode = null
    listeners.after.forEach(fn => fn(event))
  }
  const step = change => {
    assert.equal(scene.gameClock.beforeTurn('before-argument'), 'before-result')
    world.turn++; world.time = world.turn / 12; scene.gameClock.animationFrame += 2
    change?.()
    assert.equal(scene.gameClock.afterTurn('after-argument'), 'after-result')
  }
  const arrival = (remaining = 200) => step(() => {
    world.projectiles = world.projectiles.filter(p => p.id !== 10)
    world.effects.push({ id: 20, kind: 'swarm', x: 1, z: -1,
      swarm: { tribe: 0, phase: 'initializing', remaining, insects: [], x: 2304, y: 63744, h: 200,
        origin: { ...expected.impactNative } } })
    world.sounds.push({ serial: ++world.soundSerial, cue: 0xa4, x: 1, z: -1 })
  })
  const respond = () => step(() => {
    Object.assign(world.effects[0].swarm, { phase: 'wandering', remaining: 199, insects: Array(60).fill({}) })
    target.hp = 45.2; target.native.state = 26; target.native.damageAttacker = 0
    scene.fxMeshes.set(20, { name: 'swarm-insects', visible: true, parent: scene.objects,
      children: Array.from({ length: 60 }, () => ({ name: 'swarm-insect', visible: true,
        userData: { nativePrimitive: 0x11, nativeSize: 7 }, position: { x: 0, y: 0, z: 0 }, scale: { x: 14, y: 14 },
        material: { map: { image: { width: 32, height: 32, src: 'http://test/original/insect.png' } } } })) })
  })
  const render = () => assert.equal(scene.renderer.render(scene.objects, 'camera'), 'render-result')
  const twoFrames = () => { render(); step(() => world.effects[0].swarm.remaining--); render() }
  const delivered = () => ({ before: { mode: 'swarm', turn: 0, stock: 1, gifts: 0, projectiles: [] },
    after: { mode: null, turn: 0, stock: 0, gifts: 0, projectiles: [{ id: 10, caster: 1, spell: 'swarm',
      target: { x: 1, z: -1 }, destination: { x: 2304, y: -1792, h: 100 }, phase: 'windup', remaining: 6, turns: 0, visuals: [] }] },
    pointer: { restored: true, errors: [], events: [{ type: 'pointerup', trusted: true, canvasOwned: true, canvasTarget: true,
      args: { clientX: 20, clientY: 30 }, picks: [{ owner: 'scene', name: 'pick', receiverMatches: true,
        args: { clientX: 20, clientY: 30 }, point: { x: 1.2, z: -1.3 } }] }] } })
  return { world, scene, store, target, expected, calls, listeners, originals, install, release, step, arrival, respond,
    render, twoFrames, delivered, replaceWorld: () => stored = structuredClone(world), get observer() { return observer } }
}

test('candidate observation is read-only and rejects relevant response complications', () => {
  const f = fixture(), original = structuredClone(f.world)
  assert.equal(swarmCandidate(f.world, f.target).eligible, true)
  assert.deepEqual(f.world, original)
  for (const mutate of [u => u.inside = 4, u => u.hp = 0, u => u.native.state = 23, u => u.native.state = 26,
    u => u.native.flags2 = 0x800000, u => u.native.flags2 = 0x100000, u => u.native.flags3 = 0x8000,
    u => u.native.flags3 = 0x80000, u => u.native.flags4 = 0x800, u => u.native = null, u => u.native.vehicle = 6]) {
    const target = structuredClone(f.target); mutate(target)
    assert.equal(swarmCandidate(f.world, target).eligible, false)
  }
})

test('composed input, natural callback and evidence contracts retain200→199, net-health response and real frame boundaries', () => {
  const f = fixture(); f.install(); f.release()
  assert.equal(assertMissionThreeSwarmCast(f.delivered(), f.observer.evidence, f.expected).projectileId, 10)
  f.arrival(); f.respond(); f.twoFrames()
  const e = f.observer.finish(), proof = assertMissionThreeSwarmEvidence(e)
  assert.equal(e.arrival.swarm.remaining, 200); assert.equal(e.arrival.swarm.insects, 0)
  assert.equal(e.firstVisit.after.swarm.remaining, 199); assert.equal(e.firstVisit.after.swarm.insects, 60)
  assert.equal(e.response.after.target.hp, 45.2, 'Healing-offset net response is allowed without a leaf−5 claim')
  assert.match(proof.visiblePixels, /Pending independent inspection/)
  assert.equal(f.scene.gameClock.beforeTurn, f.originals.before); assert.equal(f.scene.gameClock.afterTurn, f.originals.after)
  assert.equal(f.scene.renderer.render, f.originals.render)
  assert.deepEqual(f.listeners, { before: [], after: [] })
  for (const call of f.calls) assert.equal(call.receiver, call.key === 'render' ? f.scene.renderer : f.scene.gameClock)
  assert.deepEqual(f.calls.find(c => c.key === 'render').args, [f.scene.objects, 'camera'])
})

test('a cast receipt cannot accept wrong terrain, owner, phase, payment or pointer evidence', () => {
  const f = fixture(); f.install(); f.release()
  for (const mutate of [
    d => d.after.stock = 1, d => d.after.gifts = 1, d => d.after.turn++, d => d.after.projectiles[0].caster = 7,
    d => d.after.projectiles[0].remaining = 5, d => d.after.projectiles[0].destination.x++,
    d => d.after.projectiles[0].target.x += 2, d => d.pointer.events[0].trusted = false,
    d => d.pointer.events[0].picks[0].receiverMatches = false, d => d.pointer.events[0].picks[0].point.x += 2,
    d => d.pointer.events[0].picks = [], d => d.pointer.restored = false,
  ]) {
    const receipt = f.delivered(); mutate(receipt)
    assert.throws(() => assertMissionThreeSwarmCast(receipt, f.observer.evidence, f.expected))
  }
  f.observer.evidence.cast.after.mana[1].available--
  assert.throws(() => assertMissionThreeSwarmCast(f.delivered(), f.observer.evidence, f.expected), /mana/)
  f.observer.finish()
})

test('competing response leaves attribution unmet despite matching panic and health', () => {
  const f = fixture(); f.install(); f.release(); f.arrival()
  f.world.projectiles.push({ id: 99, spell: 'blast' }); f.respond(); f.twoFrames()
  const e = f.observer.finish()
  assert.equal(e.scans[0].expectedEligible, true); assert.equal(e.scans[0].uncontested, false)
  assert.equal(e.response, null); assert.throws(() => assertMissionThreeSwarmEvidence(e), /incomplete/)
})

test('untrusted release and missed initial controller are retained failures', () => {
  const untrusted = fixture(); untrusted.install(); untrusted.release(false)
  assert.match(untrusted.observer.finish().errors.join('\n'), /Invalid cast boundary/)
  const missed = fixture(); missed.install(); missed.release(); missed.arrival(199)
  assert.match(missed.observer.finish().errors.join('\n'), /Missed or mismatched/)
})

test('passive observation errors never prevent the original callback or mask its throw', () => {
  const f = fixture(); f.install(); f.release(); f.target.native.model = 999
  assert.equal(f.scene.gameClock.beforeTurn('still-runs'), 'before-result')
  assert.equal(f.calls.at(-1).args[0], 'still-runs'); assert.ok(f.observer.evidence.errors.length)
  f.observer.finish()
  const thrown = fixture(), error = new Error('original callback error')
  thrown.scene.gameClock.beforeTurn = () => { throw error }
  thrown.install(); assert.throws(() => thrown.scene.gameClock.beforeTurn(), actual => actual === error)
  assert.match(thrown.observer.finish().errors.join('\n'), /original callback error/)
})

test('stale renderer frame and wrong texture cannot become natural insect frames', () => {
  const stale = fixture(); stale.scene.renderer.render = () => 'render-result'
  stale.install(); stale.release(); stale.arrival(); stale.respond(); stale.render()
  assert.match(stale.observer.finish().errors.join('\n'), /No fresh natural GPU/)
  const wrong = fixture(); wrong.install(); wrong.release(); wrong.arrival(); wrong.respond()
  wrong.scene.fxMeshes.get(20).children[0].material.map.image.src = 'http://test/original/smoke.png'
  wrong.render(); const e = wrong.observer.finish()
  assert.match(e.errors.join('\n'), /Wrong natural/); assert.equal(e.frames.length, 0)
})

test('world replacement, changed callback owner and partial installation retain cleanup boundaries', () => {
  const f = fixture(); f.install(); f.replaceWorld()
  assert.equal(f.scene.gameClock.afterTurn(), 'after-result')
  const e = f.observer.finish(); assert.match(e.errors.join('\n'), /ownership changed/)
  assert.equal(f.scene.renderer.render, f.originals.render)
  const replaced = fixture(); replaced.install(); const replacement = () => {}
  replaced.scene.renderer.render = replacement
  assert.equal(replaced.observer.finish().restored, false)
  assert.equal(replaced.scene.renderer.render, replacement, 'Do not overwrite a later callback owner')
  const partial = fixture(); delete partial.scene.gameClock.afterTurn
  assert.throws(() => partial.install(), /Missing Swarm callback/)
  assert.equal(partial.scene.gameClock.beforeTurn, partial.originals.before)
  assert.deepEqual(partial.listeners, { before: [], after: [] })
})

test('installed API is retained before first read, detects current Scene replacement and preserves foreign global cleanup owner', t => {
  const f = fixture(), prior = globalThis.window
  globalThis.window = { testSceneRef: { current: f.scene }, testStore: f.store }
  t.after(() => { if (prior === undefined) delete globalThis.window; else globalThis.window = prior })
  const api = installMissionThreeSwarmObservation(f.expected)
  assert.equal(window.m3Swarm, api)
  window.testSceneRef.current = { ...f.scene }
  assert.throws(() => api.status(), /ownership changed/)
  const foreign = { finish() { assert.fail('Must not invoke the foreign observer') } }
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
      let caught = Symbol('not-thrown'), starts = 0
      try {
        await missionThreeSwarm({ page: {}, output: destination, signal: new AbortController().signal,
          receipt: { source: 'supplied-host-boundary', profile: { mode: 'created', checkpointAtStart: null } },
          openMission: async () => { starts++; throw error } })
      } catch (actual) { caught = actual }
      assert.equal(caught, error); assert.equal(starts, 1, 'Never repeat the uncertain initial action')
    }
    assert.equal(JSON.parse(readFileSync(join(output, 'mission3-swarm.json'), 'utf8')).status, 'failed')
  }
})
