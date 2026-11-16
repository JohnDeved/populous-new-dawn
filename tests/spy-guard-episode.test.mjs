import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { spyGuardCycle, assertSpyRetained, spyEvidenceMode } from '../scripts/spy-discovery-evidence/guards.mjs'
const state = () => ({ current: true, sameUnit: true, samePerson: true, ownerRegistered: true,
  turn: 3, paused: true, disguise: 0, hp: 50, tribe: 1, invisibility: 0, randomState: 7,
  mode: null, inputMask: 0, selected: [], position: { x: 1, z: 2 }, pending: null, modal: false, overview: false })
function ports(kind, change = () => {}) {
  let current = state(), clicks = 0
  const records = []
  return { kind, records, get clicks() { return clicks },
    read: async () => structuredClone(current),
    enter: async () => { current[kind === 'options' ? 'modal' : 'overview'] = true },
    leave: async () => { current.modal = current.overview = false },
    click: async () => { clicks++; change(current); return { trusted: true, canvas: kind === 'overview', inOpenDialog: kind === 'options', dialogPanel: kind === 'options' ? 'options' : null } },
    capture: async label => records.push(label), stage: (label, data) => records.push({ label, data }) }
}
for (const kind of ['options', 'overview']) {
  test(`${kind} requires repeated rejection and same-actor paused recovery`, async () => {
    const p = ports(kind); await spyGuardCycle(p)
    assert.equal(p.clicks, 2); assert.equal(p.records.length, 4)
  })
  test(`${kind} propagates falsey action failure and does not continue`, async () => {
    const p = ports(kind); p.click = async () => { throw null }
    let caught = false
    try { await spyGuardCycle(p) } catch (e) { caught = true; assert.equal(e, null) }
    assert.equal(caught, true); assert.equal(p.records.length, 1)
  })
  test(`${kind} rejects wrong routing and synthetic input`, async () => {
    for (const admission of [{ trusted: false, canvas: kind === 'overview' }, { trusted: true, canvas: kind !== 'overview' }]) {
      const p = ports(kind); p.click = async () => admission
      await assert.rejects(spyGuardCycle(p))
    }
  })
}
test('retention oracle rejects pending command, identity, clock, selection and disguise changes', () => {
  for (const [key, value] of Object.entries({ current: false, sameUnit: false, samePerson: false, ownerRegistered: false,
    turn: 4, paused: false, disguise: 64, hp: 49, tribe: 2, invisibility: 1, randomState: 8,
    mode: 'hut', inputMask: 2, selected: [1], position: { x: 2, z: 2 }, pending: { id: 9 } })) {
    assert.throws(() => assertSpyRetained(state(), { ...state(), [key]: value }), undefined, key)
  }
})
test('a staged command during rejection fails before recovery', async () => {
  const p = ports('overview', s => { s.pending = { id: 9 } })
  await assert.rejects(spyGuardCycle(p)); assert.equal(p.clicks, 1)
})
test('rendered opt-in retains original caps, fixture disclosure, live hit and ordinary reveal assertions', () => {
  const source = readFileSync(new URL('../scripts/spy-discovery-evidence/scenario.mjs', import.meta.url), 'utf8')
  for (const text of ['Date.now() + 150000', 'deadlineAt - 10000', "cases: ['visible'], guards: true",
    's.picking.pickPerson({ clientX: x, clientY: y }) !== h.spyId', "page.keyboard.press('Enter')",
    "button('Options').click()", "button('Continue Game').click()", 'e.isTrusted',
    'Next logical turn resets disguise to the Spy owner', 'report.contextsClosed = closed.every(Boolean)'])
    assert.ok(source.includes(text), text)
  assert.doesNotMatch(source, /\.overviewActive\s*=|\.modalSuspended\s*=|\.spyDiscovery\s*=/)
})

test('Options rejects unrelated noncanvas input and wrong dialog panel', async () => {
  for (const admission of [
    { trusted: true, canvas: false, inOpenDialog: false, dialogPanel: 'options' },
    { trusted: true, canvas: false, inOpenDialog: true, dialogPanel: 'root' },
  ]) {
    const p = ports('options'); p.click = async () => admission
    await assert.rejects(spyGuardCycle(p))
  }
})

test('owner mode is explicit, preserves old default and rejects unknown input', () => {
  assert.equal(spyEvidenceMode(undefined), 'discovery')
  assert.equal(spyEvidenceMode('discovery'), 'discovery')
  assert.equal(spyEvidenceMode('guards'), 'guards')
  for (const value of ['', 'guard', 'visible', 'all', true]) assert.throws(() => spyEvidenceMode(value))
  const owner = readFileSync(new URL('../scripts/spy-discovery-evidence/run.mjs', import.meta.url), 'utf8')
  assert.ok(owner.includes("mode === 'guards' ? spyGuardEpisode : spyDiscoveryEpisode"))
  assert.ok(owner.includes('browserCapMs = 180000, buildCapMs = 120000'))
  assert.ok(owner.includes('"spy-discovery-evidence/guards"'))
})
