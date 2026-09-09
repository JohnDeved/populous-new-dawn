import assert from 'node:assert/strict'
import test from 'node:test'
import { cameraPreset, cameraMatrix, polygonMeshBounds, projectPoint } from '../app/projection.ts'
import { widenGroundBounds } from '../app/viewport-bounds.ts'

test('horizontal viewport expansion preserves native depth and safe projection arithmetic', () => {
  for (const index of [0, 1, 2, 3])
    for (const preset of [0, 3]) {
      const config = cameraPreset(index, preset)
      assert.deepEqual(
        widenGroundBounds(config, config.width, config.height, [0, 424]),
        config.bounds
      )
      for (const width of [1920, 3440, 3840, 7680])
        for (const heights of [
          [0, 63],
          [0, 424],
          [-128, 2048],
        ]) {
          const bounds = widenGroundBounds(config, width, 2160, heights)
          for (let i = 0; i < 8; i++) {
            if (i % 2) assert.equal(bounds[i], config.bounds[i])
            else assert.ok(Math.abs(bounds[i]) >= Math.abs(config.bounds[i]))
          }
          if (JSON.stringify(bounds) === JSON.stringify(config.bounds)) continue
          for (const heading of [0, 1, 255, 256, 257, 511, 512, 768, 1024, 1536, 2047]) {
            const projection = {
              ...config,
              matrix: cameraMatrix(heading, config.pitch),
              width,
              height: 2160,
              centerX: width / 2,
              centerY: 1080,
              fractionX: 4,
              fractionY: 4,
              pixelScaleX: 0.0625,
              pixelScaleY: 0.0625,
            }
            const sample = { x: 128, y: heights[0], z: -256, flags: 0x100 }
            const reused = { x: 1, y: 2, z: 3, screenX: 4, screenY: 5, flags: -1 }
            assert.equal(projectPoint(sample, projection, false, reused), reused)
            assert.deepEqual(reused, projectPoint(sample, projection, false))
            const rows = polygonMeshBounds(bounds, heading)
            for (let row = 0; row < rows.length; row++) {
              const [start, end] = rows[row]
              if (!start || start === end) continue
              for (const column of [start, end])
                for (const h of heights)
                  for (const offset of [-256, 256]) {
                    const p = projectPoint(
                      { x: (column - 110) * 256 + offset, y: h, z: (row - 111) * 256 + offset },
                      projection
                    )
                    assert.ok(
                      4 * (p.x * p.x + p.z * p.z) <= 0x7fffffff,
                      `radius overflow: ${index}/${preset}/${width}/${heading}/${row}`
                    )
                    assert.ok(
                      Math.abs(p.x * config.scale) <= 0x7fffffff,
                      `scale overflow: ${index}/${preset}/${width}/${heading}/${row}`
                    )
                  }
            }
          }
        }
    }
  const bird = cameraPreset(3, 2)
  assert.deepEqual(widenGroundBounds(bird, 3840, 2160, [0, 424]), bird.bounds)
})
