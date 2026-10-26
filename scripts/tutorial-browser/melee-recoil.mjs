// Separate invocation of the maintained public Mission 2 browser route.
// Does not add a hosted job or alter the existing attack/corpse workload.
import meleeAttack from './melee-attack.mjs'
export default async function meleeRecoil(options) {
  return meleeAttack({ ...options,
    expectedRevision: options.expectedRevision ?? options.receipt?.source?.commit, recoil: true })
}
