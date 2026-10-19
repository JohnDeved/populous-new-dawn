import fs from 'node:fs'
import cp from 'node:child_process'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
const git=(...args)=>cp.execFileSync('git',args),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),base='287d4ee0a90df1296a626bbde26edb9d86f56c3a',head=git('rev-parse','HEAD').toString().trim(),receipt=n=>JSON.parse(fs.readFileSync(`work/orchestration/m16-seat-sync/${n}.json`)),full=receipt('check'),changed=receipt('corrected-m22'),isolated=receipt('foreground-isolated')
assert.equal(full.status,'failed');assert.equal(full.source.headOid,base)
for(const r of[changed,isolated]){assert.equal(r.status,'passed');assert.equal(r.source.headOid,head);assert.equal(r.source.trackedDiffSha256,sha(Buffer.alloc(0)))}
const changedFiles=['tests/balloon-person-attack.test.mjs','tests/balloon-plain-person-attack.test.mjs','tests/balloon-staged-movement.test.mjs'],all=fs.readdirSync('tests').filter(n=>n.endsWith('.test.mjs')).map(n=>'tests/'+n).sort(),files=[]
for(const file of all){const before=sha(git('show',`${base}:${file}`)),after=sha(fs.readFileSync(file));if(before!==after)assert.ok(changedFiles.includes(file),file);files.push({file,before,after,receipt:changedFiles.includes(file)?'corrected-m22':file==='tests/foreground-command.test.mjs'?'foreground-isolated':'check'})}
for(const file of['app','public','package.json','package-lock.json'])assert.equal(git('rev-parse',`${base}:${file}`).toString(),git('rev-parse',`${head}:${file}`).toString(),file)
const log=fs.readFileSync(full.artifacts.stdout,'utf8');assert.match(log,/ℹ tests 2611\nℹ suites 0\nℹ pass 2606\nℹ fail 5/)
const failed=log.slice(log.indexOf('✖ failing tests:'));for(const file of[...changedFiles,'tests/foreground-command.test.mjs'])assert.ok(failed.includes(file));
const result={status:'passed',scope:'Combined file/source qualification, not a green aggregate. Original fullcheck remains failed2606/2611; complete changed M22 files and isolated unchanged timeout fixture rerun normally.',fullHead:base,finalHead:head,testFileCount:files.length,originalCaseCount:2611,changedFiles,addedHelper:'tests/helpers/seated-attack-origin.mjs',helperSha256:sha(fs.readFileSync('tests/helpers/seated-attack-origin.mjs')),files}
fs.writeFileSync('work/m16-seat-sync/combined-coverage.json',JSON.stringify(result,null,2));console.log(JSON.stringify({...result,files:undefined}))
