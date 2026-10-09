// QA only. Existing callbacks retain all simulation, input, RNG and rendering.
import rules from '../../app/original-rules.json' with { type: 'json' }
import { spiralCell } from '../../app/native-math.ts'

const insist = (ok, message) => {
  if (!ok) throw new Error(message)
}
const person = u =>
  u?.builder?.person ?? u?.flight ?? u?.fight?.motion ?? u?.native ?? u?.entry?.person
const cell = p => ((p.y & 0xfe00) | ((p.x >>> 8) & 254)) >>> 0
const cells = p => [cell(p), ...Array.from({ length: 7 }, (_, i) => spiralCell(cell(p), i, 0))]
const snap = p => ({ x: Math.floor(p.x / 2) * 2 + 1, z: -Math.floor(-p.z / 2) * 2 - 1 })
const nativeXY = p => ({
  x: Math.round((p.x + 8) * 256) & 65535,
  y: Math.round((-p.z - 8) * 256) & 65535,
})

export async function preloadMissionThreeSwarm() {
  await Promise.all([
    import('/app/live-command.ts'),
    import('/app/world-terrain-runtime.ts'),
    import('/app/spell-casting.ts'),
    import('/app/native-math.ts'),
    import('/qa/erosion-ordinary/input.mjs'),
  ])
}

export function swarmCandidate(world, u) {
  const p = person(u)
  const snapshot = u && {
    id: u.id,
    team: u.team,
    kind: u.kind,
    hp: u.hp,
    x: u.x,
    z: u.z,
    inside: u.inside,
    fight: !!u.fight,
    flight: !!u.flight,
    lift: u.lift,
    burnTrail: u.burnTrail ?? 0,
    person:
      p &&
      Object.fromEntries(
        [
          'id',
          'model',
          'tribe',
          'state',
          'previousState',
          'x',
          'y',
          'h',
          'flags2',
          'flags3',
          'flags4',
          'life',
          'damageAttacker',
          'vehicle',
        ].map(key => [key, p[key]])
      ),
  }
  return {
    ...snapshot,
    eligible:
      !!u &&
      !!p &&
      u.team === 'yellow' &&
      u.kind !== 'shaman' &&
      u.hp > 5 &&
      u.inside === null &&
      !u.fight &&
      !u.flight &&
      !u.lift &&
      !u.burnTrail &&
      p.tribe === 2 &&
      p.state !== 23 &&
      p.state !== 26 &&
      !p.vehicle &&
      !(p.flags2 & (0x800000 | 0x100000)) &&
      !(p.flags4 & 0x800) &&
      !(p.flags3 & (0x8000 | 0x80000)) &&
      !(rules.personModels[p.model].flags & 0x100) &&
      !(world.levelFlags2 & 0x04000000) &&
      !(world.manaWorld.gameFlags & 128),
  }
}

export async function readMissionThreeSwarmCandidates() {
  const { missionThreeSwarmDiagnostic } = await import('/scripts/campaign-swarm-target.mjs')
  const scene = window.testSceneRef.current,
    world = scene.world
  insist(window.testStore.getWorld() === world, 'Candidate World changed')
  const diagnostic = missionThreeSwarmDiagnostic(structuredClone(world))
  const candidates = diagnostic.candidates.map(candidate => ({
    ...candidate,
    response: swarmCandidate(
      world,
      world.units.find(u => u.id === candidate.id)
    ),
  }))
  return {
    ...diagnostic,
    candidates,
    target:
      (diagnostic.target &&
        candidates.find(candidate => !candidate.error && candidate.response.eligible)) ||
      null,
  }
}

