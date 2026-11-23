import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { readReviewCoverage } from '../scripts/review-coverage.mjs'
import { fileURLToPath } from 'node:url'

const A='00400001', B='00400002', C='00400003', D='00400004'
const executableSha256='9'.repeat(64)
const bytes = s => createHash('sha256').update(s).digest('hex')
const inventory = JSON.stringify({executableSha256,files:Object.fromEntries([A,B,C,D].map(a=>[a+'.c','2'.repeat(64)]))})
const row=(address,status)=>({address,status,scope:'Scoped test',limits:'Test fixture',sources:['app/test.ts'],evidence:['tests/test.mjs']})
const ledger = rows => JSON.stringify({schema:1,executableSha256,entries:rows})
function repo(t) {
 const dir=mkdtempSync(join(tmpdir(),'hold-reader-')); t.after(()=>rmSync(dir,{recursive:true,force:true}))
 const git=(...args)=>execFileSync('git',['-C',dir,...args],{stdio:['ignore','pipe','pipe'],encoding:'utf8'}).trim()
 git('init','--quiet'); git('config','user.name','Fixture'); git('config','user.email','fixture@example.test')
 for(const name of ['app','decomp'])mkdirSync(join(dir,name))
 const write=(name,data)=>writeFileSync(join(dir,name),data)
 write('app/test.ts','export const value=1\n'); write('decomp/exports.json',inventory)
 write('decomp/function-progress.json',ledger([row(A,'implemented'),row(D,'missing')]))
 let parent
 const commit=name=>{
  git('add','.')
  const p=parent?['-p',parent]:[]
  parent=git('commit-tree',git('write-tree'),...p,'-m',name)
  return parent
 }
 const base=commit('Audited')
 const audit={schema:1,method:'bounded-source-review-v1',reviewedRevision:base,appTree:git('rev-parse',base+':app'),
   inventorySha256:bytes(inventory),held:{oracle:[A,B]}}
 return {dir,git,write,commit,base,audit}
}

test('real Git pinned reader repeats and supersedes only a resolved hold',t=>{
 const {dir,audit,base,write,commit}=repo(t)
 const result=readReviewCoverage(dir,base,audit)
 assert.deepEqual(readReviewCoverage(dir,base,audit),result)
 assert.equal(result.state,'current');assert.deepEqual(result.held,[{address:B,reason:'oracle'}])
 assert.deepEqual(result.notRecordedAddresses,[C])
 write('app/test.ts','dirty uncommitted source'); // reader ignores worktree
 assert.deepEqual(readReviewCoverage(dir,base,audit),result)
 write('app/test.ts','export const value=1\n')
 write('decomp/function-progress.json',ledger([row(A,'implemented'),row(B,'partial'),row(D,'missing')]))
 const next=commit('Resolve B in ledger')
 assert.equal(readReviewCoverage(dir,next,audit).heldAfterSourceReview,0)
 assert.equal(readReviewCoverage(dir,next,audit).notRecordedAsReviewed,1)
 assert.equal(readReviewCoverage(dir,base,audit).heldAfterSourceReview,1)
})

test('real Git changed app/inventory and unrelated revisions are historical without counts',t=>{
 const {dir,audit,base,write,commit,git}=repo(t)
 const report=(rev,reason)=>assert.deepEqual(readReviewCoverage(dir,rev,audit),
   {reviewedRevision:base,readRevision:rev,state:'historical',reason})
 const unrelated=git('commit-tree',base+'^{tree}','-m','Unrelated with identical tree')
 report(unrelated,'unrelated-revision')
 write('decomp/exports.json',inventory+'\n'); const changedInventory=commit('Change inventory')
 report(changedInventory,'inventory-changed')
 write('decomp/exports.json',inventory); write('app/test.ts','export const value=2\n')
 report(commit('Change app'), 'app-tree-changed')
})

test('immutable commit identities and the audited tree and inventory are verified',t=>{
 const {dir,audit,base,git}=repo(t)
 assert.throws(()=>readReviewCoverage(dir,'HEAD',audit),/immutable/)
 assert.throws(()=>readReviewCoverage(dir,base,{...audit,appTree:'4'.repeat(40)}),/app tree does not match/)
 assert.throws(()=>readReviewCoverage(dir,base,{...audit,inventorySha256:'5'.repeat(64)}),/inventory.*does not match/)
 const tag=execFileSync('git',['-C',dir,'mktag'],{encoding:'utf8',
  input:`object ${base}\ntype commit\ntag v1\ntagger Fixture <fixture@example.test> 1700000000 +0000\n\nfixture tag\n`}).trim()
 assert.throws(()=>readReviewCoverage(dir,tag,audit),/not the specified commit/)
})

test('reserved, duplicate or unknown hold addresses cannot be reported',t=>{
 const {dir,base,audit}=repo(t)
 for(const reason of ['missing','implemented','partial','unassessed','unknown','constructor','__proto__'])
  assert.throws(()=>readReviewCoverage(dir,base,{...audit,held:{[reason]:[B]}}),/hold reason/i)
 for(const held of [{oracle:['00400005']},{oracle:[B],scope:[B]},{oracle:[B,A]}])
  assert.throws(()=>readReviewCoverage(dir,base,{...audit,held}),/hold address/i)
})

test('separate CLI reads the committed audit only from the supplied revision',t=>{
 const {dir,audit,base,write,commit}=repo(t)
 const script=fileURLToPath(new URL('../scripts/review-coverage.mjs',import.meta.url))
 const cli=rev=>execFileSync(process.execPath,[script,rev],{cwd:dir,encoding:'utf8',stdio:['ignore','pipe','pipe']})
 assert.throws(()=>cli(base),/function-review-coverage.json/)
 write('decomp/function-review-coverage.json',JSON.stringify(audit))
 const pinned=commit('Land audit')
 write('decomp/function-review-coverage.json','dirty audit bytes')
 assert.equal(JSON.parse(cli(pinned)).heldAfterSourceReview,1)
 assert.throws(()=>cli('HEAD'),/immutable/)
})
