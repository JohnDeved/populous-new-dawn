// Issue #1056: native ordinary-tooltip owner retention across a no-handler visit
// (decomp/research/tooltip-owner-no-handler.md). In the native dispatcher 004af340 a visit
// with no object and no valid cell calls no helper, so the object owner word 0098db48
// keeps its value and cleanup 0044b090 does not reset category/key/dwell. Re-entering
// the same object therefore continues its retained dwell and has no second first
// display (0044d0c0 only calls 00508fe0 at dwell == threshold). Crossing a blank cell
// or another object changes category/key, so the next visit re-acquires.
import assert from 'node:assert/strict'
import test from 'node:test'
import { loadSceneFixture } from './support/bloodlust-scene.mjs'

test('a no-handler visit keeps the object owner; only another owner re-acquires the object', async () => {
  const api = await loadSceneFixture(),
    controller = await import('../app/tooltip-controller.ts'),
    { createTooltip, worldTooltipObject } = await import('../app/tooltips.ts'),
    world = api.createWorld(1),
    hut = world.buildings.find(building => building.team === 'blue' && building.kind === 'hut'),
    object = worldTooltipObject(world, hut.id),
    state = createTooltip(),
    owner = controller.createTooltipController(state, controller.createTooltipSession())
  assert.ok(object?.id, 'authored Mission 1 Blue Hut tooltip object')
  // One ordinary visit per call; the HUD/message words stay zero as in the sky case.
  const visit = route => {
    state.draw = 0
    let first = false
    if (route === 'object') first = controller.visitObjectTooltip(owner, state, object)
    else if (route === 'cell') controller.visitBlankCellTooltip(owner, state, 0x1203)
    controller.finishOrdinaryTooltip(owner, state)
    return first
  }
  const dwellToFirstDisplay = () => {
    let displays = 0
    for (let n = 0; n < 40; n++) displays += visit('object')
    return displays
  }

  assert.equal(dwellToFirstDisplay(), 1, 'named acquisition reaches exactly one first display')
  const retained = { category: owner.category, key: owner.key, dwell: owner.dwell }
  for (let n = 0; n < 5; n++) visit('no-handler')
  assert.equal(owner.owners.object, hut.id, 'no helper ran, so the object owner is retained')
  assert.deepEqual(
    { category: owner.category, key: owner.key, dwell: owner.dwell },
    retained,
    'cleanup does not reset while an owner word is nonzero'
  )
  assert.equal(dwellToFirstDisplay(), 0, 'same-object re-entry has no new first display')

  visit('cell')
  assert.equal(owner.category, 'cell', 'a blank cell is an actual alternate owner')
  assert.equal(owner.owners.object, hut.id, 'the cell helper does not clear the object word')
  assert.equal(dwellToFirstDisplay(), 1, 'crossing a blank cell re-acquires the same object')
})
