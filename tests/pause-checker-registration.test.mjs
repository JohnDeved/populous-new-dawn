import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('canonical native UI checker validation binds the pause oracle, locators and differential fixtures', () => {
  const manifest = JSON.parse(readFileSync(new URL('../engineering/checks.json', import.meta.url)))
  const check = manifest.checks.find(item => item.id === 'native-ui-evidence-tests')
  assert.equal(check.executable, 'node')
  assert.equal(check.args[0], '--test')
  const tests = ['tests/pause-world-snapshot.test.mjs', 'tests/pause-clearance-batch.test.mjs', 'tests/pause-checker-registration.test.mjs', 'tests/pause-focus-observation.test.mjs', 'tests/pause-keyboard-traversal.test.mjs', 'tests/checkpoint-scrollbar.test.mjs', 'tests/checkpoint-body-clearance.test.mjs', 'tests/fullscreen-clearance.test.mjs']
  for (const path of tests) assert.ok(check.args.includes(path), `Canonical check must execute ${path}`)
  for (const path of ['scripts/local-render/original-pause-checkpoint-style.mjs', 'scripts/local-render/fullscreen-clearance.mjs',
    'scripts/local-render/pause-world-snapshot.mjs', 'scripts/browser-new-game.mjs', 'scripts/browser-space-ownership.mjs', 'scripts/browser-world-input.mjs', 'scripts/local-render/checkpoint-body-clearance.mjs', 'scripts/local-render/checkpoint-observer.mjs', 'scripts/local-render/original-pause-checkpoint-recovery.mjs', 'scripts/local-render/pause-focus-observation.mjs', 'scripts/local-render/pause-held-escape.mjs', 'scripts/local-render/checkpoint-scrollbar-observation.mjs', 'references/checkpoint-scrollbar-art.json',
    ...[451, 452, 453, 454, 455].map(id => `public/original/help/hfx-${id}.png`), ...tests, 'tests/fixtures/fullscreen-clearance-before-batch.mjs', 'engineering/checks.json']) {
    assert.ok(check.inputs.includes(path), `Input must be fingerprinted: ${path}`)
    assert.ok(check.triggerPaths.includes(path), `Change must trigger the narrow check: ${path}`)
  }
  const repository = manifest.checks.find(item => item.id === 'repository-check')
  assert.ok(repository.inputs.includes('scripts') && repository.inputs.includes('tests'))
})
