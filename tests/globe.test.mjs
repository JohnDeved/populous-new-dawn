import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { globeMesh, globePoint, globeShade, beginGlobeDrag, stepGlobeMotion, moveGlobeStars } from '../app/globe.ts'
import fixture from './fixtures/globe.json' with { type: 'json' }

test('world-view terrain matches captured native mesh order, projection and lighting', () => {
  assert.equal(fixture.executableSha256, '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f')
  for (const { view, triangles, sha256 } of fixture.meshes) {
    const mesh = globeMesh(view).map(t => t.points.map(p => {
      const point = globePoint(view, p.x << 9, p.y << 9)
      return { ...point, ...globeShade(view, point) }
    }))
    assert.equal(mesh.length, triangles)
    assert.equal(createHash('sha256').update(JSON.stringify(mesh)).digest('hex'), sha256,
      `Native globe submission differs at ${JSON.stringify(view)}`)
  }
})


test('overview drag/release matches native snapshots and every star-parallax step', () => {
  for (const c of fixture.motion) {
    const motion = structuredClone(c.initial), offsets = Int32Array.from(c.offsets)
    const states = c.actions.map(([action, x, y]) => {
      if (action === 'press') beginGlobeDrag(motion, { ...c.view, ...motion.position }, { x, y })
      else if (action === 'release') motion.dragging = false
      else {
        const delta = stepGlobeMotion(motion, { x, y }, c.view.height)
        moveGlobeStars(offsets, delta.x, delta.y)
      }
      return structuredClone({ ...motion, offsets: [...offsets] })
    })
    assert.equal(createHash('sha256').update(JSON.stringify(states)).digest('hex'), c.sha256)
  }
})
