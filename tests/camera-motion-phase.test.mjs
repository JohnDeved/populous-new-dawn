import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { acceptCameraMotionCase } from '../scripts/tutorial-browser/camera-motion-acceptance.mjs'

// Execute the actual segment boundary without browser/application imports.
const source=readFileSync(new URL('../scripts/tutorial-browser/camera-motion-evidence.mjs',import.meta.url),'utf8')
const start=source.indexOf("        await collectSettled(page,'entered')")
const end=source.indexOf("        assert.equal((await observe(page)).overview,false)",start)
assert.ok(start>=0&&end>start)
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor
const run=new AsyncFunction('page','step','mark','wait','collectSettled','observe','assert',source.slice(start,end))

async function fixture({markFails=false,markError=null}={}) {
  let phase='ground',frame=0
  const rows=[],calls=[]
  const add=(overviewStage,inputCursor,inputButtons=0)=>rows.push({frame:++frame,observedAt:frame,
    phase,overviewStage,inputCursor,inputButtons,inputMask:0,suspended:false,paused:false})
  const page={keyboard:{press:async key=>{calls.push(['press',key,phase]);add('exit',12,4);add('exit',13,0)}}}
  const step=async fn=>fn()
  const mark=async(_,name)=>{calls.push(['mark',name]);if(markFails)throw markError;phase=name}
  const collectSettled=async(_,name)=>{phase=name;calls.push(['settled',name]);for(let i=0;i<6;i++)add(null,name==='entered'?11:13,4)}
  const before=rows
  let failed=false,error
  try{await run(page,step,mark,async()=>calls.push(['wait']),collectSettled,async()=>({overview:true}),assert)}
  catch(e){failed=true;error=e}
  assert.equal(rows,before,'No replacement or filtering of original rows')
  return {rows,calls,failed,error}
}

test('actual second Enter receives an explicit transition phase before any input dispatch',async()=>{
  const r=await fixture();assert.equal(r.failed,false)
  assert.deepEqual(r.calls,[['settled','entered'],['mark','exit-transition'],['press','Enter','exit-transition'],['wait'],['settled','exited']])
})

test('settled entered samples stay strictly ungated and cursor-stable without discarding exit samples',async()=>{
  const r=await fixture();assert.equal(r.rows.length,14)
  const entered=r.rows.filter(x=>x.phase==='entered'),exit=r.rows.filter(x=>x.phase==='exit-transition')
  assert.equal(entered.length,6);assert.ok(entered.every(x=>!x.overviewStage&&x.inputCursor===11))
  assert.deepEqual(exit.map(x=>[x.overviewStage,x.inputCursor,x.inputButtons]),[['exit',12,4],['exit',13,0]])
  assert.equal(r.rows.filter(x=>x.phase==='exited').length,6)
})

test('transition attribution failure prevents second input and preserves a falsey cause',async()=>{
  const r=await fixture({markFails:true,markError:null})
  assert.equal(r.failed,true);assert.equal(r.error,null)
  assert.equal(r.calls.some(x=>x[0]==='press'),false)
  assert.equal(r.rows.length,6)
})

test('all transition rows still reach unchanged strict gated-input acceptance',async()=>{
  const r=await fixture()
  assert.throws(()=>acceptCameraMotionCase({kind:'overview-key',observation:{failed:false,stopped:true,restored:true,frames:r.rows,events:[]}}),/Navigation remains gated/)
  // This deliberately bad supplied publication is retained, never normalized.
  assert.equal(r.rows[6].inputButtons,4)
})
