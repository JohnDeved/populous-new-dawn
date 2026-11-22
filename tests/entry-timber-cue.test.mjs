import assert from 'node:assert/strict'
import test from 'node:test'
import { createStartedWorld, retainFixtureUnits } from './level-start-fixture.mjs'
import { addBuilding, addUnit, command, tick } from '../app/model.ts'
import { dismantleBuilding } from '../app/live-building-entry.ts'

// Supplied terrain, building, brave and carried timber; actual model command,
// routing and fixed turns reach the shared entry adapter. Not earned-cargo or
// rendered/audio evidence. Cues 10 and 11 currently select identical sounds.
for (const dismantle of [false, true]) {
  test(`${dismantle ? 'dismantling' : 'training'} approach drops carried timber with native cue 11`, () => {
    const w = createStartedWorld(1)
    retainFixtureUnits(w, u => u.kind === 'shaman')
    w.terrain.fill(3)
    w.terrainVersion++
    const b = addBuilding(w, 'blue', dismantle ? 'hut' : 'camp', { x: -2, z: 32 }, true)
    if (dismantle) dismantleBuilding(w, b)
    const u = addUnit(w, 'blue', 'brave', { x: 7, z: 33 })
    u.cargo = 2.5
    const initialTrees = new Set(w.trees.map(t => t.id))
    const serial = w.soundSerial
    w.selected = [u.id]
    assert.ok(command(w, b))
    for (let turns = 0; turns < 400 && u.cargo; turns++) tick(w, 1 / 12)
    assert.equal(u.cargo, 0, 'real approach reaches the cargo-drop branch')
    const logs = w.trees.filter(t => !initialTrees.has(t.id) && t.model === 11)
    assert.equal(logs.length, 3)
    assert.ok(logs.every(t => t.logs === 1))
    const drops = w.sounds.filter(s => s.serial > serial && [10, 11].includes(s.cue))
    assert.equal(drops.length, 3)
    assert.deepEqual(drops.map(s => s.cue), [11, 11, 11])
  })
}
