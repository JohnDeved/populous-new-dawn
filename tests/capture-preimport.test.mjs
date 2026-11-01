import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { createHash } from 'node:crypto'
import * as cli from '../scripts/tutorial-browser/run-capture-protocol.mjs'
const hash=b=>createHash('sha256').update(b).digest('hex')
function fixture() {
 const cwd=mkdtempSync(join(tmpdir(),'capture-preimport-')),node=join(cwd,'node-data'),manifestPath=join(cwd,'scripts/tutorial-browser/capture-qualified-inputs.json')
 mkdirSync(dirname(manifestPath),{recursive:true});writeFileSync(node,'inert node')
 const source=join(cwd,'scripts/tutorial-browser/integrated-capture-protocol.mjs');writeFileSync(source,'throw Error("MUST NEVER EXECUTE")')
 const manifest=JSON.stringify({'scripts/tutorial-browser/integrated-capture-protocol.mjs':hash('throw Error("MUST NEVER EXECUTE")')})
 writeFileSync(manifestPath,manifest)
 return {cwd,node,source,manifestPath,options:{cwd,node,trustedNodeSha256:hash('inert node'),env:{PND_CAPTURE_MANIFEST_SHA256:hash(manifest)}},clean:()=>rmSync(cwd,{recursive:true,force:true})}
}
test('pre-import checks exact externally pinned manifest, source and Node as data only',()=>{
 const f=fixture();try {assert.equal(cli.verifyCapturePreimports(f.options).files,1)}finally{f.clean()}
})
test('missing authority, source drift, manifest drift, Node drift all reject before dynamic import',()=>{
 const f=fixture();try {
  assert.throws(()=>cli.verifyCapturePreimports({...f.options,env:{}}),/manifest identity/)
  writeFileSync(f.source,'changed');assert.throws(()=>cli.verifyCapturePreimports(f.options),/input identity/)
  writeFileSync(f.manifestPath,'{}');assert.throws(()=>cli.verifyCapturePreimports(f.options),/manifest identity/)
  f.options.env.PND_CAPTURE_MANIFEST_SHA256=hash('{}');writeFileSync(f.node,'changed');assert.throws(()=>cli.verifyCapturePreimports(f.options),/Node identity/)
 }finally{f.clean()}
})
