// Reuse the exact existing real-constructor IO seam without copying its framework.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { sha } from './io.mjs'
const root = new URL('../../', import.meta.url)
test('actual constructor is already focused, but animated zero-distance focus requires a callback', () => {
  const original = new URL('tests/ordinary-numeric-constructor.test.mjs', root)
  let source = readFileSync(original, 'utf8')
  assert.equal(sha(source), '15bcceda64837944cdad99a041a4288d676839aeb275d8b51ab82e0117ebfc6f')
  const end = '  const base = await make(BaselineScene),'
  assert.equal(source.split(end).length, 2)
  source = source.slice(0, source.indexOf(end))
  source = source
    .replaceAll('import.meta.url', JSON.stringify(original.href))
    .replace("import.meta.resolve('three')", JSON.stringify(import.meta.resolve('three')))
    .replace("from 'three'", `from ${JSON.stringify(import.meta.resolve('three'))}`)
    .replace(
      /import\('(\.\.\/[^']+)'\)/g,
      (_, path) => `import(${JSON.stringify(new URL(path, original).href)})`
    )
  const before =
    '    const world = store.getWorld(),\n      binding = store.bindPresentation(world)'
  assert.equal(source.split(before).length, 2)
  source = source.replace(
    before,
    `    const world = store.getWorld()
    const {advanceGame} = await import(${JSON.stringify(new URL('app/game-clock.ts', root).href)})
    const {migrateCheckpoint} = await import(${JSON.stringify(new URL('app/game-store.ts', root).href)})
    const {skipIntroduction} = await import(${JSON.stringify(new URL('app/scene-camera-runtime.ts', root).href)})
    const clock={animationTime:0,animationFrame:0}
    for(let frame=0;frame<140;frame++) advanceGame(world,clock,1/24)
    skipIntroduction({world,flybyCamera:{x:0,y:0,angle:0,zoom:0},onChange(){}})
    Object.assign(world,migrateCheckpoint(migrateCheckpoint(structuredClone(world))))
    world.paused=true
    const binding=store.bindPresentation(world)`
  )
  source += `
  const scene=await make(GameScene)
  assert.equal(scene.world.turn,70)
  assert.deepEqual(scene.world.selected,[54])
  assert.deepEqual(scene.viewPoint,{x:-107,z:-101})
  assert.deepEqual(scene.cameraPosition,{x:40192,y:23808,angle:0})
  assert.equal(scene.cameraBearing,0)
  assert.equal(scene.cameraMotion.active,0)
  const before=structuredClone(scene.cameraPosition)
  scene.focus(scene.world.units.find(u=>u.id===54),{animate:true})
  assert.deepEqual(scene.cameraPosition,before)
  assert.equal(scene.cameraMotion.active,1)
  assert.deepEqual(scene.cameraMotion.source,scene.cameraMotion.target)
})\n`
  const path = join(mkdtempSync(join(tmpdir(), 'body-focus-constructor-')), 'proof.test.mjs')
  writeFileSync(path, source)
  const env = { ...process.env, PND_NUMERIC_BASELINE_SCENE: '', PND_TERRAIN_BASELINE: '' }
  delete env.NODE_TEST_CONTEXT
  const output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', path], {
    stdio: 'pipe',
    timeout: 30000,
    env,
    encoding: 'utf8',
  })
  assert.match(output, /# pass 1/)
  assert.match(output, /# fail 0/)
  assert.match(output, /# skipped 0/)
})
