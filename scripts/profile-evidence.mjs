import { mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

// Write after the measured interval. Keep raw samples out of the compact report,
// but never discard them or overwrite evidence from a previous invocation.
export function createProfileEvidence(reportPath, metadata) {
  const directory = resolve(dirname(reportPath), `${basename(reportPath)}.raw-${randomUUID()}`)
  mkdirSync(directory)
  return {
    writeRun(index, run, frames, profile) {
      if (!Number.isSafeInteger(index) || index < 0) throw new Error('Invalid run index')
      const path = resolve(directory, `run-${index}.json`)
      writeFileSync(path, JSON.stringify({
        schemaVersion: 1,
        metadata,
        index,
        run,
        frames,
        profile,
        nonFiniteEncoding: 'Non-finite numbers are tagged objects: { $number: NaN | Infinity | -Infinity }',
        interpretation: 'Diagnostic raw RAF and CDP samples; not phase-inclusive timing or hardware certification',
      }, (_key, value) => typeof value === 'number' && !Number.isFinite(value)
        ? { $number: String(value) } : value, 2) + '\n', { flag: 'wx' })
      return { path, schemaVersion: 1 }
    },
  }
}
