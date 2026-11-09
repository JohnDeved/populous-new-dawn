import assert from 'node:assert/strict'
import fs from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import test from 'node:test'
import { runCommandReceipt } from '../scripts/orchestration/command-receipt.mjs'

function fixture(t) {
  const repo=fs.mkdtempSync(join(tmpdir(),'receipt-budget-'))
  t.after(()=>fs.rmSync(repo,{recursive:true,force:true}))
  fs.writeFileSync(join(repo,'.gitignore'),'work/\n')
  const git=(...args)=>execFileSync('git',args,{cwd:repo,stdio:'pipe'})
  git('init','-q');git('add','.gitignore');git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture')
  return {repo, run: (streamVersion, source, maxRawBytes) => runCommandReceipt(repo, {output:`work/orchestration/v${streamVersion}.json`,streamVersion,maxRawBytes,command:[process.execPath,'-e',source]})}
}
for (const version of [1,2]) test(`v${version} standalone producer rejects combined raw overflow without publishing a pass`,async t=>{
  const f=fixture(t), result=await f.run(version,"process.stdout.write('1234');process.stderr.write('56789')",7)
  assert.equal(result.status,'failed')
  assert.equal(result.rawCapture.complete,false)
  assert.deepEqual(result.rawBudget,{maxBytes:7,usedBytes:7,exceeded:true})
  assert.equal(['stdout','stderr'].reduce((n,s)=>n+fs.statSync(result.artifacts[s]).size,0),7)
  if(version===2){assert(fs.existsSync(result.artifacts.stdout.replace('stdout.log','publication.pending')));assert(!fs.existsSync(result.artifacts.stdout.replace('stdout.log','publication.complete')))}
})
