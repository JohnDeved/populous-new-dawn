// Verification-only context resolution. These source-owned synchronizers can
// mutate their input, so they receive only a detached clone, never the live World.
import { liveCommandContext } from '/app/live-command.ts'
import { syncNativeTerrain, syncLandscapeObjects } from '/app/world-terrain-runtime.ts'

export function createMoveContextProbe(world) {
  const probe = structuredClone(world)
  syncNativeTerrain(probe)
  syncLandscapeObjects(probe)
  return point => {
    const context = liveCommandContext(probe, point)
    return { model: context?.model ?? null, enabled: context?.enabled === true,
      buildingId: context?.building?.id ?? null, personId: context?.person?.id ?? null,
      shrineId: context?.shrine?.id ?? null, treeId: context?.tree?.id ?? null,
      vehicleId: context?.vehicle?.id ?? null }
  }
}

export const isOrdinaryMoveContext = context => context?.model === 3 && context.enabled === true

// Integer pixels and a 5x5 same-object neighborhood avoid choosing the first
// fractional silhouette edge. This is picking evidence, not command acceptance.
export function findEntityInput(candidates, id, inspect) {
  const visited = new Set(), cache = new Map()
  const at = (x, y) => {
    const key = `${x},${y}`
    if (!cache.has(key)) cache.set(key, inspect({ x, y }))
    return cache.get(key)
  }
  for (const candidate of candidates) {
    const x = Math.round(candidate.x), y = Math.round(candidate.y), key = `${x},${y}`
    if (!Number.isFinite(x) || !Number.isFinite(y) || visited.has(key)) continue
    visited.add(key)
    let interior = true
    for (let dy = -2; dy <= 2 && interior; dy++) for (let dx = -2; dx <= 2; dx++) {
      const sample = at(x + dx, y + dy)
      if (!sample.canvasOwned || sample.hitId !== id) { interior = false; break }
    }
    if (interior) return { x, y, interiorRadius: 2 }
  }
  return null
}

export function inspectEntityPoint(scene, collection, point, doc = document) {
  const event = { clientX: point.x, clientY: point.y }
  const canvasOwned = doc.elementFromPoint(point.x, point.y) === scene.renderer.domElement
  if (!canvasOwned) return { ...point, canvasOwned, hitId: null }
  // pointerDown can select a friendly person before pointerUp orders an object.
  const selectable = scene.pickUnit(event)?.id ?? null
  const person = scene.picking.pickPerson(event)
  const object = scene.pickWorldObject(event)?.id ?? null
  return { ...point, canvasOwned, hitId: collection === 'units' ? person : selectable ?? person ?? object }
}

export function requireEntityContext(hit, observed, before) {
  if (!Number.isInteger(observed.turn) || observed.turn < before.turn || observed.targetId !== hit.id ||
    JSON.stringify(observed.selected) !== JSON.stringify(before.selected) ||
    !Number.isInteger(observed.context?.model) || observed.context.enabled !== true)
    throw Error('Entity target has no fresh enabled detached-clone command context')
}

const scalar = value => typeof value === 'number'
  ? Number.isFinite(value) && !Object.is(value, -0) ? value : Object.is(value, -0) ? '-0' : String(value)
  : typeof value === 'string' || typeof value === 'boolean' ? value : null
const fields = (value, keys) => Object.fromEntries(keys.map(key => [key, scalar(value?.[key])]))
const inputCache = scene => fields(scene.picking, ['lastKey', 'lastId', 'lastKind'])
const inputArgs = event => fields(event, ['clientX', 'clientY', 'button', 'buttons', 'ctrlKey', 'shiftKey', 'altKey', 'metaKey', 'pointerType'])

// Only copy existing state. No re-pick, geometry initialization, matrix/render
// update or model validator belongs in a delivered-event observation.
export function entityInputState(scene, hit, point) {
  const rect = scene.renderer.domElement.getBoundingClientRect?.()
  const target = hit && scene.world[hit.collection]?.find(object => object.id === hit.id)
  const group = hit && (hit.collection === 'units' ? scene.unitMeshes?.get(hit.id) :
    hit.collection === 'buildings' ? scene.buildingMeshes?.get(hit.id) : scene.shrineMeshes?.get(hit.id)?.g)
  const mesh = group?.children?.find(child => child.userData?.nativeModel !== undefined) ?? group
  const currentScene = globalThis.window?.testSceneRef?.current, store = globalThis.window?.testStore
  const projection = scene.view?.projection
  return {
    turn: scene.world.turn, frame: scalar(scene.frame), animationFrame: scalar(scene.gameClock?.animationFrame),
    currentSceneMatches: currentScene ? currentScene === scene : null,
    currentWorldMatches: store?.getWorld ? store.getWorld() === scene.world : null,
    rect: rect ? fields(rect, ['left', 'top', 'width', 'height']) : null,
    localPixel: rect ? { x: Math.trunc(point.x - rect.left), y: Math.trunc(point.y - rect.top) } : null,
    camera: fields(scene.cameraPosition, ['x', 'y', 'angle']),
    center: fields(scene.view?.center, ['x', 'y']), rawCenter: fields(scene.view?.rawCenter, ['x', 'y']),
    projection: { ...fields(projection, ['curvature', 'depth', 'perspective', 'scale', 'width', 'height', 'centerX', 'centerY', 'fractionX', 'fractionY', 'pixelScaleX', 'pixelScaleY']),
      matrix: projection?.matrix ? Array.from(projection.matrix, scalar) : null },
    target: target ? { ...fields(target, ['id', 'kind', 'model', 'x', 'z', 'active', 'enabled']),
      stoneHead: target.stoneHead ? fields(target.stoneHead, ['family', 'object', 'draw', 'morph', 'f1', 'f2', 'stamp', 'flags3', 'renderFlags', 'holdFrame']) : null } : null,
    body: mesh ? { ...fields(mesh.userData, ['nativeModel', 'stoneHeadFrame', 'frame', 'stage', 'nativeSize']),
      visible: scalar(mesh.visible), positionVersion: scalar(mesh.geometry?.attributes?.position?.version),
      matrixWorld: mesh.matrixWorld?.elements ? Array.from(mesh.matrixWorld.elements, scalar) : null } : null,
    cache: inputCache(scene),
  }
}

