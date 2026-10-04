// Staged actors/readiness; real sermon producer and fixed-turn AI caller.
// This is bounded rendered integration, not ordinary campaign acquisition.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { effectPixels } from './browser-game.mjs'
import { waitForHudTexture } from './hud-texture-readiness.mjs'
import { parseOptions, runLocalBrowser } from './local-render/harness.mjs'

const options = parseOptions(process.argv.slice(2))
const before = options.scenario === 'before'
const captureTurn = Number(process.env.PND_PREACHER_CAPTURE_TURN ?? 0)
if (before) assert.ok(captureTurn >= 2 && captureTurn <= 97, 'Before capture requires the observed candidate turn')

const receipt = await runLocalBrowser(options, async ({ page, openMission, output, receipt }) => {
  await openMission(1)
  await waitForHudTexture(page)
  const cases = before ? [['blast', 44, 2, 'active']] : [
    ['blast', 44, 2, 'active'], ['swarm', 40, 5, 'active'], ['lightning', 8, 3, 'active'],
    ['blast', 44, 2, 'movement'], ['blast', 44, 2, 'invisible'],
  ]
  const results = []
  for (const [spell, available, model, mode] of cases) {
    const prepared = await page.evaluate(async ({ available, mode }) => {
      const scene = window.testScene, w = scene.world
      cancelAnimationFrame(scene.frame)
      const { HOME, addUnit, command, createWorld, nativePosition, setSelection,
        setUnitInvisibility, tick, unitAnimationSource } = await import('/app/model.ts')
      const { currentPersonOrder } = await import('/app/person-orders.ts')
      const require = (condition, message) => { if (!condition) throw Error(message) }
      // Keep the existing scene/store owner while resetting this explicitly staged world.
      Object.assign(w, createWorld())
      w.units = w.units.filter(u => u.kind === 'shaman')
      w.selected = []
      const preacher = addUnit(w, 'blue', 'preacher', { x: HOME.x + 2, z: HOME.z })
      const victim = addUnit(w, 'red', 'brave', { x: HOME.x + 3, z: HOME.z })
      for (let i = 0; i < 24 && !(preacher.native?.assignment & 64); i++) tick(w, 1 / 12)
      require(preacher.native?.assignment & 64, 'Live sermon did not produce assignment bit 64')
      require(currentPersonOrder(w.buildingOrders, preacher.native)?.model === 17, 'No active sermon command')
      require(unitAnimationSource(preacher) === preacher.native, 'Wrong live source owner')
      require(victim.native?.state === 23 && victim.native.workTarget === preacher.id, 'No owned listener')
      const producer = { turn: w.turn, assignment: preacher.native.assignment,
        order: 17, preacherId: preacher.id, listenerId: victim.id, listenerState: victim.native.state }
      const shaman = w.units.find(u => u.team === 'red' && u.kind === 'shaman')
      w.units = [shaman, preacher, victim]
      Object.assign(shaman, { x: preacher.x - 6, z: preacher.z, path: [], work: null })
      Object.assign(shaman.native, nativePosition(w, shaman))
      w.turn = 1
      w.ai.flags = 0
      w.ai.attributes[32] = 0
      w.ai.attributes[43] = 12
      w.ai.spellEntries = Array.from({ length: 8 }, (_, i) =>
        ({ model: i ? 0 : 2, mana: 0, people: 99, mode: 0, range: 0 }))
      w.manaTribes[1].mana = 120000
      Object.assign(w.manaWorld.spells[1], { available, disabled: 0 })
      w.manaWorld.spells[1].stocks.fill(0)
      w.castingTribes[1].cooldown = 0
      w.castingTribes[1].aiCooldown = 0
      Object.assign(w.spellScan, { cursor: 0, paused: 0, targets: [0, 0, 0, 0] })
      require(w.projectiles.length === 0, 'Preparation unexpectedly allocated a projectile')
      let cancelled = null
      if (mode === 'movement') {
        setSelection(w, [preacher.id])
        require(command(w, { x: preacher.x + 1, z: preacher.z + 1 }), 'Movement command rejected')
        cancelled = { assignment: preacher.native.assignment, listenerState: victim.native.state,
          listenerOwner: victim.native.workTarget, order: currentPersonOrder(w.buildingOrders, preacher.native)?.model }
        require(!(cancelled.assignment & 64) && cancelled.listenerState !== 23 &&
          cancelled.listenerOwner === 0 && cancelled.order === 3, 'Movement did not release the sermon')
      } else if (mode === 'invisible') setUnitInvisibility(w, preacher, 100)
      window.retaliationIds = { shaman: shaman.id, preacher: preacher.id, victim: victim.id }
      scene.focus({ x: preacher.x, z: preacher.z })
      w.paused = true
      window.testStore.update()
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
      const gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      return { producer, cancelled, renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        contextLost: gl.isContextLost(), canvas: [gl.drawingBufferWidth, gl.drawingBufferHeight] }
    }, { available, mode })
    assert.equal(prepared.contextLost, false)
    const dispatched = await page.evaluate(async () => {
      const scene = window.testScene, w = scene.world
      const { tick } = await import('/app/model.ts')
      w.paused = false
      tick(w, 1 / 12) // processTribes -> withCampaignTribe -> stepComputerSpells
      w.paused = true
      window.testStore.update()
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
      return { turn: w.turn, scan: w.spellScan.cursor, casts: [...w.spellCasts[1]],
        projectiles: w.projectiles.map(p => ({ id: p.id, spell: p.spell, caster: p.caster, target: p.target })) }
    })
    assert.equal(dispatched.turn, 2)
    assert.equal(dispatched.scan, 80)
    const expected = Number(!before && mode === 'active')
    assert.equal(dispatched.casts[model], expected)
    assert.equal(dispatched.casts.reduce((a, b) => a + b, 0), expected)
    assert.equal(dispatched.projectiles.length, expected)
    if (expected) assert.equal(dispatched.projectiles[0].spell, spell)
    let effect = null, pixels = 0
    if (expected || before) {
      effect = await page.evaluate(async ({ spell, before, captureTurn }) => {
        const scene = window.testScene, w = scene.world
        const { tick } = await import('/app/model.ts')
        const ready = () => w.effects.find(f => f.kind === spell &&
          (spell !== 'lightning' || f.lightning?.segments.length === 8) &&
          (spell !== 'swarm' || f.swarm?.applied))
        let fx = ready()
        for (let i = 0; i < 96 && (before ? w.turn < captureTurn : !fx); i++) {
          w.paused = false
          tick(w, 1 / 12)
          w.paused = true
          fx = ready()
        }
        if (!before && !fx) throw Error(`No real ${spell} effect by turn ${w.turn}`)
        if (before && (fx || w.spellCasts[1].some(Boolean))) throw Error('Base unexpectedly retaliated')
        window.testStore.update()
        scene.animate(scene.previous)
        cancelAnimationFrame(scene.frame)
        return { turn: w.turn, id: fx?.id ?? null, kind: fx?.kind ?? null,
          mesh: fx ? scene.fxMeshes.get(fx.id)?.name : null, casts: [...w.spellCasts[1]] }
      }, { spell, before, captureTurn })
      if (expected) {
        assert.ok(effect.id && effect.mesh, 'The real effect must have a scene mesh')
        await page.waitForFunction(id => {
          const group = window.testScene.fxMeshes.get(id)
          if (!group) return false
          let ready = true
          group.traverse(object => {
            const materials = Array.isArray(object.material) ? object.material : [object.material]
            for (const material of materials) {
              const image = material?.map?.image
              if (image instanceof HTMLImageElement && (!image.complete || !image.naturalWidth)) ready = false
            }
          })
          return ready
        }, effect.id)
        pixels = await effectPixels(page, [effect.id])
        assert.ok(pixels > 0, `${spell} must contribute actual GPU pixels`)
        // effectPixels restores visibility; restore the actual rendered framebuffer too.
        await page.evaluate(() => { const s = window.testScene; s.renderer.render(s.scene, s.camera) })
      } else assert.equal(effect.turn, captureTurn)
    }
    const screenshot = before ? 'before-retaliation.png' : `${spell}-${mode}.png`
    await page.screenshot({ path: resolve(output, screenshot) })
    results.push({ spell, mode, prepared, dispatched, effect, pixels, screenshot })
  }
  assert.deepEqual(receipt.errors, [])
  const result = { comparison: before ? 'exact-base before' : 'candidate after', results,
    limits: 'Explicit staged actors and readiness with real sermon production and actual fixed-turn AI dispatch; diagnostic ticks and camera focus, not natural acquisition or ordinary controls. Software WebGL only; no hardware FPS or original full-frame parity claim.' }
  writeFileSync(resolve(output, 'retaliation.json'), JSON.stringify(result, null, 2) + '\n')
  return result
})
console.log(JSON.stringify({ status: receipt.status, commit: receipt.source.commit, result: receipt.result }, null, 2))
