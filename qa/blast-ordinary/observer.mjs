import { createBlastEpisode } from './contract.mjs'
import { captureRenderedCanvas } from './frame-capture.mjs'
import { createBlastAdmission } from './preparation.mjs'
import { captureBlastReleaseRange, readBlastReleasePixel, recordBlastRelease, observeBlastTurn } from './setup-observer.mjs'
import { spellTargetError } from '../../app/live-command.ts'
import { currentPersonOrder } from '../../app/person-orders.ts'
import { observeEntityPointer, entityInputState } from '../erosion-ordinary/input.mjs'

const short = n => (n << 16) >> 16
const position = p => ({ x: short(p.x), y: short(p.y), h: short(p.h) })
const owner = u => u?.flight ?? u?.fight?.motion ?? u?.native ?? u?.entry?.person ?? u?.builder?.person
const visible = object => {
  if (!object) return false
  for (let current = object; current; current = current.parent) if (!current.visible) return false
  let material = false
  object.traverse(child => { if (child.visible && child.material && (child.material.opacity ?? 1) > 0) material = true })
  return material
}
export const inputContext = scene => ({
  level: scene.world.outcome.level, flags: scene.world.manaWorld.gameFlags, mask: scene.world.inputMask,
  camera: { ...scene.cameraPosition }, view: { ...scene.viewPoint }, bearing: scene.cameraBearing,
  width: scene.container.clientWidth, height: scene.container.clientHeight,
})
export function responseSnapshot(scene, original = window.blastOriginal) {
  const w = scene.world
  return w.units.filter(u => u === original.target && u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && u.inside === null).flatMap(u => {
    const p = owner(u), order = p && currentPersonOrder(w.buildingOrders, p)
    return p?.class === 1 && p === original.movePerson && !(p.flags2 & 1) ? [{ id: u.id, x: u.x, z: u.z, position: position(p), speed: p.speed, orderModel: order?.model ?? null, idle: p.speed === 0 && (!order || !!(order.flags & 1)), fighting: !!u.fight }] : []
  })
}
export function pointerFeedback(scene) {
  const style = getComputedStyle(scene.pointerOutline), pathStyle = getComputedStyle(scene.pointerPath)
  const path = scene.pointerPath.getAttribute('d') ?? '', opacity = Number(scene.pointerPath.getAttribute('stroke-opacity') ?? 1)
  return { turn: scene.world.turn, targetId: scene.hoveredObject,
    visible: style.display !== 'none' && style.visibility !== 'hidden' && pathStyle.visibility !== 'hidden' && opacity > 0 && !!path,
    lines: (path.match(/M/g) ?? []).length, path, opacity, context: inputContext(scene) }
}

export function blastPersonSnapshot(world, u, target, movementOrder) {
  const p = owner(u), registered = world.objectCells.objects.get(u.id), order = p && currentPersonOrder(world.buildingOrders, p)
  return { id: u.id, same: world.units.includes(u), team: u.team, kind: u.kind, hp: u.hp, inside: u.inside,
    ownerValid: !!p && registered === p && p.class === 1 && !(p.flags2 & 1), position: p ? position(p) : null,
    orderModel: order?.model, movementOrderSame: u !== target || !movementOrder || !!p && order === movementOrder, speed: p?.speed, state: p?.state }
}

