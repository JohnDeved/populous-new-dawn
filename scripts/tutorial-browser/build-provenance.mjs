import { execFileSync } from 'node:child_process'

// Same checkout identity as the shipped Vite build; never label a dirty tree clean.
export function buildRevision(root) {
  const git = (...args) => execFileSync('git', args, {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
  const revision = git('rev-parse', 'HEAD')
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Expected a full Git revision')
  return revision + (git('status', '--porcelain') ? '-dirty' : '')
}
