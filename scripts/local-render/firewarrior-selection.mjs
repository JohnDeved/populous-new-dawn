// Diagnostic-only first-selection admission. Never writes gameplay or cancels events.
const requireSelection = (value, message) => { if (!value) throw Error(message) }
export function selectionRoute(unit) {
  requireSelection(unit?.id === 121 && unit.kind === 'brave' && unit.team === 'blue' && unit.hp > 0 && unit.identityMatches !== false, 'Exact living authored Brave identity required')
  requireSelection(unit.inside === null || Number.isInteger(unit.inside), 'Valid current occupancy required')
  return { kind: unit.inside === null ? 'unit' : 'occupant', id: 121, buildingId: unit.inside }
}
export function selectionAdmission(expected, unit, hit) {
  const current = selectionRoute(unit)
  if (JSON.stringify(current) !== JSON.stringify(expected)) return { ready: false, reason: 'location changed', current }
  if (!hit.owned || hit.id !== (current.kind === 'unit' ? 121 : current.buildingId)) return { ready: false, reason: 'picked owner changed', current }
  return { ready: true, current }
}
export function assertSelectionReceipt(receipt) {
  requireSelection(receipt.restored && !receipt.errors.length, 'Selection observer restoration failed')
  requireSelection(JSON.stringify(receipt.events.map(e=>e.type)) === JSON.stringify(['pointerdown','pointerup','click']), 'Exactly one trusted selection click required')
  for (const event of receipt.events) {
    requireSelection(event.trusted && event.button === 0 && !event.modified && event.before.owned && event.after?.owned, 'Delivered selection owner changed')
    requireSelection(event.before.identityMatches && event.after.identityMatches, 'Authored person identity/location changed during selection')
  }
  requireSelection(JSON.stringify(receipt.final.selected) === '[121]', 'Exact authored Brave was not selected')
  if (receipt.route.kind === 'unit') {
    const pointer = receipt.pointer
    requireSelection(pointer?.restored && !pointer.errors.length && pointer.events.length === 2, 'Real picker evidence missing')
    for (const [index,name] of ['pickUnit','pickPerson'].entries()) {
      const event=pointer.events[index]
      requireSelection(event.type === ['pointerdown','pointerup'][index] && event.trusted && event.canvasOwned && event.canvasTarget, 'Real canvas event missing')
      requireSelection(event.picks.some(p=>p.name===name && p.id===121 && p.receiverMatches && !p.threw), 'Final real picker did not own authored Brave')
      requireSelection(!event.picks.some(p=>p.name===name && p.id!==121), 'Conflicting real picker ownership')
    }
  }
  return receipt
}
export function observeFirstSelection({scene,store,route,button=null,observeEntityPointer,doc=document}) {
  const world=scene.world, unit=world.units.find(u=>u.id===121), panel=button?.closest('.training-panel'), building=world.buildings.find(b=>b.id===route.buildingId)
  const errors=[],events=[],removers=[]
  const pointer=route.kind==='unit'?observeEntityPointer(scene,doc,{collection:'units',id:121}):null
  const sample=event=>{
    const current=world.units.find(u=>u.id===121), location=route.kind==='unit'?current?.inside===null:current?.inside===route.buildingId&&building?.admission?.occupants.includes(121)
    const target=doc.elementFromPoint(event.clientX,event.clientY)
    const owned=route.kind==='unit'?event.target===scene.renderer.domElement&&target===scene.renderer.domElement:
      !!button&&button.isConnected&&button.dataset.person==='121'&&button.contains(event.target)&&button.contains(target)&&scene.buildingPanels.get(route.buildingId)===panel&&!panel.hidden&&world.buildings.find(b=>b.id===route.buildingId)===building
    return {turn:world.turn,selected:[...world.selected],inside:current?.inside,owned,identityMatches:current===unit&&current===window.firewarriorPublicEpoch.traineeObject&&current?.kind==='brave'&&current.team==='blue'&&current.hp>0&&location&&scene.isCurrent()&&scene.world===world&&store.getWorld()===world}
  }
  for(const type of ['pointerdown','pointerup','click']) {
    let row
    const before=event=>{try{row={type,trusted:event.isTrusted,button:event.button,modified:!!(event.ctrlKey||event.shiftKey||event.altKey||event.metaKey),x:event.clientX,y:event.clientY,before:sample(event)};events.push(row)}catch(error){errors.push(String(error))}}
    const after=event=>{try{if(row)row.after=sample(event)}catch(error){errors.push(String(error))}}
    // Occupant panels stop pointer bubbling at the panel; observe after its actual button handler.
    const afterOwner=button??doc
    doc.addEventListener(type,before,true);afterOwner.addEventListener(type,after,false)
    removers.push(()=>{doc.removeEventListener(type,before,true);afterOwner.removeEventListener(type,after,false)})
  }
  return {finish(){for(const remove of removers)remove();return {route,events,errors,restored:true,pointer:pointer?.finish()??null,final:{turn:world.turn,selected:[...world.selected],inside:world.units.find(u=>u.id===121)?.inside}}}}
}
export async function selectAuthoredBrave({page,input,guard,report,save}) {
  report.firstSelection={probes:[],inputAttempted:false,receipt:null}
  const readRoute=()=>page.evaluate(async()=>{const {selectionRoute}=await import('/scripts/local-render/firewarrior-selection.mjs'),scene=window.testSceneRef.current,u=scene.world.units.find(u=>u.id===121);return selectionRoute({...u,identityMatches:u===window.firewarriorPublicEpoch.traineeObject})})
  for(;;) {
    await guard()
    const route=await readRoute(),hit=await input.entityPoint(route.kind==='unit'?'units':'buildings',route.kind==='unit'?121:route.buildingId,null)
    const probe={route,hit};report.firstSelection.probes.push(probe);save()
    // Re-read AFTER the potentially slow rendered-pixel search, before any pointer input.
    await guard()
    const admission=await page.evaluate(async({route,hit})=>{
      const {selectionAdmission}=await import('/scripts/local-render/firewarrior-selection.mjs'),{inspectEntityPoint}=await import('/qa/erosion-ordinary/input.mjs')
      const scene=window.testSceneRef.current,u=scene.world.units.find(u=>u.id===121)
      const picked=hit.rejection?null:inspectEntityPoint(scene,route.kind==='unit'?'units':'buildings',hit)
      return selectionAdmission(route,{...u,identityMatches:u===window.firewarriorPublicEpoch.traineeObject},{owned:!!picked?.canvasOwned,id:picked?.hitId})
    },{route,hit})
    probe.admission=admission;save()
    if(!admission.ready)continue
    if(route.kind==='occupant') {
      await page.mouse.move(hit.x,hit.y)
      await guard()
    }
    const armed=await page.evaluate(async({route,hit})=>{
      const {selectionRoute,observeFirstSelection}=await import('/scripts/local-render/firewarrior-selection.mjs'),{inspectEntityPoint,observeEntityPointer}=await import('/qa/erosion-ordinary/input.mjs')
      const scene=window.testSceneRef.current,u=scene.world.units.find(u=>u.id===121)
      if(JSON.stringify(selectionRoute({...u,identityMatches:u===window.firewarriorPublicEpoch.traineeObject}))!==JSON.stringify(route))return null
      let button=null,point=hit
      if(route.kind==='occupant') {
        const panel=scene.buildingPanels.get(route.buildingId)
        button=panel?.querySelector('button[data-person="121"]')
        if(!panel||panel.hidden||!button||button.hidden)return null
        const rect=button.getBoundingClientRect();point={x:rect.x+rect.width/2,y:rect.y+rect.height/2}
        if(!rect.width||!rect.height||!button.contains(document.elementFromPoint(point.x,point.y)))return null
      }else {const picked=inspectEntityPoint(scene,'units',hit);if(!picked.canvasOwned||picked.hitId!==121)return null}
      if(window.firewarriorFirstSelection)throw Error('Foreign first-selection observer exists')
      window.firewarriorFirstSelection=observeFirstSelection({scene,store:window.testStore,route,button,observeEntityPointer})
      return {point,turn:scene.world.turn,route}
    },{route,hit})
    probe.armed=armed;save()
    if(!armed)continue
    // Exactly one click attempt. Delivered-event validators can fail, never retry.
    report.firstSelection.inputAttempted=true;save()
    try {await page.mouse.click(armed.point.x,armed.point.y)}
    finally {
      report.firstSelection.receipt=await page.evaluate(()=>{const observer=window.firewarriorFirstSelection;if(!observer)throw Error('Selection observer disappeared');const result=observer.finish();if(window.firewarriorFirstSelection!==observer)throw Error('Foreign selection observer preserved');delete window.firewarriorFirstSelection;return result})
      save()
    }
    assertSelectionReceipt(report.firstSelection.receipt)
    return report.firstSelection
  }
}
