// Page-serializable observations. Live World, time and storage are never written.
export async function installTempleRouteObservation({ returnApi = false } = {}) {
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
    throw new Error('Fresh M3 observation required')
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
  const api = {
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
      const evidence = api.vaultApproach?.finish()
      if (window.m3TempleRoute === api) delete window.m3TempleRoute
      else if (evidence) {
        evidence.cleanupErrors.push('Temple route API ownership changed; foreign API preserved')
        evidence.restored = false
      } else throw new Error('Temple route API ownership changed; foreign API preserved')
      return evidence
    },
  }
  window.m3TempleRoute = api
  // Capture this API before any fallible first read when callbacks will be armed.
  return returnApi ? api : api.read()
}

export async function armTempleVaultApproach(api) {
  const [{ currentPersonOrder }, { buildingFootprintCells }] = await Promise.all([
    import('/app/person-orders.ts'),
    import('/app/building-shapes.ts'),
  ])
  return attachTempleVaultApproach(api, { currentPersonOrder, buildingFootprintCells })
}

// Narrow read-only extension of the captured Temple route owner. Supplied clocks
// in contract tests establish observer semantics, never ordinary browser evidence.
export function attachTempleVaultApproach(
  api,
  { currentPersonOrder, buildingFootprintCells },
  now = () => performance.now()
) {
  const insist = (ok, message) => {
    if (!ok) throw new Error(message)
  }
  const { scene, world, shaman } = api
  const clock = scene.gameClock,
    renderer = scene.renderer,
    canvas = renderer.domElement
  const root = scene.scene,
    camera = scene.camera,
    objects = scene.objects
  const vault = world.shrines.find(s => s.kind === 'vault' && s.reward === 'temple')
  const person = shaman.native,
    actorGroup = scene.unitMeshes.get(shaman.id)
  const vaultGroup = scene.shrineMeshes.get(vault?.id)?.g
  const pose = { object: 154, angle: 0, anchorX: 57856, anchorY: 31744 }
  const footprint = new Set(buildingFootprintCells(pose))
  const cell = p => ((p.y & 65535) >>> 9) * 128 + ((p.x & 65535) >>> 9)
  const e = {
    pose,
    footprint: [...footprint],
    input: null,
    rows: [],
    phases: {},
    prayer: null,
    opening: null,
    reward: null,
    unlock: null,
    completion: null,
    giftVisits: 0,
    crossings: { count: 0, first: null, last: null },
    frames: [],
    rejections: {},
    errors: [],
    cleanupErrors: [],
    restored: false,
    bound: null,
  }
  const restorers = []
  let closed = false,
    halted = false,
    before = null,
    pointerBefore = null,
    orderId = null,
    acceptedOrder = null
  let startedAt = now(),
    firstTurn = world.turn,
    giftId = null
  const fail = error => {
    if (e.errors.length < 16) e.errors.push(String(error?.stack ?? error))
    halted = true
  }
  const observe = fn => {
    try {
      return fn()
    } catch (error) {
      fail(error)
      return null
    }
  }
  const owner = () => {
    insist(
      window.m3TempleRoute === api &&
        window.testSceneRef.current === scene &&
        window.testStore.getWorld() === world &&
        scene.world === world &&
        scene.gameClock === clock &&
        scene.renderer === renderer &&
        renderer.domElement === canvas &&
        scene.scene === root &&
        scene.camera === camera &&
        scene.objects === objects &&
        canvas.isConnected,
      'Vault observation ownership changed'
    )
    insist(
      world.units.find(u => u.id === shaman.id) === shaman &&
        shaman.native === person &&
        world.objectCells.objects.get(shaman.id) === person &&
        shaman.hp > 0 &&
        world.shrines.find(s => s.id === vault.id) === vault,
      'Original Vault actor/target lost'
    )
  }
  const budget = () => {
    if (closed || halted || (e.completion && e.unlock)) return false
    if (now() - startedAt >= 420000 || world.turn - firstTurn > 4000 || e.rows.length >= 4000) {
      e.bound = { turn: world.turn, elapsedMs: now() - startedAt, pairs: e.rows.length }
      fail('Vault observation turn/wall bound exceeded; collection stopped')
      return false
    }
    return true
  }
  const snapshot = () => {
    owner()
    insist(
      world.status === 'playing' && !world.paused && world.speed === 1 && !world.inputMask,
      'Vault ordinary world readiness changed'
    )
    const order = currentPersonOrder(world.buildingOrders, person)
    insist(
      !acceptedOrder || order?.model !== 33 || order === acceptedOrder,
      'Original Vault order object changed'
    )
    const gifts = world.gifts.filter(g => g.reward === 'temple')
    insist(gifts.length <= 1, 'More than one Temple gift')
    const gift = gifts[0]
    return {
      turn: world.turn,
      time: world.time,
      animationFrame: clock.animationFrame,
      actorId: shaman.id,
      vaultId: vault.id,
      nativeRegistered: true,
      p: Object.fromEntries(
        [
          'x',
          'y',
          'h',
          'goalX',
          'goalY',
          'state',
          'commandStatus',
          'commandPhase',
          'flags2',
          'timer',
          'workTarget',
          'target',
        ].map(k => [k, person[k]])
      ),
      entering: !!(person.flags2 & 0x40000000),
      occupied: footprint.has(cell(person)),
      orderId: person.immediateCommand || person.commands[person.commandCursor],
      order:
        order &&
        Object.fromEntries(['model', 'a', 'b', 'flags', 'references'].map(k => [k, order[k]])),
      task: shaman.vault && { ...shaman.vault },
      work: shaman.work,
      vault: Object.fromEntries(
        ['model', 'active', 'enabled', 'work', 'target', 'followers', 'uses', 'forced'].map(k => [
          k,
          vault[k],
        ])
      ),
      morph: vault.morph ? { ...vault.morph } : null,
      unlocked: world.unlockedTemple,
      gift: gift && {
        id: gift.id,
        phase: gift.phase,
        remaining: gift.remaining,
        source: gift.buildingAcquisition && { ...gift.buildingAcquisition },
      },
    }
  }
  const pair = () => {
    if (!e.input || !budget()) return
    insist(before, 'Missing natural before-turn observation')
    const after = snapshot(),
      index = e.rows.length
    insist(after.turn === before.turn + 1, 'Natural Vault turn pair is not consecutive')
    e.rows.push({ before, after })
    for (const row of [before, after]) {
      if (row.order?.model === 33)
        insist(
          row.orderId === orderId && row.order.a === vault.id && !(row.order.flags & 1),
          'Vault command owner/target changed'
        )
      if (
        [1, 2].includes(row.p.commandPhase) &&
        row.vault.model === 154 &&
        !row.vault.uses &&
        row.occupied
      ) {
        e.crossings.count++
        e.crossings.first ??= { index, turn: row.turn, x: row.p.x, y: row.p.y }
        e.crossings.last = { index, turn: row.turn, x: row.p.x, y: row.p.y }
      }
    }
    if (after.order?.model === 33 && !after.entering && [1, 4, 7, 9].includes(after.p.commandPhase))
      e.phases[after.p.commandPhase] ??= index
    if (
      !e.prayer &&
      [before, after].every(
        s =>
          s.p.commandPhase === 2 &&
          !s.entering &&
          s.p.state === 10 &&
          s.p.commandStatus === 33 &&
          s.vault.model === 154 &&
          !s.morph &&
          !s.vault.uses &&
          !s.vault.forced &&
          !s.occupied
      ) &&
      after.vault.work > before.vault.work
    )
      e.prayer = { index }
    if (!e.opening && before.vault.model === 154 && after.morph?.to === 153) e.opening = { index }
    if (after.vault.uses !== before.vault.uses) {
      insist(
        !e.reward &&
          before.vault.uses === 0 &&
          after.vault.uses === 1 &&
          after.gift &&
          after.gift.source?.head === 91 &&
          after.gift.source?.reward === 92 &&
          after.gift.source?.model === 5 &&
          after.gift.remaining === 82 &&
          !after.unlocked,
        'Vault use/gift edge is missing or duplicated'
      )
      giftId = after.gift.id
      e.reward = { index, giftId }
    }
    if (before.gift && before.gift.id === giftId) {
      insist(
        after.gift
          ? after.gift.id === giftId && after.gift.remaining === before.gift.remaining - 1
          : before.gift.remaining === 1 && after.unlocked,
        'Temple gift continuation changed'
      )
      e.giftVisits++
    }
    if (!before.unlocked && after.unlocked) {
      insist(
        e.reward && !e.unlock && e.giftVisits === 82,
        'Temple unlock is not its delayed gift edge'
      )
      e.unlock = { index }
    }
    if (before.order?.model === 33 && after.order?.model !== 33) {
      insist(
        e.phases[9] !== undefined &&
          before.p.commandPhase === 9 &&
          !after.task &&
          after.work === null,
        'Vault command released before ordinary departure'
      )
      e.completion = { index }
    }
  }
  const releaseBefore = event =>
    observe(() => {
      if (!budget()) return
      insist(!pointerBefore, 'More than one Vault release')
      pointerBefore = {
        state: snapshot(),
        trusted: event.isTrusted,
        button: event.button,
        canvasTarget: event.target === canvas,
        selected: [...world.selected],
      }
    })
  const releaseAfter = event =>
    observe(() => {
      if (!budget()) return
      const after = snapshot()
      insist(
        pointerBefore?.trusted &&
          event.isTrusted &&
          event.target === canvas &&
          event.button === 0 &&
          pointerBefore.canvasTarget &&
          pointerBefore.button === 0 &&
          JSON.stringify(pointerBefore.selected) === JSON.stringify([shaman.id]) &&
          JSON.stringify(world.selected) === JSON.stringify([shaman.id]) &&
          after.turn === pointerBefore.state.turn &&
          after.order?.model === 33 &&
          after.order.a === vault.id &&
          after.p.commandPhase === 0 &&
          after.entering,
        'Invalid synchronous Vault command boundary'
      )
      orderId = after.orderId
      acceptedOrder = currentPersonOrder(world.buildingOrders, person)
      e.input = { before: pointerBefore.state, after }
      firstTurn = after.turn
      startedAt = now()
    })
  const wrap = (object, key, prior, post) => {
    const descriptor = Object.getOwnPropertyDescriptor(object, key),
      original = object[key]
    insist(typeof original === 'function', `Missing Vault callback ${key}`)
    const replacement = function (...args) {
      const value = prior && observe(() => prior(args))
      let result
      try {
        result = original.apply(this, args)
      } catch (error) {
        fail(error)
        throw error
      }
      if (post) observe(() => post(args, value))
      return result
    }
    object[key] = replacement
    restorers.push(() => {
      insist(object[key] === replacement, `Vault callback ownership changed: ${key}`)
      if (descriptor) Object.defineProperty(object, key, descriptor)
      else delete object[key]
    })
  }
  const reject = reason => {
    e.rejections[reason] = (e.rejections[reason] ?? 0) + 1
    return null
  }
  const renderBefore = args => {
    if (!e.input || !budget()) return null
    const state = snapshot(),
      phase = state.p.commandPhase
    const label =
      phase === 1 && !state.entering
        ? 'approach'
        : phase === 2 && e.prayer && state.vault.model === 154 && !state.morph
          ? 'prayer'
          : phase === 4 && !state.entering
            ? 'entry'
            : phase === 5 && !state.entering && !e.frames.some(f => f.label === 'entry')
              ? 'entry-gap-phase5'
              : null
    if (!label || e.frames.some(f => f.label === label) || e.frames.length >= 4) return null
    insist(args[0] === root && args[1] === camera, 'Vault render owner changed')
    insist(
      scene.unitMeshes.get(shaman.id) === actorGroup &&
        scene.shrineMeshes.get(vault.id)?.g === vaultGroup &&
        actorGroup.parent === objects &&
        vaultGroup.parent === objects,
      'Vault render group ownership changed'
    )
    if (phase === 1 && Math.hypot(state.p.x - 58112, state.p.y - 30976) > 2048) return null
    const child = vaultGroup.children[0],
      layers = actorGroup.userData.layers?.filter(s => s.visible) ?? []
    const ready = mesh => {
      const img = mesh.material?.map?.image
      return img && img.width > 0 && img.height > 0
    }
    if (
      !actorGroup.visible ||
      !vaultGroup.visible ||
      !child?.visible ||
      !layers.length ||
      !layers.every(ready) ||
      !ready(child)
    )
      return reject('presentation-not-ready')
    insist(child.userData.nativeModel === state.vault.model, 'Vault presented model is stale')
    const points = [scene.unitScreen(shaman.id), scene.view.screen(vaultGroup.position, camera)]
    if (!points.every(p => p && Math.abs(p.x) < 0.95 && Math.abs(p.y) < 0.95 && Math.abs(p.z) <= 1))
      return reject('out-of-frame')
    const xyz = p => ({ x: p.x, y: p.y, z: p.z })
    return {
      label,
      state,
      sequence: e.rows.length - 1,
      beforeFrame: renderer.info.render.frame,
      actorPosition: xyz(actorGroup.position),
      vaultPosition: xyz(vaultGroup.position),
      model: child.userData.nativeModel,
      camera: { ...scene.cameraPosition },
      texture: {
        source: child.material.map.image.currentSrc || child.material.map.image.src,
        width: child.material.map.image.width,
        height: child.material.map.image.height,
      },
      projection: Object.fromEntries(
        ['width', 'height', 'scale', 'perspective', 'curvature'].map(k => [
          k,
          scene.view?.projection?.[k],
        ])
      ),
      viewport: { width: canvas.width, height: canvas.height },
      dpr: window.devicePixelRatio,
      screen: points.map(p => ({ x: p.x, y: p.y })),
    }
  }
  const renderAfter = (_args, frame) => {
    if (!frame || !budget()) return
    owner()
    insist(renderer.info.render.frame === frame.beforeFrame + 1, 'No fresh natural Vault frame')
    insist(
      canvas.width > 0 && canvas.height > 0 && canvas.width * canvas.height <= 2000000,
      'Vault capture dimensions exceeded'
    )
    e.frames.push({
      ...frame,
      afterFrame: renderer.info.render.frame,
      png: canvas.toDataURL('image/png'),
    })
  }
  const finish = () => {
    if (closed) return e
    closed = true
    for (const restore of restorers.reverse())
      try {
        restore()
      } catch (error) {
        e.cleanupErrors.push(String(error))
      }
    e.restored = e.cleanupErrors.length === 0
    return e
  }
  insist(!api.vaultApproach, 'Vault observation already armed')
  try {
    insist(
      shaman.id === 46 &&
        vault?.id === 92 &&
        actorGroup &&
        vaultGroup &&
        !world.unlockedTemple &&
        vault.uses === 0 &&
        vault.model === 154,
      'Fresh authored M3 Vault required'
    )
    owner()
    wrap(
      clock,
      'beforeTurn',
      () => {
        if (e.input && budget()) before = snapshot()
      },
      null
    )
    wrap(clock, 'afterTurn', null, pair)
    wrap(renderer, 'render', renderBefore, renderAfter)
    canvas.addEventListener('pointerup', releaseBefore, true)
    restorers.push(() => canvas.removeEventListener('pointerup', releaseBefore, true))
    canvas.addEventListener('pointerup', releaseAfter)
    restorers.push(() => canvas.removeEventListener('pointerup', releaseAfter))
  } catch (error) {
    finish()
    throw error
  }
  api.vaultApproach = {
    evidence: e,
    finish,
    status() {
      owner()
      budget()
      return {
        complete: !!(e.completion && e.unlock),
        turn: world.turn,
        animationFrame: clock.animationFrame,
        rows: e.rows.length,
        errors: [...e.errors],
      }
    },
  }
  return api.vaultApproach.status()
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
    throw new Error('Temple placement precondition changed')
  if (window.finishTemplePlacement) throw new Error('A Temple input observer is already armed')
  const pointer = observeEntityPointer(scene),
    record = { preflight: observer.read(), before: null, after: null, errors: [] }
  const before = () => {
    try {
      record.before = observer.read()
    } catch (error) {
      record.errors.push(String(error))
    }
  }
  const after = () => {
    try {
      record.after = observer.read()
    } catch (error) {
      record.errors.push(String(error))
    }
  }
  scene.renderer.domElement.addEventListener('pointerup', before, true)
  scene.renderer.domElement.addEventListener('pointerup', after)
  window.finishTemplePlacement = () => {
    scene.renderer.domElement.removeEventListener('pointerup', before, true)
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
    throw new Error('Public Save unavailable')
  const record = { saved: null, error: null }
  const capture = event => {
    try {
      if (!event.isTrusted || (event.target !== button && !button.contains(event.target)))
        throw new Error('Trusted public Save required')
      const observer = window.m3TempleRoute
      if (observer.world !== window.testStore.getWorld()) throw new Error('Save World replaced')
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
      reject(new Error('Missing checkpoint database'))
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
      tx.onabort = () => reject(tx.error ?? new Error('Checkpoint read aborted'))
    })
    return record
      ? { version: record.version, summary: window.m3TempleRoute.summary(record.world) }
      : null
  } finally {
    db.close()
  }
}
