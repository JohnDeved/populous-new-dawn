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
export function observeDeselection({scene,store,win=window,doc=document}) {
  const world=scene.world,events=[]
  const sample=()=>({current:scene.isCurrent()&&scene.world===world&&store.getWorld()===world,level:world.outcome.level,selected:[...world.selected],mode:world.mode,paused:world.paused,inputMask:world.inputMask,turn:world.turn,pendingTime:world.pendingTime,animationFrame:scene.gameClock.animationFrame,animationTime:scene.gameClock.animationTime,dialog:!!doc.querySelector('dialog[open]')})
  const initial=sample()
  requireSelection(initial.current&&initial.level===10&&initial.selected.length&&!initial.mode&&!initial.paused&&!initial.inputMask&&!initial.dialog,'Ordinary M10 deselection prerequisite changed')
  const before=event=>events.push({key:event.key,trusted:event.isTrusted,modified:!!(event.ctrlKey||event.shiftKey||event.altKey||event.metaKey),editable:!!event.target.closest('input,dialog'),before:sample()})
  const after=()=>{if(events.length)events.at(-1).after=sample()}
  win.addEventListener('keydown',before,true);win.addEventListener('keydown',after,false)
  return {finish(){win.removeEventListener('keydown',before,true);win.removeEventListener('keydown',after,false);return {initial,events,restored:true}}}
}
export function assertDeselectionReceipt(receipt) {
  requireSelection(receipt.restored&&receipt.events.length===1,'Exactly one deselection keydown required')
  const event=receipt.events[0],before=event.before,after=event.after
  requireSelection(event.key==='Escape'&&event.trusted&&!event.modified&&!event.editable,'Ordinary trusted Escape required')
  requireSelection(before.current&&before.level===10&&before.selected.length&&before.mode===null&&!before.paused&&!before.inputMask&&!before.dialog,'Deselection delivery prerequisite changed')
  requireSelection(after&&after.selected.length===0,'Escape did not clear selection')
  const {selected:_before,...stableBefore}=before,{selected:_after,...stableAfter}=after
  requireSelection(JSON.stringify(stableBefore)===JSON.stringify(stableAfter),'Escape changed clock, mode, pause, dialog or World ownership')
  return receipt
}
export async function pollSelectionControl({read,guard,record,wait=()=>new Promise(resolve=>setTimeout(resolve,50))}) {
  for(;;) {
    await guard()
    const state=await read();record(state)
    if(state.ready||state.retryDiscovery)return state
    await wait()
  }
}
export async function selectAuthoredBrave({page,input,guard,report,save}) {
  report.firstSelection={probes:[],inputAttempted:false,receipt:null,deselection:null}
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
      const needsDeselect=await page.evaluate(()=>window.testStore.getWorld().selected.length>0)
      if(needsDeselect) {
        requireSelection(!report.firstSelection.deselection,'No second deselection attempt allowed')
        report.firstSelection.deselection={attempted:false,receipt:null};save()
        await page.evaluate(async()=>{
          const {observeDeselection}=await import('/scripts/local-render/firewarrior-selection.mjs')
          if(window.firewarriorDeselection)throw Error('Foreign deselection observer exists')
          window.firewarriorDeselection=observeDeselection({scene:window.testSceneRef.current,store:window.testStore})
        })
        report.firstSelection.deselection.attempted=true;save()
        try {await page.keyboard.press('Escape')}
        finally {
          report.firstSelection.deselection.receipt=await page.evaluate(()=>{const observer=window.firewarriorDeselection;if(!observer)throw Error('Deselection observer disappeared');const result=observer.finish();delete window.firewarriorDeselection;return result})
          save()
        }
        assertDeselectionReceipt(report.firstSelection.deselection.receipt)
        await guard()
      }
      await page.mouse.move(hit.x,hit.y)
      await guard()
    }
    probe.controlVisits=[]
    const armed=await pollSelectionControl({guard,record:state=>{probe.controlVisits.push(state);save()},read:()=>page.evaluate(async({route,hit})=>{
      const {selectionRoute,observeFirstSelection}=await import('/scripts/local-render/firewarrior-selection.mjs'),{inspectEntityPoint,observeEntityPointer}=await import('/qa/erosion-ordinary/input.mjs')
      const scene=window.testSceneRef.current,u=scene.world.units.find(u=>u.id===121)
      if(JSON.stringify(selectionRoute({...u,identityMatches:u===window.firewarriorPublicEpoch.traineeObject}))!==JSON.stringify(route))return {ready:false,retryDiscovery:true,reason:'person location changed',turn:scene.world.turn}
      let button=null,point=hit
      if(route.kind==='occupant') {
        const panel=scene.buildingPanels.get(route.buildingId)
        button=panel?.querySelector('button[data-person="121"]')
        const owner=scene.tooltipController,record=scene.objectPanels.buildingRecords.get(route.buildingId)
        const state={ready:false,turn:scene.world.turn,selected:[...scene.world.selected],inside:u.inside,occupants:[...(scene.world.buildings.find(b=>b.id===route.buildingId)?.admission?.occupants??[])],tooltip:{route:scene.tooltipInput?.route,picked:scene.tooltipInput?.picked,category:owner?.category,key:owner?.key,dwell:owner?.dwell,threshold:owner?.session.threshold,lastVisit:owner?.lastVisit,remaining:scene.tooltip.remaining},record:record?{...record}:null,panel:panel?{hidden:panel.hidden,connected:panel.isConnected}:null,button:button?{hidden:button.hidden,connected:button.isConnected,person:button.dataset.person}:null}
        if(!panel||panel.hidden||!button||button.hidden)return {...state,reason:!panel?'missing panel':panel.hidden?'hidden panel':!button?'missing occupant button':'hidden occupant button'}
        if(!state.occupants.includes(121)||u.inside!==route.buildingId)throw Error('Current occupant ownership changed')
        const rect=button.getBoundingClientRect();point={x:rect.x+rect.width/2,y:rect.y+rect.height/2}
        const top=document.elementFromPoint(point.x,point.y)
        if(!rect.width||!rect.height||!button.contains(top))return {...state,reason:'control geometry or occlusion',rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},top:top?{tag:top.tagName,className:top.className,person:top.dataset?.person}:null}
      }else {const picked=inspectEntityPoint(scene,'units',hit);if(!picked.canvasOwned||picked.hitId!==121)throw Error('Final unit picker ownership changed')}
      if(window.firewarriorFirstSelection)throw Error('Foreign first-selection observer exists')
      window.firewarriorFirstSelection=observeFirstSelection({scene,store:window.testStore,route,button,observeEntityPointer})
      return {ready:true,point,turn:scene.world.turn,route}
    },{route,hit})})
    probe.armed=armed;save()
    if(!armed.ready)continue
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

// Read-only terminal evidence retains original identity after World removes its dead roster entry.
export function readTrainingRetirement({epoch,world}) {
  const snapshot=epoch.snapshot(),original=epoch.traineeObject
  const state={turn:world.turn,trained:snapshot.trained,original:original?{id:original.id,kind:original.kind,team:original.team,hp:original.hp}:null,livingOriginal:world.units.filter(u=>u.id===121&&u.hp>0).map(u=>({id:u.id,kind:u.kind,hp:u.hp})),fresh:world.units.filter(u=>u.team==='blue'&&u.kind==='firewarrior'&&u.hp>0&&!epoch.initialFirewarriors.includes(u.id)).map(u=>({id:u.id,kind:u.kind,hp:u.hp,inside:u.inside})),record:snapshot.record,latch:snapshot.latch,reservations:snapshot.reservations,dom:snapshot.dom,admission:snapshot.target?.admission??null}
  state.complete=state.trained===1&&state.original?.id===121&&state.original.kind==='brave'&&state.original.team==='blue'&&state.original.hp===0&&state.livingOriginal.length===0&&state.fresh.length===1&&!state.record&&!state.latch&&!state.reservations&&(!state.dom.present||state.dom.hidden)
  return state
}
