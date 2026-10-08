import { captureRenderedCanvas } from './frame-capture.mjs'

// Observe existing calls only. No picker, renderer or clock invocation is added.
const copy = value => structuredClone(value)
const fields = (value, names) => Object.fromEntries(names.map(name => [name, value?.[name] ?? null]))
const command = value => value ? fields(value, ['slot', 'alpha', 'bucket', 'cell', 'phase', 'object', 'face', 'order']) : null
const cache = picking => fields(picking, ['lastKey', 'lastId', 'lastKind'])
const identity = object => object ? { ...fields(object, ['id', 'uuid', 'type']), ...fields(object.userData, ['painterGround', 'nativeModel']) } : null
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const sameDescriptor = (a, b) => a === b || !!a && !!b && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => a[key] === b[key])

export function observeBlastPick(scene, { targetId, frameLimit = 8, callLimit = 750 } = {}) {
  if (!Number.isInteger(targetId) || targetId < 1 || !Number.isInteger(frameLimit) || frameLimit < 1 || frameLimit > 8 ||
    !Number.isInteger(callLimit) || callLimit < 1 || callLimit > 750) throw Error('Bounded pick diagnostic options required')
  const world = scene.world, renderer = scene.renderer, canvas = renderer.domElement, picking = scene.picking, view = scene.view, painter = view.painter
  const target = world.units.find(unit => unit.id === targetId), group = scene.unitMeshes.get(targetId)
  if (!target || !group) throw Error('Original rendered target required')
  const hooks = [], calls = [], errors = [], cleanup = []
  let active, selectedObject, searching = false, sealed = false, disposed = false, frameCount = 0, frame, searchContext
  const error = value => { if (errors.length < 16) errors.push(String(value?.message ?? value)) }
  const observe = callback => { try { return callback() } catch (failure) { error(failure); return null } }
  const context = () => ({ turn: world.turn, renderFrame: renderer.info.render.frame,
    sameWorld: scene.world === world, sameTarget: world.units.find(unit => unit.id === targetId) === target,
    sameGroup: scene.unitMeshes.get(targetId) === group, canvasConnected: canvas.isConnected,
    camera: { ...scene.cameraPosition }, view: { ...scene.viewPoint }, bearing: scene.cameraBearing,
    center: { ...view.center }, rawCenter: { ...view.rawCenter }, projection: copy(view.projection),
    rect: fields(canvas.getBoundingClientRect(), ['left', 'top', 'width', 'height']),
    containerRect: fields(scene.container.getBoundingClientRect(), ['left', 'top', 'width', 'height']),
    renderedTarget: { id: targetId, visible: group.visible, position: fields(group.position, ['x', 'y', 'z']),
      ...fields(group.userData, ['frame', 'spriteBucket', 'pickable']), matrixWorld: Array.from(group.matrixWorld.elements) } })
  function restore() {
    for (const hook of [...hooks].reverse()) {
      if (hook.restored) continue
      observe(() => {
        if (!sameDescriptor(Object.getOwnPropertyDescriptor(hook.object, hook.key), hook.installed)) throw Error(`Diagnostic callback replaced: ${hook.key}; foreign replacement preserved`)
        if (hook.descriptor) Object.defineProperty(hook.object, hook.key, hook.descriptor)
        else delete hook.object[hook.key]
        if (!sameDescriptor(Object.getOwnPropertyDescriptor(hook.object, hook.key), hook.descriptor)) throw Error(`Diagnostic restoration failed: ${hook.key}`)
        hook.restored = true; cleanup.push(hook.key)
      })
    }
  }
  const specs = [
    [picking, 'pick', 'pick'], [picking, 'personBounds', 'bounds'], [painter, 'source', 'source'],
    [painter, 'command', 'command'], [view, 'resolvePickCandidates', 'terrain'], [renderer, 'render', 'render'],
  ]
  // Reject the whole attachment before installing any unsupported descriptor.
  for (const [object, key] of specs) {
    const descriptor = Object.getOwnPropertyDescriptor(object, key)
    if (typeof object[key] !== 'function' || descriptor && (!('value' in descriptor) || !descriptor.configurable && !descriptor.writable) ||
      !descriptor && !Object.isExtensible(object)) throw Error(`Unsupported diagnostic callback: ${key}`)
  }
  for (const [object, key, kind] of specs) {
    const original = object[key], descriptor = Object.getOwnPropertyDescriptor(object, key)
    const wrapper = function (...args) {
      let row
      if (searching && kind === 'pick') observe(() => {
        if (calls.length >= callLimit) throw Error('Diagnostic pick call limit reached')
        row = { event: fields(args[0], ['clientX', 'clientY']), context: context(), cacheBefore: cache(picking),
          bounds: null, personSource: null, personDepth: null, terrain: null, terrainSource: null }
        calls.push(row); active = row; selectedObject = null
      })
      let result
      try { result = Reflect.apply(original, this, args) }
      catch (failure) {
        observe(() => { if (row) row.thrown = String(failure?.message ?? failure) })
        if (row) { active = null; selectedObject = null }
        throw failure
      }
      observe(() => {
        if (active && kind === 'bounds' && args[0] === targetId) active.bounds = result && copy(result)
        if (active && kind === 'source' && group.userData.layers.includes(args[0])) {
          active.personSource = command(result)
          active.personDepth = result ? painter.texture.image.data[result.slot] * 2 - 1 : null
        }
        if (active && kind === 'terrain') {
          selectedObject = result?.object
          active.terrain = result ? { candidateCount: args[0].length, object: identity(result.object),
            ...fields(result, ['triangle', 'instance', 'depth']) } : null
        }
        if (active && kind === 'command' && args[0] === selectedObject) active.terrainSource = command(result)
        if (row) {
          row.result = typeof result === 'number' ? result : null; row.cacheAfter = cache(picking)
          row.cacheReused = row.cacheBefore.lastKey === row.cacheAfter.lastKey
        }
        if (kind === 'render' && !sealed && !disposed && args[0] === scene.scene && args[1] === scene.camera) {
          if (frameCount >= frameLimit) throw Error('Prospective diagnostic frame limit reached')
          frameCount++
          const capturedContext = context(), image = captureRenderedCanvas(scene)
          if (!image.pixels) throw Error('Natural rendered canvas has no retained pixels')
          frame = { context: capturedContext, sceneFrame: scene.frame, ...image }
        }
      })
      if (row) { active = null; selectedObject = null }
      return result
    }
    const installed = descriptor ? { ...descriptor, value: wrapper } : { value: wrapper, configurable: true, writable: true, enumerable: true }
    Object.defineProperty(object, key, installed)
    hooks.push({ object, key, descriptor, installed, restored: false })
  }
  const read = () => copy({ version: 1, targetId, frameLimit, callLimit, frameCount, searching, sealed, disposed, calls, errors, cleanup,
    frame, searchContext, cleanupVerified: hooks.every(hook => hook.restored),
    frameMatched: !!searchContext && !!frame && same(searchContext, frame.context),
    scope: 'Diagnostic existing-call records and exact preceding natural-frame capture only. No cast, ordinary acceptance or directly captured full sorted hit stream. Any stream/order reconstruction must be labelled as reconstruction.' })
  return {
    status: () => ({ hasFrame: !!frame, frameCount, errors: [...errors] }),
    beginSearch() {
      if (searching || sealed || disposed || errors.length) throw Error('Diagnostic cannot rearm')
      if (!frame) return false
      searchContext = context()
      if (!same(searchContext, frame.context)) { error('Rendered frame no longer matches the actual pick context'); throw Error(errors.at(-1)) }
      searching = true
      return true
    },
    seal() {
      if (!searching || sealed) throw Error('One existing search must be observed before sealing')
      searching = false; sealed = true
      if (!calls.length) error('No existing picker call was consumed')
      restore()
      return read()
    },
    read,
    dispose() { if (disposed) return; disposed = true; searching = false; restore() },
  }
}