// Actual screen pick and caster range are rechecked once after the HUD choice.
export async function inspectMissionThreeSwarmTarget({ hit, targetId, shamanId }) {
  const [{ spellTargetError }, { nativePosition }, { spellRange }, { positionDistance }] =
    await Promise.all([
      import('/app/live-command.ts'),
      import('/app/world-terrain-runtime.ts'),
      import('/app/spell-casting.ts'),
      import('/app/native-math.ts'),
    ])
  const scene = window.testSceneRef.current,
    world = scene.world,
    clone = structuredClone(world)
  const actor = clone.units.find(u => u.id === shamanId),
    target = world.units.find(u => u.id === targetId)
  const point = scene.pick({ clientX: hit.x, clientY: hit.y })
  if (!point || !actor || actor.hp <= 0 || actor.team !== 'blue' || actor.kind !== 'shaman')
    return {
      turn: world.turn,
      shamanId,
      targetId,
      point,
      response: swarmCandidate(world, target),
      errors: ['Original caster/pick missing'],
    }
  const response = swarmCandidate(world, target),
    origin = nativePosition(clone, actor),
    destination = nativePosition(clone, point)
  const range = spellRange(clone, actor, 5) * 256,
    distance = positionDistance(origin, destination)
  const impact = snap(point),
    impactNative = nativeXY(impact),
    scan = cells(impactNative)
  const result = {
    turn: world.turn,
    shamanId,
    targetId,
    point: { x: point.x, z: point.z },
    impact,
    impactNative,
    model: 5,
    range,
    distance,
    margin: range - distance,
    expectedScanCells: scan,
    response,
    rejection: spellTargetError(clone, 'swarm', point),
    stock: world.shots.swarm,
    gifts: world.giftCounts.swarm,
    available: world.manaWorld.spells[0].available,
    selected: [...world.selected],
    paused: world.paused,
    mode: world.mode,
    errors: [],
  }
  const check = (ok, message) => {
    if (!ok) result.errors.push(message)
  }
  check(
    scene.world === window.testStore.getWorld() &&
      world.status === 'playing' &&
      !world.inputMask &&
      !world.paused &&
      world.speed === 1 &&
      world.mode === 'swarm' &&
      JSON.stringify(world.selected) === JSON.stringify([shamanId]),
    'Swarm input ownership/readiness changed'
  )
  check(
    document.elementFromPoint(hit.x, hit.y) === scene.renderer.domElement,
    'Swarm canvas ownership changed'
  )
  check(
    result.rejection === null && result.stock > 0 && result.margin >= 128,
    'Actual model5 terrain target is not castable with margin'
  )
  check(
    response.eligible && scan.includes(cell(response.person)),
    'Chosen enemy is not eligible in the expected impact scan'
  )
  check(
    Math.hypot(point.x - hit.spellPreflight.point.x, point.z - hit.spellPreflight.point.z) <= 0.05,
    'Terrain target changed'
  )
  return result
}

export function assertMissionThreeSwarmCast(delivery, observation, expected) {
  const { before, after, pointer } = delivery
  insist(
    before.mode === 'swarm' && after.mode === null && before.turn === after.turn,
    'Swarm handler mode/turn mismatch'
  )
  insist(
    after.stock === before.stock - 1 && after.gifts === before.gifts,
    'Swarm stock/gift debit mismatch'
  )
  const release = pointer.events.filter(event => event.type === 'pointerup')
  insist(
    pointer.restored && pointer.errors.length === 0 && release.length === 1,
    'Incomplete trusted pointer receipt'
  )
  insist(
    release[0].trusted && release[0].canvasOwned && release[0].canvasTarget,
    'Untrusted or unowned Swarm release'
  )
  const picks = release[0].picks.filter(pick => pick.owner === 'scene' && pick.name === 'pick')
  insist(
    picks.length === 1 &&
      !picks[0].threw &&
      picks[0].receiverMatches &&
      JSON.stringify(picks[0].args) === JSON.stringify(release[0].args),
    'Actual Swarm terrain picker missing'
  )
  const fresh = after.projectiles.filter(
    shot => !before.projectiles.some(prior => prior.id === shot.id)
  )
  insist(fresh.length === 1, 'Exactly one fresh Swarm projectile required')
  const shot = fresh[0],
    target = snap(picks[0].point)
  insist(
    shot.spell === 'swarm' &&
      shot.caster === expected.shamanId &&
      shot.phase === 'windup' &&
      shot.remaining === 6 &&
      shot.turns === 0 &&
      shot.visuals.length === 0 &&
      !shot.blastTarget &&
      (shot.destination.x & 65535) === expected.impactNative.x &&
      (shot.destination.y & 65535) === expected.impactNative.y &&
      JSON.stringify(shot.target) === JSON.stringify(target) &&
      JSON.stringify(target) === JSON.stringify(expected.impact),
    'Swarm projectile does not match actual terrain input'
  )
  insist(
    observation.cast?.after.projectiles.some(p => p.id === shot.id && p.team === 'blue'),
    'Synchronous observer missed the cast'
  )
  insist(
    observation.cast.before.statsCast + 1 === observation.cast.after.statsCast &&
      JSON.stringify(observation.cast.before.mana) === JSON.stringify(observation.cast.after.mana),
    'Stocked cast unexpectedly changed immediate mana/stat ownership'
  )
  insist(
    (observation.cast.after.stocks[0] & 15) === after.stock &&
      observation.cast.after.stocks
        .slice(1)
        .every((stock, i) => stock === observation.cast.before.stocks[i + 1]),
    'Swarm stock owner changed'
  )
  return { projectileId: shot.id, target, point: picks[0].point }
}

