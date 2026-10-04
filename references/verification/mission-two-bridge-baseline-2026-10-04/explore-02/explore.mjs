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
  const bytes = readFileSync(new URL('explore.mjs', import.meta.url))
  writeFileSync(resolve(output, 'explore.mjs'), bytes)
  const input = { name: 'explore.mjs', sha256: createHash('sha256').update(bytes).digest('hex') }
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
  const groundHit = (point,kind,maxRadius=0,spell) => page.evaluate(async ({point,kind,maxRadius,spell}) => {
    const s=window.testSceneRef.current,r=s.container.getBoundingClientRect(), { placementError, spellTargetError }=await import('/app/model.ts')
    const wrap=v=>((v+128)%256+256)%256-128
    for(let radius=0;radius<=maxRadius;radius+=1)for(let angle=0;angle<Math.PI*2;angle+=Math.PI/12){
      const p={x:point.x+Math.cos(angle)*radius,z:point.z+Math.sin(angle)*radius},q=s.screen(p),e={clientX:r.x+(q.x+1)*r.width/2,clientY:r.y+(1-q.y)*r.height/2}
      if(e.clientX<210||e.clientX>=1430||e.clientY<5||e.clientY>=920||document.elementFromPoint(e.clientX,e.clientY)!==s.renderer.domElement)continue
      const picked=s.pick(e),object=s.picking.pick(e)
      if(picked&&(spell||object===null)&&Math.hypot(wrap(picked.x-p.x),wrap(picked.z-p.z))<1.5&&(!kind||!placementError(s.world,kind,picked))&&(!spell||!spellTargetError(s.world,spell,picked)))return {x:e.clientX,y:e.clientY,point:picked}
    }
    return {error:'No valid rendered ground target',point,kind}
  },{point,kind,maxRadius,spell})
  const ground = async (point,{focus=true,kind,maxRadius=0,spell}={}) => {
    if(focus)await map(point)
    assert.equal((await state()).paused,false,'Resume before issuing a ground order')
    const q=await groundHit(point,kind,maxRadius,spell);log({operation:'ground-pick',...q});assert.ok(!q.error,JSON.stringify(q))
    await page.mouse.click(q.x,q.y);await page.mouse.move(400,780);return q
  }
  const until = async (expression,timeout=180000) => {
    signal.throwIfAborted();const start=await state();log({operation:'wait-start',expression,timeout,turn:start.turn})
    await page.waitForFunction(expression=>{const v=(0,eval)(expression);if(typeof v!=='boolean')throw Error('until must return boolean, never Promise or function');return v},expression,{timeout,polling:500})
    log({operation:'wait-complete',expression,turn:(await state()).turn})
  }
  const checkpoint = async () => {
    await pause();const saved=await snap('checkpoint-saved');await button('Menu');await button('Save checkpoint')
    assert.equal(await waitForCheckpointReadback(()=>page.evaluate(async turn=>{
      const q=indexedDB.open('populous-new-dawn',1),db=await new Promise((r,j)=>{q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)})
      try{const req=db.transaction('checkpoints','readonly').objectStore('checkpoints').get('latest'),v=await new Promise((r,j)=>{req.onsuccess=()=>r(req.result);req.onerror=()=>j(req.error)});return v?.world?.turn===turn}finally{db.close()}
    },saved.turn)),true,'Committed checkpoint exact turn')
    await page.reload({waitUntil:'domcontentloaded'});await button('Load Game');await bindGame(page);await pause();const restored=await snap('checkpoint-restored')
    assert.equal(restored.level,saved.level);assert.ok(restored.turn>=saved.turn&&restored.turn<saved.turn+48)
    assert.deepEqual(restored.stats,saved.stats);assert.deepEqual(restored.shots,saved.shots)
    assert.deepEqual(restored.units.filter(u=>u.team==='blue').map(u=>[u.id,u.kind]),saved.units.filter(u=>u.team==='blue').map(u=>[u.id,u.kind]))
    assert.deepEqual(restored.buildings.filter(b=>b.team==='blue').map(b=>[b.id,b.kind,b.progress,b.logs]),saved.buildings.filter(b=>b.team==='blue').map(b=>[b.id,b.kind,b.progress,b.logs]))
    marks.push({name:'fresh-page-checkpoint',savedTurn:saved.turn,restoredTurn:restored.turn,at:new Date().toISOString()});writeFileSync(resolve(output,'milestones.json'),JSON.stringify(marks,null,2))
  }
  await button('All missions');await button('Mission 2');await bindGame(page)
  await page.waitForFunction(()=>window.testScene.world.flyby.flags&1||!window.testScene.world.inputMask)
  if(await page.locator('.skip-introduction').isVisible())await page.locator('.skip-introduction').click()
  await page.evaluate(async () => { const { campaignShamanReadiness } = await import('/scripts/campaign-start-readiness.mjs'); window.missionTwoObserveReady = campaignShamanReadiness })
  await until('window.missionTwoObserveReady(window.testSceneRef.current.world).ready',60000)
  await pause();await snap('000-opening')
  for(let i=1;i<500;i++){
    const file=resolve(output,`command-${i}.json`)
    while(!existsSync(file)){signal.throwIfAborted();await new Promise(r=>setTimeout(r,500))}
    const commands=JSON.parse(readFileSync(file,'utf8')),extra=[]
    try{
      for(const c of commands){
        log({commandIndex:i,command:c})
        if(c.action==='button')await button(c.name,c.options)
        else if(c.action==='title')await page.getByTitle(c.name,{exact:true}).click(c.options??{})
        else if(c.action==='select')await select(c.kind,c.modifier)
        else if(c.action==='clear')await clear()
        else if(c.action==='pause')await pause()
        else if(c.action==='resume')await resume()
        else if(c.action==='map')await map(c.point)
        else if(c.action==='entity')await entity(c.collection,c.id,c.options)
        else if(c.action==='ground')extra.push(await ground(c.point,c.options))
        else if(c.action==='key')await page.keyboard.press(c.key)
        else if(c.action==='hold'){await page.keyboard.down(c.key);try{await page.waitForTimeout(c.ms)}finally{await page.keyboard.up(c.key)}}
        else if(c.action==='rotate')await rotate(c.delta)
        else if(c.action==='click')await page.mouse.click(c.x,c.y,c.options)
        else if(c.action==='move')await page.mouse.move(c.x,c.y)
        else if(c.action==='wait')await page.waitForTimeout(c.ms)
        else if(c.action==='read')extra.push(await page.evaluate(c.expression))
        else if(c.action==='until')await until(c.expression,c.timeout)
        else if(c.action==='checkpoint')await checkpoint()
        else if(c.action==='mark'){const s=await snap(`milestone-${c.name}`);marks.push({name:c.name,at:s.at,turn:s.turn});writeFileSync(resolve(output,'milestones.json'),JSON.stringify(marks,null,2))}
        else if(c.action==='finish'){writeFileSync(resolve(output,`extra-${i}.json`),JSON.stringify(extra,null,2));await snap('final');assert.equal(failures.length,0,`Failed commands retained: ${JSON.stringify(failures)}`);return {input,completed:true,marks,final:await state()}}
        else throw Error('Unknown action '+c.action)
      }
      writeFileSync(resolve(output,`extra-${i}.json`),JSON.stringify(extra,null,2));await snap(String(i).padStart(3,'0'))
    }catch(e){
      writeFileSync(resolve(output,`extra-${i}.json`),JSON.stringify(extra,null,2))
      failures.push({command:i,error:e.stack});writeFileSync(resolve(output,'command-failures.json'),JSON.stringify(failures,null,2));writeFileSync(resolve(output,`error-${i}.txt`),e.stack)
      await pause().catch(()=>{});await snap(String(i).padStart(3,'0')+'-failed');console.error('command failed',i,e.message)
      if(commands.some(c=>c.action==='finish'))throw e
    }
  }
}
