// One supplied-port Mission1 feasibility trace. No browser/original execution.
// Only normal startup, shipped Skip body, public model selection/commands/casts and tick mutate World.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const root = resolve(process.argv[2]), load = path => import(pathToFileURL(resolve(root, path)).href)
const { createWorld, tick, command, cast, setSelection, spellTargetError, spellRange } = await load('app/model.ts')
const { campaignShamanReadiness } = await load('scripts/campaign-start-readiness.mjs')
const { currentPersonOrder, personReachedOrder } = await load('app/person-orders.ts')
const { positionDistance } = await load('app/native-math.ts')
const { browserPosition } = await load('app/world-coordinates.ts')
const { interruptFlyby } = await load('app/flyby.ts')
const w = createWorld(1), owner = u => u?.flight ?? u?.fight?.motion ?? u?.native ?? u?.entry?.person ?? u?.builder?.person
const short = x => (x << 16) >> 16, xyz = p => p && ({ x: short(p.x), y: short(p.y), h: short(p.h) })
const actor = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
const guards = w.units.filter(u => u.team === 'red' && u.kind === 'brave' && u.x === -9 && u.z === -3), target = guards[0]
const report = { method: 'Supplied-port model only: one authored M1 World, real Bridge reward/route, one closer public ground destination and at most one direct-person Blast exactly six normal turns after the first qualifying original-guard automatic ground-response displacement, observed during the approach or its bounded following window. No pixels, ordinary-input or original-execution claim.',
  bounds: { worlds: 1, setupTurns: 1800, responseWindowTurns: 48, secondLifecycleTurns: 48, bridgeCasts: 1, blastCasts: 1, releaseDelayTurns: 6 }, timing: { derivation: "Retained browser probe03 preparation949 to first draw953 to fresh admission955 spans six actual logical turns;189.3ms preparation-to-draw is four of those turns. This chosen model budget is not an observed release latency or proof of prewarmed hover." }, stages: [], responseWindow: [], lifecycle: [], setupTail: [], status: 'running' }
const person = u => {
  const p = owner(u), order = p && currentPersonOrder(w.buildingOrders, p)
  return { id: u?.id, same: !!u && w.units.includes(u) && w.units.find(v => v.id === u.id) === u, team: u?.team, kind: u?.kind, hp: u?.hp, inside: u?.inside,
    x: u?.x, z: u?.z, lift: u?.lift, flying: !!u?.flight, fighting: !!u?.fight,
    ownerValid: !!p && w.objectCells.objects.get(u.id) === p && p.class === 1 && !(p.flags2 & 1), position: xyz(p),
    native: p && { class: p.class, model: p.model, flags3: p.flags3, assignment: p.assignment, counter: p.counter, commandStatus: p.commandStatus, commandPhase: p.commandPhase, vehicle: p.vehicle, state: p.state, substate: p.substate, speed: p.speed, flags2: p.flags2, flags4: p.flags4, life: p.life, velocity: p.velocity && { ...p.velocity } },
    order: order ? { model: order.model, flags: order.flags, a: order.a, b: order.b, object: order.object } : null }
}
const shot = p => p && ({ id: p.id, caster: p.caster, phase: p.phase, remaining: p.remaining, target: { ...p.target }, destination: { ...p.destination }, tracking: p.blastTarget ? structuredClone(p.blastTarget) : null, visuals: p.visuals.map(v => v.id) })
const sample = tracked => ({ turn: w.turn, actor: person(actor), target: person(target), selected: [...w.selected], cooldown: w.castingTribes[0].cooldown,
  casting: { cooldown: w.castingTribes[0].cooldown, aiCooldown: w.castingTribes[0].aiCooldown, flags: w.castingTribes[0].flags, playerType: w.manaTribes[0].playerType },
  gameFlags: w.manaWorld.gameFlags, levelFlags2: w.levelFlags2, inputMask: w.inputMask,
  stock: { blast: w.shots.blast, bridge: w.shots.bridge }, castCount: w.stats.cast, random: w.randomState,
  shot: tracked && w.projectiles.includes(tracked) ? shot(tracked) : null,
  effects: w.effects.filter(e => e.kind === 'blast' || e.kind === 'blastWave').map(e => ({ id: e.id, kind: e.kind, point: { x: e.x, z: e.z } })) })
