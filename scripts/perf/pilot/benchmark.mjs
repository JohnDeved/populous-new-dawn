import assert from 'node:assert/strict'
import { readFileSync, existsSync, realpathSync, statfsSync, writeSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { registerHooks } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'
import os from 'node:os'

const pilot=JSON.parse(readFileSync(new URL('./config.json',import.meta.url),'utf8'))
const variant=process.env.PILOT_VARIANT
assert.ok(['baseline','candidate'].includes(variant))
assert.equal(process.version,pilot.nodeVersion)
const root=fileURLToPath(new URL(`../../../outputs/centers-pilot/sources/${variant}/`,import.meta.url)).replace(/\/$/,'')
const expectedFiles=pilot.files[variant]
const config={benchmark:'hosted-terrain-centers-water-pilot-v1',mission:1,warmups:128,repetitions:256,width:1920,height:1080,
 sourceRoot:root,targetCommit:pilot[`${variant}Commit`],variant}
const emit=row=>writeSync(1,JSON.stringify(row)+'\n')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const fingerprints = new Map()
function remember(path) {
  path = realpathSync(path)
  const digest = hash(readFileSync(path))
  if (fingerprints.has(path)) assert.equal(digest, fingerprints.get(path), `Input changed during loading: ${path}`)
  else fingerprints.set(path, digest)
}
const fixed = ['package.json', 'package-lock.json', 'app/scene.ts',
  'app/scene-terrain-runtime.ts', 'app/water.ts', 'app/projection.ts',
  'tests/support/bloodlust-scene.mjs', 'tests/support/world-environment-scene.mjs',
  'tests/water-animation-callers.test.mjs']
for (const [file, digest] of Object.entries(expectedFiles)) {
  assert.equal(hash(readFileSync(`${root}/${file}`)), digest, `Snapshot drift: ${file}`)
}
for (const file of fixed) assert.ok(existsSync(`${root}/${file}`), `Missing ${file}`)
const outputFs=statfsSync(root); assert.ok(outputFs.bsize*outputFs.bavail>4*1024*1024)
assert.ok(outputFs.bsize*outputFs.bavail>64*1024*1024,'Require 64 MiB runtime output headroom')
if (process.argv.includes('--validate-config')) {
  console.log(JSON.stringify({ type: 'configuration', status: 'valid', ...config,
    node: process.version, note: 'No production imports, fixture execution or timing performed.' }))
  process.exit(0)
}
assert.deepEqual(process.argv.slice(2), ['--run'], 'Explicit --run required')
for (const file of Object.keys(expectedFiles)) remember(`${root}/${file}`)
remember(fileURLToPath(import.meta.url))
// Register before the existing fixture hooks so every resolution is fingerprinted,
// including source returned by the fixture transpiler instead of the default loader.
registerHooks({ resolve(specifier, context, next) {
  const result = next(specifier, context)
  if (result.url.startsWith('file:')) remember(fileURLToPath(result.url))
  return result
} })
const start = performance.now()
const { loadSceneFixture } = await import(pathToFileURL(`${root}/tests/support/bloodlust-scene.mjs`))
const { bindSceneEnvironment } = await import(pathToFileURL(`${root}/tests/support/world-environment-scene.mjs`))
const api = await loadSceneFixture()
const { GameScene } = await import(pathToFileURL(`${root}/app/scene.ts`))
const { RenderView } = await import(pathToFileURL(`${root}/app/render-view.ts`))
const { initializeTerrain } = await import(pathToFileURL(`${root}/app/scene-terrain-runtime.ts`))
const { painterDepth, comparePolygons } = await import(pathToFileURL(`${root}/app/painter-order.ts`))
const THREE = await import(pathToFileURL(`${root}/node_modules/three/build/three.module.js`))
const importsMs = performance.now() - start
const originalFetch = globalThis.fetch
const assets = []
globalThis.fetch = async url => {
  assert.ok(typeof url === 'string' && url.startsWith('/original/') && !url.includes('..'))
  const path = `${root}/public${url}`; remember(path); assets.push(path)
  const bytes = readFileSync(path)
  return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }
}
const noop = () => {}
const world = api.createWorld(config.mission)
const scene = Object.assign(Object.create(GameScene.prototype), {
  world, terrainLoad: new AbortController(), terrainMap: new THREE.DataTexture(),
  waterMap: new THREE.DataTexture(new Uint8Array(256 * 256 * 4), 256, 256),
  waterScroll: { value: 0 }, updateTerrainTexture: noop, updateView: noop,
  view: new RenderView(), decorations: new THREE.Group(), scene: new THREE.Scene(),
})
scene.updateView = () => scene.view.update(config.width,config.height,{x:2,z:30},0,0,false)
const setupStart = performance.now()
await bindSceneEnvironment(scene)
const initialized = initializeTerrain(scene); scene.terrain = initialized.terrain
await initialized.ready; scene.rebuildTerrain()
globalThis.fetch = originalFetch
const setupMs = performance.now() - setupStart
const terrain=scene.terrain, view=scene.view, painter=view.painter
scene.scene.add(terrain)
painter.landFlags=world.land.flags; painter.land=world.land; painter.cells=world.objectCells
view.prepare(scene.scene)
assert.equal(view.projection.width,config.width);assert.equal(view.projection.height,config.height)
assert.deepEqual(view.terrainHeights,[Math.min(0,...world.land.heights),Math.max(63,...world.land.heights)])
assert.equal(terrain.geometry.attributes.position.count,98304)
const originalMaterial=terrain.material, originalGroups=terrain.geometry.groups
assert.equal(originalMaterial.transparent,false)
let installedSort, sortInstallCount=0
const renderer={setTransparentSort:fn=>{installedSort=fn;sortInstallCount++}}
const bytes=a=>Buffer.from(a.buffer,a.byteOffset,a.byteLength)
const input=()=>({world:hash(JSON.stringify(world)),waves:hash(bytes(scene.waves)),
 geometry:Object.fromEntries(Object.entries(terrain.geometry.attributes).map(([n,a])=>[n,hash(bytes(a.array))])),
 index:hash(bytes(terrain.geometry.index.array)),drawRange:{...terrain.geometry.drawRange},
 instanceCount:terrain.count,instanceMatrices:hash(bytes(terrain.instanceMatrix.array))})
