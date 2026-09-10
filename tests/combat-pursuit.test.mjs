import assert from 'node:assert/strict'
import test from 'node:test'
import { stepCombatPursuit, beginCombatPursuit, withinCombatArea } from '../app/combat-pursuit.ts'
import fixture from './fixtures/combat-pursuit.json' with { type: 'json' }

test('complete pursuit, target setup and attack-area gates match native fields, RNG and consumer ordering', () => {
  for (const {mode,input,expected} of fixture.cases) {
    const c=structuredClone(input), p=c.p, w={randomState:c.randomState}, events=[]
    const log=(name,...args)=>events.push([name,...args,structuredClone(p),w.randomState])
    const e={
      animation:(_,object)=>log('animation',object),
      destination:to=>{
        const point={x:to.x,y:to.y};log('destination',point)
        p.goalX=to.x;p.goalY=to.y
      },
      canFire:()=>{log('canFire');return c.canFire},
      commandPosition:()=>{log('commandPosition');return c.point},
      vehicleDestination:(to,mode)=>log('vehicleDestination',to,mode),
      vehicleReady:()=>{log('vehicleReady');return c.vehicleReady},
      range:()=>{log('range');return c.range},
    }
    const result=mode==='step'?stepCombatPursuit(w,p,c.target??undefined,c.radius,e)
      :mode==='begin'?Number(beginCombatPursuit(w,p,c.order,c.target,e))
      :Number(withinCombatArea(p,c.order,c.target??undefined,e))
    assert.deepEqual({p,randomState:w.randomState,events,result},expected,mode)
  }
})

import { fightWaitingPosition } from '../app/melee-placement.ts'
import waiting from './fixtures/fight-waiting.json' with { type: 'json' }

test('full-fight waiting positions and fallback RNG match original terrain and collision execution', () => {
  for (const {input:c,expected} of waiting) {
    const flags=Uint32Array.from({length:16384},(_,i)=>(i&1)|(c.blocked?4:0))
    const categories=new Uint8Array(16384).fill(c.landcat)
    for(const [i,f,t] of c.patches){flags[i]=f;categories[i]=t}
    const cell=p=>((p.y&65535)>>9)*128+((p.x&65535)>>9), origin=cell(c.fight)
    const w={randomState:c.randomState,
      occupied:p=>c.occupants.some(q=>p.x===q.x&&p.y===q.y),
      collision:{cell:p=>{const i=cell(p);return {flags:flags[i],category:categories[i],building:i===origin?0xfc03:0}},
        objects:new Map(),boatAt:()=>false,walkMask:new Uint8Array(8192).fill(c.walk)}}
    const person=structuredClone(c.fight), p=fightWaitingPosition(w,person,c.center)
    assert.deepEqual({point:[p.x,p.y],randomState:w.randomState},expected)
    assert.deepEqual(person,c.fight,'choosing a waiting position must not move its follower')
  }
})
