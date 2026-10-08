import { createBlastEpisode } from './contract.mjs'
import { captureRenderedCanvas } from './frame-capture.mjs'
import { currentPersonOrder } from '../../app/person-orders.ts'
import { observeEntityPointer } from '../erosion-ordinary/input.mjs'

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
export function responseSnapshot(scene) {
  const w = scene.world
  return w.units.filter(u => u === window.blastOriginal.target && u.id === 19 && u.team === 'green' && u.kind === 'warrior' && u.hp > 0 && u.inside === null).flatMap(u => {
    const p = owner(u), order = p && currentPersonOrder(w.buildingOrders, p)
    return p?.class === 1 && !(p.flags2 & 1) && order?.model === 19 ? [{ id: u.id, x: u.x, z: u.z, position: position(p), speed: p.speed, orderModel: order.model, fighting: !!u.fight }] : []
  })
}
export function pointerFeedback(scene) {
  const style = getComputedStyle(scene.pointerOutline), pathStyle = getComputedStyle(scene.pointerPath)
  const path = scene.pointerPath.getAttribute('d') ?? '', opacity = Number(scene.pointerPath.getAttribute('stroke-opacity') ?? 1)
  return { turn: scene.world.turn, targetId: scene.hoveredObject,
    visible: style.display !== 'none' && style.visibility !== 'hidden' && pathStyle.visibility !== 'hidden' && opacity > 0 && !!path,
    lines: (path.match(/M/g) ?? []).length, path, opacity, context: inputContext(scene) }
}

