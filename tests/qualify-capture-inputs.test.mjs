import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join,dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import expected from '../scripts/tutorial-browser/capture-qualified-inputs.json' with { type:'json' }
const sourceRoot=new URL('../',import.meta.url)
async function fixture() {
 const cwd=mkdtempSync(join(tmpdir(),'capture-identity-')),node=join(cwd,'synthetic-node-data')
 const bytes=Buffer.from('fixture executable identity only; never executed');writeFileSync(node,bytes)
 const hash=createHash('sha256').update(bytes).digest('hex')
 try {
 const synthetic={}
 for(const path of Object.keys(expected)) {
  const content=Buffer.from('inert fixture data for '+path)
  synthetic[path]=createHash('sha256').update(content).digest('hex')
  mkdirSync(dirname(join(cwd,path)),{recursive:true});writeFileSync(join(cwd,path),content)
 }
 const moduleDir=join(cwd,'test-qualifier');mkdirSync(moduleDir)
 writeFileSync(join(moduleDir,'qualify.mjs'),readFileSync(new URL('scripts/tutorial-browser/qualify-capture-inputs.mjs',sourceRoot)))
 writeFileSync(join(moduleDir,'capture-qualified-inputs.json'),JSON.stringify(synthetic))
 var {qualifyCaptureInputs}=await import(pathToFileURL(join(moduleDir,'qualify.mjs')))
 }catch(e){rmSync(cwd,{recursive:true,force:true});throw e}
 return {qualifyCaptureInputs,input:{cwd,node,runner:join(cwd,'scripts/tutorial-browser/run.mjs')},hash,clean:()=>rmSync(cwd,{recursive:true,force:true})}
}
test('17 synthetic input slots qualify using exact production qualifier bytes; no real package claim',async()=>{
 const f=await fixture(),{qualifyCaptureInputs}=f;try{assert.equal(qualifyCaptureInputs(f.input,f.hash).files,17)}finally{f.clean()}
})
test('bundle and runner drift fail closed, even if package version unchanged',async()=>{
 const f=await fixture(),{qualifyCaptureInputs}=f;try{
  for(const path of ['node_modules/playwright-core/lib/utilsBundle.js','scripts/tutorial-browser/run.mjs','scripts/tutorial-browser/run-capture-protocol.mjs','scripts/tutorial-browser/integrated-capture-protocol.mjs']){
   const file=join(f.input.cwd,path),b=readFileSync(file);writeFileSync(file,Buffer.concat([b,Buffer.from('\n')]));assert.throws(()=>qualifyCaptureInputs(f.input,f.hash),/identity mismatch/);writeFileSync(file,b)
  }
 }finally{f.clean()}
})
test('missing Node authority, wrong runner and executable drift cannot launch',async()=>{
 const f=await fixture(),{qualifyCaptureInputs}=f;try{
  assert.throws(()=>qualifyCaptureInputs(f.input),/authorized Node/)
  assert.throws(()=>qualifyCaptureInputs({...f.input,runner:'/different'},f.hash),/runner path/)
  writeFileSync(f.input.node,'changed');assert.throws(()=>qualifyCaptureInputs(f.input,f.hash),/Node identity mismatch/)
 }finally{f.clean()}
})
test('concrete qualifier refuses relative cwd, node or runner before reading a different location',async()=>{
 const f=await fixture(),{qualifyCaptureInputs}=f;try{
 for(const patch of [{node:'node'},{runner:'runner.mjs'},{cwd:'.'}])
  assert.throws(()=>qualifyCaptureInputs({...f.input,...patch},f.hash),/absolute/)
 }finally{f.clean()}
})