// Observe the delivered events and the real handler's picker calls. No diagnostic
// picker or clone work runs ahead of that handler. Each wrapper calls its original
// exactly once with the same receiver/arguments and returns the original result.
export function observeEntityPointer(scene, doc = document, hit = null, readInput = null) {
  const canvas = scene.renderer.domElement, world = scene.world, events = [], errors = [], wrappers = []
  let active = null
  const sample = event => ({ ...entityInputState(scene, hit, { x: event.clientX, y: event.clientY }),
    armedWorldMatches: scene.world === world, armedCanvasMatches: scene.renderer.domElement === canvas,
    input: readInput ? readInput() : null })
  const begin = event => {
    try {
      active = { type: event.type, turn: scene.world.turn, x: event.clientX, y: event.clientY,
        button: event.button, buttons: event.buttons, trusted: event.isTrusted,
        canvasTarget: event.target === canvas,
        canvasOwned: doc.elementFromPoint(event.clientX, event.clientY) === canvas,
        args: inputArgs(event), state: sample(event), picks: [] }
      events.push(active)
    } catch (error) { active = null; errors.push(diagnosticErrorText(error)) }
  }
  const end = event => {
    if (active) try { active.after = sample(event) }
    catch (error) { errors.push(diagnosticErrorText(error)) }
    active = null
  }
  for (const [owner, name] of [[scene, 'pickUnit'], [scene.picking, 'pickPerson'], [scene, 'pickWorldObject'], [scene.picking, 'pick'], [scene, 'pick']]) {
    const original = owner[name], descriptor = Object.getOwnPropertyDescriptor(owner, name)
    if (typeof original !== 'function') continue
    const wrapper = function (...args) {
      let before = null
      if (active) try { before = inputCache(scene) } catch (error) { errors.push(diagnosticErrorText(error)) }
      const record = (result, error, threw = false) => {
        if (active) try { active.picks.push({ name, owner: owner === scene ? 'scene' : 'picking',
          receiverMatches: this === owner, args: inputArgs(args[0]),
          id: typeof result === 'number' ? result : result?.id ?? null,
          point: result && typeof result === 'object' && 'x' in result && 'z' in result ? fields(result, ['x', 'z']) : null,
          before, after: inputCache(scene), ...(threw ? { threw: true, error: diagnosticErrorText(error) } : {}) }) }
        catch (diagnostic) { errors.push(diagnosticErrorText(diagnostic)) }
      }
      let result
      try { result = original.apply(this, args) }
      catch (error) { record(null, error, true); throw error }
      record(result)
      return result
    }
    wrappers.push({ owner, name, original, wrapper, descriptor }); owner[name] = wrapper
  }
  for (const name of ['pointerdown', 'pointerup']) {
    canvas.addEventListener(name, begin, true)
    canvas.addEventListener(name, end, false)
  }
  return { finish() {
    for (const name of ['pointerdown', 'pointerup']) {
      canvas.removeEventListener(name, begin, true)
      canvas.removeEventListener(name, end, false)
    }
    for (const { owner, name, original, wrapper, descriptor } of wrappers) {
      if (owner[name] !== wrapper) errors.push(`Unexpected replacement of ${name}`)
      else if (descriptor) Object.defineProperty(owner, name, descriptor)
      else delete owner[name]
    }
    active = null
    return { events, errors, restored: wrappers.every(({ owner, name, original }) => owner[name] === original) }
  } }
}

export function minimapInput({ width, height, rect, center, heading, target, maxDistance = 2048 }, pick, ownsPoint) {
  const wrap = v => ((v + 32768) % 65536 + 65536) % 65536 - 32768
  let best = null
  for (let y = 2; y < height - 2; y++) for (let x = 2; x < width - 2; x++) {
    const native = pick(width, height, center, heading, { x, y })
    const distance = Math.hypot(wrap(native.x - target.x), wrap(native.y - target.y))
    const point = { x: rect.x + x / width * rect.width, y: rect.y + y / height * rect.height }
    if ((!best || distance < best.distance) && ownsPoint(point)) best = { distance, ...point, native }
  }
  return best && best.distance <= maxDistance ? best : null
}

export function diagnosticErrorText(error) {
  try { return String(error?.stack ?? error) }
  catch { return 'Unprintable diagnostic failure' }
}

