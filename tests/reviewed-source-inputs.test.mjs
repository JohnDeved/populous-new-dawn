import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import * as fs from 'node:fs'
import * as path from 'node:path'
import vm from 'node:vm'
import { createHash } from 'node:crypto'
import { performance } from 'node:perf_hooks'
import { reviewedSourceInputs } from '../scripts/browser-performance/reviewed-source-inputs.mjs'
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(),'pnd-source-'))
  t.after(()=>rmSync(root,{recursive:true,force:true}))
  const git = args => execFileSync('git',['-C',root,...args],{encoding:'utf8',env:{...process.env,
    GIT_AUTHOR_NAME:'Fixture',GIT_AUTHOR_EMAIL:'fixture@example.invalid',GIT_COMMITTER_NAME:'Fixture',GIT_COMMITTER_EMAIL:'fixture@example.invalid'}}).trim()
  git(['init','-q'])
  const paths=['package.json','package-lock.json','pnpm-lock.yaml','pnpm-workspace.yaml','patches/example.patch']
  mkdirSync(join(root,'patches'))
  for(const path of paths)writeFileSync(join(root,path),path)
  git(['add','.']);git(['commit','-qm','fixture'])
  return {root,paths,revision:git(['rev-parse','HEAD'])}
}
test('exact clean committed input bytes produce a bound source manifest', t=>{
  const f=fixture(t),r=reviewedSourceInputs(f.root,f.revision,f.paths)
  assert.equal(r.revision,f.revision);assert.equal(r.blobs.length,5);assert.equal(Object.keys(r.inputs).length,5)
})
test('wrong revision fails before producing provenance',t=>{
  const f=fixture(t);assert.throws(()=>reviewedSourceInputs(f.root,'0'.repeat(40),f.paths),/Unexpected HEAD/)
})
test('dirty patch cannot borrow committed identity',t=>{
  const f=fixture(t);writeFileSync(join(f.root,'patches/example.patch'),'different')
  assert.throws(()=>reviewedSourceInputs(f.root,f.revision,f.paths),/Tracked source must be clean/)
})
test('missing committed patch and unsafe path fail closed',t=>{
  const f=fixture(t)
  assert.throws(()=>reviewedSourceInputs(f.root,f.revision,[...f.paths,'patches/missing.patch']),/regular committed blob/)
  assert.throws(()=>reviewedSourceInputs(f.root,f.revision,[...f.paths,'../outside']),/Unsupported input path/)
})
test('nested directory cannot masquerade as exact checkout root',t=>{
  const f=fixture(t);assert.throws(()=>reviewedSourceInputs(join(f.root,'patches'),f.revision,f.paths),/checkout root/)
})

test('declaration count and graph-input completeness are bounded',t=>{
  const f=fixture(t)
  assert.throws(()=>reviewedSourceInputs(f.root,f.revision,Array.from({length:65},(_,i)=>`p${i}`)))
  assert.throws(()=>reviewedSourceInputs(f.root,f.revision,f.paths.filter(p=>p!=='pnpm-lock.yaml')),/Missing graph input/)
})

// Supplied-I/O boundaries exercise the exact production body; not an atomic FS guarantee.
function controlled(overrides = {}) {
  const text = fs.readFileSync(new URL('../scripts/browser-performance/reviewed-source-inputs.mjs', import.meta.url),'utf8')
  const body = text.replace(/^import .*$/gm,'').replace(/^export /gm,'')
  return vm.runInNewContext(`${body}; reviewedSourceInputs`, {
    ...fs, ...path, assert, Buffer, process, createHash, performance, execFileSync, ...overrides,
  })
}
for (const kind of ['HEAD', 'status']) test(`final ${kind} change fails closed`, t => {
  const f = fixture(t); let count = 0
  const check = controlled({execFileSync: (command,args,options) => {
    const match = kind === 'HEAD' ? args.includes('HEAD') : args.includes('status')
    if (match && ++count === 2) return Buffer.from(kind === 'HEAD' ? '0'.repeat(40) : ' M package.json')
    return execFileSync(command,args,options)
  }})
  assert.throws(()=>check(f.root,f.revision,f.paths), /changed during admission/)
  assert.equal(count,2)
})
test('working file growth during read fails and closes descriptor', t => {
  const f=fixture(t); let first=true, closes=0
  const check=controlled({readSync: (fd,buffer,...args) => {
    if(first) { first=false; fs.appendFileSync(join(f.root,'package.json'),'grew') }
    return fs.readSync(fd,buffer,...args)
  }, closeSync: fd => { closes++; fs.closeSync(fd) }})
  assert.throws(()=>check(f.root,f.revision,f.paths),/Working input grew/)
  assert.equal(closes,1)
})
test('cumulative budget decreases subprocess timeout and rejects overrun', t => {
  const f=fixture(t); let now=0; const timeouts=[]
  const check=controlled({performance: {now:()=>now}, execFileSync:(command,args,options)=>{
    timeouts.push(options.timeout)
    const result=execFileSync(command,args,options); now+=8000; return result
  }})
  assert.throws(()=>check(f.root,f.revision,f.paths),/deadline exceeded/)
  assert.deepEqual(timeouts,[10000,10000,10000,6000])
})
test('deadline during working read closes descriptor before failing', t => {
  const f=fixture(t); let now=0, closes=0
  const check=controlled({performance:{now:()=>now}, readSync:(...args)=>{
    const n=fs.readSync(...args); now=30001; return n
  }, closeSync:fd=>{closes++;fs.closeSync(fd)}})
  assert.throws(()=>check(f.root,f.revision,f.paths),/deadline exceeded/)
  assert.equal(closes,1)
})
