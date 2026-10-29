// Diagnostic observations only: never change workload deadlines or await ordering.
export function createStageTiming(now = () => performance.now()) {
  const report = { version: 1, unit: 'ms since episode timing start', maxEntries: 128,
    entries: [], dropped: 0, clockErrors: 0, invalidLabels: 0 }
  let origin = null, previous = null
  const read = () => {
    try {
      const value = now()
      if (!Number.isFinite(value) || (previous !== null && value < previous)) throw Error('Invalid clock')
      previous = value
      if (origin === null) origin = value
      return value - origin
    } catch {
      report.clockErrors++
      return null
    }
  }
  read()
  return {
    report,
    mark(stage) {
      if (typeof stage !== 'string' || stage.length > 96) { report.invalidLabels++; return }
      if (report.entries.length >= report.maxEntries) { report.dropped++; return }
      report.entries.push({ stage, elapsedMs: read() })
    },
  }
}
