// Version 2 capture keeps two independent logical boundaries: the transparent
// afterTurn hook precedes animation; observeGameTurns follows the completed step.
// Full-frame raster samples remain separate. No controller, phase or pixels are supplied.
export function installSpySourceObserver({ spyId, targetId, controlled = false }) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const canvas = scene.renderer.domElement, clock = scene.gameClock
  const result = { spyId, targetId, samples: [], turnSamples: [], turns: [], crops: [], runtime: [], error: null, done: false,
    nonAdvancingCallbacks: 0, hook: { installed: false, restored: false, foreign: false } }
  const copies = [], copied = new Set()
  let raf, stopped = false, visits = 0, lastKey, unsubscribe = () => {}
  let originalDescriptor, ownedDescriptor, hookActive = false, lastTurn = world.turn
  const same = (a, b) => !!a && !!b &&
    ['value', 'writable', 'get', 'set', 'enumerable', 'configurable'].every(k => a[k] === b[k])
  const restoreHook = () => {
    if (!hookActive) return
    if (!same(Object.getOwnPropertyDescriptor(clock, 'afterTurn'), ownedDescriptor)) {
      hookActive = false; result.hook.foreign = true
      throw Error('Spy observer lost owned afterTurn descriptor')
    }
    Object.defineProperty(clock, 'afterTurn', originalDescriptor)
    result.hook.restored = same(Object.getOwnPropertyDescriptor(clock, 'afterTurn'), originalDescriptor)
    if (!result.hook.restored) throw Error('Spy afterTurn restoration failed')
    hookActive = false
  }
  const stop = () => {
    stopped = true
    const release = unsubscribe
    unsubscribe = () => {}
    try { release() } catch (error) { result.error ??= String(error) }
    if (raf !== undefined) cancelAnimationFrame(raf)
    try { restoreHook() } catch (error) { result.error ??= String(error) }
    return result
  }
  const current = () => {
    if (window.testSceneRef.current !== scene || window.testStore.getWorld() !== world ||
      scene.world !== world || scene.gameClock !== clock)
      throw Error('Spy observer lost original Scene/world/clock')
    if (hookActive && !same(Object.getOwnPropertyDescriptor(clock, 'afterTurn'), ownedDescriptor))
      throw Error('Spy observer lost owned afterTurn descriptor')
  }
  const reserve = () => {
    if (result.samples.length + result.turnSamples.length + result.turns.length >= 600)
      throw Error('Spy observer exceeded combined sample bound')
  }
  function afterTurn(...args) {
    let returned, failure, threw = false
    try { returned = Reflect.apply(originalDescriptor.value, this, args) }
    catch (value) { failure = value; threw = true }
    if (!stopped) {
      try {
        if (threw) throw failure
        current()
        if (world.turn === lastTurn) result.nonAdvancingCallbacks++
        else {
          if (world.turn !== lastTurn + 1) throw Error('Spy observer missed consecutive logical turn')
          const spy = world.units.find(unit => unit.id === spyId), p = spy?.native
          if (!p || spy.hp <= 0) throw Error('Logical Spy owner missing')
          reserve()
          result.turnSamples.push({ spyId, targetId, turn: world.turn, substate: p.substate,
            object: p.object, timer: p.timer, f2: p.f2, entryArmed: !!(p.flags2 & 0x40000000),
            target: spy.target, speed: world.speed, paused: world.paused })
          lastTurn = world.turn
        }
      } catch (error) { result.error ??= String(error); stop() }
    }
    if (threw) throw failure
    return returned
  }
  const failed = error => { result.error ??= String(error); stop() }
  const liveSpy = () => {
    current()
    const spy = world.units.find(unit => unit.id === spyId)
    if (!spy?.native || spy.hp <= 0) throw Error('Trained Spy or actual mesh missing')
    return spy
  }
  const observeTurn = () => {
    if (stopped) return
    const spy = liveSpy(), p = spy.native
    reserve()
    result.turns.push({ spyId, targetId, turn: world.turn, substate: p.substate,
      timer: p.timer, entryArmed: !!(p.flags2 & 0x40000000), object: p.object,
      f2: p.f2, target: spy.target, paused: world.paused, speed: world.speed,
      sceneStoreMatch: scene.world === world })
    if (result.turns.length > 600) throw Error('Spy observer exceeded logical-turn bound')
  }
  const retain = () => {
    stop()
    for (const { copy, context, crop } of copies) {
      const rgba = context.getImageData(0, 0, copy.width, copy.height).data, colors = new Set()
      for (let at = 0; at < rgba.length; at += 4)
        if (rgba[at + 3]) colors.add((rgba[at] << 16) | (rgba[at + 1] << 8) | rgba[at + 2])
      crop.opaqueColors = colors.size
      crop.png = copy.toDataURL('image/png')
      copy.width = 0; copy.height = 0
    }
    copies.length = 0
    return result
  }
  const readRuntime = () => {
    const spy = world.units.find(unit => unit.id === spyId), g = scene.unitMeshes.get(spyId),
      owners = { native: spy?.native, fight: spy?.fight?.motion, flight: spy?.flight,
        entry: spy?.entry?.person, builder: spy?.builder?.person },
      person = owners.fight ?? owners.native ?? owners.flight ?? owners.entry ?? owners.builder,
      target = world.buildings.find(b => b.id === targetId),
      tribe = ['blue', 'red', 'yellow', 'green'].indexOf(target?.team),
      cell = unit => ({ x: (Math.round((unit.x + 8) * 256) & 65535) >> 9,
        y: (Math.round((-unit.z - 8) * 256) & 65535) >> 9 }),
      origin = person ? { x: (person.x & 65535) >> 9, y: (person.y & 65535) >> 9 } : spy && cell(spy),
      near = (a, b) => Math.abs(((a - b + 64) & 127) - 64) <= 1
    return { turn: world.turn, unitExists: !!spy, meshExists: !!g, hp: spy?.hp,
      target: target && { id: target.id, hp: target.hp, progress: target.progress, team: target.team },
      disguise: person?.disguise, origin, detectorTribe: tribe,
      owners: Object.fromEntries(Object.entries(owners).map(([name, p]) => [name, p ? {
        id: p.id, state: p.state, substate: p.substate, object: p.object, disguise: p.disguise,
        timer: p.timer, flags2: p.flags2, registered: world.objectCells.objects.get(spyId) === p,
        orders: [p.immediateCommand, ...p.commands].map(id => ({ id, record: structuredClone(world.buildingOrders.records[id]) })) } : null])),
      nearbyActors: origin ? world.units.filter(u => u.hp > 0 && u.inside === null &&
        ['blue', 'red', 'yellow', 'green'].indexOf(u.team) === tribe &&
        near(cell(u).x, origin.x) && near(cell(u).y, origin.y)).map(u => ({ id: u.id,
        team: u.team, kind: u.kind, hp: u.hp, cell: cell(u) })) : [] }
  }
  const visit = () => {
    if (stopped) return
    try {
      if (++visits > 45 * 240) throw Error('Spy observer exceeded visit bound')
      current()
      const spy = world.units.find(unit => unit.id === spyId), p = spy?.native
      const g = scene.unitMeshes.get(spyId)
      if (result.runtime.at(-1)?.turn !== world.turn) {
        result.runtime.push(readRuntime())
        if (result.runtime.length > 64) result.runtime.shift()
      }
      if (!p || !g || spy.hp <= 0) throw Error('Trained Spy or actual mesh missing')
      const key = JSON.stringify([world.turn, p.substate, p.object, p.f2, world.paused])
      if (key !== lastKey) {
        lastKey = key
        const camera = Math.round(scene.cameraBearing * 1024 / Math.PI)
        const heading = Math.round((Math.PI - spy.heading) * 1024 / Math.PI)
        const direction = ((((camera << 16) >> 16) - ((heading << 16) >> 16) - 0x380) & 0x700) >> 8
        const layers = (g.userData.layers ?? []).filter(layer => layer.visible)
        const sample = { spyId, targetId, turn: world.turn, stamp: scene.renderer.info.render.frame,
          substate: p.substate, timer: p.timer, entryArmed: !!(p.flags2 & 0x40000000),
          object: p.object, draw: p.draw, f1: p.f1, f2: p.f2, disguise: p.disguise,
          target: spy.target, heading: spy.heading, cameraBearing: scene.cameraBearing, direction,
          frame: g.userData.frame, flip: g.userData.frameFlip, renderedDraw: g.userData.draw,
          owner: g.userData.owner, visible: g.visible, missingNativeSource: g.userData.missingNativeSource ?? null,
          pieces: layers.map(layer => layer.userData.piece),
          submittedLayers: layers.filter(layer => scene.view.painter.source(layer)).length,
          canvasConnected: canvas.isConnected, documentVisible: document.visibilityState === 'visible',
          sceneStoreMatch: scene.world === world, speed: world.speed, paused: world.paused }
        if (!world.paused && p.object === 136 && copied.size < 2 && !copied.has(p.f2)) {
          copied.add(p.f2)
          const rect = canvas.getBoundingClientRect(), anchor = scene.view.screen(g.position, scene.camera), b = g.userData.bounds
          if (!b || ![b.left, b.top, b.right, b.bottom].every(Number.isFinite)) throw Error('Spy render bounds missing')
          const bounds = { x: (anchor.x + 1) * rect.width / 2 + b.left,
            y: (1 - anchor.y) * rect.height / 2 + b.top, width: b.right - b.left, height: b.bottom - b.top }
          sample.bodyInCanvas = anchor.z >= -1 && anchor.z <= 1 && bounds.x >= 0 && bounds.y >= 0 &&
            bounds.x + bounds.width <= rect.width && bounds.y + bounds.height <= rect.height
          sample.bodyCanvasOwned = document.elementFromPoint(rect.left + bounds.x + bounds.width / 2,
            rect.top + bounds.y + bounds.height / 2) === canvas
          const scaleX = canvas.width / rect.width, scaleY = canvas.height / rect.height
          const x = Math.max(0, Math.floor((bounds.x - 8) * scaleX)), y = Math.max(0, Math.floor((bounds.y - 8) * scaleY))
          const width = Math.min(256, canvas.width - x, Math.ceil((bounds.width + 16) * scaleX))
          const height = Math.min(256, canvas.height - y, Math.ceil((bounds.height + 16) * scaleY))
          if (width <= 1 || height <= 1) throw Error('Spy crop outside actual canvas')
          const clip = { x: rect.left + x / scaleX, y: rect.top + y / scaleY,
            width: width / scaleX, height: height / scaleY }
          const overlays = [...document.querySelectorAll('.native-hud,[data-original-pause-status],.campaign-messages summary,.campaign-messages details[open] [data-native-campaign-panel],.fps-graph,.hud-description,.world-message,.target-prompt,dialog[open],.loading-world')]
            .filter(element => { const style = getComputedStyle(element); return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 })
            .map(element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } })
            .filter(r => r.width > 0 && r.height > 0 && r.x < clip.x + clip.width && r.x + r.width > clip.x && r.y < clip.y + clip.height && r.y + r.height > clip.y)
          sample.cropOverlayClear = overlays.length === 0
          const copy = document.createElement('canvas'); copy.width = width; copy.height = height
          const context = copy.getContext('2d')
          if (!context) throw Error('Spy canvas copy unavailable')
          context.drawImage(canvas, x, y, width, height, 0, 0, width, height)
          sample.cropFile = `spy-source-frame-${p.f2}.png`
          const crop = { filename: sample.cropFile, spyId, turn: sample.turn, stamp: sample.stamp,
            frame: sample.frame, f2: p.f2, clip }
          result.crops.push(crop); copies.push({ copy, context, crop })
        }
        reserve()
        result.samples.push(sample)
        if (result.samples.length > 600) throw Error('Spy observer exceeded sample bound')
        if (copied.size === 2) result.done = true
      }
    } catch (error) { result.error = String(error); stop(); return }
    if (!controlled) raf = requestAnimationFrame(visit)
  }
  window.__pndSpySourceObservation = { result, stop, retain, readRuntime, sample: visit }
  try {
    originalDescriptor = Object.getOwnPropertyDescriptor(clock, 'afterTurn')
    if (typeof originalDescriptor?.value !== 'function') throw Error('Spy requires own afterTurn callback')
    ownedDescriptor = { ...originalDescriptor, value: afterTurn }
    Object.defineProperty(clock, 'afterTurn', ownedDescriptor)
    hookActive = true; result.hook.installed = true
    unsubscribe = scene.observeGameTurns(observeTurn, failed)
    if (!controlled) raf = requestAnimationFrame(visit)
  } catch (error) { result.error ??= String(error); stop() }
  return result
}

export function readSpySourceHold(spyId) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const spy = world.units.find(unit => unit.id === spyId)
  return { turn: world.turn, paused: world.paused, animationFrame: scene.gameClock.animationFrame,
    animationTime: scene.gameClock.animationTime, spy: structuredClone(spy) }
}
