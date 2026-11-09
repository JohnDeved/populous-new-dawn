// Separate invocation of the maintained public Mission 2 browser route.
// Does not add a hosted job or alter the existing attack/corpse workload.
import assert from 'node:assert/strict'
import meleeAttack from './melee-attack.mjs'

export async function closeUnusedLocalPreflight({ page, context, browser, receipt }) {
  assert(!receipt?.profile, 'Recoil uses a fresh context, not a persistent profile')
  if (!page) return
  assert(context && page.context() === context, 'Preflight page must belong to supplied context')
  assert(context.browser() === browser, 'Preflight context must belong to supplied browser')
  await page.close()
  if (receipt) receipt.recoilPreflightPageClosed = true
}

export default async function meleeRecoil(options) {
  // The local harness already visited its menu. The scenario below owns a new
  // 960x720 context; retaining that unused app would duplicate renderer memory.
  await closeUnusedLocalPreflight(options)
  return meleeAttack({ ...options,
    expectedRevision: options.expectedRevision ?? options.receipt?.source?.commit, recoil: true })
}
