import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForShamanReadiness } from '../browser-game.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { assertTornadoBuildingCast } from './tornado-building-witness.mjs'

export async function finishTornadoBuildingRun({ observation, report, save, primaryError }) {
  const failures = []
  if (observation) {
    try { report.evidence = await observation.evaluate(api => api.finish()) }
    catch (error) { failures.push(error) }
    try { await observation.dispose() } catch (error) { failures.push(error) }
  }
  if (report.evidence?.errors.length || report.evidence && !report.evidence.restored || failures.length)
    report.status = 'failed'
  report.cleanupErrors = [...(report.cleanupErrors ?? []), ...failures.map(error => String(error?.stack ?? error))]
  try { save() } catch (error) {
    failures.push(error)
    report.status = 'failed'
    report.cleanupErrors.push(String(error?.stack ?? error))
  }
  return primaryError ?? failures[0] ?? null
}

// Shipped M2 entry, shrine55 bridge, head56 worship and one authored Camp target.
// Every action uses the maintained public input helper and the real RAF clock.
export default async function missionTwoTornadoBuilding({ page, openMission, output, signal, receipt }) {
  const report = { source: receipt.source, status: 'running', actions: [], windows: [],
    scope: 'One earned Mission2 Tornado building impact; no victory, native pool failure, pixel parity or hardware performance claim.' }
  const save = () => writeFileSync(resolve(output, 'mission2-tornado-building.json'),
    JSON.stringify(report, null, 2) + '\n')
  const deadlineAt = Date.now() + 12 * 60 * 1000
  let input, observation, shamanId, primaryError = null
  const read = () => page.evaluate(() => {
    const scene = window.testSceneRef.current, world = scene.world
    if (world !== window.testStore.getWorld()) throw Error('Scene/store ownership changed')
    const shaman = world.units.find(u => u.id === 54)
    const target = world.buildings.find(b => b.id === 1)
    return { turn: world.turn, status: world.status, paused: world.paused, speed: world.speed,
      inputMask: world.inputMask, level: world.outcome.level, selected: [...world.selected],
      stock: world.shots.tornado, gifts: world.giftCounts.tornado,
      animationFrame: scene.gameClock.animationFrame,
      shaman: shaman && { id: shaman.id, hp: shaman.hp, team: shaman.team, kind: shaman.kind,
        x: shaman.x, z: shaman.z, inside: shaman.inside },
      braves: world.units.filter(u => u.team === 'blue' && u.kind === 'brave' && u.hp > 0).map(u => u.id),
      bridgeEffects: world.effects.filter(f => f.bridge).map(f => f.id),
      heads: world.shrines.filter(s => [55, 56].includes(s.id)).map(s => ({ id: s.id,
        kind: s.kind, x: s.x, z: s.z, uses: s.uses, required: s.required,
        remaining: s.remaining, target: s.target, bridgeTarget: s.bridgeTarget,
        ordinarySpellReward: s.ordinarySpellReward })),
      target: target && { id: target.id, kind: target.kind, level: target.level, team: target.team,
        x: target.x, z: target.z, hp: target.hp, progress: target.progress,
        preparing: !!target.preparation, burning: !!target.burn, upgrading: !!target.upgrading },
    }
  })
  const healthy = state => {
    signal.throwIfAborted()
    assert.ok(Date.now() < deadlineAt, 'Declared twelve-minute route window expired')
    assert.deepEqual(receipt.errors, [])
    assert.equal(state.level, 2)
    assert.equal(state.status, 'playing')
    assert.equal(state.speed, 1)
    assert.equal(state.shaman?.id, shamanId)
    assert.equal(state.shaman?.team, 'blue')
    assert.equal(state.shaman?.kind, 'shaman')
    assert.ok(state.shaman?.hp > 0, 'Original Shaman must survive; no replacement route')
  }
  const wait = async (label, ready, milliseconds) => {
    const started = Date.now(), window = { label, startedAt: new Date().toISOString(), milliseconds }
    report.windows.push(window)
    let previousTurn, lastChanged = started
    for (;;) {
      const state = await read()
      healthy(state)
      assert.equal(state.paused, false)
      if (state.turn !== previousTurn) { previousTurn = state.turn; lastChanged = Date.now() }
      if (ready(state)) { window.final = state; save(); return state }
      assert.ok(Date.now() - started < milliseconds, `${label}: declared wait expired`)
      assert.ok(Date.now() - lastChanged < 30000, `${label}: real clock stopped advancing`)
      await page.waitForTimeout(250)
    }
  }
  const selectShaman = async () => {
    await input.action('clear-command-selection', () => page.keyboard.press('Escape'))
    await input.button('Select and focus shaman')
    const state = await read()
    healthy(state)
    assert.deepEqual(state.selected, [shamanId])
  }
  try {
    await openMission(2)
    report.readiness = await waitForShamanReadiness(page, { timeout: 60000 })
    shamanId = report.readiness.after.shaman.id
    assert.equal(shamanId, 54)
    report.initial = await read()
    healthy(report.initial)
    assert.equal(report.initial.stock, 0)
    const bridge = report.initial.heads.find(h => h.id === 55), head = report.initial.heads.find(h => h.id === 56)
    assert.deepEqual([bridge.kind, bridge.required, bridge.uses, bridge.target], ['bridgeEffect', 1, 0, 45])
    assert.deepEqual(bridge.bridgeTarget, { x: -61, z: -105 })
    assert.deepEqual([head.kind, head.required, head.remaining, head.uses, head.target], ['tornado', 2, 3, 0, 82])
    assert.deepEqual(head.ordinarySpellReward, { head: 63, reward: 62, slot: 0, model: 4 })
    assert.equal(report.initial.target?.kind, 'camp')
    assert.equal(report.initial.target?.team, 'green')
    input = createMission1VaultInput({ page, signal, report, save, originalShamanId: shamanId, deadlineAt })
    await selectShaman()
    await input.view(bridge)
    report.bridgeOrder = await input.clickEntity('shrines', bridge.id, 27, false, [shamanId])
    await wait('earned bridge begins', state => state.bridgeEffects.length > 0, 180000)
    report.bridgeComplete = await wait('earned bridge completes', state =>
      state.heads.find(h => h.id === 55).uses === 1 && !state.bridgeEffects.length, 60000)
    await selectShaman()
    await input.view(head)
    report.shamanHeadOrder = await input.clickEntity('shrines', head.id, 27, false, [shamanId])
    await wait('Shaman reaches Tornado head', state =>
      Math.hypot(state.shaman.x - head.x, state.shaman.z - head.z) < 4, 180000)
    await input.action('clear-Shaman-selection', () => page.keyboard.press('Escape'))
    await input.action('select-Brave-worshippers', () => page.getByRole('button',
      { name: 'Select brave', exact: true }).click({ modifiers: ['Control'] }))
    const worshippers = await read()
    healthy(worshippers)
    assert.ok(worshippers.selected.length >= head.required)
    assert.ok(worshippers.selected.every(id => worshippers.braves.includes(id)))
    await input.view(head)
    report.followerHeadOrder = await input.clickEntity('shrines', head.id, 27, false, worshippers.selected)
    report.earned = await wait('three ordinary Tornado gifts', state => state.stock === 3 &&
      state.heads.find(h => h.id === 56).uses === 3, 180000)

    await selectShaman()
    report.approach = await page.evaluate(async id => {
      const { findPath, supportsFollower } = await import('/app/model.ts')
      const world = structuredClone(window.testSceneRef.current.world)
      const shaman = world.units.find(u => u.id === id), target = world.buildings.find(b => b.id === 1)
      if (!shaman || !target || target.kind !== 'camp' || target.team !== 'green' || target.hp <= 0 ||
        target.preparation || target.burn || target.upgrading) throw Error('Current authored Camp1 is unavailable')
      const wrap = n => ((n + 128) % 256 + 256) % 256 - 128, candidates = []
      for (let index = 0; index < 16; index++) {
        const angle = index * Math.PI / 8, point = { x: wrap(target.x + Math.cos(angle) * 8),
          z: wrap(target.z + Math.sin(angle) * 8) }
        const supported = supportsFollower(world, point)
        const path = supported ? findPath(world, shaman, point) : []
        candidates.push({ index, point, supported, pathLength: path.length })
      }
      const chosen = candidates.filter(c => c.pathLength > 0).toSorted((a, b) => a.pathLength - b.pathLength)[0]
      if (!chosen) throw Error(`No ordinary Camp1 approach: ${JSON.stringify(candidates)}`)
      return { target: { id: target.id, kind: target.kind, level: target.level, team: target.team,
        hp: target.hp, progress: target.progress, x: target.x, z: target.z }, candidates, chosen }
    }, shamanId)
    save()
    await input.view(report.approach.chosen.point)
    report.move = await input.moveGround(report.approach.chosen.point)
    await wait('ordinary Camp approach', state => Math.hypot(
      state.shaman.x - report.approach.chosen.point.x,
      state.shaman.z - report.approach.chosen.point.z) < 2, 180000)
    await input.view(report.approach.target)
    await input.pause()
    await page.screenshot({ path: resolve(output, 'camp-before-tornado.png') })
    await page.evaluate(() => import('/scripts/local-render/tornado-building-witness.mjs'))
    observation = await page.evaluateHandle(async expected => {
      const { attachTornadoBuildingObservation } = await import('/scripts/local-render/tornado-building-witness.mjs')
      return attachTornadoBuildingObservation(window.testSceneRef.current, window.testStore,
        expected, () => window.testSceneRef.current)
    }, { targetId: 1, shamanId })
    await input.resume()
    await input.action('choose-Spells-panel', () => page.getByLabel(/spells/).click())
    await input.action('choose-earned-Tornado', () => page.getByRole('button', { name: /^Tornado, / }).click())
    report.cast = await input.clickEntity('buildings', 1, null, 'tornado')
    report.castTarget = assertTornadoBuildingCast(report.cast, shamanId)
    const impactStart = Date.now()
    for (;;) {
      signal.throwIfAborted()
      assert.ok(Date.now() < deadlineAt, 'Declared twelve-minute route window expired after cast')
      const status = await observation.evaluate(api => api.status())
      assert.deepEqual(status.errors, [])
      assert.deepEqual(status.cleanupErrors, [])
      if (status.projectileId !== null) assert.equal(status.projectileId, report.castTarget.projectileId)
      if (status.impacts) { report.impactStatus = status; break }
      assert.ok(!status.ended && status.visits < 320 && Date.now() - impactStart < 45000,
        'Ordinary Tornado ended without an attributable Camp impact')
      await page.waitForTimeout(100)
    }
    await input.pause()
    await page.screenshot({ path: resolve(output, 'camp-after-tornado.png') })
    report.status = 'passed'
  } catch (error) {
    primaryError = error
    report.status = 'failed'
    report.error = String(error?.stack ?? error)
    try { await page.screenshot({ path: resolve(output, 'tornado-route-failed.png') }) }
    catch (screenshotError) { report.cleanupErrors = [String(screenshotError?.stack ?? screenshotError)] }
  } finally {
    primaryError = await finishTornadoBuildingRun({ observation, report, save, primaryError })
  }
  if (primaryError) throw primaryError
  assert.equal(report.status, 'passed')
  assert.ok(report.evidence.impacts.length > 0)
  assert.deepEqual(report.evidence.errors, [])
  assert.deepEqual(report.evidence.cleanupErrors, [])
  assert.equal(report.evidence.restored, true)
}
