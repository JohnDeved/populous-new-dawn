// Public Mission3 entry, ordinary gameplay commands and diagnostic fixed turns.
// No successful people, tasks, territory, schools or outcome are injected.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseOptions, runLocalBrowser } from './local-render/harness.mjs'

const options = parseOptions(process.argv.slice(2))
const before = options.scenario === 'before'
const captureTurn = Number(process.env.PND_DEFENSE_CAPTURE_TURN ?? 0)
if (before) assert.ok(captureTurn > 0, 'before capture needs the verified candidate turn')
const receipt = await runLocalBrowser(options, async ({ page, openMission, output, receipt }) => {
  await openMission(3)
  const selected = await page.evaluate(async ({ before, captureTurn }) => {
    const scene = window.testScene, w = scene.world
    cancelAnimationFrame(scene.frame)
    const { tick, command, setSelection, select, placeBuilding } = await import('/app/model.ts')
    const require = (condition, message) => { if (!condition) throw Error(message) }
    const until = (predicate, limit = 12000) => {
      while (w.turn < limit && !predicate() && w.status === 'playing') tick(w, 1 / 12)
      require(predicate(), `Natural Mission3 condition missing at turn${w.turn}`)
    }
    require(w.turn <= 256, 'public entry missed the fixed command-start turn')
    while (w.turn < 256) tick(w, 1 / 12)
    const start = w.turn, shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    setSelection(w, [shaman.id])
    require(command(w, w.shrines.find(s => s.kind === 'vault')), 'Vault command failed')
    until(() => w.unlockedTemple)
    setSelection(w, [shaman.id])
    require(command(w, { x: 35, z: 81 }), 'Shaman return failed')
    select(w, 'brave')
    require(placeBuilding(w, 'temple', { x: 24, z: 70 }), 'Temple placement failed')
    const temple = w.buildings.findLast(b => b.team === 'blue' && b.kind === 'temple')
    until(() => temple.progress === 1)
    const brave = w.units.find(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0 && u.inside === null)
    setSelection(w, [brave.id])
    require(command(w, temple), 'Preacher training command failed')
    until(() => w.units.some(u => u.team === 'blue' && u.kind === 'preacher'))
    const preacher = w.units.find(u => u.team === 'blue' && u.kind === 'preacher')
    setSelection(w, [preacher.id])
    require(command(w, { x: -17, z: -108 }), 'Preacher intrusion command failed')
    const intrusionTurn = w.turn
    let task, defender
    if (before) {
      require(w.turn <= captureTurn, 'before journey passed requested capture turn')
      while (w.turn < captureTurn) tick(w, 1 / 12)
      require(!w.ai.tasks.some(t => t.flags & 1 && t.type === 8), 'base unexpectedly has defense')
    } else {
      until(() => !!(task = w.ai.tasks.find(t => t.flags & 1 && t.type === 8 && t.selected)), 7000)
      const slot = w.ai.tasks.indexOf(task)
      defender = w.units.find(u => u.team === 'yellow' && u.native?.computerAssignment === slot + 1)
      require(defender?.native?.state === 14 && defender.kind === 'preacher', 'missing natural selected defender')
      require(task.entity === preacher.id, 'defense target is not the natural intruder')
      window.defenseSlot = slot
      window.defenderId = defender.id
    }
    scene.focus({ x: -17, z: -108 })
    window.testStore.update()
    scene.animate(scene.previous)
    cancelAnimationFrame(scene.frame)
    const gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    let pixels = null
    if (defender) {
      const group = scene.unitMeshes.get(defender.id)
      require(group && !gl.isContextLost(), 'defender has no rendered mesh')
      const a = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4), b = new Uint8Array(a.length)
      scene.renderer.render(scene.scene, scene.camera)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, a)
      const visible = group.visible
      group.visible = false
      scene.renderer.render(scene.scene, scene.camera)
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, b)
      group.visible = visible
      scene.renderer.render(scene.scene, scene.camera)
      pixels = 0
      for (let i = 0; i < a.length; i += 4)
        if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) pixels++
      require(pixels > 0, 'defender mesh contributes no pixels')
    }
    return { turn: w.turn, commandStart: start, intrusionTurn, player: { id: preacher.id, hp: preacher.hp, x: preacher.x, z: preacher.z },
      defender: defender && { id: defender.id, x: defender.x, z: defender.z, state: defender.native.state },
      task: task && { phase: task.phase, selected: task.selected, target: task.entity, defense: task.defense },
      pixels, renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      contextLost: gl.isContextLost(), status: w.status }
  }, { before, captureTurn })
  assert.equal(selected.status, 'playing')
  assert.equal(selected.contextLost, false)
  await page.screenshot({ path: resolve(output, before ? 'before-defense.png' : 'defender-selected.png') })
  let moved
  if (!before) {
    moved = await page.evaluate(async () => {
      const scene = window.testScene, w = scene.world
      const { tick } = await import('/app/model.ts')
      const { currentPersonOrder } = await import('/app/person-orders.ts')
      const { migrateCheckpoint } = await import('/app/game-store.ts')
      const restored = migrateCheckpoint(structuredClone(w)), defender = w.units.find(u => u.id === window.defenderId),
        start = { x: defender.x, z: defender.z }, task = w.ai.tasks[window.defenseSlot]
      let ordered = false, moved = false
      for (let i = 0; i < 120; i++) {
        tick(w, 1 / 12)
        tick(restored, 1 / 12)
        if (JSON.stringify(restored.ai) !== JSON.stringify(w.ai) || restored.randomState !== w.randomState)
          throw Error('Checkpoint AI/RNG diverged')
        const person = defender.native ?? defender.fight?.motion ?? defender.entry?.person,
          order = person && currentPersonOrder(w.buildingOrders, person)
        if (order?.model === 3 && task.phase === 6) ordered = true
        if (defender.x !== start.x || defender.z !== start.z) moved = true
      }
      if (!ordered || !moved) throw Error('Defender failed to issue original movement and move')
      scene.focus({ x: -17, z: -108 })
      window.testStore.update()
      scene.animate(scene.previous)
      cancelAnimationFrame(scene.frame)
      return { turn: w.turn, ordered, moved, checkpoint: true, x: defender.x, z: defender.z, rng: w.randomState }
    })
    await page.screenshot({ path: resolve(output, 'defender-moving.png') })
  }
  assert.deepEqual(receipt.errors, [])
  const result = { comparison: before ? 'exact-base before' : 'candidate after', selected, moved,
    limits: 'Public mission entry then diagnostic fixed-turn ordinary model commands and camera focus; software WebGL, no injected success, no original-frame or hardware/FPS claim. Checkpoint migration/continuation is diagnostic, not a fresh-page storage test.' }
  writeFileSync(resolve(output, 'defense.json'), JSON.stringify(result, null, 2) + '\n')
  return result
})
console.log(JSON.stringify({ status: receipt.status, commit: receipt.source.commit, result: receipt.result }, null, 2))
