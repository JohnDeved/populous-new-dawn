import assert from 'node:assert/strict'
import test from 'node:test'
import { browserPosition, command, createWorld, select, tick } from '../app/model.ts'
import { currentPersonOrder } from '../app/person-orders.ts'
import { vaultWorkEligible } from '../app/vault.ts'
import { vaultAtPersonCell, vaultPoints } from '../app/vault-geometry.ts'
import { finishLevelStart } from './level-start-fixture.mjs'

function orderedWorld() {
  const world = finishLevelStart(createWorld(3))
  const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
  const vault = world.shrines.find(shrine => shrine.kind === 'vault')
  select(world, 'shaman')
  assert.equal(command(world, vault), true)
  tick(world, 1 / 12)
  return { world, shaman, vault }
}

// Explicitly supplied positions/owner mutations isolate admission; ordinary movement
// and work accumulation are separately required by vault-approach-caller.test.mjs.
function suppliedAt(source, point) {
  const world = structuredClone(source.world)
  const shaman = world.units.find(unit => unit.id === source.shaman.id)
  const vault = world.shrines.find(shrine => shrine.id === source.vault.id)
  Object.assign(shaman.native, point)
  Object.assign(shaman, browserPosition(point))
  return { world, shaman, vault, person: shaman.native }
}

test('Vault geometry preserves all four source headings and uint16 map seams', () => {
  for (const [heading, outside, leave] of [
    [0, { x: 256, y: 64768 }, { x: 256, y: 63744 }],
    [512, { x: 64768, y: 256 }, { x: 63744, y: 256 }],
    [1024, { x: 256, y: 1280 }, { x: 256, y: 2304 }],
    [1536, { x: 1280, y: 256 }, { x: 2304, y: 256 }],
  ])
    for (const model of [152, 153, 154, 155])
      assert.deepEqual(
        vaultPoints({ x: -7, z: -9, angle: heading * Math.PI / 1024, model }),
        { inside: { x: 256, y: 256 }, outside, leave }
      )
})

test('supplied admission uses occupied Vault cells OR the linked outside coarse cell', () => {
  const source = orderedWorld()
  for (const [point, expected] of [
    [{ x: 58112, y: 30976 }, true], // Exact original outside point, four world units away.
    [{ x: 58312, y: 31176 }, true], // Same outside cell, not an exact slot or radius.
    [{ x: 58112, y: 32000 }, true], // Occupied inner cell, the other admission branch.
    [{ x: 58368, y: 30976 }, false], // Next coarse cell, not a model-18 footprint cell.
  ]) {
    const { world, shaman, vault } = suppliedAt(source, point)
    const before = structuredClone(world)
    assert.equal(vaultWorkEligible(world, shaman, vault), expected, JSON.stringify(point))
    assert.deepEqual(world, before, 'admission must not write navigation, route, task or RNG state')
  }
  const { world, shaman, vault, person } = suppliedAt(source, { x: 66304 & 65535, y: 32000 })
  const other = { ...vault, id: world.nextId++, x: vault.x + 32 }
  world.shrines.push(other)
  assert.equal(vaultAtPersonCell(world, person)?.id, other.id)
  assert.equal(vaultWorkEligible(world, shaman, vault), true, 'native occupancy need not name the sampled Vault')

  // A registered non-Vault owner wins an explicitly supplied overlapping cell.
  const index = (person.y >>> 9) * 128 + (person.x >>> 9)
  world.land.flags[index] |= 512
  world.land.buildingIds[index] = world.buildings[0].id
  assert.equal(vaultAtPersonCell(world, person), undefined)
  assert.equal(vaultWorkEligible(world, shaman, vault), false)
})

test('supplied stale, interrupted, cancelled or unregistered native owners cannot earn Vault work', () => {
  const source = orderedWorld()
  const changes = [
    ['airborne', ({ shaman }) => { shaman.lift = 1 }],
    ['flight owner', ({ shaman, person }) => { shaman.flight = { ...person } }],
    ['combat owner', ({ shaman }) => { shaman.fight = { action: 'approach' } }],
    ['casting', ({ shaman }) => { shaman.casting = { spell: 'blast', point: shaman, remaining: 1 } }],
    ['dead', ({ shaman }) => { shaman.hp = 0 }],
    ['route recovery', ({ person }) => { person.state = 33 }],
    ['other native command', ({ person }) => { person.commandStatus = 3 }],
    ['cancelled order', ({ world, person }) => { currentPersonOrder(world.buildingOrders, person).flags |= 1 }],
    ['replaced order', ({ world, person }) => { currentPersonOrder(world.buildingOrders, person).model = 3 }],
    ['stale target', ({ person }) => { person.workTarget = 0 }],
    ['removed task binding', ({ shaman }) => { shaman.vault = null }],
    ['unregistered native object', ({ world, person }) => { world.objectCells.objects.set(person.id, { ...person }) }],
  ]
  for (const [label, change] of changes) {
    const fixture = suppliedAt(source, { x: 58112, y: 30976 })
    assert.equal(vaultWorkEligible(fixture.world, fixture.shaman, fixture.vault), true)
    change(fixture)
    assert.equal(vaultWorkEligible(fixture.world, fixture.shaman, fixture.vault), false, label)
  }
})