// Exported for supplied-boundary tests; production installation uses the current
// Scene/store/document below. No fixture establishes browser or gameplay success.
export function attachMissionThreeSwarmObservation(
  scene,
  store,
  expected,
  currentScene = () => scene
) {
  const world = scene.world,
    clock = scene.gameClock,
    renderer = scene.renderer,
    canvas = renderer.domElement
  const shaman = world.units.find(u => u.id === expected.shamanId),
    target = world.units.find(u => u.id === expected.targetId)
  const e = {
    expected,
    cast: null,
    projectileVisits: [],
    arrival: null,
    firstVisit: null,
    scans: [],
    response: null,
    frames: [],
    cue: null,
    audio: 'Cue observation only; audible output and mixer not tested',
    errors: [],
    cleanupErrors: [],
    restored: false,
  }
  const restorers = [],
    originalEffects = new Set(world.effects.map(f => f.id)),
    originalSoundSerial = world.soundSerial
  let before = null,
    pointerBefore = null,
    projectileId = null,
    effect = null,
    closed = false
  const fail = error => {
    if (e.errors.length < 16) e.errors.push(String(error?.stack ?? error))
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
      currentScene() === scene &&
        scene.world === world &&
        store.getWorld() === world &&
        scene.gameClock === clock &&
        scene.renderer === renderer &&
        renderer.domElement === canvas &&
        canvas.isConnected,
      'Swarm observation ownership changed'
    )
    insist(
      world.units.find(u => u.id === shaman.id) === shaman &&
        shaman.hp > 0 &&
        shaman.team === 'blue' &&
        shaman.kind === 'shaman',
      'Original Swarm caster lost'
    )
  }
  const competitor = () => ({
    // Conservative absence check; a competing effect prevents attribution even
    // if it might be far away. Do not infer a leaf damage event from net HP alone.
    effects: world.effects
      .filter(
        f =>
          f !== effect &&
          [
            'blast',
            'blastWave',
            'lightning',
            'fire',
            'firestorm',
            'swamp',
            'swarm',
            'tornado',
            'earthquake',
            'volcano',
            'erosion',
            'angel',
            'firewarriorShot',
          ].includes(f.kind)
      )
      .map(f => f.id),
    projectiles: world.projectiles.filter(p => p.id !== projectileId).map(p => p.id),
    attackers: world.units
      .filter(
        u =>
          u.id !== target.id &&
          u.hp > 0 &&
          u.team !== 'yellow' &&
          (u.target === target.id || u.fight)
      )
      .map(u => u.id),
  })
  const snapshot = () => {
    owner()
    const current = world.units.find(u => u.id === target.id),
      swarm = effect?.swarm
    return {
      turn: world.turn,
      time: world.time,
      paused: world.paused,
      status: world.status,
      speed: world.speed,
      inputMask: world.inputMask,
      targetMatches: current === target,
      target: swarmCandidate(world, current),
      projectile: structuredClone(world.projectiles.find(p => p.id === projectileId) ?? null),
      swarm: swarm && {
        id: effect.id,
        tribe: swarm.tribe,
        phase: swarm.phase,
        remaining: swarm.remaining,
        x: swarm.x,
        y: swarm.y,
        h: swarm.h,
        insects: swarm.insects.length,
        origin: { ...swarm.origin },
        expectedScanCells: cells(swarm),
      },
      competing: competitor(),
    }
  }
  const payment = event => ({
    turn: world.turn,
    trusted: event.isTrusted,
    canvasTarget: event.target === canvas,
    button: event.button,
    stock: world.shots.swarm,
    gifts: world.giftCounts.swarm,
    mode: world.mode,
    selected: [...world.selected],
    statsCast: world.stats.cast,
    mana: world.manaTribes.map(t => ({ available: t.available, mana: t.mana })),
    stocks: world.manaWorld.spells.map(s => s.stocks[5]),
    projectiles: world.projectiles
      .filter(p => p.spell === 'swarm')
      .map(p => ({
        id: p.id,
        caster: p.caster,
        team: p.team,
        target: { ...p.target },
        phase: p.phase,
        remaining: p.remaining,
        turns: p.turns,
      })),
  })
  const beforePointer = event =>
    observe(() => {
      owner()
      insist(!pointerBefore, 'More than one canvas release')
      pointerBefore = payment(event)
    })
  const afterPointer = event =>
    observe(() => {
      owner()
      const after = payment(event)
      e.cast = { before: pointerBefore, after }
      insist(
        pointerBefore &&
          pointerBefore.trusted &&
          after.trusted &&
          after.canvasTarget &&
          after.button === 0,
        'Invalid cast boundary'
      )
      const fresh = after.projectiles.filter(
        p => !pointerBefore.projectiles.some(prior => prior.id === p.id)
      )
      insist(
        fresh.length === 1 && fresh[0].caster === shaman.id && fresh[0].team === 'blue',
        'No unique original-Shaman projectile'
      )
      projectileId = fresh[0].id
    })
  const wrap = (object, key, observeBefore, observeAfter) => {
    const descriptor = Object.getOwnPropertyDescriptor(object, key),
      original = object[key]
    insist(typeof original === 'function', `Missing Swarm callback ${key}`)
    const replacement = function (...args) {
      const prior = observeBefore && observe(() => observeBefore(args))
      let result
      try {
        result = original.apply(this, args)
      } catch (error) {
        fail(error)
        throw error
      }
      if (observeAfter) observe(() => observeAfter(args, prior))
      return result
    }
    object[key] = replacement
    restorers.push(() => {
      insist(object[key] === replacement, `Swarm callback ownership changed: ${key}`)
      if (descriptor) Object.defineProperty(object, key, descriptor)
      else delete object[key]
    })
  }
  const afterTurn = () => {
    if (projectileId === null) return
    owner()
    const created = world.effects.filter(f => !originalEffects.has(f.id) && f.swarm?.tribe === 0)
    insist(created.length <= 1, 'Multiple player Swarm controllers observed')
    if (!effect && created.length) {
      effect = created[0]
      const current = snapshot()
      insist(
        before?.projectile && !current.projectile,
        'Swarm effect arrival is not bound to the declared projectile'
      )
      insist(
        current.swarm.remaining === 200 &&
          current.swarm.phase === 'initializing' &&
          current.swarm.insects === 0 &&
          current.swarm.origin.x === expected.impactNative.x &&
          current.swarm.origin.y === expected.impactNative.y,
        'Missed or mismatched initial Swarm controller'
      )
      e.arrival = current
      const cue = world.sounds.find(
        s =>
          s.cue === 0xa4 && s.serial > originalSoundSerial && s.x === effect.x && s.z === effect.z
      )
      e.cue = cue && { ...cue }
    }
    const after = snapshot()
    if (after.projectile && e.projectileVisits.length < 32)
      e.projectileVisits.push(after.projectile)
    if (before?.swarm?.remaining === 200 && !e.firstVisit) {
      insist(
        after.swarm?.remaining === 199 &&
          after.swarm.phase === 'wandering' &&
          after.swarm.insects === 60,
        'Swarm first controller visit was not observed'
      )
      e.firstVisit = { before, after }
    }
    if (before?.swarm && (before.swarm.remaining & 7) === 0 && e.scans.length < 26) {
      const candidate = before.target
      const expectedEligible =
        before.targetMatches &&
        candidate.eligible &&
        before.swarm.expectedScanCells.includes(cell(candidate.person))
      const uncontested = [before, after].every(s =>
        Object.values(s.competing).every(ids => ids.length === 0)
      )
      const response =
        expectedEligible &&
        uncontested &&
        after.targetMatches &&
        after.target.person?.state === 26 &&
        after.target.hp > 0 &&
        after.target.hp < candidate.hp &&
        after.target.person.damageAttacker === 0
      const scan = { before, after, expectedEligible, uncontested, response }
      e.scans.push(scan)
      if (response && !e.response)
        e.response = {
          ...scan,
          attribution:
            'Expected pre-turn eligibility and actual after-turn panic/net health/attacker; no competing response observed. Not a leaf damage trace.',
        }
    }
    e.latest = after
  }
  const renderBefore = () => {
    if (!effect || e.frames.length >= 3 || e.frames.some(f => f.turn === world.turn)) return null
    owner()
    const group = scene.fxMeshes.get(effect.id),
      sprites = group?.children.filter(s => s.visible)
    if (!group?.visible || group.parent !== scene.objects || !sprites?.length) return null
    const rows = sprites.map(s => ({
      name: s.name,
      nativeSize: s.userData.nativeSize,
      primitive: s.userData.nativePrimitive,
      x: s.position.x,
      y: s.position.y,
      z: s.position.z,
      scale: [s.scale.x, s.scale.y],
      source: s.material?.map?.image?.currentSrc || s.material?.map?.image?.src,
      width: s.material?.map?.image?.width,
      height: s.material?.map?.image?.height,
    }))
    if (!rows.every(s => s.width === 32 && s.height === 32)) return null
    insist(
      group.name === 'swarm-insects' &&
        rows.every(
          s =>
            s.name === 'swarm-insect' &&
            s.source?.split('?')[0].endsWith('/original/insect.png') &&
            s.nativeSize === 7 &&
            s.primitive === 0x11
        ),
      'Wrong natural Swarm presentation resource'
    )
    return {
      effectId: effect.id,
      turn: world.turn,
      beforeFrame: renderer.info.render.frame,
      visibleInsects: rows.length,
      remaining: effect.swarm.remaining,
      sprites: rows,
    }
  }
  const renderAfter = (_args, frame) => {
    if (!frame) return
    owner()
    insist(renderer.info.render.frame === frame.beforeFrame + 1, 'No fresh natural GPU submission')
    insist(
      canvas.width > 0 && canvas.height > 0 && canvas.width * canvas.height <= 2_000_000,
      'Swarm frame capture bounds exceeded'
    )
    e.frames.push({
      ...frame,
      afterFrame: renderer.info.render.frame,
      width: canvas.width,
      height: canvas.height,
      png: canvas.toDataURL('image/png'),
    })
  }
  const finish = () => {
    if (closed) return e
    closed = true
    observe(() => {
      e.terminal = snapshot()
    })
    for (const restore of restorers.reverse())
      try {
        restore()
      } catch (error) {
        e.cleanupErrors.push(String(error))
      }
    e.restored = e.cleanupErrors.length === 0
    return e
  }
  try {
    insist(shaman && target, 'Original caster and selected target required')
    owner()
    insist(
      !world.effects.some(f => f.swarm?.tribe === 0),
      'An earlier player Swarm is already active'
    )
    wrap(
      clock,
      'beforeTurn',
      () => {
        if (projectileId !== null) before = snapshot()
      },
      null
    )
    wrap(clock, 'afterTurn', null, afterTurn)
    wrap(renderer, 'render', renderBefore, renderAfter)
    canvas.addEventListener('pointerup', beforePointer, true)
    restorers.push(() => canvas.removeEventListener('pointerup', beforePointer, true))
    canvas.addEventListener('pointerup', afterPointer)
    restorers.push(() => canvas.removeEventListener('pointerup', afterPointer))
  } catch (error) {
    finish()
    throw error
  }
  return {
    evidence: e,
    finish,
    status() {
      owner()
      return {
        turn: world.turn,
        paused: world.paused,
        status: world.status,
        speed: world.speed,
        inputMask: world.inputMask,
        animationFrame: clock.animationFrame,
        renderFrame: renderer.info.render.frame,
        projectileId,
        effectId: effect?.id ?? null,
        frames: e.frames.length,
        response: !!e.response,
        arrival: !!e.arrival,
        firstVisit: !!e.firstVisit,
        cue: !!e.cue,
        errors: [...e.errors],
      }
    },
  }
}

