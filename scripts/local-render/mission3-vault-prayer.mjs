import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { waitForShamanReadiness } from '../browser-game.mjs'
import { createMission1VaultInput } from './mission1-vault-input.mjs'
import { assertVaultPrayerHealth, assertVaultVisible, assertVaultPrayerEpisode, assertVaultUninspectedCommand, assertVaultPanelAnchorBracket, vaultLowWorkLimit, vaultReleased } from './vault-prayer-contract.mjs'

// Fresh ordinary M3, without Temple construction or a fabricated saved state.
export default async function mission3VaultPrayer({ page, openMission, output, signal, receipt }) {
  assert.equal(receipt.profile?.mode, 'created')
  assert.equal(receipt.profile.checkpointAtStart, null)
  const deadline = Date.parse(receipt.startedAt) + 720000
  const report = { source: receipt.source, status: 'running', actions: [], stages: [], records: [], cleanupErrors: [],
    scope: 'One ordinary M3 automatic Vault panel interruption/reissue, earned reward/departure, and stage-time socket0-to-DOM anchor proof. No native timing, physical allocator, clickable-slot, matched historical pixel displacement or hardware-performance claim.' }
  const save = () => writeFileSync(resolve(output, 'mission3-vault-prayer.json'), JSON.stringify(report, null, 2) + '\n')
  let installed = false, shamanId, targetId, input, failure
  const admitted = () => { signal.throwIfAborted(); assert(Date.now() < deadline, 'Declared M3 Vault episode budget expired') }
  const read = async (anchor = false) => {
    admitted()
    const value = anchor ? await page.evaluate(async targetId => {
      const { readVaultPanelAnchor } = await import('/scripts/local-render/vault-panel-anchor.mjs')
      return { ...window.vaultPrayer.status(), anchor: readVaultPanelAnchor(window.testSceneRef.current, targetId) }
    }, targetId) : await page.evaluate(() => window.vaultPrayer.status())
    report.latest = value
    assert.deepEqual(value.errors, [])
    assert(!value.closed && !value.overflow)
    assertVaultPrayerHealth(value.current, shamanId)
    assert.deepEqual(receipt.errors, [])
    return value
  }
  const retain = async () => {
    const rows = await page.evaluate(start => window.vaultPrayer.range(start), report.records.length)
    report.records.push(...rows)
    save()
  }
  const stage = async name => {
    const entry = { name, before: await read(true) }
    report.stages.push(entry)
    await retain()
    // Preserve the partial stage and unaltered screenshot before its assertions.
    await page.screenshot({ path: resolve(output, `${name}.png`) })
    entry.after = await read(true)
    save()
    if (entry.before.current.dom.present)
      assertVaultPanelAnchorBracket(entry.before.anchor, entry.after.anchor)
    else assert.equal(entry.after.anchor.dom, null)
    return entry
  }
  const wait = async (name, duration, predicate) => {
    const end = Math.min(deadline, Date.now() + duration)
    let retainedAt = 0, changedAt = Date.now(), previous = null
    for (;;) {
      const value = await read(), now = Date.now()
      if (value.current.turn !== previous) { previous = value.current.turn; changedAt = now }
      if (now - retainedAt > 5000) { await retain(); retainedAt = now }
      if (predicate(value)) { report.actions.push({ label: name, current: value.current }); await retain(); return value }
      assert(now < end && now - changedAt < 30000, `${name}: time budget or ordinary clock stalled`)
      await page.waitForTimeout(100)
    }
  }
  try {
    await openMission(3)
    report.readiness = await waitForShamanReadiness(page, { timeout: 60000 })
    shamanId = report.readiness.after.shaman.id
    const route = await page.evaluate(async shamanId => {
      const [{ vaultPoints }, { browserPosition }, { installVaultPrayerWitness }, { readVaultPanelAnchor }] = await Promise.all([
        import('/app/vault-geometry.ts'), import('/app/world-coordinates.ts'), import('/scripts/local-render/vault-prayer-witness.mjs'),
        import('/scripts/local-render/vault-panel-anchor.mjs')])
      const world = window.testStore.getWorld(), heads = world.shrines.filter(s => s.kind === 'vault' && s.reward === 'temple')
      if (heads.length !== 1 || world.unlockedTemple || heads[0].uses !== 0) throw Error('Fresh authored M3 Vault required')
      const target = heads[0], points = vaultPoints(target)
      installVaultPrayerWitness({ targetId: target.id, shamanId })
      const initialAnchor = readVaultPanelAnchor(window.testSceneRef.current, target.id)
      return { target: { id: target.id, x: target.x, z: target.z }, points, initialAnchor,
        ground: browserPosition(points.leave), initial: window.vaultPrayer.status() }
    }, shamanId)
    installed = true
    report.route = route
    targetId = route.target.id
    input = createMission1VaultInput({ page, signal, report, save, originalShamanId: shamanId, deadlineAt: deadline })
    await input.action('clear-selection', () => page.keyboard.press('Escape'))
    await input.button('Select and focus shaman')
    await input.view(route.target)
    await input.prepareDispatch()
    // Both exact helper interfaces and the cancellation pixel are admitted before walking.
    report.ground = await input.fixedGround(route.ground)
    report.hit = await input.entityPoint('shrines', targetId, 33)
    save()
    assert.equal(report.ground.rejection, null, JSON.stringify(report.ground))
    assert.equal(report.ground.context.model, 3)
    assert.equal(report.ground.context.enabled, true)
    assert.equal(report.hit.rejection, null, JSON.stringify(report.hit))
    report.firstInput = await input.dispatch(report.hit, 33, [shamanId])
    await input.action('pointer-away-from-Vault', () => page.mouse.move(20, 975))
    await retain()
    assertVaultUninspectedCommand(report.records.findLast(row => row.kind === 'input'), targetId)
    await wait('first-automatic-visible', 420000, value => {
      const s = value.current
      return s.head.work > vaultLowWorkLimit(s.head.target) ||
        (s.record?.phase === 1 && s.head.work > 0 && (value.held[s.record.identity] ?? 0) >= 4 && !s.dom.hidden && s.offTarget)
    })
    const first = await stage('vault-first-automatic-panel')
    assertVaultVisible(first.before.current)
    assert(first.after.current.head.work <= vaultLowWorkLimit(first.after.current.head.target))
    await input.prepareDispatch()
    report.interruption = await input.dispatch(report.ground, 3, [shamanId])
    await input.action('pointer-away-after-interruption', () => page.mouse.move(20, 975))
    await wait('zero-count-and-expired-panel', 30000, value => value.current.head.followers === 0 && vaultReleased(value.current))
    await stage('vault-interrupted-panel-expired')
    // Re-resolve the rendered Vault against the unchanged real camera before input.
    report.reissue = await input.clickEntity('shrines', targetId, 33, false, [shamanId])
    await input.action('pointer-away-after-reissue', () => page.mouse.move(20, 975))
    await retain()
    assertVaultUninspectedCommand(report.records.findLast(row => row.kind === 'input'), targetId)
    await wait('recreated-automatic-panel', 60000, value => {
      const s = value.current
      return s.record?.phase === 1 && s.head.work > 0 && (value.held[s.record.identity] ?? 0) >= 4 && !s.dom.hidden && s.offTarget
    })
    const recreated = await stage('vault-recreated-automatic-panel')
    assertVaultVisible(recreated.before.current)
    await wait('earned-knowledge-and-original-departure', 420000, value => {
      const s = value.current
      return s.unlocked && s.head.uses === 1 && !s.head.active && !s.shaman.vault && s.shaman.order?.model !== 33 && vaultReleased(s)
    })
    await stage('vault-earned-knowledge-and-departure')
    report.status = 'observed'
  } catch (error) { failure = error; report.status = 'failed'; report.failure = String(error?.stack ?? error) }
  finally {
    if (installed) try {
      report.evidence = await page.evaluate(() => {
        const owner = window.vaultPrayer
        const result = owner.close()
        if (window.vaultPrayer === owner) delete window.vaultPrayer
        return result
      })
    } catch (error) { report.cleanupErrors.push(String(error)) }
    save()
  }
  if (failure) throw failure
  try {
    assert.deepEqual(report.cleanupErrors, [])
    report.summary = assertVaultPrayerEpisode(report.evidence, targetId, shamanId)
    report.status = 'passed'
  } catch (error) {
    report.status = 'failed'
    report.failure = String(error?.stack ?? error)
    throw error
  } finally { save() }
  return report
}