const output=()=>({texture:{width:painter.texture.image.width,height:painter.texture.image.height,hash:hash(bytes(painter.texture.image.data))},
 commands:hash(JSON.stringify(painter.commandsBySlot)),range:[...painter.ranges.get(terrain)],objectId:terrain.id,
 submittedIndex:hash(bytes(terrain.geometry.index.array.subarray(0,terrain.geometry.drawRange.count))),
 submittedCount:terrain.geometry.drawRange.count,instances:terrain.count,matrices:hash(bytes(terrain.instanceMatrix.array))})
const prepare=(name,index)=>{
 if(name==='water'){world.turn=index&255;scene.updateWater()}
 view.update(config.width,config.height,{x:2,z:30},name==='camera'?(index%64)*Math.PI/32:0,0,false)
 scene.scene.updateMatrixWorld(true)
 view.updateTerrainVisibility(terrain)
}
let collectTiming=false
const run=()=>{
 const version=painter.texture.version,sorts=sortInstallCount
 const start=collectTiming?process.hrtime.bigint():0n
 try {painter.update(scene.scene,renderer)} finally {painter.afterRender()}
 const ns=collectTiming?Number(process.hrtime.bigint()-start):0
 assert.equal(painter.texture.version,version+1);assert.equal(sortInstallCount,sorts+1)
 assert.equal(typeof installedSort,'function');assert.equal(painter.transparentMeshes.length,0)
 assert.equal(terrain.material,originalMaterial);assert.equal(terrain.geometry.groups,originalGroups)
 return ns
}
const check=()=>{
 let accepted=0
 for(const command of painter.commandsBySlot)if(command){
  accepted++;assert.equal(painter.commandsBySlot[command.slot],command)
  assert.ok(Number.isFinite(painter.texture.image.data[command.slot]))
 }
 assert.ok(accepted>0,'Fixture must submit nonzero commands')
 const ordered=painter.commandsBySlot.filter(Boolean).sort(comparePolygons),stretch=Math.max(1,accepted/16000)
 ordered.forEach((c,i)=>assert.equal(painter.texture.image.data[c.slot],painterDepth(i/stretch)))
 for(let slot=0;slot<painter.texture.image.data.length;slot++)if(!painter.commandsBySlot[slot])assert.equal(painter.texture.image.data[slot],2)
 assert.deepEqual(painter.ranges.get(terrain),[0,32768])
 assert.equal(painter.commandsBySlot.length,32768*terrain.count)
 return accepted
}
const checks=[]
for(const [name,index] of [['static',0],['water',0],['water',23],['water',255],['water',256],['camera',16],['camera',32]]){
 prepare(name,index);const worldBefore=structuredClone(world),before=input();run();const a=output(),accepted=check();run()
 assert.deepEqual(output(),a);assert.deepEqual(input(),before);assert.deepEqual(world,worldBefore)
 assert.deepEqual(a,pilot.archivedChecks.find(c=>c.name===name&&c.index===index).output)
 checks.push({name,index,accepted,output:a})
}
const phases=[]
for(let phase=0;phase<256;phase++){prepare('water',phase);run();check();phases.push(output())}
prepare('water',0);run()
// Verification creates the same retained capacity before every fresh process.
assert.equal(painter.texture.image.width,1024);assert.equal(painter.texture.image.height,64)
assert.equal(terrain.count,1);assert.equal(world.turn,0)
const prior=painter.centers.get(terrain.geometry.attributes.position).positions.array
prepare('water',1);run()
const next=painter.centers.get(terrain.geometry.attributes.position).positions.array
assert.equal(prior===next,variant==='candidate')
prepare('water',0);run()
const metadata={type:'manifest',...config,importsMs,setupMs,versions:process.versions,flags:process.execArgv,
 cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,totalMemory:os.totalmem(),platform:os.platform(),release:os.release(),
 runnerHash:hash(readFileSync(fileURLToPath(import.meta.url))),configHash:hash(readFileSync(new URL('./config.json',import.meta.url))),
 fixture:{focus:{x:2,z:30},heading:0,zoom:0,phaseBeforeWarmup:0,textureWidth:1024,textureHeight:64,instances:1},
 caveats:['Terrain-only CPU update+afterRender; excludes water/view/visibility preparation, hashing, GPU/browser and alpha execution.',
 'Rows are flushed outside timers in 64-call blocks; this IO can perturb scheduling and is identical for every variant.',
 'Current-engine deterministic oracle, not native visual parity. Warmups and samples are correlated, no FPS claim.']}
