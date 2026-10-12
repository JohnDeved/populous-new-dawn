import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test, { mock } from 'node:test'

if (!process.execArgv.includes('--experimental-test-module-mocks')) {
  test('ordinary Mission 6 raid uses the authored loaded origin', () => {
    const env = { ...process.env, NODE_OPTIONS: '', NODE_PATH: '' }
    delete env.NODE_TEST_CONTEXT
    const result = spawnSync(
      process.execPath,
      ['--experimental-test-module-mocks', '--test', fileURLToPath(import.meta.url)],
      { encoding: 'utf8', timeout: 60_000, maxBuffer: 1024 * 1024, env }
    )
    assert.equal(result.error, undefined)
    assert.match(result.stdout, /tests 1\b/)
    assert.equal(result.status, 0, result.stderr + result.stdout)
  })
} else {
  const actual = await import('../app/computer.ts')
  let world, observed
  mock.module(new URL('../app/computer.ts', import.meta.url), {
    cache: true,
    namedExports: {
      ...actual,
      stepAttackTask(ai, index, input) {
        const task = ai.tasks[index],
          phase = task.phase
        const actions = actual.stepAttackTask(ai, index, input)
        if (world && ai === world.campaignAIs[2] && phase === 5 && !observed) {
          observed = {
            turn: world.turn,
            base: ai.constructionBase,
            defence: ai.defencePosition,
            staging: input.staging,
            actions: structuredClone(actions),
            members: [...task.members],
          }
        }
        return actions
      },
    },
  })
  const { createWorld, tick } = await import('../app/model.ts')
  const { nativePosition } = await import('../app/world-terrain-runtime.ts')
  const { currentPersonOrder } = await import('../app/person-orders.ts')
  const { default: level } = await import('../app/level-six.ts')

  test('unmodified Mission 6 dispatches the first Chumara raid to its loaded origin', () => {
    assert.equal(
      level.sourceSha256,
      '264d69d98965465325a4b0e6ec1b1f9145d2a407e68ca9472e6a76a60a1a8a62'
    )
    const shamans = level.objects.filter(o => o.type === 1 && o.model === 7)
    assert.deepEqual(
      shamans.filter(o => o.owner === 2).map(o => [o.index, o.x, o.z]),
      [[18, -115, 39]]
    )
    assert.deepEqual(
      shamans.filter(o => o.owner === 3).map(o => [o.index, o.x, o.z]),
      [[11, -47, -123]]
    )
    world = createWorld(6)
    const cells = [2, 3].map(tribe => {
      const object = shamans.find(o => o.owner === tribe),
        p = nativePosition(world, object)
      return ((p.x >>> 8) & 254) | (p.y & 0xfe00)
    })
    assert.deepEqual(cells, [0xd094, 0x72d8])
    // No actor, task, spell, stock, terrain or clock fields are supplied.
    // The observer forwards the real controller return and all live order effects.
    for (let i = 0; i < 8000 && !observed; i++) tick(world, 1 / 12)
    assert.ok(observed, 'authored construction/training/script must produce the first raid')
    assert.equal(observed.base, undefined)
    assert.equal(observed.defence, 0xb88c)
    assert.equal(observed.staging, cells[0])
    assert.deepEqual(observed.actions, [{ kind: 'move', target: cells[0], replace: true }])
    assert.equal(observed.members.length, 4)
    for (const id of observed.members) {
      const unit = world.units.find(u => u.id === id)
      assert.ok(unit && unit.hp > 0)
      const order = currentPersonOrder(world.buildingOrders, unit.native)
      assert.deepEqual(order && { model: order.model, a: order.a, b: order.b }, {
        model: 3,
        a: ((cells[0] & 254) << 8) + 128,
        b: (cells[0] & 0xfe00) + 128,
      })
    }
  })
}