// Hooks invoke the original method once, with the same receiver and arguments.
// No game, clock, renderer, person, command, stock or storage setter is used.
export function observeBlastEpisode(scene, options) {
  const world = scene.world, actor = world.units.find(u => u.id === options.actorId), target = world.units.find(u => u.id === options.targetId)
  if (!actor || !target || world.projectiles.some(p => p.team === 'blue' && p.spell === 'blast')) throw Error('Fresh actor, target and empty Blue Blast lifecycle required')
  const enemy = options.phenotype === 'm1-enemy', groundEnemy = enemy && options.enemySetup === 'ground-response'
  const evidence = createBlastEpisode(options), artifacts = {}, wrappers = [], pending = new Set(), admission = createBlastAdmission()
  let enemyArmed = false, primerShot, approachOwner, approachOrder, deferredHover, priorEnemy, latestEnemy
  let shot, delivered = false, eventBefore, inputBefore, pressBefore, pointer, disposed = false, moveExpected, moveOwner, movementDelivered = false, movementOrder, plannedGround, deferredAck, hudFrame, movementAttempted = false
  const sameScene = () => window.testSceneRef.current === scene && window.testStore.getWorld() === world && scene.world === world && scene.renderer.domElement.isConnected
  const person = u => blastPersonSnapshot(world, u, target, movementOrder)
  const deliveryContext = state => Object.fromEntries(['turn', 'frame', 'animationFrame', 'currentSceneMatches', 'currentWorldMatches',
    'rect', 'camera', 'center', 'rawCenter', 'projection'].map(key => [key, state[key]]))
  const sample = () => ({ turn: world.turn, level: world.outcome.level, playing: world.status === 'playing', paused: world.paused,
    speed: world.speed, flags: world.manaWorld.gameFlags, sceneMatches: sameScene(), actor: person(actor), target: person(target),
    stock: world.shots.blast, castCount: world.stats.cast, mana: world.manaTribes[0].mana, random: world.randomState,
    shot: shot && world.projectiles.includes(shot) ? { id: shot.id, caster: shot.caster, phase: shot.phase, remaining: shot.remaining,
      target: { ...shot.target }, destination: { ...shot.destination }, tracking: shot.blastTarget ? structuredClone(shot.blastTarget) : null,
      visualIds: shot.visuals.map(v => v.id) } : null,
    effects: world.effects.filter(e => e.kind === 'blast' || e.kind === 'blastWave').map(e => ({ id: e.id, kind: e.kind, point: { x: e.x, z: e.z } })) })
  const guard = fn => { try { fn() } catch (error) { evidence.error(error) } }
  function wrap(object, key, callback) {
    const original = object[key], descriptor = Object.getOwnPropertyDescriptor(object, key)
    const wrapper = function (...args) { const result = original?.apply(this, args); guard(() => callback(...args)); return result }
    wrappers.push({ object, key, original, descriptor, wrapper }); object[key] = wrapper
  }
  wrap(scene.gameClock, 'beforeTurn', () => observeBlastTurn(evidence, 'before', sample))
  latestEnemy = enemy ? { turn: world.turn, ...person(target) } : null
  wrap(scene.gameClock, 'afterTurn', () => {
    if (enemy && !delivered && world.turn !== latestEnemy.turn) { priorEnemy = latestEnemy; latestEnemy = { turn: world.turn, ...person(target) } }
    if (groundEnemy && !delivered && !artifacts.groundResponse && priorEnemy && latestEnemy.orderModel === 21 &&
        latestEnemy.same && latestEnemy.ownerValid && latestEnemy.hp > 0 && !target.flight && priorEnemy.position && latestEnemy.position &&
        (latestEnemy.position.x !== priorEnemy.position.x || latestEnemy.position.y !== priorEnemy.position.y))
      artifacts.groundResponse = { turn: world.turn, observedAt: performance.now(), before: structuredClone(priorEnemy), after: structuredClone(latestEnemy) }
    observeBlastTurn(evidence, 'after', sample)
  })
  const flushAck = () => { if (deferredHover) { const work = deferredHover; deferredHover = null; work() } if (deferredAck) { const work = deferredAck; deferredAck = null; work() } }
  const saveFrame = (kind, effectId, drawNow) => {
    if (artifacts[kind]) return
    const { png, pixels } = kind === 'ack' || enemy && kind === 'hover' ? { pixels: null } : captureRenderedCanvas(scene)
    const feedback = pointerFeedback(scene), frame = { turn: world.turn, renderFrame: scene.renderer.info.render.frame, kind, targetId: feedback.targetId, visible: true, lines: feedback.lines, pixels, effectId,
      ...(kind === 'projectile' && { phase: shot.phase, shotId: shot.id }),
      ...(kind === 'ack' && { drawNow, ackUntil: scene.pointerAck.until, observedAt: performance.now(), targetSame: world.units.find(u => u.id === target.id) === target, ownerValid: person(target).ownerValid, position: person(target).position, context: inputContext(scene) }),
      ...(kind === 'hover' && { targetSame: world.units.find(u => u.id === target.id) === target, ownerValid: person(target).ownerValid, position: person(target).position, context: inputContext(scene),
        point: { x: scene.pointerScreen.clientX, y: scene.pointerScreen.clientY }, renderFrame: scene.renderer.info.render.frame, observedAt: performance.now() }) }
    const vector = scene.pointerOutline.cloneNode(true), rect = scene.container.getBoundingClientRect(), path = vector.querySelector('path')
    vector.setAttribute('width', String(rect.width)); vector.setAttribute('height', String(rect.height))
    vector.style.width = ''; vector.style.height = ''; vector.style.display = 'block'
    if (path) { const style = getComputedStyle(scene.pointerPath); path.style.stroke = style.stroke; path.style.fill = style.fill; path.style.strokeWidth = style.strokeWidth }
    const svg = new XMLSerializer().serializeToString(vector)
    artifacts[kind] = { turn: world.turn, png, svg,
      feedback, frameProof: structuredClone(frame), effectId, pixels, ...(kind === 'ack' || enemy && kind === 'hover' ? { pixelScope: 'Detached raster of the frozen live DOM cue SVG; no WebGL or full-game cue PNG.' } : { pixelScope: 'Nontransparent pixels in the actual post-render game canvas, not an isolated-effect pixel count. Review the PNG and submitted visible effect together.' }) }
    if (enemy && kind === 'hover') evidence.captureHover(frame)
    if (kind !== 'hover' && kind !== 'ack') { evidence.frame(frame); return }
    // Rasterize a detached snapshot of the actual SVG and its computed stroke.
    // Never redraw, hide or alter a live game mesh or DOM element for pixel counts.
    const rasterize = () => {
      const work = (async () => {
        const image = new Image(), url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
        let timer
        try {
          image.src = url
          await Promise.race([image.decode(), new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Bracket snapshot decode timed out')), 2000) })])
          const raster = document.createElement('canvas'); raster.width = Math.ceil(rect.width); raster.height = Math.ceil(rect.height)
          const context = raster.getContext('2d'); context.drawImage(image, 0, 0)
          const bytes = context.getImageData(0, 0, raster.width, raster.height).data
          let bracketPixels = 0
          for (let i = 3; i < bytes.length; i += 4) if (bytes[i]) bracketPixels++
          artifacts[kind].bracketPng = raster.toDataURL('image/png'); artifacts[kind].bracketPixels = bracketPixels
          evidence.frame({ ...frame, pixels: bracketPixels })
        } finally { clearTimeout(timer); URL.revokeObjectURL(url) }
      })().catch(error => evidence.error(error))
      pending.add(work); void work.finally(() => pending.delete(work))
    }
    if (enemy && kind === 'hover' && !delivered) deferredHover = rasterize
    else if (kind === 'ack' && !enemy && !movementAttempted) deferredAck = rasterize
    else rasterize()
  }
  wrap(scene.renderer, 'render', (renderedScene, camera) => {
    if (disposed || renderedScene !== scene.scene || camera !== scene.camera) return
    if (!sameScene()) { evidence.error('Original scene/World/canvas changed while observing rendered evidence'); return }
    hudFrame = { turn: world.turn, renderFrame: scene.renderer.info.render.frame, context: inputContext(scene) }
    const feedback = pointerFeedback(scene), report = evidence.report()
    if (!enemy && report.hover && options.expectation === 'candidate' && feedback.visible && feedback.targetId === target.id) {
      if (!delivered && feedback.lines === 16) saveFrame('hover', null)
    }
    if (!delivered) return
    const onScreen = effect => {
      const q = scene.screen(effect, effect.height)
      return q && Math.abs(q.x) < 1 && Math.abs(q.y) < 1 && visible(scene.fxMeshes.get(effect.id))
    }
    const owned = shot && world.projectiles.includes(shot), head = owned && shot.visuals[0]
    const projectilePhase = owned && ['flying', 'arrived'].includes(shot.phase)
    const headVisible = !!(head && visible(scene.fxMeshes.get(head.id)))
    const headOnScreen = !!(projectilePhase && head && onScreen(head))
    if (!report.retired || world.turn <= report.retired + 2) {
      const observed = { turn: world.turn, renderFrame: scene.renderer.info.render.frame,
        phase: owned ? shot.phase : 'retired', shotId: shot?.id ?? null, headId: head?.id ?? null,
        headMeshPresent: !!(head && scene.fxMeshes.get(head.id)), headVisible, headOnScreen }
      artifacts.renderOpportunity ??= { first: structuredClone(observed), last: null, visits: 0 }
      artifacts.renderOpportunity.last = observed; artifacts.renderOpportunity.visits++
    }
    if (headOnScreen) saveFrame('projectile', head.id)
    const impact = report.impact && world.effects.find(e => e.id === report.impact.flash.id)
    if (impact && onScreen(impact)) saveFrame('impact', impact.id)
  })
  // HUD geometry is produced after the WebGL render in the same natural frame.
  // Use the RAF time consumed by drawPointer, not a later observer timestamp.
  wrap(scene, 'drawPointer', now => {
    const rendered = hudFrame; hudFrame = null
    if (disposed || (!delivered && !(enemy && enemyArmed)) || options.expectation !== 'candidate') return
    if (!sameScene()) { evidence.error('Original scene/World/canvas changed while observing HUD evidence'); return }
    if (!rendered || rendered.turn !== world.turn || rendered.renderFrame !== scene.renderer.info.render.frame ||
        JSON.stringify(rendered.context) !== JSON.stringify(inputContext(scene))) throw Error('HUD draw does not match the preceding natural render')
    const feedback = pointerFeedback(scene), probe = artifacts.enemyPointer
    const firstMoveDraw = !!(enemy && !delivered && probe?.move && !probe.draw)
    if (firstMoveDraw) {
      const current = person(target), point = scene.pointerScreen && { x: scene.pointerScreen.clientX, y: scene.pointerScreen.clientY }
      const draw = { turn: world.turn, observedAt: performance.now(), drawNow: now, point, context: inputContext(scene),
        position: current.position, previousTurn: priorEnemy?.turn, previousPosition: priorEnemy?.position,
        targetSame: current.same, ownerValid: current.ownerValid, feedback: { targetId: feedback.targetId, visible: feedback.visible, lines: feedback.lines },
        renderFrame: scene.renderer.info.render.frame }
      draw.matchedMove = draw.turn >= probe.move.turn && draw.renderFrame >= probe.move.renderFrame && draw.observedAt >= probe.move.observedAt && now <= draw.observedAt &&
        JSON.stringify(draw.point) === JSON.stringify(probe.move.point) && JSON.stringify(draw.context) === JSON.stringify(probe.move.context)
      probe.draw = structuredClone(draw)
      if (!draw.matchedMove) { probe.errors.push('First natural draw does not match the actual delivered preparation move'); throw Error(probe.errors.at(-1)) }
    }
    if (firstMoveDraw && !delivered && !evidence.report().hover && world.mode === 'blast' && !scene.pointerButtons &&
        feedback.visible && feedback.targetId === target.id && feedback.lines === 16 && scene.pointerScreen && priorEnemy) {
      const current = person(target), point = { x: scene.pointerScreen.clientX, y: scene.pointerScreen.clientY }
      if (current.same && current.ownerValid && current.hp > 0 && priorEnemy.same && priorEnemy.ownerValid &&
          priorEnemy.turn < world.turn && current.position && priorEnemy.position &&
          (groundEnemy ? !artifacts.groundResponse && current.orderModel !== 21 && current.position.x === priorEnemy.position.x && current.position.y === priorEnemy.position.y
            : current.position.x !== priorEnemy.position.x || current.position.y !== priorEnemy.position.y) &&
          document.elementFromPoint(point.x, point.y) === canvas) {
        evidence.hover({ turn: world.turn, targetId: target.id, mode: world.mode, canvasOwned: true, hitId: feedback.targetId,
          visible: feedback.visible, lines: feedback.lines, context: inputContext(scene), position: current.position,
          previousTurn: priorEnemy.turn, previousPosition: priorEnemy.position, point, observedAt: performance.now(),
          targetSame: current.same, ownerValid: current.ownerValid, renderFrame: scene.renderer.info.render.frame })
        saveFrame('hover', null, now)
      }
    }
    if (delivered && feedback.visible && feedback.targetId === target.id && feedback.lines === 32 &&
        scene.pointerAck.target === target.id && now < scene.pointerAck.until) saveFrame('ack', null, now)
  })
  const captureEnemyMove = event => {
    const probe = artifacts.enemyPointer
    if (disposed || !enemy || !probe || probe.draw) return
    guard(() => {
      if (probe.move) { probe.errors.push('Repeated preparation move before its first natural draw'); throw Error(probe.errors.at(-1)) }
      const current = person(target)
      probe.move = { turn: world.turn, observedAt: performance.now(), point: { x: event.clientX, y: event.clientY },
        context: inputContext(scene), position: current.position, targetSame: current.same, ownerValid: current.ownerValid,
        trusted: event.isTrusted, canvasOwned: event.target === canvas && document.elementFromPoint(event.clientX, event.clientY) === canvas,
        mode: world.mode, renderFrame: scene.renderer.info.render.frame }
      if (!sameScene() || !probe.move.trusted || !probe.move.canvasOwned || event.buttons !== 0 || world.mode !== 'blast' ||
          probe.move.turn < probe.prepared.turn || probe.move.observedAt < probe.prepared.observedAt ||
          JSON.stringify(probe.move.point) !== JSON.stringify(probe.prepared.point) || JSON.stringify(probe.move.context) !== JSON.stringify(probe.prepared.context)) {
        probe.errors.push('Actual preparation move differs from its declared point, context or trusted canvas')
        throw Error(probe.errors.at(-1))
      }
    })
  }
  const capturePress = event => {
    if (event.button !== 0) return
    pressBefore = { turn: world.turn, observedAt: performance.now(), mode: world.mode, trusted: event.isTrusted,
      canvasOwned: event.target === scene.renderer.domElement && document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement,
      point: { x: event.clientX, y: event.clientY }, context: inputContext(scene), position: person(target).position,
      targetSame: world.units.find(u => u.id === target.id) === target, ownerValid: person(target).ownerValid }
  }
  const capture = event => {
    if (event.button !== 0 || event.type !== 'pointerup') return
    eventBefore = { observedAt: performance.now(), press: structuredClone(pressBefore), point: { x: event.clientX, y: event.clientY }, turn: world.turn, targetId: target.id, mode: world.mode, trusted: event.isTrusted,
      canvasOwned: event.target === scene.renderer.domElement && document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement,
      context: inputContext(scene), stockBefore: world.shots.blast, castCountBefore: world.stats.cast }
    if (groundEnemy && !enemyArmed) eventBefore.deliveryContext = deliveryContext(entityInputState(scene, null, eventBefore.point))
    inputBefore = { turn: world.turn, mode: world.mode, selected: [...world.selected], stock: world.shots.blast, castCount: world.stats.cast,
      trusted: eventBefore.trusted, canvasOwned: eventBefore.canvasOwned, point: { ...eventBefore.point } }
    if (delivered) {
      eventBefore.selected = [...world.selected]
      eventBefore.shotBefore = shot && { id: shot.id, phase: shot.phase, remaining: shot.remaining }
    }
    if (!delivered && (options.expectation === 'baseline' || enemy && enemyArmed)) guard(() => { eventBefore.targetCheck = { range: captureBlastReleaseRange(world, target, spellTargetError), ...(enemy && { position: person(target).position }), ...(groundEnemy && { movement: { turn: world.turn, previousTurn: priorEnemy?.turn, previousPosition: priorEnemy?.position, groundResponse: person(target).orderModel === 21 && !target.flight } }) } })
  }
  const release = event => {
    if (event.button !== 0 || event.type !== 'pointerup') return
    const moving = delivered
    if (moving) movementAttempted = true
    try {
      if (groundEnemy && !enemyArmed) {
        if (artifacts.approach) throw Error('Only one actual ground approach input is permitted')
        approachOwner = actor.native; approachOrder = approachOwner && currentPersonOrder(world.buildingOrders, approachOwner)
        const after = sample(), value = structuredClone(eventBefore)
        artifacts.approach = { event: value, after: structuredClone(after), selected: [...world.selected], lastOrderTurn: world.lastOrderTurn,
          orderId: approachOwner && (approachOwner.immediateCommand || approachOwner.commands[approachOwner.commandCursor]),
          order: approachOrder && { ...approachOrder }, contextAfter: inputContext(scene),
          deliveryContextAfter: deliveryContext(entityInputState(scene, null, value.point)), valid: false }
        if (!sameScene() || !value.trusted || !value.canvasOwned || value.mode !== null || world.mode !== null || value.turn !== world.turn ||
            !after.actor.same || !after.actor.ownerValid || actor.hp <= 0 || world.selected.length !== 1 || world.selected[0] !== actor.id ||
            approachOrder?.model !== 3 || approachOrder.flags & 1 || world.lastOrderTurn !== world.turn ||
            after.stock !== value.stockBefore || after.castCount !== value.castCountBefore || world.projectiles.some(p => p.team === 'blue' && p.spell === 'blast'))
          throw Error('One actual trusted ground approach, original selected caster and unchanged cast count required')
        // moveGround alone owns the picker wrappers. Its restored trace is
        // consumed by armEnemy after the helper returns; no wrapper finishes here.
        return
      }
      if (!pointer) {
        artifacts.unarmedFollowingInput = { before: structuredClone(inputBefore), handlerTrace: false,
          after: { turn: world.turn, mode: world.mode, selected: [...world.selected], stock: world.shots.blast, castCount: world.stats.cast } }
        throw Error('Predeclared following input had no accepted armed first release; actual effects retained without handler trace')
      }
      if (delivered && (!moveExpected || movementDelivered)) throw Error('Repeated or unarmed movement input')
      const trace = pointer.finish(); pointer = null
      if (delivered) artifacts.movePointer = trace
      else artifacts.pointer = trace
      if (delivered) artifacts.attemptedMove = { event: structuredClone(eventBefore) }
      else artifacts.attemptedRelease = { stage: 'handler-trace', event: structuredClone(eventBefore) }
      if (trace.errors.length || !trace.restored) throw Error('Delivered pointer observation did not restore cleanly')
      const up = trace.events.find(e => e.type === 'pointerup')
      if (!up || trace.events.filter(e => e.type === 'pointerup').length !== 1) throw Error('Exactly one actual release required')
      const persons = up.picks.filter(p => p.name === 'pickPerson'), terrain = up.picks.find(p => p.name === 'pick' && p.owner === 'scene' && p.point)
      if (enemy && !enemyArmed) {
        const allocated = world.projectiles.filter(p => p.team === 'blue' && p.spell === 'blast')
        const after = sample(), value = { ...eventBefore, handlerPersonId: persons.at(-1)?.id ?? null, handlerTerrain: terrain?.point ?? null }
        artifacts.primer = { event: structuredClone(value), trace, after: structuredClone(after), valid: false }
        if (!sameScene() || !eventBefore.trusted || !eventBefore.canvasOwned || eventBefore.mode !== 'blast' ||
            eventBefore.turn !== world.turn || !after.actor.same || !after.actor.ownerValid || after.actor.kind !== 'shaman' || after.actor.hp <= 0 || world.mode !== null ||
            persons.some(p => p.id !== null) || !terrain || allocated.length !== 1 || allocated[0].caster !== actor.id ||
            allocated[0].blastTarget || allocated[0].phase !== 'windup' || allocated[0].remaining !== 6 ||
            after.stock !== eventBefore.stockBefore - 1 || after.castCount !== eventBefore.castCountBefore + 1)
          throw Error('One actual trusted ground primer, original caster, fresh shot and payment required')
        primerShot = allocated[0]; artifacts.primer.shot = structuredClone({ id: primerShot.id, caster: primerShot.caster, target: primerShot.target })
        artifacts.primer.valid = true; return
      }
      if (delivered) {
        const p = owner(target), order = p && currentPersonOrder(world.buildingOrders, p)
        const value = { turn: world.turn, mode: eventBefore.mode, selected: eventBefore.selected, trusted: eventBefore.trusted, canvasOwned: eventBefore.canvasOwned,
          point: eventBefore.point, shotBefore: eventBefore.shotBefore, order: order && { model: order.model, a: order.a & 65535, b: order.b & 65535 }, expected: moveExpected,
          handlerPoint: terrain?.point ?? null, handlerPersonId: persons.at(-1)?.id ?? null, afterMode: world.mode, afterSelected: [...world.selected], ownerSame: p === moveOwner }
        artifacts.attemptedMove = { event: structuredClone(value), sample: structuredClone(sample()) }
        evidence.move(value, sample()); movementOrder = order; movementDelivered = true
        return
      }
      if (options.expectation === 'baseline') {
        eventBefore.targetCheck ??= {}
        eventBefore.targetCheck.pixel = readBlastReleasePixel(scene, event)
        artifacts.deliveredTargetCheck = structuredClone(eventBefore.targetCheck)
      }
      if (enemy && (groundEnemy
        ? !artifacts.approach?.valid || !artifacts.groundResponse || eventBefore.castCountBefore !== artifacts.approach.after.castCount
        : !artifacts.primer?.valid || world.projectiles.includes(primerShot) || eventBefore.castCountBefore !== artifacts.primer.after.castCount))
        throw Error('Actual enemy preparation and unchanged cast count must precede the person release')
      const shots = world.projectiles.filter(p => p.team === 'blue' && p.spell === 'blast')
      if (shots.length !== 1) throw Error('One naturally allocated Blue Blast required')
      shot = shots[0]
      recordBlastRelease(artifacts, evidence, { ...eventBefore, handlerPersonId: persons.at(-1)?.id ?? null, handlerTerrain: !!terrain }, sample())
      delivered = true
      if (!enemy) admission.accept(armMove(plannedGround))
    } catch (error) { admission.fail(error); evidence.error(error) }
    finally { if (moving || enemy && enemyArmed) flushAck() }
  }
  const canvas = scene.renderer.domElement
  // Register the capture before the generic pointer observer; both precede the real handler.
  canvas.addEventListener('pointermove', captureEnemyMove, false)
  canvas.addEventListener('pointerdown', capturePress, true)
  canvas.addEventListener('pointerup', capture, true)
  if (!groundEnemy) pointer = observeEntityPointer(scene, document, { id: target.id, collection: 'units' })
  canvas.addEventListener('pointerup', release, false)
  function armMove(ground) {
    const report = evidence.report()
    const check = { turn: world.turn, mode: world.mode, selected: [...world.selected], castCount: world.stats.cast,
      shot: shot && { id: shot.id, phase: shot.phase, remaining: shot.remaining }, acceptedRelease: !!report.release, errors: [...report.errors] }
    artifacts.moveAdmission = structuredClone(check)
    if (!delivered || !report.release || report.errors.length || moveExpected || !sameScene() || world.mode !== null ||
        world.selected.length !== 1 || world.selected[0] !== target.id || !shot || !world.projectiles.includes(shot) ||
        shot.id !== report.entry.shot.id || shot.phase !== 'windup' || shot.remaining <= 0 || world.stats.cast !== report.entry.castCount)
      throw Error('Actual accepted cast, cleared mode, original selection and remaining windup required before movement')
    moveOwner = owner(target)
    moveExpected = { a: Math.round((ground.point.x + 8) * 256) & 65535, b: Math.round((-ground.point.z - 8) * 256) & 65535, pixel: { x: ground.x, y: ground.y } }
    // Preserve the same bubble ordering: the generic trace completes before
    // this observer consumes it, on both the cast and the one later move.
    canvas.removeEventListener('pointerup', release, false)
    pointer = observeEntityPointer(scene, document, { id: target.id, collection: 'units' })
    canvas.addEventListener('pointerup', release, false)
    return check
  }
  return {
    prepareEnemyPointer(point) {
      if (!enemy || !enemyArmed || disposed || delivered || artifacts.enemyPointer || evidence.report().errors.length ||
          !sameScene() || world.mode !== 'blast' || world.projectiles.includes(primerShot) ||
          !Number.isInteger(point?.x) || !Number.isInteger(point?.y)) throw Error('One finite pointer preparation in the armed episode required')
      artifacts.enemyPointer = { prepared: { turn: world.turn, observedAt: performance.now(), point: { ...point },
        context: inputContext(scene), position: person(target).position }, move: null, draw: null, errors: [] }
      return structuredClone(artifacts.enemyPointer.prepared)
    },
    pointerProbe: () => artifacts.enemyPointer ? structuredClone({ ...artifacts.enemyPointer, ...(groundEnemy && { response: artifacts.groundResponse ?? null }) }) : null,
    armEnemy(delivery) {
      if (groundEnemy) {
        const observed = artifacts.approach, trace = delivery?.delivered, events = trace?.events, value = observed?.event
        artifacts.approachDelivery = delivery ? structuredClone(delivery) : null
        const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
        const exactOrder = order => order && Object.fromEntries(['model', 'flags', 'references', 'object', 'a', 'b'].map(key => [key, order[key]]))
        const unit = delivery?.after?.units?.find(u => u.id === actor.id)
        const down = events?.[0], up = events?.[1], terrain = up?.picks?.filter(p => p.name === 'pick' && p.owner === 'scene' && p.point).at(-1)
        if (!observed || !value.press || !trace || !trace.restored || trace.errors.length || delivery.errors.length || events.length !== 2 ||
            down.type !== 'pointerdown' || up.type !== 'pointerup' || down.turn !== value.press.turn || up.turn !== value.turn ||
            !events.every(e => e.trusted && e.canvasOwned && e.canvasTarget && e.button === 0 &&
              ['ctrlKey', 'shiftKey', 'altKey', 'metaKey'].every(key => e.args[key] === false)) || down.buttons !== 1 || up.buttons !== 0 ||
            !same({ x: down.x, y: down.y }, value.press.point) || !same({ x: up.x, y: up.y }, value.point) ||
            !same(deliveryContext(up.state), value.deliveryContext) || !same(deliveryContext(up.after), observed.deliveryContextAfter) ||
            !same(value.context, observed.contextAfter) || !same(value.context, inputContext(scene)) ||
            !delivery.before.worldMatches || !delivery.after.worldMatches || delivery.before.turn > down.turn || delivery.after.turn !== value.turn ||
            !same(delivery.before.selected, [actor.id]) || !same(delivery.after.selected, observed.selected) ||
            delivery.before.units.length !== 1 || delivery.after.units.length !== 1 || delivery.before.units[0].id !== actor.id || unit?.kind !== 'shaman' ||
            delivery.after.lastOrderTurn !== value.turn || delivery.after.lastOrderTurn !== observed.lastOrderTurn ||
            delivery.before.lastOrderTurn >= delivery.after.lastOrderTurn || !unit || unit.hp <= 0 || unit.orderId !== observed.orderId ||
            !same(exactOrder(unit.order), exactOrder(observed.order)) || !terrain ||
            up.picks.some(p => p.name === 'pickPerson' && p.id !== null) ||
            (unit.order.a & 65535) !== (Math.round((terrain.point.x + 8) * 256) & 65535) ||
            (unit.order.b & 65535) !== (Math.round((-terrain.point.z - 8) * 256) & 65535))
          throw Error('Restored moveGround receipt must match the actual approach event, context, selected recipient and native order')
        if (enemyArmed || disposed || !artifacts.approach || evidence.report().errors.length || !sameScene() || pointer ||
            !person(actor).same || !person(actor).ownerValid || actor.hp <= 0 || actor.native !== approachOwner ||
            currentPersonOrder(world.buildingOrders, approachOwner) !== approachOrder || world.stats.cast !== artifacts.approach.after.castCount ||
            artifacts.groundResponse || person(target).orderModel === 21)
          throw Error('One validated active original approach before enemy response required')
        observed.valid = true
        enemyArmed = true
        canvas.removeEventListener('pointerup', release, false)
        pointer = observeEntityPointer(scene, document, { id: target.id, collection: 'units' })
        canvas.addEventListener('pointerup', release, false)
        artifacts.enemyArmed = { turn: world.turn, setup: 'ground-response', approachTurn: artifacts.approach.event.turn, stock: world.shots.blast }
        return structuredClone(artifacts.enemyArmed)
      }
      if (!enemy || enemyArmed || disposed || !artifacts.primer?.valid || evidence.report().errors.length || !sameScene() ||
          !person(actor).same || !person(actor).ownerValid || actor.hp <= 0 || world.stats.cast !== artifacts.primer.after.castCount ||
          pointer)
        throw Error('One validated actual ground primer must precede enemy arming')
      enemyArmed = true
      canvas.removeEventListener('pointerup', release, false)
      pointer = observeEntityPointer(scene, document, { id: target.id, collection: 'units' })
      canvas.addEventListener('pointerup', release, false)
      artifacts.enemyArmed = { turn: world.turn, primerId: primerShot.id, primerRetired: !world.projectiles.includes(primerShot),
        stock: world.shots.blast, stockDeltaSincePrimer: world.shots.blast - artifacts.primer.after.stock }
      return structuredClone(artifacts.enemyArmed)
    },
    prepareMove(ground) {
      if (enemy) throw Error('Enemy episode has no commanded movement')
      if (plannedGround || delivered || disposed) throw Error('One movement plan before the actual cast required')
      if (![ground?.x, ground?.y, ground?.point?.x, ground?.point?.z].every(Number.isFinite)) throw Error('Finite precomputed ground plan required')
      plannedGround = structuredClone(ground)
    },
    waitForMove: () => admission.wait(),
    abortMove: reason => admission.fail(Error(reason ?? 'Movement admission aborted')),
    propose: value => evidence.propose(value),
    hover: value => evidence.hover(value),
    trigger: turn => {
      if (turn > world.turn || world.turn - turn > 4) throw Error('Stale actual response trigger')
      evidence.trigger(turn, performance.now())
    },
    read: () => ({ report: evidence.report(), artifacts: structuredClone(artifacts) }),
    progress: () => evidence.report(),
    settled: () => { flushAck(); return Promise.all([...pending]) },
    dispose() {
      if (disposed) return
      disposed = true
      admission.fail(Error('Movement admission observer disposed'))
      canvas.removeEventListener('pointermove', captureEnemyMove, false)
      canvas.removeEventListener('pointerdown', capturePress, true); canvas.removeEventListener('pointerup', capture, true); canvas.removeEventListener('pointerup', release, false)
      if (pointer) { const result = pointer.finish(); pointer = null; if (!result.restored || result.errors.length) evidence.error('Pointer cleanup failed') }
      for (const { object, key, original, descriptor, wrapper } of wrappers.reverse()) {
        if (object[key] !== wrapper) evidence.error(`Unexpected observer replacement: ${key}`)
        else if (descriptor) Object.defineProperty(object, key, descriptor)
        else delete object[key]
        if (object[key] !== original) evidence.error(`Observer restoration failed: ${key}`)
      }
    },
  }
}
