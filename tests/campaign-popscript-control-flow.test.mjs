import test from 'node:test'
import assert from 'node:assert/strict'
import {runScript,scriptState} from '../app/popscript.ts'
import {createWorld} from '../app/model.ts'
import {missionScript} from "../app/mission-data.ts"
import {campaignRules} from '../app/campaign-command-runtime.ts'
import {withCampaignTribe} from '../app/campaign-runtime.ts'

const block=(...xs)=>[1003,...xs.flat(),1004]
const eq=(a,b)=>[1014,a,b]
const branch=(expression,yes,no)=>[1000,...expression,...yes,...(no?[1001,...no]:[]),1002]
const DO=(arg)=>[1006,1028,arg]
function invoke(fields,blocks,opts={}) {
  const {turn=0,tribe=0,values={}}=opts
  const script={fields,codes:[12,...blocks.flat(),1019],variables:Array(64).fill(0),commands:{1028:1}}
  const s=scriptState(script)
  const calls=[],reads=[]
  const pc=runScript(script,s,{
    turn,tribe,
    readInternal:id=>{reads.push(id);return values[id]??0},
    command:(op,args)=>calls.push([op,...args]),
  })
  return {s,calls,reads,pc,end:script.codes.length-1}
}

test('0048c6b0 processes consecutive upper blocks and returns SCRIPT_END index',()=>{
  const x=invoke([], [block(DO(20)),block(DO(31))])
  assert.deepEqual(x.calls,[[1028,20],[1028,31]])
  assert.equal(x.pc,x.end)
})
test('0048c980 nested skip balances inner scopes and false inner IF runs its ELSE within true parent',()=>{
  const conditions=[[0,1],[0,0],[2,600]]
  const unreachable=branch(eq(2,1),block(DO(83)))
  const nested=branch(eq(0,1),block(unreachable,DO(81)),block(DO(42)))
  const outer=branch(eq(0,0),block(nested,DO(49)),block(DO(91)))
  const x=invoke(conditions,[block(outer,DO(52))])
  assert.deepEqual(x.calls,[[1028,42],[1028,49],[1028,52]])
  assert.deepEqual(x.reads,[])
})
test('0048f130 all six comparisons use signed operands; equality boundaries are distinct',()=>{
  const f=[[0,-1],[0,1]]
  const x=invoke(f,[block(...[1012,1013,1014,1015,1016,1017].map((op,i)=>
    [branch([op,0,1],block(DO(10+i))),branch([op,0,0],block(DO(20+i)))]).flat())])
  assert.deepEqual(x.calls,[[1028,11],[1028,22],[1028,13],[1028,24],[1028,15],[1028,25]])
})
test('0048f230 upper AND/OR recursively consume both comparison operands, including otherwise short-circuited reads',()=>{
  const f=[[0,0],[0,3],[2,701],[2,702],[2,703]]
  const tree=[1021,...eq(2,1),1020,...eq(3,0),...eq(4,0)]
  for(const [values,calls] of [[{701:3,702:9,703:0},[[1028,33],[1028,39]]],[{701:1,702:0,703:0},[[1028,33],[1028,39]]],[{701:1,702:0,703:9},[[1028,39]]]]) {
    const x=invoke(f,[block(branch(tree,block(DO(33))),DO(39))],{values})
    assert.deepEqual(x.reads,[701,702,703])
    assert.deepEqual(x.calls,calls)
  }
})
test('0048ef00 SET ADD SUB preserve signed dword variables versus wrapped byte attributes and reject literal destinations',()=>{
  const f=[[1,0],[0,2147483647],[0,1],[0,9],[2,1000],[0,511],[0,2],[0,4],[2,1048]]
  const x=invoke(f,[block([1007,0,1,1008,0,2,1009,0,3,1007,4,5,1008,4,6,1009,4,7,1007,3,2,1007,8,2])])
  assert.equal(x.s.variables[0],2147483639)
  assert.equal(x.s.attributes[0],253)
  assert.deepEqual(x.reads,[])
})
test('0048ed90 MULTIPLY and DIVIDE write truncated signed quotients, zero on zero divisor, and wrapped bytes',()=>{
  const f=[[1,0],[1,1],[1,2],[2,1000],[0,-17],[0,3],[0,0],[0,2147483647]]
  const x=invoke(f,[block([1025,0,7,5,1026,1,4,5,1026,2,5,6,1026,3,4,5])])
  assert.deepEqual(x.s.variables.slice(0,3),[2147483645,-5,0])
  assert.equal(x.s.attributes[0],251)
})
test('0048c6b0 EVERY dispatch: authored M22 Red staffing runs only at due offset and queues actual route tasks',()=>{
  const rows=[]
  const script=missionScript(22,1)
  assert.deepEqual(script.codes.slice(227,230),[1005,57,1003])
  assert.deepEqual(script.fields[57],[0,255])
  for(const turn of [254,255,256]) {
    const w=createWorld(22,'scalable')
    w.turn=turn
    withCampaignTribe(w,1,()=>{
      assert.deepEqual(w.ai.tasks.slice(0,3).map(x=>x.flags&1),[1,0,0])
      campaignRules(w)
      rows.push(w.ai.tasks.slice(0,3).map(x=>x.flags&1))
      if(turn===255 && (w.ai.tasks[1].flags & 1)) {
        assert.deepEqual([w.ai.tasks[1].type,w.ai.tasks[1].target,w.ai.tasks[1].requested],[7,90,6])
        assert.deepEqual([w.ai.tasks[2].type,...w.ai.tasks[2].route.slice(0,2).map(x=>x.marker)],[24,1,3])
      }
    })
  }
  assert.deepEqual(rows,[[1,0,0],[1,1,1],[1,0,0]])
})
