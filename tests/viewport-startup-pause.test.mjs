import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

// Execute the actual synchronous scene-start effect prefix, not a duplicate
// policy function. Browser evidence separately exercises scene loading/rendering.
const source = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const start = source.indexOf("    if (startup !== 'playing') return\n")
const end = source.indexOf("    import('./scene')", start)
assert.ok(start >= 0 && end > start, 'Locate the real scene-start effect before its asynchronous import')
const prefix = source.slice(start, end)
const emitted = ts.transpileModule(`function sceneStartPrefix() { ${prefix} } sceneStartPrefix();`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText

test('scene startup preserves existing pause ownership at narrow and wide viewports', () => {
  for (const width of [320, 640, 899, 900, 1280]) for (const paused of [false, true]) {
    const world = { paused }, changes = []
    runInNewContext(emitted, { startup: 'playing', window: { innerWidth: width }, world,
      store: { getWorld: () => world, change: callback => { changes.push(callback); callback(world) } } })
    assert.equal(world.paused, paused, `width ${width} must preserve existing pause ${paused}`)
    assert.equal(changes.length, 0, 'Viewport width cannot create or release a simulation pause')
  }
})

test('non-playing startup still returns before scene setup without changing pause', () => {
  const world = { paused: true }
  runInNewContext(emitted, { startup: 'choice', world,
    store: { change: () => assert.fail('Non-playing startup must not change the World') } })
  assert.equal(world.paused, true)
})
