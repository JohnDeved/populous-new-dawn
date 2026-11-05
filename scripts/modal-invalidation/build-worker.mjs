import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { supervisorProof } from './supervisor-proof.mjs'
// Reuse the existing source-bound production Home builder without changing it.
const output = process.argv[5]
writeFileSync(resolve(output, 'build-supervisor.json'), JSON.stringify(supervisorProof('build'), null, 2) + '\n')
await import('../native-ui-evidence/build-home.mjs')
