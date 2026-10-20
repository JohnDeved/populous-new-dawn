import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { effectPixels } from '../browser-game.mjs'

// Explicit supplied stock/person fixture; casting still uses the shipped hotkey and click.
export default async function ({ page, output, openMission }) {
  await openMission(1)
  await page.evaluate(async () => {
    const s = window.testScene, w = s.world,
      { addUnit } = await import('/app/model.ts'),
      { changeLivePersonState, createLivePerson } = await import('/app/live-people.ts'),
      { release, clearRetiredPersonOrders } = await import('/app/world-tasks.ts'),
      { deleteCellObject } = await import('/app/object-cells.ts'),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 6, z: 30, path: [], casting: null })
    // Supplied isolated cast fixture: retire other people through their ownership
    // cleanup before removing them. Dropping units alone leaves stale order refs.
    for (const unit of w.units) {
      if (unit === shaman) continue
      const people = new Set([unit.native, unit.flight, unit.fight?.motion, unit.entry?.person, unit.builder?.person])
      people.add(release(w, unit))
      clearRetiredPersonOrders(w, people)
      deleteCellObject(w.objectCells, unit.id)
    }
    w.units = [shaman]
    const victim = addUnit(w, 'red', 'brave', { x: 13, z: 31 })
    victim.native = createLivePerson(w, victim)
    changeLivePersonState(w, victim, 14)
    window.swampVictim = victim
    w.selected = [shaman.id]
    w.shots.swamp = 1
    w.castingTribes[0].cooldown = 0
    w.manaWorld.gameFlags = 0
    w.speed = 0
    s.focus({ x: 12, z: 31 })
    s.onChange()
  })
  await page.keyboard.press('6')
  const point = await page.evaluate(() => {
    const s = window.testScene, p = s.screen({ x: 12, z: 31 }), r = s.container.getBoundingClientRect()
    return { x: r.left + (p.x + 1) * r.width / 2, y: r.top + (1 - p.y) * r.height / 2 }
  })
  await page.mouse.click(point.x, point.y)
  const initial = await page.evaluate(async () => {
    const s = window.testScene, w = s.world,
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'swamp') throw Error('UI click did not cast Swamp')
    cancelAnimationFrame(s.frame)
    w.paused = true
    w.speed = 1
    w.pendingTime = 0
    s.gameClock.animationTime = 0
    window.swampStep = () => {
      w.paused = false
      advanceGame(w, s.gameClock, 1 / 12)
      w.paused = true
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    }
    for (let i = 0; !w.effects.some(f => f.swamp) && i < 64; i++) window.swampStep()
    const fx = w.effects.find(f => f.swamp)
    if (!fx) throw Error('No Swamp arrival')
    window.swampId = fx.id
    for (let i = 0; w.units.includes(window.swampVictim) && i < 8; i++) window.swampStep()
    s.focus(fx)
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    return {
      id: fx.id, kills: fx.swamp.kills, credit: w.killCredits[0][1],
      remaining: fx.swamp.remaining, variant: fx.swamp.variant,
      layers: s.fxMeshes.get(fx.id).children.length,
      position: s.fxMeshes.get(fx.id).position.toArray(),
      anchor: fx.swamp.center,
      clock: w.secondaryEffects.animationFrame,
    }
  })
  assert.equal(initial.kills, 1)
  assert.equal(initial.credit, 1)
  await page.waitForFunction(() => {
    const s = window.testScene, group = s.fxMeshes.get(window.swampId)
    return group.children.every(child => !child.material?.map || child.material.map.image?.complete)
  })
  await page.evaluate(() => { window.testScene.animate(window.testScene.previous); cancelAnimationFrame(window.testScene.frame) })
  const pixels = await effectPixels(page, [initial.id])
  assert.ok(pixels > 20, `Swamp must contribute pixels: ${pixels}`)
  await page.evaluate(() => { window.testScene.animate(window.testScene.previous); cancelAnimationFrame(window.testScene.frame) })
  await page.screenshot({ path: `${output}/swamp-a.png` })
  const animation = await page.evaluate(() => {
    const s = window.testScene, group = s.fxMeshes.get(window.swampId),
      gl = s.renderer.getContext(),
      capture = () => {
        s.view.painter.render(s.renderer, s.scene, s.camera)
        const data = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, data)
        return data
      },
      read = () => group.children.map(child => ({
        visible: child.visible, source: child.userData.source,
        position: child.position.toArray(), size: child.scale.toArray(),
      })),
      before = read(), beforePixels = capture()
    group.visible = false
    const beforeHidden = capture()
    group.visible = true
    // Change only presentation time for the pixel comparison: no world turn,
    // camera motion, corpse animation, or water update can explain this delta.
    const clock = s.world.secondaryEffects.animationFrame
    s.world.secondaryEffects.animationFrame++
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    const afterPixels = capture()
    group.visible = false
    const afterHidden = capture()
    group.visible = true
    let changedPixels = 0
    for (let i = 0; i < beforePixels.length; i += 4) {
      const contributionChanged = [0, 1, 2].some(c =>
        beforePixels[i + c] - beforeHidden[i + c] !== afterPixels[i + c] - afterHidden[i + c])
      if (contributionChanged) changedPixels++
    }
    s.world.secondaryEffects.animationFrame = clock
    window.swampStep()
    return { before, after: read(), changedPixels }
  })
  await page.screenshot({ path: `${output}/swamp-b.png` })
  const paused = await page.evaluate(() => {
    const s = window.testScene, before = JSON.parse(JSON.stringify(s.world)),
      snapshot = () => JSON.stringify({
        swamp: s.world.effects.find(f => f.id === window.swampId).swamp,
        turn: s.world.turn, randomState: s.world.randomState,
        animationFrame: s.world.secondaryEffects.animationFrame,
      }),
      swampBefore = snapshot()
    s.animate(s.previous + 3000)
    cancelAnimationFrame(s.frame)
    return {
      preserved: swampBefore === snapshot(),
      changedWorldKeys: Object.keys(before).filter(key => JSON.stringify(before[key]) !== JSON.stringify(s.world[key])),
    }
  })
  assert.ok(paused.preserved, 'Paused render must preserve Swamp, animation clock, turn and RNG')
  if (initial.layers === 14) {
    assert.ok(animation.changedPixels > 0, 'Advancing only Swamp presentation time must change rendered pixels')
    assert.notDeepEqual(animation.before.slice(0, 9).map(s => s.source), animation.after.slice(0, 9).map(s => s.source))
    assert.deepEqual(animation.before.slice(9), animation.after.slice(9))
  }
  const result = { fixture: 'Supplied stock and one victim, public hotkey/click; actual projectile, scan, kill and render', initial, pixels, animation, paused }
  if (initial.layers === 14) {
    result.killCleanup = await page.evaluate(async () => {
      const s = window.testScene, w = s.world,
        { addUnit } = await import('/app/model.ts'),
        { createLivePerson, changeLivePersonState } = await import('/app/live-people.ts'),
        fx = w.effects.find(f => f.id === window.swampId)
      for (let i = 0; i < 9; i++) {
        const victim = addUnit(w, 'red', 'brave', fx)
        victim.native = createLivePerson(w, victim)
        changeLivePersonState(w, victim, 14)
      }
      for (let i = 0; w.effects.includes(fx) && i < 8; i++) window.swampStep()
      return {
        kills: fx.swamp.kills, credit: w.killCredits[0][1], remaining: fx.swamp.remaining,
        effectRemoved: !w.effects.includes(fx), meshRemoved: !s.fxMeshes.has(fx.id),
        center: fx.swamp.center, x: fx.x, z: fx.z,
      }
    })
    assert.equal(result.killCleanup.kills, 10)
    assert.equal(result.killCleanup.credit, 10)
    assert.ok(result.killCleanup.effectRemoved && result.killCleanup.meshRemoved)
    assert.ok(result.killCleanup.remaining > 0, 'Retire from real kill accounting, not timer injection')
    await page.screenshot({ path: `${output}/swamp-ten-kills.png` })
    result.multiple = await page.evaluate(async point => {
      const s = window.testScene, w = s.world,
        { effect, browserPosition } = await import('/app/model.ts'),
        { createSwamp } = await import('/app/swamp.ts'), ids = []
      for (let variant = 0; variant < 4; variant++) {
        const center = { ...point.center, x: (point.center.x + variant * 128) & 65535 },
          fx = effect(w, 'swamp', browserPosition(center))
        fx.swamp = { ...createSwamp(center, 0, variant, w), variant }
        fx.height = center.h / 45
        fx.duration = Infinity
        ids.push(fx.id)
      }
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      window.swampVariantIds = ids
      window.swampSnapshot = () => {
        const s = window.testSceneRef.current, w = s.world
        return {
          clock: w.secondaryEffects.animationFrame,
          randomState: w.randomState,
          effects: ids.map(id => {
            const f = w.effects.find(f => f.id === id), g = s.fxMeshes.get(id)
            return {
              id, state: structuredClone(f.swamp),
              sprites: g.children.map(c => ({ source: c.userData.source, visible: c.visible, p: c.position.toArray(), scale: c.scale.toArray() })),
            }
          }),
        }
      }
      return window.swampSnapshot()
    }, result.killCleanup)
    assert.equal(result.multiple.effects.length, 4)
    assert.ok(result.multiple.effects.every(f => f.sprites.length === 14 && f.sprites.some(s => s.visible)))
    await page.screenshot({ path: `${output}/swamp-four-variants.png` })
    result.rotated = await page.evaluate(() => {
      const s = window.testScene, bearing = s.cameraBearing
      s.cameraBearing += Math.PI / 2
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      return { bearing, rotatedBearing: s.cameraBearing, snapshot: window.swampSnapshot() }
    })
    const anchors = snapshot => snapshot.effects.map(f => ({
      id: f.id, state: f.state, sprites: f.sprites.map(({ source, visible, p }) => ({ source, visible, p })),
    }))
    assert.notEqual(result.rotated.bearing, result.rotated.rotatedBearing)
    assert.deepEqual(anchors(result.rotated.snapshot), anchors(result.multiple), 'Camera rotation must preserve world anchors and variants')
    await page.screenshot({ path: `${output}/swamp-rotated.png` })
    await page.evaluate(bearing => {
      const s = window.testScene
      s.cameraBearing = bearing
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    }, result.rotated.bearing)
    await page.evaluate(async () => {
      await window.testStore.saveCheckpoint()
      if (!window.testStore.loadCheckpoint()) throw Error('Current Save/Load rejected')
    })
    await page.waitForFunction(() => window.testSceneRef.current?.world === window.testStore.getWorld())
    result.loaded = await page.evaluate(() => {
      window.testScene = window.testSceneRef.current
      const s = window.testScene
      cancelAnimationFrame(s.frame)
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      return window.swampSnapshot()
    })
    assert.deepEqual(result.loaded, result.multiple, 'Current checkpoint must restore exact Swamp art/state/clock/RNG')
    await page.screenshot({ path: `${output}/swamp-loaded.png` })
    // Preserve full lifetimes: no remaining/kill/expiry writes. Drive normal world turns
    // without rendering every intermediate frame.
    await page.evaluate(() => {
      window.expiringSwamps = window.swampVariantIds.map(id => window.testScene.world.effects.find(f => f.id === id))
    })
    for (let batch = 0; batch < 32; batch++) {
      const progress = await page.evaluate(async () => {
        const s = window.testScene, w = s.world, { advanceGame } = await import('/app/game-clock.ts')
        w.paused = false
        for (let i = 0; i < 1000; i++) advanceGame(w, s.gameClock, 1 / 12)
        w.paused = true
        return window.expiringSwamps.map(f => ({ remaining: f.swamp.remaining, kills: f.swamp.kills, alive: w.effects.includes(f) }))
      })
      if (batch % 8 === 7) console.log(JSON.stringify({ swampLifetimeVisits: (batch + 1) * 1000, progress }))
    }
    result.expiry = await page.evaluate(() => {
      const s = window.testScene
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
      return window.expiringSwamps.map(f => ({
        remaining: f.swamp.remaining, kills: f.swamp.kills,
        effectRemoved: !s.world.effects.includes(f), meshRemoved: !s.fxMeshes.has(f.id),
      }))
    })
    assert.ok(result.expiry.every(f => f.remaining === 0 && f.effectRemoved && f.meshRemoved),
      `All four full-lifetime controllers must naturally expire: ${JSON.stringify(result.expiry)}`)
    await page.screenshot({ path: `${output}/swamp-expired.png` })
  }
  writeFileSync(`${output}/swamp.json`, JSON.stringify(result, null, 2) + '\n')
  return result
}
