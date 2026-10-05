// Source-only witness helpers. No model construction, simulation or live writes.
import assert from 'node:assert/strict'
export function missionTenSourceFacts(level, rules, construction) {
  const hut=level.objects.find(o=>o.index===149)
  assert.ok(hut)
  assert.deepEqual([hut.type,hut.model,hut.owner,hut.x,hut.z,hut.angle],[2,8,0,20,-8,0])
  assert.equal(rules.buildingFlags[hut.model]&0x2000,0,'This authored building has no random hut-family selection')
  const descriptor={authoredIndex:hut.index,kind:'firewarriorHut',model:hut.model,tribe:hut.owner,
    object:rules.buildingObjects[hut.model]+(rules.buildingFlags[hut.model]&0x4000?hut.owner:0),
    angle:hut.angle&2047,anchorX:Math.round((hut.x+8)*256)&0xfe00,anchorY:Math.round((-hut.z-8)*256)&0xfe00}
  const authored=level.objects.filter(o=>o.type===1&&o.model===2&&o.owner===0)
  assert.equal(authored.length,5)
  assert.deepEqual(authored,construction.authored.braves,'Frozen authored Brave source corresponds to supplied construction receipt')
  const originalBraves=authored.map(o=>{
    const found=construction.constructed.braves.filter(p=>p.x===o.x&&p.z===o.z)
    assert.equal(found.length,1)
    return {authoredIndex:o.index,id:found[0].id,initial:{x:o.x,z:o.z}}
  })
  assert.equal(new Set(originalBraves.map(p=>p.id)).size,5)
  return {hut:descriptor,originalBraves}
}

export function resolveAuthoredHut(buildings, descriptor) {
  const matches=buildings.filter(b=>b.kind===descriptor.kind&&b.model===descriptor.model&&b.tribe===descriptor.tribe&&
    b.pose?.object===descriptor.object&&b.pose?.angle===descriptor.angle&&
    b.pose?.anchorX===descriptor.anchorX&&b.pose?.anchorY===descriptor.anchorY)
  assert.equal(matches.length,1,'Exactly one live building matches the authored native identity')
  const hut=matches[0]
  assert.ok(Number.isInteger(hut.id)&&hut.id>0);assert.equal(hut.team,'blue');assert.ok(hut.hp>0);assert.equal(hut.progress,1)
  return hut
}

export function observeInitialBraves(units, facts) {
  const ids=facts.originalBraves.map(p=>p.id)
  const original=ids.map(id=>{
    const u=units.find(u=>u.id===id)
    assert.ok(u&&u.team==='blue'&&u.kind==='brave'&&u.hp>0,`Original live Brave ${id} remains present`)
    return u
  })
  return {original,additional:units.filter(u=>u.team==='blue'&&u.kind==='brave'&&u.hp>0&&!ids.includes(u.id))}
}

export async function enterMissionTen({page,showAllMissions,bindGame,waitForShamanReadiness,markStage,entryRemaining,check}) {
  const budget=()=>{check();const ms=entryRemaining();assert.ok(ms>0,'Entry/readiness real-clock bound');return ms}
  markStage('mission-selector-start')
  // Same public selector and readiness condition as scripts/browser-game.mjs.
  page.setDefaultTimeout(budget())
  try {
    await showAllMissions(page);budget();markStage('all-missions-visible')
    await page.getByRole('button',{name:'Mission 10',exact:true}).focus()
    await page.keyboard.press('Enter');budget();markStage('mission-10-enter-delivered')
    await bindGame(page);budget()
    const state=()=>page.evaluate(()=>{const w=window.testStore.getWorld();return {turn:w.turn,time:w.time,inputMask:w.inputMask,flybyFlags:w.flyby.flags,flybyEvents:w.flyby.events.length}})
    markStage('scene-bound',await state())
    await page.waitForFunction(()=>window.testSceneRef.current.world.flyby.flags&1||!window.testSceneRef.current.world.inputMask,undefined,{timeout:budget()})
    const skip=page.locator('.skip-introduction'),visible=await skip.isVisible()
    markStage('optional-introduction-observed',{visible,...await state()})
    if(visible){await skip.click({timeout:budget()});markStage('visible-skip-clicked',await state())}
    await page.waitForFunction(()=>!window.testStore.getWorld().inputMask,undefined,{timeout:budget()})
    markStage('input-mask-clear',await state())
    const readiness=await waitForShamanReadiness(page,{timeout:Math.min(30000,budget())})
    budget();markStage('shaman-ready',readiness.after)
    return readiness
  } finally {page.setDefaultTimeout(5000)}
}
