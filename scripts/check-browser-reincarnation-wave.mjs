// Natural Mission2 combat death and complete ordinary reincarnation, followed
// by a separately labeled staged cell-consumer fixture. No state injection in
// the natural phase; pacing, camera and read-only observations are controlled.
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'
import { bindGame, showAllMissions, effectPixels } from './browser-game.mjs'

const output = resolve(process.env.POPULOUS_ARTIFACT_DIR ?? `work/orchestration/reincarnation-wave-browser-${process.pid}`)
const baseline = process.argv.includes('--baseline')
mkdirSync(output, { recursive: true })
const report = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  baseline,
  stages: [],
  limits: 'Linux headless rendering is not hardware performance evidence. Natural combat uses the existing command adapter; it does not certify pointer picking. Staged intrusion is separate from natural death/spawn acceptance.',
}
const executablePath = process.env.POPULOUS_HEADLESS_SHELL
const browser = await chromium.launch(executablePath ? {
  executablePath, headless: true, chromiumSandbox: true,
  ignoreDefaultArgs: true, args: ['--remote-debugging-pipe'],
} : { headless: true })
let page
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.stack ?? error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.setDefaultTimeout(60000)
  await page.addInitScript(() => { window.requestAnimationFrame = () => 0 })
  await page.goto(process.env.POPULOUS_URL ?? 'http://localhost:3000', { waitUntil: 'networkidle' })
  await showAllMissions(page)
  await page.getByRole('button', { name: 'Mission 2', exact: true }).click()
  await bindGame(page)
  await page.evaluate(() => {
    const s = window.testScene
    for (let i = 0; s.world.turn < 16 && i < 100; i++) s.animate(s.previous + 1000 / 24)
  })
  const skip = page.getByRole('button', { name: /Skip introduction/i })
  if (await skip.isVisible()) await skip.click()
  await page.evaluate(async () => {
    const s = window.testScene
    for (let i = 0; s.world.turn < 80 && i < 400; i++) s.animate(s.previous + 1000 / 24)
    const { campaignShamanReadiness } = await import('/scripts/campaign-start-readiness.mjs')
    if (!campaignShamanReadiness(s.world).ready || s.world.inputMask) throw Error('Authored startup did not release Shaman controls')
    s.world.speed = 0
  })
  await page.locator('.world-viewport canvas.battlefield').focus()
  await page.keyboard.press('h')
  report.death = await page.evaluate(async () => {
    const s = window.testScene, w = s.world
    const { command, tick } = await import('/app/model.ts')
    const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    const target = w.units.find(u => u.id === 13)
    if (!w.selected.includes(shaman.id) || target?.kind !== 'warrior' || target.team === 'blue') throw Error('Authored Shaman/Warrior control setup failed')
    const before = { id: shaman.id, hp: shaman.hp, turn: w.turn }
    if (!command(w, target)) throw Error('Ordinary attack command was rejected')
    let fighting = 0, injured = false, body
    for (let i = 0; i < 2000 && w.status === 'playing'; i++) {
      tick(w, 1 / 12)
      fighting += Number(!!shaman.fight || shaman.fighting)
      injured ||= shaman.hp > 0 && shaman.hp < before.hp
      body = w.effects.find(f => f.reincarnation?.team === 'blue')
      if (body) break
    }
    if (!body || !injured || !fighting || w.units.includes(shaman)) throw Error('Ordinary combat did not produce one real Shaman death')
    return { before, turn: w.turn, fighting, injured, body: body.id, remaining: Math.round(w.respawns[0] * 12) }
  })
  report.stages.push('Shipped Mission2 setup, H selection and ordinary authored combat death')

  const drawAtSite = async () => {
    await page.evaluate(async () => {
      const s = window.testScene, { campaignPosition } = await import('/app/model.ts')
      s.focus(campaignPosition(s.world, 'blue'))
      for (let i = 0; i < 120; i++) s.updateCameraMotion(1 / 24)
      s.animate(s.previous)
    })
  }
  const advance = turns => page.evaluate(async turns => {
    const { tick } = await import('/app/model.ts')
    for (let i = 0; i < turns; i++) tick(window.testScene.world, 1 / 12)
    window.testScene.animate(window.testScene.previous)
  }, turns)
  const read = () => page.evaluate(() => {
    const s = window.testScene, w = s.world, fx = w.effects.find(f => f.reincarnationWave?.tribe === 0)
    return {
      turn: w.turn, remaining: Math.round(w.respawns[0] * 12), wave: fx?.reincarnationWave ?? null,
      shaman: w.units.find(u => u.team === 'blue' && u.kind === 'shaman')?.id ?? null,
      effects: w.effects.map(f => ({ id:f.id, kind:f.kind, sequence:f.sprite?.sequence })),
      sound158: w.sounds.filter(s => s.cue === 158).length,
      busy: w.castingTribes[0].flags & 1,
      status: w.status,
      controllerChildren: fx ? s.fxMeshes.get(fx.id)?.children.length : null,
    }
  })
  report.before = await page.evaluate(async () => {
    const w = window.testScene.world, { tick } = await import('/app/model.ts')
    let turns = 0
    while (Math.round(w.respawns[0] * 12) > 6 && turns++ < 470) tick(w, 1 / 12)
    if (Math.round(w.respawns[0] * 12) !== 6) throw Error('Natural body did not reach the site-wave producer boundary')
    return { turn:w.turn, randomState:w.randomState, nextId:w.nextId, sounds:w.sounds.filter(s => s.cue===158).length }
  })
  await drawAtSite()
  await page.screenshot({ path:`${output}/site-before.png` })
  await advance(1)
  report.allocated = await read()
  assert.equal(report.allocated.remaining, 5)
  if (baseline) {
    assert.equal(report.allocated.wave, null)
    assert.ok(report.allocated.effects.some(f => f.kind === 'birth'))
    await advance(4)
    await drawAtSite()
    await page.screenshot({ path:`${output}/site-during.png` })
    report.during = await read()
    report.stages.push('Baseline generic birth sprite captured at the same ordinary site boundary')
  } else {
    assert.equal(report.allocated.wave.visits, 0)
    assert.equal(report.allocated.wave.orbits.length, 0)
    assert.equal(report.allocated.sound158, report.before.sounds + 1)
    await advance(4)
    await drawAtSite()
    report.during = await read()
    assert.equal(report.during.wave.visits, 4)
    assert.equal(report.during.wave.mode, 2)
    assert.equal(report.during.wave.orbits.length, 32)
    assert.equal(report.during.controllerChildren, 0)
    const orbitIds = report.during.wave.orbits.map(orbit => orbit.id)
    report.orbitPixels = await effectPixels(page, orbitIds)
    assert.ok(report.orbitPixels > 0, 'native orbit sprites must contribute real framebuffer pixels')
    await page.screenshot({ path:`${output}/site-during.png` })
    report.paused = await page.evaluate(() => {
      const s = window.testScene, w = s.world
      const digest = () => JSON.stringify({ turn:w.turn, rng:w.randomState, nextId:w.nextId, respawns:w.respawns, sites:w.reincarnationSites, waves:w.effects.filter(f=>f.reincarnationWave) })
      const before = digest()
      for (let i = 0; i < 12; i++) s.animate(s.previous)
      return before === digest()
    })
    assert.equal(report.paused, true)
    const checkpoint = await page.evaluate(async () => {
      const w = window.testScene.world
      const digest = { turn:w.turn, rng:w.randomState, nextId:w.nextId, sites:w.reincarnationSites, wave:w.effects.find(f=>f.reincarnationWave).reincarnationWave, heights:Array.from(w.land.heights) }
      await window.testStore.saveCheckpoint()
      return digest
    })
    await page.reload({ waitUntil:'networkidle' })
    await page.getByRole('button', { name:'Load Game', exact:true }).click()
    await bindGame(page)
    report.checkpoint = await page.evaluate(() => {
      const w = window.testScene.world
      return { turn:w.turn, rng:w.randomState, nextId:w.nextId, sites:w.reincarnationSites, wave:w.effects.find(f=>f.reincarnationWave).reincarnationWave, heights:Array.from(w.land.heights) }
    })
    assert.deepEqual(report.checkpoint, checkpoint)
    delete report.checkpoint.heights
    await drawAtSite()
    await page.screenshot({ path:`${output}/site-checkpoint.png` })
    report.stages.push('Deferred first visit, 32 rendered orbits, invisible controller and fresh-page checkpoint continuity')
  }
  await advance(1)
  report.spawn = await read()
  assert.ok(report.spawn.shaman && report.spawn.shaman !== report.death.before.id)
  assert.equal(report.spawn.remaining, 0)
  if (!baseline) assert.equal(report.spawn.wave.visits, 5)
  await drawAtSite()
  await page.screenshot({ path:`${output}/site-respawn.png` })
  if (!baseline) {
    const waveId = report.spawn.wave.id, orbits = report.spawn.wave.orbits.map(o => o.id)
    report.cleanup = await page.evaluate(async ({waveId, orbits}) => {
      const s = window.testScene, w = s.world, { tick } = await import('/app/model.ts')
      let turns = 0
      while (w.effects.some(f=>f.id===waveId) && turns++ < 120) tick(w, 1/12)
      for (let i=0;i<6;i++) tick(w,1/12)
      s.animate(s.previous)
      return { turns, wave:w.effects.some(f=>f.id===waveId), orbits:w.effects.filter(f=>orbits.includes(f.id)).length, meshes:orbits.filter(id=>s.fxMeshes.has(id)).length, busy:w.castingTribes[0].flags&1 }
    }, {waveId, orbits})
    assert.equal(report.cleanup.wave, false)
    assert.equal(report.cleanup.orbits, 0)
    assert.equal(report.cleanup.meshes, 0)
    assert.equal(report.cleanup.busy, 0)
    report.stages.push('Successful ordinary Shaman respawn while the wave continues, then independent effect/light/mesh cleanup')
    // Distinct staged cell-consumer coverage after the natural path completed.
    report.intrusion = await page.evaluate(async () => {
      const s=window.testScene,w=s.world
      const {addUnit,browserPosition}=await import('/app/model.ts')
      const {createLivePerson,registerLivePerson}=await import('/app/live-people.ts')
      const {createReincarnationWave,stepReincarnationWave}=await import('/app/reincarnation-wave-runtime.ts')
      const center=w.reincarnationSites[0], rows=[]
      for(const [label,team,kind,flags] of [['enemy','green','brave',0],['protected','green','brave',0x100000],['friend','blue','brave',0],['wild','wild','brave',0],['shaman','green','shaman',0]]) {
        const u=addUnit(w,team,kind,browserPosition(center))
        u.native=createLivePerson(w,u);u.native.state=17;u.native.flags2=flags
        registerLivePerson(w,u.native)
        rows.push({label,u,before:u.hp})
      }
      const fx=createReincarnationWave(w,0)
      for(let i=0;i<3;i++)stepReincarnationWave(w,fx)
      s.animate(s.previous)
      return { staged:true, wave:fx.reincarnationWave, targets:rows.map(({label,u,before})=>({label,before,hp:u.hp,state:u.native.state,team:u.team})) }
    })
    const target = name => report.intrusion.targets.find(t => t.label === name)
    assert.equal(target('enemy').hp, target('enemy').before / 2)
    assert.equal(target('enemy').state, 26)
    assert.equal(target('protected').hp, 0)
    assert.equal(target('protected').state, 17)
    for (const name of ['friend','wild','shaman']) assert.equal(target(name).hp, target(name).before)
    await drawAtSite()
    await page.screenshot({ path:`${output}/site-intrusion.png` })
    for (const viewport of [{width:1024,height:768},{width:1920,height:1080}]) {
      await page.setViewportSize(viewport)
      await drawAtSite()
      assert.ok(await effectPixels(page, report.intrusion.wave.orbits.map(o=>o.id)) > 0)
      await page.screenshot({ path:`${output}/site-${viewport.width}.png` })
    }
    report.stages.push('Separate staged enemy/protected/friendly/Wildman/Shaman cell responses and rendered resize coverage')
  }
  report.renderer = await page.evaluate(() => {
    const gl=window.testScene.renderer.getContext(), debug=gl.getExtension('WEBGL_debug_renderer_info')
    return { version:gl.getParameter(gl.VERSION), renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER) }
  })
  assert.deepEqual(errors, [])
  report.errors = errors
  report.status = 'passed'
  writeFileSync(`${output}/report.json`, JSON.stringify(report,null,2)+'\n')
  console.log(JSON.stringify({status:'PASS_BROWSER_REINCARNATION_WAVE',commit:report.commit,baseline,output,stages:report.stages.length}))
} catch (error) {
  report.status='failed';report.error=error.stack??String(error)
  writeFileSync(`${output}/report.json`,JSON.stringify(report,null,2)+'\n')
  if(page)await page.screenshot({path:`${output}/failure.png`}).catch(()=>{})
  throw error
} finally {
  await browser.close()
}
