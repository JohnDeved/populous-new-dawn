import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import { prepareSpellChargePause } from '../scripts/local-render/ordinary-spy-sabotage.mjs'

function fixture(t) {
  const original = globalThis.window
  t.after(() => { if (original === undefined) delete globalThis.window; else globalThis.window = original })
  const world = { manaWorld: { playerTribe: 0, spells: [{ available: 1 << 20, disabled: 0 }] }, manaTribes: [{}] }
  globalThis.window = { testStore: { getWorld: () => world } }
  const attributes = { 'aria-label': 'Bloodlust, 0 shots', 'aria-disabled': 'true' }
  const element = { tagName: 'BUTTON', isConnected: true, disabled: false,
    title: 'Bloodlust · Right-click to pause or resume charging',
    getAttribute: name => attributes[name],
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 80, height: 60 }),
    ownerDocument: { elementFromPoint(x, y) { assert.deepEqual([x, y], [50, 50]); return { closest: () => element } } } }
  const spell = { name: 'Bloodlust', model: 20 }
  return { world, element, attributes, read: () => prepareSpellChargePause(element, spell) }
}

test('zero-stock cast-disabled permanent spell still has a verified charge-control point', t => {
  const f = fixture(t), before = structuredClone(f.world), prepared = f.read()
  assert.equal(prepared.castDisabled, 'true'); assert.deepEqual(prepared.point, { x: 50, y: 50 })
  assert.equal(prepared.bit, 1 << 19); assert.deepEqual(f.world, before)
})

test('charge eligibility follows actual spell owner while the toggle belongs to the player', t => {
  const f = fixture(t)
  f.world.manaTribes[0].spellOwner = 1
  f.world.manaWorld.spells.push({ available: 1 << 20, disabled: 1 << 19 })
  f.world.manaWorld.spells[0].available = 0
  assert.deepEqual([f.read().player, f.read().owner, f.read().disabled], [0, 1, 0])
})

test('charge point rejects undiscovered, gifted-only, already-paused and covered controls', t => {
  const f = fixture(t)
  f.attributes['aria-label'] = 'Undiscovered spell'
  assert.throws(f.read, /discovered permanent/)
  f.attributes['aria-label'] = 'Bloodlust, 0 shots'; f.world.manaWorld.spells[0].available = 0
  assert.throws(f.read, /discovered permanent/)
  f.world.manaWorld.spells[0].available = 1 << 20; f.world.manaWorld.spells[0].disabled = 1 << 19
  assert.throws(f.read, /already paused/)
  f.world.manaWorld.spells[0].disabled = 0; f.element.disabled = true
  assert.throws(f.read, /discovered permanent/)
  f.element.disabled = false; f.element.ownerDocument.elementFromPoint = () => null
  assert.throws(f.read, /does not own/)
})

test('maintained context-menu handler toggles a discovered permanent zero-stock spell only', t => {
  const f = fixture(t), source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  const start = source.indexOf('className="spell-card"')
  const match = source.slice(start).match(/onContextMenu=\{(e => \{[\s\S]*?\n\s+\})\}/)
  assert.ok(start >= 0 && match, 'Inspect the maintained spell-card context-menu handler')
  for (const [undiscovered, permanent, expected] of [[false, true, 1 << 19], [true, true, 0], [false, false, 0]]) {
    f.world.manaWorld.spells[0].disabled = 0
    const handler = vm.runInNewContext(`(${match[1]})`, { undiscovered, permanent, player: 0,
      s: { id: 'bloodlust', model: 20 }, store: { change: action => action(f.world) } })
    let prevented = false
    handler({ preventDefault() { prevented = true } })
    assert.equal(prevented, true)
    assert.equal(f.world.manaWorld.spells[0].disabled, expected)
  }
})
