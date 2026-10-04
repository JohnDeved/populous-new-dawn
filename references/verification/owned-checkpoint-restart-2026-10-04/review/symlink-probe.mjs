import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
const commit = '7153bcc51eaf542ce5e55ecdea139078fe814ff6'
const source = execFileSync('git', ['show', `${commit}:scripts/local-render/owned-profile.mjs`], { encoding: 'utf8' })
const { profileInputReceipt } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
const root = mkdtempSync(resolve(tmpdir(), 'profile-source-symlink-'))
try {
  execFileSync('git', ['init', root], { stdio: 'pipe' }); mkdirSync(resolve(root, 'app')); mkdirSync(resolve(root, 'work'))
  writeFileSync(resolve(root, '.gitignore'), '/work/\n')
  const target = resolve(root, 'work/real-game.ts'); writeFileSync(target, 'export const speed = 1')
  symlinkSync(target, resolve(root, 'app/game.ts'))
  const before = profileInputReceipt(root); writeFileSync(target, 'export const speed = 1000'); const after = profileInputReceipt(root)
  assert.deepEqual(before, after)
  const artifact = { commit, noBrowserLaunched: true, command: 'node work/orchestration/owned-profile-review-69e3e33/symlink-probe.mjs', before, after, changedRuntimeBytesWereUnnoticed: true }
  writeFileSync('work/orchestration/owned-profile-review-69e3e33/symlink-results.json', JSON.stringify(artifact, null, 2) + '\n')
  console.log(JSON.stringify(artifact, null, 2))
} finally { rmSync(root, { recursive: true, force: true }) }
