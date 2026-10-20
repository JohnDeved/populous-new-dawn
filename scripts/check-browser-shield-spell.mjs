import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
import artwork from '../app/original-shield.json' with { type: 'json' }

// Supporting supplied-stock/population fixture, not ordinary earned acquisition.
const browser = await chromium.launch({ headless: true })
try {
  const { page, errors } = await openGame(browser)
  await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { addUnit } = await import('/app/model.ts'),
      shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
    Object.assign(shaman, { x: 0, z: 0, path: [], casting: null })
    w.units = [shaman]
    for (let i = 0; i < 7; i++) addUnit(w, 'blue', 'brave', { x: 2 + i / 10, z: 0 })
    addUnit(w, 'red', 'brave', { x: 2, z: 0 })
    w.selected = [shaman.id]
    w.shots.shield = 1
    w.castingTribes[0].cooldown = 0
    w.speed = 0
    s.focus({ x: 2, z: 0 })
    s.onChange()
  })
  await page.waitForSelector('[aria-label="Magical Shield, 1 shots"]')
  await page.keyboard.press('0')
  const point = await page.evaluate(() => {
    const s = window.testScene,
      p = s.screen({ x: 2, z: 0 }),
      r = s.container.getBoundingClientRect()
    return { x: r.left + ((p.x + 1) * r.width) / 2, y: r.top + ((1 - p.y) * r.height) / 2 }
  })
  await page.mouse.click(point.x, point.y)

  const result = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { advanceGame } = await import('/app/game-clock.ts')
    if (w.projectiles[0]?.spell !== 'shield') throw Error('UI click did not cast Shield')
    cancelAnimationFrame(s.frame)
    w.paused = true
    w.speed = 1
    const step = () => {
      w.paused = false
      advanceGame(w, s.gameClock, 1 / 12)
      w.paused = true
      s.animate(s.previous)
      cancelAnimationFrame(s.frame)
    }
    for (let i = 0; !w.units.some(u => u.shield) && i < 120; i++) step()
    const { loadTexture } = await import('/app/scene-assets.ts')
    if (!(await loadTexture('shield').ready)) throw Error('Original Shield atlas did not load')
    s.animate(s.previous)
    cancelAnimationFrame(s.frame)
    const shielded = w.units.filter(u => u.shield)
    return {
      shots: w.shots.shield,
      count: shielded.length,
      kinds: shielded.map(u => u.kind),
      animationFrame: s.gameClock.animationFrame,
      overlays: shielded.map(unit => {
        const group = s.unitMeshes.get(unit.id),
          sprites = group?.userData.shield
        return {
          id: unit.id,
          owner: group?.userData.owner,
          visible: group?.visible ?? false,
          pieces: Array.isArray(sprites)
            ? sprites.map(sprite => ({
                visible: sprite.visible,
                isSprite: !!sprite.isSprite,
                source: sprite.userData.source,
                texture:
                  sprite.material.map?.image?.currentSrc || sprite.material.map?.image?.src || '',
                uv: sprite.userData.atlasTransform?.toArray(),
                color: sprite.material.color.getHex(),
                opacity: sprite.material.opacity,
              }))
            : [],
        }
      }),
      flags: shielded.map(u => u.native?.flags3 ?? 0),
    }
  })
  assert.equal(result.shots, 0)
  assert.equal(result.count, 6)
  assert.deepEqual(result.kinds, Array(6).fill('brave'))
  // 00469021 tests flags3 bit0x8000, not Bloodlust's separate bit0x80000.
  assert.ok(result.flags.every(flags => flags & 0x8000))
  for (const overlay of result.overlays) {
    assert.equal(overlay.visible, true)
    assert.equal(overlay.pieces.length, 3)
    for (let piece = 0; piece < 3; piece++) {
      const observed = overlay.pieces[piece],
        phase = (overlay.id + result.animationFrame - piece) & 15,
        source = artwork.phases[phase].source + piece * 5,
        frame = artwork.frames[source - 1538]
      assert.equal(observed.visible, true)
      assert.equal(observed.isSprite, true, 'Shield uses original sprites, not a sphere')
      assert.equal(observed.source, source)
      assert.match(observed.texture, /\/original\/shield\.png(?:[?#].*)?$/)
      assert.deepEqual(observed.uv, [32 / 512, 1, frame.x / 512, 0])
      assert.equal(observed.color, [0x333fcb, 0xff4b16, 0xdf9b1f, 0x2fab63][overlay.owner])
      assert.equal(observed.opacity, 1)
    }
  }
  const cleanup = await page.evaluate(async () => {
    const s = window.testScene,
      w = s.world,
      { stepUnitShields } = await import('/app/model.ts'),
      units = w.units.filter(unit => unit.shield),
      ids = new Set(units.map(unit => unit.id)),
      groups = units.map(unit => s.unitMeshes.get(unit.id))
    let disposed = 0,
      atlasDisposed = 0
    const atlases = new Set()
    for (const group of groups)
      for (const sprite of group.userData.shield) {
        sprite.material.addEventListener('dispose', () => disposed++)
        atlases.add(sprite.material.map)
      }
    for (const atlas of atlases) atlas.addEventListener('dispose', () => atlasDisposed++)
    // Controlled last-turn/removed-person diagnostics, not a native lifetime proof.
    for (const unit of units) unit.shield = 1
    stepUnitShields(w)
    s.updateUnitsFrame()
    const hidden = groups.every(group => group.userData.shield.every(sprite => !sprite.visible))
    w.units = w.units.filter(unit => !ids.has(unit.id))
    s.updateUnitsFrame()
    return { hidden, removed: [...ids].every(id => !s.unitMeshes.has(id)), disposed, atlasDisposed }
  })
  assert.deepEqual(cleanup, { hidden: true, removed: true, disposed: 18, atlasDisposed: 0 })
  assert.deepEqual(errors, [])
  console.log(
    'PASS: supplied-stock UI Shield cast draws three original tinted sprites per follower and releases their materials'
  )
} finally {
  await browser.close()
}
