// Diagnostic-only source witness: use only through the existing owned local-render harness.
// No standalone browser launch, World writes, forced clocks or actor relocation.
// REVIEW BEFORE EXECUTION: turn/wall checks are admission bounds, not cancellation
// of already in-flight Playwright operations. A separate post-entry wall watchdog
// closes this owned page at 60 seconds. The turn watchdog closes it at the first
// observed phase deadline; sampling/closure latency is reported, not called exact cancellation.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

export function initialTrainingBudget() {
  return {phase:'setup',turnLimit:300,setupLimit:300,afterInputTurns:300,absoluteLimit:600,deliveredTurn:null}
}
export function admitTrainingBudget(budget,turn,verify) {
  verify() // A rejected delivered command can never extend the setup budget.
  assert.equal(budget.phase,'setup')
  assert(Number.isInteger(turn)&&turn>=0&&turn<budget.setupLimit,'Training input must be delivered before setup limit')
  return {...budget,phase:'natural-conversion',deliveredTurn:turn,turnLimit:Math.min(budget.absoluteLimit,turn+budget.afterInputTurns)}
}
export const trainingBudgetExceeded=(budget,turn)=>turn>=budget.turnLimit

export default async function firewarriorPublicWitness({ page, root, output, signal, receipt }) {
  const { showAllMissions, bindGame } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')))
  const { createMission1VaultInput } = await import(pathToFileURL(resolve(root, 'scripts/local-render/mission1-vault-input.mjs')))
  const { selectAuthoredBrave } = await import(pathToFileURL(resolve(root, 'scripts/local-render/firewarrior-selection.mjs')))
  const { assertTempleTrainInput } = await import(pathToFileURL(resolve(root, 'scripts/local-render/temple-training-contract.mjs')))
  let turnBudget=initialTrainingBudget()
  const report = { status: 'running', source: receipt.source, limits: { protocol:'prospective setup + verified-input conversion allowance', turnBudget, wallMs: 60000, records: 4096 }, actions: [], captures: [], cleanupErrors: [] }
  const save = () => writeFileSync(resolve(output, 'firewarrior-public.json'), JSON.stringify(report, null, 2) + '\n')
  let enteredAt = null, epochInstalled = false, deadline = null, wallTimer = null, turnTimer = null, turnPoll = null, boundClose = null, lastTurnSample = null
  const closeAtBound = async detail => {
    if (boundClose) return boundClose
    const requestedAt = Date.now()
    report.boundExceeded = { ...detail, turnBudget:{...turnBudget}, requestedAt, entryElapsedMs: requestedAt-enteredAt }
    boundClose = page.close().then(() => {
      report.boundExceeded.completedAt=Date.now()
      report.boundExceeded.closeLatencyMs=report.boundExceeded.completedAt-requestedAt
    }).catch(error=>report.cleanupErrors.push(String(error)))
    return boundClose
  }
  const guard = async () => {
    signal.throwIfAborted()
    if(Date.now()>=deadline){await closeAtBound({kind:'wall-guard',deadline,observationAt:Date.now(),overshootMs:Date.now()-deadline});throw Error('60-second post-entry limit reached')}
    const state = await page.evaluate(() => {
      const scene = window.testSceneRef.current, w = scene.world
      return { turn: w.turn, level: w.outcome.level, speed: w.speed, paused: w.paused, status: w.status, current: scene.isCurrent() && w === window.testStore.getWorld() }
    })
    assert(state.current && state.level === 10 && state.speed === 1 && !state.paused && state.status === 'playing')
    if(trainingBudgetExceeded(turnBudget,state.turn)){await closeAtBound({kind:'turn-guard',turn:state.turn,overshootTurns:state.turn-turnBudget.turnLimit,observedAt:Date.now(),previousSample:lastTurnSample});throw Error('Prospective phase turn limit reached')}
    return state
  }
  const waitFor = async (label, predicate) => {
    for (;;) {
      await guard()
      const value = await page.evaluate(predicate)
      if (value) return value
      await page.waitForTimeout(25)
    }
  }
  const capture = async (label, expectedPhase = null) => {
    await guard()
    const observe = () => page.evaluate(() => {
      const scene = window.testSceneRef.current, epoch = window.firewarriorPublicEpoch,
        sample = epoch.snapshot(), panel = scene.buildingPanels.get(98), r = panel?.getBoundingClientRect()
      return { sample, rect: r && { x:r.x,y:r.y,width:r.width,height:r.height }, viewport:{width:innerWidth,height:innerHeight},
        owner: !!panel && scene.buildingPanels.get(98) === panel && panel.isConnected && panel.getAttribute('aria-label')?.startsWith('Firewarrior training:') }
    })
    const before = await observe()
    if (expectedPhase !== null) {
      assert.equal(before.sample.record?.phase, expectedPhase)
      assert(before.owner && !before.sample.dom.hidden && before.sample.offTarget)
      const r = before.rect, v = before.viewport
      assert(r && r.width > 0 && r.height > 0 && r.x >= 0 && r.y >= 0 && r.x+r.width <= v.width && r.y+r.height <= v.height, 'owned crop must fit the viewport')
      const file = resolve(output, `${label}-panel.png`)
      const bytes = await page.screenshot({ path:file, clip:r })
      report.captures.push({label,file,kind:'owned-panel',sha256:createHash('sha256').update(bytes).digest('hex'),before})
    }
    const file = resolve(output, `${label}-viewport.png`)
    const bytes = await page.screenshot({ path:file })
    const after = await observe()
    await guard()
    if (expectedPhase !== null) {
      assert.equal(after.sample.record?.phase, expectedPhase, 'phase changed during capture; no phase-specific credit')
      assert.equal(after.sample.record?.identity, before.sample.record.identity)
      assert(after.owner && !after.sample.dom.hidden)
      for (const k of ['x','y','width','height']) assert(Math.abs(after.rect[k]-before.rect[k]) <= 1, 'crop owner moved during capture')
    }
    report.captures.push({label,file,kind:'viewport',sha256:createHash('sha256').update(bytes).digest('hex'),before,after})
    save()
  }
  try {
    // Do NOT use harness.openMission: its absent-skip wait consumes 45 seconds in M10.
    await showAllMissions(page)
    enteredAt = Date.now(); deadline = enteredAt + 60000
    report.enteredAt = new Date(enteredAt).toISOString(); save()
    wallTimer=setTimeout(()=>{void closeAtBound({kind:'wall',deadline,observationAt:Date.now(),overshootMs:Date.now()-deadline})},60000)
    await page.getByRole('button', { name:'Mission 10', exact:true }).click({timeout:5000})
    await bindGame(page)
    turnTimer=setInterval(()=>{
      if(turnPoll)return
      turnPoll=(async()=>{
      try{const sampledAt=Date.now(),turn=await page.evaluate(()=>window.testSceneRef.current.world.turn),observedAt=Date.now();if(trainingBudgetExceeded(turnBudget,turn))await closeAtBound({kind:'turn',turn,overshootTurns:turn-turnBudget.turnLimit,sampledAt,observedAt,previousSample:lastTurnSample,pollIntervalMs:50});lastTurnSample={sampledAt,observedAt,turn}}
      catch(error){if(!page.isClosed())report.cleanupErrors.push(String(error))}
      })().finally(()=>{turnPoll=null})
    },50)
    await guard()
    report.identities = await page.evaluate(async () => {
      const { default: level } = await import('/app/level-ten.ts')
      const scene = window.testSceneRef.current, w = scene.world,
        school = w.buildings.find(b => b.kind === 'firewarriorHut' && b.team === 'blue' && b.anchor?.x === 7168 && b.anchor?.y === 0),
        brave = w.units.find(u => u.id === 121), shaman = w.units.find(u => u.kind === 'shaman' && u.team === 'blue' && u.hp > 0)
      if (level.sourceSha256 !== '0b0e073e0214597db814d3b69ba565127ea3df58cf5f46e6796466b7059c9f5d' || school?.id !== 98 || brave?.kind !== 'brave' || brave.team !== 'blue' || !(brave.hp>0) || !shaman) throw Error('Authored identity prerequisite changed')
      if (w.inputMask || w.flyby.flags & 1 || w.mode || scene.overviewActive || scene.overviewStage) throw Error('Normal command input is not ready')
      const { createTempleTrainingEpoch } = await import('/scripts/local-render/temple-training-witness.mjs')
      if (window.firewarriorPublicEpoch || window.mission1VaultDispatchModules || window.mission1VaultDispatch) throw Error('Foreign observer or dispatch modules exist')
      const epoch = createTempleTrainingEpoch({scene,store:window.testStore,targetId:98,maxRecords:4096})
      epoch.setTrainee(121)
      epoch.traineeObject=brave
      window.firewarriorPublicEpoch = epoch
      epoch.initialFirewarriors=w.units.filter(u=>u.team==='blue'&&u.kind==='firewarrior'&&u.hp>0).map(u=>u.id)
      return {school:98,brave:121,shaman:shaman.id,braveInside:brave.inside,turn:w.turn,initialFirewarriors:[...epoch.initialFirewarriors]}
    })
    epochInstalled = true
    const input = createMission1VaultInput({ page, signal, report, save, originalShamanId:report.identities.shaman, deadlineAt:deadline })
    await selectAuthoredBrave({page,input,guard,report,save})
    await guard()
    await page.evaluate(()=>window.firewarriorPublicEpoch.armInput(121))
    await input.prepareDispatch()
    await page.evaluate(()=>{window.firewarriorPublicEpoch.dispatchModules=window.mission1VaultDispatchModules})
    const schoolHit=await input.entityPoint('buildings',98,8,false)
    assert.equal(schoolHit.rejection,null,JSON.stringify(schoolHit.diagnostics))
    await guard()
    report.trainingInput=await input.dispatch(schoolHit,8,[121])
    const delivered=await page.evaluate(()=>window.firewarriorPublicEpoch.finishInput())
    await guard() // Setup cannot expire while delivery verification is pending.
    assert(!boundClose,'Expired setup cannot gain a new budget')
    turnBudget=admitTrainingBudget(turnBudget,report.trainingInput.after.turn,()=>assertTempleTrainInput(delivered,98,121))
    report.limits.turnBudget=turnBudget
    report.delivered=delivered;save()
    // A real UI-owned point clears battlefield hover; no forced hover fields.
    const hud=page.getByRole('button',{name:'Pause game',exact:true}), box=await hud.boundingBox()
    assert(box)
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2)
    const first=await waitFor('first natural automatic request',()=>window.firewarriorPublicEpoch.status().firstRequest)
    assert.equal(first.threw,false);assert.equal(first.receiverMatches,true)
    assert.equal(first.before.target.kind,'firewarriorHut');assert.equal(first.before.target.admission.model,8)
    assert.deepEqual(first.before.target.admission.occupants.filter(Boolean),[121]);assert.equal(first.before.trainee.inside,98)
    assert.equal(first.before.latch,false);assert.equal(first.after.latch,true)
    assert.equal(first.after.record.phase,-1);assert.equal(first.after.record.automatic,true);assert.equal(first.after.reservations,1)
    report.firstRequest=first
    await waitFor('retained phase1 after pointer departure',()=>{const s=window.firewarriorPublicEpoch.snapshot();return s.record?.phase===1&&s.offTarget&&!s.dom.hidden&&s.target.admission.activity&128})
    await capture('active-off-pointer',1)
    await waitFor('natural conversion and automatic exit',()=>{
      const s=window.firewarriorPublicEpoch.snapshot(),w=window.testSceneRef.current.world
      const old=w.units.find(u=>u.id===121),fresh=w.units.filter(u=>u.team==='blue'&&u.kind==='firewarrior'&&u.hp>0&&!window.firewarriorPublicEpoch.initialFirewarriors.includes(u.id))
      return s.trained===1&&old?.hp===0&&fresh.length===1&&!s.record&&!s.latch&&!s.reservations&&(!s.dom.present||s.dom.hidden)
    })
    report.conversion=await page.evaluate(()=>{const w=window.testSceneRef.current.world;return{turn:w.turn,old:w.units.filter(u=>u.id===121).map(u=>({id:u.id,hp:u.hp,kind:u.kind})),fresh:w.units.filter(u=>u.team==='blue'&&u.kind==='firewarrior'&&u.hp>0&&!window.firewarriorPublicEpoch.initialFirewarriors.includes(u.id)).map(u=>({id:u.id,hp:u.hp,kind:u.kind,inside:u.inside}))}})
    await capture('converted-and-retired')
    report.status='passed'
  } catch (error) {
    report.status='failed';report.error=String(error?.stack??error);throw error
  } finally {
    if(wallTimer)clearTimeout(wallTimer)
    if(turnTimer)clearInterval(turnTimer)
    if(turnPoll)await turnPoll
    if(boundClose)await boundClose
    if(epochInstalled) {
      try {
        report.epoch=await page.evaluate(()=>{const epoch=window.firewarriorPublicEpoch;if(!epoch)throw Error('Owned observer disappeared');const result=epoch.close();if(epoch.dispatchModules){if(window.mission1VaultDispatchModules!==epoch.dispatchModules)throw Error('Foreign dispatch modules preserved');delete window.mission1VaultDispatchModules}if(window.firewarriorPublicEpoch!==epoch)throw Error('Foreign observer replacement preserved');delete window.firewarriorPublicEpoch;return result})
        assert.deepEqual(report.epoch.errors,[]);assert.equal(report.epoch.overflow,false)
        if(report.status==='passed')assert(report.epoch.records.some(r=>r.kind==='step'&&r.after?.record?.phase===2),'ordinary exit phase must be observed')
      }catch(error){report.status='failed';report.cleanupErrors.push(String(error?.stack??error))}
    }
    report.finishedAt=new Date().toISOString();save()
  }
  assert.equal(report.status,'passed',JSON.stringify(report.cleanupErrors))
  return report
}
