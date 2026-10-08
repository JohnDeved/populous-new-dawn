// Page-serializable observations. Live World, time and storage are never written.
export async function installTempleRouteObservation() {
  const [{ currentPersonOrder }, { buildingStage }, { campaignShamanReadiness }] =
    await Promise.all([
      import('/app/person-orders.ts'),
      import('/app/world-terrain-runtime.ts'),
      import('/scripts/campaign-start-readiness.mjs'),
    ])
  const scene = window.testSceneRef.current,
    world = scene.world
  const shaman = world.units.find(
    unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
  )
  if (world.outcome.level !== 3 || !shaman || window.m3TempleRoute)
    throw Error('Fresh M3 observation required')
  const building = b => ({
    id: b.id,
    kind: b.kind,
    team: b.team,
    object: b.object,
    x: b.x,
    z: b.z,
    hp: b.hp,
    progress: b.progress,
    logs: b.logs,
    stage: buildingStage(b),
    builders: [...(b.builders ?? [])],
  })
  const summary = w => ({
    level: w.outcome.level,
    turn: w.turn,
    time: w.time,
    paused: w.paused,
    unlocked: w.unlockedTemple,
    stats: structuredClone(w.stats),
    vault: w.shrines
      .filter(head => head.kind === 'vault' && head.reward === 'temple')
      .map(head => ({
        id: head.id,
        x: head.x,
        z: head.z,
        active: head.active,
        uses: head.uses,
        remaining: head.remaining,
      })),
    temples: w.buildings.filter(b => b.team === 'blue' && b.kind === 'temple').map(building),
    actors: w.units
      .filter(u => u.team === 'blue')
      .map(u => ({ id: u.id, kind: u.kind, hp: u.hp, x: u.x, z: u.z })),
  })
  window.m3TempleRoute = {
    scene,
    world,
    shaman,
    summary,
    read() {
      const gl = scene.renderer.getContext()
      return {
        ...summary(world),
        speed: world.speed,
        status: world.status,
        inputMask: world.inputMask,
        mode: world.mode,
        selected: [...world.selected],
        readiness: campaignShamanReadiness(world),
        sceneMatches:
          window.testSceneRef.current === scene &&
          window.testStore.getWorld() === world &&
          scene.world === world,
        actorMatches: world.units.find(u => u.id === shaman.id) === shaman,
        connected: scene.renderer.domElement.isConnected,
        started: scene.started,
        loading: !!document.querySelector('.loading-world'),
        contextLost: gl.isContextLost(),
        animationFrame: scene.gameClock.animationFrame,
        units: world.units
          .filter(u => u.team === 'blue')
          .map(u => {
            const person =
              u.builder?.person ?? u.flight ?? u.fight?.motion ?? u.native ?? u.entry?.person
            return {
              id: u.id,
              kind: u.kind,
              team: u.team,
              hp: u.hp,
              x: u.x,
              z: u.z,
              inside: u.inside,
              work: u.work,
              orderId: person && (person.immediateCommand || person.commands[person.commandCursor]),
              order: person
                ? structuredClone(currentPersonOrder(world.buildingOrders, person))
                : null,
            }
          }),
      }
    },
    close() {
      delete window.m3TempleRoute
    },
  }
  return window.m3TempleRoute.read()
}

// Historical accepted search around (24,70), with the maintained integer input
// rule applied before picking/ownership/placement validation. Validators get clones.
export async function findTempleGround() {
  const { placementError } = await import('/app/model.ts')
  const scene = window.testSceneRef.current,
    rect = scene.renderer.domElement.getBoundingClientRect()
  const probe = structuredClone(scene.world),
    visited = new Set()
  const rejections = { ownership: 0, object: 0, pick: 0, placement: 0 }
  for (let radius = 0; radius <= 12; radius++)
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const target = { x: 24 + Math.cos(angle) * radius, z: 70 + Math.sin(angle) * radius }
      const projected = scene.screen(target)
      const hit = {
        x: Math.round(rect.left + ((projected.x + 1) * rect.width) / 2),
        y: Math.round(rect.top + ((1 - projected.y) * rect.height) / 2),
      }
      const key = `${hit.x},${hit.y}`
      if (visited.has(key)) continue
      visited.add(key)
      const event = { clientX: hit.x, clientY: hit.y }
      if (document.elementFromPoint(hit.x, hit.y) !== scene.renderer.domElement) {
        rejections.ownership++
        continue
      }
      if (
        scene.pickUnit(event) ||
        scene.picking.pickPerson(event) ||
        scene.pickWorldObject(event)
      ) {
        rejections.object++
        continue
      }
      const point = scene.pick(event)
      if (!point || Math.hypot(point.x - target.x, point.z - target.z) >= 1.5) {
        rejections.pick++
        continue
      }
      if (placementError(probe, 'temple', point)) {
        rejections.placement++
        continue
      }
      return { ...hit, point: { x: point.x, z: point.z }, requested: target, rejections }
    }
  return { rejection: 'No owned empty legal Temple site in the accepted search', rejections }
}

