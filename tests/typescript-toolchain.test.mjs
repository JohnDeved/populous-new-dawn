import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const root = fileURLToPath(new URL('../', import.meta.url))
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'))

test('pinned native checking and JavaScript API have explicit, distinct entrypoints', () => {
  const manifest = readJson('package.json')
  const lock = readJson('package-lock.json')
  assert.equal(manifest.devDependencies['@typescript/native'], 'npm:typescript@7.0.2')
  assert.equal(manifest.devDependencies.typescript, '5.9.3')
  assert.equal(manifest.scripts.typecheck, 'node node_modules/@typescript/native/bin/tsc --noEmit --checkers 1')
  assert.equal(manifest.scripts['typecheck:legacy'], 'node node_modules/typescript/bin/tsc --noEmit')
  assert.equal(manifest.scripts.check, 'pnpm run typecheck && pnpm test && pnpm run parity:check && pnpm run orchestration:check')
  for (const [path, name, version, bin] of [
    ['@typescript/native', 'typescript', '7.0.2', ['tsc']],
    ['typescript', 'typescript', '5.9.3', ['tsc', 'tsserver']],
  ]) {
    const installed = readJson(`node_modules/${path}/package.json`)
    const locked = lock.packages[`node_modules/${path}`]
    assert.equal(installed.name, name)
    assert.equal(installed.version, version)
    assert.equal(locked.name ?? path, name)
    assert.equal(locked.version, version)
    assert.deepEqual(Object.keys(installed.bin), bin)
  }
  assert.equal(ts.version, '5.9.3')
})

test('scene-fixture expression evaluation survives compiler directive changes', () => {
  // Existing scene fixtures evaluate transpiled expressions this way. A compiler
  // upgrade that prepends a directive changes the returned value and must fail.
  const expression = ts.transpileModule('(function(){return () => 42})', {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  const factory = new Function(`return ${expression}`)()
  assert.equal(typeof factory, 'function')
  assert.equal(factory()(), 42)
})
