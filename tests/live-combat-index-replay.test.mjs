import assert from 'node:assert/strict'
import test from 'node:test'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('..', import.meta.url))
function replay(exhaustive) {
  const args = exhaustive ? ['--import', './tests/helpers/register-live-combat-exhaustive.mjs'] : []
  const result = spawnSync(process.execPath, [...args, './tests/helpers/live-combat-replay.mjs'], {
    cwd: root, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024,
  })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}
test('indexed and exhaustive live turns preserve full state/RNG/orders/cell chains across current reloads', () => {
  const baseline = replay(true), candidate = replay(false)
  assert.deepEqual(candidate, baseline)
  assert.equal(candidate.at(-1).damaged, true)
})
