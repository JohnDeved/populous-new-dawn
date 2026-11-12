// Inactive proposal. Signal 0 observes existence/permission, not termination.
// Only a caller retaining its own spawned group identity may supply pgid.
// Absence does not prove no descendants escaped the original process group.
export function processGroupPresent(pgid, probe = process.kill) {
  if (!Number.isSafeInteger(pgid) || pgid <= 1) throw Error('Owned process-group ID required')
  try { probe(-pgid, 0); return true }
  catch (error) { if (error?.code === 'ESRCH') return false; throw error }
}

export async function observeGroupExit(pgid, { capMs = 1000, intervalMs = 25,
  probe = process.kill, now = () => performance.now(), pause = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  if (!Number.isSafeInteger(pgid) || pgid <= 1) throw Error('Owned process-group ID required')
  if (!Number.isFinite(capMs) || capMs <= 0 || capMs > 5000 ||
      !Number.isFinite(intervalMs) || intervalMs <= 0 || intervalMs > capMs)
    throw Error('Invalid process-group observation budget')
  const started = now()
  if (!Number.isFinite(started)) throw Error('Invalid process-group observation clock')
  let previous = started, polls = 0
  const receipt = { pgid, capMs, intervalMs, status: 'observing', polls: 0, elapsedMs: 0 }
  const tick = () => {
    const current = now()
    if (!Number.isFinite(current) || current < previous) throw Error('Process-group observation clock moved backward')
    previous = current; receipt.elapsedMs = current - started
    return receipt.elapsedMs
  }
  try {
    for (;;) {
      if (tick() >= capMs) throw Error('Process-group disappearance not observed before deadline')
      if (++polls > Math.ceil(capMs / intervalMs) + 1) throw Error('Process-group observation poll quota exceeded')
      receipt.polls = polls
      const present = processGroupPresent(pgid, probe)
      if (tick() >= capMs) throw Error('Process-group observation settled after deadline')
      if (!present) { receipt.status = 'absent'; return receipt }
      let timer
      try {
        await Promise.race([
          Promise.resolve().then(() => pause(Math.min(intervalMs, capMs - receipt.elapsedMs))),
          new Promise((_, reject) => { timer = setTimeout(() => reject(Error('Process-group observation pause exceeded deadline')), capMs - receipt.elapsedMs) }),
        ])
      } finally { clearTimeout(timer) }
    }
  } catch (error) {
    // Caller must accept only status=absent, and serialize error separately.
    return { ...receipt, status: 'unverified', error }
  }
}