// One actual handler dispatch; retain before/after recipient and picker evidence
// even when a later assertion fails. No direct call to placeBuilding is made here.
export async function armTemplePlacement({ hit, selected }) {
  const [{ placementError }, { observeEntityPointer }] = await Promise.all([
    import('/app/model.ts'),
    import('/qa/erosion-ordinary/input.mjs'),
  ])
  const observer = window.m3TempleRoute,
    scene = observer.scene,
    world = observer.world
  const event = { clientX: hit.x, clientY: hit.y },
    point = scene.pick(event)
  if (
    world !== window.testStore.getWorld() ||
    world.paused ||
    world.inputMask ||
    world.mode !== 'temple' ||
    JSON.stringify(world.selected) !== JSON.stringify(selected) ||
    document.elementFromPoint(hit.x, hit.y) !== scene.renderer.domElement ||
    scene.pickUnit(event) ||
    scene.picking.pickPerson(event) ||
    scene.pickWorldObject(event) ||
    !point ||
    Math.hypot(point.x - hit.point.x, point.z - hit.point.z) > 0.05 ||
    placementError(structuredClone(world), 'temple', point)
  )
    throw Error('Temple placement precondition changed')
  if (window.finishTemplePlacement) throw Error('A Temple input observer is already armed')
  const pointer = observeEntityPointer(scene),
    record = { before: observer.read(), after: null, errors: [] }
  const after = () => {
    try {
      record.after = observer.read()
    } catch (error) {
      record.errors.push(String(error))
    }
  }
  scene.renderer.domElement.addEventListener('pointerup', after)
  window.finishTemplePlacement = () => {
    scene.renderer.domElement.removeEventListener('pointerup', after)
    delete window.finishTemplePlacement
    return { ...record, pointer: pointer.finish() }
  }
}

export function readTemplePresentation(id) {
  const observer = window.m3TempleRoute,
    scene = observer.scene
  const group = scene.buildingMeshes.get(id),
    meshes = []
  group?.traverse(mesh => {
    if (mesh.userData.nativeModel === undefined) return
    const map = mesh.material?.map,
      image = map?.image
    meshes.push({
      nativeModel: mesh.userData.nativeModel,
      stage: mesh.userData.stage,
      visible: mesh.visible,
      material: mesh.material?.type,
      texture: image?.currentSrc ?? image?.src ?? null,
      imageWidth: image?.width ?? 0,
      imageHeight: image?.height ?? 0,
      colorSpace: map?.colorSpace,
      minFilter: map?.minFilter,
      magFilter: map?.magFilter,
      vertices: mesh.geometry?.attributes?.position?.count,
    })
  })
  const rect = scene.renderer.domElement.getBoundingClientRect()
  const projected = group && scene.screen(group.position)
  const screen = projected && {
    x: rect.left + ((projected.x + 1) * rect.width) / 2,
    y: rect.top + ((1 - projected.y) * rect.height) / 2,
  }
  return {
    id,
    frame: scene.renderer.info.render.frame,
    signature: group?.userData.signature,
    visible: !!group?.visible,
    meshes,
    screen,
    canvasOwned:
      !!screen &&
      screen.x >= 0 &&
      screen.x < innerWidth &&
      screen.y >= 0 &&
      screen.y < innerHeight &&
      document.elementFromPoint(screen.x, screen.y) === scene.renderer.domElement,
    viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
  }
}

// The synchronous trusted Save click pins bounded gameplay identity. The existing
// typed checkpoint observer separately hashes the complete committed IDB record.
export function armTempleSave() {
  const button = [...document.querySelectorAll('button')].find(
    b => b.textContent.trim() === 'Save checkpoint'
  )
  if (!button?.isConnected || button.disabled || window.finishTempleSave)
    throw Error('Public Save unavailable')
  const record = { saved: null, error: null }
  const capture = event => {
    try {
      if (!event.isTrusted || (event.target !== button && !button.contains(event.target)))
        throw Error('Trusted public Save required')
      const observer = window.m3TempleRoute
      if (observer.world !== window.testStore.getWorld()) throw Error('Save World replaced')
      record.saved = observer.summary(observer.world)
    } catch (error) {
      record.error = String(error)
    }
  }
  button.addEventListener('click', capture, { capture: true, once: true })
  window.finishTempleSave = () => {
    button.removeEventListener('click', capture, true)
    delete window.finishTempleSave
    return record
  }
}

export async function readCommittedTempleSummary() {
  if (!(await indexedDB.databases()).some(db => db.name === 'populous-new-dawn')) return null
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('populous-new-dawn')
    request.onupgradeneeded = () => {
      request.transaction.abort()
      reject(Error('Missing checkpoint database'))
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    const record = await new Promise((resolve, reject) => {
      const tx = db.transaction('checkpoints', 'readonly'),
        request = tx.objectStore('checkpoints').get('latest')
      tx.oncomplete = () => resolve(request.result)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error ?? Error('Checkpoint read aborted'))
    })
    return record
      ? { version: record.version, summary: window.m3TempleRoute.summary(record.world) }
      : null
  } finally {
    db.close()
  }
}
