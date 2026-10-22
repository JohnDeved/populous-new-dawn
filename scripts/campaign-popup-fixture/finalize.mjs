// Cleanup is independent of the input deadline. A rejected owner close must not
// skip the other owner or erase the transition observations already in receipt.
export async function finalizePopupFixture({ receipt, failed, primaryError, browser, server, save, emit }) {
  let hadFailure = failed, firstError = primaryError
  receipt.finalizationErrors ??= []
  const describe = error => String(error?.stack ?? error)
  if (failed) { receipt.status = 'failed'; receipt.error = describe(primaryError) }
  const attempt = async (phase, action) => {
    try { await action(); return true }
    catch (error) {
      receipt.finalizationErrors.push({ phase, error: describe(error) })
      if (!hadFailure) { hadFailure = true; firstError = error; receipt.error = describe(error) }
      receipt.status = 'failed'
      return false
    }
  }
  await attempt('browser-close', () => browser?.close())
  await attempt('server-close', () => server?.close())
  receipt.finishedAt = new Date().toISOString()
  const saved = await attempt('save-receipt', save)
  // The full receipt also retains the actual transition trace if disk save fails.
  const emitted = await attempt('emit-terminal', () => emit(receipt))
  // If stdout fails after a successful write, try to correct that receipt. If
  // this write also fails, the saved receipt may be stale; process failure is
  // authoritative. Do not retry a failed first disk write.
  if (!emitted && saved) await attempt('save-terminal-failure', save)
  return { failed: hadFailure, primaryError: firstError }
}
