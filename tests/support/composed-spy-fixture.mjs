// Independent synthetic retained data, never a rendered or candidate-app receipt.
import { readFileSync } from 'node:fs'
import { spyDeliveryFixture } from './spy-delivery-fixture.mjs'
import { createHash } from 'node:crypto'
import { tornadoPng } from './composed-tornado-fixture.mjs'
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const sourcePath = name => name === '../browser-command-categories.mjs'
  ? 'scripts/browser-command-categories.mjs' : `scripts/tutorial-browser/${name}`
export function spyEvidenceFixture({ secondFrame = 1, mergeSha = 'a'.repeat(40), browserVersion = 'synthetic' } = {}) {
  const bytes = Buffer.alloc(4 * 4 * 4, 255); bytes[0] = 0
  const cropPng = tornadoPng(4, 4, bytes), files = new Map()
  const sourceNames = ['spy-source.mjs','spy-source-fixture.mjs','spy-source-budget.mjs','spy-source-observer.mjs','spy-source-capture.mjs','spy-source-delivery.mjs','spy-source-evidence.mjs','spy-source-readiness.mjs','checkpoint-codec.mjs','../browser-command-categories.mjs']
  const inputNames = ['scripts/controlled-scene-frames.mjs','app/scene.ts','app/game-clock.ts','app/world-turn.ts','app/follower-appearance.ts','app/scene-entities.ts','app/live-building-combat.ts','app/original-units.json','app/checkpoint-format.ts','tests/fixtures/follower-source-witness.json','tests/fixtures/follower-source-artwork.json']
  const sourceBytes = Object.fromEntries([...sourceNames.map(sourcePath),...inputNames].map(p=>[p,Buffer.from(p)]))
  sourceBytes['scripts/controlled-scene-frames.mjs'] = readFileSync(new URL('../../scripts/controlled-scene-frames.mjs', import.meta.url))
  sourceBytes['tests/fixtures/follower-source-witness.json'] = Buffer.from(JSON.stringify({sources:{136:Array.from({length:8},(_,d)=>({frames:Array.from({length:12},(_,f)=>592+d*12+f),flip:d>=5}))}}))
  sourceBytes['app/original-units.json'] = Buffer.from(JSON.stringify({frames:Array.from({length:12},(_,f)=>({source:592+f,layers:[{flags:0,piece:100}]}))}))
  const actionNames = ['Public Load Game','Public Pause','Select trained Spy','Public Spy focus','Open followers','Resume before Disguise as Dakini','Disguise as Dakini','Pause before sabotage','Resume before Canvas sabotage command','Canvas sabotage command','Pause real source136','Public Resume continuation']
  const sample = f2=>({spyId:10,targetId:20,turn:101+f2,stamp:200+f2,substate:2,timer:f2?22:23,entryArmed:false,object:136,draw:22,f1:0,f2,disguise:64,target:20,
    heading:Math.PI,cameraBearing:Math.PI*0x380/1024,direction:0,frame:f2,flip:false,renderedDraw:22,owner:1,visible:true,missingNativeSource:null,pieces:[100],submittedLayers:1,canvasConnected:true,documentVisible:true,sceneStoreMatch:true,speed:1,paused:false,
    bodyInCanvas:true,bodyCanvasOwned:true,cropOverlayClear:true,cropFile:`spy-source-frame-${f2}.png`})
  const samples=[{...sample(0),turn:99,object:10,substate:1,entryArmed:false},{...sample(0),turn:100,object:10,entryArmed:true,timer:0},sample(0),sample(secondFrame)]
  delete samples[0].cropFile; delete samples[1].cropFile
  const turns = [
    { turn: 99, substate: 1, timer: 1, object: 10, entryArmed: false, f2: 0 },
    { turn: 100, substate: 2, timer: 0, object: 10, entryArmed: true, f2: 0 },
    { turn: 101, substate: 2, timer: 23, object: 136, entryArmed: false, f2: 0 },
  ].map(row => ({ ...row, spyId: 10, targetId: 20, target: 20, paused: false, speed: 1, sceneStoreMatch: true }))
  const crops=[0,secondFrame].map(f2=>{const s=samples.find(s=>s.object===136&&s.f2===f2);const filename=`spy-source-frame-${f2}.png`;files.set(filename,cropPng);return{filename,spyId:10,turn:s.turn,stamp:s.stamp,frame:f2,f2,clip:{x:20,y:30,width:4,height:4},opaqueColors:2,sha256:hash(cropPng)}})
  const start=1000000,end=start+10000,hostDeadlineAt=start+100000
  const hold={turn:102,paused:true,animationFrame:5,animationTime:0,spy:{id:10,native:{object:136}}}
  const report={evidenceVersion:3,delivery:spyDeliveryFixture(),status:'passed',errors:[],actions:actionNames.map((name,i)=>({name,startedAt:start+i*100,endedAt:start+i*100+50})),sourceCommit:mergeSha,browserVersion,
    sources:Object.fromEntries(sourceNames.map(n=>[n,hash(sourceBytes[sourcePath(n)])])),inputs:Object.fromEntries(inputNames.map(p=>[p,hash(sourceBytes[p])])),
    fixture:{sourceCommit:mergeSha,version:3,level:1,turn:30,stages:[{stage:'admitted',visits:10,turn:10},{stage:'trained',visits:10,turn:20},{stage:'departed',visits:10,turn:30}],spyId:10,targetId:20,schoolId:30,transferSha256:'b'.repeat(64)},spyId:10,targetId:20,
    checkpointReadbackSha256:'b'.repeat(64),loadBoundaryMatched:true,cleanupVerified:true,
    captureCleanup:{completed:true,errors:[],hook:{installed:true,restored:true,foreign:false}},
    budget:{startedAt:start,endedAt:end,deadlineAt:start+45000,hostDeadlineAt,durationMs:10000,capMs:45000},
    readiness:{startedAt:start+60,deadlineAt:start+8060,endedAt:start+90,capMs:8000,actionable:{action:'ready'},after:{sceneStoreMatch:true,canvasConnected:true,loading:false,inputMask:0,action:'ready',level:1}},
    capture:{version:2,method:'controlled-full-scene',frameMs:1000/24,maxFrames:384,maxTurns:192,
      frames:8,turns:4,startTurn:98,suppliedElapsedMilliseconds:8*(1000/24),deadlineAt:start+45000,
      installed:true,released:true,rafRestored:true,cancelRestored:true,resumedRAF:true,foreign:false,error:null,
      handback:{previous:1000,timestamp:1500,turn:102,stamp:300,spyAndAnimationUnchanged:true,evidence:false}},
    order:{target:20,selected:[10],lastOrderTurn:98},observation:{spyId:10,targetId:20,samples,turns,crops,error:null,done:true,nonAdvancingCallbacks:0,
      hook:{installed:true,restored:true,foreign:false},
      turnSamples:[99,100,101,102].map(turn=>({spyId:10,targetId:20,target:20,turn,speed:1,paused:false,
        substate:turn===99?1:2,entryArmed:turn===100,object:turn<101?48:136,
        timer:turn===99?1:turn===100?0:124-turn,f2:0}))},holdBefore:hold,holdAfter:structuredClone(hold),resumed:{...structuredClone(hold),turn:103,paused:false},
    validation:{source:136,draw:22,owner:1,firstFrame:0,croppedFrames:[0,secondFrame],rawFrames:[592,592+secondFrame],limits:'Controlled elapsed complete Scene frames with transparent logical-turn entry and actual rendered frame0/1 crops, not natural wall-clock timing; not complete-cycle cadence, natural Mission 12 acquisition or exact native raster equivalence.'}}
  files.set('spy-source-context.png',tornadoPng(1440,1000,Buffer.alloc(1440*1000*4,255)))
  return {report,hostReport:structuredClone(report),sourceBytes,mergeSha,browserVersion,files,
    phaseReceipts:[{status:'passed',cleanupVerified:true,startedAt:new Date(start-20000).toISOString(),endedAt:new Date(start-15000).toISOString()},
      {status:'passed',cleanupVerified:true,startedAt:new Date(start-10000).toISOString(),endedAt:new Date(start-5000).toISOString()}],mission10Report:{deadlineAt:hostDeadlineAt}}
}
