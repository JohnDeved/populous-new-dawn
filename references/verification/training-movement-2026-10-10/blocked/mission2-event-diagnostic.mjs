import {observedSources} from './event-observer/loader.mjs'
import {campaignPersonCount,campaignTribe} from '../../app/campaign-runtime.ts'
import fs from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'
import { command, createWorld, placeBuilding, select, setSelection, tick } from '../../app/model.ts'
import { currentPersonOrder } from '../../app/person-orders.ts'
import { wrappedDistance } from '../../app/world-coordinates.ts'

test('Mission 2 explicitly trains replacement Warriors after natural combat despite zero producer preferences', () => {
  assert.ok(observedSources.some(s=>s.url.endsWith('/campaign-command-runtime.ts')))
  assert.ok(observedSources.some(s=>s.url.endsWith('/computer-runtime.ts')))
  assert.ok(observedSources.some(s=>s.url.endsWith('/training-conversion.ts')))
  const events=[],snapshots=[],snapshotFailures=[]
  let world
  const snapshot=w=>({turn:w.turn,population:campaignPersonCount(w,3),warriors:campaignPersonCount(w,3,3),preferences:w.ai.attributes.slice(5,9),tasks:w.ai.tasks.flatMap((task,index)=>task.flags&1&&task.type===6?[{index,...structuredClone(task)}]:[]),warriorIds:w.units.filter(u=>u.hp>0&&u.team==='green'&&u.kind==='warrior').map(u=>u.id)})
  globalThis.__mission2Event=(kind,w,detail={})=>{if(w.outcome.level!==2||campaignTribe(w)!==3)return;if(kind==='script-visit'&&(w.turn-7)%64!==0)return;const orders=kind==='training-command8'?detail.units.map(id=>{const u=w.units.find(u=>u.id===id),p=u?.entry?.person??u?.native;const commandId=p&&(p.immediateCommand||p.commands[p.commandCursor]);return{id,commandId,order:p&&structuredClone(currentPersonOrder(w.buildingOrders,p))}}):undefined;events.push({kind,...snapshot(w),detail:structuredClone(detail),orders})}
  globalThis.__mission2Conversion=(phase,w,b,detail)=>{if(b.tribe===3)events.push({kind:'conversion-'+phase,turn:w.turn,building:b.id,...structuredClone(detail)})}
  test.after(()=>{delete globalThis.__mission2Event;delete globalThis.__mission2Conversion;fs.writeFileSync('work/training-movement-composition/event-observer/result.json',JSON.stringify({observedSources,events,snapshots,snapshotFailures,final:world&&snapshot(world)},null,2))})
  world = createWorld(2)
  const observedTick=(w,dt)=>{tick(w,dt);const x=snapshot(w),last=snapshots.at(-1);if(!last||JSON.stringify({...last,turn:0})!==JSON.stringify({...x,turn:0}))snapshots.push(x)}
  const originalBuildings = new Set(world.buildings.map(building => building.id))
  const until = (predicate, limit = 10000) => {
    for (let i = 0; i < limit && !predicate(); i++) observedTick(world, 1 / 12)
    assert.ok(predicate(), `Condition not reached at turn ${world.turn}`)
  }
  const people = team => world.units.filter(unit => unit.team === team && unit.hp > 0)
  const warriors = team => people(team).filter(unit => unit.kind === 'warrior')
  until(() => world.turn >= 70, 1000)
  // The autonomous home Tower is now live. Prepare an army through the ordinary
  // housing/population/training loop before confronting both defended areas.
  for (const [x, z] of [[-96, -120], [-88, -116], [-88, -108]]) {
    select(world, 'brave')
    assert.ok(placeBuilding(world, 'hut', { x, z }))
    const hut = world.buildings.findLast(building => building.team === 'blue' && building.kind === 'hut')
    until(() => hut.progress === 1)
    until(() => !people('blue').some(unit => unit.builder))
  }
  until(() => people('blue').length >= 26, 50000)
  select(world, 'brave')
  assert.ok(placeBuilding(world, 'camp', { x: -99, z: -105 }))
  const blueCamp = world.buildings.find(building => building.team === 'blue' && building.kind === 'camp')
  const matakCamp = world.buildings.find(building => building.team === 'green' && building.kind === 'camp')
  assert.ok(blueCamp && matakCamp)
  until(() => blueCamp.progress === 1, 3000)
  until(() => !world.units.some(unit => unit.builder), 1000)
  setSelection(world, people('blue').filter(unit => unit.kind === 'brave').slice(0, 16).map(unit => unit.id))
  assert.ok(command(world, blueCamp))
  until(() => warriors('blue').length >= 16, 15000)

  const homeTower = world.buildings.find(building => building.team === 'green' &&
    building.kind === 'tower' && !originalBuildings.has(building.id))
  assert.ok(homeTower && homeTower.progress === 1 && homeTower.hp > 0)
  assert.equal(typeof world.ai.constructionBase, 'number')

  console.log('BEFORE_COMBAT',JSON.stringify({turn:world.turn,green:people('green').map(u=>({id:u.id,kind:u.kind,hp:u.hp})),blue:people('blue').length}));
  // Original followers, real player attacks and existing battle resolution only.
  for (let attempt = 0; warriors('green').length >= 2 && attempt < 12; attempt++) {
    const target = warriors('green').sort((a, b) =>
      wrappedDistance(a, blueCamp) - wrappedDistance(b, blueCamp))[0]
    setSelection(world, warriors('blue').map(unit => unit.id))
    assert.ok(command(world, target))
    for (let elapsed = 0; elapsed < 10000 && target.hp > 0; elapsed++) {
      observedTick(world, 1 / 12)
      if (target.hp <= 0) break
      // Fighting or panic can end a direct order. Re-select idle survivors as a
      // player would, without interrupting their current movement or combat.
      if (elapsed % 64 !== 0) continue
      const idle = warriors('blue').filter(unit => unit.target === null &&
        !unit.fight && !unit.path.length && !unit.lift && unit.inside === null)
      if (!idle.length) continue
      setSelection(world, idle.map(unit => unit.id))
      // Native panic can exclude otherwise idle survivors from selection.
      if (!world.selected.length) continue
      assert.ok(command(world, target))
    }
    console.log('AFTER_TARGET',JSON.stringify({turn:world.turn,target:target.id,green:people('green').length,warriors:warriors('green').length,blue:people('blue').length}));
    assert.ok(target.hp <= 0, `Warrior ${target.id} survived the assault at turn ${world.turn}`)
  }
  assert.ok(warriors('green').length < 2)
  console.log('POST_COMBAT', JSON.stringify({turn:world.turn,green:people('green').map(u=>({id:u.id,kind:u.kind,hp:u.hp})),blue:people('blue').length}));
  try {assert.ok(people('green').length > 10)} catch(error) {snapshotFailures.push({turn:world.turn,assertion:'population > 10',actual:people('green').length})}
  assert.deepEqual(world.ai.attributes.slice(5, 9), [0, 0, 0, 0])
  const originalWarriors = new Set(warriors('green').map(unit => unit.id))
  setSelection(world, warriors('blue').map(unit => unit.id))
  assert.ok(command(world, { x: -108, z: -105 }))
  until(() => world.ai.tasks.some(task => task.flags & 1 && task.type === 6 && task.target === matakCamp.id), 64)
  const request = world.ai.tasks.find(task => task.flags & 1 && task.type === 6 && task.target === matakCamp.id)
  assert.ok(request.requested > 0 && request.requested <= 2)
  until(() => people('green').some(unit => {
    const person = unit.native ?? unit.entry?.person
    return unit.kind === 'brave' && person && currentPersonOrder(world.buildingOrders, person)?.model === 8
  }), 2000)
  // Native training replaces the old Brave object with newly allocated Warriors.
  until(() => warriors('green').length >= 2 &&
    warriors('green').some(unit => !originalWarriors.has(unit.id)), 10000)
  assert.ok(warriors('green').length >= 2)
  assert.deepEqual(world.ai.attributes.slice(5, 9), [0, 0, 0, 0])
  assert.equal(world.status, 'playing')
  assert.deepEqual(snapshotFailures,[],'Original post-assault assertion remains failed; continuation was diagnostic only')
})
