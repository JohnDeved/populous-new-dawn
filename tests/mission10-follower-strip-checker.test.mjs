// This validates the public-input witness's assertions, not browser/game behavior.
import test from 'node:test'
import assert from 'node:assert/strict'
import { checkMission10FollowerStrip } from '../scripts/local-render/mission10-boat-checkpoint.mjs'

const party = [63, 111, 112, 113, 114]
function fixture(occupied, fault) {
  const calls = [], observations = []
  const live = {
    paused: false, turn: 500, selected: [...party], orders: { next: 3 }, randomState: 19,
    boat: { id: 62, passengers: occupied ? [...party] : [] },
    party: party.map(id => ({ id, hp: 100, vehicle: occupied ? 62 : 0 })),
  }
  return {
    live, calls, observations,
    page: {
      keyboard: { press: async key => {
        assert.equal(key, 'Escape'); calls.push(['key', key]); live.selected = []
      } },
      getByRole: (role, options) => {
        assert.equal(role, 'button'); assert.equal(options.exact, true)
        assert.ok(['Select warrior', 'Select follower'].includes(options.name))
        return { click: async ({ modifiers }) => {
          calls.push(['click', options.name, modifiers]); assert.equal(live.paused, true)
          live.selected = occupied && fault !== 'no-propagation' || !occupied && options.name === 'Select follower' && modifiers[0] === 'Control'
            ? [...party] : modifiers.length ? party.slice(1) : [111]
          if (fault === 'orders') live.orders.next++
        } }
      },
    },
    input: {
      action: async (_label, run) => run(),
      pause: async () => { calls.push(['pause']); live.paused = true },
      resume: async () => { calls.push(['resume']); live.paused = false },
    },
    state: async label => { observations.push(label); return structuredClone(live) },
  }
}

test('M10 witness Escape-clears before every mounted class/Total modifier case and restores pause', async () => {
  for (const phase of ['boarded', 'loaded', 'unloaded']) {
    const occupied = phase !== 'unloaded', f = fixture(occupied)
    await checkMission10FollowerStrip({ ...f, phase, occupied })
    assert.equal(f.live.paused, false)
    assert.deepEqual(f.calls, [
      ['pause'],
      ...['Select warrior', 'Select follower'].flatMap(name => [[], ['Control'], ['Shift']]
        .flatMap(modifiers => [['key', 'Escape'], ['click', name, modifiers]])),
      ['resume'],
    ])
  }
})

test('M10 witness fails when the boarded Shaman is omitted or selection changes orders', async () => {
  for (const [fault, expected] of [['no-propagation', /all five occupants/], ['orders', /preserves commands/]]) {
    const f = fixture(true, fault)
    await assert.rejects(checkMission10FollowerStrip({ ...f, phase: 'boarded', occupied: true }), expected)
  }
})

test('M10 witness requires real occupancy and leaves an already paused scenario paused', async () => {
  const missing = fixture(false)
  await assert.rejects(checkMission10FollowerStrip({ ...missing, phase: 'boarded', occupied: true }))
  const f = fixture(true); f.live.paused = true
  await checkMission10FollowerStrip({ ...f, phase: 'loaded', occupied: true })
  assert.equal(f.live.paused, true)
  assert.ok(f.calls.every(call => call[0] !== 'pause' && call[0] !== 'resume'))
})
