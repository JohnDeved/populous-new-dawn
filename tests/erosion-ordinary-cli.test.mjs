import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

test('real named-scenario CLI import reaches the missing-plan guard before browser/server setup', () => {
  const root = fileURLToPath(new URL('../', import.meta.url)), dir = mkdtempSync(resolve(tmpdir(), 'erosion-cli-import-'))
  const output = resolve(dir, 'must-not-be-created'), env = { ...process.env }
  delete env.POPULOUS_EROSION_LAUNCH_PLAN
  try {
    const result = spawnSync(process.execPath, ['scripts/local-render/harness.mjs', '--game-root', root,
      '--scenario', resolve(root, 'qa/erosion-ordinary/scenario.mjs'), '--output', output,
      '--browser', resolve(dir, 'nonexistent-browser')], { cwd: root, env, encoding: 'utf8', timeout: 10000 })
    assert.equal(result.error, undefined)
    assert.equal(result.status, 1, `expected the explicit plan guard, received: ${result.stderr}`)
    assert.match(result.stderr, /Set POPULOUS_EROSION_LAUNCH_PLAN to the exact reviewed launch plan/)
    assert.doesNotMatch(result.stderr, /unsettled top-level await/)
    assert.equal(existsSync(output), false, 'scenario admission must precede server/browser/output setup')
  } finally { rmSync(dir, { recursive: true, force: true }) }
})
