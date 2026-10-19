// Repackage existing licensed/imported PNG bytes; never redraw or re-import native assets.
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const inputs = {
  mask: ['public/original/loading-mask.png', 'baacd745948a9f02fff7f2d4ba2ad3b509fe533f4fee5ad820a8aab5db3f0960'],
  label: ['public/original/loading-label.png', '9b5344c17384895329eea031ab56c0243600022970bdfb814ed7ce25feb625c9'],
}
const art = {}
for (const [name, [path, expected]] of Object.entries(inputs)) {
  const bytes = readFileSync(new URL(path, root))
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (sha256 !== expected) throw Error(`Unreviewed loading artwork: ${path}`)
  art[name] = { source: path, sha256, bytes: bytes.length, src: `data:image/png;base64,${bytes.toString('base64')}` }
}
const result = JSON.stringify(art, null, 2) + '\n'
const target = new URL('app/original-loading-art.json', root)
if (process.argv[2] === '--check') {
  if (readFileSync(target, 'utf8') !== result) throw Error('Inline loading artwork is stale')
} else if (process.argv.length === 2) {
  writeFileSync(target, result)
} else throw Error('Usage: node scripts/inline-loading-art.mjs [--check]')
console.log(`Verified original loading bytes: ${fileURLToPath(target)}`)
