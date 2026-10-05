import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// Public controls and read-only snapshots. The game's RAF/callbacks are untouched.
export default async function ({ page, root, output, openMission, signal }) {
  const report = {
    scenarioSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
    method: 'Fresh Mission 1 public entry, real RAF and public pause/resume controls; independent read-only RAF observer. No world/tick/entity/camera/storage writes, original executable launch, or forced clock.',
    segments: [],
    limits: 'Sandboxed headless software WebGL functional timing observation. Observed frame transitions may skip under slow rendering. Not original wall-clock or hardware performance proof.',
  }
  const save = () => writeFileSync(resolve(output, 'sprite-observations.json'), JSON.stringify(report, null, 2) + '\n')
  await openMission(1)
  const { waitForShamanReadiness } = await import(pathToFileURL(resolve(root, 'scripts/browser-game.mjs')).href)
  report.readiness = await waitForShamanReadiness(page)
  report.environment = await page.evaluate(() => {
    const s = window.testSceneRef.current, gl = s.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info')
    return { userAgent: navigator.userAgent, viewport: [innerWidth, innerHeight], screen: [screen.width, screen.height], dpr: devicePixelRatio, rendererPixelRatio: s.renderer.getPixelRatio(), canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight], renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), speed: s.world.speed, paused: s.world.paused, level: s.world.outcome.level, sourceClock: 'app/game-clock.ts on current HEAD', timeOrigin: performance.timeOrigin }
  })
  assert.equal(report.environment.speed, 1)
  assert.equal(report.environment.paused, false)
  const observe = async (label, milliseconds) => {
    signal.throwIfAborted()
    const data = await page.evaluate(async ({ label, milliseconds }) => {
      const { unitAnimationSource, unitAnimation } = await import('/app/model.ts')
      const rows = [], start = performance.now()
      return await new Promise((resolve, reject) => {
        const sample = now => {
          try {
            const s = window.testSceneRef.current, w = s.world
            const units = w.units.filter(u => u.team === 'blue' && u.hp > 0).slice(0, 16).map(u => {
              const p = unitAnimationSource(u), mesh = s.unitMeshes.get(u.id), screen = s.screen(u)
              return { id: u.id, kind: u.kind, x: u.x, z: u.z, state: unitAnimation(w, u), native: p ? { object: p.object, draw: p.draw, f1: p.f1, f2: p.f2, state: p.state, commandStatus: p.commandStatus, renderFlags: p.renderFlags } : null, mesh: mesh ? { frame: mesh.userData.frame, draw: mesh.userData.draw, visible: mesh.visible, screen: [screen.x, screen.y] } : null }
            })
            const uv = sprite => sprite?.userData.atlasTransform?.toArray() ?? null
            const effects = w.effects.map(f => ({ id: f.id, kind: f.kind, age: f.age, animation: f.animation ? { object: f.animation.object, draw: f.animation.draw, f1: f.animation.f1, f2: f.animation.f2 } : null, displayedUv: s.fxMeshes.get(f.id)?.children.map(uv) ?? [] }))
            const smoke = w.secondaryEffects.slots.filter(e => e?.kind === 'hutRoot' || e?.kind === 'hutPuff').map(e => ({ ...e }))
            const displayedSmoke = [...s.buildingMeshes].flatMap(([id, group]) => {
              const state = group.userData.hutOccupancySmoke
              return state ? [{ id, kind: 'root', visible: state.group.visible, uv: uv(state.sprite), root: state.state.root ? {...state.state.root} : null }] : []
            }).concat([...(s.hutSmokePuffs ?? [])].map(([id, group])=>({id,kind:'puff',visible:group.visible,uv:uv(group.children[0])})))
            rows.push({ now, sceneNow: s.previous, turn: w.turn, time: w.time, speed: w.speed, paused: w.paused, animationFrame: s.gameClock.animationFrame, animationTime: s.gameClock.animationTime, smokeAnimationFrame: w.secondaryEffects.animationFrame, selected: [...w.selected], units, effects, smoke, displayedSmoke })
            if (performance.now() - start >= milliseconds) resolve({ label, requestedMs: milliseconds, rows })
            else requestAnimationFrame(sample)
          } catch (error) { reject(String(error)) }
        }
        requestAnimationFrame(sample)
      })
    }, { label, milliseconds })
    const first = data.rows[0], last = data.rows.at(-1), seconds = (last.sceneNow - first.sceneNow) / 1000
    data.summary = { samples: data.rows.length, elapsedSeconds: seconds, animationVisits: last.animationFrame - first.animationFrame, simulationTurns: last.turn - first.turn, gameTime: last.time - first.time, animationVisitsPerSecond: (last.animationFrame-first.animationFrame)/seconds, turnsPerSecond: (last.turn-first.turn)/seconds, frameTimesMs: data.rows.slice(1).map((row,i) => row.now-data.rows[i].now), nativeUnitSamples: data.rows.flatMap(row=>row.units).filter(u=>u.native).length, effectSamples: data.rows.reduce((n,row)=>n+row.effects.length,0), smokeSamples: data.rows.reduce((n,row)=>n+row.smoke.length,0) }
    report.segments.push(data)
    save()
    return data
  }
  await observe('normal-speed natural opening', 8000)
  await page.screenshot({ path: resolve(output, 'normal-speed-opening.png') })
  await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  const paused = await observe('public pause', 1500)
  assert.equal(paused.summary.animationVisits, 0)
  assert.equal(paused.summary.simulationTurns, 0)
  const pausedDisplay = row => ({ units: row.units.map(u=>({id:u.id,native:u.native,mesh:u.mesh})), effects: row.effects, displayedSmoke: row.displayedSmoke })
  assert.deepEqual(pausedDisplay(paused.rows.at(-1)), pausedDisplay(paused.rows[0]), 'Rendered frame/UV selections and native pose fields freeze while paused')
  await page.getByRole('button', { name: 'Resume game', exact: true }).click()
  await observe('public resume', 4000)
  await page.screenshot({ path: resolve(output, 'normal-speed-resumed.png') })
  save()
  return { environment: report.environment, summaries: report.segments.map(({label,summary}) => ({label,...summary,frameTimesMs:undefined})), artifact: 'sprite-observations.json', limits: report.limits }
}
