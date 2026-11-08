// Synthetic, data-only admission fixtures. These are not browser or visual evidence.
// No application imports, candidate execution, filesystem reads or subprocesses.
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'
import { checkpointCodec } from '../../scripts/tutorial-browser/checkpoint-codec.mjs'
import { SPELL_VISUAL_POLICY, SPELL_VISUAL_INPUTS, SPELL_VISUAL_FILES } from '../../scripts/integration-queue/spell-visuals-policy.mjs'
import { SHIELD_VISUAL_INPUTS } from '../../scripts/tutorial-browser/shield-visuals-inputs.mjs'
const hash = value => createHash('sha256').update(value).digest('hex'), oid = n => String(n).repeat(40)
const source = { commit: oid(1) }
function angelAttributeChecksum(array) {
  let value = 2166136261
  for (const byte of new Uint8Array(array.buffer, array.byteOffset, array.byteLength)) value = Math.imul(value ^ byte, 16777619) >>> 0
  return value.toString(16).padStart(8, '0')
}
const original = { bases: {}, points: {62:[[3,6,9]],69:[[6,9,12]],76:[[9,12,15]]}, tribeTiles: [] }
for (const base of [62,69]) original.bases[base] = {pointIndices:Array(471).fill(0),model:{scale:1,uv:[],tiles:[],faces:[]}}
const poseOf = (base,to=76,scale=160) => ({base,from:62,to,frame:1,duration:2,scale})
function positionsOf(pose) {
  const from=original.points[pose.from][0],to=original.points[pose.to][0], values=from.map((v,i)=>(v+Math.trunc((to[i]-v)*pose.frame/pose.duration))/(i===2?-3:3))
  return new Float32Array(Array.from({length:471},()=>values).flat())
}
function createAngelVisualFixture() {
  const effects=[100,101,102,103].map((id,owner)=>({id,team:owner,x:10,z:20,height:30,angel:{presentation:{displayed:poseOf(62)}}}))
  const world={turn:0,time:0,pendingTime:0,randomState:1,cosmeticRandom:2,effects}
  const state={turn:0,time:0,pendingTime:0,randomState:1,cosmeticRandom:2,angels:structuredClone(effects)}
  return {transfer:checkpointCodec({version:4,world}),expected:checkpointCodec(world),receipt:{version:4,sourceCommit:source.commit,ids:effects.map(e=>e.id),state}}
}
function observation(segment) {
  const {receipt:fixture}=createAngelVisualFixture()
  const r={segment,error:null,done:true,sceneWorldMatched:true,worldReplaced:segment==='running',retention:{done:true},visits:100,samples:[],crops:[],contextFrames:[],resources:[],terminal:{reason:segment==='paused'?'paused-transition':'ordinary-expiry'},cleanup:{effectsRemoved:true,groupsRemoved:true,allOwnedDetached:true,disposed:{geometry:8,material:8,texture:0},neighbourSubmitted:true,neighbourAtlasUnchanged:true}}
  for(const [owner,id] of fixture.ids.entries()) {
    for(const base of [62,69]) r.resources.push({id,owner,base,bank:2,geometry:`${id}:${base}`,material:`${id}:${base}`,neighbourSharesAtlas:true,materialColor:[1,1,1],atlasUrl:'http://fixture/original/atlas.png',uv:[],tiles:[]})
    const poses=segment==='paused'?[poseOf(62)]:[poseOf(62),poseOf(62,62),poseOf(69,69),poseOf(69,69,120),poseOf(69,69,40)]
    for(const [index,pose] of poses.entries()) {
      const positions=positionsOf(pose),stamp=r.samples.length+1
      const s={rafTimestamp:stamp,sceneTimestamp:stamp,id,owner,base:pose.base,pose,presentation:{displayed:pose},turn:0,stamp,phase:index>=3?'dying':'alive',paused:segment==='paused',height:30,groupY:Math.round(30*45)/128,nativeTilt:0,nativeRoll:0,visible:true,submitted:true,scale:pose.scale,shaderScale:pose.scale,positionCount:1413,positionChecksum:angelAttributeChecksum(positions),positions:[...positions],bounds:{x:20,y:20,width:40,height:40}}
      r.samples.push(s)
    }
    const labels=segment==='paused'?['paused-transition']:['transition','base-62','base-69',...(owner===0?['death-large','death-small']:[])]
    const labelOf=s=>segment==='paused'?'paused-transition':s.pose.to>=76?'transition':s.phase==='dying'?s.scale>80?'death-large':'death-small':`base-${s.base}`
    for(const label of labels){
      const sample=r.samples.find(s=>s.id===id&&labelOf(s)===label),filename=`angel-${segment}-${r.crops.length}.png`
      sample.cropFile=filename
      r.crops.push({filename,label,id,stamp:sample.stamp,turn:sample.turn,pose:sample.pose,bounds:sample.bounds,canvasOwned:true,overlays:[],clip:{width:56,height:56},opaqueColors:16,sha256:'a'.repeat(64),pixelChecksum:'pending'})
    }
    if(segment==='running')r.crops.push({filename:`angel-${segment}-${r.crops.length}.png`,label:'cleared-footprint',id,cleared:true,canvasOwned:true,overlays:[],clip:{width:56,height:56},opaqueColors:16,sha256:'b'.repeat(64),pixelChecksum:'pending'})
  }
  if(segment==='running')for(const label of ['loop','death']){
    const s=r.samples.find(s=>s.owner===0&&(label==='loop'?s.base===62&&s.pose.to<76:s.phase==='dying'&&s.scale<=80))
    r.contextFrames.push({filename:`angel-${label}-context.png`,label,id:s.id,stamp:s.stamp,turn:s.turn,pose:s.pose,fullCanvas:true,clip:{x:0,y:0,width:1440,height:1000},opaqueColors:16,sha256:'a'.repeat(64),pixelChecksum:'pending'})
  }
  return {r,fixture}
}

