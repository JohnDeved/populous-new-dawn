import assert from 'node:assert/strict'
import { resolve } from 'node:path'

// Executed by the reviewed sandboxed local-render harness. A real mission/UI
// establishes reachability; supporting state fixtures are labelled separately.
export default async function followerTasks({ page, output, openMission }) {
  await openMission(1)
  await page.evaluate(() => {
    window.testStore.change(world => { world.speed = 0 })
    cancelAnimationFrame(window.testSceneRef.current.frame)
  })
  await page.getByTitle('followers', { exact: true }).click()
  await page.mouse.move(900, 400)
  await page.locator('.native-hud').screenshot({ path: resolve(output, 'followers-mission1.png') })
  const state = await page.evaluate(() => {
    const scene = window.testSceneRef.current, gl = scene.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info')
    return { turn: scene.world.turn, renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), units: scene.world.units.filter(u => u.team === 'blue').map(u => ({ id: u.id, kind: u.kind, nativeState: u.native?.state, entryState: u.entry?.person.state, commandStatus: u.native?.commandStatus })) }
  })
  assert.equal(await page.locator('.follower-tasks button').count(), 24, 'Followers tab exposes the four original task rows')
  return state
}
