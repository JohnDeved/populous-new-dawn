import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { bindGame } from '../../../scripts/browser-game.mjs'
import { waitForCheckpointReadback } from '../../../scripts/checkpoint-readback.mjs'

// An archived interactive acceptance driver. All game mutations below are normal
// Playwright mouse/keyboard inputs. Page evaluation only observes existing state,
// projects input targets, checks ordinary pick/placement/range helpers, or reads IDB.
export default async function ({ page, output, signal }) {
  const bytes = readFileSync(new URL('candidate.mjs', import.meta.url))
  writeFileSync(resolve(output, 'candidate.mjs'), bytes)
  const input = { name: 'candidate.mjs', sha256: createHash('sha256').update(bytes).digest('hex') }
  writeFileSync(resolve(output, 'scenario-inputs.json'), JSON.stringify([input], null, 2))
  const failures = [], marks = []
  const log = value => appendFileSync(resolve(output, 'actions.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...value }) + '\n')
  const state = () => page.evaluate(() => {
    const s = window.testSceneRef?.current
    if (!s) return { sceneUnavailable: true, body: document.body.innerText }
    const w = s.world, r = s.container.getBoundingClientRect()
    const project = p => { const q = s.screen(p); return { x: r.left + (q.x + 1) * r.width / 2, y: r.top + (1 - q.y) * r.height / 2 } }
    const gl = s.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return {
      level: w.outcome.level, turn: w.turn, time: w.time, speed: w.speed, paused: w.paused, status: w.status, inputMask: w.inputMask,
      selected: w.selected, mode: w.mode, stats: w.stats, shots: w.shots, mana: w.mana, message: w.message,
      unlockedCamp: w.unlockedCamp, campaignCompleted: window.testStore.getSnapshot?.()?.completed,
      camera: { point: s.viewPoint, bearing: s.cameraBearing, overview: s.overviewStage },
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      units: w.units.filter(u => u.hp > 0).map(u => ({ id: u.id, team: u.team, kind: u.kind, x: u.x, z: u.z, hp: u.hp, inside: u.inside, work: u.work, target: u.target, state: u.state, task: u.task, flags4: u.flags4, point: project(u) })),
      buildings: w.buildings.filter(b => b.hp > 0).map(b => ({ id: b.id, team: b.team, kind: b.kind, x: b.x, z: b.z, hp: b.hp, progress: b.progress, logs: b.logs, occupants: b.occupants, training: b.training, point: project(b) })),
      shrines: w.shrines.map(h => ({ id: h.id, kind: h.kind, x: h.x, z: h.z, required: h.required, work: h.work, target: h.target, progress: h.progress, uses: h.uses, remaining: h.remaining, followers: h.followers, active: h.active, point: project(h) })),
      effects: w.effects.map(f => ({ id: f.id, kind: f.kind, x: f.x, z: f.z, duration: f.duration })),
      messages: w.messages.slots.map(m => m?.stringId ?? null),
      dom: [...document.querySelectorAll('button')].filter(e => e.getBoundingClientRect().width && e.getBoundingClientRect().height).map(e => ({ text: e.textContent, aria: e.getAttribute('aria-label'), title: e.title, disabled: e.disabled, pressed: e.getAttribute('aria-pressed') })),
      body: document.body.innerText,
    }
  })
  const snap = async name => {
    const s = { at: new Date().toISOString(), ...await state() }
    writeFileSync(resolve(output, `${name}.json`), JSON.stringify(s, null, 2))
    await page.screenshot({ path: resolve(output, `${name}.png`) })
    console.log(JSON.stringify({ snapshot: name, at: s.at, turn: s.turn, status: s.status, paused: s.paused,
      population: s.units?.reduce((p, u) => { const k = `${u.team}-${u.kind}`; p[k] = (p[k] ?? 0) + 1; return p }, {}), stats: s.stats, shots: s.shots }))
    return s
  }
  const button = (name, options) => page.getByRole('button', { name, exact: true }).click(options)
  const pause = async () => { if (!(await state()).paused) await button('Pause game') }
  const resume = async () => { if ((await state()).paused) await button('Resume game') }
  const clear = async () => {
    for (let i = 0; i < 3; i++) {
      const s = await state()
      if (!s.mode && !s.selected.length) return
      await page.keyboard.press('Escape')
    }
    const s = await state(); assert.ok(!s.mode && !s.selected.length, 'Ordinary Escape clears selection')
  }
  const select = async (kind, modifier = 'Control') => {
    await clear()
    if (kind === 'shaman') await button('Select and focus shaman')
    else await button(`Select ${kind}`, { modifiers: modifier ? [modifier] : [] })
    const s = await state(); assert.ok(s.selected.some(id => s.units.some(u => u.id === id && u.kind === kind)), `Selected ${kind}`)
    log({ operation: 'selected', kind, modifier, ids: s.selected, turn: s.turn })
  }
  const map = async point => {
    const q = await page.evaluate(async p => {
      const s = window.testSceneRef.current, { minimapPick } = await import('/app/minimap.ts'),
        r = s.mini.getBoundingClientRect(), width = s.mini.width, height = s.mini.height,
        center = { x: Math.round((s.viewPoint.x + 8) * 256), y: Math.round((-s.viewPoint.z - 8) * 256) },
        target = { x: Math.round((p.x + 8) * 256), y: Math.round((-p.z - 8) * 256) },
        heading = Math.round(s.cameraBearing * 1024 / Math.PI), wrap = v => ((v + 32768) % 65536 + 65536) % 65536 - 32768
      let best = { d: Infinity }
      for (let y = 2; y < height - 2; y++) for (let x = 2; x < width - 2; x++) {
        const n = minimapPick(width, height, center, heading, { x, y }), d = Math.hypot(wrap(n.x - target.x), wrap(n.y - target.y))
        if (d < best.d) best = { d, x: r.x + x / width * r.width, y: r.y + y / height * r.height }
      }
      return best
    }, point)
    log({ operation: 'minimap-click', point, input: q })
    await page.mouse.click(q.x, q.y); await page.mouse.move(400, 780); await page.waitForTimeout(1000)
  }
  const rotate = async (delta = 512) => {
    const check = await page.evaluate(delta => { const s=window.testSceneRef.current; return { canvasOwns: [280,280+delta].every(x=>document.elementFromPoint(x,750)===s.renderer.domElement), selected:[...s.world.selected], turn:s.world.turn, bearing:s.cameraBearing } }, delta)
    assert.ok(check.canvasOwns && check.selected.length, 'Selected-group camera drag requires canvas-owned corridor')
    log({ operation:'camera-right-drag',delta,before:check })
    await page.mouse.move(280, 750); await page.mouse.down({ button: 'right' })
    try { await page.mouse.move(280 + delta, 750, { steps: 12 }) } finally { await page.mouse.up({ button: 'right' }) }
    await page.waitForTimeout(700)
  }
  const entityHit = (collection, id) => page.evaluate(({ collection, id }) => {
    const s = window.testSceneRef.current, o = s.world[collection].find(o => o.id === id), r = s.container.getBoundingClientRect()
    if (!o) return { error: 'Entity unavailable', collection, id }
    const mesh = collection === 'units' ? s.unitMeshes.get(id) : collection === 'buildings' ? s.buildingMeshes.get(id) : s.shrineMeshes.get(id)?.g,
      projected = s.screen(mesh?.position ?? o), center = { x: r.x + (projected.x + 1) * r.width / 2, y: r.y + (1 - projected.y) * r.height / 2 }, candidates = []
    for (let dy = collection === 'units' ? -30 : -150; dy <= 65; dy += 5) for (let dx = -100; dx <= 100; dx += 5) candidates.push({ x: center.x + dx, y: center.y + dy })
    if (collection === 'units') {
      const b = s.picking.personBounds(id)
      if (b) candidates.push({ x: r.x + b.x + b.width / 2, y: r.y + b.y + b.height / 2 })
    } else mesh?.traverse(child => {
      if (child.userData.nativeModel === undefined || !child.visible) return
      const commands = s.picking.model(child, JSON.stringify(s.view.projection))
      for (const { points } of commands.filter(c => c.kind === 'model')) for (const weights of [[1,1,1],[2,1,1],[1,2,1],[1,1,2]]) {
        const total = weights.reduce((a,b) => a+b, 0)
        candidates.push({ x: r.x + points.reduce((sum,p,i) => sum+p.x*weights[i],0)/total, y: r.y + points.reduce((sum,p,i) => sum+p.y*weights[i],0)/total })
      }
    })
    const misses = new Set()
    for (const p of candidates) {
      if (p.x < 210 || p.x >= 1430 || p.y < 5 || p.y >= 920 || document.elementFromPoint(p.x,p.y) !== s.renderer.domElement) continue
      const e = { clientX:p.x,clientY:p.y }, person = s.picking.pickPerson(e), hit = collection === 'units' ? person : person !== null ? person : s.pickWorldObject(e)?.id
      if (hit === id) return { x:p.x,y:p.y,center,collection,id,turn:s.world.turn }
      misses.add(hit ?? null)
    }
    return { error:'No canvas-owned rendered hit',collection,id,center,misses:[...misses] }
  }, { collection,id })
  const entity = async (collection,id,{focus=true,modifiers=[]}={}) => {
    if (focus) {
      const s = await state(), target = s[collection].find(o => o.id === id)
      assert.ok(target, `Existing ${collection} ${id}`); await map(target)
    }
    let q
    for (let attempt=0;attempt<4;attempt++) {
      q = await entityHit(collection,id); log({operation:'entity-pick',attempt,...q})
      if (!q.error) break
      if (attempt<3) await rotate()
    }
    assert.ok(!q.error, JSON.stringify(q)); const beforeClick = await state()
    if (collection !== 'units' && beforeClick.selected.length) assert.equal(beforeClick.paused,false,'Resume before issuing a world order')
    for (const key of modifiers) await page.keyboard.down(key)
    try { await page.mouse.click(q.x,q.y) } finally { for (const key of modifiers.toReversed()) await page.keyboard.up(key) }
    await page.mouse.move(400,780)
    if (collection === 'shrines' && beforeClick.selected.length) {
      const afterClick = await state(); assert.ok(afterClick.units.some(u=>beforeClick.selected.includes(u.id)&&u.work===id), `Ordinary worship order accepted for shrine ${id}`)
      log({ operation:'worship-order-accepted',id,selected:beforeClick.selected,turn:afterClick.turn })
    }
  }
  const terrain = () => page.evaluate(() => {
    const w=window.testStore.getWorld()
    return {heights:Array.from(w.land.heights),flags:Array.from(w.land.flags),cliffs:Array.from(w.land.cliffs),categories:Array.from(w.land.categories),shadows:Array.from(w.land.shadows),landFlags:w.land.landFlags}
  })
  await button('All missions');await button('Mission 2');await bindGame(page)
  await page.waitForFunction(()=>window.testScene.world.flyby.flags&1||!window.testScene.world.inputMask)
  if(await page.locator('.skip-introduction').isVisible())await page.locator('.skip-introduction').click()
  await page.evaluate(async()=>{const {campaignShamanReadiness}=await import('/scripts/campaign-start-readiness.mjs');window.observeReady=campaignShamanReadiness})
  await page.waitForFunction(()=>window.observeReady(window.testSceneRef.current.world).ready)
  await pause();const opening=await snap('opening')
  const head=opening.shrines.find(h=>h.kind==='bridgeEffect')
  assert.ok(head)
  await select('shaman')
  await resume()
  await entity('shrines',head.id)
  await page.waitForFunction(()=>{const h=window.testStore.getWorld().shrines.find(h=>h.kind==='bridgeEffect');return h.work>0&&!h.uses},null,{timeout:120000,polling:50})
  await pause();await map({x:-69,z:-105});await snap('authored-crossing-before')
  const initial=await terrain()
  writeFileSync(resolve(output,'initial-terrain.json'),JSON.stringify(initial))
  await resume()
  await page.waitForFunction(()=>window.testStore.getWorld().effects.some(f=>f.bridge),null,{timeout:120000,polling:50})
  await pause()
  const active=await page.evaluate(()=>{const w=window.testStore.getWorld(),f=w.effects.find(f=>f.bridge);return {turn:w.turn,bridge:structuredClone(f?.bridge),effectPosition:f&&{x:f.x,z:f.z},uses:w.shrines.find(h=>h.kind==='bridgeEffect').uses}})
  assert.ok(active.bridge,'Active bridge retained at pause')
  assert.deepEqual(active.bridge.start,{x:47872,y:24832});assert.deepEqual(active.bridge.target,{x:51968,y:24832})
  assert.deepEqual(active.effectPosition,{x:-77,z:-105});assert.equal(active.uses,1)
  // Polling observes an active controller, not its exact birth turn. The native
  // and component proof owns the immediate initialization boundary.
  assert.ok(active.bridge.turn>=1,'Observed authored bridge is initialized')
  const expected=await page.evaluate(async({initial,start,target})=>{
    const {createLandBridge,stepLandBridge}=await import('/app/land-bridge.ts')
    const bridge=createLandBridge(start,target)
    stepLandBridge({heights:Int16Array.from(initial.heights),flags:Uint32Array.from(initial.flags)},bridge,
      ()=>{throw Error('Initialization emitted a trail')},()=>{throw Error('Initialization notified terrain')})
    return bridge
  },{initial,start:active.bridge.start,target:active.bridge.target})
  const caches=({turn,...fields})=>fields
  assert.deepEqual(caches(active.bridge),caches(expected),'Observed caches match the captured initial terrain')
  writeFileSync(resolve(output,'active-native-state.json'),JSON.stringify(active,null,2)+'\n')
  await snap('authored-crossing-active')
  // Save through the shipped menu and reload a fresh page while paused. The exact
  // persisted native controller and terrain must survive without a second bridge.
  await button('Game settings');await button('Save checkpoint')
  let saved
  assert.equal(await waitForCheckpointReadback(async()=>{
    saved=await page.evaluate(async()=>{const q=indexedDB.open('populous-new-dawn',1),db=await new Promise((r,j)=>{q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});try{const t=db.transaction('checkpoints','readonly').objectStore('checkpoints').get('latest');const v=await new Promise((r,j)=>{t.onsuccess=()=>r(t.result);t.onerror=()=>j(t.error)});return v&&{turn:v.world.turn,bridge:v.world.effects.find(f=>f.bridge)?.bridge,stats:v.world.stats}}finally{db.close()}})
    return saved?.turn===active.turn
  }),true,'Committed exact active checkpoint')
  assert.deepEqual(saved.bridge,active.bridge)
  await page.reload({waitUntil:'domcontentloaded'});await button('Load Game');await button('Pause game');await bindGame(page)
  const restored=await page.evaluate(()=>{const w=window.testStore.getWorld();return {paused:w.paused,bridge:structuredClone(w.effects.find(f=>f.bridge)?.bridge),uses:w.shrines.find(h=>h.kind==='bridgeEffect').uses,stats:w.stats}})
  assert.equal(restored.paused,true);assert.ok(restored.bridge,'Active bridge survives ordinary reload delay')
  assert.deepEqual(restored.bridge.start,active.bridge.start);assert.deepEqual(restored.bridge.target,active.bridge.target)
  assert.deepEqual(caches(restored.bridge),caches(active.bridge),'Load preserves every initialized controller cache')
  assert.ok(restored.bridge.turn>=active.bridge.turn);assert.equal(restored.uses,1);assert.equal(restored.stats.bridges,1)
  await map({x:-69,z:-105});await snap('authored-crossing-restored')
  await resume();await page.waitForFunction(()=>!window.testStore.getWorld().effects.some(f=>f.bridge),null,{timeout:30000,polling:50});await pause()
  await resume()
  if(await page.locator('.skip-introduction').isVisible())await page.locator('.skip-introduction').click()
  await page.waitForFunction(()=>!window.testStore.getWorld().inputMask)
  await pause();await map({x:-69,z:-105})
  const final=await snap('authored-crossing-complete'),after=await terrain()
  assert.equal(final.stats.bridges,1);assert.equal(final.shrines.find(h=>h.kind==='bridgeEffect').uses,1)
  const nativeInput={...initial,start:active.bridge.start,target:active.bridge.target,finalHeights:after.heights}
  writeFileSync(resolve(output,'native-terrain.json'),JSON.stringify(nativeInput))
  const changed=after.heights.flatMap((value,i)=>value!==initial.heights[i]?[i]:[])
  assert.equal(changed.length,36)
  await button('Game settings');await button('Save checkpoint')
  assert.equal(await waitForCheckpointReadback(()=>page.evaluate(async turn=>{const q=indexedDB.open('populous-new-dawn',1),db=await new Promise((r,j)=>{q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});try{const t=db.transaction('checkpoints','readonly').objectStore('checkpoints').get('latest');const v=await new Promise((r,j)=>{t.onsuccess=()=>r(t.result);t.onerror=()=>j(t.error)});return v?.world.turn===turn&&!v.world.effects.some(f=>f.bridge)}finally{db.close()}},final.turn)),true,'Committed completed checkpoint')
  await page.reload({waitUntil:'domcontentloaded'});await button('Load Game');await button('Pause game');await bindGame(page)
  const completedRestore=await state();assert.equal(completedRestore.stats.bridges,1);assert.equal(completedRestore.shrines.find(h=>h.kind==='bridgeEffect').uses,1)
  assert.equal(completedRestore.effects.some(f=>f.kind==='bridge'),false)
  await snap('authored-crossing-completed-restored')
  const report={input,method:'Ordinary shipped HUD and canvas inputs with elapsed real-clock simulation. Read-only observations; no clock, world, terrain or entity injection.',active,restored,completedRestore,changed,final,limits:'Headless software rendering; native terrain equality is a separate replay. Active checkpoint is a real IndexedDB save/reload. Not native GPU or hardware-performance parity.'}
  writeFileSync(resolve(output,'bridge.json'),JSON.stringify(report,null,2)+'\n')
  return report
}
