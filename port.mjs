import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createWorld, tick } from '../../../app/model.ts'
import { createErosion, stepErosion } from '../../../app/erosion.ts'

const directory = new URL('./', import.meta.url)
const native = JSON.parse(readFileSync(new URL('attempt02.json', directory)))
const raw = readFileSync(process.argv[2])
const initial = Array.from({ length: 16384 }, (_, i) => raw.readInt16LE(i * 2))
const hash = values => {
  const bytes = Buffer.alloc(32768)
  values.forEach((value, i) => bytes.writeInt16LE(value, i * 2))
  return createHash('sha256').update(bytes).digest('hex')
}
const report = {
  scope: 'Supplied-state port execution; no ordinary gameplay, browser or renderer claim.',
  sourceHead: '10f168733815921070621842d8c025f35715a56d',
  supplied: { seed: 0x12345678, rawAuthoredTerrain: true, allTerrainFlags: 0,
    worldGameFlags: 34, clearedCollections: ['units', 'vehicles', 'buildings', 'trees', 'effects',
      'gifts', 'projectiles', 'marching', 'combatMarches', 'fights', 'replants', 'levelStart'],
    completion: 'authored Erosion shrine reset=false, forced=true; all other shrines removed' },
  controller: [], world: [],
}
const expected = label => native.snapshots.find(row => row.label === label)
const snapshot = (erosion, land, game) => ({
  remaining: erosion.remaining,
  center: erosion.center,
  randomState: game.randomState,
  heightSha256: hash(Array.from(land.heights)),
})
try {
  assert.equal(createHash('sha256').update(raw).digest('hex'), native.levelSha256)
  const source = expected('row103-allocated')
  const center = { x: source.position[0], y: source.position[1], h: source.position[2] }
  const land = { heights: Int16Array.from(initial) }
  const game = { randomState: report.supplied.seed }
  const erosion = createErosion(center)
  report.controller.push(snapshot(erosion, land, game))
  for (const label of ['after-immediate-processing', 'after-next-scheduler']) {
    const callbacks = []
    stepErosion(land, erosion, game, { sound: () => callbacks.push(['sound-request']),
      terrain: cell => callbacks.push(['terrain-notification', cell]) })
    const row = { ...snapshot(erosion, land, game), callbacks }
    report.controller.push(row)
    assert.equal(row.remaining, expected(label).remaining)
    assert.equal(row.randomState, expected(label).randomState)
    assert.equal(row.heightSha256, expected(label).heightSha256)
  }

  const world = createWorld(3)
  const shrine = world.shrines.find(row => row.kind === 'erosionEffect')
  assert.ok(shrine)
  report.authoredShrine = structuredClone(shrine)
  for (const name of report.supplied.clearedCollections) world[name] = []
  world.shrines = [shrine]
  world.manaWorld.gameFlags = report.supplied.worldGameFlags
  world.land.heights.set(initial)
  world.land.flags.fill(0)
  world.land.landFlags = 0
  world.landVersion = world.terrainVersion
  world.randomState = report.supplied.seed
  shrine.reset = false
  shrine.forced = true
  for (const label of ['activation', 'next-visit', 'second-later-visit']) {
    tick(world, 1 / 12)
    const effect = world.effects.find(row => row.erosion)
    assert.ok(effect)
    report.world.push({ label, turn: world.turn, shrineUses: shrine.uses,
      ...snapshot(effect.erosion, world.land, world) })
  }
  assert.deepEqual(report.world.map(row => row.remaining), [64, 63, 62])
  for (let i = 0; i < 3; i++) {
    assert.equal(report.world[i].randomState, report.controller[i].randomState)
    assert.equal(report.world[i].heightSha256, report.controller[i].heightSha256)
  }
  report.result = 'passed'
} catch (error) {
  report.result = 'failed'
  report.error = error.stack
  throw error
} finally {
  writeFileSync(new URL('port01.json', directory), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ result: report.result, world: report.world }))
}