// Hooks invoke the original method once, with the same receiver and arguments.
// No game, clock, renderer, person, command, stock or storage setter is used.
export function observeBlastEpisode(scene, options) {
  const world = scene.world, actor = world.units.find(u => u.id === options.actorId), target = world.units.find(u => u.id === options.targetId)
  if (!actor || !target || world.projectiles.some(p => p.team === 'blue' && p.spell === 'blast')) throw Error('Fresh actor, target and empty Blue Blast lifecycle required')
  const evidence = createBlastEpisode(options), artifacts = {}, wrappers = [], pending = new Set()
  let shot, delivered = false, eventBefore, pointer, disposed = false
  const sameScene = () => window.testSceneRef.current === scene && window.testStore.getWorld() === world && scene.world === world && scene.renderer.domElement.isConnected
  const person = u => {
    const p = owner(u), registered = world.objectCells.objects.get(u.id)
    return { id: u.id, same: world.units.includes(u), team: u.team, kind: u.kind, hp: u.hp, inside: u.inside,
      ownerValid: !!p && registered === p && p.class === 1 && !(p.flags2 & 1), position: p && position(p),
      orderModel: p && currentPersonOrder(world.buildingOrders, p)?.model, speed: p?.speed, state: p?.state }
  }
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
  wrap(scene.gameClock, 'beforeTurn', () => { if (delivered) evidence.before(sample()) })
  wrap(scene.gameClock, 'afterTurn', () => { if (delivered) evidence.after(sample()) })
  const saveFrame = (kind, effectId) => {
    if (artifacts[kind]) return
    const { png, pixels } = captureRenderedCanvas(scene)
    const feedback = pointerFeedback(scene), frame = { turn: world.turn, kind, targetId: feedback.targetId, visible: true, lines: feedback.lines, pixels, effectId }
    const vector = scene.pointerOutline.cloneNode(true), rect = scene.container.getBoundingClientRect(), path = vector.querySelector('path')
    vector.setAttribute('width', String(rect.width)); vector.setAttribute('height', String(rect.height))
    vector.style.width = ''; vector.style.height = ''; vector.style.display = 'block'
    if (path) { const style = getComputedStyle(scene.pointerPath); path.style.stroke = style.stroke; path.style.fill = style.fill; path.style.strokeWidth = style.strokeWidth }
    const svg = new XMLSerializer().serializeToString(vector)
    artifacts[kind] = { turn: world.turn, png, svg,
      feedback, effectId, pixels, pixelScope: 'Nontransparent pixels in the actual post-render game canvas, not an isolated-effect pixel count. Review the PNG and submitted visible effect together.' }
    if (kind !== 'hover' && kind !== 'ack') { evidence.frame(frame); return }
    // Rasterize a detached snapshot of the actual SVG and its computed stroke.
    // Never redraw, hide or alter a live game mesh or DOM element for pixel counts.
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
  wrap(scene.renderer, 'render', (renderedScene, camera) => {
    if (disposed || renderedScene !== scene.scene || camera !== scene.camera || !sameScene()) return
    const feedback = pointerFeedback(scene), report = evidence.report()
    if (report.hover && options.expectation === 'candidate' && feedback.visible && feedback.targetId === target.id) {
      if (!delivered && feedback.lines === 16) saveFrame('hover', null)
      if (delivered && feedback.lines === 32 && scene.pointerAck.target === target.id && performance.now() < scene.pointerAck.until) saveFrame('ack', null)
    }
    if (!delivered) return
    const onScreen = effect => {
      const q = scene.screen(effect, effect.height)
      return q && Math.abs(q.x) < 1 && Math.abs(q.y) < 1 && visible(scene.fxMeshes.get(effect.id))
    }
    if (shot?.phase === 'arrived' && world.projectiles.includes(shot) && shot.visuals[0] && onScreen(shot.visuals[0])) saveFrame('arrival', shot.visuals[0].id)
    const impact = report.impact && world.effects.find(e => e.id === report.impact.flash.id)
    if (impact && onScreen(impact)) saveFrame('impact', impact.id)
  })
  const capture = event => {
    if (event.button !== 0 || event.type !== 'pointerup') return
    eventBefore = { turn: world.turn, targetId: target.id, mode: world.mode, trusted: event.isTrusted,
      canvasOwned: event.target === scene.renderer.domElement && document.elementFromPoint(event.clientX, event.clientY) === scene.renderer.domElement,
      context: inputContext(scene), stockBefore: world.shots.blast, castCountBefore: world.stats.cast }
  }
  const release = event => {
    if (event.button !== 0 || event.type !== 'pointerup') return
    guard(() => {
      if (delivered) throw Error('Repeated cast input')
      const trace = pointer.finish(); pointer = null
      if (trace.errors.length || !trace.restored) throw Error('Delivered pointer observation did not restore cleanly')
      const up = trace.events.find(e => e.type === 'pointerup')
      if (!up || trace.events.filter(e => e.type === 'pointerup').length !== 1) throw Error('Exactly one actual release required')
      const persons = up.picks.filter(p => p.name === 'pickPerson'), terrain = up.picks.find(p => p.name === 'pick' && p.owner === 'scene' && p.point)
      const shots = world.projectiles.filter(p => p.team === 'blue' && p.spell === 'blast')
      if (shots.length !== 1) throw Error('One naturally allocated Blue Blast required')
      shot = shots[0]
      evidence.release({ ...eventBefore, handlerPersonId: persons.at(-1)?.id ?? null, handlerTerrain: !!terrain }, sample())
      artifacts.pointer = trace; delivered = true
    })
  }
  const canvas = scene.renderer.domElement
  // Register the capture before the generic pointer observer; both precede the real handler.
  canvas.addEventListener('pointerup', capture, true)
  pointer = observeEntityPointer(scene, document, { id: target.id, collection: 'units' })
  canvas.addEventListener('pointerup', release, false)
  return {
    hover: value => evidence.hover(value),
    trigger: turn => {
      if (turn > world.turn || world.turn - turn > 4) throw Error('Stale actual response trigger')
      evidence.trigger(turn)
    },
    read: () => ({ report: evidence.report(), artifacts: structuredClone(artifacts) }),
    progress: () => evidence.report(),
    settled: () => Promise.all([...pending]),
    dispose() {
      if (disposed) return
      disposed = true
      canvas.removeEventListener('pointerup', capture, true); canvas.removeEventListener('pointerup', release, false)
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
