// Opt-in test-host fixture, never imported by the shipped Home entry.
// Accelerated ordinary simulation preparation, NOT real-time earned gameplay.
import { tick, command, selectUnit } from '../../app/model.ts'
import { spellTargetError } from '../../app/live-command.ts'
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
