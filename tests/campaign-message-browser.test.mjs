import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { assertDelayedCampaignCallbacks } from '../scripts/tutorial-browser/campaign-message-ownership.mjs'

const checks = { summaryRejected: true, summaryPreserved: true, dismissPreserved: true, oldSlotPreserved: true, currentSlotPreserved: true }
test('mounted callback receipt requires every ownership boundary, not truthy or absent evidence', () => {
  assertDelayedCampaignCallbacks(checks)
  for (const key of Object.keys(checks)) {
    for (const value of [false, undefined, 1, 'true']) assert.throws(() => assertDelayedCampaignCallbacks({ ...checks, [key]: value }))
    const absent = { ...checks }; delete absent[key]; assert.throws(() => assertDelayedCampaignCallbacks(absent))
  }
  assert.throws(() => assertDelayedCampaignCallbacks({ ...checks, extra: true }))
})
test('unpatched mounted-handler outcome is rejected with concrete retained old-slot mutation', () => {
  assert.throws(() => assertDelayedCampaignCallbacks({ ...checks, summaryRejected: false, dismissPreserved: false, oldSlotPreserved: false }))
})
test('browser episode uses mounted props, public Load and trusted Dismiss without replacing game functions', () => {
  const source = readFileSync(new URL('../scripts/tutorial-browser/campaign-message-ownership.mjs', import.meta.url), 'utf8')
  assert.match(source, /key\.startsWith\('__reactProps'\)/)
  assert.match(source, /name: 'Load checkpoint', exact: true/)
  assert.match(source, /captured\.onSummary\(/)
  assert.match(source, /captured\.onDismiss\(\)/)
  assert.match(source, /name: 'Dismiss campaign message', exact: true/)
  assert.match(source, /event\.label === label && event\.trusted === true/)
  assert.doesNotMatch(source, /scene\.focus\s*=|store\.(?:change|publish|loadCheckpoint)\(|messages\.slots\[[^\]]+\]\s*=(?!=)/)
  assert.match(source, /not a naturally reproduced stale-click race/)
  assert.match(source, /does not establish stale focus or same-world slot-replacement/)
})

import { runInNewContext } from 'node:vm'
import { captureMountedCampaignCallbacks, replayMountedCampaignCallbacks, assertCurrentCampaignDismiss } from '../scripts/tutorial-browser/campaign-message-ownership.mjs'
function mounted() {
  const message = { stringId: 641, serial: 0 }, world = { messages: { slots: [message] }, paused: true, turn: 121 }
  const summary = { isConnected: true, __reactPropsTest: { onClick() {} } }, dismiss = { isConnected: true, __reactPropsTest: { onClick() {} } }
  const details = { open: false, querySelector: selector => selector === 'summary' ? summary : dismiss }
  const store = { getWorld: () => world }, scene = { world }
  const window = { testStore: store, testSceneRef: { current: scene } }
  const document = { querySelector: () => details, addEventListener() {} }
  return { window, document, summary, dismiss, world, message, scene }
}
test('capture refuses absent/non-function mounted handlers and mismatched Scene', () => {
  for (const leaf of ['summary','dismiss']) for (const value of [undefined, 0, 'stub']) {
    const f = mounted(); f[leaf].__reactPropsTest.onClick = value
    assert.throws(() => runInNewContext(`(${captureMountedCampaignCallbacks.toString()})()`, f), /handlers unavailable/)
  }
  const f = mounted(); f.scene.world = {}; assert.throws(() => runInNewContext(`(${captureMountedCampaignCallbacks.toString()})()`, f), /Expected one settled/)
})
test('replay refuses nonreplacement worlds, reused messages and disconnected Scene', () => {
  for (const defect of ['world', 'message', 'scene']) {
    const f = mounted(); runInNewContext(`(${captureMountedCampaignCallbacks.toString()})()`, f)
    const newWorld = { paused: true, messages: { slots: [defect === 'message' ? f.message : { serial: 0, stringId: 641 }] } }
    f.window.testStore.getWorld = () => defect === 'world' ? f.world : newWorld
    f.window.testSceneRef.current = { world: newWorld, renderer: { domElement: { isConnected: defect !== 'scene' } } }
    assert.throws(() => runInNewContext(`(${replayMountedCampaignCallbacks.toString()})()`, f), /Public Load must establish/)
  }
})
test('public Dismiss acceptance rejects synthetic inputs, absent input or absent slot removal', () => {
  const passed = { sameWorld: true, removedExactSlot: true, inputs: [{ label: 'Dismiss campaign message', trusted: true }, { label: 'Read campaign message', trusted: true }] }
  assertCurrentCampaignDismiss(passed)
  for (const field of ['sameWorld','removedExactSlot']) assert.throws(() => assertCurrentCampaignDismiss({ ...passed, [field]: false }))
  for (let index = 0; index < 2; index++) {
    const bad = structuredClone(passed); bad.inputs[index].trusted = false; assert.throws(() => assertCurrentCampaignDismiss(bad))
    const missing = structuredClone(passed); missing.inputs.splice(index, 1); assert.throws(() => assertCurrentCampaignDismiss(missing))
  }
})

test('new browser episode follows every existing compact episode and uses a fresh bounded context', () => {
  const runner = readFileSync(new URL('../scripts/tutorial-browser/run.mjs', import.meta.url), 'utf8')
  const branch = runner.slice(runner.indexOf("} else if (selectedScenario === 'compact-message-layout')"), runner.indexOf("} else if (selectedScenario === 'm2-pointer-f8')"))
  assert.ok(branch.indexOf('runCompactDiagnosticEpisodes') < branch.indexOf('receipt.hypnotise'))
  assert.ok(branch.indexOf('receipt.hypnotise') < branch.indexOf('receipt.campaignMessageOwnership'))
  assert.equal((branch.match(/campaignCallbacks: true/g) ?? []).length, 1)
  assert.match(branch, /default\(\{ browser, url, output: out, fixture: m2Fixture, campaignCallbacks: true \}\)/)
  const m2 = readFileSync(new URL('../scripts/tutorial-browser/m2-pointer-f8.mjs', import.meta.url), 'utf8')
  assert.match(m2, /m2FunctionalLimitMs = 45000/)
  assert.match(m2, /\[compactMessages, pickingPaths, campaignCallbacks\]\.filter\(Boolean\)\.length <= 1/)
  assert.match(m2, /const context = await browser\.newContext/)
  assert.match(m2, /campaignCallbacks \? 'campaign-message-ownership'/)
  assert.match(m2, /report\.campaignMessageOwnership = \{\}/)
  assert.match(m2, /await checkCampaignMessageOwnership\(/)
  assert.match(runner, /campaignMessageOwnershipSha256: hash/)
})
