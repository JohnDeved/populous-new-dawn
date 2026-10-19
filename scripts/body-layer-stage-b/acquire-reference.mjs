import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFileSync,copyFileSync,mkdirSync,readdirSync,writeFileSync,statfsSync} from 'node:fs'
import {join} from 'node:path'
import {materializeObservations} from '../../scripts/body-layer-stage-a/observation-store.mjs'
import {verifyReferences} from './reference-binding.mjs'
const [root]=process.argv.slice(2)
assert.ok(root)
const receipt=execFileSync('python3',[join(import.meta.dirname,'acquire-reference.py'),root],{encoding:'utf8',timeout:75000,maxBuffer:1024*1024})
writeFileSync(join(root,'acquisition.json'),receipt)
const floor = 512n * 1024n ** 2n
const reserve = 32n * 1024n ** 2n // <=428 hardlinks/directories plus <2MiB exact extras; no blob copies
const requireSpace = () => { const s=statfsSync(root,{bigint:true}); assert.ok(s.bavail*s.bsize >= floor+reserve, 'Reference materialization disk reserve') }
requireSpace()
materializeObservations(root)
requireSpace()
const extras=join(import.meta.dirname,'reference-extras')
mkdirSync(join(root,'qualification'))
for(const file of readdirSync(extras)){
 const target=['step-identities.json','step-identity-inputs.json','qualified-admission.json','stage-b-reference-manifest.json'].includes(file)?root:join(root,'qualification')
 requireSpace()
 copyFileSync(join(extras,file),join(target,file))
}
requireSpace()
verifyReferences(root)
console.log(JSON.stringify({status:'passed',referenceManifest:JSON.parse(readFileSync(join(root,'stage-b-reference-manifest.json'))).artifactSha256}))
