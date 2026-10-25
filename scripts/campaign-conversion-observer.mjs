// Read-only evidence for live-movement.ts replaceConvertedVictim. A disappeared
// enemy is not a conversion: require its preceding state23/Blue-preacher owner
// and a newly allocated Blue same-kind replacement carrying both native flags.
export function observeCampaignConversions(world, previous) {
  const units = world.units.map(unit => ({ id: unit.id, kind: unit.kind, team: unit.team, hp: unit.hp,
    state: unit.native?.state, workTarget: unit.native?.workTarget,
    flags3: unit.native?.flags3 ?? 0, flags4: unit.native?.flags4 ?? 0 }))
  const sameLevel = previous?.level === world.outcome.level && previous.turn <= world.turn
  const events = sameLevel ? [...previous.events] : []
  if (sameLevel && previous.turn + 1 === world.turn) {
    const oldIds = new Set(previous.units.map(unit => unit.id))
    const liveIds = new Set(units.filter(unit => unit.hp > 0).map(unit => unit.id))
    const bluePreachers = new Set(previous.units.filter(unit => unit.team === 'blue' && unit.kind === 'preacher' && unit.hp > 0).map(unit => unit.id))
    const replacements = units.filter(unit => !oldIds.has(unit.id) && unit.hp > 0 && unit.team === 'blue' &&
      (unit.flags4 & 0x40000) && (unit.flags3 & 0x1000000))
    for (const kind of new Set(replacements.map(unit => unit.kind))) {
      const victims = previous.units.filter(unit => unit.hp > 0 && unit.team !== 'blue' && unit.kind === kind &&
        unit.state === 23 && bluePreachers.has(unit.workTarget) && !liveIds.has(unit.id))
      if (victims.length) events.push({ turnBefore: previous.turn, turnAfter: world.turn, kind,
        victims, replacements: replacements.filter(unit => unit.kind === kind),
        pairing: 'Same-turn kind group; no individual pairing is claimed when several victims/replacements coincide.' })
    }
  }
  return { level: world.outcome.level, turn: world.turn, units, events }
}
