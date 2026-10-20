// Synthetic data-only policy fixtures, never evidence of an actual browser run.
import { createHash } from 'node:crypto'
import { checkpointCodec } from '../../scripts/tutorial-browser/checkpoint-codec.mjs'
import { SHIELD_VISUAL_INPUTS } from '../../scripts/tutorial-browser/shield-visuals-inputs.mjs'
import { validateShieldCapture } from '../../scripts/tutorial-browser/shield-evidence.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
export function shieldReceiptEvidence({ source, inputs, files, png, units }) {
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
    capture.acceptance=validateShieldCapture(capture,{owners,scaled:index===1,units});return capture
  })
  const before = JSON.stringify(checkpointCodec({ ...world, paused: false })), after = JSON.stringify(checkpointCodec({ ...world, paused: true }))
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
    visiblePause:{timestamp:123,sceneTimestamp:123,before,after,beforeSha256:hash(before),afterSha256:hash(after),
      clockBefore:{animationFrame:1,animationTime:0},clockAfter:{animationFrame:1,animationTime:0},onlyPausedChanged:true},
    atlas:{sha256:inputs['public/original/shield.png'],bytes:1024},buildIdentity:{revision:source.commit,sha256:buildHash},captures,
    disposal:{materials:27,disposedMaterials:27,disposedAtlas:0,sceneReplaced:true,worldReplaced:true,disposed:true,canvasRemoved:true},
    expiry:{done:true,error:null,samples:[0,180].map(turn=>({turn,stamp:turn+1,
      people:ids.foreign.map(id=>({id,remaining:180-turn,flags3:turn?0:0x8000,visible:[!turn,!turn,!turn]}))}))}}
}