emit(metadata);emit({type:'phase-oracle',checks,phases})
const safeRead=path=>{try{return readFileSync(path,'utf8')}catch{return null}}
const cgroup=()=>Object.fromEntries(['/sys/fs/cgroup/cpu.max','/sys/fs/cgroup/cpu.stat','/sys/fs/cgroup/memory.max','/sys/fs/cgroup/memory.current'].map(p=>[p,safeRead(p)]))
const boundary=label=>({type:'boundary',label,utc:new Date().toISOString(),wallMs:performance.now(),
 processCpu:process.cpuUsage(),threadCpu:process.threadCpuUsage(),usage:process.resourceUsage(),memory:process.memoryUsage(),cgroup:cgroup()})
collectTiming=true
for(const [type,count] of [['warmup',128],['sample',256]]){
 emit(boundary(`${type}-before`))
 let pending=[]
 for(let i=0;i<count;i++){
  const turn=type==='warmup'?i:128+i
  prepare('water',turn);const ns=run();pending.push({type,index:i,turn,phase:turn&255,ns})
  if(pending.length===64){for(const row of pending)emit(row);pending=[]}
 }
 for(const row of pending)emit(row)
 emit(boundary(`${type}-after`))
}
collectTiming=false
const finalOutput=output(),worldBefore=structuredClone(world),before=input();run()
assert.deepEqual(output(),finalOutput);assert.deepEqual(input(),before);assert.deepEqual(world,worldBefore)
assert.deepEqual(finalOutput,phases[world.turn&255]);check()
for(const [path,digest] of fingerprints)assert.equal(hash(readFileSync(path)),digest,`Input drift ${path}`)
const sourceHashes={},dependencyHashes={}
for(const [path,digest] of fingerprints){if(path.startsWith(root+'/'))sourceHashes[path.slice(root.length+1)]=digest;else dependencyHashes[path]=digest}
for(const [path,digest] of Object.entries(sourceHashes))assert.equal(digest,expectedFiles[path],`Unexpected source ${path}`)
emit({type:'correctness',status:'pass',finalOutput,dependenciesStable:true,sourceHashes,dependencyHashes,
 allocationIdentityCheck:variant==='candidate'?'same-size storage reused':'same-size storage replaced'})
terrain.geometry.dispose();terrain.material.dispose();scene.terrainMap.dispose();scene.waterMap.dispose();view.dispose()
