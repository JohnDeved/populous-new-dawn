import assert from 'node:assert/strict'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { createWorld } from '../app/world-initialization.ts'
import { stepComputerTasks } from '../app/computer-runtime.ts'

test(
  'deferred veto Set preserves entire world against exact parent across construction calls',
  { skip: !process.env.PND_CONSTRUCTION_BASELINE },
  async () => {
    const root = process.env.PND_CONSTRUCTION_BASELINE
    const old = await import(pathToFileURL(`${root}/app/computer-runtime.ts`).href)
    const init = await import(pathToFileURL(`${root}/app/world-initialization.ts`).href)
    for (const condition of ['authored', 'blocked', 'invalid-shape']) {
      const a = init.createWorld(6),
        b = createWorld(6)
      for (const w of [a, b]) {
        for (const task of w.ai.tasks) task.flags = 0
        Object.assign(w.ai.tasks[0], {
          flags: 1,
          type: 0,
          phase: 2,
          requested: 1,
          target: 0x8080,
          elapsed: 0,
          remaining: 2000,
          mode: 1,
          fallback: condition === 'invalid-shape' ? 4 : 0,
          members: [],
        })
        w.ai.cursor = 0
        w.turn = 1
        if (condition === 'blocked') w.land.flags.fill(0x10000)
      }
      for (let call = 0; call < 3; call++) {
        let ae, be
        try {
          old.stepComputerTasks(a, a.activeCampaignTribe)
        } catch (e) {
          ae = [e.name, e.message]
        }
        try {
          stepComputerTasks(b, b.activeCampaignTribe)
        } catch (e) {
          be = [e.name, e.message]
        }
        if (condition === 'invalid-shape') assert.equal(ae?.[0], 'RangeError')
        assert.deepEqual(be, ae, `${condition} exception ${call}`)
        assert.deepEqual(b, a, `${condition} entire world ${call}`)
      }
    }
  }
)
