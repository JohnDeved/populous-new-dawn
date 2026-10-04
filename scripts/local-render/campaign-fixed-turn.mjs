// Retain the full historical campaign route under the owned sandboxed harness.
// This is diagnostic tick stepping with camera assistance, not real-clock play.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function campaignAdapter(source) {
  const replacements = [
    ["import { chromium } from '@playwright/test'", '// Browser supplied by the sandbox-preserving local-render harness.'],
    ["import { openGame } from './browser-game.mjs'", 'const { page, receipt, checkpoint } = globalThis.campaignFixedTurnQA\nconst openGame = async () => ({ page, errors: receipt.errors })'],
    ["const browser = await chromium.launch({ headless: !process.argv.includes('--headed') })", 'const browser = { close: async () => {} }'],
    ['    await missionTwo(page)', "    await checkpoint('mission-2-start')\n    await missionTwo(page)\n    await checkpoint('mission-2-won')"],
    ["    await page.getByRole('button', { name: 'Continue to Mission 3', exact: false }).click()", "    await checkpoint('mission-2-result')\n    await page.getByRole('button', { name: 'Continue to Mission 3', exact: false }).click()"],
    ['    await missionThree(page)', "    await checkpoint('mission-3-continued')\n    await missionThree(page)\n    await checkpoint('mission-3-won')"],
    ["    await page.getByRole('button', { name: 'Continue to Mission 4', exact: false }).waitFor()", "    await page.getByRole('button', { name: 'Continue to Mission 4', exact: false }).waitFor()\n    await checkpoint('mission-3-result')"],
    ["  if (required) assert.ok(result.ready, `${label} timed out: ${JSON.stringify(result)}`)", "  console.log(JSON.stringify({ label, ready: result.ready, turn: result.turn, status: result.status }))\n  if (required) assert.ok(result.ready, `${label} timed out: ${JSON.stringify(result)}`)"],
    ["    console.log('PASS: rendered player actions win Mission 2, continue, and naturally win Mission 3')", "    console.log('PASS: fixed-turn diagnostic wins Mission 2, continues, and wins Mission 3; not real-clock gameplay')"],
  ]
  let adapted = source
  for (const [before, after] of replacements) {
    assert.equal(adapted.split(before).length, 2, `Maintained campaign checker scaffold changed: ${before}`)
    adapted = adapted.replace(before, after)
  }
  return adapted
}

export default async function campaignFixedTurn({ root, page, openMission, output, receipt, signal }) {
  const checker = readFileSync(resolve(root, 'scripts/check-browser-campaign-natural-victory.mjs'), 'utf8')
  const report = {
    method: 'Diagnostic fixed-turn simulation via direct tick(world, 1/12), suspended RAF, internal camera focus and read-only targeting/picking helpers; rendered HUD/mouse orders. No injected entities, resources, victory, AI state, or campaign profile.',
    limits: 'Not ordinary real-clock gameplay, native timing parity, complete original-game parity, or hardware performance. Direct All missions setup for Mission 2; Mission 3 must use the shipped Continue result button.',
    source: receipt.source,
    checkerSha256: createHash('sha256').update(checker).digest('hex'),
    scenarioSha256: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
    checkpoints: [],
  }
  const save = () => writeFileSync(resolve(output, 'campaign.json'), JSON.stringify(report, null, 2) + '\n')
  const checkpoint = async name => {
    signal.throwIfAborted()
    const state = await page.evaluate(() => {
      const scene = window.testScene, world = scene.world, gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        level: world.outcome.level, status: world.status, turn: world.turn, time: world.time,
        inputMask: world.inputMask, selected: [...world.selected], shots: { ...world.shots },
        completedMissions: window.testStore.getCompletedMissions(),
        objectives: world.objectives, stats: { ...world.stats },
        population: Object.fromEntries(['blue', 'green', 'yellow', 'red'].map(team => [team, world.units.filter(unit => unit.team === team && unit.hp > 0).length])),
        buildings: world.buildings.filter(building => building.hp > 0).map(({ id, kind, team, hp, progress }) => ({ id, kind, team, hp, progress })),
        contextLost: gl.isContextLost(), renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      }
    })
    report.checkpoints.push({ name, at: new Date().toISOString(), state })
    save()
    console.log(JSON.stringify({ checkpoint: name, level: state.level, status: state.status, turn: state.turn, population: state.population }))
    assert.equal(state.contextLost, false)
    await page.screenshot({ path: resolve(output, `${name}.png`) })
  }
  save()
  await openMission(2)
  const adapter = resolve(output, 'campaign-adapter.mjs')
  writeFileSync(adapter, campaignAdapter(checker))
  globalThis.campaignFixedTurnQA = { page, receipt, checkpoint }
  try {
    await import(pathToFileURL(adapter).href)
    assert.deepEqual(receipt.errors, [])
    report.status = 'passed'
    save()
    return report
  } catch (error) {
    report.status = 'failed'
    report.failure = error.stack ?? String(error)
    await checkpoint('failure-state').catch(() => {})
    save()
    throw error
  } finally {
    delete globalThis.campaignFixedTurnQA
  }
}
