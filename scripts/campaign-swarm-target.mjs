import { spellTargetError } from '../app/model.ts'

const wrapped = value => ((value + 128) % 256 + 256) % 256 - 128

// Observation only: never probe cast() on the live world to discover a target.
export function missionThreeSwarmDiagnostic(world) {
  const shaman = world.units.find(
      unit => unit.team === 'blue' && unit.kind === 'shaman' && unit.hp > 0
    ),
    vault = world.shrines.find(shrine => shrine.kind === 'vault'),
    legacyTarget = vault && world.units
      .filter(unit => unit.team === 'yellow' && unit.kind !== 'shaman' && unit.hp > 0)
      .toSorted((a, b) =>
        Math.hypot(wrapped(a.x - vault.x), wrapped(a.z - vault.z)) -
        Math.hypot(wrapped(b.x - vault.x), wrapped(b.z - vault.z))
      )[0],
    candidates = world.units
      .filter(unit => unit.team === 'yellow' && unit.kind !== 'shaman' && unit.hp > 0 && unit.inside === null)
      .map(unit => ({
        id: unit.id,
        x: unit.x,
        z: unit.z,
        distance: shaman
          ? Math.hypot(wrapped(unit.x - shaman.x), wrapped(unit.z - shaman.z))
          : null,
        error: spellTargetError(world, 'swarm', unit),
      }))
      .toSorted((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity) || a.id - b.id),
    ready = world.status === 'playing' && !world.paused && !world.inputMask && world.shots.swarm > 0
  return {
    level: world.outcome.level,
    turn: world.turn,
    status: world.status,
    paused: world.paused,
    inputMask: world.inputMask,
    shots: world.shots.swarm,
    available: world.manaWorld.spells[0].available,
    gifts: world.gifts,
    selected: [...world.selected],
    mode: world.mode,
    message: world.message,
    cooldown: world.castingTribes[0].cooldown,
    castingFlags: world.castingTribes[0].flags,
    shaman: shaman && {
      id: shaman.id, x: shaman.x, z: shaman.z, hp: shaman.hp,
      inside: shaman.inside, lift: shaman.lift, casting: shaman.casting,
      state: shaman.native?.state, flags2: shaman.native?.flags2, flags4: shaman.native?.flags4,
    },
    legacyTarget: legacyTarget && {
      id: legacyTarget.id, x: legacyTarget.x, z: legacyTarget.z,
      inside: legacyTarget.inside, error: spellTargetError(world, 'swarm', legacyTarget),
    },
    candidates,
    target: ready ? candidates.find(candidate => !candidate.error) ?? null : null,
  }
}
