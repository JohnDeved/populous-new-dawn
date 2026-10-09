// Controlled caller fixture: real M3 acquisition/construction commands and fixed
// turns, with the existing supplied DOM/projection/texture and frame boundaries.
// This is not an ordinary browser or native Temple presentation witness.
import assert from 'node:assert/strict'
import { tooltipCallerFixture } from './tooltip-scene.mjs'
import { supplyPanelDom } from './camp-panel-scene.mjs'

async function buildEmptyTemple({ api, world, frame }) {
  const until = (label, condition) => {
    for (let turns = 0; turns < 12000 && !condition(); turns++) frame(1 / 12)
    assert.ok(condition(), `${label} must finish through actual turns: ${world.turn}`)
  }
  api.select(world, 'shaman')
  assert.equal(
    api.command(
      world,
      world.shrines.find(shrine => shrine.kind === 'vault')
    ),
    true
  )
  until('Temple knowledge acquisition', () => world.unlockedTemple)
  assert.equal(api.command(world, { x: 35, z: 81 }), true)
  api.select(world, 'brave')
  assert.equal(api.placeBuilding(world, 'temple', { x: 24, z: 70 }), true)
  const temple = world.buildings.findLast(b => b.kind === 'temple' && b.team === 'blue')
  assert.ok(temple)
  until(
    'Empty completed Temple',
    () =>
      temple.progress === 1 &&
      !(temple.builders ?? []).some(Boolean) &&
      !world.units.some(unit => unit.work === temple.id || unit.inside === temple.id)
  )
  assert.equal(temple.admission.class, 2)
  assert.equal(temple.admission.model, 5)
  assert.equal(temple.admission.activity & 0x80, 0)
  assert.equal(world.stats.trained, 0)
  return temple
}

export async function templePanelFixture(t) {
  const fixture = await tooltipCallerFixture(t, { level: 3, prepareTarget: buildEmptyTemple }),
    { renderBuildingPanels } = await import('../../app/building-panels.ts')
  supplyPanelDom(t, fixture.scene)
  const paint = () => renderBuildingPanels(fixture.scene, { complete: true, naturalWidth: 2048 })
  return { ...fixture, temple: fixture.hut, paint }
}
