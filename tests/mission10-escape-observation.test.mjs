import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const source = readFileSync(new URL('../scripts/local-render/mission10-boat-checkpoint.mjs', import.meta.url), 'utf8')
const body = source.slice(source.indexOf('export async function clearMission10Selection'), source.indexOf('// Executed only after'))
const clear = new Function('assert', body.replace('export ', '') + '\nreturn clearMission10Selection')(assert)

function fixture(fault) {
  const world = { selected: [63], mode: null, paused: true, status: 'playing' }
  const events = [], window = { testStore: { getWorld: () => world }, testSceneRef: { current: { world } } }
  if (fault === 'wrong-world') window.testSceneRef.current.world = { ...world }
  if (fault === 'running') world.paused = false
  const evaluate = callback => {
    events.push('observe')
    return structuredClone(runInNewContext(`(${callback.toString()})(owner)`, { window, owner: world, document: { querySelectorAll: () => [] } }))
  }
  const page = {
    evaluateHandle: async () => ({ evaluate, dispose: async () => events.push('dispose') }),
    getByRole: () => ({ isVisible: async () => { events.push('menu'); return false } }),
    keyboard: { press: async key => {
      assert.equal(key, 'Escape'); events.push('input'); world.selected = []
      if (fault === 'replacement-after-input') window.testSceneRef.current.world = { ...world }
    } },
  }
  const previous = { selected: fault === 'stale-selection' ? [64] : [63], selectionState: { mode: fault === 'stale-mode' ? 'cast' : null } }
  return { page, previous, events }
}

test('Escape batches only adjacent pre-input ownership and selection observations', async () => {
  const f = fixture()
  await clear(f.page, f.previous)
  assert.deepEqual(f.events, ['observe', 'input', 'observe', 'dispose'])
})
for (const fault of ['wrong-world', 'running', 'stale-selection', 'stale-mode']) {
  test(`Escape rejects ${fault} before trusted input and still disposes its World`, async () => {
    const f = fixture(fault)
    await assert.rejects(clear(f.page, f.previous), /Escape must (retain the exact paused Mission 10 World|act on the immediately observed selection and mode)/)
    assert.equal(f.events.includes('input'), false)
    assert.equal(f.events.at(-1), 'dispose')
  })
}
test('Escape still rejects replacement immediately after trusted input', async () => {
  const f = fixture('replacement-after-input')
  await assert.rejects(clear(f.page, f.previous), /Escape must retain the exact paused Mission 10 World/)
  assert.deepEqual(f.events, ['observe', 'input', 'observe', 'dispose'])
})
