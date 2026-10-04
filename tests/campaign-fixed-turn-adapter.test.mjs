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

// Execute the maintained candidate finder against test-only geometry outside its
// old anchor window. These tests never render or advance a game.
async function geometryPoint({ actualHit = 55, canvasOwnsPoint = true } = {}) {
  const { default: vm } = await import('node:vm')
  const start = checker.indexOf('async function entityPoint(')
  const source = checker.slice(start, checker.indexOf('\nasync function groundPoint(', start))
  const canvas = {}, child = { userData: { nativeModel: 149 }, visible: true }
  const mesh = { position: { toArray: () => [0, 1, 0] }, visible: true, traverse: fn => fn(child) }
  const scene = {
    world: { turn: 6734, shrines: [{ id: 55, x: 0, z: 0, model: 45 }] },
    container: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 300 }) },
    focus() {}, onChange() {}, screen: () => ({ x: -0.75, y: 2 / 3 }),
    renderer: { domElement: canvas, render() {} },
    shrineMeshes: new Map([[55, { g: mesh }]]),
    cameraPosition: {}, viewPoint: {}, cameraBearing: 0,
    view: { projection: {}, painter: { source: () => ({}) } },
    picking: { pickPerson: () => null, model: () => [
      { kind: 'model', points: [{ x: 270, y: 190 }, { x: 290, y: 190 }, { x: 280, y: 210 }] },
      { kind: 'bounds', bounds: { x: 270, y: 190, width: 20, height: 20 } },
    ] },
    pickWorldObject: ({ clientX: x, clientY: y }) => x >= 275 && x <= 285 && y >= 195 && y <= 205 ? { id: actualHit } : null,
  }
  const sandbox = { testScene: scene, document: { elementFromPoint: () => canvasOwnsPoint ? canvas : {} } }
  vm.runInNewContext(source + '\nglobalThis.findPoint = entityPoint', sandbox)
  return sandbox.findPoint({ evaluate: (fn, args) => fn(args) }, 'shrines', 55)
}

test('actual native triangles supplement the historical fixed anchor scan', async () => {
  const point = await geometryPoint()
  assert.ok(point.x > point.pickingDiagnostic.legacyScan.right)
  assert.ok(point.y > point.pickingDiagnostic.legacyScan.bottom)
  assert.equal(point.pickingDiagnostic.models[0].model, 149)
  assert.equal(point.pickingDiagnostic.hit.clientX, point.x)
})

test('geometry candidates cannot bypass foreign object or DOM overlay ownership', async () => {
  await assert.rejects(geometryPoint({ actualHit: 56 }), /No rendered hit point/)
  await assert.rejects(geometryPoint({ canvasOwnsPoint: false }), /No rendered hit point/)
})
