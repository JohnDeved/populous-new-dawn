import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'
import tseslint from 'typescript-eslint'

const root = fileURLToPath(new URL('../', import.meta.url))
const readJson = path => JSON.parse(readFileSync(join(root, path), 'utf8'))
const native = join(root, 'node_modules/@typescript/native/bin/tsc')
const legacy = join(root, 'node_modules/typescript/bin/tsc')

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
  for (const [entrypoint, version] of [[native, '7.0.2'], [legacy, '5.9.3']]) {
    const result = spawnSync(process.execPath, [entrypoint, '--version'], { cwd: root, encoding: 'utf8' })
    assert.equal(result.error, undefined)
    assert.equal(result.signal, null)
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout.trim(), `Version ${version}`)
  }
})

test('retained JavaScript compiler preserves AST, transpile and ESLint parser APIs', async () => {
  const source = `import { type Missing } from './type-only.ts'
    import { unused } from './unused.ts'
    export default class Fixture {
      declare absent: number
      value: number
      constructor(readonly count: number) {}
    }`
  const ast = ts.createSourceFile('fixture.ts', source, ts.ScriptTarget.ES2022, true)
  assert.deepEqual(ast.parseDiagnostics, [])
  assert.equal(ast.statements.filter(ts.isImportDeclaration).length, 2)
  assert.equal(ast.statements.filter(ts.isClassDeclaration).length, 1)
  const emitted = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  })
  assert.deepEqual(emitted.diagnostics, [])
  assert.ok(!emitted.outputText.includes('type-only.ts'))
  assert.ok(!emitted.outputText.includes('unused.ts'))
  const { default: Fixture } = await import(`data:text/javascript;base64,${Buffer.from(emitted.outputText).toString('base64')}`)
  const instance = new Fixture(7)
  assert.equal(instance.count, 7)
  assert.equal(Object.hasOwn(instance, 'value'), true)
  assert.equal(Object.hasOwn(instance, 'absent'), false)
  // Existing scene fixtures evaluate transpiled expressions this way. A compiler
  // upgrade that prepends a directive changes the returned value and must fail.
  const expression = ts.transpileModule('(function(){return () => 42})', {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText
  const factory = new Function(`return ${expression}`)()
  assert.equal(typeof factory, 'function')
  assert.equal(factory()(), 42)
  const parsed = tseslint.parser.parseForESLint('export const answer: number = 42', {
    filePath: 'fixture.ts', sourceType: 'module',
  })
  assert.equal(parsed.ast.body[0].declaration.declarations[0].id.typeAnnotation.typeAnnotation.type, 'TSNumberKeyword')
})

test('native checker reports real type errors without emitting JavaScript', t => {
  const directory = mkdtempSync(join(tmpdir(), 'pnd-typescript-toolchain-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  writeFileSync(join(directory, 'tsconfig.json'), JSON.stringify({
    compilerOptions: { strict: true, noEmit: true, target: 'ES2022', module: 'esnext', types: [] },
    files: ['fixture.ts'],
  }))
  const check = () => spawnSync(process.execPath, [native, '--project', join(directory, 'tsconfig.json'),
    '--checkers', '1', '--pretty', 'false'], { cwd: directory, encoding: 'utf8' })
  writeFileSync(join(directory, 'fixture.ts'), 'export const answer: number = 42\n')
  const valid = check()
  assert.equal(valid.error, undefined)
  assert.equal(valid.status, 0, valid.stdout + valid.stderr)
  writeFileSync(join(directory, 'fixture.ts'), 'export const answer: number = "wrong"\n')
  const invalid = check()
  assert.equal(invalid.error, undefined)
  assert.equal(invalid.signal, null)
  assert.equal(invalid.status, 1, invalid.stdout + invalid.stderr)
  assert.match(invalid.stdout, /error TS2322:/)
  assert.deepEqual(readdirSync(directory).sort(), ['fixture.ts', 'tsconfig.json'])
})
