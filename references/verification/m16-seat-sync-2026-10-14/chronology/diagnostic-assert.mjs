import original from 'node:assert/strict'
import { after } from 'node:test'
const wrap=fn=>(...args)=>{try{return fn(...args)}catch(error){console.log(JSON.stringify({diagnosticAssertion:error.message,stack:error.stack.split('\n').slice(1,4)}))}}
const proxy=new Proxy(wrap(original),{get:(_target,key)=>typeof original[key]==='function'?wrap(original[key]):original[key]})
after(()=>original.fail('Observation-only run: swallowed assertions are findings, never test acceptance'))
export default proxy
export function snapshot(w,label){if(!((w.turn>=3528&&w.turn<=3554)||(w.turn>=3845&&w.turn<=3920)))return;const u=w.units.find(u=>u.team==='blue'&&u.kind==='shaman');if(!u)return;const p=u.native;console.log(JSON.stringify({observation:label,turn:w.turn,id:u.id,unit:{x:u.x,z:u.z,hp:u.hp},native:p&&{x:p.x,y:p.y,h:p.h,state:p.state,vehicle:p.vehicle,flags2:p.flags2,flags4:p.flags4,counter:p.counter},inRouteMap:w.pathfinding.people.has(u.id),flight:!!u.flight,fight:u.fight?.opponent}))}
