import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, symlinkSync, statfsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
const out=resolve('outputs/centers-pilot')
mkdirSync(out,{recursive:true})
const config=JSON.parse(readFileSync(new URL('./config.json',import.meta.url),'utf8'))
const hash=b=>createHash('sha256').update(b).digest('hex')
const receipt={status:'preparing',startedAt:new Date().toISOString(),candidateRuns:'not started'}
const save=()=>writeFileSync(`${out}/preparation.json`,JSON.stringify(receipt,null,2)+'\n')
save()
try {
  assert.equal(process.version,config.nodeVersion)
  assert.match(process.env.PILOT_HEAD_SHA??'',/^[0-9a-f]{40}$/)
  assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.PILOT_HEAD_SHA)
  receipt.pilotHead=process.env.PILOT_HEAD_SHA
  const fs=statfsSync(out);receipt.freeBytesBefore=fs.bavail*fs.bsize
  assert.ok(receipt.freeBytesBefore>2*1024**3,'Require 2 GiB preparation headroom')
  for(const variant of ['baseline','candidate']) {
    const commit=config[`${variant}Commit`],root=resolve(out,'sources',variant)
    assert.match(commit,/^[0-9a-f]{40}$/)
    assert.equal(execFileSync('git',['rev-parse',`${commit}^{commit}`],{encoding:'utf8'}).trim(),commit)
    for(const [file,digest] of Object.entries(config.files[variant])) {
      assert.ok(!file.startsWith('/')&&!file.split('/').includes('..'))
      const bytes=execFileSync('git',['show',`${commit}:${file}`],{maxBuffer:32*1024**2})
      assert.equal(hash(bytes),digest,`${variant} Git blob mismatch: ${file}`)
      const target=resolve(root,file);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes)
    }
    symlinkSync(resolve(out,'dependencies/node_modules'),`${root}/node_modules`,'dir')
  }
  for(const name of ['package.json','package-lock.json']) {
    const a=readFileSync(`${out}/sources/baseline/${name}`),b=readFileSync(`${out}/sources/candidate/${name}`)
    assert.deepEqual(a,b,`Dependency inputs differ: ${name}`)
    mkdirSync(`${out}/dependencies`,{recursive:true});writeFileSync(`${out}/dependencies/${name}`,a)
  }
  const differences=Object.keys(config.files.baseline).filter(f=>config.files.baseline[f]!==config.files.candidate[f])
  assert.deepEqual(differences,['app/painter.ts'])
  receipt.configHash=hash(readFileSync(new URL('./config.json',import.meta.url)))
  receipt.status='prepared';receipt.sources={baseline:config.baselineCommit,candidate:config.candidateCommit};save()
} catch(error) {receipt.status='failed';receipt.error=String(error);save();throw error}
