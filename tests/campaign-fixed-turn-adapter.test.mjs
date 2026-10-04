import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { campaignAdapter } from '../scripts/local-render/campaign-fixed-turn.mjs'

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
