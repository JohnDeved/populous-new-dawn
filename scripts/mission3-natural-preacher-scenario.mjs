// Verification-only journey. Every mutation is an ordinary shipped command or
// fixed simulation turn; no actors, timers, tribe flags or outcomes are staged.
import { command, placeBuilding, select, setSelection, tick } from '../app/model.ts'
import { observeCampaignConversions } from './campaign-conversion-observer.mjs'

const assertCondition = (condition, message) => { if (!condition) throw Error(message) }
export const preachingPoint = { x: -39, z: -110 }

export function naturalPreacherJourney(world) {
  assertCondition(world.outcome.level === 3 && world.turn <= 256, 'Journey requires fresh Mission 3')
  const victim = world.units.find(unit => unit.team === 'yellow' && unit.kind === 'brave' && unit.x === -43 && unit.z === -107)
  assertCondition(victim, 'Missing authored Yellow Brave at (-43,-107)')
  const authoredVictimId = victim.id, milestones = []
  let observation = observeCampaignConversions(world)
  const step = () => {
    tick(world, 1 / 12)
    observation = observeCampaignConversions(world, observation)
  }
  const until = (label, predicate, limit = 4000) => {
    for (let turn = 0; turn < limit && !predicate() && world.status === 'playing'; turn++) step()
    assertCondition(predicate(), `${label} did not complete by turn ${world.turn}`)
    milestones.push({ label, turn: world.turn })
  }
  until('opening', () => world.turn === 256, 256)
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  setSelection(world, [shaman.id])
  assertCondition(command(world, world.shrines.find(shrine => shrine.kind === 'vault')), 'Vault command rejected')
  until('temple-unlocked', () => world.unlockedTemple)
  setSelection(world, [shaman.id])
  assertCondition(command(world, { x: 35, z: 81 }), 'Shaman return rejected')
  select(world, 'brave')
  assertCondition(placeBuilding(world, 'temple', { x: 24, z: 70 }), 'Temple placement rejected')
  const temple = world.buildings.findLast(building => building.team === 'blue' && building.kind === 'temple')
  until('temple-built', () => temple.progress === 1)
  const trainee = world.units.find(unit => unit.team === 'blue' && unit.kind === 'brave' && unit.hp > 0 && unit.inside === null)
  assertCondition(trainee, 'No naturally acquired Blue Brave available for training')
  const traineeId = trainee.id
  setSelection(world, [traineeId])
  assertCondition(command(world, temple), 'Temple training command rejected')
  until('preacher-trained', () => world.units.some(unit => unit.team === 'blue' && unit.kind === 'preacher'))
  const preacher = world.units.find(unit => unit.team === 'blue' && unit.kind === 'preacher')
  setSelection(world, [preacher.id])
  assertCondition(command(world, preachingPoint), 'Preacher approach rejected')
  until('authored-brave-listening', () => victim.native?.state === 23 && victim.native.workTarget === preacher.id)
  assertCondition(preacher.hp > 0 && victim.hp > 0, 'Natural sermon requires living participants')
  return { world, preacher, victim, authoredVictimId, traineeId, templeId: temple.id, milestones,
    step, until, observation: () => observation }
}
