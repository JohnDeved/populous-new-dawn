// Controlled actual Scene/input/clock fixture shared by manual and automatic camp tests.
// Construction is public model input; DOM, projection and frame deltas are supplied.
import assert from 'node:assert/strict'
import { tooltipCallerFixture } from './tooltip-scene.mjs'

const nop = () => {}

async function buildEmptyCamp({ api, world, frame }) {
  const before = new Set(world.buildings.map(building => building.id))
  api.select(world, 'brave')
  assert.ok(world.selected.length)
  assert.ok(api.placeBuilding(world, 'camp', { x: -99, z: -105 }))
  const camp = world.buildings.find(
    building => !before.has(building.id) && building.kind === 'camp'
  )
  assert.ok(camp, 'actual placement creates the model7 plan')
  const complete = () =>
    camp.progress === 1 &&
    !(camp.builders ?? []).some(Boolean) &&
    !world.units.some(unit => unit.work === camp.id || unit.inside === camp.id)
  for (let visits = 0; visits < 20000 && !complete(); visits++) frame(1 / 12)
  assert.ok(complete(), `completed construction owners must depart at turn ${world.turn}`)
  assert.equal(camp.admission?.inside ?? 0, 0)
  assert.equal(camp.admission?.queueHead ?? 0, 0)
  assert.equal(camp.admission?.entering ?? 0, 0)
  assert.equal((camp.admission?.activity ?? 0) & 128, 0)
  return camp
}

function supplyPanelDom(t, scene) {
  const doc = document,
    oldCreate = doc.createElement,
    oldStyle = Object.getOwnPropertyDescriptor(globalThis, 'getComputedStyle')
  doc.createElement = tag => {
    const element = {
      tag,
      children: [],
      hidden: false,
      style: {},
      dataset: {},
      attributes: {},
      classList: { add: nop, toggle: nop },
      appendChild(child) {
        this.children.push(child)
        return child
      },
      addEventListener: nop,
      setAttribute(name, value) {
        this.attributes[name] = value
      },
      matches: () => false,
      contains: () => false,
      remove() {
        this.removed = true
      },
      get firstElementChild() {
        return this.children[0]
      },
      get lastElementChild() {
        return this.children.at(-1)
      },
      getContext: () => ({ drawImage: nop, fillRect: nop }),
    }
    return element
  }
  scene.container.appendChild = nop
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    value: () => ({ getPropertyValue: () => '1' }),
  })
  t.after(() => {
    if (oldCreate) doc.createElement = oldCreate
    else delete doc.createElement
    if (oldStyle) Object.defineProperty(globalThis, 'getComputedStyle', oldStyle)
    else delete globalThis.getComputedStyle
  })
}

export async function campPanelFixture(t) {
  const fixture = await tooltipCallerFixture(t, { level: 2, prepareTarget: buildEmptyCamp }),
    { renderBuildingPanels } = await import('../../app/building-panels.ts')
  supplyPanelDom(t, fixture.scene)
  const paint = () => renderBuildingPanels(fixture.scene, { complete: true, naturalWidth: 2048 })
  return { ...fixture, camp: fixture.hut, paint }
}
