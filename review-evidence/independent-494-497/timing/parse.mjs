import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const names = [
  'fresh supplied-focus dry-route plain person target preserves interception and cleanup through Save/Load',
  'historical c44 Balloon checkpoint uses corrected seat origin and retains current interception cleanup through Save/Load',
  'fresh supplied-focus Balloon tower attack is intercepted before Tower damage and cleans up through Save/Load',
  'historical c44 supplied-focus Balloon checkpoint retains Warrior11, Tower105 destruction and local Shaman rest through Save/Load',
  'ordinary M18 recurring dispatch replaces the old sermon and preserves live ownership through public Save/Load',
  'Mission 6 Chumara converts Blue and retires its first mixed raid by return timeout',
  'ordinary M16 capacity admission trains actual followers with complete checkpoint replay',
]
const result = process.argv.slice(2).map(file => {
  const raw = readFileSync(file), lines = raw.toString().split('\n')
  const cases = [], groups = []
  let pending, summary
  for (const line of lines) {
    const text = line.replace(/^[^\t]*\t[^\t]*\t\S+\s/, '')
    const test = text.match(/^ok \d+ - (.*)$/)
    if (test) pending = test[1]
    const duration = text.match(/^\s*duration_ms: ([\d.]+)/)
    if (duration && pending) {
      if (names.includes(pending)) cases.push({ name: pending, seconds: Number(duration[1]) / 1000 })
      pending = undefined
    }
    if (text.startsWith('{"kind":"pnd-test-')) {
      const row = JSON.parse(text)
      if (row.kind === 'pnd-test-group') groups.push({
        files: row.files, concurrency: row.concurrency, seconds: row.wallMs / 1000,
        fileListSha256: createHash('sha256').update(JSON.stringify(row.command.filter(x => x.startsWith('tests/')))).digest('hex'),
      })
      if (row.kind === 'pnd-test-result') summary = { seconds: row.wallMs / 1000, complete: row.complete }
    }
  }
  if (cases.length !== names.length || !summary?.complete || groups.length !== 2) throw Error('Missing or duplicate expected measurements')
  return { run: file.match(/(\d+)\.log$/)?.[1], logSha256: createHash('sha256').update(raw).digest('hex'), cases, groups, summary }
})
console.log(JSON.stringify(result, null, 2))