function shieldReceiptEvidence({ source, inputs, files, png, units }) {
  const pins = Object.fromEntries(SHIELD_VISUAL_INPUTS.map(name => [name, inputs[name]]))
  const ids = { shaman: 1, blue: [16,17,18,19,20,21], foreign: [32,48,64] }
  const all = [...ids.blue, ...ids.foreign]
  const people = all.map(id => ({ id, shield: 180, flags3: 0x8000, fight: false }))
  const world = { units: people.map(person => ({ id:person.id,shield:person.shield,native:{flags3:person.flags3} })) }
  const put = (name,value) => { files[name]=Buffer.from(JSON.stringify(value));return hash(files[name]) }
  const transferSha256 = put('shield-checkpoint-transfer.json',checkpointCodec({version:4,world}))
  const expectedLoadedSha256 = put('shield-checkpoint-expected.json',checkpointCodec(world))
  const initialHash = put('shield-initial-load-boundary.json',checkpointCodec(world))
  put('shield-public-save.json',{version:4,world:checkpointCodec(world)})
  put('shield-public-load-expected.json',checkpointCodec(world))
  const loadedHash = put('shield-public-load-boundary.json',checkpointCodec(world))
  const buildHash = put('shield-build-frames.json',{buildRevision:source.commit})
  files['shield-context.png']=png(1280,900).bytes
  const setup = {version:4,sourceCommit:source.commit,sourceFiles:pins,transferSha256,expectedLoadedSha256,
    ids,supplied:{shieldShots:1,foreignRemainingTurns:180}}
  put('shield-checkpoint-source.json',setup)
  const state = () => ({people:structuredClone(people),sceneStoreMatch:true,canvasConnected:true})
  const beforeCast = {...state(),shots:1,inputMask:0,selected:[ids.shaman]}
  beforeCast.people.slice(0,6).forEach(person=>{person.shield=0;person.flags3=0})
  const terminal=state();terminal.people.slice(6).forEach(person=>{person.shield=0;person.flags3=0})
  const captures=['original','scaled','loaded'].map((label,index)=>{
    const owners=index===0?[0,1,2,3]:[0]
    const samples=owners.map(owner=>{
      const scaled=index===1, height=36, span=scaled?16:31, sources=[1538,1544,1550], lifts=[0,32,64]
      const image=png(40,44),filename=`shield-${label}-${owner}.png`;files[filename]=image.bytes
      return {id:owner?ids.foreign[owner-1]:ids.blue[0],owner,team:['blue','red','yellow','green'][owner],
        shield:180,animationFrame:0,stamp:10,cropStamp:10,nontransparentPixels:1760,cropColors:16,
        cropMatchesFramebuffer:true,framebufferRgbaSha256:image.rgbaSha256,retainedRgbaSha256:image.rgbaSha256,
        pngSha256:hash(image.bytes),config:{scaledSprites:scaled?1:0,scale:16,spriteScale:16},bucket:1000,
        bodyFrame:units.frames.findIndex(frame=>frame.nativeHeight===height),nativeFrameHeight:height,frameHeight:height,
        body:{left:-12,top:-36,right:12,bottom:0},bodyLayers:[{childIndex:1,command:{bucket:1000},depth:0.99}],
        overlays:[],canvasOwned:true,clip:{width:40,height:44},anchor:{z:0},
        pieces:sources.map((source,piece)=>({source,visible:true,isSprite:true,width:32,height:16,x:-16,
          y:-Math.trunc(lifts[piece]*span/256)-4,uv:[1/16,1,(source-1538)/16,0],uploadedUV:[1/16,1,(source-1538)/16,0],
          color:[0x333fcb,0xff4b16,0xdf9b1f,0x2fab63][owner],imageWidth:512,imageHeight:16,
          texture:'http://fixture/original/shield.png',nearest:true,mipmaps:false,transparent:true,depthWrite:false,
          toneMapped:false,opacity:1,command:{bucket:1000},depth:0.98-piece*0.01,childIndex:2+piece})),
        causal:{withoutStamp:11,restoredStamp:12,removedOnlyActorShield:true,changed:100,changedInsideShield:99,exactRestoredPixels:true},filename}
    })
    const capture={label,samples,worldUnchanged:true,cameraClockUnchanged:true,worldBeforeSha256:'a'.repeat(64),worldAfterSha256:'a'.repeat(64)}
    capture.acceptance={owners,scaled:index===1,actors:samples.length,visiblePixels:samples.length*99};return capture
  })
  const before = JSON.stringify(checkpointCodec({ ...world, paused: false })), after = JSON.stringify(checkpointCodec({ ...world, paused: true }))
  const boundarySha256 = put('shield-visible-pause.json', { before, after })
  return {schema:'populous-new-dawn/shield-visuals',schemaVersion:1,status:'passed',admission:'admitted',
    source:{commit:source.commit,files:pins},expectedRevision:source.commit,currentCheckpointVersion:4,errors:[],
    budget:{capMs:45000,outerReserveMs:10000,runnerDeadlineAt:180000,remainingAtAdmissionMs:120000,
      startedMonotonicMs:50000,deadlineMonotonicMs:95000,elapsedMs:20000},
    cleanup:{contextCreated:true,closeRequested:true,contextClosed:true,closedWithinBudget:true,
      createdElapsedMs:10,closeRequestedElapsedMs:19900,closedElapsedMs:19999},setup,
    initialLoad:{completeWorldMatched:true,sha256:initialHash},
    saved:{version:4,worldSha256:hash(JSON.stringify(checkpointCodec(world))),people:structuredClone(people)},
    loaded:{version:4,completeWorldMatched:true,worldSha256:loadedHash},beforeCast,afterCast:{...state(),shots:0},
    pauseBefore:state(),pauseAfter:state(),beforeExpiry:state(),terminal,
    visiblePause:{timestamp:123,sceneTimestamp:123,boundarySha256,beforeSha256:hash(before),afterSha256:hash(after),
      clockBefore:{animationFrame:1,animationTime:0},clockAfter:{animationFrame:1,animationTime:0},onlyPausedChanged:true},
    atlas:{sha256:inputs['public/original/shield.png'],bytes:1024},buildIdentity:{revision:source.commit,sha256:buildHash},captures,
    disposal:{materials:27,disposedMaterials:27,disposedAtlas:0,sceneReplaced:true,worldReplaced:true,disposed:true,canvasRemoved:true},
    expiry:{done:true,error:null,samples:[0,180].map(turn=>({turn,stamp:turn+1,
      people:ids.foreign.map(id=>({id,remaining:180-turn,flags3:turn?0:0x8000,visible:[!turn,!turn,!turn]}))}))}}
}

