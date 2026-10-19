import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { sha } from './io.mjs'
// Serialized into the browser. This is a read-only precondition, not a camera setter.
export function assertInitialFocus({ focus, selected }) {
  window.__bodyVerifyStart()
  const scene = window.testSceneRef?.current,
    world = window.testStore?.getWorld()
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  if (!scene || scene !== window.__bodyLatchedScene || scene.world !== world)
    throw Error('Initial focus scene/world identity mismatch')
  if (!equal(world.selected, selected) || !equal(selected, [54]))
    throw Error('Initial focus selection mismatch')
  const shaman = world.units.find(u => u.id === 54)
  if (
    !shaman ||
    shaman.kind !== 'shaman' ||
    shaman.team !== 'blue' ||
    shaman.x !== focus.x ||
    shaman.z !== focus.z ||
    focus.id !== 54
  )
    throw Error('Initial authored Shaman mismatch')
  const expected = {
    x: Math.round((focus.x + 8) * 256) & 65535,
    y: Math.round((-focus.z - 8) * 256) & 65535,
    angle: 0,
  }
  if (
    !equal(scene.cameraPosition, expected) ||
    !equal(scene.viewPoint, { x: focus.x, z: focus.z }) ||
    scene.cameraBearing !== 0 ||
    scene.cameraMotion.active !== 0
  )
    throw Error('Initial focus camera/motion mismatch')
  if (
    world.turn !== 70 ||
    world.paused !== true ||
    world.inputMask !== 0 ||
    scene.previous !== null ||
    scene.frame !== 0 ||
    window.__bodyStartCalls !== 1
  )
    throw Error('Initial focus startup state mismatch')
  return {
    camera: { ...scene.cameraPosition },
    viewPoint: { ...scene.viewPoint },
    bearing: scene.cameraBearing,
    motion: scene.cameraMotion.active,
    selected: [...world.selected],
  }
}
export async function loadSetup(base) {
  const path = resolve(base, 'scripts/browser-performance/snapshot-setup.mjs'),
    source = readFileSync(path, 'utf8')
  assert.equal(sha(source), '4bb9b653f0116a8d40bad6c61465eb6fba79a7cfa295c27dacabd7a02e1f000d')
  const boundary = '    await bindGame(page)\n    await page.evaluate(() => {'
  assert.equal(source.split(boundary).length, 2)
  let transformed = source.replace(
    boundary,
    '    await bindGame(page)\n    await page.evaluate(() => window.__bodyVerifyStart())\n    await page.evaluate(() => {'
  )
  const focusBoundary =
    '    await page.keyboard.press(snapshotAuthoring.focusKey)\n    await page.waitForFunction(() => !window.testSceneRef.current.cameraMotion.active)'
  assert.equal(transformed.split(focusBoundary).length, 2, 'Exactly one redundant focus boundary')
  transformed = transformed.replace(
    focusBoundary,
    `    receipt.initialFocus = await page.evaluate((${assertInitialFocus.toString()}), {focus: fixture.receipt.focus, selected: fixture.receipt.loadedSelected})`
  )
  // Preserve canvas.focus, public drags/right-click and every original admission check.
  const linked = transformed.replace(
    /from '(\.\.?\/[^']+)'/g,
    (_, relative) => `from '${pathToFileURL(resolve(dirname(path), relative)).href}'`
  )
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(linked).toString('base64')}`
  )
  return {
    loadSnapshot: module.loadSnapshot,
    binding: {
      originalSha256: sha(source),
      transformedSha256: sha(transformed),
      linkedSha256: sha(linked),
    },
  }
}
