// Page-serializable, read-only ordinary RAF observer. It does not replace a
// clock/controller/render method, inject a phase, issue input or pause the game.
export function installSpySourceObserver({ spyId, targetId }) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const canvas = scene.renderer.domElement
  const result = { spyId, targetId, samples: [], crops: [], runtime: [], error: null, done: false }
  const copies = [], copied = new Set()
  let raf, stopped = false, visits = 0, lastKey
  const stop = () => { stopped = true; cancelAnimationFrame(raf); return result }
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
        orders: [p.immediateCommand, ...p.commands].map(id => ({ id, record: world.buildingOrders.records[id] })) } : null])),
      nearbyActors: origin ? world.units.filter(u => u.hp > 0 && u.inside === null &&
        ['blue', 'red', 'yellow', 'green'].indexOf(u.team) === tribe &&
        near(cell(u).x, origin.x) && near(cell(u).y, origin.y)).map(u => ({ id: u.id,
        team: u.team, kind: u.kind, hp: u.hp, cell: cell(u) })) : [] }
  }
  const visit = () => {
    if (stopped) return
    try {
      if (++visits > 45 * 240) throw Error('Spy observer exceeded visit bound')
      if (window.testSceneRef.current !== scene || window.testStore.getWorld() !== world || scene.world !== world)
        throw Error('Spy observer lost the loaded Scene/world')
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
          const overlays = [...document.querySelectorAll('.native-hud,.paused-badge,.campaign-messages summary,.campaign-messages details[open]>div,.fps-graph,.hud-description,.world-message,.target-prompt,dialog[open],.loading-world')]
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
        result.samples.push(sample)
        if (result.samples.length > 600) throw Error('Spy observer exceeded sample bound')
        if (copied.size === 2) result.done = true
      }
    } catch (error) { result.error = String(error); stop(); return }
    raf = requestAnimationFrame(visit)
  }
  window.__pndSpySourceObservation = { result, stop, retain, readRuntime }
  raf = requestAnimationFrame(visit)
}

export function readSpySourceHold(spyId) {
  const scene = window.testSceneRef.current, world = window.testStore.getWorld()
  const spy = world.units.find(unit => unit.id === spyId)
  return { turn: world.turn, paused: world.paused, animationFrame: scene.gameClock.animationFrame,
    animationTime: scene.gameClock.animationTime, spy: structuredClone(spy) }
}
