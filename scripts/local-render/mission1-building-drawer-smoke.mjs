// Component pixels only. Same maintained harness; one supplied detached pass.
// This does not prove the ordinary Vault journey or screen-controller lifecycle.
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

export async function drawMission1Component() {
  const [{ BuildingAcquisitionTriangleSurface }, { collectBuildingAcquisitionTriangles }, { texture }] = await Promise.all([
    import('/app/building-acquisition-drawer.ts'), import('/app/building-acquisition-triangles.ts'), import('/app/scene-assets.ts')])
  const atlas = texture('atlas'), image = atlas.image
  if (!image?.complete || !image.naturalWidth) throw Error('Current production atlas is not ready')
  const world = window.testSceneRef.current.world
  if (world.outcome.level !== 1 || !world.paused) throw Error('Publicly paused M1 component entry required')
  const observe = () => JSON.stringify({ turn: world.turn, mode: world.mode, shots: world.shots,
    camp: world.unlockedCamp, gameplay: world.randomState, cosmetic: world.cosmeticRandom })
  const before = observe(), atlasBefore = { version: atlas.version, minFilter: atlas.minFilter, magFilter: atlas.magFilter }
  const submissions = [0, 2].map((face, index) => {
    const x = 80 + index * 240
    return { face, transformed: [[0, 0, 0], [100, 0, 0], [100, 100, 0], [0, 100, 0]],
      projected: [[x, 120], [x + 160, 120], [x + 160, 280], [x, 280]], flight: 0 }
  })
  const width = 640, height = 480,
    triangles = collectBuildingAcquisitionTriangles({ whole: false, submissions }, { width, height })
  let surface, failed = false, primary
  const result = { kind: 'supplied-drawer-component', width, height, triangleCount: triangles.length,
    modes: [...new Set(triangles.map(triangle => triangle.mode))], disposed: false }
  try {
    surface = new BuildingAcquisitionTriangleSurface(atlas)
    const renderer = surface.renderer, beforeFrame = renderer.info.render.frame
    const canvas = surface.draw(triangles, width, height, 1)
    // Save the actual produced image in the result before any pixel assertion.
    result.png = canvas.toDataURL('image/png')
    result.beforeFrame = beforeFrame; result.afterFrame = renderer.info.render.frame
    const gl = renderer.getContext(), pixels = new Uint8Array(width * height * 4)
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
    result.opaque = [0, 0]; result.colored = [0, 0]
    for (let pixel = 0; pixel < width * height; pixel++) if (pixels[pixel * 4 + 3]) {
      const region = Number(pixel % width >= width / 2)
      result.opaque[region]++
      if (pixels[pixel * 4] || pixels[pixel * 4 + 1] || pixels[pixel * 4 + 2]) result.colored[region]++
    }
    result.glError = gl.getError(); result.noError = gl.NO_ERROR
    result.webglVersion = gl.getParameter(gl.VERSION)
    result.worldUnchanged = before === observe()
  } catch (error) { failed = true; primary = error; result.failure = String(error?.stack ?? error) }
  finally {
    if (surface) try { surface.dispose(); result.disposed = true }
    catch (error) { result.cleanupFailure = String(error?.stack ?? error); if (!failed) { failed = true; primary = error } }
    result.sharedAtlasUnchanged = atlas.image === image && atlas.version === atlasBefore.version &&
      atlas.minFilter === atlasBefore.minFilter && atlas.magFilter === atlasBefore.magFilter
  }
  // Return failed component evidence too; the host persists it before rejecting.
  result.failed = failed
  if (failed && result.failure === undefined) result.failure = String(primary?.stack ?? primary)
  return result
}

export default async function mission1BuildingDrawerSmoke({ page, openMission, output, receipt, signal }) {
  signal.throwIfAborted(); await openMission(1)
  if (!(await page.evaluate(() => window.testSceneRef.current.world.paused)))
    await page.getByRole('button', { name: 'Pause game', exact: true }).click()
  const result = await page.evaluate(drawMission1Component)
  if (result.png) {
    assert.match(result.png, /^data:image\/png;base64,[A-Za-z0-9+/=]+$/)
    const bytes = Buffer.from(result.png.slice('data:image/png;base64,'.length), 'base64')
    writeFileSync(resolve(output, 'm1-drawer-component.png'), bytes, { flag: 'wx' })
    result.image = { file: 'm1-drawer-component.png', sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length }
    delete result.png
  }
  writeFileSync(resolve(output, 'm1-drawer-component.json'), JSON.stringify(result, null, 2) + '\n')
  signal.throwIfAborted()
  assert.equal(result.failed, false, result.failure); assert.equal(result.disposed, true)
  assert.equal(result.sharedAtlasUnchanged, true); assert.equal(result.worldUnchanged, true)
  assert.deepEqual([...result.modes].sort(), [6, 7]); assert.ok(result.triangleCount > 0)
  assert.equal(result.afterFrame, result.beforeFrame + 1)
  assert.ok(result.opaque.every(count => count > 0) && result.colored.every(count => count > 0))
  assert.equal(result.glError, result.noError); assert.deepEqual(receipt.errors, [])
  return result
}
