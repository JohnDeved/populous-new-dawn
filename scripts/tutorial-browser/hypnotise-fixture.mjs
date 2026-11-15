// Opt-in test-host fixture, never imported by the shipped Home entry.
// Accelerated ordinary simulation preparation, NOT real-time earned gameplay.
import { tick, command, selectUnit } from '../../app/model.ts'
import { spellTargetError } from '../../app/live-command.ts'
import { hypnotiseTargets } from '../../app/spell-effects-runtime.ts'
import { unitAnimationSource } from '../../app/selection-runtime.ts'
import rules from '../../app/original-rules.json' with { type: 'json' }

// M22's authored idle cohort generates 37 per four-turn mana scan. Budget
// the full cost without crediting any initial allocation, plus scan alignment.
export const hypnotiseChargingVisitLimit =
  Math.ceil(rules.spellCharging[7].cost / 37) * (rules.manaUpdateMask + 1) + rules.manaUpdateMask
export const hypnotisePreparationState = world => ({
  turn: world.turn,
  availableMana: world.manaTribes[0].available,
  spellProgress: [...world.manaTribes[0].spellProgress],
  disabled: world.manaWorld.spells[0].disabled,
  stock: world.shots.hypnotise,
})

export const hypnotiseTarget = Object.freeze({ x: 15, z: -31 })
// Read-only diagnostic state, not an eligibility oracle or supplied targets.
// The bounded nearest cohort and actual selector IDs expose drift/exclusion while
// retaining the unchanged fifth-visit conversion assertion in the observer.
export function hypnotiseTargetWitness(world, point = hypnotiseTarget) {
  const selected = hypnotiseTargets(world, point, 'blue').map(({ u }) => u.id)
  const enemies = world.units.filter(unit => unit.team !== 'blue')
  const nearby = enemies.toSorted((a, b) =>
    Math.hypot(a.x - point.x, a.z - point.z) - Math.hypot(b.x - point.x, b.z - point.z)
  ).slice(0, 32).map(unit => {
    const native = unitAnimationSource(unit)
    return {
      id: unit.id, team: unit.team, kind: unit.kind, x: unit.x, z: unit.z,
      hp: unit.hp, inside: unit.inside, invisibility: unit.invisibility,
      native: native && { id: native.id, class: native.class, model: native.model,
        tribe: native.tribe, x: native.x, y: native.y,
        flags2: native.flags2, flags4: native.flags4 },
    }
  })
  return { turn: world.turn, point: { x: point.x, z: point.z }, selected,
    enemyCount: enemies.length, omitted: Math.max(0, enemies.length - nearby.length), nearby }
}

const requireState = (condition, message) => {
  if (!condition) throw Error(message)
}

export async function prepareEarnedHypnotise(scene, clock = {}) {
  const now = clock.now ?? (() => performance.now()),
    yieldBatch = clock.yieldBatch ?? (() => new Promise(resolve => setTimeout(resolve, 0))),
    world = scene.world,
    start = now(),
    startedTurn = world.turn,
    initialState = hypnotisePreparationState(world),
    shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman')
  requireState(
    scene.isCurrent() && world.paused && world.outcome.level === 22 && shaman?.hp > 0,
    'Need current paused Mission22 with its original living Shaman'
  )
  requireState(
    !world.shots.hypnotise && !world.effects.some(f => f.kind === 'hypnotise'),
    'Preparation must start before earning or casting Hypnotise'
  )
  const checkTime = () =>
    requireState(now() - start < 25000, 'Hypnotise preparation exceeded 25s bound')
  const advanceUntil = async (ready, limit) => {
    let visits = 0
    while (!ready() && visits < limit) {
      checkTime()
      requireState(
        scene.isCurrent() && scene.world === world && world.paused && shaman.hp > 0,
        'Preparation lost its paused live world or Shaman'
      )
      world.paused = false
      try {
        for (let n = 0; n < 120 && visits < limit && !ready(); n++, visits++) tick(world, 1 / 12)
      } finally {
        world.paused = true
      }
      // Return to the browser only while paused; no presentation is fabricated.
      checkTime()
      await yieldBatch()
      checkTime()
    }
    checkTime()
    requireState(
      ready(),
      `Ordinary simulation did not reach its boundary within ${limit} visits: ${JSON.stringify({ initialState, finalState: hypnotisePreparationState(world) })}`
    )
    return visits
  }
  // Existing deterministic mana-focus adapter; no mana, stock, actors or effect
  // states are supplied. The actual mana/charging consumer earns the one charge.
  world.manaWorld.spells[0].disabled = 0xffffffff & ~(1 << 6)
  const chargingVisits = await advanceUntil(
      () => world.shots.hypnotise > 0, hypnotiseChargingVisitLimit
    ),
    chargedTurn = world.turn
  requireState(world.shots.hypnotise === 1, 'Require exactly one earned charge')
  const move = goal => {
    world.paused = false
    try {
      selectUnit(world, shaman.id)
      requireState(command(world, goal), 'Ordinary movement command rejected')
    } finally {
      world.paused = true
    }
  }
  for (const goal of [
    { x: 0, z: -45 },
    { x: 20, z: -45 },
  ]) {
    move(goal)
    await advanceUntil(() => Math.hypot(shaman.x - goal.x, shaman.z - goal.z) < 2, 1000)
  }
  move({ x: 20, z: -41 })
  await advanceUntil(() => !spellTargetError(world, 'hypnotise', hypnotiseTarget), 100)
  requireState(
    world.shots.hypnotise === 1 && !world.projectiles.some(p => p.spell === 'hypnotise'),
    'Preparation must leave the actual cast to the HUD and pointer'
  )
  scene.focus(hypnotiseTarget)
  scene.onChange()
  checkTime()
  return {
    startedTurn,
    initialState,
    chargingVisitLimit: hypnotiseChargingVisitLimit,
    chargedTurn,
    readyTurn: world.turn,
    chargingVisits,
    elapsedMs: now() - start,
    stock: world.shots.hypnotise,
    target: hypnotiseTarget,
    shamanId: shaman.id,
    limit: 'Accelerated ordinary simulation and mana-focus adapter; no real-time earning claim',
  }
}

