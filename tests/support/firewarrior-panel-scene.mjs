// Supplied completed model8 building on Mission2 land; not an earned M8 hut.
// Actual geometry picking, pointer command, entry and training remain production
// callers. DOM/projection/texture IO and fixed frame deltas are supplied.
import assert from 'node:assert/strict'
import { tooltipCallerFixture } from './tooltip-scene.mjs'
import { supplyPanelDom } from './camp-panel-scene.mjs'

export async function firewarriorPanelFixture(t) {
  const fixture = await tooltipCallerFixture(t, {
    level: 2,
    async prepareTarget({ api, world }) {
      const { buildingAdmission } = await import('../../app/live-building-entry.ts')
      const hut = api.addBuilding(world, 'blue', 'firewarriorHut', { x: -99, z: -105 }, true)
      const admission = buildingAdmission(world, hut)
      assert.equal(admission.class, 2)
      assert.equal(admission.model, 8)
      assert.equal(admission.activity & 0x80, 0)
      return hut
    },
  })
  const { renderBuildingPanels } = await import('../../app/building-panels.ts')
  supplyPanelDom(t, fixture.scene)
  const paint = () => renderBuildingPanels(fixture.scene, { complete: true, naturalWidth: 2048 })
  return { ...fixture, school: fixture.hut, paint }
}
