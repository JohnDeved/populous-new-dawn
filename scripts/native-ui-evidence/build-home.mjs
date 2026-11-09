import { resolve } from 'node:path'
import { candidateDependency, fullSha, git, homeBuildOptions } from './identity.mjs'
import assert from 'node:assert/strict'
const [candidateRoot, output, revision] = process.argv.slice(2)
assert.equal(candidateRoot, resolve(candidateRoot))
assert.equal(git(candidateRoot, 'rev-parse', 'HEAD'), fullSha(revision))
const { build } = await import(candidateDependency(candidateRoot, 'vite'))
const { default: react } = await import(candidateDependency(candidateRoot, '@vitejs/plugin-react'))
const { default: tailwindcss } = await import(candidateDependency(candidateRoot, '@tailwindcss/postcss'))
await build(homeBuildOptions(candidateRoot, resolve(output), revision, { react, tailwindcss }))