export function readerPng(width,height,seed=0){
 const rgba=Buffer.alloc(width*height*4),raw=Buffer.alloc(height*(width*4+1))
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4,c=seed+(x+y)%16;rgba.set([c,c,c,255],i);raw.set(rgba.subarray(i,i+4),y*(width*4+1)+1+x*4)
 }
 const chunk=(name,data)=>{const bytes=Buffer.alloc(data.length+12);bytes.writeUInt32BE(data.length);bytes.write(name,4);data.copy(bytes,8);let crc=0xffffffff
  for(const b of bytes.subarray(4,-4)){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0)}bytes.writeUInt32BE((crc^0xffffffff)>>>0,bytes.length-4);return bytes}
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6
 return {bytes:Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]),pixelChecksum:angelAttributeChecksum(rgba),opaqueColors:16,rgbaSha256:hash(rgba)}
}
let evidenceCache
function copyEvidence(f) {
 const receipt=structuredClone(f.receipt),raw=structuredClone(f.raw),files=Object.fromEntries(Object.entries(f.files).map(([name,bytes])=>[name,Buffer.from(bytes)])),angel=raw.spellVisuals.angel,shield=raw.spellVisuals.shield
 const expected={...f.expected,files}
 const rebind=()=>{files['shield-visuals.json']=Buffer.from(JSON.stringify(shield));files['angel-visuals.json']=Buffer.from(JSON.stringify(angel));files['receipt.json']=Buffer.from(JSON.stringify(raw));receipt.artifacts=Object.fromEntries([...SPELL_VISUAL_FILES,...[angel.paused,angel.running].flatMap(r=>r.crops.map(c=>c.filename))].map(name=>[name,hash(files[name])]))}
 const sourceBlobs=Object.fromEntries(SPELL_VISUAL_INPUTS.map(name=>[name,Buffer.from(name)]))
 sourceBlobs['app/original-angel.json']=Buffer.from(expected.originalAngel)
 sourceBlobs['app/original-units.json']=Buffer.from(expected.originalUnits)
 return {receipt,raw,angel,shield,files,expected,rebind,sourceBlobs}
}
export function spellReaderFixture(){
 if(evidenceCache)return copyEvidence(evidenceCache)
 const {r:paused,fixture}=observation('paused'),{r:running}=observation('running')
 const originalAngel=Buffer.from(JSON.stringify(original))
 const originalUnits=Buffer.from(JSON.stringify({frames:[{nativeHeight:36}]}))
 const inputs=Object.fromEntries(SPELL_VISUAL_INPUTS.map(name=>[name,hash(name)]));inputs['app/original-angel.json']=hash(originalAngel);inputs['app/original-units.json']=hash(originalUnits)
 const identity={repository:'JohnDeved/populous-new-dawn',runId:'100',runAttempt:'2',workflowRef:'JohnDeved/populous-new-dawn/.github/workflows/tutorial-browser.yml@refs/pull/695/merge',mergeSha:source.commit,headSha:oid(2),baseSha:oid(3)}
 const github={head:oid(2),base:oid(3),merge:source.commit,runId:'100',runAttempt:'2'}
 const files=Object.fromEntries(SPELL_VISUAL_FILES.map(name=>[name,Buffer.from(name)]))
 const f=createAngelVisualFixture(source);fixture.transferSha256=hash(JSON.stringify(f.transfer));fixture.expectedSha256=hash(JSON.stringify(f.expected))
 files['angel-supplied-checkpoint.json']=Buffer.from(JSON.stringify(f.transfer));files['angel-supplied-expected.json']=Buffer.from(JSON.stringify(f.expected))
 files['angel-fixture-source.json']=Buffer.from(JSON.stringify(fixture))
 files['angel-public-save.json']=Buffer.from(JSON.stringify(f.transfer));files['angel-public-load-boundary.json']=Buffer.from(JSON.stringify(f.expected))
 const context=readerPng(1440,1000).bytes
 for(const name of ['angel-paused-context.png','angel-loop-context.png','angel-death-context.png'])files[name]=context
 const state=fixture.state
 const angel={schema:'populous-new-dawn/angel-visuals',schemaVersion:1,status:'passed',sourceCommit:source.commit,expectedRevision:source.commit,
 source:Object.fromEntries(SPELL_VISUAL_INPUTS.slice(12,35).map(name=>[name,inputs[name]])),admission:'admitted',budget:{episode:50000,admission:60000,outerReserve:10000,outerDeadlineAt:180000,remainingAtAdmissionMs:180000},
 presentation:{testedCommit:source.commit,contextual:['angel-paused-context.png','angel-loop-context.png','angel-death-context.png']},
 elapsedMs:12000,contextClosed:true,contextCreationPending:false,cleanupPending:false,errors:[],fixture,setupCommittedReadback:true,setupLoadBoundaryMatched:true,
 pausedBefore:state,pausedAfter:state,publicSave:{version:4,state,sha256:hash(files['angel-public-save.json'])},publicLoad:{fullBoundaryMatched:true,state,sha256:hash(files['angel-public-load-boundary.json'])},paused,running}
 for(const r of [paused,running])for(const crop of r.crops){const image=readerPng(crop.clip.width,crop.clip.height,crop.cleared?64:0);files[crop.filename]=image.bytes;crop.sha256=hash(image.bytes);crop.pixelChecksum=image.pixelChecksum;crop.opaqueColors=image.opaqueColors}
 for(const frame of running.contextFrames){const image=readerPng(frame.clip.width,frame.clip.height,frame.label==='loop'?0:64);files[frame.filename]=image.bytes;frame.sha256=hash(image.bytes);frame.opaqueColors=image.opaqueColors;frame.pixelChecksum=image.pixelChecksum}
 const shield=shieldReceiptEvidence({source,inputs,files,png:readerPng,units:JSON.parse(originalUnits)})
 const raw={browserDeadlineAt:180000,spellVisualEpisodeSha256:{angel:inputs['scripts/tutorial-browser/angel-visuals.mjs'],shield:inputs['scripts/tutorial-browser/shield-visuals.mjs']},status:'passed',selectedScenario:'spell-visuals',source:{commit:source.commit,files:inputs},buildRevision:source.commit,github,
 build:{exitCode:0,signal:null,timedOut:false,capMs:120000},browserCapMs:180000,sourceAfter:'identical',cleanupVerified:true,errors:[],dependencyChanges:[],
 dependenciesBeforeSha256:'a'.repeat(64),dependenciesAfterSha256:'a'.repeat(64),browserPath:'/opt/google/chrome/chrome',
 launch:{channel:'chrome',headless:true,chromiumSandbox:true,ignoreDefaultArgs:true,args:['--headless','--remote-debugging-pipe'],timeout:30000},spellVisuals:{episodes:['angel','shield'],angel,shield}}
 const receipt={version:1,kind:'spell-visuals-browser',status:'passed',identity,inputs,github,artifacts:{},visualReview:'required'}
 const rebind=()=>{files['shield-visuals.json']=Buffer.from(JSON.stringify(shield));files['angel-visuals.json']=Buffer.from(JSON.stringify(angel));files['receipt.json']=Buffer.from(JSON.stringify(raw));receipt.artifacts=Object.fromEntries([...SPELL_VISUAL_FILES,...[paused,running].flatMap(r=>r.crops.map(c=>c.filename))].map(name=>[name,hash(files[name])]))}
 rebind();evidenceCache={receipt,raw,angel,shield,files,rebind,expected:{policy:SPELL_VISUAL_POLICY,identity,inputs,files,originalAngel,originalUnits}};return copyEvidence(evidenceCache)
}
