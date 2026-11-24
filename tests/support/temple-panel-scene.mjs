// Controlled caller fixture: real M3 acquisition/construction commands and fixed
// turns, with the existing supplied DOM/projection/texture and frame boundaries.
// This is not an ordinary browser or native Temple presentation witness.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { messageBoxRequested, showMessageBox } from '../../app/campaign-message-modal.ts'
import { removeMessage } from '../../app/messages.ts'
import { tooltipCallerFixture } from './tooltip-scene.mjs'
import { supplyPanelDom } from './camp-panel-scene.mjs'

// This Node fixture does not mount Home. Invoke the exact Dismiss button arrow
// at the real presentation request, not a fabricated event/cleared flag.
// Other callers keep the old opening loop and all gameplay proceeds normally.
function readPageDismiss() {
  const source = ts.createSourceFile(
    'page.tsx',
    readFileSync(new URL('../../app/page.tsx', import.meta.url), 'utf8'),
    ts.ScriptTarget.Latest,
    true
  )
  const handlers = []
  const visit = node => {
    if (ts.isJsxOpeningElement(node) && node.tagName.getText(source) === 'button') {
      const attribute = name => node.attributes.properties.find(
        prop => ts.isJsxAttribute(prop) && prop.name.getText(source) === name
      )?.initializer
      const label = attribute('aria-label'), click = attribute('onClick')
      if (label && ts.isStringLiteral(label) && label.text === 'Dismiss campaign message') {
        assert.ok(
          click && ts.isJsxExpression(click) && click.expression && ts.isArrowFunction(click.expression)
        )
        handlers.push(click.expression.getText(source))
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.equal(handlers.length, 1, 'One actual Page campaign Dismiss handler required')
  return Function('store', 'world', 'slot', 'message', 'removeMessage', 'update', `return (${handlers[0]})`)
}

export function templeOpeningPresentation(runDismiss = readPageDismiss()) {
  let dismissed = false
  return {
    visit({ world, scene }) {
      if (dismissed) return
      if (!messageBoxRequested(world.messages)) return
      assert.ok(scene.world === world, 'Keep the same Scene/World owner')
      assert.equal(world.outcome.level, 3)
      assert.ok(world.turn > 0 && world.turn < 16, 'Real briefing request must precede authored flyby')
      assert.equal(world.flyby.flags & 1, 0)
      assert.equal(world.inputMask, 0)
      const requests = world.messages.slots.flatMap((message, slot) =>
        message && message.flags & 2 ? [{ message, slot }] : []
      )
      assert.equal(requests.length, 1)
      const [{ message, slot }] = requests
      assert.deepEqual([message.serial, message.stringId, world.messages.nextSerial], [0, 648, 1])
      const turn = world.turn, priorSlots = [...world.messages.slots], box = { open: false }
      showMessageBox([box], box)
      assert.equal(box.open, true)
      let updates = 0
      // Match the live button's owner/slot parameters. React is absent here;
      // no simulated turn occurs between presenting and dismissing this box.
      const dismiss = runDismiss({ getWorld: () => scene.world }, world, slot, message, removeMessage, () => updates++)
      dismiss()
      assert.equal(updates, 1)
      assert.ok(scene.world === world, 'Keep the same Scene/World owner')
      assert.equal(world.turn, turn)
      assert.equal(world.messages.nextSerial, 1)
      priorSlots[slot] = null
      assert.deepEqual(world.messages.slots, priorSlots)
      assert.equal(messageBoxRequested(world.messages), false)
      dismissed = true
    },
    finish(world) {
      assert.ok(dismissed, 'The restored Mission 3 briefing must be dismissed before the Temple journey')
      assert.equal(messageBoxRequested(world.messages), false, 'No pending request at Temple journey admission')
    },
  }
}

async function buildEmptyTemple({ api, world, scene, frame }) {
  // Supply the required existing M3 art resource at the same fixture boundary
  // as texture IO. Its material phase is not this panel ownership proof.
  const { createSharedAniblResource } = await import('../../app/shared-anibl.ts'),
    resource = createSharedAniblResource()
  resource.transition({ bank: 'p', modelAtlas: 'atlas-p' })
  scene.presentationBinding = {
    isCurrent: () => scene.world === world,
    snapshot: resource.snapshot,
    advance: resource.advance,
    release() {},
  }
  scene.templeResourceSnapshot = resource.snapshot()
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

export async function templePanelFixture(t, capacityMode = 'classic') {
  const opening = templeOpeningPresentation(),
    fixture = await tooltipCallerFixture(t, { level: 3, openingFrame: opening.visit,
      prepareTarget: setup => { opening.finish(setup.world); return buildEmptyTemple(setup) }, capacityMode }),
    { renderBuildingPanels } = await import('../../app/building-panels.ts')
  supplyPanelDom(t, fixture.scene)
  const paint = () => renderBuildingPanels(fixture.scene, { complete: true, naturalWidth: 2048 })
  return { ...fixture, temple: fixture.hut, paint }
}
