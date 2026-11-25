import assert from 'node:assert/strict'
import test from 'node:test'
import { cast, createWorld, tick } from '../app/model.ts'
import { objectsInCell } from '../app/object-cells.ts'
import { rightClickSpellCharging } from '../app/spell-charging.ts'
import { SPELLS } from '../app/world-rules.ts'

test('ordinary earned M16 Shield admits six Braves and excludes its co-centered Shaman', () => {
  const w = createWorld(16)
  const step = () => tick(w, 1 / 12)
  const to = (ready, deadline) => {
    while (!ready() && w.turn < deadline && w.status === 'playing') step()
    assert.ok(ready(), `not reached by turn ${deadline}`)
  }
  const aim = { x: 31, z: -27 }
  const spell = SPELLS.find(spell => spell.id === 'shield')
  const allied = w.units.filter(u => u.team === 'blue')
  const shaman = allied.find(u => u.kind === 'shaman')
  const braves = allied.filter(u => u.kind === 'brave')
  assert.deepEqual(braves.map(u => u.id), [112, 113, 114, 115, 116, 117])
  assert.equal(shaman.id, 220)
  assert.equal(w.shots.shield, 0)
  assert.ok(rightClickSpellCharging(w, spell, { ctrlKey: true, shiftKey: false }))
  to(() => w.shots.shield === 1, 1792)
  assert.equal(w.turn, 1792)
  assert.equal(shaman.x, aim.x)
  assert.equal(shaman.z, aim.z)
  const p = shaman.native
  assert.deepEqual([p.class, p.tribe, p.model, p.flags4 & 0x4800, p.flags3 & 0x8000], [1, 0, 7, 0, 0])
  const centerCell = ((p.x >>> 8) & 254) | (p.y & 0xfe00)
  assert.ok(Array.from(objectsInCell(w.objectCells, centerCell)).includes(p))
  assert.ok(allied.every(u => !u.shield))
  assert.ok(cast(w, 'shield', aim))
  assert.equal(w.shots.shield, 0)
  const projectile = w.projectiles.find(projectile => projectile.spell === 'shield')
  assert.ok(projectile)
  to(() => !w.projectiles.includes(projectile), 1799)
  assert.equal(w.turn, 1799)
  assert.equal(shaman.shield ?? 0, 0, 'model 7 is not an eligible Shield recipient')
  assert.equal(shaman.native.flags3 & 0x8000, 0)
  assert.deepEqual(
    braves.map(u => [u.id, u.shield, u.native.flags3 & 0x8000]),
    braves.map(u => [u.id, 1440, 0x8000])
  )
})
