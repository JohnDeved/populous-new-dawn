import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import campaignFixedTurn, { campaignAdapter } from '../scripts/local-render/campaign-fixed-turn.mjs'

const checker = readFileSync(new URL('../scripts/check-browser-campaign-natural-victory.mjs', import.meta.url), 'utf8')

test('sandbox adapter retains every existing assertion, turn bound and campaign action', () => {
  const adapted = campaignAdapter(checker)
  // The route bodies, including every numeric turn limit, remain byte-for-byte.
  for (const [start, end] of [['async function missionTwo(page)', 'async function swarmDiagnostic(page)'], ['async function missionThreeSwarm(page)', '\ntry {']]) {
    const section = source => source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)))
    assert.equal(section(adapted), section(checker))
  }
  for (const pattern of [/assert\.(?:ok|equal|deepEqual|fail)\(/g, /tick\(world, 1 \/ 12\)/g, /await advance(?:Until)?\(/g, /await page\.mouse\.click\(/g])
    assert.equal([...adapted.matchAll(pattern)].length, [...checker.matchAll(pattern)].length)
  assert.ok(adapted.includes("{ type: 'status', status: 'won' }, 5000, 'natural Mission 2 victory'"))
  assert.ok(adapted.includes("{ type: 'status', status: 'won' }, 5000, 'natural Mission 3 victory'"))
  assert.ok(adapted.includes("name: 'Continue to Mission 3', exact: false }).click()"))
  assert.ok(adapted.includes("name: 'Continue to Mission 4', exact: false }).waitFor()"))
  assert.ok(adapted.includes('getCompletedMissions().includes(2)'))
  assert.ok(adapted.includes('getCompletedMissions().includes(3)'))
  assert.ok(!adapted.includes('chromium.launch'))
  assert.ok(adapted.includes('not real-clock gameplay'))
})

test('changed or duplicated maintained checker scaffold fails closed before browser execution', () => {
  assert.throws(() => campaignAdapter(checker.replace('await missionTwo(page)', 'await changedRoute(page)')), /scaffold changed/)
  assert.throws(() => campaignAdapter(checker + '\n    await missionTwo(page)'), /scaffold changed/)
})


test('late final screenshot completion cannot mark an aborted campaign scenario passed', async () => {
  const root = mkdtempSync(join(tmpdir(), 'campaign-abort-'))
  const output = join(root, 'output'), abort = new AbortController()
  mkdirSync(join(root, 'scripts')); mkdirSync(output)
  // Minimal checker scaffold exercises the production adapter/scenario only.
  // No real game, browser, victory, or image is produced by this fixture.
  const fixture = `import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { openGame } from './browser-game.mjs'
const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })
async function missionTwo() {}
async function missionThree() {}
const result = { ready: true, turn: 1, status: 'playing' }, required = false, label = 'fixture'
  if (required) assert.ok(result.ready, \`\${label} timed out: \${JSON.stringify(result)}\`)
try {
    await missionTwo(page)
    await page.getByRole('button', { name: 'Continue to Mission 3', exact: false }).click()
    await missionThree(page)
    await page.getByRole('button', { name: 'Continue to Mission 4', exact: false }).waitFor()
    console.log('PASS: rendered player actions win Mission 2, continue, and naturally win Mission 3')
} finally { await browser.close() }
`
  writeFileSync(join(root, 'scripts/check-browser-campaign-natural-victory.mjs'), fixture)
  const page = {
    async evaluate() { return { level: 3, status: 'won', turn: 1, contextLost: false, population: {} } },
    getByRole() { return { async click() {}, async waitFor() {} } },
    async screenshot({ path }) {
      if (path.endsWith('mission-3-result.png')) abort.abort(Error('Aborted during final screenshot'))
    },
  }
  try {
    await assert.rejects(campaignFixedTurn({ root, page, openMission: async () => {}, output,
      receipt: { source: { commit: 'fixture-only' }, errors: [] }, signal: abort.signal }),
    /Aborted during final screenshot/)
    const report = JSON.parse(readFileSync(join(output, 'campaign.json'), 'utf8'))
    assert.equal(report.status, 'failed')
    assert.match(report.failure, /Aborted during final screenshot/)
    assert.equal(globalThis.campaignFixedTurnQA, undefined)
  } finally { rmSync(root, { recursive: true, force: true }) }
})
