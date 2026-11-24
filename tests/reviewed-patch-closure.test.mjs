import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { reviewedPatchClosure } from '../scripts/browser-performance/reviewed-patch-closure.mjs'
const selector='vinext@1.0.0-beta.2', path='patches/vinext@1.0.0-beta.2.patch', semantic='a'.repeat(64)
function fixture(change = () => {}) {
  const s={'package.json':'{}','package-lock.json':'{}','pnpm-workspace.yaml':`packages:\n  - '.'\npatchedDependencies:\n  ${selector}: ${path}\n`,
    'pnpm-lock.yaml':`lockfileVersion: '9.0'\npatchedDependencies:\n  ${selector}: ${semantic}\nimporters:\n  .: {}\n`,[path]:'patch bytes'}
  change(s)
  const bytes=Object.fromEntries(Object.entries(s).map(([k,v])=>[k,Buffer.from(v)]))
  const manifest={schema:'reviewed-source-inputs-v1',revision:'b'.repeat(40),inputs:Object.fromEntries(Object.entries(bytes).map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')]))}
  return {bytes,manifest}
}
const check=f=>reviewedPatchClosure(f.manifest,f.bytes)
test('canonical closure retains distinct semantic and raw byte hashes',()=>{
  const r=check(fixture());assert.equal(r.patches.length,1);assert.equal(r.patches[0].pnpmSemanticHash,semantic)
  assert.notEqual(r.patches[0].reviewedByteSha256,semantic)
})
test('unpatched graph has empty closure',()=>{const f=fixture(s=>{delete s[path];s['pnpm-workspace.yaml']='packages:\n  - .\n';s['pnpm-lock.yaml']="lockfileVersion: '9.0'\n"});assert.equal(check(f).patches.length,0)})
test('omitted declared patch fails',()=>assert.throws(()=>check(fixture(s=>delete s[path])),/Omitted/))
test('extra reviewed patch fails',()=>assert.throws(()=>check(fixture(s=>s['patches/extra.patch']='extra')),/Extra reviewed/))
test('workspace and lock selector mismatch fails',()=>assert.throws(()=>check(fixture(s=>s['pnpm-lock.yaml']=s['pnpm-lock.yaml'].replace(selector,'other@1.0.0'))),/selector mismatch/))
test('unsafe declaration path fails',()=>assert.throws(()=>check(fixture(s=>s['pnpm-workspace.yaml']=s['pnpm-workspace.yaml'].replace(path,'patches/../outside.patch'))),/Unsafe patch/))
test('duplicate selector and owner fail',()=>{
  assert.throws(()=>check(fixture(s=>s['pnpm-workspace.yaml']+=`  ${selector}: ${path}\n`)),/Duplicate patch selector/)
  assert.throws(()=>check(fixture(s=>s['pnpm-workspace.yaml']+=`patchedDependencies:\n  ${selector}: ${path}\n`)),/Duplicate patch declaration/)
})
test('duplicate patch paths fail',()=>assert.throws(()=>check(fixture(s=>{s['pnpm-workspace.yaml']+=`  other@1.0.0: ${path}\n`;s['pnpm-lock.yaml']=s['pnpm-lock.yaml'].replace('importers:',`  other@1.0.0: ${semantic}\nimporters:`)})),/Duplicate patch path/))
test('unsupported YAML owner forms fail closed',()=>{for(const value of ['patchedDependencies: {}','"patchedDependencies":','patchedDependencies: &alias'])assert.throws(()=>check(fixture(s=>s['pnpm-workspace.yaml']=value)),/Unsupported/)})
test('unsupported hash form fails instead of guessing hash algorithm',()=>assert.throws(()=>check(fixture(s=>s['pnpm-lock.yaml']=s['pnpm-lock.yaml'].replace(semantic,'unknown'))),/hash representation/))
test('stale supplied bytes fail against reviewed manifest',()=>{const f=fixture();f.bytes[path]=Buffer.from('changed');assert.throws(()=>check(f),/Stale/)})
test('manifest omission and alternate JSON patch owner fail',()=>{
  const f=fixture();delete f.manifest.inputs[path];assert.throws(()=>check(f),/closure mismatch/)
  assert.throws(()=>check(fixture(s=>s['package.json']='{"pnpm":{"patchedDependencies":{}}}')),/Alternative/)
})
test('oversize inputs and overcount fail before parsing',()=>{
  const f=fixture();f.bytes[path]=Buffer.alloc(8*1024**2+1);assert.throws(()=>check(f),/byte bound/)
  const g=fixture(s=>{for(let i=0;i<65;i++)s[`patches/p${i}.patch`]='x'});assert.throws(()=>check(g),/count bound/)
})
test('YAML aliases merges tags and escaped owner fail closed',()=>{
  for(const line of ['other: &anchor value','other: *anchor','<<: *anchor','other: !tag value','"patched\\u0044ependencies": {}'])
    assert.throws(()=>check(fixture(s=>s['pnpm-workspace.yaml']+=line+'\n')),/Unsupported/)
})
test('ordinary JSON escapes accepted but escaped or shadowed patch owners rejected',()=>{
  assert.equal(check(fixture(s=>s['package.json']='{"script":"say \\"hello\\""}')).patches.length,1)
  for(const text of ['{"patched\\u0044ependencies":{}}','{"pnpm":{"patchedDependencies":{}},"pnpm":{}}'])
    assert.throws(()=>check(fixture(s=>s['package.json']=text)),/Alternative/)
})
test('explicit multiline escaped patch key cannot masquerade as unpatched graph',()=>{
  const hidden='? "patchedDepen\\\n  dencies"\n: \n  vinext@1.0.0-beta.2: patches/vinext.patch\n'
  const f=fixture(s=>{delete s[path];s['pnpm-workspace.yaml']=hidden;s['pnpm-lock.yaml']=hidden})
  assert.throws(()=>check(f),/Unsupported YAML explicit key or escaped multiline/)
})
test('explicit scalar key and implicit escaped multiline key fail closed',()=>{
  for(const hidden of ['? patchedDependencies\n: {}\n','"patchedDepen\\\n  dencies": {}\n'])
    assert.throws(()=>check(fixture(s=>{delete s[path];s['pnpm-workspace.yaml']=hidden;s['pnpm-lock.yaml']=hidden})),/Unsupported YAML explicit key or escaped multiline/)
})
