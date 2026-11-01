import test from 'node:test'
import assert from 'node:assert/strict'
import { captureDescendantEnvironment } from '../scripts/tutorial-browser/capture-descendant-environment.mjs'
import { readFileSync } from 'node:fs'
test('disabled preserves original environment identity and all values',()=>{
 const env={DEBUG_FILE:'/existing',DEBUG:'*',MAX_LOG_LENGTH:'1',PND_CAPTURE_PROTOCOL_WINDOW:'1'}
 assert.equal(captureDescendantEnvironment(env),env)
})
test('enabled builder descendants cannot inherit diagnostic log or marker settings',()=>{
 const env={DEBUG:'pw:protocol',DEBUG_FILE:'/raw',debug_file:'/raw2',DEBUG_COLORS:'0',DEBUG_HIDE_DATE:'1',MAX_LOG_LENGTH:'1024',PND_CAPTURE_PROTOCOL_WINDOW:'1',PATH:'/bin',HOME:'/owned',CI:'true'}
 const out=captureDescendantEnvironment(env,true)
 assert.deepEqual(out,{PATH:'/bin',HOME:'/owned',CI:'true'});assert.equal(env.DEBUG_FILE,'/raw')
 assert.deepEqual(captureDescendantEnvironment(out,true),out)
})
test('proposal routes every direct process-launch callsite and retains source deadlines/assertions',()=>{
 const source=JSON.parse(readFileSync(new URL('./fixtures/capture/runner-baseline-lines.json',import.meta.url),'utf8'))
 const candidate=readFileSync(new URL('../scripts/tutorial-browser/run.mjs',import.meta.url),'utf8')
 assert.equal((candidate.match(/execFileSync\(/g)||[]).length,3)
 assert.equal((candidate.match(/env: descendantEnv/g)||[]).length,5,'three execs, builder spawn, Chrome launch')
 assert.deepEqual(candidate.match(/^.*assert\..*$/gm).filter(x=>!x.includes('captureProtocolEnabled')),source.assertions)
 assert.deepEqual(candidate.match(/^.*setTimeout\(.*$/gm),source.timers)
 assert.ok(candidate.includes("child.stdout.on('data', b => chunks.push(b)); child.stderr.on('data', b => chunks.push(b))"),'ordinary build log unchanged, sanitized child env instead')
})
