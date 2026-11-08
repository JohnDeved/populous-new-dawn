import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('the trailer byte splitter preserves content and refuses wrong inputs/existing outputs', () => {
  execFileSync('python3', ['-B', fileURLToPath(new URL('./split-coming-soon.test.py', import.meta.url)), '-v'], {
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
    stdio: 'pipe',
    timeout: 30000,
  })
})
