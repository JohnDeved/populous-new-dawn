import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('ordinary Mission4 first Tower and phase3 checkpoint', () => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(process.execPath, [
      '--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url),
    ], { env, encoding: 'utf8', timeout: 120_000, maxBuffer: 1024 * 1024 })
    assert.equal(result.error, undefined)
    assert.match(result.stdout, /tests 1\b/)
    assert.equal(result.status, 0, result.stderr + result.stdout)
  })
} else {
const math = await import('../app/native-math.ts')
let firstSearch
mock.module(new URL('../app/native-math.ts', import.meta.url), {
  cache: true,
  namedExports: { ...math, spiralCell(...args) {
    firstSearch ??= [...args]
    return math.spiralCell(...args)
  } },
})
const { createWorld } = await import('../app/world-initialization.ts')
const { advanceGame } = await import('../app/game-clock.ts')
const { migrateCheckpoint } = await import('../app/game-store.ts')
const { startPendingWorshipAcquisitions, visitWorshipAcquisition } = await import('../app/worship-acquisition-runtime.ts')
const { buildingOutsidePoint, buildingPose } = await import('../app/building-shapes.ts')
const { unitAnimationSource } = await import('../app/unit-animation-source.ts')
const { currentPersonOrder } = await import('../app/person-orders.ts')
test('unmodified Mission4 completes its first Tower through advanceGame and restored continuation', () => {
const start = performance.now(), w = createWorld(4), events = []
function clock(world, saved) {
  return {
    animationTime: saved?.animationTime ?? 0,
    animationFrame: saved?.animationFrame ?? 0,
    afterTurn() { startPendingWorshipAcquisitions(world, {
      cue: () => assert.fail('unexpected acquisition cue'),
      geometry: () => assert.fail('unexpected acquisition geometry'),
      failed: () => assert.fail('unexpected acquisition failure'),
    }) },
    worshipVisit() { visitWorshipAcquisition(world, () => assert.fail('unexpected acquisition arrival')) },
    presentationHidden: () => false,
  }
}
const c = clock(w)
let restored, rc, towerId, checkpoint, completed, builders, timber, priorPhase

try {
  while (w.turn < 10000 && !completed) {
    assert.ok(performance.now() - start < 120000, '120-second fixed cap')
    assert.equal(w.status, 'playing', 'ordinary episode terminated')
    advanceGame(w, c, 1 / 12)
    if (restored) advanceGame(restored, rc, 1 / 12)
    const task = w.ai.tasks.find(t => t.flags & 1 && t.type === 0 && t.requested === 4)
    if (task && priorPhase !== task.phase) {
      events.push({ turn: w.turn, phase: task.phase, origin: task.origin, target: task.target,
        entity: task.entity, members: [...task.members], base: w.ai.constructionBase })
      console.log(JSON.stringify(events.at(-1)))
      priorPhase = task.phase
    }
    if (w.turn === 61) {
      assert.ok(task, 'first normal producer must request Tower at turn60')
      assert.deepEqual([task.origin, task.phase, task.extra], [0x36b6, 0, 0])
    }
    if (task?.entity) towerId ??= task.entity
    const tower = w.buildings.find(b => b.id === towerId)
    if (!checkpoint && task?.phase === 3) {
      assert.ok(tower)
      assert.equal(w.ai.constructionBase, undefined)
      assert.equal(firstSearch[0], 0x38d8)
      assert.equal(firstSearch[2], 1)
      checkpoint = w.turn
      restored = migrateCheckpoint(structuredClone(w))
      rc = clock(restored, c)
      assert.deepEqual(restored, w)
    }
    if (tower && w.ai.constructionBase !== undefined) {
      const p = buildingOutsidePoint(buildingPose(tower))
      assert.equal(w.ai.constructionBase, ((p.x >>> 8) & 254) | (p.y & 0xfe00))
    }
    if (!builders && task?.members.length === 2 && task.members.every(id => {
      const u = w.units.find(u => u.id === id)
      const person = unitAnimationSource(u) ?? u.native
      return person && currentPersonOrder(w.buildingOrders, person)?.model === 6
    })) builders = { turn: w.turn, members: [...task.members] }
    if (tower?.progress > 0 && !timber) timber = { turn: w.turn, progress: tower.progress }
    if (restored && (!(w.turn % 64) || tower?.progress === 1))
      assert.deepEqual(restored, w)
    if (tower?.progress === 1) completed = w.turn
  }
  assert.ok(completed, 'first Tower did not complete within fixed10000-turn cap')
  assert.ok(checkpoint && builders && timber)
  console.log(JSON.stringify({ status: 'passed', completed, checkpoint, builders, timber,
    towerId, firstSearch, rng: w.randomState, elapsedMs: performance.now() - start }))
} catch(error) {
  console.log(JSON.stringify({ status: 'failed', turn: w.turn, checkpoint, builders, timber,
    firstSearch, tower: w.buildings.find(b => b.id === towerId), events, elapsedMs: performance.now() - start }))
  throw error
}

})
}
