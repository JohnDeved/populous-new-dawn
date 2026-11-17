import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { settleSpyStartup } from '../scripts/spy-discovery-evidence/startup.mjs'
function setup(states) {
  const events = []
  return { events, observe: async () => states.shift() ?? { ready: false, modal: true },
    dismiss: async () => events.push('dismiss'), skip: async () => events.push('skip'),
    record: state => events.push(state), deadline: { run: async f => f(), dispose: () => events.push('dispose') } }
}
test('later opening message is dismissed publicly before unchanged readiness succeeds', async () => {
  const p = setup([{ ready: false, modal: true }, { ready: true, modal: false }])
  await settleSpyStartup(p)
  assert.deepEqual(p.events, [{ ready: false, modal: true }, 'dismiss', 'skip', { ready: true, modal: false }, 'dispose'])
})
test('ready with modal still present is not admitted', async () => {
  const p = setup([{ ready: true, modal: true }, { ready: true, modal: false }]); await settleSpyStartup(p)
  assert.ok(p.events.includes('dismiss'))
})
test('message storm fails after eight dismissals without changing budget', async () => {
  const p = setup([]); await assert.rejects(settleSpyStartup(p), /eight dismissals/)
  assert.equal(p.events.filter(e => e === 'dismiss').length, 8)
})
for (const phase of ['observe', 'dismiss', 'skip']) test(`${phase} falsey failure propagates with deadline disposal`, async () => {
  const p = setup([{ ready: false, modal: true }]); p[phase] = async () => { throw undefined }
  let rejected = false
  try { await settleSpyStartup(p) } catch (e) { rejected = true; assert.equal(e, undefined) }
  assert.equal(rejected, true); assert.equal(p.events.at(-1), 'dispose')
})
test('absolute readiness budget stays 60s and actual summary/skip controls remain', () => {
  const helper = readFileSync(new URL('../scripts/spy-discovery-evidence/startup.mjs', import.meta.url), 'utf8')
  const source = readFileSync(new URL('../scripts/spy-discovery-evidence/scenario.mjs', import.meta.url), 'utf8')
  assert.match(helper, /createDeadline\(Date.now\(\) \+ 60000\)/)
  assert.match(source, /discoveryFixtureReady\(scene\)/)
  assert.ok(source.includes('summary[aria-label="Read campaign message"]'))
  assert.ok(source.includes("stage('opening-readiness', state)"))
})
