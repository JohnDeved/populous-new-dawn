import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorld, addBuilding } from '../app/model.ts'
import { completeBuildingConstruction } from '../app/live-construction-runtime.ts'
import { breedingWork } from '../app/world-state.ts'
import { short } from '../app/native-math.ts'
import { ensureBuildingDamage } from '../app/building-damage.ts'

for (const kind of ['hut', 'temple']) {
  for (const reason of ['new', 'upgrade', 'repair']) {
    test(`${kind} ${reason} completion retains bookkeeping without replacing status feedback`, () => {
      const w = createWorld(),
        b = addBuilding(w, 'blue', kind, { x: 0, z: 0 }, true)
      b.timer = 321
      b.upgrading = reason === 'upgrade'
      if (reason === 'repair') ensureBuildingDamage(b)
      w.message = 'Existing compatibility notice'
      w.messageUntil = 12345
      const built = w.stats.built,
        random = w.randomState,
        timer = kind === 'hut' ? short(breedingWork(w, b) - 54) : b.timer
      completeBuildingConstruction(w, b)
      assert.equal(w.stats.built, built + (reason === 'new' ? 1 : 0))
      assert.equal(b.upgrading, false)
      assert.equal(b.timer, timer)
      assert.equal(w.randomState, random)
      assert.equal(w.message, 'Existing compatibility notice')
      assert.equal(w.messageUntil, 12345)
    })
  }
}
