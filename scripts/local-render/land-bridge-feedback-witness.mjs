// Passive observation of one ordinary Bridge projectile, its real effect consumer,
// and the first naturally committed, visible success status. No game progression.
export function installLandBridgeFeedbackWitness({ actorId, expected = 'Land Bridge cast.' }) {
  if (window.landBridgeFeedback) throw Error('Bridge feedback observer already exists')
  const scene = window.testSceneRef.current,
    world = scene.world,
    clock = scene.gameClock,
    canvas = scene.renderer.domElement,
    actor = world.units.find(unit => unit.id === actorId)
  const evidence = {
    expected,
    actorId,
    errors: [],
    birth: null,
    consumed: null,
    firstVisible: null,
    restored: false,
  }
  const check = (value, text) => {
    if (!value) throw Error(text)
  }
  const note = error => {
    if (evidence.errors.length < 8) evidence.errors.push(String(error?.stack ?? error))
  }
  const observe = callback => {
    try {
      callback()
    } catch (error) {
      note(error)
    }
  }
  const owners = () => {
    check(
      window.testSceneRef.current === scene &&
        scene.world === world &&
        window.testStore.getWorld() === world,
      'Bridge scene/store ownership changed'
    )
    check(
      scene.gameClock === clock &&
        scene.renderer.domElement === canvas &&
        canvas.isConnected &&
        scene.started &&
        !scene.disposed,
      'Bridge clock/canvas lifecycle changed'
    )
    check(
      world.units.find(unit => unit.id === actorId) === actor &&
        actor?.hp > 0 &&
        actor.kind === 'shaman' &&
        actor.team === 'blue',
      'Original Bridge Shaman changed'
    )
    check(
      world.outcome.level === 1 && world.speed === 1 && world.status === 'playing',
      'Ordinary M1 state changed'
    )
  }
  owners()
  check(
    world.inputMask === 0 &&
      world.shots.bridge === 1 &&
      world.giftCounts.bridge > 0 &&
      world.stats.bridges === 0 &&
      !world.effects.some(effect => effect.bridge) &&
      !world.projectiles.some(shot => shot.spell === 'bridge'),
    'One earned, unused M1 Bridge shot required'
  )
  for (const [owner, key] of [
    [clock, 'beforeTurn'],
    [clock, 'afterTurn'],
    [scene, 'animateFx'],
  ])
    check(typeof owner[key] === 'function', `Missing Bridge callback ${key}`)
  const snapshot = () => ({
    turn: world.turn,
    time: world.time,
    inputMask: world.inputMask,
    paused: world.paused,
    stock: world.shots.bridge,
    gifts: world.giftCounts.bridge,
    bridges: world.stats.bridges,
    message: world.message,
    messageUntil: world.messageUntil,
    routeNotice: structuredClone(world.routeNotice),
    landVersion: world.landVersion,
    actorId,
    worldMatches: scene.world === world && window.testStore.getWorld() === world,
  })
  const initialEffects = new Set(world.effects.map(effect => effect.id)),
    restorers = []
  let projectile = null,
    effect = null,
    controller = null,
    before = null,
    closed = false,
    api = null
  const shotState = shot => ({
    id: shot.id,
    caster: shot.caster,
    spell: shot.spell,
    phase: shot.phase,
    remaining: shot.remaining,
    turns: shot.turns,
    source: { ...shot.source },
    target: { ...shot.target },
    destination: { ...shot.destination },
  })
  const dom = () => {
    owners()
    const element = document.querySelector('.world-message[role="status"]:not(.route-notice)')
    if (!element) return null
    const rect = element.getBoundingClientRect(),
      style = getComputedStyle(element)
    const ancestors = []
    for (let node = element; node; node = node.parentElement) {
      const css = getComputedStyle(node)
      ancestors.push({
        display: css.display,
        visibility: css.visibility,
        opacity: css.opacity,
        hidden: node.hidden,
      })
    }
    return {
      ...snapshot(),
      text: element.textContent.trim(),
      connected: element.isConnected,
      visible:
        element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
        ancestors.every(
          css =>
            !css.hidden &&
            css.display !== 'none' &&
            css.visibility === 'visible' &&
            Number(css.opacity) > 0
        ) &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.left >= 0 &&
        rect.top >= 0 &&
        rect.right <= innerWidth &&
        rect.bottom <= innerHeight &&
        !document.querySelector('dialog[open],.loading-world') &&
        !document.hidden,
      rect: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
      },
      style: {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        color: style.color,
        zIndex: style.zIndex,
      },
      ancestors,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      effectId: effect?.id ?? null,
      controllerSame: !!effect && effect.bridge === controller,
      controllerTurn: controller?.turn ?? null,
    }
  }
  const visible = () => {
    if (!evidence.birth || evidence.firstVisible) return
    const current = dom()
    if (!current?.visible || (current.text !== `✧${expected}` && current.text !== `✧ ${expected}`))
      return
    check(
      !world.routeNotice && world.message === expected && world.messageUntil > world.time,
      'Visible Bridge text is stale or superseded'
    )
    check(
      evidence.consumed && current.controllerSame && world.effects.includes(effect),
      'Visible Bridge status lacks the actual consumed effect'
    )
    evidence.firstVisible = current
  }
  const mutation = new MutationObserver(() => observe(visible))
  const wrap = (owner, key, callback) => {
    const descriptor = Object.getOwnPropertyDescriptor(owner, key),
      original = owner[key]
    const replacement = callback(original)
    owner[key] = replacement
    restorers.push(() => {
      check(owner[key] === replacement, `Bridge observer ownership changed: ${key}`)
      if (descriptor) Object.defineProperty(owner, key, descriptor)
      else delete owner[key]
    })
  }
  const close = () => {
    if (closed) return evidence
    closed = true
    mutation.disconnect()
    for (const restore of restorers.reverse()) observe(restore)
    if (api) {
      if (window.landBridgeFeedback === api) delete window.landBridgeFeedback
      else note(Error('Bridge observer ownership changed: landBridgeFeedback'))
    }
    evidence.restored = evidence.errors.length === 0
    return evidence
  }
  try {
    wrap(
      clock,
      'beforeTurn',
      original =>
        function (...args) {
          observe(() => {
            owners()
            before = snapshot()
            const shots = world.projectiles.filter(shot => shot.spell === 'bridge')
            check(shots.length <= 1, 'More than one Bridge projectile')
            if (shots.length) {
              check(!projectile || projectile === shots[0], 'Bridge projectile ownership changed')
              projectile ??= shots[0]
              check(projectile.caster === actorId, 'Bridge projectile belongs to another caster')
              before.projectile = shotState(projectile)
            }
          })
          return original.apply(this, args)
        }
    )
    wrap(
      clock,
      'afterTurn',
      original =>
        function (...args) {
          const result = original.apply(this, args)
          observe(() => {
            owners()
            const fresh = world.effects.filter(
              value => value.bridge && !initialEffects.has(value.id)
            )
            check(fresh.length <= 1, 'More than one new Bridge effect')
            if (fresh.length && !effect) {
              effect = fresh[0]
              controller = effect.bridge
              evidence.birth = {
                before,
                after: snapshot(),
                projectile: projectile && shotState(projectile),
                effect: {
                  id: effect.id,
                  kind: effect.kind,
                  team: effect.team,
                  age: effect.age,
                  infiniteDuration: effect.duration === Infinity,
                  bridge: structuredClone(controller),
                },
              }
              check(
                before?.projectile?.id === projectile?.id &&
                  projectile &&
                  !world.projectiles.includes(projectile),
                'Bridge effect was not produced by the observed consumed projectile'
              )
              check(
                controller.turn === 0 &&
                  effect.kind === 'bridge' &&
                  effect.team === 'blue' &&
                  effect.duration === Infinity,
                'Wrong Bridge effect allocation boundary'
              )
              const native = point => ({
                x: Math.round((point.x + 8) * 256) & 65535,
                y: Math.round((-point.z - 8) * 256) & 65535,
              })
              check(
                JSON.stringify(controller.start) === JSON.stringify(native(projectile.source)) &&
                  JSON.stringify(controller.target) === JSON.stringify(native(projectile.target)),
                'Bridge controller endpoints differ from the consumed projectile'
              )
              check(
                world.stats.bridges === 1 &&
                  world.shots.bridge === 0 &&
                  world.giftCounts.bridge === evidence.initial.gifts,
                'Bridge effect lost earned-shot identity'
              )
              check(
                world.message === expected && world.messageUntil === world.time + 9,
                'Bridge allocation feedback or nine-second deadline differs'
              )
            }
            if (effect)
              check(
                world.effects.includes(effect) && effect.bridge === controller,
                'Bridge controller ownership changed'
              )
          })
          return result
        }
    )
    wrap(
      scene,
      'animateFx',
      original =>
        function (...args) {
          const result = original.apply(this, args)
          observe(() => {
            if (args[1] !== effect || evidence.consumed) return
            owners()
            evidence.consumed = {
              ...snapshot(),
              effectId: effect.id,
              controllerTurn: controller.turn,
              controllerSame: effect.bridge === controller,
              meshSame: scene.fxMeshes.get(effect.id) === args[0],
              meshParentSame: args[0].parent === scene.ground,
            }
            check(
              evidence.consumed.controllerSame &&
                evidence.consumed.meshSame &&
                evidence.consumed.meshParentSame,
              'Bridge effect consumer ownership differs'
            )
          })
          return result
        }
    )
    evidence.initial = snapshot()
    mutation.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'role'],
    })
    api = {
      read: () => structuredClone(evidence),
      status: () => ({
        errors: [...evidence.errors],
        done: !!evidence.firstVisible,
      }),
      current: dom,
      close,
    }
    window.landBridgeFeedback = api
  } catch (error) {
    close()
    throw error
  }
}