// The original warriors patrol during earned charging. Admit their next real
// pass through the endpoint instead of casting at an empty historical position.
export const hypnotiseEncounterTarget = Object.freeze({ x: 11, z: -29 })
export async function prepareHypnotiseEncounter(scene, clock = {}) {
  const world = scene.world, start = (clock.now ?? (() => performance.now()))(),
    now = clock.now ?? (() => performance.now()),
    yieldBatch = clock.yieldBatch ?? (() => new Promise(resolve => setTimeout(resolve, 0))),
    shaman = world.units.find(u => u.team === 'blue' && u.kind === 'shaman'),
    startedTurn = world.turn, target = hypnotiseEncounterTarget
  let visits = 0
  const current = () => {
    requireState(scene.isCurrent() && scene.world === world && world.paused &&
      shaman?.hp > 0 && world.outcome.level === 22 && world.shots.hypnotise === 1,
    'Encounter admission requires the current paused Mission22 and earned stock')
    requireState(visits <= 500 && now() - start < 5000, 'Hypnotise encounter admission exceeded 500 visits or 5s')
  }
  const cohort = () => hypnotiseTargets(world, target, 'blue').map(({ u }) => u.id).sort((a, b) => a - b)
  const ready = () => JSON.stringify(cohort()) === '[97,98]' && !spellTargetError(world, 'hypnotise', target)
  const advanceUntil = async predicate => {
    while (!predicate()) {
      current()
      requireState(visits < 500 && now() - start < 5000, 'Hypnotise encounter admission exceeded 500 visits or 5s')
      world.paused = false
      try { tick(world, 1 / 12); visits++ } finally { world.paused = true }
      if (visits % 20 === 0) await yieldBatch()
    }
    current()
  }
  const move = point => {
    current()
    world.paused = false
    try {
      if (!world.selected.includes(shaman.id)) selectUnit(world, shaman.id)
      requireState(command(world, point), 'Encounter ordinary Shaman move rejected')
    } finally { world.paused = true }
  }
  current()
  for (const id of [97, 98]) requireState(world.units.some(u => u.id === id &&
    u.team === 'red' && u.kind === 'warrior' && u.hp > 0), 'Original authored warrior unavailable')
  if (spellTargetError(world, 'hypnotise', target)) {
    move({ x: 16, z: -39 })
    await advanceUntil(() => !spellTargetError(world, 'hypnotise', target))
  }
  // Stop through an ordinary move to the current position, not an actor write.
  move({ x: shaman.x, z: shaman.z })
  // A fresh entry avoids admitting the last few visits of a patrol window.
  if (ready()) await advanceUntil(() => !ready())
  await advanceUntil(ready)
  const witness = hypnotiseTargetWitness(world, target)
  scene.focus(target)
  scene.onChange()
  current()
  return { startedTurn, readyTurn: world.turn, visits, elapsedMs: now() - start,
    target, cohort: cohort(), witness, shaman: { id: shaman.id, x: shaman.x, z: shaman.z, hp: shaman.hp },
    limit: 'Ordinary movement and simulation admission; no actors, stock or conversion outcomes supplied' }
}
