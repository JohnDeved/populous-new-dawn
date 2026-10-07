import { openSync, writeSync, writeFileSync, readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const cases = [], names = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url))).names
let fd, currentCase, lastWorld, sequence = 0, turnCalls = 0
const ids = new WeakMap(), last = new WeakMap(), retainedMembers = new WeakMap()
const fields = ['id','class','model','tribe','state','substate','speed','life','x','y','h','flags2','flags3','flags4','workFlags','workTarget','vehicle','computerAssignment','counter','commandStatus','commandAux','commandPhase','timer','assignment','immediateCommand','commands','commandCursor','cellPrevious','cellNext']
const pick = p => p && Object.fromEntries(fields.filter(key => key in p).map(key => [key,p[key]]))
const order = (w,p) => {
  if (!p) return null
  const immediate = p.immediateCommand, queued = p.commands?.[p.commandCursor], current = immediate || queued
  return { immediate, cursor: p.commandCursor, queued, current,
    currentRecord: current ? w.buildingOrders.records[current] : null,
    queuedRecord: queued ? w.buildingOrders.records[queued] : null }
}
function actor(w,id) {
  const u = w.units.find(u => u.id === id), registered = w.objectCells.objects.get(id)
  if (!u) return { id, present: false, registered: pick(registered) }
  const slots = { native:u.native, fight:u.fight?.motion, flight:u.flight,
    entry:u.entry?.person, builder:u.builder?.person }
  return { id, present:true, team:u.team, kind:u.kind, hp:u.hp, target:u.target,
    inside:u.inside, work:u.work, fighting:u.fighting, fight:u.fight && { ...u.fight,motion:undefined },
    registered:pick(registered), owners:Object.fromEntries(Object.entries(slots).map(([name,p]) =>
      [name,{ registered:p != null && registered===p, fields:pick(p), order:order(w,p) }])),
    registeredOrder:order(w,registered) }
}
function snapshot(w,kind,force=false) {
  if (!ids.has(w)) ids.set(w,++sequence)
  const tasks = w.campaignAIs.flatMap((ai,tribe) => ai?.tasks?.flatMap((t,index) =>
    t.type===20 ? [{ tribe,index,...t }] : []) ?? [])
  const memberIds = tasks.flatMap(t => t.members), selected = [...w.selected]
  const known = retainedMembers.get(w) ?? new Set()
  for (const id of memberIds) known.add(id)
  retainedMembers.set(w,known)
  const focus = new Set([...known,...selected])
  for (const id of [...focus]) {
    const u=w.units.find(u=>u.id===id)
    if(u?.fight?.opponent !== undefined) focus.add(u.fight.opponent)
  }
  const actors=[...focus].map(id=>actor(w,id))
  const summary = JSON.stringify({tasks,selected,actors})
  if(!force && summary===last.get(w)) return
  last.set(w,summary)
  const row={case:currentCase,world:ids.get(w),kind,turn:w.turn,turnCalls,
    status:w.status,random:w.randomState,cosmetic:w.cosmeticRandom.randomState,
    tasks,selected,actors,population:w.units.map(u=>({id:u.id,team:u.team,kind:u.kind,hp:u.hp})),
    selectionOwner:w.ai.selectionOwner}
  writeSync(fd,JSON.stringify(row)+'\n')
}
export function test(name,fn) { cases.push({name,fn}) }
export function observeTick(fn,w,dt) {
  lastWorld=w
  snapshot(w,'before-tick')
  const value=fn(w,dt)
  turnCalls++
  snapshot(w,'after-tick')
  return value
}
export async function run() {
  assert.equal(process.env.PND_RAID_DIAGNOSTIC,'1')
  assert.deepEqual(cases.map(c=>c.name),names)
  fd=openSync(new URL('./trace.jsonl',import.meta.url),'wx')
  const results=[]
  for(const item of cases) {
    currentCase=item.name;lastWorld=null;turnCalls=0
    const startedAt=new Date().toISOString()
    try {
      await item.fn()
      results.push({name:item.name,status:'passed',startedAt,finishedAt:new Date().toISOString(),turnCalls})
    } catch(error) {
      if(lastWorld) snapshot(lastWorld,'failure-endpoint',true)
      results.push({name:item.name,status:'failed',startedAt,finishedAt:new Date().toISOString(),turnCalls,
        error:{name:error.name,message:error.message,stack:error.stack,actual:error.actual,expected:error.expected}})
    }
    writeFileSync(new URL('./result.json',import.meta.url),JSON.stringify({sourceHead:'48a84610254d3ad5cddb600c266ed9a151233b79',kind:'unchanged fixed-step maintained cases; read-only observer',results},null,2)+'\n')
  }
  console.log(JSON.stringify(results.map(({name,status,turnCalls})=>({name,status,turnCalls}))))
  if(results.some(r=>r.status==='failed'))process.exitCode=1
}
