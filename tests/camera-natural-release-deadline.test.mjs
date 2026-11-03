import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')
const source=read('scripts/tutorial-browser/camera-motion-evidence.mjs')
const declaration=source.slice(source.indexOf('export const cameraMotionPolicy'),source.indexOf('\n\n',source.indexOf('export const cameraMotionPolicy'))).replace('export ','')
const policy=runInNewContext(declaration+';cameraMotionPolicy')
test('authored Mission1 sequence has a conservative27s complete natural schedule, not15s',()=>{
 const mission=read('app/mission-data.ts');assert.match(mission,/number: 1, level: levelOne, script: scriptOne/);assert.match(mission,/import scriptOne from '\.\/original-script\.json'/)
 const script=JSON.parse(read('app/original-script.json')),tracks=[]
 let offset=961
 while(offset<=1073){assert.equal(script.codes[offset],1006);const op=script.codes[offset+1],n=script.commands[op],refs=script.codes.slice(offset+2,offset+2+n)
  if([1209,1210,1211].includes(op)){const values=refs.map(i=>{assert.equal(script.fields[i][0],0);return script.fields[i][1]});tracks.push({start:values[op===1209?2:1],duration:values[op===1209?3:2]})}
  offset+=2+n
 }
 assert.equal(offset,1075);assert.equal(script.codes[1074],1206);assert.equal(tracks.length,15)
 const duration=rate=>(6+Math.max(...tracks.map(t=>Math.trunc(rate*t.start/10)+Math.trunc(rate*t.duration/10)))+1)/24
 assert.equal(duration(24),26.875);assert.equal(duration(23),25.75)
 assert.equal(Math.ceil(Math.max(...Array.from({length:17},(_,i)=>duration(i+8))))*1000+15000,42000)
 const flyby=read('app/flyby.ts'),camera=read('app/scene-camera-runtime.ts')
 assert.match(flyby,/state\.warmup = 6/);assert.match(flyby,/Math\.max\(8, Math\.min\(24,/)
 assert.match(flyby,/Math\.trunc\(\(state\.frameRate \* event\.start\) \/ 10\)/);assert.match(flyby,/track\.frame >= track\.duration/)
 assert.match(camera,/updateFlyby\(scene, 1 \/ 24\)/);assert.match(camera,/stepFlyby\(state, scene\.flybyCamera, 24\)/)
})
async function waits(timeout){
 const begin=source.indexOf('  const collectSettled='),end=source.indexOf('  const capture=',begin);assert.ok(begin>=0&&end>begin)
 const calls=[],wait=async(_page,_fn,_arg,budget=15000)=>calls.push(budget),startPhase=async()=>{}
 const collect=runInNewContext(source.slice(begin,end)+';collectSettled',{wait,startPhase})
 await collect({},'phase',timeout);return calls
}
test('only natural release gets authored duration plus existing readiness allowance; settling stays15s',async()=>{
 assert.equal(policy.naturalReleaseMs,42000)
 assert.deepEqual(await waits(policy.naturalReleaseMs),[42000,15000])
 assert.deepEqual(await waits(undefined),[15000,15000])
})
test('actual natural call supplies the bound without changing overview calls or route deadlines',()=>{
 assert.match(source,/collectSettled\(page,'released',cameraMotionPolicy\.naturalReleaseMs\)/)
 assert.match(source,/collectSettled\(page,'entered'\)/);assert.match(source,/collectSettled\(page,'exited'\)/)
 assert.equal(policy.routeMs,180000);assert.equal(policy.operationMs,178000);assert.equal(policy.cleanupMs,2000)
 assert.match(source,/const start=now\(\),deadline=start\+15000/)
})
