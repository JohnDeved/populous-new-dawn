import { closeSync, constants, fstatSync, openSync, readSync } from 'node:fs'
import { analyzeFrameExport } from '../app/frame-export-analysis.ts'

const usage = 'Usage: node scripts/analyze-frame-export.mjs <local-export.json>'
const args = process.argv.slice(2)
if (args.length !== 1 || args[0] === '--help' || args[0].startsWith('--')) {
  if (args.length === 1 && args[0] === '--help') console.log(usage)
  else { console.error(usage); process.exitCode = 1 }
} else {
  let fd
  try {
    fd = openSync(args[0], constants.O_RDONLY | constants.O_NONBLOCK)
    if (!fstatSync(fd).isFile()) throw new Error('Expected a regular local JSON file')
    // Read at most the limit plus one byte, even if the file grows after opening.
    const bytes = Buffer.alloc(2 * 1024 * 1024 + 1)
    let length = 0
    while (length < bytes.length) {
      const count = readSync(fd, bytes, length, bytes.length - length, null)
      if (!count) break
      length += count
    }
    if (length === bytes.length) throw new Error('Export exceeds the 2 MiB limit')
    const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, length))
    console.log(JSON.stringify(analyzeFrameExport(json), null, 2))
  } catch (error) {
    console.error(`Frame export analysis failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  } finally {
    if (fd !== undefined) closeSync(fd)
  }
}
