import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createMission1VaultInput } from './mission1-vault-input.mjs'

const party = [50, 51, 52, 53, 54, 55]
const headId = 47
const shamanId = 258

// Authored startup and trusted HUD/minimap/pointer inputs only. The browser owns
// all animation and simulation visits; observations never advance or edit World.
export default async function ({ page, openMission, output, receipt, signal }) {
  const deadline = Date.parse(receipt.startedAt) + 600000
  const report = { source: receipt.source, status: 'running', actions: [], observations: [],
    method: 'Fresh M14 public startup, HUD original Braves selection, ordinary head click, real RAF walking/worship and linked gifts',
    limits: 'Bounded linked-head acquisition only; no mission victory, Angel acquisition, persistence, original parity or hardware-performance claim' }
  const save = () => writeFileSync(resolve(output, 'linked-head.json'), JSON.stringify(report, null, 2) + '\n')
  const input = createMission1VaultInput({ page, signal, report, save, originalShamanId: shamanId, deadlineAt: deadline })
  const read = async label => {
    signal.throwIfAborted()
    const row = await page.evaluate(({ label, party, headId, shamanId }) => {
      const scene = window.testSceneRef.current, w = scene.world, h = w.shrines.find(h => h.id === headId)
      const gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      const unit = id => { const u = w.units.find(u => u.id === id); return u && { id, team: u.team, kind: u.kind, hp: u.hp, x: u.x, z: u.z, work: u.work, state: u.native?.state, commandStatus: u.native?.commandStatus } }
      return { label, wallTime: Date.now(), turn: w.turn, time: w.time, level: w.outcome.level, status: w.status,
        paused: w.paused, inputMask: w.inputMask, selected: [...w.selected], shaman: unit(shamanId), party: party.map(unit),
        head: h && { id: h.id, x: h.x, z: h.z, kind: h.kind, rewards: h.rewards && [...h.rewards], required: h.required, target: h.target, work: h.work, followers: h.followers, uses: h.uses },
        shots: { earthquake: w.shots.earthquake, bridge: w.shots.bridge },
        giftCounts: { earthquake: w.giftCounts.earthquake, bridge: w.giftCounts.bridge },
        gifts: w.gifts.map(g => ({ ...g })),
        renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), contextLost: gl.isContextLost() }
    }, { label, party, headId, shamanId })
    report.observations.push(row); save()
    assert.equal(row.level, 14); assert.equal(row.paused, false); assert.equal(row.contextLost, false)
    assert.equal(row.status, 'playing'); assert.ok(row.shaman?.hp > 0)
    assert.ok(row.party.every(u => u?.hp > 0 && u.team === 'blue' && u.kind === 'brave'))
    assert.deepEqual(receipt.errors, [])
    return row
  }
  const capture = name => page.screenshot({ path: resolve(output, `${name}.png`) })
  try {
    await openMission(14)
    await input.settle()
    const initial = await read('authored-start')
    assert.deepEqual(initial.head.rewards, ['earthquake', 'bridge'])
    assert.deepEqual({ id: initial.head.id, x: initial.head.x, z: initial.head.z, uses: initial.head.uses }, { id: headId, x: -61, z: -53, uses: 0 })
    assert.deepEqual(initial.shots, { earthquake: 0, bridge: 0 })
    assert.deepEqual(initial.giftCounts, { earthquake: 0, bridge: 0 })
    await capture('authored-start')
    await input.action('clear-selection', () => page.keyboard.press('Escape'))
    await input.action('HUD select original six Braves', () => page.getByRole('button', { name: 'Select brave', exact: true }).click({ modifiers: ['Shift'] }))
    assert.deepEqual((await read('HUD-selected')).selected, party)
    await input.view(initial.head)
    await input.prepareDispatch()
    const hit = await input.entityPoint('shrines', headId, 27)
    report.hit = hit; save(); assert.equal(hit.rejection, null, JSON.stringify(hit))
    report.dispatch = await input.dispatch(hit, 27, party)
    await input.action('move pointer away', () => page.mouse.move(20, 975))
    await capture('head-commanded')
    let lastTurn = -1, changedAt = Date.now(), worshipCaptured = false
    for (;;) {
      const row = await read('ordinary-progress')
      if (row.turn !== lastTurn) { lastTurn = row.turn; changedAt = Date.now() }
      if (!worshipCaptured && row.head.followers >= row.head.required && row.head.work > 0) {
        await capture('ordinary-worship'); worshipCaptured = true
      }
      if (row.head.uses === 1 && row.shots.earthquake === 1 && row.shots.bridge === 1 && row.giftCounts.earthquake === 1 && row.giftCounts.bridge === 1) {
        report.acquired = row; break
      }
      assert.ok(Date.now() < deadline && Date.now() - changedAt < 45000, 'Real RAF route budget or advancing-clock watchdog expired')
      await page.waitForTimeout(1000)
    }
    await page.getByRole('button', { name: 'Earthquake, 1 shots', exact: true }).waitFor({ state: 'visible' })
    await page.getByRole('button', { name: 'Land Bridge, 1 shots', exact: true }).waitFor({ state: 'visible' })
    await capture('linked-gifts-HUD')
    report.final = await read('linked-gifts-HUD')
    report.status = 'passed'; save(); return report
  } catch (error) { report.status = 'failed'; report.error = String(error); save(); throw error }
}