export function installMissionThreeSwarmObservation(expected) {
  insist(!window.m3Swarm, 'Swarm observer already installed')
  const api = attachMissionThreeSwarmObservation(
    window.testSceneRef.current,
    window.testStore,
    expected,
    () => window.testSceneRef.current
  )
  window.m3Swarm = api
  // The host takes an owned JSHandle before the first status/read. There is no
  // fallible post-install read between installing callbacks and returning it.
  return api
}

export function finishMissionThreeSwarmObservation(api) {
  const evidence = api.finish()
  if (window.m3Swarm === api) delete window.m3Swarm
  else {
    evidence.cleanupErrors.push('Swarm global API ownership changed; foreign API preserved')
    evidence.restored = false
  }
  return evidence
}

export function assertMissionThreeSwarmEvidence(e) {
  insist(
    e.restored && !e.cleanupErrors.length && !e.errors.length,
    'Swarm observation/cleanup failed'
  )
  insist(
    e.arrival && e.firstVisit && e.response && e.cue && e.frames.length >= 2,
    'Ordinary Swarm evidence is incomplete'
  )
  insist(
    new Set(e.frames.map(f => f.turn)).size === e.frames.length &&
      e.frames.every(
        f =>
          f.afterFrame === f.beforeFrame + 1 &&
          f.visibleInsects > 0 &&
          f.png?.startsWith('data:image/png;base64,')
      ),
    'Natural insect frame proof is incomplete'
  )
  return {
    projectileId: e.cast.after.projectiles.find(
      p => !e.cast.before.projectiles.some(b => b.id === p.id)
    ).id,
    effectId: e.arrival.swarm.id,
    responseTurn: e.response.after.turn,
    frameTurns: e.frames.map(f => f.turn),
    visiblePixels: 'Pending independent inspection of retained natural frames',
  }
}
