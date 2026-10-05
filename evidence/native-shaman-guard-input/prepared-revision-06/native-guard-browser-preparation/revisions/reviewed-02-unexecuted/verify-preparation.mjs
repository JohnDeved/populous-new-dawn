// Source-only checks. No browser, server, build, dependency or simulation work.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const here=dirname(fileURLToPath(import.meta.url)), root=resolve(here,'../../..')
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const provenance=JSON.parse(readFileSync(resolve(here,'provenance.json'),'utf8'))
const checks=[]
const history=JSON.parse(readFileSync(resolve(here,'revision-history.json'),'utf8'))
for(const revision of history.revisions)for(const[name,digest]of Object.entries(revision.inputs))assert.equal(hash(readFileSync(resolve(here,revision.path,name))),digest,`Preserved unexecuted revision: ${name}`)
checks.push('The complete first reviewed packet, including its scenario/observer/receipt, is preserved byte-for-byte as unexecuted history')
for(const[path,record]of Object.entries(provenance.sources))assert.equal(hash(readFileSync(resolve(root,path))),record.sha256,`Original source unchanged: ${path}`)
checks.push('Every original accepted helper and old preparation source retains its supplied hash')
const campaign=resolve(root,'../current-campaign-continuity/qa/campaign-continuity')
const text=readFileSync(resolve(campaign,'scenario.mjs'),'utf8')
const section=(s,a,b)=>{const start=s.indexOf(a);assert.ok(start>=0,a);const end=s.indexOf(b,start);assert.ok(end>start,b);return s.slice(start,end)}
const next={map:'rotate',rotate:'entityHit',entityHit:'resolveId',resolveId:'targetEntity',targetEntity:'selectUnits',prepareEntityClick:'finishEntityClick',finishEntityClick:'clickOrder',clickOrder:'groundHit'}
for(const {name,sha256}of provenance.fragments){
  const source=section(text,`  const ${name} =`,`  const ${next[name]} =`)
  assert.equal(hash(source),sha256,`Frozen source closure ${name}`)
  let expected=source
  for(const[a,b]of name==='clickOrder'?provenance.clickOrderAdaptations:provenance.adaptations)expected=expected.replaceAll(a,b)
  const target=readFileSync(resolve(here,name==='clickOrder'?'ground-and-dispatch.mjs':'ordinary-input.mjs'),'utf8')
  assert.ok(target.includes(expected),`Exactly adapted closure ${name}`)
}
checks.push('All eight accepted local closures match the original body plus enumerated adaptations')
const observation=readFileSync(resolve(campaign,'observation.mjs'),'utf8')
const probeSource=readFileSync(resolve(campaign,'command-probes.mjs'),'utf8')
const expectedProbe=probeSource.replaceAll("'../../app/","'/app/")+'\n'+section(observation,'export function minimapInput(','const markerCell')
assert.equal(readFileSync(resolve(here,'browser-probes.mjs'),'utf8'),expectedProbe)
const boundaries=readFileSync(resolve(campaign,'boundaries.mjs'),'utf8')
assert.equal(readFileSync(resolve(here,'replacement-observer.mjs'),'utf8'),section(boundaries,'export function installReplacementObservation()','// Only verified Continue-boundary'))
checks.push('Browser probes and replacement observers match their copied source boundary')
const commits=JSON.parse(readFileSync(resolve(here,'runtime-sources.json'),'utf8'))
for(const[commit,paths]of Object.entries(commits))for(const[path,digest]of Object.entries(paths)){
  let bytes=null;try{bytes=execFileSync('git',['-C',root,'show',`${commit}:${path}`],{stdio:['ignore','pipe','pipe']})}catch{}
  assert.equal(bytes===null?null:hash(bytes),digest,`${commit}:${path}`)
}
assert.equal(execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),provenance.runtime.candidate)
assert.equal(execFileSync('git',['-C',root,'status','--porcelain'],{encoding:'utf8'}).trim(),'')
checks.push('Both frozen runtime source manifests match Git; candidate tracked source remains clean')
const files=readdirSync(here).filter(n=>n.endsWith('.mjs')).sort()
for(const name of files)execFileSync(process.execPath,['--check',resolve(here,name)],{stdio:['ignore','pipe','pipe']})
await import(pathToFileURL(resolve(here,'scenario.mjs')).href)
checks.push('Every prepared module passes Node syntax; scenario import has no execution side effects')
// Substitute only the diagnostic clone's model dependencies, never actual game code.
const stub=`const syncNativeTerrain = w => { w.terrainTouched = true };\nconst syncLandscapeObjects = w => { w.landscapeTouched = true };\nconst liveCommandContext = (w, point) => { w.units[0].changed = true; return { model: 8, enabled: true, building: w.buildings.find(b => b.id === point.id) } };\n`
const pure=stub+expectedProbe.replace(/^import .*\n/gm,'')
const probes=await import('data:text/javascript;base64,'+Buffer.from(pure).toString('base64'))
const world={units:[{id:1}],buildings:[{id:149,x:20,z:-8}]}, before=structuredClone(world)
assert.deepEqual(probes.createMoveContextProbe(world)({id:149,x:20,z:-8}),{model:8,enabled:true,buildingId:149,personId:null,shrineId:null,treeId:null,vehicleId:null})
assert.deepEqual(world,before,'Clone synchronizers/classifier cannot mutate caller-owned input')
const inspect=p=>({canvasOwned:p.x>=8&&p.x<=12&&p.y>=8&&p.y<=12,hitId:149})
assert.equal(probes.findEntityInput([{x:8.2,y:8.2}],149,inspect),null)
assert.deepEqual(probes.findEntityInput([{x:8.2,y:8.2},{x:10.2,y:9.8}],149,inspect),{x:10,y:10,interiorRadius:2})
assert.throws(()=>probes.requireEntityContext({id:149},{turn:5,targetId:149,selected:[1],context:{model:8,enabled:false}},{turn:5,selected:[1]}))
probes.requireEntityContext({id:149},{turn:5,targetId:149,selected:[1],context:{model:8,enabled:true}},{turn:5,selected:[1]})
checks.push('Pure mocks reject silhouette-edge targets and disabled contexts, and preserve live-input ownership under mutating clone-only validators')
const { checkpointGuardState }=await import(pathToFileURL(resolve(here,'checkpoint-guard.mjs')).href)
const person={id:7,class:1,model:6,target:9,guardInputPending:true,commands:[1,0],immediateCommand:0,commandCursor:0,f1:2,f2:3,stamp:4}
const fixture={outcome:{level:10},turn:99,time:4,speed:1,paused:true,selected:[7],units:[{id:7,team:'blue',kind:'firewarrior',hp:100,x:20,z:-8,native:person,entry:{person}}],buildingOrders:{records:[{}, {model:30,a:9,b:0,references:1}],cursor:2,active:1},manaTribes:[{shamanGuards:0,shamanGuardChanged:1}]}
const untouched=structuredClone(fixture);globalThis.window={testStore:{getWorld:()=>fixture}}
const state=await checkpointGuardState({live:true,unitIds:[7]})
assert.equal(state.people[0].owners[0].guardInputPending,true)
assert.equal(state.people[0].owners[0].target,9)
assert.deepEqual(state.people[0].owners[0].aliases,['native','entry.person'])
assert.equal(state.people[0].owners[0].orders[0].a,9)
assert.equal(state.tribe.shamanGuards,0);assert.deepEqual(fixture,untouched)
globalThis.window.campaignLoadBoundary={world:structuredClone(fixture)}
assert.deepEqual(await checkpointGuardState({observationName:'campaignLoadBoundary',unitIds:[7]}),state)
person.commands=[0,0]
const cancelled=await checkpointGuardState({live:true,unitIds:[7]})
assert.equal(cancelled.people[0].owners[0].target,9);assert.deepEqual(cancelled.people[0].owners[0].orders,[])
globalThis.window.campaignLoadBoundary={world:structuredClone(fixture)}
assert.deepEqual(await checkpointGuardState({observationName:'campaignLoadBoundary',unitIds:[7]}),cancelled)
delete globalThis.window
const regressionOutput=execFileSync(process.execPath,['--test',resolve(here,'guard-assertions.test.mjs')],{encoding:'utf8'})
checks.push('Six identity/target regression cases pass: Unit/native swaps, intervening row swaps, source ownership, verified Load-only rebind, current-order selection, pending target0, saved target/queue/aliases')
checks.push('Narrow checkpoint observer preserves marker, target, aliases and guard count without modifying supplied data')
const hashes=Object.fromEntries(readdirSync(here).filter(n=>/\.(mjs|json|md|txt)$/.test(n)&&n!=='preparation-receipt.json').sort().map(n=>[n,hash(readFileSync(resolve(here,n)))]))
console.log(JSON.stringify({status:'passed',kind:'source-only preparation checks',time:new Date().toISOString(),node:process.version,checks,identityTargetRegressions:{command:'node --test guard-assertions.test.mjs',exitCode:0,stdout:regressionOutput},inputs:hashes,browser:'not-run',server:'not-run',build:'not-run',profiles:'not-touched',dependencies:'not-touched',parity:'no-credit'},null,2))