const healthy = () => {
  assert.equal(w.status, 'playing'); assert.equal(w.paused, false); assert.equal(w.speed, 1)
  assert.ok(w.units.includes(actor) && actor.hp > 0, 'Original Shaman was lost')
}
const advance = setup => {
  if (setup) assert.ok(w.turn < 1800, 'Shared finite setup bound reached')
  const before = w.turn; tick(w, 1 / 12); assert.equal(w.turn, before + 1, 'Normal tick stopped advancing'); healthy()
  if (setup) { report.setupTail.push(sample()); if (report.setupTail.length > 16) report.setupTail.shift() }
}
const setupUntil = predicate => { for (let attempts = 0; attempts <= 1800; attempts++) { if (predicate()) return; advance(true) } throw Error('Finite setup attempts exhausted') }
const checkpoint = name => { const value = sample(); report.stages.push({ name, ...value }); return value }
function move(name, point, observe) {
  setSelection(w, [actor.id]); assert.equal(command(w, point), true, `${name} command rejected`)
  const p = actor.native, order = p && currentPersonOrder(w.buildingOrders, p), saved = order && { ...order }
  assert.equal(order?.model, 3); checkpoint(`${name}-accepted`)
  for (let attempts = 0; attempts < 1800; attempts++) {
    assert.equal(actor.native, p, 'Original movement owner changed')
    assert.equal(currentPersonOrder(w.buildingOrders, p), order, 'Movement order changed before completion')
    const before = sample(); advance(true)
    observe?.()
    const next = currentPersonOrder(w.buildingOrders, p)
    if (!next) {
      assert.ok(personReachedOrder(p, saved, () => { throw Error('Unexpected vehicle arrival') }), 'Public route ended outside native arrival')
      const completion = { speed: p.speed, path: actor.path.map(point => ({ ...point })), pathfinding: w.pathfinding.people.has(actor.id) }
      report.stages.push({ name: `${name}-completed`, before, after: sample(), requested: { ...point }, order: saved, completion }); return
    }
  }
  throw Error(`${name} movement did not complete within setup bound`)
}
const eligibility = () => {
  const actual = sample(), p = owner(actor), t = owner(target), copy = structuredClone(w), copiedTarget = copy.units.find(u => u.id === target.id), copiedActor = copy.units.find(u => u.id === actor.id)
  return { ...actual, nativeDistance: p && t ? positionDistance(p, t) : null,
    nativeRange: copiedActor ? spellRange(copy, copiedActor, 2) * 256 : null,
    targetError: copiedTarget ? spellTargetError(copy, 'blast', copiedTarget) : { code: -1, message: 'missing original target' } }
}
try {
  assert.ok(actor && guards.length === 1, 'Exact authored Shaman and isolated Red guard required')
  report.opening = sample()
  // Model ticks do not advance the scene-owned flyby. Compose exactly the shipped
  // Skip callback once during warmup; this is no browser/render/input witness.
  const cameraSource = readFileSync(resolve(root, 'app/scene-camera-runtime.ts'), 'utf8')
  const declarations = [...cameraSource.matchAll(/export function skipIntroduction\(scene: GameScene\) \{\n[^]*?\n\}/g)]
  assert.equal(declarations.length, 1, 'One exact shipped Skip declaration required')
  const skipSource = declarations[0][0], skipJavaScript = skipSource.replace('export ', '').replace('(scene: GameScene)', '(scene)')
  const skipIntroduction = new Function('interruptFlyby', `${skipJavaScript}; return skipIntroduction`)(interruptFlyby)
  const sceneSource = readFileSync(resolve(root, 'app/scene.ts'), 'utf8')
  assert.ok(sceneSource.includes('flybyCamera: FlybyCamera = { x: 17 * 256, y: -41 * 256, angle: 0, zoom: 0 }'))
  let notifications = 0
  const skipScene = { world: w, flybyCamera: { x: 17 * 256, y: -41 * 256, angle: 0, zoom: 0 }, onChange: () => { notifications++ } }
  setupUntil(() => !!(w.flyby.flags & 1))
  const skipState = () => ({ turn: w.turn, flyby: structuredClone(w.flyby), inputMask: w.inputMask,
    camera: { ...skipScene.flybyCamera }, notifications, readiness: campaignShamanReadiness(w) })
  report.startupSkip = { sourceSha256: createHash('sha256').update(skipSource).digest('hex'),
    transform: 'Remove export and the sole GameScene parameter annotation; function body unchanged.',
    facade: 'Real World and counted notification; default camera only for the warmup branch, which consumes zoom alone.', before: skipState() }
  assert.equal(w.flyby.flags & 17, 17, 'Actual active interruptible introduction required')
  assert.ok(w.flyby.warmup > 0, 'Only the actual warmup Skip branch is composed')
  skipIntroduction(skipScene)
  report.startupSkip.after = skipState()
  assert.equal(w.flyby.flags, report.startupSkip.before.flyby.flags & ~1)
  assert.equal(w.inputMask, report.startupSkip.before.inputMask & ~64)
  assert.equal(skipScene.flybyCamera.zoom, 0); assert.equal(notifications, 1)
  setupUntil(() => campaignShamanReadiness(w).ready)
  assert.equal(w.manaWorld.gameFlags & 32, 0, 'Normal bit-clear input mode required')
  checkpoint('startup-ready')
  const head = w.shrines.find(h => h.reward === 'bridge')
  assert.ok(head); setSelection(w, [actor.id]); assert.equal(command(w, head), true)
  assert.equal(currentPersonOrder(w.buildingOrders, owner(actor))?.model, 27); checkpoint('Bridge-worship-accepted')
  setupUntil(() => w.shots.bridge > 0 && head.uses > 0)
  checkpoint('Bridge-earned')
  move('shore', { x: 0.5364537425122649, z: 18.977568311417315 })
  const bridges = w.stats.bridges, bridgePoint = { x: 0.010848777773901475, z: 3.984387496088175 }
  assert.equal(cast(w, 'bridge', bridgePoint), true); checkpoint('Bridge-cast')
  setupUntil(() => w.stats.bridges > bridges && !w.effects.some(e => e.bridge) && !w.projectiles.some(p => p.spell === 'bridge'))
  checkpoint('Bridge-completed')
  move('crossing', { x: 0.21929532594742795, z: 3.582267446467881 })
  let previous = person(target), selected
  const observeResponse = () => {
    const observed = eligibility(), p = observed.target.position, old = previous.position
    observed.moving = !!(p && old && (p.x !== old.x || p.y !== old.y))
    observed.groundResponse = observed.target.order?.model === 21 && !observed.target.flying
    report.responseWindow.push(observed); previous = observed.target
    if (!selected && observed.target.same && observed.target.hp > 0 && observed.target.ownerValid && observed.target.inside === null &&
        observed.groundResponse && observed.moving && observed.targetError === null && observed.stock.blast > 0 &&
        !w.projectiles.some(p => p.team === 'blue' && p.spell === 'blast')) {
      selected = observed
      report.trigger = selected
      report.timing.releaseTurn = selected.turn + report.bounds.releaseDelayTurns
    }
    return observed
  }
  // Observe the real approach while it runs; this callback only takes detached
  // snapshots and invokes source validators on a cloned World. It sends no input.
  move('guard-approach', { x: -5.1, z: 0.9 }, observeResponse)
  assert.ok(w.units.includes(target) && target.hp > 0 && target.team === 'red')
  report.approach = sample()
  for (let attempts = 0; !selected && attempts < 48; attempts++) {
    advance(false); observeResponse()
    if (!w.units.includes(target) || target.hp <= 0) break
  }
  assert.ok(selected, 'No cast-ready living original-target automatic ground-response motion/range overlap within the approach and48 following turns')
  assert.ok(w.turn <= report.timing.releaseTurn, 'Approach completed after the single prescribed release turn; no late retry')
  while (w.turn < report.timing.releaseTurn) { advance(false); observeResponse() }
  const delivery = report.responseWindow.at(-1)
  report.timing.delivery = delivery
  assert.equal(delivery.turn, selected.turn + 6)
  assert.ok(delivery.target.same && delivery.target.hp > 0 && delivery.target.ownerValid && delivery.target.inside === null &&
    delivery.groundResponse && delivery.moving && delivery.targetError === null && delivery.stock.blast > 0 &&
    !w.projectiles.some(p => p.team === 'blue' && p.spell === 'blast'), 'The one delayed release lost original-target motion, range, readiness or identity')
  const stock = w.shots.blast, castCount = w.stats.cast
  assert.equal(cast(w, 'blast', target, target.id), true, 'The single prescribed delayed direct enemy model cast rejected')
  const tracked = w.projectiles.find(p => p.team === 'blue' && p.spell === 'blast')
  assert.ok(tracked && tracked.blastTarget?.personId === target.id && tracked.caster === actor.id)
  assert.equal(w.shots.blast, stock - 1); assert.equal(w.stats.cast, castCount + 1)
  report.second = sample(tracked)
  let windupMotion = false, flightMotion = false, arrival, impact
  for (let attempts = 0; attempts < 48; attempts++) {
    const before = sample(tracked); advance(false); const after = sample(tracked)
    report.lifecycle.push({ before, after })
    assert.deepEqual(after.actor.position, report.second.actor.position, 'Caster moved during the second cast')
    assert.equal(after.castCount, report.second.castCount)
    assert.ok(before.target.same && before.target.ownerValid && before.target.position)
    const moved = after.target.position && (before.target.position.x !== after.target.position.x || before.target.position.y !== after.target.position.y)
    if (before.shot.phase === 'windup') windupMotion ||= !!moved
    if (before.shot.phase === 'flying') flightMotion ||= !!moved
    if (after.shot) {
      assert.equal(after.shot.id, tracked.id); assert.equal(after.shot.tracking.personId, target.id)
      assert.deepEqual(after.shot.tracking.destination, before.target.position)
      if (after.shot.phase !== 'windup') { assert.equal(after.shot.tracking.shotPersonId, target.id); assert.deepEqual(after.shot.destination, before.target.position) }
      if (after.shot.phase === 'arrived') { assert.equal(arrival, undefined); arrival = after.turn }
    } else {
      assert.equal(before.shot.phase, 'arrived'); assert.equal(arrival, before.turn)
      const effects = after.effects.filter(e => !before.effects.some(old => old.id === e.id)), point = browserPosition(before.target.position)
      const wave = effects.filter(e => e.kind === 'blastWave'), flash = effects.filter(e => e.kind === 'blast')
      assert.equal(wave.length, 1); assert.equal(flash.length, 1); assert.deepEqual(wave[0].point, point); assert.deepEqual(flash[0].point, point)
      impact = { turn: after.turn, point, wave: wave[0].id, flash: flash[0].id }; break
    }
  }
  report.motion = { windupMotion, flightMotion, arrival, impact }
  assert.ok(windupMotion && flightMotion && arrival && impact, 'Second actual cast lacks required moving-target lifecycle')
  report.status = 'passed'
} catch (error) {
  report.status = 'failed'; report.failure = String(error.stack ?? error); process.exitCode = 1
} finally {
  report.terminal = sample(); console.log(JSON.stringify(report, null, 2))
}
