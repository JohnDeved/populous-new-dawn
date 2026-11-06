import { writeEvidence } from './evidence-writer.mjs'
import { supervisorProof } from './supervisor-proof.mjs'
// Reuse the existing source-bound production Home builder without changing it.
const output = process.argv[5]
writeEvidence(output, 'build-supervisor.json', JSON.stringify(supervisorProof('build'), null, 2) + '\n')
await import('../native-ui-evidence/build-home.mjs')
